from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
import datetime
from typing import List

router = APIRouter()

# --- Modelos de Datos para el POS ---
class NewOrder(BaseModel):
    table_id: int | None = None  # Permite órdenes sin mesa (para llevar)
    user_id: int
    is_training_mode: bool = False  # Nuevo campo opcional

class OrderItem(BaseModel):
    product_id: int
    quantity: int
    price_at_time_of_order: float
    notes: str | None = None
    is_training_mode: bool = False  # Nuevo campo opcional

class CloseOrder(BaseModel):
    payment_method: str
    amount: float
    applied_promos: List[dict] | None = []
    is_training_mode: bool = False  # Nuevo campo opcional

class CancelItem(BaseModel):
    reason: str
    user_id: int

class AssociateCustomer(BaseModel):
    customer_id: int

# --- Endpoints del POS ---

@router.post("/api/orders", tags=["POS"])
def create_new_order(order: NewOrder):
    """
    Crea una nueva orden, le asigna un folio y, si aplica, ocupa la mesa.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        if order.table_id:
            cursor.execute("UPDATE restaurant_tables SET status = 'Ocupada' WHERE table_id = %s", (order.table_id,))
        
        folio = f"ORD-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        query = "INSERT INTO orders (order_folio, table_id, user_id, status) VALUES (%s, %s, %s, 'Abierta')"
        cursor.execute(query, (folio, order.table_id, order.user_id))
        new_order_id = cursor.lastrowid
        
        # --- Control de entrenamiento ---
        if not order.is_training_mode:
            conn.commit()
        else:
            conn.rollback()
        
        cursor.execute("SELECT * FROM orders WHERE order_id = %s", (new_order_id,))
        created_order = cursor.fetchone()
        
        return created_order
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear la orden: {e}")
    finally:
        if conn and conn.is_connected(): conn.close()


@router.get("/api/orders/{order_id}/items", tags=["POS"])
def get_order_items(order_id: int):
    """ Obtiene todos los productos de una orden específica. """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT od.*, p.name, p.price FROM order_details od JOIN products p ON od.product_id = p.product_id WHERE od.order_id = %s;"
        cursor.execute(query, (order_id,))
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()


@router.post("/api/orders/{order_id}/items", tags=["POS"])
def add_item_to_order(order_id: int, item: OrderItem):
    """
    Añade un producto a una orden, verificando primero el stock de sus insumos.
    Cumple con RF-50 y RF-73.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)

        # --- NUEVA LÓGICA DE VERIFICACIÓN DE STOCK (RF-73) ---
        # 1. Obtener la receta del producto
        cursor.execute("SELECT supply_id, quantity_used FROM recipes WHERE product_id = %s", (item.product_id,))
        recipe_items = cursor.fetchall()

        # 2. Verificar el stock de cada insumo en la receta
        if recipe_items: # Solo verifica si el producto tiene receta
            for recipe_item in recipe_items:
                cursor.execute("SELECT name, current_stock FROM supplies WHERE supply_id = %s", (recipe_item['supply_id'],))
                supply = cursor.fetchone()
                if not supply or supply['current_stock'] < recipe_item['quantity_used']:
                    # Si un insumo no existe o no hay suficiente, se levanta un error
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente para preparar el producto. Falta: {supply['name'] if supply else 'Ingrediente desconocido'}")

        # 3. Si hay stock, se procede a añadir el producto a la orden
        query = "INSERT INTO order_details (order_id, product_id, quantity, price_at_time_of_order, notes) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(query, (order_id, item.product_id, item.quantity, item.price_at_time_of_order, item.notes))

        conn.commit()
        return {"detail_id": cursor.lastrowid, "message": "Producto añadido a la orden."}
    except HTTPException as http_exc:
        # Re-lanza la excepción HTTP para que el frontend la reciba
        raise http_exc
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al añadir producto: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.post("/api/orders/{order_id}/close", tags=["POS"])
def close_order(order_id: int, close_data: CloseOrder):
    """
    Registra un pago, cierra la orden, libera la mesa y descuenta el inventario.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Lógica de descuento de inventario
        cursor.execute("SELECT product_id, quantity FROM order_details WHERE order_id = %s", (order_id,))
        items_sold = cursor.fetchall()
        for item in items_sold:
            cursor.execute("SELECT supply_id, quantity_used FROM recipes WHERE product_id = %s", (item['product_id'],))
            recipe_items = cursor.fetchall()
            for recipe_item in recipe_items:
                quantity_to_decrement = recipe_item['quantity_used'] * item['quantity']

                # Actualizar stock del insumo
                cursor.execute(
                    "UPDATE supplies SET current_stock = current_stock - %s WHERE supply_id = %s",
                    (quantity_to_decrement, recipe_item['supply_id'])
                )

                # --- NUEVA LÓGICA PARA VERIFICAR STOCK (RF-70) ---
                cursor.execute(
                    "SELECT name, current_stock, stock_threshold FROM supplies WHERE supply_id = %s",
                    (recipe_item['supply_id'],)
                )
                supply_status = cursor.fetchone()
                if supply_status and supply_status['current_stock'] <= supply_status['stock_threshold']:
                    # Si el stock es bajo, creamos una alerta
                    alert_message = f"Stock bajo para {supply_status['name']}: {supply_status['current_stock']} restantes."
                    cursor.execute(
                        "INSERT INTO alerts (alert_type, message) VALUES ('stock', %s)",
                        (alert_message,)
                    )

                # Registrar movimiento
                move_query = """
                    INSERT INTO stock_movements (supply_id, order_id, movement_type, quantity_change)
                    VALUES (%s, %s, 'Venta', %s)
                """
                cursor.execute(move_query, (recipe_item['supply_id'], order_id, -quantity_to_decrement))

        # Lógica para cerrar la orden
        cursor.execute("SELECT table_id, user_id FROM orders WHERE order_id = %s", (order_id,))
        order_info = cursor.fetchone()
        
        table_id = order_info['table_id']
        user_id = order_info['user_id']
        
        query_payment = "INSERT INTO payments (order_id, payment_method, amount, processed_by_user_id) VALUES (%s, %s, %s, %s)"
        cursor.execute(query_payment, (order_id, close_data.payment_method, close_data.amount, user_id))
        
        cursor.execute("UPDATE orders SET status = 'Pagada', closed_at = NOW() WHERE order_id = %s", (order_id,))
        
        if table_id:
            cursor.execute("UPDATE restaurant_tables SET status = 'Libre' WHERE table_id = %s", (table_id,))
        
        # --- Control de entrenamiento ---
        if not close_data.is_training_mode:
            conn.commit()
        else:
            conn.rollback()
        
        return {"message": f"Orden {order_id} cerrada y pagada."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al cerrar la orden: {e}")
    finally:
        if conn and conn.is_connected(): conn.close()


@router.get("/api/orders/open", tags=["POS"])
def get_open_orders():
    """ Obtiene todas las órdenes que no están cerradas (Abiertas y Listas). """
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT o.order_id, o.order_folio, o.created_at, o.status,
                   IFNULL(t.table_name, 'Para Llevar') as table_name
            FROM orders o
            LEFT JOIN restaurant_tables t ON o.table_id = t.table_id
            WHERE o.status IN ('Abierta', 'Lista')
            ORDER BY o.created_at ASC;
        """
        cursor.execute(query)
        return cursor.fetchall()
    except Exception as e:
        print(f"Error al obtener órdenes abiertas: {e}")
        return []
    finally:
        if conn and conn.is_connected(): conn.close()

@router.delete("/api/order-details/{detail_id}/cancel", tags=["POS"])
def cancel_order_item(detail_id: int, cancel_data: CancelItem):
    """
    Cancela un item, lo audita y revisa si es una anomalía.
    Cumple con RF-60 y RF-132.
    """
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        user_id_cancelling = cancel_data.user_id

        # 1. Verificar el rol del usuario que cancela
        cursor.execute("SELECT role_id, full_name FROM users WHERE user_id = %s", (user_id_cancelling,))
        user = cursor.fetchone()
        if not user or user['role_id'] == 3: # Rol 'Personal'
            raise HTTPException(status_code=403, detail="No tienes permiso para cancelar productos.")

        # 2. Obtener info del producto antes de borrarlo para la auditoría
        cursor.execute("SELECT od.order_id, p.name FROM order_details od JOIN products p ON od.product_id = p.product_id WHERE od.detail_id = %s", (detail_id,))
        item_info = cursor.fetchone()

        # 3. Eliminar el item de la orden
        cursor.execute("DELETE FROM order_details WHERE detail_id = %s", (detail_id,))

        # 4. Registrar la acción en la bitácora de auditoría
        if item_info:
            audit_details = {"order_id": item_info['order_id'], "product_cancelled": item_info['name'], "reason": cancel_data.reason}
            cursor.execute("INSERT INTO audit_logs (user_id, action, details) VALUES (%s, %s, %s)",
                           (user_id_cancelling, 'CANCEL_ORDER_ITEM', json.dumps(audit_details)))

        # --- NUEVA LÓGICA DE DETECCIÓN DE ANOMALÍAS (RF-132) ---
        # 5. Contar cuántas cancelaciones ha hecho este usuario en la última hora
        ANOMALY_THRESHOLD = 5 # Umbral: 5 cancelaciones
        time_window = datetime.datetime.now() - datetime.timedelta(hours=1)

        query_anomalia = "SELECT COUNT(*) as count FROM audit_logs WHERE user_id = %s AND action = 'CANCEL_ORDER_ITEM' AND log_timestamp > %s"
        cursor.execute(query_anomalia, (user_id_cancelling, time_window))
        cancellation_count = cursor.fetchone()['count']

        # 6. Si se supera el umbral, generar una alerta
        if cancellation_count > ANOMALY_THRESHOLD:
            alert_message = f"Alerta de Anomalía: El usuario '{user['full_name']}' ha cancelado {cancellation_count} productos en la última hora."
            cursor.execute("INSERT INTO alerts (alert_type, message) VALUES ('anomaly', %s)", (alert_message,))

        conn.commit()
        return {"message": "Producto cancelado y acción registrada."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al cancelar el producto: {e}")
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/orders/{order_id}/send-to-kitchen", tags=["POS"])
def send_order_to_kitchen(order_id: int):
    """ Endpoint simbólico para que el mesero envíe la orden finalizada al KDS. """
    # En el futuro, podría cambiar un estado o registrar un evento.
    # Por ahora, solo confirma la recepción.
    return {"message": f"Orden {order_id} enviada a cocina."}


@router.put("/api/orders/{order_id}/customer", tags=["POS"])
def associate_customer_to_order(order_id: int, association: AssociateCustomer):
    """
    Asocia un cliente existente a una orden activa. Cumple con RF-143.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "UPDATE orders SET customer_id = %s WHERE order_id = %s"
        cursor.execute(query, (association.customer_id, order_id))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="La orden no fue encontrada.")
        return {"message": "Cliente asociado a la orden con éxito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al asociar el cliente: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()