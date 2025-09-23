from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import menu, reservations # Asegúrate de que 'reservations' también sea correcto

app = FastAPI(title="Doppler Bar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu.router)
app.include_router(reservations.router)