from fastapi import APIRouter, HTTPException, File, UploadFile, Form
import os, shutil
from database import get_db_connection
from datetime import datetime

router = APIRouter()

# Obtener imágenes
@router.get("/api/gallery", tags=["Gallery"])
def get_gallery_images():
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM gallery_images ORDER BY display_order ASC, image_id DESC;"
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        if conn and conn.is_connected():
            conn.close()

# Subir imagen con caption
@router.post("/api/gallery/upload", tags=["Gallery"])
async def upload_gallery_image(
    file: UploadFile = File(...),
    caption: str = Form('')
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")

    upload_folder = "static/images/gallery"
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión con la base de datos.")

    try:
        cursor = conn.cursor()
        web_path = f"/{file_path.replace(os.path.sep, '/')}"
        uploaded_at = datetime.now()
        cursor.execute(
            "INSERT INTO gallery_images (file_path, caption, display_order, uploaded_at) VALUES (%s, %s, %s, %s)",
            (web_path, caption, 0, uploaded_at)
        )
        conn.commit()
        return {"filename": file.filename, "path": web_path, "caption": caption}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"No se pudo guardar la imagen: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

# Eliminar imagen
@router.delete("/api/gallery/{image_id}", tags=["Gallery"])
def delete_gallery_image(image_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT file_path FROM gallery_images WHERE image_id = %s", (image_id,))
        image_record = cursor.fetchone()
        if not image_record:
            raise HTTPException(status_code=404, detail="Imagen no encontrada.")

        cursor.execute("DELETE FROM gallery_images WHERE image_id = %s", (image_id,))
        physical_file_path = image_record['file_path'].lstrip('/')
        if os.path.exists(physical_file_path):
            os.remove(physical_file_path)

        conn.commit()
        return {"message": "Imagen eliminada con éxito."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar la imagen: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

# Editar caption (nombre visible)
@router.patch("/api/gallery/{image_id}", tags=["Gallery"])
def update_gallery_image_caption(image_id: int, caption: str = Form(...)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de BBDD.")
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM gallery_images WHERE image_id = %s", (image_id,))
        image = cursor.fetchone()
        if not image:
            raise HTTPException(status_code=404, detail="Imagen no encontrada.")

        cursor.execute(
            "UPDATE gallery_images SET caption = %s WHERE image_id = %s",
            (caption, image_id)
        )
        conn.commit()
        return {"message": "Descripción actualizada correctamente.", "caption": caption}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar la descripción: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()
