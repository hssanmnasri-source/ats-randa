"""
seed_admin.py — Create the default admin user.

Usage (inside Docker):
    docker exec ats_backend python /app/scripts/seed_admin.py
"""
import asyncio
import sys

sys.path.insert(0, '/app')

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.db_models import User, UserRole
from sqlalchemy import select


async def main():
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(
            select(User).where(User.email == 'admin@randa.tn')
        )).scalar_one_or_none()

        if existing:
            print('Admin already exists:', existing.email)
            return

        db.add(User(
            email='admin@randa.tn',
            hashed_pwd=hash_password('Admin2024'),
            nom='Admin',
            prenom='RANDA',
            role=UserRole.ADMIN,
            is_active=True,
        ))
        await db.commit()
        print('Admin created successfully — email: admin@randa.tn / password: Admin2024')


asyncio.run(main())
