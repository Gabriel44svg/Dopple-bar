// admin/src/PromotionSuggester.jsx
import { useState } from 'react';

function PromotionSuggester() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setSuggestions([]);
    const response = await fetch('http://127.0.0.1:8000/api/predict/promotion-suggestions');
    const data = await response.json();
    setSuggestions(data.suggestions || []);
    setLoading(false);
  };

  return (
    <div className="module-container">
      <h2>Sugerencias de Promociones (IA)</h2>
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analizando Ventas...' : 'Generar Sugerencias'}
      </button>

      {suggestions.length > 0 && (
        <div className="suggestions-list">
          <h3>Sugerencias:</h3>
          <ul>
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
export default PromotionSuggester;