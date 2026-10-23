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
            const data = await res.json();
            orders = Array.isArray(data) ? data : [];
        } else {
            try {
                const stored = JSON.parse(localStorage.getItem('gourmet_orders') || '[]');
                orders = Array.isArray(stored) ? stored : [];
            } catch (error) {
                orders = [];
            }
        }
    } catch (e) {
        try {
            const stored = JSON.parse(localStorage.getItem('gourmet_orders') || '[]');
            orders = Array.isArray(stored) ? stored : [];
        } catch (error) {
            orders = [];
        }
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
    const safeOrders = Array.isArray(orders) ? orders : [];

    if (safeOrders.length === 0) {
        ordersTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No customer orders placed yet.</td></tr>';
    } else {
        safeOrders.slice().reverse().forEach((order) => {
            const normalizedStatus = String(order.status || 'pending').trim().toLowerCase();
            const customer = order.customer || {};
            const items = Array.isArray(order.items) ? order.items : [];

            if (normalizedStatus !== 'completed' && normalizedStatus !== 'cancelled') {
                pending++;
            }
            if (normalizedStatus !== 'cancelled') {
                revenue += Number(order.total) || 0;
            }

            const itemsSummary = items.map(item => `${item.name || 'Item'} (x${item.qty || 1})`).join(', ') || 'No items';
            const orderDate = order.createdAt || order.time || new Date().toISOString();

            ordersTbody.innerHTML += `
                <tr>
                    <td>
                        <strong>${order.id}</strong><br>
                        <a href="track.html?orderId=${order.id}" target="_blank" style="color: #ff4757; font-size: 11px; text-decoration: none;">View Tracking ↗</a>
                    </td>
                    <td>
                        <strong>${customer.name || 'Guest Customer'}</strong><br>
                        <small style="color: #64748b;">${customer.phone || 'No phone provided'}</small><br>
                        <small style="color: #64748b;">${customer.address || 'No address provided'}</small>
                    </td>
                    <td><small>${itemsSummary}</small></td>
                    <td><strong>$${Number(order.total || 0).toFixed(2)}</strong></td>
                    <td><small>${new Date(orderDate).toLocaleString()}</small></td>
                    <td><span class="status-pill status-${normalizedStatus}">${normalizedStatus.toUpperCase()}</span></td>
                    <td>
                        <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 6px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px;">
                            <option value="pending" ${normalizedStatus === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="preparing" ${normalizedStatus === 'preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="out_for_delivery" ${normalizedStatus === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
                            <option value="completed" ${normalizedStatus === 'completed' ? 'selected' : ''}>Delivered / Completed</option>
                            <option value="cancelled" ${normalizedStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    }

    if (totalCount) totalCount.innerText = String(safeOrders.length);
    if (pendingCount) pendingCount.innerText = String(pending);
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
        try {
            const stored = JSON.parse(localStorage.getItem('gourmet_orders') || '[]');
            const orders = Array.isArray(stored) ? stored : [];
            const order = orders.find(o => String(o.id) === String(id));
            if (order) {
                order.status = status;
                localStorage.setItem('gourmet_orders', JSON.stringify(orders));
            }
        } catch (error) {
            // Ignore local fallback errors.
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
