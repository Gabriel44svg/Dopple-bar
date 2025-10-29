from fastapi import APIRouter, HTTPException
from database import get_db_connection
import json

router = APIRouter()

@router.get("/api/kds/orders", tags=["KDS"])
def get_orders_for_kds(station: str | None = None): # <-- Acepta un parámetro de estación
    """
    Obtiene las órdenes activas, filtrando los productos por estación si se especifica.
    Cumple con RF-141.
    """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)

        # La subconsulta de items ahora tiene un WHERE adicional para filtrar por estación
        query = """
            SELECT 
                o.order_id, o.order_folio, o.is_priority,
                IFNULL(t.table_name, 'Para Llevar') as table_name,
                COALESCE((
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT('detail_id', od.detail_id, 'name', p.name, 'quantity', od.quantity, 'notes', od.notes, 'status', od.status)
                    ) 
                    FROM order_details od
                    JOIN products p ON od.product_id = p.product_id
                    WHERE od.order_id = o.order_id AND (p.station = %s OR %s IS NULL)
                ), '[]') as items
            FROM orders o
            LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
            WHERE o.status = 'Abierta'
            ORDER BY o.is_priority DESC, o.created_at ASC;
        """
        cursor.execute(query, (station, station))

        # Filtra las órdenes que quedaron sin items después del filtro de estación
        orders = [order for order in cursor.fetchall() if len(json.loads(order['items'])) > 0]

        return orders
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/kds/orders/{order_id}/ready", tags=["KDS"])
def mark_order_as_ready(order_id: int):
    """
    Cambia el estado de una orden a 'Lista' y genera una alerta para el admin.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("UPDATE orders SET status = 'Lista' WHERE order_id = %s", (order_id,))
        cursor.execute("SELECT order_folio FROM orders WHERE order_id = %s", (order_id,))
        order = cursor.fetchone()
        if order:
            alert_message = f"¡Orden {order['order_folio']} lista para recoger!"
            cursor.execute("INSERT INTO alerts (alert_type, message) VALUES ('order_ready', %s)", (alert_message,))
        conn.commit()
        return {"message": "Orden marcada como lista."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar la orden: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.put("/api/kds/order-item/{detail_id}/status", tags=["KDS"])
def update_order_item_status(detail_id: int):
    """
    Actualiza el estado de un item específico a 'En Preparación'.
    Cumple con el requerimiento RF-137.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "UPDATE order_details SET status = 'En Preparación' WHERE detail_id = %s"
        cursor.execute(query, (detail_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item de la orden no encontrado.")
        conn.commit()
        return {"message": "Estado del item actualizado a 'En Preparación'."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar el estado del item: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.put("/api/kds/order-item/{detail_id}/ready", tags=["KDS"])
def mark_item_as_ready(detail_id: int):
    """
    Actualiza el estado de un item específico a 'Listo' y notifica al panel.
    Cumple con el requerimiento RF-138.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        query = "UPDATE order_details SET status = 'Listo' WHERE detail_id = %s"
        cursor.execute(query, (detail_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item de la orden no encontrado.")
        
        info_query = """
            SELECT p.name, o.order_folio 
            FROM order_details od 
            JOIN products p ON od.product_id = p.product_id
            JOIN orders o ON od.order_id = o.order_id
            WHERE od.detail_id = %s
        """
        cursor.execute(info_query, (detail_id,))
        info = cursor.fetchone()

        if info:
            alert_message = f"Producto listo: '{info['name']}' de la orden {info['order_folio']}."
            cursor.execute("INSERT INTO alerts (alert_type, message) VALUES ('item_ready', %s)", (alert_message,))

        conn.commit()
        return {"message": "Estado del item actualizado a 'Listo'."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar el estado del item: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.get("/api/kds/summary", tags=["KDS"])
def get_pending_items_summary():
    """
    Agrupa y cuenta todos los productos pendientes de todas las órdenes abiertas.
    Cumple con el requerimiento RF-139.
    """
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                p.name, 
                SUM(od.quantity) as total_pending
            FROM order_details od
            JOIN products p ON od.product_id = p.product_id
            JOIN orders o ON od.order_id = o.order_id
            WHERE o.status = 'Abierta' AND od.status = 'Pendiente'
            GROUP BY p.name
            ORDER BY total_pending DESC;
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.put("/api/kds/orders/{order_id}/prioritize", tags=["KDS"])
def prioritize_order(order_id: int):
    """
    Marca una orden como prioritaria. Cumple con RF-140.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET is_priority = 1 WHERE order_id = %s", (order_id,))
        conn.commit()
        return {"message": "Orden priorizada con éxito."}
    finally:
        if conn and conn.is_connected():
            conn.close()