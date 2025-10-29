// admin/src/OccupancyForecaster.jsx
import { useState } from 'react';

function OccupancyForecaster() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    const response = await fetch(`http://127.0.0.1:8000/api/predict/occupancy?date_str=${date}`);
    const data = await response.json();
    setPrediction(data);
    setLoading(false);
  };

  return (
    <div className="module-container">
      <h2>Predicción de Ocupación (IA)</h2>
      <div className="add-form">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button onClick={handlePredict} disabled={loading}>
          {loading ? 'Calculando...' : 'Predecir Ocupación'}
        </button>
      </div>

      {prediction && (
        <div className="kpi-container" style={{marginTop: '1rem'}}>
            <div className="kpi-card">
                <h3>Clientes Estimados</h3>
                <span>{prediction.predicted_customers}</span>
            </div>
            <div className="kpi-card">
                <h3>Ocupación Estimada</h3>
                <span>{prediction.occupancy_percentage}%</span>
            </div>
        </div>
      )}
    </div>
  );
}
export default OccupancyForecaster;