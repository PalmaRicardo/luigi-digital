import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM rentals ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM rentals WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Rental not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { client_id, client_name, product_id, product_name, start_date, due_date, daily_rate, total_days, deposit, status } = req.body;
    const amount = Number(daily_rate) * Number(total_days);
    const { rows } = await query(
      `INSERT INTO rentals (client_id, client_name, product_id, product_name, start_date, due_date, daily_rate, total_days, amount, deposit, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [client_id || null, client_name, product_id || null, product_name, start_date, due_date, daily_rate, total_days, amount, deposit || 0, status || 'active']
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { client_id, client_name, product_id, product_name, start_date, due_date, return_date, daily_rate, total_days, deposit, status } = req.body;
    const amount = Number(daily_rate) * Number(total_days);
    const { rows } = await query(
      `UPDATE rentals SET client_id=$1, client_name=$2, product_id=$3, product_name=$4, start_date=$5, due_date=$6, return_date=$7,
       daily_rate=$8, total_days=$9, amount=$10, deposit=$11, status=$12 WHERE id=$13 RETURNING *`,
      [client_id || null, client_name, product_id || null, product_name, start_date, due_date, return_date || null, daily_rate, total_days, amount, deposit || 0, status || 'active', req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Rental not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM rentals WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Rental not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
