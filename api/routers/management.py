# api/routers/management.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection

router = APIRouter()

class Reason(BaseModel):
    reason_text: str

@router.get("/api/management/cancellation-reasons", tags=["Management"])
def get_cancellation_reasons():
    """ Obtiene todos los motivos de cancelación. """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM cancellation_reasons WHERE is_active = 1 ORDER BY reason_text")
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/management/cancellation-reasons", tags=["Management"])
def create_cancellation_reason(reason: Reason):
    """ Crea un nuevo motivo de cancelación. """
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO cancellation_reasons (reason_text) VALUES (%s)", (reason.reason_text,))
        conn.commit()
        return {"message": "Motivo creado con éxito."}
    finally:
        if conn and conn.is_connected(): conn.close()