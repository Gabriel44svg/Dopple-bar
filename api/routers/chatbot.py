# api/routers/chatbot.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection

router = APIRouter()

class ChatMessage(BaseModel):
    message: str

# --- Funciones de Habilidad del Chatbot ---
# Cada función se especializa en responder una pregunta específica.

def get_daily_sales(cursor):
    query = "SELECT SUM(amount) as total FROM payments WHERE DATE(payment_timestamp) = CURDATE()"
    cursor.execute(query)
    total = cursor.fetchone()['total'] or 0
    return f"Las ventas totales de hoy son: ${total:.2f}."

def get_pending_reservations(cursor):
    query = "SELECT COUNT(*) as count FROM reservations WHERE status = 'Pendiente'"
    cursor.execute(query)
    count = cursor.fetchone()['count'] or 0
    if count > 0:
        return f"Hay {count} reservaciones pendientes de aprobación."
    return "No hay ninguna reservación pendiente en este momento."

def get_low_stock_items(cursor):
    query = "SELECT name FROM supplies WHERE current_stock <= stock_threshold"
    cursor.execute(query)
    items = cursor.fetchall()
    if not items:
        return "Buenas noticias: No hay insumos con stock bajo."
    item_names = ", ".join([item['name'] for item in items])
    return f"¡Alerta de Stock Bajo! Los siguientes insumos necesitan reordenarse: {item_names}."
def get_top_product(cursor):
    """
    Obtiene el producto más vendido desde la tabla 'supplies'.
    """
    # --- CONSULTA CORREGIDA ---
    # Ahora busca en la tabla 'supplies' donde is_sellable = 1
    query = """
        SELECT s.name, SUM(od.quantity) as total_sold
        FROM order_details od
        JOIN supplies s ON od.product_id = s.supply_id
        WHERE s.is_sellable = 1
        GROUP BY s.name ORDER BY total_sold DESC LIMIT 1;
    """
    cursor.execute(query)
    product = cursor.fetchone()
    if not product:
        return "Aún no hay datos de ventas para determinar el producto más vendido."
    return f"El producto más vendido hasta ahora es '{product['name']}' con {int(product['total_sold'])} unidades."

# --- Diccionario de Intenciones ---
INTENTS = {
    "ventas hoy": get_daily_sales,
    "reservaciones pendientes": get_pending_reservations,
    "stock bajo": get_low_stock_items,
    "producto más vendido": get_top_product,
}

@router.post("/api/chatbot/admin", tags=["Chatbot"])
def handle_admin_chat(msg: ChatMessage):
    """
    Procesa una pregunta del admin, identifica la intención y devuelve una respuesta.
    """
    user_message = msg.message.lower().strip()

    # Busca la mejor coincidencia de intención
    matched_intent = None
    for intent in INTENTS:
        if all(word in user_message for word in intent.split()):
            matched_intent = intent
            break

    conn = get_db_connection()
    if not conn:
        return {"response": "Lo siento, no pude conectarme a la base de datos."}

    try:
        cursor = conn.cursor(dictionary=True)
        if matched_intent:
            # Si encuentra una intención, ejecuta la función asociada
            response_text = INTENTS[matched_intent](cursor)
        else:
            response_text = "No entendí la pregunta. Intenta con 'ventas de hoy', 'reservaciones pendientes', 'stock bajo' o 'producto más vendido'."

        return {"response": response_text}
    finally:
        if conn and conn.is_connected():
            conn.close()