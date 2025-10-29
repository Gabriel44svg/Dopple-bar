from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict

router = APIRouter()

# Guardamos conexiones { "admin": ws, "barra": ws }
connections: Dict[str, WebSocket] = {}

@router.websocket("/ws/chat/{station}")
async def websocket_endpoint(websocket: WebSocket, station: str):
    await websocket.accept()
    connections[station] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            # Determinar a quién enviar
            target = "barra" if station == "admin" else "admin"
            if target in connections:
                await connections[target].send_text(f"{station}: {data}")
    except WebSocketDisconnect:
        if station in connections:
            del connections[station]
