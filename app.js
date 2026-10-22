const MENU_ITEMS = [
    { id: 1, name: "Garlic Bread", price: 5.99, category: "Starters", desc: "Toasted baguette with garlic butter and herbs", img: "https://www.ambitiouskitchen.com/wp-content/uploads/2023/02/Garlic-Bread-4-1064x1064.jpg"},
    { id: 2, name: "Mozzarella Sticks", price: 7.49, category: "Starters", desc: "Crispy melted cheese with marinara dip", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToQPm9arrV58Tb0FxPPqTeMf_jvQLSFJ-ICUAYZ1P-lg&s=10" },
    { id: 3, name: "Classic Pepperoni", price: 14.99, category: "Mains", desc: "Mozzarella, pepperoni, and signature tomato sauce", img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80" },
    { id: 4, name: "BBQ Chicken Pizza", price: 16.49, category: "Mains", desc: "Grilled chicken, BBQ sauce, red onions, and cilantro", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" },
    { id: 5, name: "Veggie Delight", price: 13.99, category: "Mains", desc: "Bell peppers, mushrooms, olives, and fresh spinach", img: "https://images.unsplash.com/photo-1574071318508-1cdbe5c7e2f1?auto=format&fit=crop&w=400&q=80" },
    { id: 6, name: "Tiramisu", price: 6.99, category: "Desserts", desc: "Traditional Italian coffee-flavored dessert", img: "https://images.unsplash.com/photo-1571877227200-a0d766f6655d?autoformat&fit=crop&w=400&q=80" },
    { id: 7, name: "Chocolate Lava Cake", price: 7.99, category: "Desserts", desc: "Warm cake with a gooey chocolate center", img: "https://images.unsplash.com/photo-1624353365286-3f7975ca56a7?auto=format&fit=crop&w=400&q=80" },
    { id: 8, name: "Iced Peach Tea", price: 3.49, category: "Drinks", desc: "Refreshing brewed tea with natural peach flavor", img: "https://images.unsplash.com/photo-1556679343-66577d2d237f?auto=format&fit=crop&w=400&q=80" },
    { id: 9, name: "Classic Cola", price: 2.49, category: "Drinks", desc: "Ice cold refreshing cola", img: "https://images.unsplash.com/photo-1622483767028-73976565776c?auto=format&fit=crop&w=400&q=80" },
];

let cart = JSON.parse(localStorage.getItem('gourmet_cart')) || [];

// --- Storefront Logic ---
function initMenu() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    const filterBtns = document.querySelectorAll('.filter-btn');

    function renderItems(filter = 'all') {
        menuGrid.innerHTML = '';
        const filtered = filter === 'all' ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === filter);

        filtered.forEach(item => {
            menuGrid.innerHTML += `
                <div class="menu-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="menu-item-info">
                        <h3>${item.name}</h3>
                        <p>${item.desc}</p>
                        <div class="item-footer">
                            <span class="item-price">$${item.price.toFixed(2)}</span>
                            <button class="btn-primary" onclick="addToCart(${item.id})">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderItems(btn.dataset.category);
        });
    });

    renderItems();
    updateCartUI();
}

function addToCart(id) {
    const item = MENU_ITEMS.find(i => i.id === id);
    const existing = cart.find(i => i.id === id);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }

    saveCart();
    updateCartUI();

    // Visual feedback: briefly open cart
    document.getElementById('cart-sidebar').classList.add('active');
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
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        count += item.qty;
        cartItemsDiv.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                    <div>
                        <h4>${item.name}</h4>
                        <span>$${(item.price * item.qty).toFixed(2)}</span>
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

    cartCount.innerText = count;
    cartTotal.innerText = `$${total.toFixed(2)}`;
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}

function saveCart() {
    localStorage.setItem('gourmet_cart', JSON.stringify(cart));
}

function goToCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    window.location.href = 'checkout.html';
}

// --- Checkout Logic ---
function initCheckout() {
    const summaryDiv = document.getElementById('summary-items');
    const totalSpan = document.getElementById('summary-total');
    const form = document.getElementById('checkout-form');

    if (!summaryDiv) return;

    let total = 0;
    summaryDiv.innerHTML = '';

    cart.forEach(item => {
        total += item.price * item.qty;
        summaryDiv.innerHTML += `
            <div class="summary-item">
                <img src="${item.img}" alt="${item.name}" class="summary-item-img">
                <div class="summary-item-details">
                    <span>${item.name} x ${item.qty}</span>
                    <span>$${(item.price * item.qty).toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    totalSpan.innerText = `$${total.toFixed(2)}`;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const order = {
            id: 'ORD-' + Date.now(),
            customer: {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
            },
            type: document.getElementById('order-type').value,
            time: document.getElementById('pickup-time').value,
            items: [...cart],
            total: total,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const orders = JSON.parse(localStorage.getItem('gourmet_orders')) || [];
        orders.push(order);
        localStorage.setItem('gourmet_orders', JSON.stringify(orders));

        // Clear cart
        cart = [];
        saveCart();

        alert("Order placed successfully! Thank you.");
        window.location.href = 'index.html';
    });
}

// Initialize based on page
if (document.getElementById('menu-grid')) initMenu();
if (document.getElementById('checkout-form')) initCheckout();
