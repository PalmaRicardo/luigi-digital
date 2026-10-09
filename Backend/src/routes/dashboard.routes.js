import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const productCount = await query('SELECT COUNT(*) FROM products');
    const clientCount = await query('SELECT COUNT(*) FROM clients');
    const activeRentals = await query("SELECT COUNT(*) FROM rentals WHERE status = 'active'");
    const pendingDeliveries = await query("SELECT COUNT(*) FROM delivery_notes WHERE status = 'pending'");
    const totalSales = await query('SELECT COALESCE(SUM(total), 0) as total FROM sales');
    const lowStock = await query('SELECT COUNT(*) FROM products WHERE stock <= 3');
    const recentSales = await query('SELECT * FROM sales ORDER BY id DESC LIMIT 5');
    const activeServices = await query("SELECT COUNT(*) FROM tech_services WHERE status NOT IN ('delivered')");

    res.json({
      products: Number(productCount.rows[0].count),
      clients: Number(clientCount.rows[0].count),
      activeRentals: Number(activeRentals.rows[0].count),
      pendingDeliveries: Number(pendingDeliveries.rows[0].count),
      totalSales: Number(totalSales.rows[0].total),
      lowStock: Number(lowStock.rows[0].count),
      activeServices: Number(activeServices.rows[0].count),
      recentSales: recentSales.rows
    });
  } catch (err) { next(err); }
});

export default router;
