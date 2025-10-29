# api/routers/suppliers.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from typing import List

router = APIRouter()

class Supplier(BaseModel):
    name: str
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None

@router.get("/api/suppliers", tags=["Inventory"])
def get_all_suppliers():
    """ Obtiene todos los proveedores """
    conn = get_db_connection()
    if not conn:
        return [] # Devuelve una lista vacía si la conexión falla
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM suppliers ORDER BY name")
        results = cursor.fetchall()
        return results if results else [] # Devuelve los resultados, o una lista vacía si no hay
    except Exception as e:
        print(f"Error al obtener proveedores: {e}")
        return [] # También devuelve lista vacía en caso de error
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.post("/api/suppliers", tags=["Inventory"])
def create_supplier(supplier: Supplier):
    """ Crea un nuevo proveedor """
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO suppliers (name, contact_person, phone, email) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (supplier.name, supplier.contact_person, supplier.phone, supplier.email))
        conn.commit()
        return {"message": "Proveedor creado con éxito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear el proveedor: {e}")
    finally:
        conn.close()