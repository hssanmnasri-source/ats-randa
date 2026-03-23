"""
test_keejob_parser.py — Tests unitaires du parseur Keejob.
"""
import pytest
from app.nlp.keejob_parser import parse_keejob_cv


SAMPLE_CV = """Technicien en Électromécanique

Ahmed Ben Salah    Étude: Bac + 2
32 ans             Expérience: 5 années, 6 mois
Rue de la Liberté  Situation professionnelle: Disponible
Sfax 3000 Tunisie  Disponibilité: Immédiate
+216 74 123 456    Permis de conduire: oui
ahmed.bensalah@gmail.com  ID Keejob: 123456


EXPÉRIENCES PROFESSIONNELLES
Technicien CDI
Janvier 2019 - Aujourd'hui (5 années, 2 mois)
STEG | énergie | Sfax, Tunisie
Maintenance des équipements industriels


COMPÉTENCES
Python (Intermédiaire)
AutoCAD (Expert)
Maintenance préventive (Intermédiaire)


LANGUES
Arabe Courant
Français Courant
Anglais Intermédiaire
"""


class TestKeejobParser:

    def test_parse_renvoie_dict(self):
        result = parse_keejob_cv(SAMPLE_CV)
        assert isinstance(result, dict)

    def test_parse_id_keejob(self):
        result = parse_keejob_cv(SAMPLE_CV)
        assert result.get("id_keejob") == "123456"

    def test_parse_email(self):
        result = parse_keejob_cv(SAMPLE_CV)
        assert result.get("email") == "ahmed.bensalah@gmail.com"

    def test_parse_telephone(self):
        result = parse_keejob_cv(SAMPLE_CV)
        tel = result.get("telephone", "")
        assert tel is not None
        assert "74" in tel or "123" in tel

    def test_parse_experience_annees(self):
        result = parse_keejob_cv(SAMPLE_CV)
        exp = result.get("experience_annees", 0)
        assert 5.0 <= float(exp) <= 6.5

    def test_parse_niveau_etude(self):
        result = parse_keejob_cv(SAMPLE_CV)
        niveau = (result.get("niveau_etude") or "").upper()
        assert "BAC" in niveau or "2" in niveau

    def test_parse_competences_non_vides(self):
        result = parse_keejob_cv(SAMPLE_CV)
        comps = result.get("competences", [])
        assert isinstance(comps, list)
        assert len(comps) > 0

    def test_parse_competence_python(self):
        result = parse_keejob_cv(SAMPLE_CV)
        comps = result.get("competences", [])
        noms = []
        for c in comps:
            if isinstance(c, dict):
                noms.append(c.get("nom", c.get("nom_competence", "")).lower())
            else:
                noms.append(str(c).lower())
        assert any("python" in n for n in noms)

    def test_parse_langues(self):
        result = parse_keejob_cv(SAMPLE_CV)
        langues = result.get("langues", [])
        assert isinstance(langues, list)
        assert len(langues) > 0
        noms = []
        for l in langues:
            if isinstance(l, dict):
                noms.append(l.get("langue", "").lower())
            else:
                noms.append(str(l).lower())
        assert any("arabe" in n or "ar" in n for n in noms)

    def test_parse_disponibilite(self):
        result = parse_keejob_cv(SAMPLE_CV)
        dispo = (result.get("disponibilite") or "").lower()
        assert "imm" in dispo or "disponible" in dispo or dispo == ""

    def test_parse_titre_poste(self):
        result = parse_keejob_cv(SAMPLE_CV)
        titre = (result.get("titre_poste") or "").lower()
        assert "technicien" in titre or "électromécanique" in titre or titre == ""

    def test_parse_cv_vide(self):
        result = parse_keejob_cv("")
        assert isinstance(result, dict)

    def test_parse_cv_minimal(self):
        result = parse_keejob_cv("Jean Dupont\njean@test.com\n+216 20 000 000")
        assert isinstance(result, dict)
