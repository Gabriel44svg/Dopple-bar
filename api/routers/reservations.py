from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection
from email_utils import send_email # Importa la función para enviar correos
from typing import List
import os
from ics import Calendar, Event
import datetime

router = APIRouter()

# --- Modelos de Datos ---
class Reservation(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str | None = None
    num_people: int
    reservation_datetime: str

class ReservationStatusUpdate(BaseModel):
    status: str

# --- Endpoints ---

@router.get("/api/reservations", tags=["Reservations"])
def get_all_reservations():
    """
    Obtiene todas las reservaciones para el panel de admin.
    """
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM reservations ORDER BY FIELD(status, 'Pendiente') DESC, reservation_datetime ASC;"
        cursor.execute(query)
        return cursor.fetchall()
    except Exception as e:
        print(f"Error al obtener reservaciones: {e}")
        return []
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.post("/api/reservations", tags=["Reservations"])
def create_reservation(reservation: Reservation):
    """
    Crea una nueva reservación y envía correos de notificación.
    Cumple con RF-21, RF-24 y RF-25.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        query = "INSERT INTO reservations (customer_name, customer_email, customer_phone, num_people, reservation_datetime, status) VALUES (%s, %s, %s, %s, %s, 'Pendiente')"
        cursor.execute(query, (reservation.customer_name, reservation.customer_email, reservation.customer_phone, reservation.num_people, reservation.reservation_datetime))
        conn.commit()
        
        # 1. Notificación al Cliente (RF-24)
        try:
            subject_cliente = "Solicitud de Reservación Recibida - Doppler Bar"
            body_cliente = f"Hola {reservation.customer_name},\n\nHemos recibido tu solicitud de reservación. Te notificaremos pronto sobre su estado.\n\nGracias,\nEl equipo de Doppler Bar Texcoco"
            send_email(reservation.customer_email, subject_cliente, body_cliente)
        except Exception as e:
            print(f"No se pudo enviar el email al cliente: {e}")

        # 2. Notificación al Gerente (RF-25)
        try:
            manager_email = os.getenv("MANAGER_EMAIL")
            if manager_email:
                subject_gerente = "Nueva Solicitud de Reservación"
                body_gerente = f"""Se ha recibido una nueva solicitud de reservación:
- Cliente: {reservation.customer_name}
- Email: {reservation.customer_email}
- Personas: {reservation.num_people}
- Fecha y Hora: {reservation.reservation_datetime}

Por favor, ingresa al panel de administración para gestionarla."""
                send_email(manager_email, subject_gerente, body_gerente)
        except Exception as e:
            print(f"No se pudo enviar el email al gerente: {e}")

        return {"message": 'Solicitud de reservación recibida exitosamente.'}
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.put("/api/reservations/{reservation_id}/status", tags=["Reservations"])
def update_reservation_status(reservation_id: int, status_update: ReservationStatusUpdate):
    new_status = status_update.status
    if new_status not in ["Confirmada", "Rechazada"]:
        raise HTTPException(status_code=400, detail="Estado no válido.")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)

        # Obtenemos todos los datos de la reservación para el email y el .ics
        cursor.execute("SELECT * FROM reservations WHERE reservation_id = %s", (reservation_id,))
        reservation_data = cursor.fetchone()
        if not reservation_data:
            raise HTTPException(status_code=404, detail="Reservación no encontrada.")

        # Actualizamos el estado
        cursor.execute("UPDATE reservations SET status = %s WHERE reservation_id = %s", (new_status, reservation_id))
        conn.commit()

        # --- LÓGICA DE EMAIL MEJORADA (RF-27 y RF-28) ---
        try:
            customer_email = reservation_data['customer_email']
            customer_name = reservation_data['customer_name']
            ics_content = None

            if new_status == "Confirmada":
                subject = "¡Tu Reservación en Doppler Bar ha sido Confirmada!"
                body = f"Hola {customer_name},\n\n¡Tu reservación ha sido confirmada! Adjuntamos un archivo para que puedas añadirla a tu calendario.\n\n¡Te esperamos!\nEl equipo de Doppler Bar Texcoco"

                # Generar el archivo .ics
                c = Calendar()
                e = Event()
                e.name = f"Reservación en Doppler Bar para {customer_name}"
                e.begin = reservation_data['reservation_datetime']
                e.duration = datetime.timedelta(hours=2) # Duración de 2 horas como ejemplo
                e.location = "Doppler Bar Texcoco"
                c.events.add(e)
                ics_content = c.serialize()
            else: # Rechazada
                subject = "Actualización sobre tu Reservación en Doppler Bar"
                body = f"Hola {customer_name},\n\nLamentablemente, no podemos confirmar tu solicitud de reservación en este momento.\n\nGracias,\nEl equipo de Doppler Bar Texcoco"

            send_email(customer_email, subject, body, ics_content, "reservacion.ics")
        except Exception as e:
            print(f"No se pudo enviar el email de estado final: {e}")

        return {"message": f"Reservación {reservation_id} actualizada a {new_status}."}
    finally:
        if conn and conn.is_connected():
            conn.close()