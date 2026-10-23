const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data folder and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const INITIAL_MENU = [
  { id: 1, name: "Garlic Bread", price: 5.99, category: "Starters", desc: "Toasted baguette with garlic butter and herbs", isVeg: true, rating: 4.8, img: "https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=400&q=80" },
  { id: 2, name: "Mozzarella Sticks", price: 7.49, category: "Starters", desc: "Crispy melted cheese with marinara dip", isVeg: true, rating: 4.7, img: "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?auto=format&fit=crop&w=400&q=80" },
  { id: 3, name: "Classic Pepperoni", price: 14.99, category: "Mains", desc: "Mozzarella, pepperoni, and signature tomato sauce", isVeg: false, rating: 4.9, img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80" },
  { id: 4, name: "BBQ Chicken Pizza", price: 16.49, category: "Mains", desc: "Grilled chicken, BBQ sauce, red onions, and cilantro", isVeg: false, rating: 4.8, img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" },
  { id: 5, name: "Veggie Delight", price: 13.99, category: "Mains", desc: "Bell peppers, mushrooms, olives, and fresh spinach", isVeg: true, rating: 4.6, img: "https://images.unsplash.com/photo-1574071318508-1cdbe5c7e2f1?auto=format&fit=crop&w=400&q=80" },
  { id: 6, name: "Tiramisu", price: 6.99, category: "Desserts", desc: "Traditional Italian coffee-flavored dessert", isVeg: true, rating: 4.9, img: "https://images.unsplash.com/photo-1571877227200-a0d766f6655d?auto=format&fit=crop&w=400&q=80" },
  { id: 7, name: "Chocolate Lava Cake", price: 7.99, category: "Desserts", desc: "Warm cake with a gooey chocolate center", isVeg: true, rating: 4.9, img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80" },
  { id: 8, name: "Iced Peach Tea", price: 3.49, category: "Drinks", desc: "Refreshing brewed tea with natural peach flavor", isVeg: true, rating: 4.5, img: "https://images.unsplash.com/photo-1556679343-66577d2d237f?auto=format&fit=crop&w=400&q=80" },
  { id: 9, name: "Classic Cola", price: 2.49, category: "Drinks", desc: "Ice cold refreshing cola", isVeg: true, rating: 4.6, img: "https://images.unsplash.com/photo-1622483767028-73976565776c?auto=format&fit=crop&w=400&q=80" }
];

if (!fs.existsSync(MENU_FILE)) {
  fs.writeFileSync(MENU_FILE, JSON.stringify(INITIAL_MENU, null, 2));
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // --- API Routes ---
  if (pathname === '/api/menu' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readJson(MENU_FILE)));
    return;
  }

  if (pathname === '/api/menu' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newItem = JSON.parse(body);
        const menu = readJson(MENU_FILE);
        newItem.id = Date.now();
        menu.push(newItem);
        writeJson(MENU_FILE, menu);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newItem));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/menu/') && req.method === 'DELETE') {
    const id = parseInt(pathname.split('/').pop(), 10);
    let menu = readJson(MENU_FILE);
    menu = menu.filter(m => m.id !== id);
    writeJson(MENU_FILE, menu);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (pathname === '/api/orders' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readJson(ORDERS_FILE)));
    return;
  }

  if (pathname === '/api/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const orderData = JSON.parse(body);
        const orders = readJson(ORDERS_FILE);
        orderData.id = 'ORD-' + Date.now();
        orderData.createdAt = new Date().toISOString();
        orderData.status = 'pending';
        orders.push(orderData);
        writeJson(ORDERS_FILE, orders);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(orderData));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid order data' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/orders/') && req.method === 'PUT') {
    const id = pathname.split('/').pop();
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { status } = JSON.parse(body);
        const orders = readJson(ORDERS_FILE);
        const order = orders.find(o => o.id === id);
        if (order) {
          order.status = status;
          writeJson(ORDERS_FILE, orders);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(order));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Order not found' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid data' }));
      }
    });
    return;
  }

  // --- Static File Serving ---
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Gourmet Express server running at http://localhost:${PORT}`);
});

