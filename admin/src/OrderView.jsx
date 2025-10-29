// admin/src/OrderView.jsx
import { useState, useEffect } from 'react';

// --- Función Auxiliar para Agrupar Productos ---
const groupOrderItems = (items) => {
  if (!Array.isArray(items)) return [];
  const grouped = items.reduce((acc, item) => {
    const key = `${item.product_id}-${item.notes || 'default'}`;
    if (!acc[key]) {
      acc[key] = { ...item, quantity: 0, detail_ids: [] };
    }
    acc[key].quantity += item.quantity;
    acc[key].detail_ids.push(item.detail_id);
    return acc;
  }, {});
  return Object.values(grouped);
};

// --- Función Auxiliar para Calcular el Total ---
const calculateTotal = (groupedItems, promotions, coupon) => {
  const subtotal = groupedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountAmount = 0;
  let appliedDiscountsText = [];
  let appliedPromosPayload = [];

  // Promoción 2x1
  const promo2x1 = promotions.find(p => p.type === '2x1');
  if (promo2x1) {
    groupedItems.forEach(item => {
      if (item.quantity >= 2) {
        const promoDiscountCount = Math.floor(item.quantity / 2);
        const discountValue = promoDiscountCount * item.price;
        discountAmount += discountValue;
        appliedDiscountsText.push(`${promo2x1.name} en ${item.name} (x${promoDiscountCount})`);
        appliedPromosPayload.push({ promotion_id: promo2x1.promotion_id, discount_amount: discountValue });
      }
    });
  }

  // Cupón
  if (coupon) {
    let couponDiscountValue = 0;
    if (coupon.type === 'fijo') {
      couponDiscountValue = coupon.value;
      appliedDiscountsText.push(`Cupón ${coupon.code}: -$${coupon.value.toFixed(2)}`);
    } else if (coupon.type === '%') {
      couponDiscountValue = subtotal * (coupon.value / 100);
      appliedDiscountsText.push(`Cupón ${coupon.code}: ${coupon.value}% Dto.`);
    }
    discountAmount += couponDiscountValue;
  }

  const total = subtotal - discountAmount;
  return {
    total: Math.max(0, total),
    subtotal,
    discountAmount,
    appliedDiscounts: appliedDiscountsText,
    appliedPromosPayload
  };
};

// --- Componente Interno para Modal de Cancelación ---
function CancellationModal({ item, reasons, onConfirm, onCancel }) {
  const [selectedReason, setSelectedReason] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Cancelar Producto: {item.name}</h2>
        <p>Por favor, selecciona un motivo para la cancelación.</p>
        <select 
          value={selectedReason} 
          onChange={(e) => setSelectedReason(e.target.value)} 
          required
          style={{width: '100%', padding: '0.5rem', marginBottom: '1rem'}}
        >
          <option value="">-- Seleccionar Motivo --</option>
          {reasons.map(r => <option key={r.reason_id} value={r.reason_text}>{r.reason_text}</option>)}
        </select>
        <div className="modal-actions">
          <button onClick={onCancel} className="back-btn">Cerrar</button>
          <button onClick={() => onConfirm(selectedReason)} disabled={!selectedReason} className="reject-btn">Confirmar Cancelación</button>
        </div>
      </div>
    </div>
  );
}

// --- Componente Principal ---
function OrderView({ order, user, onBack }) {
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [menu, setMenu] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);

  const [cancellationReasons, setCancellationReasons] = useState([]);
  const [itemToCancel, setItemToCancel] = useState(null);

  const [allCustomers, setAllCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [associatedCustomer, setAssociatedCustomer] = useState(null);

  const fetchOrderItems = () => {
    fetch(`http://127.0.0.1:8000/api/orders/${order.order_id}/items`)
      .then(res => res.json())
      .then(data => setOrderItems(Array.isArray(data) ? data : []));
  };

  const fetchSupplies = () => {
    fetch('http://127.0.0.1:8000/api/inventory/supplies')
      .then(res => res.json())
      .then(setSupplies);
  };

  useEffect(() => {
    // Carga de menú y promociones
    fetch('http://127.0.0.1:8000/api/menu')
      .then(res => res.json())
      .then(data => {
        setMenu(Array.isArray(data) ? data : []);
        setAllMenuItems(Array.isArray(data) ? data : []);
      });

    fetch('http://127.0.0.1:8000/api/promotions')
      .then(res => res.json())
      .then(setPromotions);

    fetchSupplies();
    fetchOrderItems();

    fetch('http://127.0.0.1:8000/api/management/cancellation-reasons')
      .then(res => res.json())
      .then(data => setCancellationReasons(Array.isArray(data) ? data : []));

    fetch('http://127.0.0.1:8000/api/customers')
      .then(res => res.json())
      .then(data => setAllCustomers(Array.isArray(data) ? data : []));
  }, [order.order_id]);

  const isProductSellable = (product) => product.is_available;

  const addProductToOrder = async (product, notes = null) => {
    await fetch(`http://127.0.0.1:8000/api/orders/${order.order_id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.product_id,
        quantity: 1,
        price_at_time_of_order: product.price,
        notes: notes
      })
    });
    fetchOrderItems();
  };

  const openCancellationModal = (item) => {
    if (user.role_id === 3) {
      alert("No tienes permiso para cancelar productos.");
      return;
    }
    setItemToCancel(item);
  };

  const handleRemoveItem = async (reason) => {
    if (!reason) return;
    const detail_id = itemToCancel.detail_ids.pop();
    if (!detail_id) return;

    await fetch(`http://127.0.0.1:8000/api/order-details/${detail_id}/cancel`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason, user_id: user.user_id })
    });

    setItemToCancel(null);
    fetchOrderItems();
  };

  const handleAddNote = (product) => {
    const note = prompt(`Añadir nota para: ${product.name}`);
    if (note?.trim()) addProductToOrder(product, note.trim());
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/coupons/${couponCode}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail);
      }
      const couponData = await response.json();
      setAppliedCoupon(couponData);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSendToKitchen = async () => {
    if (orderItems.length === 0) {
        alert("No se puede enviar una orden vacía.");
        return;
    }
    try {
        await fetch(`http://127.0.0.1:8000/api/orders/${order.order_id}/send-to-kitchen`, { method: 'POST' });
        alert(`La orden ${order.order_folio} ha sido enviada a cocina/barra.`);
        onBack();
    } catch (error) {
        alert("No se pudo enviar la orden.");
    }
  };

  const handleCloseOrder = async () => {
    try {
      await fetch(`http://127.0.0.1:8000/api/orders/${order.order_id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: 'Efectivo',
          amount: orderTotal.total,
          applied_promos: orderTotal.appliedPromosPayload
        })
      });
      alert("Orden cobrada y cerrada con éxito.");
      onBack();
    } catch {
      alert("No se pudo cerrar la orden.");
    }
  };

  const handleCashChange = (e) => {
    const cash = parseFloat(e.target.value) || 0;
    setCashReceived(e.target.value);
    setChange(cash >= orderTotal.total ? cash - orderTotal.total : 0);
  };

  const handleAssociateCustomer = async (customerId) => {
    await fetch(`http://127.0.0.1:8000/api/orders/${order.order_id}/customer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId }),
    });
    const customer = allCustomers.find(c => c.customer_id === customerId);
    setAssociatedCustomer(customer);
    setSearchQuery('');
  };

  const filteredCustomers = searchQuery
    ? allCustomers.filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const filteredMenu = searchQuery
    ? allMenuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allMenuItems;

  const groupedItems = groupOrderItems(orderItems);
  const orderTotal = calculateTotal(groupedItems, promotions, appliedCoupon);

  if (isPaymentMode) {
    return (
      <div className="module-container payment-view">
        <h2>Procesar Pago</h2>
        <div className="payment-summary">
          <p>Total a Pagar:</p>
          <span>${orderTotal.total.toFixed(2)}</span>
        </div>
        <div className="payment-form">
          <label>Efectivo Recibido:</label>
          <input type="number" value={cashReceived} onChange={handleCashChange} placeholder="0.00" autoFocus />
          <label>Cambio a Devolver:</label>
          <input type="text" value={`$${change.toFixed(2)}`} readOnly className="change-display" />
        </div>
        <div className="payment-actions">
          <button onClick={() => setIsPaymentMode(false)} className="back-btn">Volver a la Orden</button>
          <button onClick={handleCloseOrder} className="submit-btn" disabled={parseFloat(cashReceived) < orderTotal.total}>
            Finalizar Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-view">
      {itemToCancel && (
        <CancellationModal 
          item={itemToCancel}
          reasons={cancellationReasons}
          onConfirm={handleRemoveItem}
          onCancel={() => setItemToCancel(null)}
        />
      )}

      <div className="order-header">
        <h1>Orden: {order.order_folio}</h1>
        <button onClick={onBack} className="back-btn">Volver al Mapa</button>
      </div>

      {/* --- Módulo de Asociación de Cliente --- */}
      <div className="customer-association">
        {associatedCustomer ? (
          <p><strong>Cliente:</strong> {associatedCustomer.full_name}</p>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Buscar cliente o producto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-customer-input"
            />
            {searchQuery && filteredCustomers.length > 0 && (
              <ul className="customer-results">
                {filteredCustomers.map(c => (
                  <li key={c.customer_id} onClick={() => handleAssociateCustomer(c.customer_id)}>
                    {c.full_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="pos-layout">
        {/* Menú */}
        <div className="menu-list">
          <h2>Menú</h2>
          {filteredMenu.map(item => (
            <button
              key={item.product_id}
              onClick={() => addProductToOrder(item)}
              className={`menu-item ${!isProductSellable(item) ? 'disabled' : ''}`}
              disabled={!isProductSellable(item)}
            >
              {item.name} - ${item.price.toFixed(2)}
              {!isProductSellable(item) && <span> (Agotado)</span>}
            </button>
          ))}
        </div>

        {/* Comanda */}
        <div className="current-order">
          <h2>Comanda</h2>
          <table>
            <thead>
              <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th></th></tr>
            </thead>
            <tbody>
              {groupedItems.map(item => (
                <tr key={item.product_id + (item.notes || '')}>
                  <td>{item.name}{item.notes && <em className="item-note"> - {item.notes}</em>}</td>
                  <td>
                    <button onClick={() => openCancellationModal(item)} className="quantity-btn">-</button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button onClick={() => addProductToOrder(item, item.notes)} className="quantity-btn">+</button>
                  </td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                  <td>{!item.notes && <button onClick={() => handleAddNote(item)} className="note-btn">Nota</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cupón */}
          {!appliedCoupon && groupedItems.length > 0 && (
            <div className="coupon-form">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Código de Cupón"
              />
              <button type="button" onClick={handleApplyCoupon}>Aplicar</button>
            </div>
          )}

          {/* Descuentos */}
          {orderTotal.appliedDiscounts.length > 0 && (
            <div className="promo-applied">
              <strong>Descuentos Aplicados:</strong>
              <ul>{orderTotal.appliedDiscounts.map((p, i) => <li key={i}>- {p}</li>)}</ul>
            </div>
          )}

          {/* Totales */}
          <div className="order-total">
            {orderTotal.discountAmount > 0 && (
              <>
                <p>Subtotal: ${orderTotal.subtotal.toFixed(2)}</p>
                <p>Descuentos: -${orderTotal.discountAmount.toFixed(2)}</p>
              </>
            )}
            <strong>Total: ${orderTotal.total.toFixed(2)}</strong>
          </div>

          {/* Botones */}
          <button onClick={handleSendToKitchen} className="submit-btn" style={{width: '100%', marginTop: '1rem'}}>
            Tomar y Enviar Orden
          </button>
          {groupedItems.length > 0 && (
            <button onClick={() => setIsPaymentMode(true)} className="pay-btn">
              Cobrar Orden
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderView;
