# api/routers/promotions.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
import datetime

router = APIRouter()

class Promotion(BaseModel):
    name: str
    type: str
    value: float | None = None
    start_date: datetime.date
    end_date: datetime.date

# En api/routers/promotions.py
@router.get("/api/promotions", tags=["Promotions"])
def get_all_promotions():
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        # AÑADIMOS UN WHERE para filtrar solo promociones activas y vigentes
        query = "SELECT * FROM promotions WHERE is_active = 1 AND CURDATE() BETWEEN start_date AND end_date"
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected(): conn.close()


@router.post("/api/promotions", tags=["Promotions"])
def create_promotion(promo: Promotion):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO promotions (name, type, value, start_date, end_date) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(query, (promo.name, promo.type, promo.value, promo.start_date, promo.end_date))
        conn.commit()
        return {"message": "Promoción creada con éxito."}
    finally:
        if conn and conn.is_connected(): conn.close()


@router.get("/api/coupons/{coupon_code}", tags=["Promotions"])
def validate_coupon(coupon_code: str):
    """ Valida un código de cupón. Cumple con RF-127. """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM coupons WHERE code = %s AND is_active = 1 AND (expiration_date IS NULL OR expiration_date >= CURDATE())"
        cursor.execute(query, (coupon_code,))
        coupon = cursor.fetchone()
        if not coupon:
            raise HTTPException(status_code=404, detail="Cupón inválido o expirado.")
        return coupon
    finally:
        if conn and conn.is_connected():
            conn.close()