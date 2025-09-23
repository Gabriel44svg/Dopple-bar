from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter()

@router.get("/api/menu", tags=["Menu"])
def get_menu():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión con la base de datos.")
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT p.*, c.name as category_name FROM products p JOIN menu_categories c ON p.category_id = c.category_id ORDER BY c.display_order, p.name;"
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        conn.close()