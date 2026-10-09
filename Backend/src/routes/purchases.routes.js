import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM purchases ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM purchases WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Purchase not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { supplier, product, quantity, unit_cost, date, invoice_number, status } = req.body;
    const total = Number(quantity) * Number(unit_cost);
    const { rows } = await query(
      `INSERT INTO purchases (supplier, product, quantity, unit_cost, total, date, invoice_number, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [supplier, product, quantity, unit_cost, total, date, invoice_number || null, status || 'pending']
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { supplier, product, quantity, unit_cost, date, invoice_number, status } = req.body;
    const total = Number(quantity) * Number(unit_cost);
    const { rows } = await query(
      `UPDATE purchases SET supplier=$1, product=$2, quantity=$3, unit_cost=$4, total=$5, date=$6, invoice_number=$7, status=$8
       WHERE id=$9 RETURNING *`,
      [supplier, product, quantity, unit_cost, total, date, invoice_number || null, status || 'pending', req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Purchase not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM purchases WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Purchase not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
