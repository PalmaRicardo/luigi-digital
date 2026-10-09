import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM clients ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Client not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email, cedula, address, join_date, status } = req.body;
    const { rows } = await query(
      `INSERT INTO clients (name, phone, email, cedula, address, join_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, phone || null, email || null, cedula || null, address || null, join_date, status || 'active']
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, phone, email, cedula, address, join_date, status } = req.body;
    const { rows } = await query(
      `UPDATE clients SET name=$1, phone=$2, email=$3, cedula=$4, address=$5, join_date=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [name, phone || null, email || null, cedula || null, address || null, join_date, status || 'active', req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Client not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Client not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
