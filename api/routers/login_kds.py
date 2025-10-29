from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from routers.auth import get_user_from_token  # ✅ tu función existente de auth.py

router = APIRouter()

# Manejo básico de conexiones de WebSocket para KDS
active_connections = {}

async def connect(websocket: WebSocket, user_id: str):
    await websocket.accept()
    active_connections[user_id] = websocket

def disconnect(user_id: str):
    if user_id in active_connections:
        del active_connections[user_id]

async def broadcast(message: str, sender_id: str, sender_name: str):
    for uid, ws in active_connections.items():
        if uid != sender_id:  # No reenviar al mismo usuario
            await ws.send_text(f"{sender_name}: {message}")

# WebSocket del KDS, usando token para autenticar
@router.websocket("/ws/kds_chat")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        user = await get_user_from_token(token)
        if not user:
            await websocket.close(code=1008)  # 1008 = Policy Violation
            return
    except HTTPException:
        await websocket.close(code=1008)
        return

    user_id = str(user["user_id"])
    full_name = user["full_name"]

    await connect(websocket, user_id)

    try:
        while True:
            data = await websocket.receive_text()
            await broadcast(data, user_id, full_name)
    except WebSocketDisconnect:
        disconnect(user_id)
        await broadcast(f"{full_name} se desconectó", user_id, full_name)
