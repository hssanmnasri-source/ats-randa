"""
keejob_parser.py
Parseur de CVs Keejob (texte PDF → dict structuré).

Basé sur l'analyse de vrais CVs Keejob.com exportés en PDF.
Structure réelle observée (layout 2 colonnes mergé par pdfplumber) :

  TITRE DU POSTE                              ← ligne 1 (pleine largeur)
  Prénom Nom    Étude: Bac + 5               ← col-gauche + col-droite fusionnées
                Expérience: 16 années, 2 mois
  X ans         Situation professionnelle: ...
  Adresse       Disponibilité: ...
  CP Ville Tunisie  Permis de conduire: oui
  +216 XXXXXXX  ID Keejob: NNNN
  email@domain.com

Utilise uniquement : re, datetime
"""

import re
from datetime import datetime
from typing import Optional


# ══════════════════════════════════════════════════════════════════════════════
# CONSTANTES
# ══════════════════════════════════════════════════════════════════════════════

MONTHS_FR = {
    "janvier": "01",  "jan": "01",
    "février": "02",  "fevrier": "02", "fév": "02", "fev": "02",
    "mars": "03",
    "avril": "04",    "avr": "04",
    "mai": "05",
    "juin": "06",
    "juillet": "07",  "juil": "07",
    "août": "08",     "aout": "08",   "aoû": "08",
    "septembre": "09","sep": "09",    "sept": "09",
    "octobre": "10",  "oct": "10",
    "novembre": "11", "nov": "11",
    "décembre": "12", "decembre": "12","déc": "12", "dec": "12",
}

# Pattern des noms de mois (pour regex)
_MONTH_PAT = (
    r"Janvier|Février|Fevrier|Mars|Avril|Mai|Juin|Juillet|Août|Aout"
    r"|Septembre|Octobre|Novembre|Décembre|Decembre"
    r"|Jan|Fév|Fev|Avr|Juil|Aoû|Aou|Sep|Sept|Oct|Nov|Déc|Dec"
)

# Types de contrats reconnus dans les CVs Keejob
_CONTRACT_PAT = (
    r"CDI|CDD|SIVP|Stage(?:/PFE)?|Freelance|Consultant"
    r"|Ind[ée]pendant|Int[ée]rim|Alternance|B[ée]n[ée]volat"
)

# Types de formations reconnus
_FORMATION_TYPE_PAT = (
    r"Universitaire|Formation\s+professionnelle|Formation"
    r"|Professionnel\w*|Brevet"
)

# Niveaux d'études Keejob → valeur interne
_ETUDE_MAP: dict[str, str] = {
    "primaire":                    "Primaire",
    "secondaire":                  "Secondaire",
    "bac":                         "BAC",
    "bac + 2": "BAC+2", "bac +2": "BAC+2", "bac+2": "BAC+2",
    "bac + 3": "BAC+3", "bac +3": "BAC+3", "bac+3": "BAC+3",
    "bac + 4": "BAC+4", "bac +4": "BAC+4", "bac+4": "BAC+4",
    "bac + 5": "BAC+5", "bac +5": "BAC+5", "bac+5": "BAC+5",
    "formations professionnelles": "BAC",
    "formation professionnelle":   "BAC",
    "doctorat":                    "Doctorat",
}

# Niveaux de compétence → SkillLevel enum
_SKILL_MAP: dict[str, str] = {
    "débutant": "BEGINNER",    "debutant": "BEGINNER",   "notions": "BEGINNER",
    "intermédiaire": "INTERMEDIATE", "intermediaire": "INTERMEDIATE",
    "avancé": "EXPERT",        "avance": "EXPERT",
    "expert": "EXPERT",        "courant": "EXPERT",
    "bilingue": "EXPERT",      "maternelle": "EXPERT",
    "langue maternelle": "EXPERT",
    "bien": "INTERMEDIATE",    "moyen": "BEGINNER",
}


# ══════════════════════════════════════════════════════════════════════════════
# UTILITAIRES
# ══════════════════════════════════════════════════════════════════════════════

def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def _normalize_date(raw: str) -> Optional[str]:
    """
    Convertit une date textuelle → 'AAAA-MM' ou 'AAAA'.
    'Aujourd'hui' / 'Présent' / 'En cours' → None (poste actuel).
    Gère aussi les formats 'Mois/AAAA' (Keejob formattage).
    """
    if not raw:
        return None
    s = raw.strip().lower()

    # Mots signifiant "présent"
    if re.search(r"aujourd[''h]|en\s*cours|actuel|pr[ée]sent|maintenant|current", s):
        return None

    # Format "Mois/AAAA" ou "Mois AAAA"
    m = re.match(r"([a-záàâäéèêëîïôöùûü]+)(?:/|\s+)(\d{4})", s)
    if m:
        month_key = m.group(1)[:4]
        # Cherche dans le dict par préfixe
        month = next((v for k, v in MONTHS_FR.items() if s.startswith(k)), None)
        if month:
            return f"{m.group(2)}-{month}"

    # Année seule
    m = re.match(r"^(\d{4})$", s.strip())
    if m:
        return m.group(1)

    return raw.strip()


def _parse_duration(s: str) -> Optional[float]:
    """
    '11 années, 9 mois' → 11.75
    '3 mois'            → 0.25
    '18 années'         → 18.0
    """
    if not s:
        return None
    sl = s.lower()
    years = 0
    months = 0

    m = re.search(r"(\d+)\s*an(?:s|n[ée]e?s?)?", sl)
    if m:
        years = int(m.group(1))

    m = re.search(r"(\d+)\s*mois", sl)
    if m:
        months = int(m.group(1))

    total = round(years + months / 12, 2)
    return total if total > 0 else None


def _map_etude(s: str) -> str:
    return _ETUDE_MAP.get((s or "").strip().lower(), (s or "").strip() or "BAC")


def _map_skill(s: str) -> str:
    return _SKILL_MAP.get((s or "").strip().lower(), "INTERMEDIATE")


# ══════════════════════════════════════════════════════════════════════════════
# DÉCOUPAGE EN SECTIONS
# ══════════════════════════════════════════════════════════════════════════════

# Marqueurs de sections Keejob (ordre = priorité)
_SECTION_PATTERNS: list[tuple[str, str]] = [
    (r"POINTS?\s+FORTS?(?:/R[ÉE]SUM[ÉE])?|R[ÉE]SUM[ÉE]",                   "resume"),
    (r"EXP[ÉE]RIENCES?\s+PROFESSIONNELLES?",                                  "experiences"),
    (r"DIPL[ÔO]MES?\s+ET\s+FORMATIONS?|FORMATIONS?\s+ET\s+DIPL[ÔO]MES?",     "formations"),
    (r"COMP[ÉE]TENCES?",                                                       "competences"),
    (r"LANGUES?",                                                              "langues"),
    (r"CENTRES?\s+D[''']INT[ÉE]R[ÊE]TS?|LOISIRS?|INT[ÉE]R[ÊE]TS?",         "interets"),
    (r"LETTRE\s+DE\s+MOTIVATION",                                             "_stop"),
]


def _split_sections(text: str) -> dict[str, str]:
    """Découpe le texte en dict {'header': ..., 'resume': ..., ...}."""
    found: list[tuple[int, int, str]] = []

    for pattern, key in _SECTION_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE):
            # Éviter les doublons (même position ± 10 chars)
            if not any(abs(m.start() - s) < 10 for s, _, _ in found):
                found.append((m.start(), m.end(), key))

    found.sort(key=lambda x: x[0])

    # Tronquer à "_stop" (LETTRE DE MOTIVATION)
    stop_idx = next((i for i, (_, _, k) in enumerate(found) if k == "_stop"), None)
    if stop_idx is not None:
        found = found[:stop_idx]

    result: dict[str, str] = {}
    if not found:
        result["header"] = text
        return result

    result["header"] = text[: found[0][0]].strip()
    for i, (start, end, key) in enumerate(found):
        next_start = found[i + 1][0] if i + 1 < len(found) else len(text)
        result[key] = text[end:next_start].strip()

    return result


# ══════════════════════════════════════════════════════════════════════════════
# PARSEUR HEADER
# ══════════════════════════════════════════════════════════════════════════════

def _parse_header(header: str) -> dict:
    """
    Extrait les champs de l'en-tête Keejob.

    Layout réel (2 colonnes fusionnées) :
      Prénom Nom    Étude: Bac + 5
                    Expérience: X années
      X ans         Situation: En poste
      Adresse       Disponibilité: Immédiate
      CP Ville Tun  Permis: oui
      +216 XXX      ID Keejob: NNNN
      email@...
    """
    data: dict = {}

    # ── Champs étiquetés (col droite) ─────────────────────────────────────

    # Étude
    m = re.search(r"[ÉE]tude\s*:\s*(.+?)(?=\s+Exp[ée]|\s+Situation|\s+Disponibilit|\s+Permis|\s+Salaire|\s+ID\s+K|\n|$)",
                  header, re.IGNORECASE)
    data["niveau_etude"] = _map_etude(m.group(1).strip()) if m else None

    # Expérience totale
    m = re.search(r"Exp[ée]rience\s*:\s*(.+?)(?=\s+Situation|\s+Disponibilit|\s+Permis|\s+Salaire|\s+ID\s+K|\n|$)",
                  header, re.IGNORECASE)
    data["experience_annees"] = _parse_duration(m.group(1).strip()) if m else None

    # Situation professionnelle
    m = re.search(r"Situation\s+professionnelle\s*:\s*(.+?)(?=\s+Disponibilit|\s+Permis|\s+Salaire|\s+ID\s+K|\n|$)",
                  header, re.IGNORECASE)
    data["situation_pro"] = _clean(m.group(1)) if m else None

    # Disponibilité
    m = re.search(r"Disponibilit[ée]\s*:\s*(.+?)(?=\s+Permis|\s+Salaire|\s+ID\s+K|\n|$)",
                  header, re.IGNORECASE)
    data["disponibilite"] = _clean(m.group(1)) if m else None

    # Permis de conduire
    m = re.search(r"Permis\s+de\s+conduire\s*:\s*(\w+)", header, re.IGNORECASE)
    data["permis_conduire"] = m.group(1).lower().startswith("o") if m else None

    # Salaire souhaité
    m = re.search(r"Salaire[^:\n]*:\s*([\d\s,]+)", header, re.IGNORECASE)
    if m:
        try:
            data["salaire_souhaite"] = int(re.sub(r"[\s,]", "", m.group(1)))
        except ValueError:
            data["salaire_souhaite"] = None
    else:
        data["salaire_souhaite"] = None

    # ID Keejob
    m = re.search(r"ID\s+Keejob\s*:\s*(\d+)", header, re.IGNORECASE)
    data["id_keejob"] = m.group(1) if m else None

    # ── Champs col gauche ─────────────────────────────────────────────────

    # Email
    m = re.search(r"[\w.+\-]+@[\w.\-]+\.[a-zA-Z]{2,}", header)
    data["email"] = m.group(0).lower() if m else None

    # Téléphone (format tunisien +216 ou 8 chiffres)
    m = re.search(r"(\+216|00216)[\s\d]{8,14}", header)
    if m:
        data["telephone"] = re.sub(r"\s", "", m.group(0))
    else:
        m = re.search(r"\b([2-9]\d)\s*\d{3}\s*\d{3}\b", header)
        data["telephone"] = re.sub(r"\s", "", m.group(0)) if m else None

    # Âge
    m = re.search(r"\b(\d{2})\s*ans?\b", header, re.IGNORECASE)
    data["age"] = int(m.group(1)) if m else None

    # Ville — pattern "CP Ville Tunisie" ou "Ville Tunisie"
    m = re.search(r"(?:\d{4}\s+)?([A-ZÀ-Ÿa-zà-ÿ][A-Za-zÀ-Ÿà-ÿ\s\-]+?)\s+Tunisie", header)
    if m:
        ville_raw = m.group(1).strip()
        # Ignorer si c'est un seul mot très court (probablement pas une ville)
        if len(ville_raw) > 2:
            data["ville"] = _clean(ville_raw)
            # Chercher le code postal pour l'adresse complète
            m_cp = re.search(r"(\d{4})\s+" + re.escape(ville_raw), header)
            if m_cp:
                data["adresse"] = f"{m_cp.group(1)} {ville_raw}, Tunisie"
            else:
                data["adresse"] = f"{ville_raw}, Tunisie"
        else:
            data["ville"] = None
            data["adresse"] = None
    else:
        data["ville"] = None
        data["adresse"] = None

    # ── Nom / Prénom ───────────────────────────────────────────────────────
    # Le nom est le texte qui précède "Étude:" sur la même ligne
    # Ex: "Helmi Chaffai Étude: Bac + 5" → "Helmi Chaffai"
    m_nom = re.search(r"^(.+?)\s+[ÉE]tude\s*:", header, re.IGNORECASE | re.MULTILINE)
    if m_nom:
        name_raw = _clean(m_nom.group(1))
        words = name_raw.split()
        if len(words) >= 2:
            data["prenom"] = words[0]
            data["nom"]    = " ".join(words[1:])
        elif words:
            data["nom"]    = words[0]
            data["prenom"] = None
        else:
            data["nom"] = data["prenom"] = None
    else:
        data["nom"] = data["prenom"] = None

    # ── Titre du poste ────────────────────────────────────────────────────
    # Les lignes AVANT la ligne contenant "Étude:" (et qui ne sont pas l'adresse ou le tel)
    _header_kw = re.compile(
        r"[ÉE]tude|Exp[ée]rience|Situation|Disponibilit|Permis|Salaire"
        r"|Keejob|\+216|00216|@|Tunisie|\d{4}",
        re.IGNORECASE,
    )
    titre_lines = []
    for line in header.split("\n"):
        line = line.strip()
        if not line:
            continue
        if _header_kw.search(line):
            break  # On a atteint la zone des champs structurés
        # Ignorer si c'est le nom (même texte)
        if data.get("nom") and data["nom"].lower() in line.lower():
            continue
        if data.get("prenom") and data["prenom"].lower() in line.lower():
            continue
        titre_lines.append(line)

    data["titre_poste"] = " ".join(titre_lines).strip() or None

    return data


# ══════════════════════════════════════════════════════════════════════════════
# PARSEUR EXPÉRIENCES
# ══════════════════════════════════════════════════════════════════════════════

_CONTRACT_RE = re.compile(r"\b(" + _CONTRACT_PAT + r")\b", re.IGNORECASE)
_DATE_WORD_RE = re.compile(
    r"(?:" + _MONTH_PAT + r")[a-záàâäéèêëîïôöùûü]*(?:/|\s+)\d{4}",
    re.IGNORECASE,
)
# Regex complète pour une plage de dates
# Capture: (date_debut) (date_fin_or_today) (durée) (reste = éventuellement entreprise)
_DATE_RANGE_RE = re.compile(
    r"((?:" + _MONTH_PAT + r")[a-záàâäéèêëîïôöùûü]*(?:/|\s+)\d{4})"
    r"\s*(?:[-–]\s*(Aujourd[''h]?\w*|(?:" + _MONTH_PAT + r")[a-záàâäéèêëîïôöùûü]*(?:/|\s+)\d{4}|\d{4}))?"
    r"\s*(?:\(([^)]+)\))?"
    r"\s*(.*)",
    re.IGNORECASE,
)


def _parse_experiences(text: str) -> list[dict]:
    """
    Extrait les expériences professionnelles.

    Structure Keejob observée :
      Poste CDI
      Mois AAAA - Mois AAAA (X années, Y mois)
      Entreprise | secteur | Ville, Tunisie      ← parfois sur la ligne des dates
      Description libre...
    """
    if not text:
        return []

    lines = [ln.strip() for ln in text.split("\n")]
    n = len(lines)

    # ── Identifier les débuts d'expérience ────────────────────────────────
    # Un début = ligne avec type de contrat OU ligne dont la suivante est une date
    exp_starts: list[int] = []
    for i, line in enumerate(lines):
        if not line:
            continue
        if _CONTRACT_RE.search(line):
            exp_starts.append(i)
            continue
        # Sans type de contrat : chercher si la prochaine ligne non-vide est une date
        if not _DATE_WORD_RE.search(line):
            j = i + 1
            while j < n and not lines[j]:
                j += 1
            if j < n and _DATE_RANGE_RE.match(lines[j]):
                # La ligne courante doit ressembler à un poste (pas trop longue, sans ponctuation de phrase)
                if len(line) < 100 and not re.search(r"[.;!?]$", line):
                    exp_starts.append(i)

    exp_starts = sorted(set(exp_starts))
    if not exp_starts:
        return []

    experiences: list[dict] = []

    for k, start in enumerate(exp_starts):
        end = exp_starts[k + 1] if k + 1 < len(exp_starts) else n
        # Lignes du bloc (sans vides)
        block = [l for l in lines[start:end] if l]
        if not block:
            continue

        exp: dict = {
            "poste":        None,
            "type_contrat": None,
            "entreprise":   None,
            "secteur":      None,
            "ville":        None,
            "date_debut":   None,
            "date_fin":     None,
            "duree":        None,
            "description":  None,
        }

        # ── Ligne 0 : poste [+ type contrat] ──────────────────────────────
        m = _CONTRACT_RE.search(block[0])
        if m:
            exp["poste"]        = _clean(block[0][: m.start()])
            exp["type_contrat"] = m.group(1)
        else:
            exp["poste"] = _clean(block[0])

        j = 1  # index dans block

        # ── Ligne suivante : dates ─────────────────────────────────────────
        if j < len(block):
            m_date = _DATE_RANGE_RE.match(block[j])
            if m_date:
                exp["date_debut"] = _normalize_date(m_date.group(1))
                exp["date_fin"]   = _normalize_date(m_date.group(2)) if m_date.group(2) else None
                exp["duree"]      = _clean(m_date.group(3)) if m_date.group(3) else None
                remainder         = _clean(m_date.group(4) or "")

                # L'entreprise peut être sur la même ligne que les dates
                if "|" in remainder:
                    parts = [p.strip() for p in remainder.split("|")]
                    exp["entreprise"] = parts[0]
                    exp["secteur"]    = parts[1] if len(parts) > 1 else None
                    if len(parts) > 2:
                        exp["ville"] = re.sub(r",?\s*Tunisie$", "", parts[2], flags=re.IGNORECASE).strip()
                j += 1

        # ── Ligne suivante : entreprise (si pas encore trouvée) ────────────
        if not exp["entreprise"] and j < len(block):
            line = block[j]
            if "|" in line and not _DATE_WORD_RE.search(line):
                parts = [p.strip() for p in line.split("|")]
                exp["entreprise"] = parts[0]
                exp["secteur"]    = parts[1] if len(parts) > 1 else None
                if len(parts) > 2:
                    exp["ville"] = re.sub(r",?\s*Tunisie$", "", parts[2], flags=re.IGNORECASE).strip()
                j += 1
            elif not _DATE_WORD_RE.search(line) and not _CONTRACT_RE.search(line):
                exp["entreprise"] = _clean(line)
                j += 1

        # ── Le reste : description ─────────────────────────────────────────
        if j < len(block):
            exp["description"] = " ".join(block[j:])

        if exp["poste"] or exp["entreprise"]:
            experiences.append(exp)

    return experiences


# ══════════════════════════════════════════════════════════════════════════════
# PARSEUR FORMATIONS
# ══════════════════════════════════════════════════════════════════════════════

# Cherche le type en DERNIÈRE position sur la ligne (pour éviter de matcher
# "professionnel" dans "Master professionnel en ... Universitaire")
_FORMATION_TYPE_END_RE = re.compile(
    r"\b(" + _FORMATION_TYPE_PAT + r")\s*$", re.IGNORECASE
)
# Ligne qui EST exactement un type (ex: "Universitaire" seul)
_TYPE_ONLY_RE = re.compile(r"^(" + _FORMATION_TYPE_PAT + r")$", re.IGNORECASE)


def _parse_obtenu_line(line: str) -> dict:
    """
    Parse une ligne "Obtenu | Mention xxx Date - Date Ecole | Pays".

    Approche étape par étape pour éviter les problèmes de regex lazy.
    Retourne un dict avec: statut, mention, date_debut, date_fin, etablissement, pays.
    """
    result: dict = {
        "statut": None, "mention": None,
        "date_debut": None, "date_fin": None,
        "etablissement": None, "pays": None,
    }

    # 1. Extraire le statut ("Obtenu" ou "En cours")
    m_statut = re.match(r"(Obtenu|En\s+cours)\s*", line, re.IGNORECASE)
    if not m_statut:
        return result
    result["statut"] = _clean(m_statut.group(1))
    rest = line[m_statut.end():]

    # 2. Extraire la mention si présente
    m_mention = re.match(r"\|\s*Mention\s+", rest, re.IGNORECASE)
    if m_mention:
        rest = rest[m_mention.end():]
        # La mention s'arrête au premier pattern date (Mois/AAAA ou AAAA)
        m_stop = re.search(
            r"(?:" + _MONTH_PAT + r")[a-záàâäéèêëîïôöùûü]*/?\d{4}|\b\d{4}\b",
            rest, re.IGNORECASE,
        )
        if m_stop:
            result["mention"] = _clean(rest[: m_stop.start()])
            rest = rest[m_stop.start():]
        else:
            result["mention"] = _clean(rest)
            rest = ""

    # 3. Extraire la plage de dates
    if rest:
        date_pat = (
            r"((?:" + _MONTH_PAT + r")[a-záàâäéèêëîïôöùûü]*(?:/|\s+)\d{4}|\d{4})"
            r"\s*[-–]\s*(Aujourd[''h]?\w*|(?:" + _MONTH_PAT + r")[a-záàâäéèêëîïôöùûü]*(?:/|\s+)\d{4}|\d{4})"
        )
        m_range = re.match(date_pat, rest.strip(), re.IGNORECASE)
        if m_range:
            result["date_debut"] = _normalize_date(m_range.group(1))
            result["date_fin"]   = _normalize_date(m_range.group(2))
            rest = rest[rest.find(m_range.group(0)) + len(m_range.group(0)):].strip()
        else:
            # Date seule (juste une année)
            m_yr = re.match(r"\b(\d{4})\b", rest.strip())
            if m_yr:
                result["date_fin"] = m_yr.group(1)
                rest = rest[rest.find(m_yr.group(0)) + len(m_yr.group(0)):].strip()

    # 4. Extraire établissement et pays depuis le reste
    if rest:
        if "|" in rest:
            parts = [p.strip() for p in rest.split("|")]
            result["etablissement"] = parts[0] or None
            result["pays"]          = parts[-1] if len(parts) > 1 else None
        else:
            result["etablissement"] = _clean(rest) or None

    return result


def _parse_formations(text: str) -> list[dict]:
    """
    Extrait les diplômes et formations.

    Formats observés dans les vrais CVs Keejob :

    Format A (type sur même ligne) :
      Licence appliquée Universitaire
      Obtenu | Mention Bien Septembre/2009 - Mai/2013
      Institut ... | Tunisie

    Format B (type sur ligne séparée) :
      Licence appliquée en agroalimentaire (contrôle qualité)
      Universitaire
      Obtenu | Mention Bien Septembre/2009 - Mai/2013
      Institut ... | Tunisie

    Format C (date + école sur même ligne) :
      diplome national d'ingénieur Universitaire
      2007 Ecole Supérieure d'Agriculture du Kef | Tunisie

    Format D (mention + année + école sur même ligne) :
      Maitrise ... Universitaire
      Mention Assez Bien 2007
      Ecole ... | Tunisie
    """
    if not text:
        return []

    lines = [ln.strip() for ln in text.split("\n")]
    n = len(lines)

    # Identifier les débuts de formation.
    # IMPORTANT : on ignore les lignes qui sont SEULEMENT un type ("Universitaire")
    # car elles seront consommées par la formation précédente (Format B).
    form_starts: list[int] = []
    for i, line in enumerate(lines):
        if not line:
            continue
        # Ligne pure de type → consommée par la formation précédente, pas un nouveau début
        if _TYPE_ONLY_RE.match(line):
            continue
        # Ligne avec type à la FIN (ex: "Licence appliquée Universitaire")
        if _FORMATION_TYPE_END_RE.search(line):
            form_starts.append(i)
        # Ligne sans type mais suivie d'une ligne type-seul (Format B)
        elif i + 1 < n and _TYPE_ONLY_RE.match(lines[i + 1]):
            form_starts.append(i)

    form_starts = sorted(set(form_starts))
    if not form_starts:
        return []

    formations: list[dict] = []

    for k, start in enumerate(form_starts):
        end   = form_starts[k + 1] if k + 1 < len(form_starts) else n
        block = [l for l in lines[start:end] if l]
        if not block:
            continue

        form: dict = {
            "diplome":       None,
            "type":          None,
            "statut":        None,
            "mention":       None,
            "date_debut":    None,
            "date_fin":      None,
            "etablissement": None,
            "pays":          None,
        }

        # ── Ligne 0 : diplome [+ type en fin de ligne] ────────────────────
        # On cherche le type à la FIN pour éviter de matcher "professionnel"
        # au milieu de "Master professionnel en ... Universitaire"
        m = _FORMATION_TYPE_END_RE.search(block[0])
        if m:
            form["diplome"] = _clean(block[0][: m.start()])
            form["type"]    = _clean(m.group(1))
        else:
            form["diplome"] = _clean(block[0])

        j = 1

        # ── Type seul sur ligne séparée (Format B) ─────────────────────────
        if j < len(block) and _TYPE_ONLY_RE.match(block[j]):
            form["type"] = _clean(block[j])
            j += 1

        # ── Ligne statut / mention / date ──────────────────────────────────
        if j < len(block):
            line = block[j]

            if re.match(r"(Obtenu|En\s+cours)", line, re.IGNORECASE):
                parsed = _parse_obtenu_line(line)
                form.update({k: v for k, v in parsed.items() if v is not None})
                j += 1

            # "Mention xxx AAAA [Ecole | Pays]" (Format D)
            elif re.match(r"Mention\s+\S+", line, re.IGNORECASE):
                m_mention = re.match(r"Mention\s+(.+?)\s+(\d{4})\s*(.*)", line, re.IGNORECASE)
                if m_mention:
                    form["mention"]  = _clean(m_mention.group(1))
                    form["date_fin"] = m_mention.group(2)
                    rest = _clean(m_mention.group(3))
                    if "|" in rest:
                        parts = [p.strip() for p in rest.split("|")]
                        form["etablissement"] = parts[0]
                        form["pays"]          = parts[-1] if len(parts) > 1 else None
                    elif rest:
                        form["etablissement"] = rest
                j += 1

            # "AAAA Ecole | Pays" (Format C : année + école sur même ligne)
            elif re.match(r"^\d{4}\s+\S", line):
                m_yr = re.match(r"^(\d{4})\s+(.+?)(?:\s*\|\s*(.+))?$", line)
                if m_yr:
                    form["date_fin"]      = m_yr.group(1)
                    form["etablissement"] = _clean(m_yr.group(2))
                    form["pays"]          = _clean(m_yr.group(3)) if m_yr.group(3) else None
                j += 1

        # ── Chercher plage de dates si pas encore trouvée ──────────────────
        if not form["date_debut"] and not form["date_fin"] and j < len(block):
            line = block[j]
            m_range = re.match(
                r"((?:" + _MONTH_PAT + r")[^\s–-]+(?:/\d{4})|\d{4})"
                r"\s*[-–]\s*((?:" + _MONTH_PAT + r")[^\s|]+(?:/\d{4})|Aujourd[''h]?\w*|\d{4})",
                line, re.IGNORECASE,
            )
            if m_range:
                form["date_debut"] = _normalize_date(m_range.group(1))
                form["date_fin"]   = _normalize_date(m_range.group(2))
                j += 1

        # ── Établissement ──────────────────────────────────────────────────
        if not form["etablissement"] and j < len(block):
            line = block[j]
            if "|" in line:
                parts = [p.strip() for p in line.split("|")]
                form["etablissement"] = parts[0]
                form["pays"]          = parts[-1] if len(parts) > 1 else None
            else:
                form["etablissement"] = _clean(line)
            j += 1

        if form["diplome"]:
            formations.append(form)

    return formations


# ══════════════════════════════════════════════════════════════════════════════
# PARSEUR COMPÉTENCES
# ══════════════════════════════════════════════════════════════════════════════

# Regex pour extraire "Compétence (Niveau)" sur une ligne
# Gère plusieurs occurrences sur la même ligne :
# "Word (Avancé) Excel (Avancé) Gestion de production (Avancé)"
_COMP_WITH_LEVEL_RE = re.compile(
    r"(.+?)\s*\((Avancé|Avanc[ée]|Intermédiaire|Interm[ée]diaire|Débutant|D[ée]butant|Expert|Courant|Notions?)\)",
    re.IGNORECASE,
)
# Niveau seul (pour lignes de langue ou compétence sans parenthèses)
_LEVEL_WORDS_RE = re.compile(
    r"\b(Avancé|Avanc[ée]|Intermédiaire|Interm[ée]diaire|Débutant|D[ée]butant"
    r"|Expert|Courant|Notions?|Bilingue|Maternelle)\b",
    re.IGNORECASE,
)


def _parse_competences(text: str) -> list[dict]:
    """
    Extrait les compétences depuis la section COMPÉTENCES.

    Formats observés :
    - "Word (Avancé) Excel (Avancé) Analyse physico-chimique (Avancé)"  ← multi sur une ligne
    - "Gestion de production (Avancé) Gestion de maintenance (Avancé)"
    - "Logiciels Cao: Autocad / Catia V5 / Solidworks"                 ← séparés par /
    - "Navigation Internet"                                              ← sans niveau
    """
    competences: list[dict] = []
    if not text:
        return competences

    for raw_line in text.split("\n"):
        line = raw_line.strip()
        if not line or len(line) > 300:
            continue

        # ── Essai 1 : items avec niveau en parenthèses ────────────────────
        matches = _COMP_WITH_LEVEL_RE.findall(line)
        if matches:
            for nom_raw, niveau_raw in matches:
                nom = _clean(nom_raw)
                if nom:
                    competences.append({
                        "nom_competence": nom,
                        "niveau": _map_skill(niveau_raw),
                    })
            continue

        # ── Essai 2 : séparés par "/" ─────────────────────────────────────
        if "/" in line and not _DATE_WORD_RE.search(line):
            items = [_clean(p) for p in line.split("/") if _clean(p)]
            for item in items:
                if item and len(item) < 80:
                    competences.append({"nom_competence": item, "niveau": "INTERMEDIATE"})
            continue

        # ── Essai 3 : ligne entière comme une compétence ──────────────────
        # Ignorer les phrases trop longues ou qui ressemblent à du texte libre
        if (
            len(line) < 120
            and not re.search(r"[.;!?]$", line)
            and not re.search(r"\b(je|nous|il|elle|vous|ils|mon|ma|mes)\b", line, re.IGNORECASE)
            and not line.isupper()
        ):
            competences.append({"nom_competence": line, "niveau": "INTERMEDIATE"})

    return competences


# ══════════════════════════════════════════════════════════════════════════════
# PARSEUR LANGUES
# ══════════════════════════════════════════════════════════════════════════════

def _parse_langues(text: str) -> list[dict]:
    """
    Extrait les langues et leur niveau.

    Format Keejob observé (une par ligne) :
      Arabe Courant
      Français Avancé
      Anglais Intermédiaire
      Allemand Débutant
    """
    langues: list[dict] = []
    if not text:
        return langues

    level_pat = re.compile(
        r"\b(Courant|Avancé|Avanc[ée]|Intermédiaire|Interm[ée]diaire"
        r"|Débutant|D[ée]butant|Bilingue|Maternelle|Notions?|Bien|Moyen)\b",
        re.IGNORECASE,
    )

    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue

        m_level = level_pat.search(line)
        if not m_level:
            continue

        # La langue = tout ce qui précède le niveau
        langue = _clean(line[: m_level.start()])
        niveau_raw = m_level.group(1)

        if langue and 2 <= len(langue) <= 30:
            langues.append({
                "langue": langue,
                "niveau": _map_skill(niveau_raw),
            })

    return langues


# ══════════════════════════════════════════════════════════════════════════════
# FONCTION PRINCIPALE
# ══════════════════════════════════════════════════════════════════════════════

def parse_keejob_cv(text: str) -> dict:
    """
    Parse un CV Keejob (texte brut extrait par pdfplumber).

    Args:
        text: Texte complet du PDF (toutes pages concaténées)

    Returns:
        dict structuré, stocké dans cv_entities (JSONB).
        Tous les champs sont présents même si None.
    """
    if not text:
        return {}

    # 1. Découper en sections
    sections = _split_sections(text)

    # 2. Parser l'en-tête
    header = _parse_header(sections.get("header", ""))

    # 3. Parser les sections de contenu
    resume      = _clean(sections.get("resume", "")) or None
    competences = _parse_competences(sections.get("competences", ""))
    langues     = _parse_langues(sections.get("langues", ""))
    experiences = _parse_experiences(sections.get("experiences", ""))
    formations  = _parse_formations(sections.get("formations", ""))

    return {
        # Métadonnées
        "source":            "keejob",
        "id_keejob":         header.get("id_keejob"),
        "parsed_at":         datetime.now().isoformat(),

        # Titre du poste (en gros en haut du CV)
        "titre_poste":       header.get("titre_poste"),

        # Identité
        "nom":               header.get("nom"),
        "prenom":            header.get("prenom"),
        "age":               header.get("age"),
        "email":             header.get("email"),
        "telephone":         header.get("telephone"),
        "adresse":           header.get("adresse"),
        "ville":             header.get("ville"),

        # Profil professionnel
        "niveau_etude":      header.get("niveau_etude"),
        "experience_annees": header.get("experience_annees"),
        "situation_pro":     header.get("situation_pro"),
        "disponibilite":     header.get("disponibilite"),
        "permis_conduire":   header.get("permis_conduire"),
        "salaire_souhaite":  header.get("salaire_souhaite"),

        # Contenu structuré
        "resume":            resume,
        "competences":       competences,   # [{"nom_competence": str, "niveau": str}]
        "langues":           langues,       # [{"langue": str, "niveau": str}]
        "experiences":       experiences,   # [{"poste": str, "entreprise": str, ...}]
        "formations":        formations,    # [{"diplome": str, "etablissement": str, ...}]
    }
