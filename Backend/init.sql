-- Luigi GameStore Database Schema
-- Run this file against your PostgreSQL database to create all tables.

DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS warranties CASCADE;
DROP TABLE IF EXISTS tech_services CASCADE;
DROP TABLE IF EXISTS delivery_note_items CASCADE;
DROP TABLE IF EXISTS delivery_notes CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('console', 'accessory', 'game', 'card')),
  brand VARCHAR(50) NOT NULL CHECK (brand IN ('PS5', 'PS4', 'Xbox', 'Multi')),
  sale_price NUMERIC(10, 2),
  rental_price NUMERIC(10, 2),
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'rental', 'both')),
  image TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  cedula VARCHAR(50) UNIQUE,
  address TEXT,
  join_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rentals (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  daily_rate NUMERIC(10, 2) NOT NULL,
  total_days INTEGER NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  deposit NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'transfer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE delivery_notes (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  address TEXT,
  delivered_by VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_note_items (
  id SERIAL PRIMARY KEY,
  delivery_note_id INTEGER REFERENCES delivery_notes(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL
);

CREATE TABLE tech_services (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  device VARCHAR(255) NOT NULL,
  issue TEXT NOT NULL,
  receive_date DATE NOT NULL,
  estimated_date DATE NOT NULL,
  return_date DATE,
  technician VARCHAR(255),
  cost NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'diagnosing', 'repairing', 'ready', 'delivered')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warranties (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  product VARCHAR(255) NOT NULL,
  serial VARCHAR(255),
  purchase_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'claimed')),
  type VARCHAR(20) DEFAULT 'store' CHECK (type IN ('store', 'manufacturer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  supplier VARCHAR(255) NOT NULL,
  product VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  invoice_number VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('received', 'pending', 'returned')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
