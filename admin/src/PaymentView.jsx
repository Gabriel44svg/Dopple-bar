// admin/src/PaymentView.jsx
import { useState } from 'react';

function PaymentView({ order, orderItems, onBack, onCloseOrder }) {
  const [cashReceived, setCashReceived] = useState('');
  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = (parseFloat(cashReceived) || 0) - total;

  return (
    <div className="module-container payment-view">
      <div className="order-header">
        <h2>Procesar Pago para Orden: {order.order_folio}</h2>
        <button onClick={onBack} className="back-btn">Volver a la Orden</button>
      </div>

      <div className="payment-layout">
        <div className="payment-details">
          <h3>Resumen de la Cuenta</h3>
          <ul>
            {orderItems.map(item => (
              <li key={`${item.product_id}-${item.notes || ''}`}>
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="order-total">
            <strong>Total: ${total.toFixed(2)}</strong>
          </div>
        </div>

        <div className="payment-calculator">
          <h3>Pago en Efectivo (RF-57)</h3>
          <label>Efectivo Recibido:</label>
          <input 
            type="number"
            value={cashReceived}
            onChange={e => setCashReceived(e.target.value)}
            placeholder="0.00"
            autoFocus
          />
          {change >= 0 && (
            <>
              <label>Cambio a Devolver:</label>
              <input type="text" value={`$${change.toFixed(2)}`} readOnly className="change-display" />
            </>
          )}
          <button onClick={() => onCloseOrder(total)} className="submit-btn" style={{width: '100%', marginTop: '1rem'}}>
            Finalizar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
export default PaymentView;