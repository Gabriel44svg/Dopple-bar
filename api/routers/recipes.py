# api/routers/recipes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from typing import List

router = APIRouter()

class RecipeItem(BaseModel):
    supply_id: int
    quantity_used: float

@router.get("/api/products/{product_id}/recipe", tags=["Inventory"])
def get_recipe_for_product(product_id: int):
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT r.recipe_id, r.supply_id, s.name as supply_name, r.quantity_used, s.unit_of_measure
            FROM recipes r
            JOIN supplies s ON r.supply_id = s.supply_id
            WHERE r.product_id = %s;
        """
        cursor.execute(query, (product_id,))
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/products/{product_id}/recipe", tags=["Inventory"])
def add_item_to_recipe(product_id: int, item: RecipeItem):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO recipes (product_id, supply_id, quantity_used) VALUES (%s, %s, %s)"
        cursor.execute(query, (product_id, item.supply_id, item.quantity_used))
        conn.commit()
        return {"message": "Insumo añadido a la receta."}
    finally:
        if conn and conn.is_connected(): conn.close()

# Al final de api/routers/recipes.py

@router.get("/api/products/{product_id}/recipe-cost", tags=["Inventory"])
def get_recipe_cost(product_id: int):
    """
    Calcula el costo total de la receta de un producto.
    Cumple con el requerimiento RF-74.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        # Unimos las tablas de recetas e insumos para multiplicar la cantidad por el último costo
        query = """
            SELECT SUM(r.quantity_used * s.last_cost) as total_cost
            FROM recipes r
            JOIN supplies s ON r.supply_id = s.supply_id
            WHERE r.product_id = %s;
        """
        cursor.execute(query, (product_id,))
        result = cursor.fetchone()

        # Si el producto no tiene receta o costo, devolvemos 0
        total_cost = result['total_cost'] if result['total_cost'] else 0

        return {"product_id": product_id, "total_cost": total_cost}
    finally:
        if conn and conn.is_connected():
            conn.close()
