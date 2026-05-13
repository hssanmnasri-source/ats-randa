from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.models.db_models import User, UserRole
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["OAuth Google"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
SCOPES = "openid email profile"

@router.get("/google/login")
async def google_login():
    import urllib.parse
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
    }
    auth_url = GOOGLE_AUTH_URL + "?" + urllib.parse.urlencode(params)
    return RedirectResponse(url=auth_url)

@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    import httpx
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
        )
        if token_response.status_code != 200:
            logger.error(f"Google token error: {token_response.text}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=google_auth_failed")
        token_data = token_response.json()

        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        if userinfo_response.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=google_profile_failed")
        google_user = userinfo_response.json()

    google_id   = google_user.get("id")
    email       = google_user.get("email", "").lower()
    given_name  = google_user.get("given_name", "")
    family_name = google_user.get("family_name", "")
    picture     = google_user.get("picture", "")

    if not email:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=no_email")

    result = await db.execute(
        select(User).where((User.email == email) | (User.google_id == google_id))
    )
    user = result.scalar_one_or_none()

    if user:
        if not user.google_id:
            user.google_id = google_id
        if picture and not user.avatar_url:
            user.avatar_url = picture
        user.auth_provider = "google"
        await db.commit()
        logger.info(f"Google login: existing user {email} ({user.role})")
    else:
        role = UserRole.CANDIDATE
        user = User(
            nom=family_name or "Google",
            prenom=given_name or email.split("@")[0],
            email=email,
            hashed_pwd="",
            role=role,
            google_id=google_id,
            avatar_url=picture,
            auth_provider="google",
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"Google login: new account {email} -> {role}")

    payload = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(payload)
    try:
        refresh_token = create_refresh_token(payload)
    except Exception:
        refresh_token = ""

    import urllib.parse
    redirect_url = (
        f"{settings.FRONTEND_URL}/auth/google/success"
        f"?access_token={urllib.parse.quote(access_token)}"
        f"&role={user.role.value}"
        f"&nom={urllib.parse.quote(user.nom or '')}"
        f"&prenom={urllib.parse.quote(user.prenom or '')}"
        f"&email={urllib.parse.quote(user.email or '')}"
        f"&avatar={urllib.parse.quote(user.avatar_url or '')}"
    )
    return RedirectResponse(url=redirect_url)
