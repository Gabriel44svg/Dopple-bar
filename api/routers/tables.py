# api/routers/tables.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from typing import List

router = APIRouter()

class Table(BaseModel):
    table_id: int
    table_name: str
    status: str

class TableCreate(BaseModel):
    table_name: str

class TableStatusUpdate(BaseModel):
    status: str

# --- ESTA ES LA FUNCIÓN QUE FALTA O ESTÁ INCORRECTA ---
@router.get("/api/tables", tags=["Tables"], response_model=List[Table])
def get_all_tables():
    """ Obtiene todas las mesas del restaurante y su estado. Cumple con RF-47. """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM restaurant_tables ORDER BY table_name;"
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/tables", tags=["Tables"])
def create_table(table: TableCreate):
    """ Crea una nueva mesa. """
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO restaurant_tables (table_name, status) VALUES (%s, 'Libre')", (table.table_name,))
        conn.commit()
        return {"message": "Mesa creada con éxito."}
    finally:
        if conn and conn.is_connected(): conn.close()

@router.put("/api/tables/{table_id}/status", tags=["Tables"])
def update_table_status(table_id: int, status_update: TableStatusUpdate):
    """ Actualiza el estado de una mesa manualmente. """
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE restaurant_tables SET status = %s WHERE table_id = %s", (status_update.status, table_id))
        conn.commit()
        return {"message": "Estado de la mesa actualizado."}
    finally:
        if conn and conn.is_connected(): conn.close()

@router.delete("/api/tables/{table_id}", tags=["Tables"])
def delete_table(table_id: int):
    """ Elimina una mesa. """
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM restaurant_tables WHERE table_id = %s", (table_id,))
        conn.commit()
        return {"message": "Mesa eliminada con éxito."}
    finally:
        if conn and conn.is_connected(): conn.close()