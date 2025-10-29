# api/routers/menu_management.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from typing import List, Optional

router = APIRouter()

# --- MODELOS ---
class ProductUpdate(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    is_recommended: bool
    is_available: bool
    user_id: int

class MenuCategory(BaseModel):
    name: str
    display_order: int = 0

class Product(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    is_recommended: bool = False
    is_available: bool = True

# --- ENDPOINTS DE MENU ---

@router.get("/api/menu", tags=["Menu"])
def get_sellable_products():
    """Obtiene productos vendibles desde 'supplies'."""
    conn = get_db_connection()
    if not conn: 
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                s.supply_id as product_id, s.name, s.description, s.price, 
                s.is_recommended, s.is_available, mc.name as category_name
            FROM supplies s
            LEFT JOIN menu_categories mc ON s.category_id = mc.category_id
            WHERE s.is_sellable = 1
            ORDER BY mc.display_order, s.name
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): 
            conn.close()

# --- ENDPOINTS DE CATEGORÍAS ---
@router.get("/api/menu-categories", tags=["Menu Management"])
def get_all_categories():
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM menu_categories ORDER BY display_order")
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/menu-categories", tags=["Menu Management"])
def create_category(category: MenuCategory):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO menu_categories (name, display_order) VALUES (%s, %s)", 
                       (category.name, category.display_order))
        conn.commit()
        return {"message": "Categoría creada con éxito."}
    finally:
        if conn and conn.is_connected(): conn.close()

# --- ENDPOINTS DE PRODUCTOS ---
@router.get("/api/products", tags=["Menu Management"])
def get_all_products():
    """Obtiene todos los productos con sus categorías."""
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT p.*, mc.name as category_name
            FROM products p
            LEFT JOIN menu_categories mc ON p.category_id = mc.category_id
            ORDER BY p.name
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()

@router.post("/api/products", tags=["Menu Management"])
def create_product(product: Product):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO products (category_id, name, description, price, is_recommended, is_available) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (product.category_id, product.name, product.description, product.price, 
              product.is_recommended, product.is_available))
        conn.commit()
        return {"message": "Producto creado con éxito."}
    finally:
        if conn and conn.is_connected(): conn.close()

@router.put("/api/products/{product_id}", tags=["Menu Management"])
def update_product(product_id: int, product: ProductUpdate):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        # Verificar rol del usuario
        cursor.execute("SELECT role_id FROM users WHERE user_id = %s", (product.user_id,))
        user = cursor.fetchone()
        if not user: raise HTTPException(status_code=403, detail="Usuario no válido.")
        # Obtener producto actual
        cursor.execute("SELECT price, name FROM products WHERE product_id = %s", (product_id,))
        current_product = cursor.fetchone()
        if not current_product: raise HTTPException(status_code=404, detail="Producto no encontrado.")
        old_price = float(current_product['price'])
        new_price = float(product.price)
        # Verificar permisos si cambia el precio
        if old_price != new_price and user['role_id'] != 1:
            raise HTTPException(status_code=403, detail="No tienes permiso para modificar el precio.")
        # Registrar historial si cambia precio
        if old_price != new_price:
            cursor.execute("""
                INSERT INTO price_history (product_id, old_price, new_price, changed_by_user_id)
                VALUES (%s, %s, %s, %s)
            """, (product_id, old_price, new_price, product.user_id))
        # Actualizar producto
        cursor.execute("""
            UPDATE products
            SET category_id = %s, name = %s, description = %s, price = %s, is_recommended = %s, is_available = %s
            WHERE product_id = %s
        """, (product.category_id, product.name, product.description, new_price, 
              product.is_recommended, product.is_available, product_id))
        conn.commit()
        return {"message": "Producto actualizado con éxito."}
    finally:
        if conn and conn.is_connected(): conn.close()

@router.delete("/api/products/{product_id}", tags=["Menu Management"])
def delete_product(product_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        # Borrar recetas asociadas primero
        cursor.execute("DELETE FROM recipes WHERE product_id = %s", (product_id,))
        cursor.execute("DELETE FROM products WHERE product_id = %s", (product_id,))
        conn.commit()
        return {"message": "Producto eliminado con éxito."}
    finally:
        if conn and conn.is_connected(): conn.close()
