import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM tech_services ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM tech_services WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Tech service not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { client_id, client_name, device, issue, receive_date, estimated_date, return_date, technician, cost, status, notes } = req.body;
    const { rows } = await query(
      `INSERT INTO tech_services (client_id, client_name, device, issue, receive_date, estimated_date, return_date, technician, cost, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [client_id || null, client_name, device, issue, receive_date, estimated_date, return_date || null, technician || null, cost || 0, status || 'received', notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { client_id, client_name, device, issue, receive_date, estimated_date, return_date, technician, cost, status, notes } = req.body;
    const { rows } = await query(
      `UPDATE tech_services SET client_id=$1, client_name=$2, device=$3, issue=$4, receive_date=$5, estimated_date=$6, return_date=$7,
       technician=$8, cost=$9, status=$10, notes=$11 WHERE id=$12 RETURNING *`,
      [client_id || null, client_name, device, issue, receive_date, estimated_date, return_date || null, technician || null, cost || 0, status || 'received', notes || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Tech service not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM tech_services WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Tech service not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
