from pydantic import BaseModel, EmailStr

class RegisterIn(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str

class UserOut(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: str

    class Config:
        from_attributes = True