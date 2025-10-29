# api/routers/attendance.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from passlib.context import CryptContext
import datetime
from fastapi.responses import StreamingResponse
import io
import csv


router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ClockInOut(BaseModel):
    pin: str

class AttendanceRecordUpdate(BaseModel):
    clock_in: datetime.datetime
    clock_out: datetime.datetime | None = None
    justification: str

@router.post("/api/attendance/clock-in-out", tags=["Personnel"])
def clock_in_out(clock_data: ClockInOut):
    """
    Registra la entrada o salida de un empleado validando su PIN.
    Cumple con RF-39.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")

    try:
        cursor = conn.cursor(dictionary=True)

        # Busca a todos los usuarios para encontrar el PIN coincidente
        cursor.execute("SELECT user_id, pin_hash FROM users WHERE is_active = 1")
        users = cursor.fetchall()

        found_user = None
        for user in users:
            if pwd_context.verify(clock_data.pin, user["pin_hash"]):
                found_user = user
                break

        if not found_user:
            raise HTTPException(status_code=401, detail="PIN incorrecto.")

        user_id = found_user["user_id"]

        # Revisa si hay un registro de asistencia abierto
        query_open_record = "SELECT record_id FROM attendance_records WHERE user_id = %s AND clock_out IS NULL"
        cursor.execute(query_open_record, (user_id,))
        open_record = cursor.fetchone()

        if open_record:
            # Si hay un registro abierto, lo cierra (Salida)
            record_id = open_record["record_id"]
            cursor.execute("UPDATE attendance_records SET clock_out = NOW() WHERE record_id = %s", (record_id,))
            message = "Salida registrada con éxito."
        else:
            # Si no hay registro abierto, crea uno nuevo (Entrada)
            cursor.execute("INSERT INTO attendance_records (user_id, clock_in) VALUES (%s, NOW())", (user_id,))
            message = "Entrada registrada con éxito."

        conn.commit()
        return {"message": message}
    finally:
        conn.close()

@router.get("/api/attendance/report", tags=["Personnel"])
def get_attendance_report(start_date: datetime.date, end_date: datetime.date, user_id: int | None = None):
    """
    Obtiene los registros de asistencia para un rango de fechas y un usuario opcional.
    Cumple con RF-43.
    """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT ar.record_id, ar.user_id, u.full_name, ar.clock_in, ar.clock_out
            FROM attendance_records ar
            JOIN users u ON ar.user_id = u.user_id
            WHERE DATE(ar.clock_in) BETWEEN %s AND %s
        """
        params = [start_date, end_date]

        if user_id:
            query += " AND ar.user_id = %s"
            params.append(user_id)

        query += " ORDER BY ar.clock_in DESC"
        cursor.execute(query, tuple(params))
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

# --- NUEVA FUNCIÓN PARA EXPORTAR A CSV (RF-46) ---
@router.get("/api/attendance/report/export", tags=["Personnel"])
def export_attendance_report(start_date: str, end_date: str, user_id: int | None = None):
    """
    Exporta el reporte de asistencia a un archivo CSV.
    """
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)

        # Reutiliza la misma lógica de consulta que el reporte normal
        query = "SELECT u.full_name, ar.clock_in, ar.clock_out FROM attendance_records ar JOIN users u ON ar.user_id = u.user_id WHERE DATE(ar.clock_in) BETWEEN %s AND %s"
        params = [start_date, end_date]
        if user_id:
            query += " AND ar.user_id = %s"
            params.append(user_id)
        cursor.execute(query, tuple(params))
        records = cursor.fetchall()

        # Crea el archivo CSV en memoria
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Empleado', 'Entrada', 'Salida', 'Horas Trabajadas']) # Cabecera

        for rec in records:
            hours_worked = 'N/A'
            if rec['clock_out']:
                diff = rec['clock_out'] - rec['clock_in']
                hours_worked = round(diff.total_seconds() / 3600, 2)
            writer.writerow([rec['full_name'], rec['clock_in'], rec['clock_out'], hours_worked])

        output.seek(0)

        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=reporte_asistencia_{start_date}_a_{end_date}.csv"}
        )
    finally:
        if conn and conn.is_connected(): conn.close()