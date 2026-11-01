import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

// Helper interno: sincroniza vencimientos en base a CURRENT_DATE y arma la cola de alertas
async function syncOverdueAndQueue() {
  // 1. Marcar como 'overdue' las cuotas pendientes cuya fecha de vencimiento ya pasó
  await query(`
    UPDATE financing_installments
    SET status = 'overdue'
    WHERE status = 'pending' AND due_date < CURRENT_DATE
  `);

  // 2. Actualizar estatus del plan de financiamiento según sus cuotas
  await query(`
    UPDATE financing_plans p
    SET status = CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM financing_installments i
        WHERE i.plan_id = p.id AND i.installment_number > 0 AND i.status <> 'paid'
      ) THEN 'completed'
      WHEN EXISTS (
        SELECT 1 FROM financing_installments i
        WHERE i.plan_id = p.id AND i.status = 'overdue'
      ) THEN 'overdue'
      ELSE 'active'
    END
    WHERE p.status <> 'cancelled'
  `);

  // 3. Activar en 'ready_to_send' los avisos programados cuya fecha ya llegó (3 días antes o hoy)
  await query(`
    UPDATE financing_notifications_queue q
    SET dispatch_status = 'ready_to_send'
    FROM financing_installments i
    WHERE q.installment_id = i.id
      AND i.status <> 'paid'
      AND q.dispatch_status = 'scheduled'
      AND q.scheduled_for <= CURRENT_DATE
  `);
}

// GET /api/financings -> Lista todos los planes con su estado de cuenta (cuotas)
router.get('/', async (_req, res, next) => {
  try {
    await syncOverdueAndQueue();
    const { rows: plans } = await query('SELECT * FROM financing_plans ORDER BY id DESC');
    const { rows: installments } = await query('SELECT * FROM financing_installments ORDER BY plan_id, installment_number ASC');
    const byPlan = installments.reduce((acc, row) => {
      (acc[row.plan_id] = acc[row.plan_id] || []).push(row);
      return acc;
    }, {});
    res.json(plans.map(p => ({ ...p, installments: byPlan[p.id] || [] })));
  } catch (err) { next(err); }
});

// GET /api/financings/alerts -> Conteo de vencimientos, listado de morosos y avisos listos para disparar
router.get('/alerts', async (_req, res, next) => {
  try {
    await syncOverdueAndQueue();
    const { rows: morosos } = await query(`
      SELECT
        p.id AS plan_id,
        p.client_name,
        p.client_cedula,
        p.client_phone,
        p.client_email,
        p.product_name,
        COALESCE(p.modality, 'installments') AS modality,
        COUNT(i.id) FILTER (WHERE i.status = 'overdue')::int AS overdue_installments_count,
        MIN(i.due_date) FILTER (WHERE i.status = 'overdue') AS oldest_due_date,
        (CURRENT_DATE - MIN(i.due_date) FILTER (WHERE i.status = 'overdue'))::int AS max_days_overdue,
        COALESCE(SUM(i.amount - i.paid_amount) FILTER (WHERE i.status = 'overdue'), 0)::numeric(10,2) AS overdue_amount,
        COALESCE(SUM(i.amount - i.paid_amount) FILTER (WHERE i.status <> 'paid'), 0)::numeric(10,2) AS total_remaining_balance
      FROM financing_plans p
      JOIN financing_installments i ON i.plan_id = p.id
      WHERE p.status <> 'cancelled'
      GROUP BY p.id
      HAVING COUNT(i.id) FILTER (WHERE i.status = 'overdue') > 0
      ORDER BY max_days_overdue DESC
    `);

    const { rows: readyQueue } = await query(`
      SELECT q.*, p.modality
      FROM financing_notifications_queue q
      JOIN financing_installments i ON i.id = q.installment_id
      JOIN financing_plans p ON p.id = q.plan_id
      WHERE i.status <> 'paid'
      ORDER BY q.scheduled_for ASC
    `);

    res.json({
      overdue_clients_count: morosos.length,
      headline: `Hoy hay ${morosos.length} cliente(s) con cuotas vencidas`,
      morosos,
      notifications_queue: readyQueue,
    });
  } catch (err) { next(err); }
});

// POST /api/financings -> Crea un plan (En Cuotas Quincenales o Alquiler Mensual)
router.post('/', async (req, res, next) => {
  try {
    const {
      client_id, client_name, client_cedula, client_phone, client_email,
      product_id, product_name, modality = 'installments', item_type = 'product',
      start_date, total_amount, initial_payment = 0,
      installments_count, monthly_rate, contract_months,
      payment_method = 'cash', notes
    } = req.body;

    const isRental = modality === 'monthly_rental';
    const rate = Number(monthly_rate) || 35;
    const months = Math.max(1, Number(contract_months) || 3);
    const count = isRental ? months : Math.min(4, Math.max(2, Number(installments_count) || 3));
    const initial = Number(initial_payment) || 0;
    const total = isRental ? Number((rate * months + initial).toFixed(2)) : Number(total_amount);
    const financed = Math.max(0, Number((total - initial).toFixed(2)));

    const { rows: planRows } = await query(
      `INSERT INTO financing_plans
        (client_id, client_name, client_cedula, client_phone, client_email, product_id, product_name,
         modality, item_type, start_date, total_amount, initial_payment, financed_amount,
         installments_count, frequency_days, monthly_rate, contract_months, renewals_count, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,0,'active',$18)
       RETURNING *`,
      [client_id || null, client_name, client_cedula || null, client_phone || null, client_email || null,
       product_id || null, product_name, modality, item_type, start_date, total, initial, financed,
       count, isRental ? 30 : 15, isRental ? rate : null, isRental ? months : null, notes || null]
    );
    const plan = planRows[0];

    // Cuota Inicial / Depósito si es mayor a 0
    if (initial > 0) {
      await query(
        `INSERT INTO financing_installments
          (plan_id, installment_number, label, due_date, amount, paid_amount, paid_at, payment_method, status)
         VALUES ($1, 0, $2, $3, $4, $4, $3, $5, 'paid')`,
        [plan.id, isRental ? 'Depósito / Pago Inicial' : 'Cuota Inicial', start_date, initial, payment_method]
      );
    }

    if (isRental) {
      // Alquiler mensual: cada mes
      for (let i = 1; i <= months; i++) {
        const { rows: instRows } = await query(
          `INSERT INTO financing_installments
            (plan_id, installment_number, label, due_date, amount, paid_amount, status)
           VALUES ($1, $2, $3, ($4::date + ($5 || ' month')::interval)::date, $6, 0,
                   CASE WHEN ($4::date + ($5 || ' month')::interval)::date < CURRENT_DATE THEN 'overdue' ELSE 'pending' END)
           RETURNING *`,
          [plan.id, i, `Mensualidad Mes ${i} de ${months}`, start_date, String(i), rate]
        );
        const inst = instRows[0];

        for (const trig of [
          { type: 'PRE_DUE_3D', offset: -3 },
          { type: 'DUE_TODAY', offset: 0 },
        ]) {
          const payload = {
            event: trig.type,
            plan_id: plan.id,
            installment_number: i,
            modality: 'monthly_rental',
            recipient: { name: client_name, phone: client_phone, email: client_email },
            product: product_name,
            amount_usd: Number(rate),
            due_date: inst.due_date,
          };
          await query(
            `INSERT INTO financing_notifications_queue
              (plan_id, installment_id, installment_number, client_name, client_phone, client_email,
               trigger_type, scheduled_for, dispatch_status, payload)
             VALUES ($1, $2, $3, $4, $5, $6, $7, ($8::date + ($9 || ' days')::interval)::date, 'scheduled', $10)`,
            [plan.id, inst.id, i, client_name, client_phone || null, client_email || null,
             trig.type, inst.due_date, String(trig.offset), JSON.stringify(payload)]
          );
        }
      }
    } else {
      // Financiamiento Quincenal: cada 15 días
      const baseQuota = Math.floor((financed / count) * 100) / 100;
      const remainder = Number((financed - baseQuota * count).toFixed(2));

      for (let i = 1; i <= count; i++) {
        const amount = i === count ? Number((baseQuota + remainder).toFixed(2)) : baseQuota;
        const daysOffset = i * 15;
        const { rows: instRows } = await query(
          `INSERT INTO financing_installments
            (plan_id, installment_number, label, due_date, amount, paid_amount, status)
           VALUES ($1, $2, $3, ($4::date + ($5 || ' days')::interval)::date, $6, 0,
                   CASE WHEN ($4::date + ($5 || ' days')::interval)::date < CURRENT_DATE THEN 'overdue' ELSE 'pending' END)
           RETURNING *`,
          [plan.id, i, `Cuota ${i} de ${count}`, start_date, String(daysOffset), amount]
        );
        const inst = instRows[0];

        for (const trig of [
          { type: 'PRE_DUE_3D', offset: -3 },
          { type: 'DUE_TODAY', offset: 0 },
        ]) {
          const payload = {
            event: trig.type,
            plan_id: plan.id,
            installment_number: i,
            modality: 'installments',
            recipient: { name: client_name, phone: client_phone, email: client_email },
            product: product_name,
            amount_usd: Number(amount),
            due_date: inst.due_date,
          };
          await query(
            `INSERT INTO financing_notifications_queue
              (plan_id, installment_id, installment_number, client_name, client_phone, client_email,
               trigger_type, scheduled_for, dispatch_status, payload)
             VALUES ($1, $2, $3, $4, $5, $6, $7, ($8::date + ($9 || ' days')::interval)::date, 'scheduled', $10)`,
            [plan.id, inst.id, i, client_name, client_phone || null, client_email || null,
             trig.type, inst.due_date, String(trig.offset), JSON.stringify(payload)]
          );
        }
      }
    }

    await syncOverdueAndQueue();
    const { rows: allInst } = await query('SELECT * FROM financing_installments WHERE plan_id = $1 ORDER BY installment_number ASC', [plan.id]);
    res.status(201).json({ ...plan, installments: allInst });
  } catch (err) { next(err); }
});

// POST /api/financings/:id/renew -> Renueva un contrato de alquiler mensual agregando meses
router.post('/:id/renew', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { additional_months = 1 } = req.body;
    const addMonths = Math.max(1, Number(additional_months) || 1);

    const { rows: plans } = await query('SELECT * FROM financing_plans WHERE id = $1', [id]);
    if (!plans.length) return res.status(404).json({ message: 'Plan not found' });
    const plan = plans[0];

    const rate = Number(plan.monthly_rate) || 35;
    const { rows: maxInst } = await query(
      'SELECT MAX(installment_number) as max_num, MAX(due_date) as last_date FROM financing_installments WHERE plan_id = $1',
      [id]
    );
    const startNum = Number(maxInst[0]?.max_num || 0);
    const lastDate = maxInst[0]?.last_date || plan.start_date;

    for (let m = 1; m <= addMonths; m++) {
      const num = startNum + m;
      await query(
        `INSERT INTO financing_installments
          (plan_id, installment_number, label, due_date, amount, paid_amount, status)
         VALUES ($1, $2, $3, ($4::date + ($5 || ' month')::interval)::date, $6, 0, 'pending')`,
        [id, num, `Mensualidad Mes ${num} (Renovado)`, lastDate, String(m), rate]
      );
    }

    const addedTotal = rate * addMonths;
    const { rows: updated } = await query(
      `UPDATE financing_plans
       SET total_amount = total_amount + $1,
           financed_amount = financed_amount + $1,
           contract_months = COALESCE(contract_months, installments_count) + $2,
           installments_count = installments_count + $2,
           renewals_count = renewals_count + 1,
           last_renewed_at = CURRENT_DATE,
           status = 'active'
       WHERE id = $3
       RETURNING *`,
      [addedTotal, addMonths, id]
    );

    await syncOverdueAndQueue();
    const { rows: allInst } = await query('SELECT * FROM financing_installments WHERE plan_id = $1 ORDER BY installment_number ASC', [id]);
    res.json({ ...updated[0], installments: allInst });
  } catch (err) { next(err); }
});

// PATCH /api/financings/:planId/installments/:number/pay -> Registra el pago de una cuota
router.patch('/:planId/installments/:number/pay', async (req, res, next) => {
  try {
    const { planId, number } = req.params;
    const { payment_method = 'cash', paid_at } = req.body;
    const { rows } = await query(
      `UPDATE financing_installments
       SET paid_amount = amount,
           paid_at = COALESCE($1::date, CURRENT_DATE),
           payment_method = $2,
           status = 'paid'
       WHERE plan_id = $3 AND installment_number = $4
       RETURNING *`,
      [paid_at || null, payment_method, planId, number]
    );
    if (!rows.length) return res.status(404).json({ message: 'Installment not found' });
    await syncOverdueAndQueue();
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/financings/:id -> Cancela o elimina un plan
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM financing_plans WHERE id = $1', [id]);
    res.json({ message: `Plan ${id} deleted successfully` });
  } catch (err) { next(err); }
});

export default router;
