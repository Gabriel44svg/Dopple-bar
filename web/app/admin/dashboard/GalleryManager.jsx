// web/app/admin/dashboard/GalleryManager.jsx
'use client';
import { useState, useEffect } from 'react';

export default function GalleryManager() {
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchImages = () => {
    fetch('http://127.0.0.1:8000/api/gallery')
      .then(res => res.json())
      .then(data => setImages(Array.isArray(data) ? data : []));
  };

  useEffect(fetchImages, []);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Selecciona un archivo.");

    const formData = new FormData();
    formData.append("file", selectedFile);

    await fetch('http://127.0.0.1:8000/api/gallery/upload', { method: 'POST', body: formData });
    alert("¡Imagen subida!");
    fetchImages();
    e.target.reset();
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm("¿Eliminar esta imagen?")) return;
    await fetch(`http://127.0.0.1:8000/api/gallery/${imageId}`, { method: 'DELETE' });
    alert("Imagen eliminada.");
    fetchImages();
  };

  return (
    <div className="module-container">
      <h2>Gestión de Galería</h2>
      <form onSubmit={handleSubmit} className="add-form">
        <input type="file" onChange={handleFileChange} required />
        <button type="submit" className="submit-btn">Subir Imagen</button>
      </form>

      <div className="gallery-grid">
        {images.map(img => (
          <div key={img.image_id} className="gallery-item">
            <img src={`http://127.0.0.1:8000${img.file_path}`} alt={img.caption} />
            <button onClick={() => handleDeleteImage(img.image_id)} className="delete-btn">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
}