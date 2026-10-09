import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM sales ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const sale = await query('SELECT * FROM sales WHERE id = $1', [req.params.id]);
    if (!sale.rows.length) return res.status(404).json({ message: 'Sale not found' });
    const items = await query('SELECT * FROM sale_items WHERE sale_id = $1', [req.params.id]);
    res.json({ ...sale.rows[0], items: items.rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { client_id, client_name, date, subtotal, discount, total, payment_method, items } = req.body;
    const saleResult = await query(
      `INSERT INTO sales (client_id, client_name, date, subtotal, discount, total, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [client_id || null, client_name, date, subtotal, discount || 0, total, payment_method]
    );
    const sale = saleResult.rows[0];
    if (Array.isArray(items) && items.length) {
      for (const item of items) {
        await query(
          `INSERT INTO sale_items (sale_id, product_id, product_name, qty, price) VALUES ($1, $2, $3, $4, $5)`,
          [sale.id, item.product_id || null, item.product_name, item.qty || 1, item.price]
        );
        if (item.product_id) {
          await query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.qty || 1, item.product_id]);
        }
      }
    }
    res.status(201).json(sale);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { client_id, client_name, date, subtotal, discount, total, payment_method } = req.body;
    const { rows } = await query(
      `UPDATE sales SET client_id=$1, client_name=$2, date=$3, subtotal=$4, discount=$5, total=$6, payment_method=$7
       WHERE id=$8 RETURNING *`,
      [client_id || null, client_name, date, subtotal, discount || 0, total, payment_method, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Sale not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM sales WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Sale not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
