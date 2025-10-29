# api/routers/users.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from passlib.context import CryptContext
from typing import List
import json

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    pin: str
    role_id: int

class User(BaseModel):
    user_id: int
    full_name: str
    email: str
    role_id: int
    is_active: bool

@router.get("/api/users", tags=["Users"], response_model=List[User])
def get_all_users():
    """ Obtiene una lista de todos los usuarios. """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, full_name, email, role_id, is_active FROM users")
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/users", tags=["Users"])
def create_user(user: UserCreate, created_by_user_id: int = 1): # Asumimos que el admin con ID 1 lo crea
    """ Crea un nuevo usuario y registra la acción en la bitácora de auditoría. """
    password_hash = pwd_context.hash(user.password)
    pin_hash = pwd_context.hash(user.pin)

    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO users (full_name, email, password_hash, pin_hash, role_id) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(query, (user.full_name, user.email, password_hash, pin_hash, user.role_id))

        # --- NUEVA LÓGICA DE AUDITORÍA (RF-92) ---
        audit_details = {
            "new_user_email": user.email,
            "new_user_role_id": user.role_id
        }
        cursor.execute("INSERT INTO audit_logs (user_id, action, details) VALUES (%s, %s, %s)",
                       (created_by_user_id, 'CREATE_USER', json.dumps(audit_details)))

        conn.commit()
        return {"message": "Usuario creado con éxito."}
    except Exception as e:
        conn.rollback()
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="El email ya está en uso.")
        raise HTTPException(status_code=500, detail=f"Error al crear el usuario: {e}")
    finally:
        if conn and conn.is_connected(): conn.close()