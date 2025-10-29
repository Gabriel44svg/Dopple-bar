'use client'; // <-- Directiva para hacerlo interactivo
import { useState, useEffect } from 'react';

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // Estado para la imagen seleccionada

  useEffect(() => {
    // Pedimos los datos de la API de FastAPI
    fetch('http://127.0.0.1:8000/api/gallery')
      .then(res => res.json())
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar imágenes:", err));
  }, []);

  // Función para abrir el lightbox
  const openModal = (imageSrc) => setSelectedImage(imageSrc);

  // Función para cerrar el lightbox
  const closeModal = () => setSelectedImage(null);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">Galería</h1>

      {/* --- Grid de imágenes --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(images || []).map(image => (
          <div
            key={image.image_id}
            className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-300"
            onClick={() => openModal(image.file_path)}
          >
            <img
              src={`http://127.0.0.1:8000${image.file_path}`}
              alt={image.caption || 'Imagen de la galería'}
              className="w-full h-60 object-cover transition-transform duration-300 hover:scale-105"
            />
            {image.caption && (
              <p className="text-center p-2 text-gray-400">{image.caption}</p>
            )}
          </div>
        ))}
      </div>

      {/* --- Lightbox Modal --- */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 cursor-pointer"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={`http://127.0.0.1:8000${selectedImage}`}
              alt="Vista ampliada"
              className="rounded-lg max-h-[90vh] mx-auto"
            />
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-white text-3xl font-bold hover:text-red-500"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
