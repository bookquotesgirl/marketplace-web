// Sub-order status vocabulary shared by Orders, OrderDetail, and OrderConfirmation.
// API enum: placed -> confirmed -> shipped -> delivered, or cancelled (order.controller.js).
export const STATUS_STEPS = ['placed', 'confirmed', 'shipped', 'delivered'];

export const STATUS_KEY = {
  placed: 'orderConfirm.status.placed',
  confirmed: 'orderConfirm.status.confirmed',
  shipped: 'orderConfirm.status.shipped',
  delivered: 'orderConfirm.status.delivered',
  cancelled: 'orderConfirm.status.cancelled',
};

export function statusStepIndex(status) {
  return STATUS_STEPS.indexOf(status);
}

// An order has no status of its own — only its sub-orders do (one per vendor).
// Show the least-progressed non-cancelled sub-order's status, since the order as a
// whole isn't at a stage until every vendor has reached it. Only surface "cancelled"
// when every sub-order was cancelled; a partially-cancelled order still tracks by the
// sub-orders still in flight.
export function overallStatus(subOrders) {
  const active = (subOrders ?? []).filter((s) => s.status !== 'cancelled');
  if (active.length === 0) return 'cancelled';
  return active.reduce((worst, sub) => {
    const idx = statusStepIndex(sub.status);
    return idx < statusStepIndex(worst) ? sub.status : worst;
  }, active[0].status);
}
