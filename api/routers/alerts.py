# api/routers/alerts.py
from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter()

@router.get("/api/alerts/unread", tags=["Alerts"])
def get_unread_alerts():
    """ Obtiene todas las alertas no leídas. """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM alerts WHERE is_read = 0 ORDER BY created_at DESC")
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.put("/api/alerts/{alert_id}/read", tags=["Alerts"])
def mark_alert_as_read(alert_id: int):
    """ Marca una alerta como leída. """
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET is_read = 1 WHERE alert_id = %s", (alert_id,))
        conn.commit()
        return {"message": "Alerta marcada como leída."}
    finally:
        if conn and conn.is_connected(): conn.close()