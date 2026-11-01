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
    const {
      client_id, client_name, product_id, product_name,
      start_date, due_date, daily_rate, total_days, deposit, status,
      rental_type = 'product'
    } = req.body;
    const amount = Number(daily_rate) * Number(total_days);
    const { rows } = await query(
      `INSERT INTO rentals (client_id, client_name, product_id, product_name, rental_type, start_date, due_date, daily_rate, total_days, amount, deposit, status, renewals_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0) RETURNING *`,
      [client_id || null, client_name, product_id || null, product_name, rental_type, start_date, due_date, daily_rate, total_days, amount, deposit || 0, status || 'active']
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const {
      client_id, client_name, product_id, product_name,
      start_date, due_date, return_date, daily_rate, total_days, deposit, status,
      rental_type = 'product', renewals_count = 0, last_renewed_at = null
    } = req.body;
    const amount = Number(daily_rate) * Number(total_days);
    const { rows } = await query(
      `UPDATE rentals SET client_id=$1, client_name=$2, product_id=$3, product_name=$4, rental_type=$5, start_date=$6, due_date=$7, return_date=$8,
       daily_rate=$9, total_days=$10, amount=$11, deposit=$12, status=$13, renewals_count=$14, last_renewed_at=$15 WHERE id=$16 RETURNING *`,
      [client_id || null, client_name, product_id || null, product_name, rental_type, start_date, due_date, return_date || null, daily_rate, total_days, amount, deposit || 0, status || 'active', renewals_count, last_renewed_at, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Rental not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * Renovación de Contrato Mensual:
 * Extiende el contrato por N meses (por defecto 1), recalcula el nuevo vencimiento,
 * incrementa el número total de meses y monto acumulado, y reactiva el estado.
 */
router.post('/:id/renew', async (req, res, next) => {
  try {
    const { additional_months = 1 } = req.body;
    const addMonths = Math.max(1, Number(additional_months) || 1);

    const existing = await query('SELECT * FROM rentals WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ message: 'Rental not found' });
    const r = existing.rows[0];

    const currentDue = new Date(r.due_date);
    currentDue.setMonth(currentDue.getMonth() + addMonths);
    const newDueDate = currentDue.toISOString().slice(0, 10);
    const newTotalDays = Number(r.total_days) + addMonths;
    const newAmount = Number(r.daily_rate) * newTotalDays;
    const newRenewalsCount = (Number(r.renewals_count) || 0) + 1;

    const { rows } = await query(
      `UPDATE rentals
       SET due_date = $1, total_days = $2, amount = $3, status = 'active',
           renewals_count = $4, last_renewed_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [newDueDate, newTotalDays, newAmount, newRenewalsCount, req.params.id]
    );

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
