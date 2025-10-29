# api/routers/customers.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from typing import List

router = APIRouter()

class Customer(BaseModel):
    full_name: str
    phone: str | None = None
    email: str | None = None

@router.get("/api/customers", tags=["CRM"])
def get_all_customers():
    """ Obtiene una lista de todos los clientes. """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM customers ORDER BY full_name")
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/customers", tags=["CRM"])
def create_customer(customer: Customer):
    """ Crea un nuevo perfil de cliente. Cumple con RF-142. """
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO customers (full_name, phone, email) VALUES (%s, %s, %s)"
        cursor.execute(query, (customer.full_name, customer.phone, customer.email))
        conn.commit()
        return {"message": "Cliente creado con éxito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear el cliente: {e}")
    finally:
        if conn and conn.is_connected(): conn.close()

@router.get("/api/customers/{customer_id}/history", tags=["CRM"])
def get_customer_history(customer_id: int):
    """
    Obtiene el historial de consumo de un cliente específico. Cumple con RF-144.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)

        # Consulta para obtener las órdenes del cliente
        query_orders = """
            SELECT order_id, order_folio, created_at
            FROM orders
            WHERE customer_id = %s AND status = 'Pagada'
            ORDER BY created_at DESC;
        """
        cursor.execute(query_orders, (customer_id,))
        orders = cursor.fetchall()

        # Para cada orden, obtener los productos que compró
        for order in orders:
            query_items = """
                SELECT p.name, od.quantity, od.price_at_time_of_order
                FROM order_details od
                JOIN products p ON od.product_id = p.product_id
                WHERE od.order_id = %s;
            """
            cursor.execute(query_items, (order['order_id'],))
            order['items'] = cursor.fetchall()

        return orders
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.delete("/api/customers/{customer_id}", tags=["CRM"])
def delete_customer(customer_id: int):
    """
    Elimina un perfil de cliente, desvinculándolo de sus órdenes pasadas.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()

        # 1. Desvincular al cliente de todas sus órdenes (pone customer_id a NULL)
        #    Esto preserva el historial de ventas.
        cursor.execute("UPDATE orders SET customer_id = NULL WHERE customer_id = %s", (customer_id,))

        # 2. Ahora, eliminar al cliente de la tabla de clientes
        cursor.execute("DELETE FROM customers WHERE customer_id = %s", (customer_id,))

        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")

        return {"message": "Cliente eliminado con éxito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar el cliente: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.get("/api/customers/{customer_id}/tags", tags=["CRM"])
def get_customer_tags(customer_id: int):
    """ Obtiene las etiquetas de un cliente específico. """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT t.tag_id, t.tag_name 
            FROM customer_tags ct
            JOIN tags t ON ct.tag_id = t.tag_id
            WHERE ct.customer_id = %s;
        """
        cursor.execute(query, (customer_id,))
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/customers/{customer_id}/tags", tags=["CRM"])
def add_tag_to_customer(customer_id: int, tag: dict):
    """ Añade una etiqueta a un cliente. Si la etiqueta no existe, la crea. """
    tag_name = tag.get("tag_name")
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        # Revisa si la etiqueta ya existe, si no, la crea
        cursor.execute("SELECT tag_id FROM tags WHERE tag_name = %s", (tag_name,))
        tag_record = cursor.fetchone()
        if not tag_record:
            cursor.execute("INSERT INTO tags (tag_name) VALUES (%s)", (tag_name,))
            tag_id = cursor.lastrowid
        else:
            tag_id = tag_record['tag_id']

        # Asocia la etiqueta al cliente, ignorando si ya existe la relación
        cursor.execute("INSERT IGNORE INTO customer_tags (customer_id, tag_id) VALUES (%s, %s)", (customer_id, tag_id))
        conn.commit()
        return {"message": "Etiqueta añadida."}
    finally:
        if conn and conn.is_connected(): conn.close()