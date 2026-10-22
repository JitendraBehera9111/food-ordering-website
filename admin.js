function initAdmin() {
    const ordersTbody = document.getElementById('orders-tbody');
    const totalCount = document.getElementById('total-orders-count');
    const pendingCount = document.getElementById('pending-orders-count');

    if (!ordersTbody) return;

    function renderOrders() {
        const orders = JSON.parse(localStorage.getItem('gourmet_orders')) || [];
        ordersTbody.innerHTML = '';

        let pending = 0;

        orders.slice().reverse().forEach((order, index) => {
            if (order.status === 'pending') pending++;

            const itemsSummary = order.items.map(i => `${i.name}(${i.qty})`).join(', ');

            ordersTbody.innerHTML += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.customer.name}<br><small>${order.customer.phone}</small></td>
                    <td>${itemsSummary}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td>${new Date(order.time).toLocaleString()}</td>
                    <td><span class="status-pill status-${order.status}">${order.status}</span></td>
                    <td>
                        <button class="action-btn btn-complete" onclick="updateOrderStatus('${order.id}', 'completed')">✓</button>
                        <button class="action-btn btn-cancel" onclick="updateOrderStatus('${order.id}', 'cancelled')">✕</button>
                    </td>
                </tr>
            `;
        });

        totalCount.innerText = orders.length;
        pendingCount.innerText = pending;
    }

    window.updateOrderStatus = (id, status) => {
        const orders = JSON.parse(localStorage.getItem('gourmet_orders')) || [];
        const order = orders.find(o => o.id === id);
        if (order) {
            order.status = status;
            localStorage.setItem('gourmet_orders', JSON.stringify(orders));
            renderOrders();
        }
    };

    renderOrders();
}

window.onload = initAdmin;
