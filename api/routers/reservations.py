from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection

router = APIRouter()

class Reservation(BaseModel):
    customer_name: str
    customer_email: str
    num_people: int
    reservation_datetime: str

@router.post("/api/reservations", tags=["Reservations"])
def create_reservation(reservation: Reservation):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO reservations (customer_name, customer_email, num_people, reservation_datetime, status) VALUES (%s, %s, %s, %s, 'Pendiente')"
        cursor.execute(query, (reservation.customer_name, reservation.customer_email, reservation.num_people, reservation.reservation_datetime))
        conn.commit()
        return {"message": "Reservación solicitada con éxito."}
    finally:
        conn.close()