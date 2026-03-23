"""
test_security.py — Tests unitaires JWT + bcrypt.
"""
import pytest
from app.core.security import create_access_token, decode_token, hash_password, verify_password


class TestPasswordHashing:

    def test_hash_different_du_plain(self):
        plain = "monMotDePasse123"
        hashed = hash_password(plain)
        assert hashed != plain

    def test_verify_correct(self):
        plain = "monMotDePasse123"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_incorrect(self):
        hashed = hash_password("correct")
        assert verify_password("incorrect", hashed) is False

    def test_hash_unique_par_appel(self):
        plain = "samePassword"
        h1 = hash_password(plain)
        h2 = hash_password(plain)
        assert h1 != h2  # bcrypt salt différent à chaque appel


class TestJWT:

    def test_create_et_verifier_token(self):
        token = create_access_token({"sub": "42", "role": "CANDIDATE"})
        assert isinstance(token, str)
        assert len(token) > 10

    def test_token_contient_sub(self):
        token = create_access_token({"sub": "99", "role": "RH"})
        payload = decode_token(token)
        assert payload is not None
        assert payload.get("sub") == "99"

    def test_token_contient_role(self):
        token = create_access_token({"sub": "1", "role": "ADMIN"})
        payload = decode_token(token)
        assert payload.get("role") == "ADMIN"

    def test_token_invalide_retourne_none(self):
        result = decode_token("token.invalide.xxxx")
        assert result is None

    def test_token_expire_apres_delai(self):
        from datetime import timedelta
        from jose import jwt
        from app.core.config import settings
        # Créer token avec exp dans le passé
        payload = {"sub": "1", "exp": 1}  # epoch 1 = expired
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        result = decode_token(token)
        assert result is None
