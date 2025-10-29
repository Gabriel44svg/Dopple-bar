# api/routers/audit.py
from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter()

@router.get("/api/audit-logs", tags=["Auditing"])
def get_audit_logs():
    """
    Obtiene todos los registros de la bitácora de auditoría.
    Cumple con el requerimiento RF-94.
    """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        # Unimos con la tabla de usuarios para obtener el nombre de quién realizó la acción
        query = """
            SELECT al.log_id, al.action, al.details, al.log_timestamp, u.full_name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.user_id
            ORDER BY al.log_timestamp DESC;
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()