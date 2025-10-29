// admin/src/TrainingModeToggle.jsx
import { useState, useEffect } from 'react';

function TrainingModeToggle({ isTraining, onToggle }) {
  return (
    <div className="training-mode-toggle">
      <label htmlFor="training-switch">Modo Entrenamiento</label>
      <input 
        id="training-switch"
        type="checkbox" 
        checked={isTraining}
        onChange={onToggle} 
      />
      {isTraining && <span className="training-indicator">ACTIVADO</span>}
    </div>
  );
}
export default TrainingModeToggle;