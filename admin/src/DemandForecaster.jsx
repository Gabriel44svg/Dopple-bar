// admin/src/DemandForecaster.jsx
import { useState } from 'react';

function DemandForecaster() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [prediction, setPrediction] = useState(null);

  const handlePredict = async () => {
    const response = await fetch(`http://127.0.0.1:8000/api/predict/demand?date_str=${date}`);
    const data = await response.json();
    setPrediction(data.predicted_orders);
  };

  return (
    <div className="module-container">
      <h2>Predicción de Demanda (IA)</h2>
      <div className="add-form">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button onClick={handlePredict}>Predecir Demanda</button>
      </div>
      {prediction !== null && (
        <div className="kpi-card" style={{marginTop: '1rem'}}>
          <h3>Órdenes estimadas para el {date}:</h3>
          <span>{prediction}</span>
        </div>
      )}
    </div>
  );
}
export default DemandForecaster;