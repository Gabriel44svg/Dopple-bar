# api/routers/purchase_orders.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from typing import List

router = APIRouter()

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    created_by_user_id: int

class PurchaseOrderItem(BaseModel):
    supply_id: int
    quantity: float
    cost: float

@router.get("/api/purchase-orders", tags=["Inventory"])
def get_purchase_orders():
    """ Obtiene una lista de todas las órdenes de compra. """
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT po.*, s.name as supplier_name
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.supplier_id
            ORDER BY po.order_date DESC;
        """
        cursor.execute(query)
        results = cursor.fetchall()
        return results if results else []
    except Exception as e:
        print(f"Error al obtener órdenes de compra: {e}")
        return []
    finally:
        if conn and conn.is_connected():
            conn.close()
            
@router.post("/api/purchase-orders", tags=["Inventory"])
def create_purchase_order_header(order: PurchaseOrderCreate):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO purchase_orders (supplier_id, created_by_user_id, status) VALUES (%s, %s, 'Pendiente')"
        cursor.execute(query, (order.supplier_id, order.created_by_user_id))
        conn.commit()
        return {"po_id": cursor.lastrowid}
    finally:
        if conn and conn.is_connected(): conn.close()

@router.get("/api/purchase-orders/{po_id}", tags=["Inventory"])
def get_purchase_order_details(po_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT po.*, s.name as supplier_name FROM purchase_orders po JOIN suppliers s ON po.supplier_id = s.supplier_id WHERE po.po_id = %s", (po_id,))
        order_details = cursor.fetchone()
        if not order_details: raise HTTPException(status_code=404, detail="Orden no encontrada.")
        cursor.execute("SELECT poi.*, s.name as supply_name FROM purchase_order_items poi JOIN supplies s ON poi.supply_id = s.supply_id WHERE poi.po_id = %s", (po_id,))
        order_details["items"] = cursor.fetchall()
        return order_details
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/purchase-orders/{po_id}/items", tags=["Inventory"])
def add_item_to_purchase_order(po_id: int, item: PurchaseOrderItem):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO purchase_order_items (po_id, supply_id, quantity, cost) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (po_id, item.supply_id, item.quantity, item.cost))
        conn.commit()
        return {"po_item_id": cursor.lastrowid}
    finally:
        if conn and conn.is_connected(): conn.close()

        # Al final de api/routers/purchase_orders.py

@router.post("/api/purchase-orders/{po_id}/receive", tags=["Inventory"])
def receive_purchase_order(po_id: int):
    """
    Marca una orden de compra como 'Recibida' y actualiza el stock. Cumple con RF-119.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)

        # 1. Obtener todos los insumos de la orden de compra
        cursor.execute("SELECT supply_id, quantity FROM purchase_order_items WHERE po_id = %s", (po_id,))
        items_to_receive = cursor.fetchall()

        if not items_to_receive:
            raise HTTPException(status_code=400, detail="La orden de compra no tiene insumos para recibir.")

        # 2. Actualizar el stock por cada insumo
        for item in items_to_receive:
            # Suma la cantidad al stock actual del insumo
            cursor.execute("UPDATE supplies SET current_stock = current_stock + %s WHERE supply_id = %s", (item['quantity'], item['supply_id']))
            # Opcional: Registrar el movimiento de 'Entrada' en la bitácora
            move_query = "INSERT INTO stock_movements (supply_id, movement_type, quantity_change, reason) VALUES (%s, 'Entrada', %s, %s)"
            cursor.execute(move_query, (item['supply_id'], item['quantity'], f"Recepción de Orden de Compra #{po_id}"))

        # 3. Actualizar el estado de la orden de compra
        cursor.execute("UPDATE purchase_orders SET status = 'Recibida' WHERE po_id = %s", (po_id,))

        conn.commit()
        return {"message": "Mercancía recibida y stock actualizado con éxito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al recibir la mercancía: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()