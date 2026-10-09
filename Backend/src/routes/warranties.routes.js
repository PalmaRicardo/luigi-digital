import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM warranties ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM warranties WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Warranty not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { client_id, client_name, product, serial, purchase_date, expiry_date, status, type } = req.body;
    const { rows } = await query(
      `INSERT INTO warranties (client_id, client_name, product, serial, purchase_date, expiry_date, status, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [client_id || null, client_name, product, serial || null, purchase_date, expiry_date, status || 'active', type || 'store']
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { client_id, client_name, product, serial, purchase_date, expiry_date, status, type } = req.body;
    const { rows } = await query(
      `UPDATE warranties SET client_id=$1, client_name=$2, product=$3, serial=$4, purchase_date=$5, expiry_date=$6, status=$7, type=$8
       WHERE id=$9 RETURNING *`,
      [client_id || null, client_name, product, serial || null, purchase_date, expiry_date, status || 'active', type || 'store', req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Warranty not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM warranties WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Warranty not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
