# api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import get_db_connection
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import datetime

# --- Importación de routers existentes ---
from routers import (
    menu, reservations, events, gallery, settings, tables, pos, auth,
    attendance, inventory, reports, suppliers, purchase_orders, promotions,
    users, recipes, alerts, menu_management, management, audit, predictions,
    model_management, kds, customers, chatbot, login_kds, Chat
)

# --- Instancia de la aplicación ---
app = FastAPI(title="Doppler Bar API")

# --- Montaje del directorio de archivos estáticos ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Función de tareas programadas ---
def archive_past_events():
    """Archiva eventos cuya fecha ya pasó."""
    print("Ejecutando tarea programada: Archivando eventos pasados...")
    conn = get_db_connection()
    if conn and conn.is_connected():
        try:
            cursor = conn.cursor()
            query = "UPDATE events SET status = 'Archivado' WHERE event_date < CURDATE() AND status = 'Activo'"
            cursor.execute(query)
            conn.commit()
            print(f"Tarea finalizada. {cursor.rowcount} eventos archivados.")
        except Exception as e:
            print(f"Error en la tarea de archivado: {e}")
        finally:
            conn.close()

# --- Scheduler para tareas automáticas ---
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    """Se ejecuta al iniciar la API."""
    scheduler.add_job(archive_past_events, 'cron', hour=2, minute=0)  # Todos los días a las 2 AM
    scheduler.start()
    print("Scheduler iniciado. La tarea de archivado está programada.")

@app.on_event("shutdown")
async def shutdown_event():
    """Se ejecuta al detener la API."""
    scheduler.shutdown()
    print("Scheduler detenido.")

# --- Configuración CORS ---
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Inclusión de routers ---
routers = [
    menu, reservations, events, gallery, settings, tables, pos, auth,
    attendance, inventory, reports, suppliers, purchase_orders, promotions,
    users, recipes, alerts, menu_management, management, audit, predictions,
    model_management, kds, customers, chatbot, login_kds, Chat
]

for r in routers:
    try:
        app.include_router(r.router)
    except AttributeError:
        print(f"Router {r} no tiene atributo 'router', se omite")

# --- Endpoint raíz ---
@app.get("/")
def read_root():
    return {"status": "API de Doppler Bar funcionando correctamente"}
