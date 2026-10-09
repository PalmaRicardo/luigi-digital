import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';

import productRoutes from './routes/products.routes.js';
import clientRoutes from './routes/clients.routes.js';
import rentalRoutes from './routes/rentals.routes.js';
import saleRoutes from './routes/sales.routes.js';
import deliveryRoutes from './routes/deliveries.routes.js';
import techServiceRoutes from './routes/techServices.routes.js';
import warrantyRoutes from './routes/warranties.routes.js';
import purchaseRoutes from './routes/purchases.routes.js';
import contactRoutes from './routes/contact.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/tech-services', techServiceRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', timestamp: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
