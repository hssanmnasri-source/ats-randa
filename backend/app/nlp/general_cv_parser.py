"""
general_cv_parser.py
Parseur généraliste pour CVs candidats (format libre / OCR).

Extrait un sous-ensemble d'entités depuis du texte brut :
  email, téléphone, titre_poste, niveau_etude,
  resume, langues, compétences, expériences, adresse.

Conçu pour les CVs Tunisiens en français / arabe / anglais.
"""
from __future__ import annotations

import re
from typing import Optional

# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


# ── Contact ───────────────────────────────────────────────────────────────────

def _extract_email(text: str) -> Optional[str]:
    m = re.search(r"[\w.+\-]+@[\w\-]+\.[\w.]+", text)
    return m.group(0).lower() if m else None


def _extract_phone(text: str) -> Optional[str]:
    patterns = [
        r"\+216\s*\d{2}\s*\d{3}\s*\d{3}",
        r"\+216\s*\d{8}",
        r"(?<!\d)[2-9]\d{7}(?!\d)",   # 8-digit TN number not embedded in longer sequence
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return re.sub(r"\s+", " ", m.group(0)).strip()
    return None


# ── Niveau d'étude ────────────────────────────────────────────────────────────

_ETUDE_PATTERNS: list[tuple[str, str]] = [
    (r"doctorat|ph\.?d", "Doctorat"),
    (r"master\b|m\.?sc\b|m2\b|bac\s*\+?\s*5|bac\+5|ing[ée]nieur\b|ing[ée]nierie\b|grande\s+[ée]cole", "BAC+5"),
    (r"bac\s*\+?\s*4|bac\+4", "BAC+4"),
    (r"licence\b|bachelor\b|bac\s*\+?\s*3|bac\+3|l3\b|deug\b|deust\b", "BAC+3"),
    (r"bac\s*\+?\s*2|bac\+2|dut\b|bts\b|d\.?u\.?t", "BAC+2"),
    (r"\bbac[a-zéèêëàâùûîï]{0,12}\b|terminale\b", "BAC"),
]

def _extract_niveau_etude(text: str) -> Optional[str]:
    tl = text.lower()
    for pat, val in _ETUDE_PATTERNS:
        if re.search(pat, tl):
            return val
    return None


# ── Langues ───────────────────────────────────────────────────────────────────

_LANGUES_NAMES: dict[str, str] = {
    "arabe": "Arabe",
    "arabic": "Arabe",
    "français": "Français",
    "francais": "Français",
    "french": "Français",
    "anglais": "Anglais",
    "english": "Anglais",
    "espagnol": "Espagnol",
    "spanish": "Espagnol",
    "allemand": "Allemand",
    "german": "Allemand",
    "deutsch": "Allemand",
    "italien": "Italien",
    "italian": "Italien",
    "turc": "Turc",
    "turkish": "Turc",
}

_LANGUE_LEVEL_MAP: dict[str, str] = {
    "a1": "Débutant",  "a2": "Débutant",
    "b1": "Intermédiaire", "b2": "Courant",
    "c1": "Bilingue",  "c2": "Langue maternelle",
    "débutant": "Débutant",   "debutant": "Débutant",   "notions": "Débutant",
    "intermédiaire": "Intermédiaire", "intermediaire": "Intermédiaire",
    "courant": "Courant",     "bien": "Courant",         "correct": "Courant",
    "avancé": "Bilingue",     "avance": "Bilingue",
    "bilingue": "Bilingue",   "courant": "Courant",
    "maternelle": "Langue maternelle", "natif": "Langue maternelle",
}

def _extract_langues(text: str) -> list[dict]:
    langues: list[dict] = []
    seen: set[str] = set()
    for line in text.split("\n"):
        ll = line.lower()
        for key, val in _LANGUES_NAMES.items():
            if key in ll and val not in seen:
                niveau = None
                for lk, lv in _LANGUE_LEVEL_MAP.items():
                    if lk in ll:
                        niveau = lv
                        break
                seen.add(val)
                langues.append({"langue": val, "niveau": niveau or "Intermédiaire"})
    return langues


# ── Compétences ───────────────────────────────────────────────────────────────

_TECH_SKILLS: set[str] = {
    # Languages
    "python", "java", "javascript", "typescript", "php", "ruby", "swift",
    "kotlin", "go", "rust", "r", "matlab", "scala", "perl", "c++", "c#",
    # Frameworks & libs
    "spring boot", "spring", "angular", "react", "vue", "django", "flask",
    "fastapi", "laravel", "symfony", "express", "node.js", "nodejs",
    "javafx", "flutter", "hibernate", "jquery", "tensorflow", "pytorch",
    "scikit-learn", "pandas", "numpy",
    # Databases
    "mysql", "postgresql", "postgres", "mongodb", "oracle", "sql server",
    "sqlite", "redis", "elasticsearch", "cassandra", "mariadb",
    # DevOps / Cloud
    "git", "docker", "kubernetes", "jenkins", "maven", "gradle",
    "linux", "windows", "aws", "azure", "gcp", "ci/cd",
    # Web
    "html", "css", "bootstrap", "tailwind", "rest", "graphql", "api",
    "uml", "agile", "scrum", "jira", "trello",
    # Data / AI
    "machine learning", "deep learning", "nlp", "data science", "powerbi",
    "tableau", "excel", "word", "powerpoint",
}

_SKILL_DISPLAY: dict[str, str] = {
    "c++": "C++", "c#": "C#", "node.js": "Node.js", "nodejs": "Node.js",
    "css": "CSS", "html": "HTML", "api": "API", "sql server": "SQL Server",
    "rest": "REST", "ci/cd": "CI/CD", "gcp": "GCP", "aws": "AWS",
    "aws": "AWS", "nlp": "NLP",
}

def _extract_competences(text: str) -> list[str]:
    tl = text.lower()
    found: list[str] = []
    seen: set[str] = set()

    # 1. Detect well-known tech skills in the full text
    for skill in sorted(_TECH_SKILLS, key=len, reverse=True):
        if re.search(r"(?<![a-z])" + re.escape(skill) + r"(?![a-z])", tl):
            display = _SKILL_DISPLAY.get(skill, skill.title())
            if display not in seen:
                seen.add(display)
                found.append(display)

    # 2. Extract bullet-point items in the competences section
    sec_m = re.search(
        r"(?:comp[ée]tences?|skills?)[^\n]*\n((?:(?:[*\-•]|[A-ZÁÀÂÄÉÈÊËÎÏÔÖÙÛÜ0-9])[^\n]{1,60}\n?){1,30})",
        text, re.IGNORECASE,
    )
    if sec_m:
        for raw_line in sec_m.group(1).split("\n"):
            line = re.sub(r"^[*\-•\s]+", "", raw_line).strip()
            line = _clean(line)
            if 2 < len(line) < 50 and line not in seen and not re.search(r"[@/\\]", line):
                # Skip likely noise
                if not re.match(r"^[a-z0-9.,:;\s]{1,4}$", line.lower()):
                    seen.add(line)
                    if line not in found:
                        found.append(line)

    return found[:20]


# ── Expériences ───────────────────────────────────────────────────────────────

_DATE_RANGE = re.compile(
    r"(\d{4}|\w+\s+\d{4})"
    r"\s*[-–—]\s*"
    r"(\d{4}|\w+\s+\d{4}|aujourd[''h]ui|en\s*cours|actuel|pr[ée]sent)",
    re.IGNORECASE,
)

# Explicit patterns for job entries that are reliable even in OCR-noisy text
_STAGE_EXPLICIT = re.compile(
    r"stage\s+(?:en|chez|à|au|dans|de)\s+([A-Za-zÀ-ÿ0-9][^,\n]{2,60})",
    re.IGNORECASE,
)
_JOB_CHEZ = re.compile(
    r"([A-Za-zÀ-ÿ][^@\n]{3,50}?)\s+chez\s+([A-Za-zÀ-ÿ0-9][^,\n]{2,60})",
    re.IGNORECASE,
)
_EXP_SECTION = re.compile(
    r"exp[ée]riences?\s*(?:professionnelles?)?|parcours\s+professionnel|"
    r"work\s+experience|emploi",
    re.IGNORECASE,
)
_NEXT_SECTION = re.compile(
    r"\n(?:comp[ée]tences?|langues?|formations?|[ée]ducation|projets?|"
    r"loisirs?|int[ée]r[êe]ts?|certif|r[ée]f[ée]rences?)\b",
    re.IGNORECASE,
)

def _extract_experiences(text: str) -> list[dict]:
    experiences: list[dict] = []
    seen: set[str] = set()

    def _add(poste: str, entreprise: Optional[str],
             date_debut: Optional[str] = None, date_fin: Optional[str] = None,
             is_current: bool = False) -> None:
        poste = _clean(poste)[:100]
        key = poste.lower()[:30]
        if poste and len(poste) > 3 and key not in seen:
            seen.add(key)
            experiences.append({
                "poste": poste,
                "entreprise": _clean(entreprise)[:100] if entreprise else None,
                "date_debut": date_debut,
                "date_fin": date_fin,
                "is_current": is_current,
                "description": None,
            })

    # ── Strategy 1: explicit "Stage en/chez [Company]" anywhere in text ──────
    for m in _STAGE_EXPLICIT.finditer(text):
        company = _clean(m.group(1).split("\n")[0])
        # Find a date range in surrounding text (±100 chars)
        ctx = text[max(0, m.start()-100):m.end()+100]
        dm = _DATE_RANGE.search(ctx)
        dd, df, ic = None, None, False
        if dm:
            dd = dm.group(1)
            raw = dm.group(2).lower()
            if re.search(r"cours|actuel|pr[ée]sent|aujourd", raw):
                ic = True
            else:
                df = dm.group(2)
        _add(f"Stage en {company}", None, dd, df, ic)

    # ── Strategy 2: "[Role] chez [Company]" pattern ───────────────────────────
    for m in _JOB_CHEZ.finditer(text):
        role    = _clean(m.group(1))
        company = _clean(m.group(2).split("\n")[0])
        # Skip if role looks like mid-sentence (contains article/preposition clues
        # or doesn't start with a capital / known job keyword)
        if len(role) < 4 or len(role) > 60:
            continue
        if re.search(r"\b(?:de|du|des|le|la|les|mon|ma|mes|un|une|et|ou|"
                     r"dans|par|sur|pour|avec|ce|cet|cette)\b", role.lower()[:20]):
            continue
        if not role[0].isupper():
            continue
        ctx = text[max(0, m.start()-100):m.end()+100]
        dm = _DATE_RANGE.search(ctx)
        dd, df, ic = None, None, False
        if dm:
            dd = dm.group(1)
            raw = dm.group(2).lower()
            if re.search(r"cours|actuel|pr[ée]sent|aujourd", raw):
                ic = True
            else:
                df = dm.group(2)
        _add(role, company, dd, df, ic)

    # ── Strategy 3: date-range lines in experience section ───────────────────
    sec_m = _EXP_SECTION.search(text)
    if sec_m:
        exp_text = text[sec_m.end():]
        next_m = _NEXT_SECTION.search(exp_text)
        if next_m:
            exp_text = exp_text[:next_m.start()]

        lines = exp_text.split("\n")
        for i, line in enumerate(lines):
            line = _clean(line)
            if not line or len(line) > 120:   # skip noise / merged OCR lines
                continue
            dm = _DATE_RANGE.search(line)
            if not dm:
                continue
            dd = dm.group(1)
            raw = dm.group(2).lower()
            ic = bool(re.search(r"cours|actuel|pr[ée]sent|aujourd", raw))
            df = None if ic else dm.group(2)
            rest = _DATE_RANGE.sub("", line).strip(" -–—|,")
            parts = [p.strip() for p in re.split(r"(?:chez|@)|[|,;]", rest) if p.strip()]
            poste = parts[0] if parts else rest
            ent   = parts[1] if len(parts) > 1 else None
            _add(poste, ent, dd, df, ic)

    return experiences[:10]


# ── Résumé ────────────────────────────────────────────────────────────────────

def _extract_resume(text: str) -> Optional[str]:
    m = re.search(
        r"(?:profil|r[ée]sum[ée]|objective|about\s+me|pr[ée]sentation)"
        r"[^\n]{0,30}\n((?:[^\n]+\n?){1,10})",
        text, re.IGNORECASE,
    )
    if m:
        raw = _clean(m.group(1))
        if len(raw) > 40:
            return raw[:800]
    return None


# ── Titre du poste ────────────────────────────────────────────────────────────

_TITRE_KW = re.compile(
    r"d[ée]veloppeur|developpeur|ing[ée]nieur|technicien|analyste|"
    r"consultant|manager|directeur|chef|responsable|designer|architecte|"
    r"administrateur|[ée]tudiant|etudiant|stagiaire|data\s+scientist|"
    r"devops|fullstack|full[\s\-]stack|frontend|back[\s\-]?end|"
    r"comptable|commercial|r\.?h\b",
    re.IGNORECASE,
)

def _extract_titre_poste(text: str) -> Optional[str]:
    lines = [_clean(l) for l in text.split("\n") if _clean(l)]
    # 1. First line matching a title keyword
    for line in lines[:20]:
        if _TITRE_KW.search(line) and len(line) < 80:
            return line
    # 2. Fallback: first substantive line
    for line in lines[:10]:
        if len(line) > 5 and not re.match(r"^[a-z0-9 .=\-]{1,6}$", line.lower()):
            return line
    return None


# ── Adresse ───────────────────────────────────────────────────────────────────

_TN_CITIES = re.compile(
    r"tunis|ben\s*arous|ariana|manouba|sfax|sousse|monastir|"
    r"bizerte|nabeul|m[ée]denine|gabes|gafsa|sidi\s*bouzid|"
    r"kasserine|kairouan|siliana|zaghouan|jedida|bardo|hammam",
    re.IGNORECASE,
)

def _extract_adresse(text: str) -> Optional[str]:
    for line in text.split("\n"):
        line = _clean(line)
        if not _TN_CITIES.search(line) or len(line) > 100:
            continue
        m = _TN_CITIES.search(line)
        # Stop at city end + short postcode/region suffix, before any verb/capital word
        candidate = line[:m.end() + 20].strip(" ,")
        # Cut at the first word that looks like a new sentence (capital + verb/article)
        cut = re.search(r"\s+(?:Un|Le|La|Les|Au|Du|De|Des|En|Et|Ou|Je|Il|Elle|"
                        r"Nous|Vous|On|Ce|Sa|Son|Ses|Mon|Ma|Mes|Pour|Par|Sur)\b",
                        candidate)
        if cut:
            candidate = candidate[:cut.start()].strip(" ,")
        if len(candidate) > 4:
            return candidate
    return None


# ── Main entry point ──────────────────────────────────────────────────────────

def parse_cv_text(text: str) -> dict:
    """
    Parse raw OCR text from a candidate CV → cv_entities-compatible dict.
    Returns an empty dict if text is blank.
    """
    if not text or not text.strip():
        return {}

    entities: dict = {}

    # Contact
    email = _extract_email(text)
    if email:
        entities["email"] = email
        # Heuristic: derive first/last name from email local part
        local = email.split("@")[0]
        parts = re.split(r"[._\-]", local)
        # Strip trailing digits from each part (e.g. "mnasri007" → "mnasri")
        alpha_parts = [re.sub(r'\d+$', '', p) for p in parts]
        alpha_parts = [p for p in alpha_parts if p.isalpha() and len(p) > 1]
        if len(alpha_parts) >= 2:
            entities.setdefault("prenom", alpha_parts[0].capitalize())
            entities.setdefault("nom",    alpha_parts[1].capitalize())

    phone = _extract_phone(text)
    if phone:
        entities["telephone"] = phone

    adresse = _extract_adresse(text)
    if adresse:
        entities["adresse"] = adresse

    # Professional identity
    titre = _extract_titre_poste(text)
    if titre:
        entities["titre_poste"] = titre

    niveau = _extract_niveau_etude(text)
    if niveau:
        entities["niveau_etude"] = niveau

    resume = _extract_resume(text)
    if resume:
        entities["resume"] = resume

    # Skills & languages
    langues = _extract_langues(text)
    if langues:
        entities["langues"] = langues

    competences = _extract_competences(text)
    if competences:
        entities["competences"] = [
            {"nom_competence": c, "niveau": "INTERMEDIATE"} for c in competences
        ]

    # Experience
    experiences = _extract_experiences(text)
    if experiences:
        entities["experiences"] = experiences

    return entities
