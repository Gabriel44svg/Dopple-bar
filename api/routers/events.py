# api/routers/events.py
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from database import get_db_connection
import datetime
import shutil
import os
from typing import Optional

router = APIRouter()

class Event(BaseModel):
    title: str
    description: str | None = None
    event_date: datetime.date

@router.get("/api/events", tags=["Events"])
def get_active_events():
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM events WHERE status = 'Activo' AND event_date >= CURDATE() ORDER BY event_date ASC;"
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/events", tags=["Events"])
async def create_event(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    event_date: datetime.date = Form(...),
    file: Optional[UploadFile] = File(None)
):
    """
    Crea un nuevo evento, validando la fecha y subiendo una imagen de portada opcional.
    """
    if event_date < datetime.date.today():
        raise HTTPException(status_code=400, detail="La fecha del evento no puede ser en el pasado.")

    cover_image_path = None
    if file:
        upload_folder = "static/images/events"
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        file_path = os.path.join(upload_folder, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        cover_image_path = f"/{file_path.replace(os.path.sep, '/')}"

    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO events (title, description, event_date, cover_image_path, status) VALUES (%s, %s, %s, %s, 'Activo')"
        cursor.execute(query, (title, description, event_date, cover_image_path))
        conn.commit()
        return {"message": "Evento creado con éxito."}
    finally:
        if conn and conn.is_connected(): conn.close()

@router.delete("/api/events/{event_id}", tags=["Events"])
def delete_event(event_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")

    try:
        cursor = conn.cursor()
        query = "DELETE FROM events WHERE event_id = %s"
        cursor.execute(query, (event_id,))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Evento no encontrado.")

        return {"message": f"Evento {event_id} eliminado con éxito."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando evento: {str(e)}")
    finally:
        if conn and conn.is_connected():
            conn.close()
