// admin/src/CustomerManager.jsx
import { useState, useEffect } from 'react';
import CustomerDetail from './CustomerDetail';

function CustomerManager() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = () => {
    fetch('http://127.0.0.1:8000/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []));
  };

  useEffect(fetchCustomers, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCustomer = Object.fromEntries(formData.entries());

    await fetch('http://127.0.0.1:8000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    });

    e.target.reset();
    fetchCustomers();
  };

  // --- NUEVA FUNCIÓN PARA ELIMINAR CLIENTES ---
  const handleDeleteCustomer = async (customerId, event) => {
    event.stopPropagation(); // Evita que se abra la vista de detalle al hacer clic en el botón
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente? Se conservará su historial de órdenes, pero el perfil se borrará permanentemente.")) {
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/customers/${customerId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error("No se pudo eliminar el cliente.");

        alert("Cliente eliminado con éxito.");
        fetchCustomers(); // Recarga la lista para que desaparezca el eliminado
    } catch (error) {
        alert(error.message);
    }
  };

  if (selectedCustomer) {
    return <CustomerDetail customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />;
  }

  return (
    <div className="module-container">
      <h2>Gestión de Clientes (CRM)</h2>
      <form onSubmit={handleSubmit} className="add-form">
        <input name="full_name" placeholder="Nombre Completo del Cliente" required />
        <input name="phone" placeholder="Teléfono" />
        <input name="email" type="email" placeholder="Email" />
        <button type="submit">Añadir Cliente</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.customer_id} onClick={() => setSelectedCustomer(customer)} className="table-row-hover" style={{cursor: 'pointer'}}>
              <td>{customer.full_name}</td>
              <td>{customer.phone}</td>
              <td>{customer.email}</td>
              <td>
                {/* --- NUEVO BOTÓN DE ELIMINAR --- */}
                <button onClick={(e) => handleDeleteCustomer(customer.customer_id, e)} className="reject-btn">
                    Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default CustomerManager;