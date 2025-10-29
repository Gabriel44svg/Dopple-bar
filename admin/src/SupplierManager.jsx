// admin/src/SupplierManager.jsx
import { useState, useEffect } from 'react';

function SupplierManager() {
  const [suppliers, setSuppliers] = useState([]);

  const fetchSuppliers = () => {
    fetch('http://127.0.0.1:8000/api/suppliers')
      .then(res => res.json())
      .then(data => setSuppliers(data));
  };

  useEffect(fetchSuppliers, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSupplier = Object.fromEntries(formData.entries());

    await fetch('http://127.0.0.1:8000/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupplier),
    });

    e.target.reset();
    fetchSuppliers(); // Recarga la lista
  };

  return (
    <div className="module-container">
      <h2>Gestión de Proveedores</h2>
      <form onSubmit={handleSubmit} className="add-form">
        <input name="name" placeholder="Nombre del Proveedor" required />
        <input name="contact_person" placeholder="Persona de Contacto" />
        <input name="phone" placeholder="Teléfono" />
        <input name="email" type="email" placeholder="Email" />
        <button type="submit">Añadir Proveedor</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.supplier_id}>
              <td>{supplier.name}</td>
              <td>{supplier.contact_person}</td>
              <td>{supplier.phone}</td>
              <td>{supplier.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default SupplierManager;