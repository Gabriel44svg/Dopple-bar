// admin/src/Clock.jsx
import { useState } from 'react';

function Clock() {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');

  const handleNumberClick = (number) => {
    if (pin.length < 4) {
      setPin(pin + number);
    }
  };

  const handleClear = () => setPin('');

  const handleEnter = async () => {
    if (pin.length !== 4) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/attendance/clock-in-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Error desconocido');
      }
      setMessage(result.message);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setPin(''); // Limpia el PIN después del intento
    }
  };

  return (
    <div className="clock-container">
      <h2>Registro de Asistencia</h2>
      <div className="pin-display">{pin.padEnd(4, '•')}</div>
      <div className="keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handleNumberClick(num)} className="key">{num}</button>
        ))}
        <button onClick={handleClear} className="key">Borrar</button>
        <button onClick={() => handleNumberClick(0)} className="key">0</button>
        <button onClick={handleEnter} className="key key-enter">Enter</button>
      </div>
      {message && <p className="clock-message">{message}</p>}
    </div>
  );
}
export default Clock;