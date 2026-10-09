import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM delivery_notes ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const note = await query('SELECT * FROM delivery_notes WHERE id = $1', [req.params.id]);
    if (!note.rows.length) return res.status(404).json({ message: 'Delivery note not found' });
    const items = await query('SELECT * FROM delivery_note_items WHERE delivery_note_id = $1', [req.params.id]);
    res.json({ ...note.rows[0], items: items.rows.map(i => i.item_name) });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { client_id, client_name, date, address, delivered_by, status, notes, items } = req.body;
    const noteResult = await query(
      `INSERT INTO delivery_notes (client_id, client_name, date, address, delivered_by, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [client_id || null, client_name, date, address || null, delivered_by || null, status || 'pending', notes || null]
    );
    const note = noteResult.rows[0];
    if (Array.isArray(items) && items.length) {
      for (const item of items) {
        await query(
          'INSERT INTO delivery_note_items (delivery_note_id, item_name) VALUES ($1, $2)',
          [note.id, item]
        );
      }
    }
    res.status(201).json(note);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { client_id, client_name, date, address, delivered_by, status, notes, items } = req.body;
    const { rows } = await query(
      `UPDATE delivery_notes SET client_id=$1, client_name=$2, date=$3, address=$4, delivered_by=$5, status=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [client_id || null, client_name, date, address || null, delivered_by || null, status || 'pending', notes || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Delivery note not found' });
    if (Array.isArray(items)) {
      await query('DELETE FROM delivery_note_items WHERE delivery_note_id = $1', [req.params.id]);
      for (const item of items) {
        await query('INSERT INTO delivery_note_items (delivery_note_id, item_name) VALUES ($1, $2)', [req.params.id, item]);
      }
    }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM delivery_notes WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Delivery note not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
