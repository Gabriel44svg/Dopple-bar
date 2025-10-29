# api/routers/settings.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from typing import Dict

router = APIRouter()

@router.get("/api/settings", tags=["Public Website"])
def get_settings():
    """ Obtiene todas las configuraciones del negocio. """
    conn = get_db_connection()
    if not conn: return {}
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT setting_key, setting_value FROM settings")
        settings_dict = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
        return settings_dict
    finally:
        if conn and conn.is_connected(): conn.close()

# --- NUEVA FUNCIÓN PARA ACTUALIZAR (RF-03 y RF-06) ---
@router.put("/api/settings", tags=["Admin"])
def update_settings(settings: Dict[str, str]):
    """
    Actualiza múltiples valores de configuración en la base de datos.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        # Itera sobre cada clave y valor enviado para actualizarlo
        for key, value in settings.items():
            # Se usa INSERT ... ON DUPLICATE KEY UPDATE para insertar si no existe, o actualizar si ya existe.
            query = "INSERT INTO settings (setting_key, setting_value) VALUES (%s, %s) ON DUPLICATE KEY UPDATE setting_value = %s"
            cursor.execute(query, (key, value, value))

        conn.commit()
        return {"message": "Configuración guardada con éxito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar la configuración: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()