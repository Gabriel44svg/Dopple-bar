# api/routers/inventory.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from typing import List, Optional

router = APIRouter()

# --- MODELOS ---
class Supply(BaseModel):
    supply_id: Optional[int] = None  # <-- Para incluir ID en respuestas
    name: str
    unit_of_measure: str
    current_stock: float
    stock_threshold: float
    price: Optional[float] = None
    category_id: Optional[int] = None
    is_sellable: bool = False

class StockAdjustment(BaseModel):
    new_stock_quantity: float
    reason: str
    user_id: int

# --- RUTAS ---

@router.get("/api/inventory/supplies", tags=["Inventory"], response_model=List[Supply])
def get_all_supplies():
    """Obtiene todos los insumos del inventario."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT supply_id, name, unit_of_measure, current_stock, stock_threshold, price, category_id, is_sellable
            FROM supplies
            ORDER BY name
        """)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): 
            conn.close()

@router.post("/api/inventory/supplies", tags=["Inventory"])
def create_supply(supply: Supply):
    """Crea un nuevo insumo en el inventario."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO supplies (name, unit_of_measure, current_stock, stock_threshold, price, category_id, is_sellable)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            supply.name, supply.unit_of_measure, supply.current_stock, 
            supply.stock_threshold, supply.price, supply.category_id, supply.is_sellable
        ))
        conn.commit()
        return {"message": "Insumo creado con éxito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear el insumo: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.put("/api/inventory/supplies/{supply_id}/adjust", tags=["Inventory"])
def adjust_stock(supply_id: int, adjustment: StockAdjustment):
    """Ajusta manualmente el stock de un insumo y registra el motivo."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT current_stock FROM supplies WHERE supply_id = %s", (supply_id,))
        supply = cursor.fetchone()
        if not supply:
            raise HTTPException(status_code=404, detail="Insumo no encontrado.")

        current_stock = float(supply['current_stock'])
        new_stock = float(adjustment.new_stock_quantity)
        quantity_change = new_stock - current_stock
        movement_type = 'Ajuste Corrección' if quantity_change >= 0 else 'Ajuste Merma'

        cursor.execute("UPDATE supplies SET current_stock = %s WHERE supply_id = %s", (new_stock, supply_id))
        cursor.execute("""
            INSERT INTO stock_movements (supply_id, user_id, movement_type, quantity_change, reason)
            VALUES (%s, %s, %s, %s, %s)
        """, (supply_id, adjustment.user_id, movement_type, quantity_change, adjustment.reason))
        conn.commit()
        return {"message": "Stock ajustado y movimiento registrado con éxito."}
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al ajustar el stock: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.get("/api/inventory/supplies/{supply_id}/history", tags=["Inventory"])
def get_supply_history(supply_id: int):
    """Obtiene el historial de movimientos para un insumo específico."""
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT sm.movement_timestamp, sm.movement_type, sm.quantity_change, sm.reason, u.full_name as user_name
            FROM stock_movements sm
            LEFT JOIN users u ON sm.user_id = u.user_id
            WHERE sm.supply_id = %s
            ORDER BY sm.movement_timestamp DESC
        """, (supply_id,))
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.delete("/api/inventory/supplies/{supply_id}", tags=["Inventory"])
def delete_supply(supply_id: int):
    """ Elimina un insumo y cualquier receta que dependa de él. """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()

        # --- NUEVA LÓGICA: Primero, elimina las dependencias en 'recipes' ---
        # Borra cualquier receta donde el insumo es un ingrediente O el producto final
        cursor.execute("DELETE FROM recipes WHERE supply_id = %s OR product_id = %s", (supply_id, supply_id))

        # Ahora, elimina el insumo de la tabla principal
        cursor.execute("DELETE FROM supplies WHERE supply_id = %s", (supply_id,))

        conn.commit()

        if cursor.rowcount == 0:
            # Esto puede pasar si el ID no existe
            raise HTTPException(status_code=404, detail="Insumo no encontrado.")

        return {"message": "Insumo y sus recetas asociadas han sido eliminados."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar el insumo: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()