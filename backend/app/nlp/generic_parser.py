"""
generic_parser.py
Parseur pour CVs de format libre (source AGENT ou CANDIDAT).

Conçu pour gérer :
  - CVs à deux colonnes (texte OCR entrelacé après --psm 3 / --psm 6)
  - Mises en page variées : chronologique, fonctionnel, hybride
  - CVs tunisiens / maghrébins en français, arabe ou anglais

Retourne un dict structurellement identique à parse_keejob_cv(),
compatible avec scorer.py et cv_to_embed_text() sans modification.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Optional


# ══════════════════════════════════════════════════════════════════════════════
# CONSTANTES
# ══════════════════════════════════════════════════════════════════════════════

# Niveaux de compétence → SkillLevel enum  (identique à keejob_parser)
_SKILL_MAP: dict[str, str] = {
    "débutant": "BEGINNER",       "debutant": "BEGINNER",       "notions": "BEGINNER",
    "intermédiaire": "INTERMEDIATE", "intermediaire": "INTERMEDIATE",
    "avancé": "EXPERT",           "avance": "EXPERT",
    "expert": "EXPERT",           "courant": "EXPERT",
    "bilingue": "EXPERT",         "maternelle": "EXPERT",
    "langue maternelle": "EXPERT",
    "bien": "INTERMEDIATE",       "moyen": "BEGINNER",
    # CECRL
    "a1": "BEGINNER", "a2": "BEGINNER",
    "b1": "INTERMEDIATE", "b2": "INTERMEDIATE",
    "c1": "EXPERT",  "c2": "EXPERT",
}

# Niveaux d'études (ordre du plus élevé au plus bas)
_ETUDE_PATTERNS: list[tuple[str, str]] = [
    (r"doctorat|ph\.?d",                                                           "Doctorat"),
    (r"master\b|m\.?sc\b|m2\b|bac\s*\+?\s*5|bac\+5|"
     r"ing[ée]nieur\b|ing[ée]nierie\b|grandes?\s+[ée]cole\b|mastère",             "BAC+5"),
    (r"bac\s*\+?\s*4|bac\+4",                                                     "BAC+4"),
    (r"licence\b|bachelor\b|bac\s*\+?\s*3|bac\+3|l3\b|deug\b|deust\b|magistère", "BAC+3"),
    (r"bac\s*\+?\s*2|bac\+2|dut\b|bts\b|d\.?u\.?t\b",                           "BAC+2"),
    (r"\bbac[a-zéèêëàâùûîï]{0,12}\b|terminale\b",                                 "BAC"),
]

# Mois français + anglais (préfixes clés)
_MONTHS_FR: dict[str, str] = {
    "jan": "01",  "janv": "01",   "janvier": "01",  "january": "01",
    "fév": "02",  "fev": "02",    "fevr": "02",      "février": "02",
    "fevrier": "02", "february": "02",
    "mar": "03",  "mars": "03",   "march": "03",
    "avr": "04",  "avril": "04",  "april": "04",
    "mai": "05",  "may": "05",
    "jui": "06",  "juin": "06",   "june": "06",
    "juil": "07", "juillet": "07","july": "07",
    "aoû": "08",  "aou": "08",    "août": "08",     "aout": "08",    "august": "08",
    "sep": "09",  "sept": "09",   "septembre": "09", "september": "09",
    "oct": "10",  "octobre": "10","october": "10",
    "nov": "11",  "novembre": "11","november": "11",
    "déc": "12",  "dec": "12",    "décembre": "12", "decembre": "12","december": "12",
}

_MONTH_PAT = (
    r"janv?(?:ier)?|f[ée]vr?(?:ier)?|mars|avr(?:il)?|mai|juin|"
    r"juil(?:let)?|ao[uû]t?|sept?(?:embre)?|oct(?:obre)?|"
    r"nov(?:embre)?|d[ée]c(?:embre)?|"
    r"january|february|march|april|may|june|july|august|"
    r"september|october|november|december"
)

# Plage de dates :
#   "Jan 2020 – Déc 2022"  / "2019 - 2021"  / "2020 - présent"
#   "01/06/2024 - 30/06/2024"  / "06/2024 - 06/2025"
_DATE_SINGLE_PAT = (
    r"(?:"
    r"\d{1,2}/\d{2}/\d{4}"          # DD/MM/YYYY
    r"|\d{1,2}/\d{4}"               # MM/YYYY
    r"|(?:(?:" + _MONTH_PAT + r")\.?\s+)?\d{4}"  # Mois AAAA ou AAAA seul
    r")"
)

_DATE_RANGE = re.compile(
    r"(" + _DATE_SINGLE_PAT + r")"
    r"\s*[-–—]\s*"
    r"(" + _DATE_SINGLE_PAT + r"|aujourd[''h]ui|en\s*cours|actuel|pr[ée]sent|present|current|maintenant)",
    re.IGNORECASE,
)

# Technologies et outils reconnus dans le texte libre
_TECH_SKILLS: frozenset[str] = frozenset({
    "python", "java", "javascript", "typescript", "php", "ruby", "swift",
    "kotlin", "go", "rust", "r", "matlab", "scala", "perl", "c++", "c#",
    "spring boot", "spring", "angular", "react", "vue", "django", "flask",
    "fastapi", "laravel", "symfony", "express", "node.js", "nodejs",
    "javafx", "flutter", "hibernate", "jquery", "tensorflow", "pytorch",
    "scikit-learn", "pandas", "numpy",
    "mysql", "postgresql", "postgres", "mongodb", "oracle", "sql server",
    "sqlite", "redis", "elasticsearch", "cassandra", "mariadb",
    "git", "docker", "kubernetes", "jenkins", "maven", "gradle",
    "linux", "windows", "aws", "azure", "gcp", "ci/cd",
    "html", "css", "bootstrap", "tailwind", "rest", "graphql", "api",
    "uml", "agile", "scrum", "jira", "trello", "sap", "access",
    "machine learning", "deep learning", "nlp", "data science", "powerbi",
    "tableau", "excel", "word", "powerpoint",
})

_SKILL_DISPLAY: dict[str, str] = {
    "c++": "C++", "c#": "C#", "node.js": "Node.js", "nodejs": "Node.js",
    "css": "CSS", "html": "HTML", "api": "API", "sql server": "SQL Server",
    "rest": "REST", "ci/cd": "CI/CD", "gcp": "GCP", "aws": "AWS", "nlp": "NLP",
}

# Langues reconnues
_LANGUES_NAMES: dict[str, str] = {
    "arabe": "Arabe",       "arabic": "Arabe",
    "français": "Français", "francais": "Français", "french": "Français",
    "anglais": "Anglais",   "english": "Anglais",
    "espagnol": "Espagnol", "spanish": "Espagnol",
    "allemand": "Allemand", "german": "Allemand",   "deutsch": "Allemand",
    "italien": "Italien",   "italian": "Italien",
    "turc": "Turc",         "turkish": "Turc",
    "chinois": "Chinois",   "chinese": "Chinois",
}

# En-têtes de section (lignes seules, en majuscules ou semi-majuscules)
# Format : (regex_ligne_entière, clé_interne)
_SECTION_PATTERNS: list[tuple[str, str]] = [
    (r"^\s*(?:profil\s*(?:professionnel)?|r[ée]sum[ée]|objective|about\s+me"
     r"|pr[ée]sentation|[àa]\s+propos|points?\s+forts?)\s*$",            "resume"),
    (r"^\s*(?:exp[ée]riences?\s*(?:professionnelles?)?|"
     r"parcours\s+professionnel|work\s+experience|"
     r"historique\s+(?:de\s+)?(?:l[''a])?emploi|emplois?)\s*$",          "experiences"),
    (r"^\s*(?:(?:dipl[ôo]mes?\s+et\s+)?formations?(?:\s+et\s+dipl[ôo]mes?)?|"
     r"[ée]ducation|cursus\s*(?:scolaire|acad[ée]mique|universitaire)?|"
     r"dipl[ôo]mes?|[ée]tudes?|parcours\s+(?:scolaire|acad[ée]mique)|"
     r"academic\s+background)\s*$",                                        "formations"),
    (r"^\s*(?:comp[ée]tences?\s*(?:techniques?|professionnelles?|cl[ée]s?)?|"
     r"skills?|savoir[- ]faire|expertise|technologies?|outils?)\s*$",     "competences"),
    (r"^\s*(?:langues?\s*(?:[ée]trang[ée]res?)?|languages?|"
     r"ma[îi]trise\s+des?\s+langues?)\s*$",                               "langues"),
    (r"^\s*(?:centres?\s+d[''']int[ée]r[êe]ts?|loisirs?|int[ée]r[êe]ts?|"
     r"activit[ée]s?\s*(?:extra-?professionnelles?)?)\s*$",                "interets"),
    (r"^\s*(?:certifications?|certifiats?|formations?\s+compl[ée]mentaires?)\s*$",
                                                                           "certifications"),
    (r"^\s*(?:projets?\s*(?:personnels?|acad[ée]miques?)?)\s*$",           "projets"),
]

# Mots-clés de titres de poste
_TITRE_KW = re.compile(
    r"d[ée]veloppeur|developpeur|ing[ée]nieur|technicien|analyste|"
    r"consultant|manager|directeur|chef|responsable|designer|architecte|"
    r"administrateur|[ée]tudiant|etudiant|stagiaire|data\s*scientist|"
    r"devops|fullstack|full[\s\-]?stack|frontend|back[\s\-]?end|"
    r"comptable|commercial|r\.?h\b|charg[ée]|coordinateur|superviseur|"
    r"gestionnaire|assistant|op[ée]rateur|technico[-\s]commercial|"
    r"project\s+manager|product\s+owner",
    re.IGNORECASE,
)

# Institutions de formation (plus larges que keejob_parser)
_FORMATION_INST = re.compile(
    r"\b(?:universit[ée]|facult[ée]|"
    r"[ée]cole(?:\s+(?:sup[ée]rieure|nationale|polytechnique|d[''']ing[ée]nieurs?))?|"
    r"institut(?:\s+(?:sup[ée]rieur|national|universitaire))?|"
    r"centre(?:\s+de\s+formation)?|lyc[ée]e?|campus|acad[ée]mie|"
    r"cpge|classe\s+pr[ée]paratoire|[ée]cole\s+pr[ée]pa|"
    r"college|iset|ensa|esprit|ensi|supcom|insat)\b",
    re.IGNORECASE,
)

# Mots-clés de diplôme
_DIPLOME_KW = re.compile(
    r"\b(?:licence|master|bts|dut|bachelor|bac\s*\+\s*\d|baccalaur[ée]at|"
    r"dipl[ôo]me(?:\s+national)?(?:\s+d[''']ing[ée]nieur)?|"
    r"ing[ée]nieur|doctorat|ph\.?d|m\.?sc|m\.?eng|"
    r"certificat|attestation|d\.?u\.|deug|magistère|mastère|"
    r"pr[ée]paratoire|classe\s+pr[ée]pa)\b",
    re.IGNORECASE,
)

# Lignes à ne pas confondre avec un nom (en-têtes, sections, adresses)
_NOT_A_NAME = re.compile(
    r"^(?:profil|exp[ée]rience|formation|comp[ée]tence|langue|"
    r"contact|coordonn[ée]e|curriculum|cv\b|r[ée]sum[ée]|"
    r"@|http|www|\+216|\+212|\+213|\d{4})",
    re.IGNORECASE,
)


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


# ── OCR known broken section words (accented caps split by OCR) ───────────────
_OCR_KNOWN_BREAKS: list[tuple[str, str]] = [
    (r"\bCOMPÉTEN\s+CES\b",  "COMPÉTENCES"),
    (r"\bCOMPETEN\s+CES\b",  "COMPÉTENCES"),
    (r"\bFORMA\s+TIONS?\b",  "FORMATIONS"),
    (r"\bDIPLÔ\s+MES?\b",    "DIPLÔMES"),
]


def _normalize_ocr_text(text: str) -> str:
    """
    Normalise les artefacts OCR fréquents dans les CVs deux-colonnes :
    - Bullets Wingdings (\\uf0b7…) → bullet standard "•"
    - Lettres espacées "C O N TACT" → "CONTACT", "E XPERIENCES" → "EXPERIENCES"
    - Mots connus coupés par l'OCR : "COMPÉTEN CES" → "COMPÉTENCES"
    """
    # Bullets Wingdings / Symbol → bullet standard
    text = re.sub(r"[\uf0b7\uf0d8\uf0fc\uf0a7\uf076\uf0da\uf0de\uf0e0]", "•", text)
    # Lettres majuscules espacées : "C O N TACT", "E XPERIENCES" → collapsed
    text = re.sub(
        r"(?<![A-Za-z])([A-Z] )+[A-Z]+(?![A-Za-z])",
        lambda m: m.group(0).replace(" ", ""),
        text,
    )
    # Mots connus coupés (accents perdus) → forme correcte
    for bad, good in _OCR_KNOWN_BREAKS:
        text = re.sub(bad, good, text, flags=re.IGNORECASE)
    return text


def _map_skill(s: str) -> str:
    return _SKILL_MAP.get((s or "").strip().lower(), "INTERMEDIATE")


def _normalize_date(raw: str) -> Optional[str]:
    """
    Convertit une date textuelle → 'AAAA-MM' ou 'AAAA'.
    Retourne None pour "présent / en cours / aujourd'hui".

    Formats gérés :
    - "DD/MM/YYYY" → "AAAA-MM"  (ex : 01/06/2024)
    - "MM/YYYY"    → "AAAA-MM"  (ex : 06/2024)
    - "Mois AAAA"  → "AAAA-MM"  (ex : Juin 2024)
    - "AAAA"       → "AAAA"
    """
    if not raw:
        return None
    s = raw.strip().lower()
    if re.search(r"aujourd[''h]|en\s*cours|actuel|pr[ée]sent|current|present|maintenant", s):
        return None
    # DD/MM/YYYY → AAAA-MM
    m = re.match(r"^(\d{1,2})/(\d{2})/(\d{4})$", s)
    if m:
        return f"{m.group(3)}-{m.group(2).zfill(2)}"
    # MM/YYYY → AAAA-MM
    m = re.match(r"^(\d{1,2})/(\d{4})$", s)
    if m:
        return f"{m.group(2)}-{m.group(1).zfill(2)}"
    # "Mois AAAA" ou "Mois/AAAA"
    for key, val in sorted(_MONTHS_FR.items(), key=lambda x: -len(x[0])):
        if s.startswith(key):
            m = re.search(r"\d{4}", s)
            if m:
                return f"{m.group(0)}-{val}"
            break
    # Année seule
    m = re.match(r"^(\d{4})$", s.strip())
    if m:
        return m.group(1)
    return raw.strip()


# ══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 0 — NETTOYAGE : SUPPRIMER LES BLOCS CONTACT DUPLIQUÉS
# ══════════════════════════════════════════════════════════════════════════════

_SECTION_INLINE = re.compile(
    r"(?<!\n)(PROFIL(?:\s+PROFESSIONNEL)?|"
    r"EXP[ÉE]RIENCES?(?:\s+PROFESSIONNELLES?)?|"
    r"FORMATIONS?(?:\s+ET\s+DIPL[ÔO]MES?)?|"
    r"DIPL[ÔO]MES?(?:\s+ET\s+FORMATIONS?)?|"
    r"COMP[ÉE]TENCES?(?:\s+(?:TECHNIQUES?|PROFESSIONNELLES?|CL[ÉE]S?))?|"
    r"LANGUES?(?:\s+[ÉE]TRANG[ÈE]RES?)?|"
    r"INT[ÉE]R[ÊE]TS?|LOISIRS?|CERTIFICATIONS?|PROJETS?)",
    re.IGNORECASE,
)


def _insert_section_breaks(text: str) -> str:
    """
    Dans les CVs deux-colonnes, les en-têtes de section apparaissent souvent
    en milieu de ligne (après le contenu de la colonne gauche).
    Ex : "linkedin.com/ahmed-bani EXPÉRIENCES PROFESSIONNELLES"
    → chaque en-tête reconnu est déplacé sur sa propre ligne.
    """
    return _SECTION_INLINE.sub(r"\n\1", text)


def _deduplicate_contact_block(text: str) -> str:
    """
    Dans les CVs à deux colonnes, l'OCR lit ligne par ligne et peut reproduire
    le bloc contact (email, téléphone) deux fois à des positions proches.

    Stratégie :
      1. Trouver toutes les lignes contenant un email.
      2. Si deux occurrences sont séparées de moins de 25 lignes, supprimer
         les lignes intermédiaires entre la première et la seconde occurrence
         (= le doublon du bloc contact de droite).
    """
    lines = text.split("\n")
    email_re = re.compile(r"[\w.+\-]+@[\w.\-]+\.[a-zA-Z]{2,}")
    positions = [i for i, l in enumerate(lines) if email_re.search(l)]

    if len(positions) < 2:
        return text

    first, second = positions[0], positions[1]
    if second - first < 25:
        # Supprime le bloc [first+1 .. second+3] qui est le doublon
        cleaned = lines[: first + 1] + lines[min(len(lines), second + 3):]
        return "\n".join(cleaned)

    return text


# ══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 1 — EXTRACTION DES INFORMATIONS DE CONTACT
# ══════════════════════════════════════════════════════════════════════════════

def _extract_email(text: str) -> Optional[str]:
    # Priorité 1 : OCR artefact — espace dans la partie locale "Ahmedb ani12@icloud.com"
    # (en priorité sur le standard car le standard capturerait le fragment incomplet)
    m = re.search(r"([\w.+\-]+)\s+([\w.+\-]+)@([\w\-]+\.[\w.]+)", text)
    if m:
        return (m.group(1) + m.group(2) + "@" + m.group(3)).lower()
    # Priorité 2 : email standard
    m = re.search(r"[\w.+\-]+@[\w\-]+\.[\w.]+", text)
    if m:
        return m.group(0).lower()
    # Priorité 3 : espace après le @
    m = re.search(r"([\w.+\-]+)@\s*([\w\-]+\.[\w.]+)", text)
    if m:
        return (m.group(1) + "@" + m.group(2)).lower()
    return None


def _extract_phone(text: str) -> Optional[str]:
    for pat in [
        r"\+216\s*\d{2}\s*\d{3}\s*\d{3}",
        r"\+216\s*\d{8}",
        r"00216\s*\d{8}",
        r"\+212\s*\d{9}",                          # Maroc
        r"\+213\s*\d{9}",                          # Algérie
        r"(?<!\d)[2-9]\d{7}(?!\d)",                # 8-digit TN compact
        r"(?<!\d)[2-9]\d\s\d{2}\s\d{2}\s\d{2}(?!\d)",  # OCR espacé : "50 40 60 41"
    ]:
        m = re.search(pat, text)
        if m:
            return re.sub(r"\s+", "", m.group(0)).strip()
    return None


def _extract_age(text: str) -> Optional[int]:
    m = re.search(r"\b(\d{2})\s*ans?\b", text[:600], re.IGNORECASE)
    return int(m.group(1)) if m else None


def _extract_adresse(text: str) -> tuple[Optional[str], Optional[str]]:
    """Retourne (adresse_courte, ville) ou (None, None)."""
    _TN_CITIES = re.compile(
        r"tunis|ben\s*arous|ariana|manouba|sfax|sousse|monastir|"
        r"bizerte|nabeul|m[ée]denine|gabes|gafsa|sidi\s*bouzid|"
        r"kasserine|kairouan|siliana|zaghouan|jedida|bardo|hammam|"
        r"mahdia|tozeur|tataouine|kebili|ghar\s*el\s*melh|el\s*alem|"
        r"menzah|ennasr|berges\s+du\s+lac|lac\s+\d",
        re.IGNORECASE,
    )
    for line in text.split("\n"):
        line = _clean(line)
        m = _TN_CITIES.search(line)
        if not m or len(line) > 100:
            continue
        ville = m.group(0).strip().title()
        adresse = line[:80].strip(" ,")
        return adresse, ville
    return None, None


# ══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 2 — NOM / PRÉNOM / TITRE DU POSTE
# ══════════════════════════════════════════════════════════════════════════════

def _extract_name(text: str) -> tuple[Optional[str], Optional[str]]:
    """
    Détecte le nom du candidat dans les premières lignes du document.

    Stratégies (par priorité décroissante) :
    1. Ligne entièrement ou partiellement en MAJUSCULES (2–4 mots, pas une section)
    2. Ligne en Title Case courte dans les 15 premières lignes
    3. Lignes adjacentes au titre de poste

    Retourne (prenom, nom).
    """
    lines = [_clean(l) for l in text.split("\n") if _clean(l)]

    for line in lines[:20]:
        words = line.split()
        if len(words) < 2 or len(words) > 5:
            continue
        if _NOT_A_NAME.match(line):
            continue
        if re.search(r"[@/\\:\d]", line):
            continue

        # Stratégie 1 : au moins un mot entièrement en majuscules (prénom NOM)
        has_upper_word = any(w.isupper() and len(w) > 1 for w in words)
        # Éviter les titres de section (une seule valeur en CAPS)
        all_upper_single = len(words) == 1 and words[0].isupper()
        if has_upper_word and not all_upper_single:
            joined = " ".join(words)
            if not re.match(
                r"^(?:CV|CURRICULUM\s+VITAE|CONTACT|PROFIL|EXPERIENCE|"
                r"COMPETENCE|FORMATION|LANGUE)S?$",
                joined, re.IGNORECASE,
            ):
                prenom = words[0].capitalize()
                nom    = " ".join(w.upper() if w.isupper() else w for w in words[1:])
                return prenom, nom

        # Stratégie 2 : Title Case (chaque mot commence par une majuscule)
        if (
            all(w[0].isupper() for w in words if w)
            and not re.search(r"[,;:!?]", line)
            and not _TITRE_KW.search(line)
        ):
            return words[0], " ".join(words[1:])

    return None, None


def _extract_titre_poste(
    text: str,
    nom: Optional[str],
    prenom: Optional[str],
) -> Optional[str]:
    """Retourne le titre de poste depuis les premières lignes significatives."""
    lines = [_clean(l) for l in text.split("\n") if _clean(l)]
    for line in lines[:25]:
        if not _TITRE_KW.search(line):
            continue
        if len(line) > 90:
            continue
        if nom    and nom.lower()    in line.lower():
            continue
        if prenom and prenom.lower() in line.lower():
            continue
        return line
    return None


# ══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 3 — NIVEAU D'ÉTUDES
# ══════════════════════════════════════════════════════════════════════════════

def _extract_niveau_etude(text: str) -> Optional[str]:
    tl = text.lower()
    for pat, val in _ETUDE_PATTERNS:
        if re.search(pat, tl):
            return val
    return None


# ══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 4 — DÉCOUPAGE EN SECTIONS
# ══════════════════════════════════════════════════════════════════════════════

def _split_sections(text: str) -> dict[str, str]:
    """
    Découpe le texte brut en sections nommées en détectant les en-têtes
    (lignes seules correspondant aux patterns de _SECTION_PATTERNS).
    """
    found: list[tuple[int, int, str]] = []

    for pattern, key in _SECTION_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE):
            # Éviter les doublons à ±10 caractères près
            if not any(abs(m.start() - s) < 10 for s, _, _ in found):
                found.append((m.start(), m.end(), key))

    found.sort(key=lambda x: x[0])

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
# ÉTAPE 5 — PARSEURS DE SECTIONS
# ══════════════════════════════════════════════════════════════════════════════

def _clean_resume_text(text: str) -> str:
    """
    Supprime les artefacts de contact OCR infiltrés dans le résumé :
    numéros de téléphone, emails, URLs, fragments de domaine, adresses.
    """
    # Téléphones (compact ou espacés)
    text = re.sub(r"(?<!\d)\+?(?:216|212|213)?\s*\d[\d\s]{5,12}(?!\d)", " ", text)
    # Emails (y compris artefacts avec espaces autour du @)
    text = re.sub(r"[\w.+\-]+\s*@\s*[\w.\-]+\.[a-zA-Z]{2,}", " ", text)
    # URLs complètes et fragments de domaine (ex : "linkedin. com/ahmed-bani", ". com/path")
    text = re.sub(r"(?:https?://|www\.|linkedin\.?)\s*\S+", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"\.\s*com/\S*", " ", text, flags=re.IGNORECASE)
    # Lignes/fragments contenant une ville tunisienne (adresse glissée dans le profil)
    text = re.sub(
        r"\b(?:tunis|sfax|sousse|nabeul|bizerte|ariana|ben\s*arous|monastir|korba|"
        r"manouba|gabes|gafsa|mahdia|kairouan|medenine|tozeur|tataouine)\b[^\n]*",
        " ", text, flags=re.IGNORECASE,
    )
    # Mots-clés parasites isolés
    text = re.sub(r"\blinkedin\b|\bcontact\b", " ", text, flags=re.IGNORECASE)
    # Noms partiels laissés par la suppression de l'email OCR (1-2 mots avant @)
    text = re.sub(r"\b[A-Z][a-z]+[A-Z][a-z]*\b", " ", text)  # camelCase résiduel ex "Ahmedb"
    return re.sub(r"\s{2,}", " ", text).strip()


def _parse_resume(section: str) -> Optional[str]:
    if not section:
        return None
    raw = _clean(_clean_resume_text(section))
    return raw[:800] if len(raw) > 40 else None


def _parse_competences(section: str, full_text: str) -> list[dict]:
    """
    Deux passes :
    1. Détection des mots-clés techniques dans le texte complet.
    2. Extraction des items bullet dans la section dédiée.
    """
    competences: list[dict] = []
    seen: set[str] = set()

    def _add(nom: str, niveau: str = "INTERMEDIATE") -> None:
        nom = _clean(nom)
        if nom and nom not in seen and 2 < len(nom) < 80:
            seen.add(nom)
            competences.append({"nom_competence": nom, "niveau": niveau})

    # Passe 1 : mots-clés techniques dans le texte complet
    tl = full_text.lower()
    for skill in sorted(_TECH_SKILLS, key=len, reverse=True):
        if re.search(r"(?<![a-z])" + re.escape(skill) + r"(?![a-z])", tl):
            display = _SKILL_DISPLAY.get(skill, skill.title())
            _add(display)

    # Passe 2 : items de la section compétences
    # Filtre : rejeter les lignes qui ressemblent à des entrées d'expérience ou dates
    _SKIP_COMPETENCE = re.compile(
        r"\d{4}"                                        # contient une année
        r"|(?:\d{1,2}[/\-]){1,2}\d{4}"                 # date numérique
        r"|\|\s*\d{2}"                                  # séparateur avec date (ex: "| 01/2023")
        r"|\.{3,}"                                      # points de suspension excessifs
        r"|^\s*(?:stage|formation\s+en|poste|emploi|ing[ée]nieur)\b",  # titre d'expérience
        re.IGNORECASE,
    )
    if section:
        _level_re = re.compile(
            r"\b(avancé|avanc[ée]|intermédiaire|interm[ée]diaire|"
            r"débutant|d[ée]butant|expert|courant|notions?|bilingue|"
            r"a[12]|b[12]|c[12])\b",
            re.IGNORECASE,
        )
        for raw_line in section.split("\n"):
            line = re.sub(r"^[\s*\-•▸◆✓►▪]+", "", raw_line).strip()
            line = _clean(line)
            if not line or len(line) < 3 or len(line) > 120:
                continue
            if _SKIP_COMPETENCE.search(line):
                continue
            m_level = _level_re.search(line)
            if m_level:
                nom = line[: m_level.start()].strip(" :|-")
                _add(nom, _map_skill(m_level.group(1)))
                continue
            # Ligne avec bullets internes "Skill A • Skill B" → éclater
            if "•" in line:
                for part in re.split(r"\s*•\s*", line):
                    part = _clean(part)
                    if part and 2 < len(part) < 55:
                        _add(part)
                continue
            if "/" in line:
                for part in line.split("/"):
                    _add(part)
                continue
            if not re.search(r"[.;!?]$", line) and len(line) < 55:
                _add(line)

    return competences[:25]


def _parse_langues(section: str, full_text: str) -> list[dict]:
    """Extrait les langues avec leur niveau standardisé (BEGINNER/INTERMEDIATE/EXPERT)."""
    langues: list[dict] = []
    seen: set[str] = set()

    _level_re = re.compile(
        r"\b(d[ée]butant|notions?|intermédiaire|interm[ée]diaire|courant|bien|"
        r"avancé|avanc[ée]|bilingue|maternelle|langue\s+maternelle|natif|"
        r"a[12]|b[12]|c[12])\b",
        re.IGNORECASE,
    )

    # Scanner la section dédiée en priorité, puis le texte complet en fallback
    for scan_text in ([section] if section else []) + [full_text]:
        if not scan_text:
            continue
        for line in scan_text.split("\n"):
            ll = line.lower()
            for key, val in _LANGUES_NAMES.items():
                if key in ll and val not in seen:
                    m_level = _level_re.search(line)
                    niveau = _map_skill(m_level.group(1)) if m_level else "INTERMEDIATE"
                    seen.add(val)
                    langues.append({"langue": val, "niveau": niveau})
                    break
        if langues:
            break   # Ne scanner full_text que si la section dédiée est vide

    return langues


def _parse_experiences(section: str) -> list[dict]:
    """
    Extraction par plages de dates : chaque date-range déclenche une nouvelle
    expérience. Les lignes qui précèdent = poste ; celles qui suivent =
    entreprise + description.

    Fonctionne sur une section délimitée OU sur le texte complet en fallback.
    """
    if not section:
        return []

    lines = [_clean(l) for l in section.split("\n")]
    n = len(lines)
    experiences: list[dict] = []
    seen: set[str] = set()

    # Positions des lignes contenant une plage de dates
    date_positions: list[int] = []
    for i, line in enumerate(lines):
        if line and _DATE_RANGE.search(line):
            date_positions.append(i)

    # Fallback : patterns explicites "Stage chez / [Poste] chez [Société]"
    if not date_positions:
        _STAGE = re.compile(r"stage\s+(?:en|chez|à|au|dans|de)\s+\S+", re.IGNORECASE)
        _CHEZ  = re.compile(r"\S.{3,50}\s+chez\s+\S", re.IGNORECASE)
        for i, line in enumerate(lines):
            if line and (_STAGE.search(line) or _CHEZ.search(line)):
                date_positions.append(i)

    if not date_positions:
        return []

    for k, pos in enumerate(date_positions):
        end = date_positions[k + 1] if k + 1 < len(date_positions) else n
        # Inclure quelques lignes avant la date pour capturer le poste
        window_start = max(0, pos - 3)
        block = [l for l in lines[window_start:end] if l]
        if not block:
            continue

        exp: dict = {
            "poste": None, "type_contrat": None, "entreprise": None,
            "secteur": None, "ville": None,
            "date_debut": None, "date_fin": None,
            "duree": None, "description": None, "is_current": False,
        }

        # Trouver la ligne de dates dans le bloc
        date_line_idx = next(
            (bi for bi, bl in enumerate(block) if _DATE_RANGE.search(bl)), None
        )
        if date_line_idx is None:
            continue

        date_line = block[date_line_idx]
        dm = _DATE_RANGE.search(date_line)
        exp["date_debut"] = _normalize_date(dm.group(1))
        raw_end = dm.group(2)
        is_current = bool(re.search(
            r"aujourd[''h]ui|en\s*cours|actuel|pr[ée]sent|current|maintenant",
            raw_end, re.IGNORECASE,
        ))
        exp["is_current"]  = is_current
        exp["date_fin"]    = None if is_current else _normalize_date(raw_end)

        # Durée approximative
        if exp["date_debut"] and exp["date_fin"]:
            try:
                y1 = int(str(exp["date_debut"])[:4])
                y2 = int(str(exp["date_fin"])[:4])
                if y2 > y1:
                    exp["duree"] = f"{y2 - y1} an(s)"
            except (ValueError, TypeError):
                pass

        # Entreprise : chercher d'abord sur la même ligne que la date ("Société | 01/2024-01/2025")
        pre_date = date_line[:dm.start()].strip(" |–—").strip()
        if pre_date and len(pre_date) > 2:
            if "|" in pre_date:
                parts = [p.strip() for p in pre_date.split("|")]
                exp["entreprise"] = parts[0][:100]
                exp["secteur"]    = parts[1][:80] if len(parts) > 1 else None
            else:
                exp["entreprise"] = pre_date[:100]

        # Lignes avant la date → poste (ignorer les en-têtes de section)
        _SECTION_LINE = re.compile(
            r"^(?:profil|exp[ée]riences?|formations?|comp[ée]tences?|"
            r"langues?|int[ée]r[êe]ts?|certifications?|projets?|"
            r"dipl[ôo]mes?)\s*(?:professionnelles?|techniques?)?\s*$",
            re.IGNORECASE,
        )
        for bl in reversed(block[:date_line_idx]):
            bl = bl.strip()
            if bl and len(bl) > 3 and not _SECTION_LINE.match(bl):
                exp["poste"] = bl[:100]
                break

        # Lignes après la date → entreprise (si pas déjà trouvée) puis description
        after = block[date_line_idx + 1:]
        for bi, bl in enumerate(after):
            if bi == 0 and not exp["entreprise"]:
                if "|" in bl:
                    parts = [p.strip() for p in bl.split("|")]
                    exp["entreprise"] = parts[0][:100]
                    exp["secteur"]    = parts[1][:80] if len(parts) > 1 else None
                else:
                    exp["entreprise"] = bl[:100]
            elif bi > 0:
                exp["description"] = " ".join(after[bi:])[:500]
                break

        key = (exp.get("poste") or "")[:30].lower()
        if (exp.get("poste") or exp.get("entreprise")) and key not in seen:
            seen.add(key)
            experiences.append(exp)

    return experiences[:10]


def _parse_formations(section: str) -> list[dict]:
    """
    Extraction des diplômes et formations depuis une section délimitée.

    Reconnaît un large éventail d'institutions :
    Université, Lycée, École, Institut, Centre, Faculté, ISET, ENSI…
    et de diplômes : Licence, Master, BTS, Bac, Baccalauréat, Ingénieur…
    """
    if not section:
        return []

    lines = [_clean(l) for l in section.split("\n") if _clean(l)]
    n = len(lines)
    formations: list[dict] = []

    # Trouver les débuts de formation (ligne avec mot-clé diplôme OU institution)
    form_starts: list[int] = []
    for i, line in enumerate(lines):
        if _DIPLOME_KW.search(line):
            form_starts.append(i)
        elif _FORMATION_INST.search(line):
            # N'ajouter comme début que si la ligne précédente n'avait pas de diplôme
            if not (i > 0 and _DIPLOME_KW.search(lines[i - 1])):
                form_starts.append(i)

    form_starts = sorted(set(form_starts))

    # Fallback : lignes avec des années seules comme repères
    if not form_starts:
        for i, line in enumerate(lines):
            if re.search(r"\b(19|20)\d{2}\b", line):
                form_starts.append(i)
        form_starts = sorted(set(form_starts))

    if not form_starts:
        return []

    for k, start in enumerate(form_starts):
        end   = form_starts[k + 1] if k + 1 < len(form_starts) else n
        block = lines[start:end]
        if not block:
            continue

        form: dict = {
            "diplome": None, "type": None, "statut": None,
            "mention": None, "date_debut": None, "date_fin": None,
            "etablissement": None, "pays": None,
        }

        # Ligne 0 : diplôme ou institution
        if _DIPLOME_KW.search(block[0]):
            form["diplome"] = block[0][:200]
        elif _FORMATION_INST.search(block[0]):
            form["etablissement"] = block[0][:150]
        else:
            form["diplome"] = block[0][:200]

        for bl in block[1:]:
            # Plage de dates
            dm = _DATE_RANGE.search(bl)
            if dm and not form["date_fin"]:
                form["date_debut"] = _normalize_date(dm.group(1))
                raw_end = dm.group(2)
                form["date_fin"] = (
                    None
                    if re.search(r"cours|actuel|present|aujourd", raw_end, re.I)
                    else _normalize_date(raw_end)
                )
                form["statut"] = "En cours" if not form["date_fin"] else "Obtenu"
                continue
            # Année seule
            m_yr = re.match(r"^(\d{4})$", bl)
            if m_yr and not form["date_fin"]:
                form["date_fin"] = m_yr.group(1)
                form["statut"]   = "Obtenu"
                continue
            # Institution
            if _FORMATION_INST.search(bl) and not form["etablissement"]:
                form["etablissement"] = bl[:150]
                continue
            # Mention
            m_mention = re.search(r"\bMention\s+(\w+)", bl, re.IGNORECASE)
            if m_mention and not form["mention"]:
                form["mention"] = m_mention.group(1).capitalize()
                continue
            # Pays
            if re.search(
                r"\b(Tunisie|Maroc|Algérie|Algerie|France|Belgique|Canada)\b",
                bl, re.I,
            ):
                form["pays"] = _clean(bl)[:50]
                continue
            # Ligne restante → diplôme si pas encore trouvé
            if not form["diplome"]:
                form["diplome"] = _clean(bl)[:200]

        if form["diplome"] or form["etablissement"]:
            formations.append(form)

    return formations


# ══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 6 — CALCUL DU TOTAL D'EXPÉRIENCE
# ══════════════════════════════════════════════════════════════════════════════

def _calc_experience_annees(experiences: list[dict]) -> Optional[float]:
    """Somme les durées des expériences parsées → années décimales."""
    if not experiences:
        return None
    total_months = 0
    now_year = datetime.now().year

    for exp in experiences:
        try:
            y_start = int(str(exp.get("date_debut") or "")[:4])
            y_end   = now_year if exp.get("is_current") else int(str(exp.get("date_fin") or "")[:4])
            if y_end > y_start:
                total_months += (y_end - y_start) * 12
        except (ValueError, TypeError):
            continue

    return round(total_months / 12, 1) if total_months else None


# ══════════════════════════════════════════════════════════════════════════════
# ENTRÉE PRINCIPALE
# ══════════════════════════════════════════════════════════════════════════════

def parse_generic_cv(text: str) -> dict:
    """
    Parse un CV de format libre (source AGENT ou CANDIDAT).

    Args:
        text: Texte brut extrait par pdfplumber / OCR.

    Returns:
        Dict structurellement identique à parse_keejob_cv() :
        tous les champs sont présents même si None,
        pour une compatibilité totale avec scorer.py et cv_to_embed_text().
    """
    if not text or not text.strip():
        return {}

    # ── 0. Nettoyage ──────────────────────────────────────────────────────
    text = _normalize_ocr_text(text)         # artefacts OCR (lettres espacées, bullets)
    text = _insert_section_breaks(text)      # en-têtes mi-ligne → leur propre ligne
    text = _deduplicate_contact_block(text)  # blocs contact dupliqués (CVs deux-colonnes)

    # ── 1. Contact ────────────────────────────────────────────────────────
    email              = _extract_email(text)
    telephone          = _extract_phone(text)
    age                = _extract_age(text)
    adresse, ville     = _extract_adresse(text)

    # ── 2. Nom / titre ────────────────────────────────────────────────────
    prenom, nom        = _extract_name(text)
    titre_poste        = _extract_titre_poste(text, nom, prenom)

    # ── 3. Découpage en sections ──────────────────────────────────────────
    sections           = _split_sections(text)

    # Si nom toujours non trouvé, retenter sur le header isolé
    if not nom:
        prenom, nom    = _extract_name(sections.get("header", ""))

    # ── 4. Niveau d'études ────────────────────────────────────────────────
    niveau_etude       = _extract_niveau_etude(text)

    # ── 5. Résumé / profil ────────────────────────────────────────────────
    resume             = _parse_resume(sections.get("resume", ""))

    # ── 6. Compétences ────────────────────────────────────────────────────
    competences        = _parse_competences(sections.get("competences", ""), text)

    # ── 7. Langues ────────────────────────────────────────────────────────
    langues            = _parse_langues(sections.get("langues", ""), text)

    # ── 8. Expériences ────────────────────────────────────────────────────
    experiences        = _parse_experiences(sections.get("experiences", ""))
    if not experiences:
        # Fallback : chercher les dates dans le texte complet
        experiences    = _parse_experiences(text)

    # ── 9. Formations ─────────────────────────────────────────────────────
    formations         = _parse_formations(sections.get("formations", ""))

    # ── 10. Expérience totale ─────────────────────────────────────────────
    experience_annees  = _calc_experience_annees(experiences)

    # ── 11. Disponibilité ─────────────────────────────────────────────────
    dispo_m = re.search(
        r"disponible?\s*(?:dès\s*)?"
        r"(immédiatement|imm[ée]diate|sous\s+\d+\s*mois?|"
        r"pr[ée]avis\s+de\s+\d+|maintenant|now|"
        r"\d+\s*semaines?|\d+\s*mois?)",
        text, re.IGNORECASE,
    )
    disponibilite = _clean(dispo_m.group(0)) if dispo_m else None

    # ── Résultat ──────────────────────────────────────────────────────────
    return {
        # Métadonnées
        "source":            "generic",
        "parsed_at":         datetime.now().isoformat(),

        # Titre du poste
        "titre_poste":       titre_poste,

        # Identité
        "nom":               nom,
        "prenom":            prenom,
        "age":               age,
        "email":             email,
        "telephone":         telephone,
        "adresse":           adresse,
        "ville":             ville,

        # Profil professionnel
        "niveau_etude":      niveau_etude,
        "experience_annees": experience_annees,
        "situation_pro":     None,       # Non structuré dans les CVs libres
        "disponibilite":     disponibilite,
        "permis_conduire":   None,
        "salaire_souhaite":  None,

        # Contenu structuré (même structure que keejob_parser)
        "resume":      resume,
        "competences": competences,   # [{"nom_competence": str, "niveau": "BEGINNER|INTERMEDIATE|EXPERT"}]
        "langues":     langues,       # [{"langue": str,         "niveau": "BEGINNER|INTERMEDIATE|EXPERT"}]
        "experiences": experiences,   # [{"poste", "entreprise", "date_debut", "date_fin", ...}]
        "formations":  formations,    # [{"diplome", "etablissement", "date_debut", "date_fin", ...}]
    }
