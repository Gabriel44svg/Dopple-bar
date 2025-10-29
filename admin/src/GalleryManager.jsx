'use client';
import { useState, useEffect } from 'react';

export default function GalleryManager() {
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [size, setSize] = useState('medium');
  const [editingId, setEditingId] = useState(null); // ID de la imagen que se está editando
  const [newCaption, setNewCaption] = useState('');
  const [newName, setNewName] = useState(''); // Nuevo nombre para mostrar

  // Cargar imágenes
  const fetchImages = () => {
    fetch('http://127.0.0.1:8000/api/gallery')
      .then(res => res.json())
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar la galería:", err));
  };

  useEffect(fetchImages, []);

  // Subir imagen
  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
  const handleCaptionChange = (e) => setCaption(e.target.value);
  const handleSizeChange = (e) => setSize(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Selecciona un archivo primero.");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("caption", caption);
    formData.append("size", size);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/gallery/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error("Error al subir la imagen.");

      alert("¡Imagen subida con éxito!");
      setSelectedFile(null);
      setCaption('');
      setSize('medium');
      e.target.reset();
      fetchImages();
    } catch (error) {
      alert(error.message);
    }
  };

  // Eliminar imagen
  const handleDeleteImage = async (imageId) => {
    if (!confirm("¿Eliminar esta imagen permanentemente?")) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/gallery/${imageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("No se pudo eliminar la imagen.");

      alert("Imagen eliminada con éxito.");
      fetchImages();
    } catch (error) {
      alert(error.message);
    }
  };

  // Iniciar edición de descripción y nombre
  const startEditing = (image) => {
    setEditingId(image.image_id);
    setNewCaption(image.caption || '');
    setNewName(image.display_name || ''); // display_name será el nombre que quieres mostrar
  };

  // Guardar cambios
  const saveChanges = async (imageId) => {
    try {
      const formData = new FormData();
      formData.append("caption", newCaption);
      formData.append("display_name", newName);

      const response = await fetch(`http://127.0.0.1:8000/api/gallery/${imageId}`, {
        method: 'PATCH',
        body: formData,
      });
      if (!response.ok) throw new Error("No se pudo actualizar la imagen.");

      alert("Cambios guardados.");
      setEditingId(null);
      fetchImages();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="module-container p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Gestión de Galería</h2>

      {/* Formulario subir imagen */}
      <form onSubmit={handleSubmit} className="add-form flex flex-col gap-2 mb-6">
        <input type="file" onChange={handleFileChange} required className="p-2 rounded" />
        <input
          type="text"
          placeholder="Descripción de la imagen"
          value={caption}
          onChange={handleCaptionChange}
          className="p-2 rounded"
        />
        <select value={size} onChange={handleSizeChange} className="p-2 rounded">
          <option value="small">Pequeño</option>
          <option value="medium">Mediano</option>
          <option value="large">Grande</option>
        </select>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Subir Imagen
        </button>
      </form>

      {/* Galería */}
      <div className="gallery-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map(img => (
          <div key={img.image_id} className="gallery-item bg-gray-800 rounded-lg p-2 relative">
            <img
              src={`http://127.0.0.1:8000${img.file_path}`}
              alt={img.caption || ''}
              className={`w-full object-cover ${img.size === 'small' ? 'h-32' : img.size === 'medium' ? 'h-48' : 'h-64'} rounded`}
            />

            {/* Si estamos editando esta imagen */}
            {editingId === img.image_id ? (
              <div className="mt-2 flex flex-col gap-1">
                <input
                  type="text"
                  value={newCaption}
                  onChange={e => setNewCaption(e.target.value)}
                  placeholder="Editar descripción"
                  className="p-1 rounded text-black"
                />
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Editar nombre visible"
                  className="p-1 rounded text-black"
                />
                <div className="flex gap-2 mt-1">
                  <button onClick={() => saveChanges(img.image_id)} className="bg-green-600 hover:bg-green-700 py-1 px-2 rounded">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-500 hover:bg-gray-600 py-1 px-2 rounded">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex justify-between items-center">
                <p className="text-gray-300">{img.display_name || img.caption}</p>
                <div className="flex gap-1">
                  <button onClick={() => startEditing(img)} className="bg-yellow-600 hover:bg-yellow-700 px-2 rounded">Editar</button>
                  <button onClick={() => handleDeleteImage(img.image_id)} className="bg-red-600 hover:bg-red-700 px-2 rounded">&times;</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
