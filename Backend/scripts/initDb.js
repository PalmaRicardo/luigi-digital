import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Schema created successfully');

    const products = [
      { name: 'PlayStation 5 Disc Edition', category: 'console', brand: 'PS5', sale_price: 750, rental_price: 25, type: 'both', image: 'https://images.unsplash.com/photo-1752262526779-bd65a9b83c25?w=720&h=520&fit=crop&auto=format', stock: 3, description: '825GB SSD · Ray Tracing · 4K@120fps · DualSense', featured: true },
      { name: 'PlayStation 5 Digital', category: 'console', brand: 'PS5', sale_price: 620, rental_price: 20, type: 'both', image: 'https://images.unsplash.com/photo-1752262526779-bd65a9b83c25?w=720&h=520&fit=crop&auto=format', stock: 2, description: '825GB SSD · Sin lector de discos · 4K gaming' },
      { name: 'PlayStation 4 Pro', category: 'console', brand: 'PS4', sale_price: 350, rental_price: 12, type: 'both', image: 'https://images.unsplash.com/photo-1606813907291-d86eff9d8afd?w=480&h=340&fit=crop&auto=format', stock: 5, description: '1TB HDD · 4K streaming · HDR · 1 control' },
      { name: 'PlayStation 4 Slim', category: 'console', brand: 'PS4', sale_price: 280, rental_price: 10, type: 'both', image: 'https://images.unsplash.com/photo-1606813907291-d86eff9d8afd?w=480&h=340&fit=crop&auto=format', stock: 4, description: '500GB HDD · Diseño compacto · HDR' },
      { name: 'Xbox Series X', category: 'console', brand: 'Xbox', sale_price: 720, rental_price: 23, type: 'both', image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=480&h=340&fit=crop&auto=format', stock: 2, description: '1TB NVMe · 4K@120fps · Quick Resume · Xbox Game Pass', featured: true },
      { name: 'Xbox Series S', category: 'console', brand: 'Xbox', sale_price: 430, rental_price: 15, type: 'both', image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=480&h=340&fit=crop&auto=format', stock: 3, description: '512GB SSD · 1440p · All-digital · Compacto' },
      { name: 'Control DualSense PS5', category: 'accessory', brand: 'PS5', sale_price: 90, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1754594207981-8b97210a6d3a?w=720&h=520&fit=crop&auto=format', stock: 8, description: 'Vibración háptica · Gatillos adaptativos · Blanco' },
      { name: 'DualSense Edge PS5', category: 'accessory', brand: 'PS5', sale_price: 160, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1754594207981-8b97210a6d3a?w=720&h=520&fit=crop&auto=format', stock: 3, description: 'Control Pro · Perfiles personalizables · Back buttons', featured: true },
      { name: 'Control DualShock 4 PS4', category: 'accessory', brand: 'PS4', sale_price: 55, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1754594207981-8b97210a6d3a?w=720&h=520&fit=crop&auto=format', stock: 10, description: 'Inalámbrico · Touchpad · Barra de luz LED' },
      { name: 'Control Xbox Series', category: 'accessory', brand: 'Xbox', sale_price: 65, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1754594207981-8b97210a6d3a?w=720&h=520&fit=crop&auto=format', stock: 7, description: 'Bluetooth · Share button · USB-C' },
      { name: 'Headset PULSE 3D PS5', category: 'accessory', brand: 'PS5', sale_price: 100, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=480&h=340&fit=crop&auto=format', stock: 4, description: 'Audio 3D · Inalámbrico · Micrófono dual' },
      { name: 'Headset Xbox Wireless', category: 'accessory', brand: 'Xbox', sale_price: 95, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=480&h=340&fit=crop&auto=format', stock: 5, description: 'Dolby Atmos · Bluetooth + Xbox Wireless' },
      { name: 'Spider-Man 2 PS5', category: 'game', brand: 'PS5', sale_price: 70, rental_price: 5, type: 'both', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=480&h=340&fit=crop&auto=format', stock: 6, description: "Marvel's Spider-Man 2 · Acción/Aventura" },
      { name: 'God of War Ragnarök', category: 'game', brand: 'PS5', sale_price: 65, rental_price: 5, type: 'both', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=480&h=340&fit=crop&auto=format', stock: 4, description: 'PS4/PS5 · Acción · GOTY 2022' },
      { name: 'Hogwarts Legacy PS5', category: 'game', brand: 'PS5', sale_price: 60, rental_price: 4, type: 'both', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=480&h=340&fit=crop&auto=format', stock: 5, description: 'RPG · Mundo abierto · Harry Potter' },
      { name: 'Mortal Kombat 1 Xbox', category: 'game', brand: 'Xbox', sale_price: 60, rental_price: 4, type: 'both', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=480&h=340&fit=crop&auto=format', stock: 3, description: 'Peleas · Multijugador · Xbox Series X|S' },
      { name: 'Tarjeta PSN $10', category: 'card', brand: 'PS5', sale_price: 11.5, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 25, description: 'PlayStation Store · Código digital · USA' },
      { name: 'Tarjeta PSN $20', category: 'card', brand: 'PS5', sale_price: 23, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 20, description: 'PlayStation Store · Código digital · USA' },
      { name: 'Tarjeta PSN $50', category: 'card', brand: 'PS5', sale_price: 56, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 12, description: 'PlayStation Store · Código digital · USA', featured: true },
      { name: 'Game Pass Ultimate 1 mes', category: 'card', brand: 'Xbox', sale_price: 18, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 15, description: 'Xbox + PC · EA Play incluido · Online' },
      { name: 'Game Pass Ultimate 3 meses', category: 'card', brand: 'Xbox', sale_price: 48, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 8, description: 'Xbox + PC · EA Play · 3 meses', featured: true },
      { name: 'Xbox Gift Card $25', category: 'card', brand: 'Xbox', sale_price: 28, rental_price: null, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 18, description: 'Microsoft Store · Código digital · USA' }
    ];

    for (const p of products) {
      await query(
        `INSERT INTO products (name, category, brand, sale_price, rental_price, type, image, stock, description, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [p.name, p.category, p.brand, p.sale_price, p.rental_price, p.type, p.image, p.stock, p.description, p.featured || false]
      );
    }
    console.log('Products seeded');

    const clients = [
      { name: 'Carlos Mendoza', phone: '0412-555-1234', email: 'carlos.m@gmail.com', cedula: 'V-12345678', address: 'Av. Principal, Urb. Las Palmas, Qta 5', join_date: '2024-01-15', status: 'active' },
      { name: 'María García', phone: '0424-555-5678', email: 'maria.g@gmail.com', cedula: 'V-23456789', address: 'Calle 5, Urb. El Paraíso, Casa 12', join_date: '2024-02-20', status: 'active' },
      { name: 'José Rodríguez', phone: '0416-555-9012', email: 'jose.r@gmail.com', cedula: 'V-34567890', address: 'Torre Central, Piso 3, Apt 3B', join_date: '2024-03-10', status: 'active' },
      { name: 'Ana Martínez', phone: '0414-555-3456', email: 'ana.m@hotmail.com', cedula: 'V-45678901', address: 'Sector Norte, Casa 15', join_date: '2024-01-05', status: 'inactive' },
      { name: 'Luis Pérez', phone: '0426-555-7890', email: 'luis.p@gmail.com', cedula: 'V-56789012', address: 'Urb. Oeste, Qta 8, Calle Mango', join_date: '2024-04-18', status: 'active' },
      { name: 'Sofía Torres', phone: '0412-555-2468', email: 'sofia.t@gmail.com', cedula: 'V-67890123', address: 'Res. Las Américas, Piso 7, Apt 7A', join_date: '2024-05-22', status: 'active' }
    ];

    for (const c of clients) {
      await query(
        `INSERT INTO clients (name, phone, email, cedula, address, join_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [c.name, c.phone, c.email, c.cedula, c.address, c.join_date, c.status]
      );
    }
    console.log('Clients seeded');

    const rentals = [
      { client_name: 'Carlos Mendoza', product_name: 'PlayStation 5 Disc Edition', start_date: '2024-09-20', due_date: '2024-09-27', daily_rate: 25, total_days: 7, deposit: 100, status: 'active' },
      { client_name: 'María García', product_name: 'PlayStation 4 Pro', start_date: '2024-09-18', due_date: '2024-09-22', return_date: '2024-09-22', daily_rate: 12, total_days: 4, deposit: 50, status: 'returned' },
      { client_name: 'José Rodríguez', product_name: 'Xbox Series X', start_date: '2024-09-15', due_date: '2024-09-22', daily_rate: 23, total_days: 7, deposit: 100, status: 'overdue' },
      { client_name: 'Luis Pérez', product_name: 'Spider-Man 2 PS5', start_date: '2024-09-23', due_date: '2024-09-25', daily_rate: 5, total_days: 2, deposit: 20, status: 'active' },
      { client_name: 'Sofía Torres', product_name: 'PlayStation 5 Digital', start_date: '2024-09-10', due_date: '2024-09-17', return_date: '2024-09-17', daily_rate: 20, total_days: 7, deposit: 80, status: 'returned' },
      { client_name: 'Ana Martínez', product_name: 'PlayStation 4 Slim', start_date: '2024-09-01', due_date: '2024-09-05', return_date: '2024-09-05', daily_rate: 10, total_days: 4, deposit: 40, status: 'returned' }
    ];

    for (const r of rentals) {
      await query(
        `INSERT INTO rentals (client_name, product_name, start_date, due_date, return_date, daily_rate, total_days, amount, deposit, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [r.client_name, r.product_name, r.start_date, r.due_date, r.return_date || null, r.daily_rate, r.total_days, r.daily_rate * r.total_days, r.deposit, r.status]
      );
    }
    console.log('Rentals seeded');

    const sales = [
      { client_name: 'Carlos Mendoza', date: '2024-09-22', subtotal: 113, discount: 6, total: 107, payment_method: 'cash', items: [['Control DualSense PS5', 1, 90], ['Tarjeta PSN $20', 1, 23]] },
      { client_name: 'María García', date: '2024-09-20', subtotal: 280, discount: 0, total: 280, payment_method: 'transfer', items: [['PlayStation 4 Slim', 1, 280]] },
      { client_name: 'Ana Martínez', date: '2024-09-19', subtotal: 76, discount: 0, total: 76, payment_method: 'card', items: [['Game Pass Ultimate 3 meses', 1, 48], ['Xbox Gift Card $25', 1, 28]] },
      { client_name: 'Sofía Torres', date: '2024-09-18', subtotal: 160, discount: 10, total: 150, payment_method: 'transfer', items: [['DualSense Edge PS5', 1, 160]] },
      { client_name: 'Luis Pérez', date: '2024-09-17', subtotal: 79, discount: 0, total: 79, payment_method: 'cash', items: [['Tarjeta PSN $50', 1, 56], ['Tarjeta PSN $20', 1, 23]] }
    ];

    for (const s of sales) {
      const saleResult = await query(
        `INSERT INTO sales (client_name, date, subtotal, discount, total, payment_method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [s.client_name, s.date, s.subtotal, s.discount, s.total, s.payment_method]
      );
      const saleId = saleResult.rows[0].id;
      for (const [name, qty, price] of s.items) {
        await query('INSERT INTO sale_items (sale_id, product_name, qty, price) VALUES ($1, $2, $3, $4)', [saleId, name, qty, price]);
      }
    }
    console.log('Sales seeded');

    const deliveries = [
      { client_name: 'Carlos Mendoza', date: '2024-09-22', address: 'Av. Principal, Urb. Las Palmas, Qta 5', delivered_by: 'Pedro Gómez', status: 'delivered', notes: 'Entregado en perfectas condiciones. Firmado.', items: ['PlayStation 5 Disc Edition', 'Control DualSense PS5'] },
      { client_name: 'José Rodríguez', date: '2024-09-25', address: 'Torre Central, Piso 3, Apt 3B', delivered_by: 'Juan Castro', status: 'pending', notes: 'Llamar antes de llegar. Portero eléctrico.', items: ['Xbox Series X', 'Control Xbox Series'] },
      { client_name: 'Sofía Torres', date: '2024-09-20', address: 'Res. Las Américas, Piso 7, Apt 7A', delivered_by: 'Pedro Gómez', status: 'delivered', notes: '', items: ['DualSense Edge PS5'] },
      { client_name: 'Ana Martínez', date: '2024-09-23', address: 'Sector Norte, Casa 15', delivered_by: 'Juan Castro', status: 'failed', notes: 'Nadie en casa. Se reprograma para mañana.', items: ['Tarjeta PSN $50 x2'] }
    ];

    for (const d of deliveries) {
      const noteResult = await query(
        `INSERT INTO delivery_notes (client_name, date, address, delivered_by, status, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [d.client_name, d.date, d.address, d.delivered_by, d.status, d.notes]
      );
      const noteId = noteResult.rows[0].id;
      for (const item of d.items) {
        await query('INSERT INTO delivery_note_items (delivery_note_id, item_name) VALUES ($1, $2)', [noteId, item]);
      }
    }
    console.log('Deliveries seeded');

    const services = [
      { client_name: 'Carlos Mendoza', device: 'PlayStation 4 Pro', issue: 'No enciende · Error CE-34878-0', receive_date: '2024-09-18', estimated_date: '2024-09-25', return_date: null, technician: 'Miguel Ángel', cost: 45, status: 'repairing', notes: 'Fuente de poder dañada. Esperando repuesto.' },
      { client_name: 'Ana Martínez', device: 'Xbox One S', issue: 'Lector de disco no reconoce juegos', receive_date: '2024-09-20', estimated_date: '2024-09-23', return_date: '2024-09-23', technician: 'Miguel Ángel', cost: 60, status: 'delivered', notes: 'Limpieza y calibración de lentes. Listo.' },
      { client_name: 'Luis Pérez', device: 'DualSense PS5', issue: 'Stick izquierdo con drift', receive_date: '2024-09-24', estimated_date: '2024-09-26', return_date: null, technician: 'Roberto Silva', cost: 30, status: 'diagnosing', notes: '' },
      { client_name: 'José Rodríguez', device: 'PlayStation 5 Disc Edition', issue: 'Ruido al leer discos · vibración excesiva', receive_date: '2024-09-22', estimated_date: '2024-09-28', return_date: null, technician: 'Miguel Ángel', cost: 55, status: 'received', notes: 'En revisión inicial.' },
      { client_name: 'Sofía Torres', device: 'Control Xbox Series', issue: 'Botón RB no responde', receive_date: '2024-09-21', estimated_date: '2024-09-24', return_date: '2024-09-24', technician: 'Roberto Silva', cost: 20, status: 'ready', notes: 'Soldadura realizada. Listo para entrega.' }
    ];

    for (const s of services) {
      await query(
        `INSERT INTO tech_services (client_name, device, issue, receive_date, estimated_date, return_date, technician, cost, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [s.client_name, s.device, s.issue, s.receive_date, s.estimated_date, s.return_date, s.technician, s.cost, s.status, s.notes]
      );
    }
    console.log('Tech services seeded');

    const warranties = [
      { client_name: 'Carlos Mendoza', product: 'PlayStation 5 Disc Edition', serial: 'CF12345678', purchase_date: '2024-01-15', expiry_date: '2025-01-15', status: 'active', type: 'store' },
      { client_name: 'María García', product: 'PlayStation 4 Slim', serial: 'GH98765432', purchase_date: '2024-03-10', expiry_date: '2025-03-10', status: 'active', type: 'manufacturer' },
      { client_name: 'José Rodríguez', product: 'Xbox Series X', serial: 'XB11223344', purchase_date: '2023-06-20', expiry_date: '2024-06-20', status: 'expired', type: 'store' },
      { client_name: 'Sofía Torres', product: 'DualSense Edge PS5', serial: 'DE55667788', purchase_date: '2024-09-18', expiry_date: '2025-09-18', status: 'active', type: 'store' },
      { client_name: 'Ana Martínez', product: 'Xbox One S', serial: 'XO99887766', purchase_date: '2022-11-05', expiry_date: '2023-11-05', status: 'claimed', type: 'manufacturer' }
    ];

    for (const w of warranties) {
      await query(
        `INSERT INTO warranties (client_name, product, serial, purchase_date, expiry_date, status, type) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [w.client_name, w.product, w.serial, w.purchase_date, w.expiry_date, w.status, w.type]
      );
    }
    console.log('Warranties seeded');

    const purchases = [
      { supplier: 'TechVenezuela Dist.', product: 'PlayStation 5 Disc Edition', quantity: 5, unit_cost: 620, date: '2024-09-01', invoice_number: 'FAC-2024-0891', status: 'received' },
      { supplier: 'GameWorld Import C.A.', product: 'Xbox Series X', quantity: 3, unit_cost: 590, date: '2024-09-10', invoice_number: 'FAC-2024-0945', status: 'received' },
      { supplier: 'CardPlus Venezuela', product: 'Tarjetas PSN $20 (lote x50)', quantity: 50, unit_cost: 19, date: '2024-09-20', invoice_number: 'FAC-2024-1023', status: 'received' },
      { supplier: 'TechVenezuela Dist.', product: 'Control DualSense PS5 x10', quantity: 10, unit_cost: 72, date: '2024-09-22', invoice_number: 'FAC-2024-1045', status: 'pending' },
      { supplier: 'CardPlus Venezuela', product: 'Game Pass Ultimate 1 mes x20', quantity: 20, unit_cost: 14, date: '2024-09-23', invoice_number: 'FAC-2024-1067', status: 'pending' },
      { supplier: 'ConsoleHub Import', product: 'PlayStation 5 Digital', quantity: 2, unit_cost: 500, date: '2024-08-28', invoice_number: 'FAC-2024-0820', status: 'returned' }
    ];

    for (const p of purchases) {
      await query(
        `INSERT INTO purchases (supplier, product, quantity, unit_cost, total, date, invoice_number, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [p.supplier, p.product, p.quantity, p.unit_cost, p.quantity * p.unit_cost, p.date, p.invoice_number, p.status]
      );
    }
    console.log('Purchases seeded');

    const messages = [
      { name: 'Gabriel Torres', email: 'gabriel.t@gmail.com', phone: '0412-111-2233', subject: 'Consulta por PS5', message: 'Buenas tardes, quisiera saber si tienen disponible alquiler de PS5 por fin de semana completo.', date: '2024-09-24', status: 'unread' },
      { name: 'Elena Rivas', email: 'elena.r@hotmail.com', phone: '0424-999-8877', subject: 'Servicio Técnico Xbox', message: 'Hola, mi Xbox Series S hace ruido excesivo en el ventilador. ¿Hacen mantenimiento preventivo?', date: '2024-09-23', status: 'read' },
      { name: 'Marcos Silva', email: 'marcos.silva@yahoo.com', phone: '0414-333-4455', subject: 'Garantía de mando DualSense', message: 'Compré un mando hace 2 semanas y el botón R2 se siente flojo.', date: '2024-09-21', status: 'replied' }
    ];

    for (const m of messages) {
      await query(
        `INSERT INTO contact_messages (name, email, phone, subject, message, date, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [m.name, m.email, m.phone, m.subject, m.message, m.date, m.status]
      );
    }
    console.log('Contact messages seeded');

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
