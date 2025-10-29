// admin/src/UserManager.jsx
import { useState, useEffect } from 'react';

function UserManager() {
  const [users, setUsers] = useState([]);

  const fetchUsers = () => {
    fetch('http://127.0.0.1:8000/api/users')
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []));
  };

  useEffect(fetchUsers, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newUser = Object.fromEntries(formData.entries());

    await fetch('http://127.0.0.1:8000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });

    e.target.reset();
    fetchUsers();
  };

  return (
    <div className="module-container">
      <h2>Gestión de Empleados</h2>
      <form onSubmit={handleSubmit} className="add-form">
        <input name="full_name" placeholder="Nombre Completo" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Contraseña" required />
        <input name="pin" type="text" placeholder="PIN (4 dígitos)" required maxLength="4" />
        <select name="role_id" required>
          <option value="">-- Rol --</option>
          <option value="1">Dueño</option>
          <option value="2">Gerente</option>
          <option value="3">Personal</option>
        </select>
        <button type="submit">Crear Empleado</button>
      </form>

      <table>
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr></thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>{user.role_id === 1 ? 'Dueño' : user.role_id === 2 ? 'Gerente' : 'Personal'}</td>
              <td>{user.is_active ? 'Activo' : 'Inactivo'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default UserManager;