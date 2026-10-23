// --- API Base URL & Global Cart State ---
const API_URL = '/api';

// Fallback initial menu in case backend is offline
const FALLBACK_MENU = [
    { id: 1, name: "Garlic Bread", price: 5.99, category: "Starters", desc: "Toasted baguette with garlic butter and herbs", isVeg: true, rating: 4.8, img: "https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=400&q=80" },
    { id: 2, name: "Mozzarella Sticks", price: 7.49, category: "Starters", desc: "Crispy melted cheese with marinara dip", isVeg: true, rating: 4.7, img: "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?auto=format&fit=crop&w=400&q=80" },
    { id: 3, name: "Classic Pepperoni", price: 14.99, category: "Mains", desc: "Mozzarella, pepperoni, and signature tomato sauce", isVeg: false, rating: 4.9, img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80" },
    { id: 4, name: "BBQ Chicken Pizza", price: 16.49, category: "Mains", desc: "Grilled chicken, BBQ sauce, red onions, and cilantro", isVeg: false, rating: 4.8, img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" },
    { id: 5, name: "Veggie Delight", price: 13.99, category: "Mains", desc: "Bell peppers, mushrooms, olives, and fresh spinach", isVeg: true, rating: 4.6, img: "https://images.unsplash.com/photo-1574071318508-1cdbe5c7e2f1?auto=format&fit=crop&w=400&q=80" },
    { id: 6, name: "Tiramisu", price: 6.99, category: "Desserts", desc: "Traditional Italian coffee-flavored dessert", isVeg: true, rating: 4.9, img: "https://images.unsplash.com/photo-1571877227200-a0d766f6655d?auto=format&fit=crop&w=400&q=80" },
    { id: 7, name: "Chocolate Lava Cake", price: 7.99, category: "Desserts", desc: "Warm cake with a gooey chocolate center", isVeg: true, rating: 4.9, img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80" },
    { id: 8, name: "Iced Peach Tea", price: 3.49, category: "Drinks", desc: "Refreshing brewed tea with natural peach flavor", isVeg: true, rating: 4.5, img: "https://images.unsplash.com/photo-1556679343-66577d2d237f?auto=format&fit=crop&w=400&q=80" },
    { id: 9, name: "Classic Cola", price: 2.49, category: "Drinks", desc: "Ice cold refreshing cola", isVeg: true, rating: 4.6, img: "https://images.unsplash.com/photo-1622483767028-73976565776c?auto=format&fit=crop&w=400&q=80" },
];

let menuItems = [];
let cart = [];
try {
    const storedCart = JSON.parse(localStorage.getItem('gourmet_cart') || '[]');
    cart = Array.isArray(storedCart) ? storedCart : [];
} catch (error) {
    cart = [];
}
let activeCategory = 'all';
let searchQuery = '';
let promoDiscount = 0; // percentage discount (e.g. 0.15 for 15% off)
let appliedPromoCode = '';

// --- Toast Notifications ---
function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        font-weight: 500;
        font-size: 14px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
    `;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// --- Menu & Storefront Logic ---
async function fetchMenu() {
    try {
        const res = await fetch(`${API_URL}/menu`);
        if (res.ok) {
            menuItems = await res.json();
        } else {
            menuItems = FALLBACK_MENU;
        }
    } catch (e) {
        menuItems = FALLBACK_MENU;
    }
}

async function initMenu() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    await fetchMenu();

    const searchInput = document.getElementById('menu-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderMenuItems();
        });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            renderMenuItems();
        });
    });

    renderMenuItems();
    updateCartUI();
}

function renderMenuItems() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    let filtered = menuItems;
    if (activeCategory !== 'all') {
        filtered = filtered.filter(item => item.category === activeCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchQuery) || 
            item.desc.toLowerCase().includes(searchQuery)
        );
    }

    if (filtered.length === 0) {
        menuGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: #64748b;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
                <h3>No delicious dishes found</h3>
                <p>Try searching for something else or browse another category!</p>
            </div>
        `;
        return;
    }

    menuGrid.innerHTML = filtered.map(item => `
        <div class="menu-item">
            <div style="position: relative;">
                <img src="${item.img}" alt="${item.name}" loading="lazy">
                ${item.isVeg ? '<span style="position: absolute; top: 12px; left: 12px; background: #10b981; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">🌱 VEG</span>' : ''}
                ${item.rating ? `<span style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.65); color: #fbbf24; backdrop-filter: blur(4px); padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold;">★ ${item.rating}</span>` : ''}
            </div>
            <div class="menu-item-info">
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
                <div class="item-footer">
                    <span class="item-price">$${Number(item.price).toFixed(2)}</span>
                    <button class="btn-primary" onclick="addToCart(${item.id})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(id) {
    const item = menuItems.find(i => i.id === id) || FALLBACK_MENU.find(i => i.id === id);
    if (!item) return;

    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }

    saveCart();
    updateCartUI();
    showToast(`Added <strong>${item.name}</strong> to your cart!`);

    const cartSidebar = document.getElementById('cart-sidebar');
    if (cartSidebar) cartSidebar.classList.add('active');
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total-price');

    if (!cartItemsDiv) return;

    cartItemsDiv.innerHTML = '';
    let subtotal = 0;
    let count = 0;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px 16px; color: #94a3b8;">
                <i class="fas fa-shopping-basket" style="font-size: 3rem; margin-bottom: 12px; display: block; opacity: 0.4;"></i>
                <p>Your cart is empty.</p>
                <small>Explore our tasty menu and add some goodies!</small>
            </div>
        `;
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            subtotal += itemTotal;
            count += item.qty;
            cartItemsDiv.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-details">
                        <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                        <div>
                            <h4>${item.name}</h4>
                            <span class="price-tag">$${itemTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            `;
        });
    }

    if (cartCount) cartCount.innerText = count;
    if (cartTotal) cartTotal.innerText = `$${subtotal.toFixed(2)}`;
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function saveCart() {
    localStorage.setItem('gourmet_cart', JSON.stringify(cart));
}

function goToCheckout() {
    if (cart.length === 0) {
        showToast("Your cart is empty! Add something delicious first.", 'error');
        return;
    }
    window.location.href = 'checkout.html';
}

// --- Checkout Logic & Promo Codes ---
const PROMO_CODES = {
    'GOURMET10': 0.10,
    'FEAST20': 0.20,
    'WELCOME15': 0.15
};

function applyPromo() {
    const input = document.getElementById('promo-input');
    const msg = document.getElementById('promo-message');
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    if (PROMO_CODES[code]) {
        promoDiscount = PROMO_CODES[code];
        appliedPromoCode = code;
        msg.style.color = '#10b981';
        msg.innerText = `Coupon ${code} applied (${(promoDiscount * 100)}% OFF)!`;
        recalculateCheckout();
        showToast(`Promo code applied: ${promoDiscount * 100}% discount!`);
    } else {
        promoDiscount = 0;
        appliedPromoCode = '';
        msg.style.color = '#ef4444';
        msg.innerText = 'Invalid promo code. Try GOURMET10, FEAST20, or WELCOME15!';
        recalculateCheckout();
    }
}

function recalculateCheckout() {
    const subtotalSpan = document.getElementById('summary-subtotal');
    const discountRow = document.getElementById('discount-row');
    const discountSpan = document.getElementById('summary-discount');
    const deliverySpan = document.getElementById('summary-delivery');
    const totalSpan = document.getElementById('summary-total');

    let subtotal = 0;
    cart.forEach(item => { subtotal += item.price * item.qty; });

    let discountAmount = subtotal * promoDiscount;
    let deliveryFee = subtotal >= 30 || subtotal === 0 ? 0 : 3.99;
    let finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

    if (subtotalSpan) subtotalSpan.innerText = `$${subtotal.toFixed(2)}`;
    if (deliverySpan) deliverySpan.innerText = deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`;
    if (discountRow) {
        if (promoDiscount > 0) {
            discountRow.style.display = 'flex';
            if (discountSpan) discountSpan.innerText = `-$${discountAmount.toFixed(2)}`;
        } else {
            discountRow.style.display = 'none';
        }
    }
    if (totalSpan) totalSpan.innerText = `$${finalTotal.toFixed(2)}`;

    return { subtotal, discountAmount, deliveryFee, finalTotal };
}

function initCheckout() {
    const summaryDiv = document.getElementById('summary-items');
    const form = document.getElementById('checkout-form');

    if (!summaryDiv || !form) return;

    if (cart.length === 0) {
        summaryDiv.innerHTML = '<p style="color: #64748b; padding: 12px 0;">Your cart is empty.</p>';
        recalculateCheckout();
        return;
    }

    summaryDiv.innerHTML = cart.map(item => `
        <div class="summary-item">
            <img src="${item.img}" alt="${item.name}" class="summary-item-img">
            <div class="summary-item-details">
                <strong>${item.name}</strong>
                <small>${item.qty} × $${item.price.toFixed(2)}</small>
            </div>
            <div style="font-weight: 600; margin-left: auto;">
                $${(item.price * item.qty).toFixed(2)}
            </div>
        </div>
    `).join('');

    recalculateCheckout();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            showToast("Your cart is empty!", 'error');
            return;
        }

        const totals = recalculateCheckout();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = "Placing Order...";

        const orderData = {
            customer: {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
            },
            type: document.getElementById('order-type').value,
            time: document.getElementById('pickup-time').value,
            items: [...cart],
            pricing: {
                subtotal: totals.subtotal,
                discount: totals.discountAmount,
                deliveryFee: totals.deliveryFee,
                total: totals.finalTotal,
                promoCode: appliedPromoCode || null
            },
            total: totals.finalTotal,
            status: 'pending'
        };

        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            let savedOrder;
            if (res.ok) {
                savedOrder = await res.json();
            } else {
                throw new Error("Backend save failed");
            }

            // Also keep in localStorage as fallback
            let localOrders = [];
            try {
                localOrders = JSON.parse(localStorage.getItem('gourmet_orders') || '[]');
            } catch (error) {
                localOrders = [];
            }
            if (!Array.isArray(localOrders)) {
                localOrders = [];
            }
            localOrders.push(savedOrder);
            localStorage.setItem('gourmet_orders', JSON.stringify(localOrders));

            // Clear cart
            cart = [];
            saveCart();

            // Redirect to order status page
            window.location.href = `track.html?orderId=${savedOrder.id}`;
        } catch (err) {
            // Local fallback if server unreachable
            orderData.id = 'ORD-' + Date.now();
            orderData.createdAt = new Date().toISOString();
            let localOrders = [];
            try {
                localOrders = JSON.parse(localStorage.getItem('gourmet_orders') || '[]');
            } catch (error) {
                localOrders = [];
            }
            if (!Array.isArray(localOrders)) {
                localOrders = [];
            }
            localOrders.push(orderData);
            localStorage.setItem('gourmet_orders', JSON.stringify(localOrders));

            cart = [];
            saveCart();
            window.location.href = `track.html?orderId=${orderData.id}`;
        }
    });
}

// Auto Initialize based on elements present
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('menu-grid')) initMenu();
    if (document.getElementById('checkout-form')) initCheckout();
});
