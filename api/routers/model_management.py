# api/routers/model_management.py
from fastapi import APIRouter, HTTPException
import subprocess
import sys

router = APIRouter()

@router.post("/api/models/retrain", tags=["AI"])
def retrain_model():
    """
    Inicia el proceso de reentrenamiento del modelo de demanda.
    Cumple con el requerimiento RF-135.
    """
    try:
        # Ejecuta el script model_trainer.py usando el mismo intérprete de Python
        # que está corriendo la API. Esto asegura que use el entorno virtual correcto.
        subprocess.Popen([sys.executable, "model_trainer.py"])
        return {"message": "El proceso de reentrenamiento ha comenzado. Puede tardar varios minutos y se ejecutará en segundo plano."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo iniciar el reentrenamiento: {e}")