const API_URL = '/api';

function switchTab(tab) {
    const ordersSec = document.getElementById('orders-tab-section');
    const menuSec = document.getElementById('menu-tab-section');
    const tabBtns = document.querySelectorAll('.admin-tab-btn');

    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tab === 'orders') {
        ordersSec.style.display = 'block';
        menuSec.style.display = 'none';
        tabBtns[0].classList.add('active');
        fetchOrders();
    } else {
        ordersSec.style.display = 'none';
        menuSec.style.display = 'block';
        tabBtns[1].classList.add('active');
        fetchAdminMenu();
    }
}

// --- Orders Management ---
async function fetchOrders() {
    let orders = [];
    try {
        const res = await fetch(`${API_URL}/orders`);
        if (res.ok) {
            orders = await res.json();
        } else {
            orders = JSON.parse(localStorage.getItem('gourmet_orders')) || [];
        }
    } catch (e) {
        orders = JSON.parse(localStorage.getItem('gourmet_orders')) || [];
    }

    renderOrdersTable(orders);
}

function renderOrdersTable(orders) {
    const ordersTbody = document.getElementById('orders-tbody');
    const totalCount = document.getElementById('total-orders-count');
    const pendingCount = document.getElementById('pending-orders-count');
    const totalRevenueSpan = document.getElementById('total-revenue');

    if (!ordersTbody) return;

    ordersTbody.innerHTML = '';
    let pending = 0;
    let revenue = 0;

    if (orders.length === 0) {
        ordersTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No customer orders placed yet.</td></tr>';
    } else {
        orders.slice().reverse().forEach((order) => {
            if (order.status !== 'completed' && order.status !== 'cancelled') {
                pending++;
            }
            if (order.status !== 'cancelled') {
                revenue += Number(order.total) || 0;
            }

            const itemsSummary = order.items.map(i => `${i.name} (x${i.qty})`).join(', ');

            ordersTbody.innerHTML += `
                <tr>
                    <td>
                        <strong>${order.id}</strong><br>
                        <a href="track.html?orderId=${order.id}" target="_blank" style="color: #ff4757; font-size: 11px; text-decoration: none;">View Tracking ↗</a>
                    </td>
                    <td>
                        <strong>${order.customer.name}</strong><br>
                        <small style="color: #64748b;">${order.customer.phone}</small><br>
                        <small style="color: #64748b;">${order.customer.address}</small>
                    </td>
                    <td><small>${itemsSummary}</small></td>
                    <td><strong>$${Number(order.total).toFixed(2)}</strong></td>
                    <td><small>${new Date(order.createdAt || order.time).toLocaleString()}</small></td>
                    <td><span class="status-pill status-${order.status}">${order.status.toUpperCase()}</span></td>
                    <td>
                        <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 6px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="out_for_delivery" ${order.status === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Delivered / Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    }

    if (totalCount) totalCount.innerText = orders.length;
    if (pendingCount) pendingCount.innerText = pending;
    if (totalRevenueSpan) totalRevenueSpan.innerText = `$${revenue.toFixed(2)}`;
}

window.updateOrderStatus = async (id, status) => {
    try {
        await fetch(`${API_URL}/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    } catch (e) {
        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('gourmet_orders')) || [];
        const order = orders.find(o => o.id === id);
        if (order) {
            order.status = status;
            localStorage.setItem('gourmet_orders', JSON.stringify(orders));
        }
    }
    fetchOrders();
};

// --- Menu Management ---
async function fetchAdminMenu() {
    let menu = [];
    try {
        const res = await fetch(`${API_URL}/menu`);
        if (res.ok) menu = await res.json();
    } catch (e) {}

    renderAdminMenuTable(menu);
}

function renderAdminMenuTable(menu) {
    const tbody = document.getElementById('menu-tbody');
    if (!tbody) return;

    if (menu.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No dishes found. Add your first dish above!</td></tr>';
        return;
    }

    tbody.innerHTML = menu.map(item => `
        <tr>
            <td style="display: flex; align-items: center; gap: 12px;">
                <img src="${item.img}" alt="${item.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px;">
                <div>
                    <strong>${item.name}</strong><br>
                    <small style="color: #64748b;">${item.desc}</small>
                </div>
            </td>
            <td><span style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${item.category}</span></td>
            <td><strong>$${Number(item.price).toFixed(2)}</strong></td>
            <td>${item.isVeg ? '<span style="color: #10b981; font-weight: bold;">🌱 Yes</span>' : '<span style="color: #94a3b8;">No</span>'}</td>
            <td>
                <button onclick="handleDeleteDish(${item.id})" style="background: #fee2e2; color: #ef4444; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function handleCreateDish(event) {
    event.preventDefault();
    const newDish = {
        name: document.getElementById('dish-name').value.trim(),
        price: parseFloat(document.getElementById('dish-price').value),
        category: document.getElementById('dish-category').value,
        img: document.getElementById('dish-img').value.trim(),
        desc: document.getElementById('dish-desc').value.trim(),
        isVeg: document.getElementById('dish-isveg').checked,
        rating: 5.0
    };

    try {
        const res = await fetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDish)
        });
        if (res.ok) {
            document.getElementById('add-dish-form').reset();
            fetchAdminMenu();
        }
    } catch (e) {
        alert("Could not add dish. Make sure the backend server is running.");
    }
}

async function handleDeleteDish(id) {
    if (!confirm("Are you sure you want to remove this dish from the menu?")) return;
    try {
        const res = await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchAdminMenu();
        }
    } catch (e) {
        alert("Failed to delete dish.");
    }
}

window.addEventListener('DOMContentLoaded', () => {
    fetchOrders();
    // Auto refresh orders every 6 seconds
    setInterval(fetchOrders, 6000);
});
