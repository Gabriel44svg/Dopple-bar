// admin/src/PriceOptimizer.jsx
import { useState } from 'react';

function PriceOptimizer() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAnalyzePrices = async () => {
    setLoading(true);
    const response = await fetch('http://127.0.0.1:8000/api/predict/price-optimization');
    const data = await response.json();
    setSuggestions(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  return (
    <div className="module-container">
      <h2>Optimización de Precios (IA)</h2>
      <button onClick={handleAnalyzePrices} disabled={loading}>
        {loading ? 'Analizando...' : 'Analizar y Sugerir Precios'}
      </button>

      {suggestions.length > 0 && (
        <table style={{marginTop: '1rem'}}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio Actual</th>
              <th>Precio Sugerido</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s, i) => (
              <tr key={i}>
                <td>{s.product_name}</td>
                <td>${s.current_price.toFixed(2)}</td>
                <td style={{color: 'lightgreen', fontWeight: 'bold'}}>${s.suggested_price.toFixed(2)}</td>
                <td>{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
export default PriceOptimizer;