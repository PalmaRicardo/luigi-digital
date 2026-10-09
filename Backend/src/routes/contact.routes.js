import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM contact_messages ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM contact_messages WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Message not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, date, status } = req.body;
    const { rows } = await query(
      `INSERT INTO contact_messages (name, email, phone, subject, message, date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, email || null, phone || null, subject || null, message, date || new Date().toISOString().slice(0, 10), status || 'unread']
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, date, status } = req.body;
    const { rows } = await query(
      `UPDATE contact_messages SET name=$1, email=$2, phone=$3, subject=$4, message=$5, date=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [name, email || null, phone || null, subject || null, message, date, status || 'unread', req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Message not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Message not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
