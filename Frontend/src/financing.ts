// ─── Módulo de Lógica Interna: Financiamiento en Cuotas y Alquiler Mensual ────
// Soporta financiamiento en cuotas quincenales (cuota inicial + 2 a 4 cuotas)
// y alquiler mensual renovable (canon mensual por N meses con extensión continua).
// Diseñado de forma desacoplada para que cualquier canal externo (WhatsApp API,
// Email, SMS o Pasarela de Pago) pueda suscribirse a la cola de eventos sin
// modificar la lógica de negocio ni los cálculos de cartera.

export type FinancingModality = 'installments' | 'monthly_rental';
export type InstallmentCount = 2 | 3 | 4;
export type InstallmentStatus = 'paid' | 'pending' | 'overdue';
export type FinancingPlanStatus = 'active' | 'completed' | 'overdue' | 'cancelled';
export type NotificationTriggerType = 'PRE_DUE_3D' | 'DUE_TODAY' | 'OVERDUE';
export type NotificationDispatchStatus = 'scheduled' | 'ready_to_send' | 'sent';

export interface FinancingInstallment {
  id: string;
  planId: string;
  number: number; // 0 = Cuota Inicial / Depósito, 1..N = Cuotas Quincenales o Mensualidades
  label: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  paidAmount: number;
  paidAt?: string; // YYYY-MM-DD
  paymentMethod?: 'cash' | 'card' | 'transfer';
  status: InstallmentStatus;
  daysDiff: number; // < 0 = días vencidos, 0 = vence hoy, > 0 = días restantes
}

export interface FinancingPlan {
  id: string;
  clientId?: string;
  clientName: string;
  clientCedula?: string;
  clientPhone?: string;
  clientEmail?: string;
  productId?: string;
  productName: string; // Libre: consola, producto, servicio técnico, combo, etc.
  modality?: FinancingModality; // 'installments' (cuotas quincenales) | 'monthly_rental' (alquiler mensual)
  itemType?: string; // retrocompatibilidad
  startDate: string; // YYYY-MM-DD
  totalAmount: number;
  initialPayment: number;
  financedAmount: number;
  installmentsCount: number; // 2..4 para quincenal; cantidad de meses para alquiler mensual
  frequencyDays: number; // 15 para quincenal, 30 para mensual
  monthlyRate?: number; // Canon mensual para alquiler
  contractMonths?: number; // Meses contratados de alquiler
  renewalsCount?: number; // Contador de renovaciones del contrato
  lastRenewedAt?: string; // Fecha de última renovación
  status: FinancingPlanStatus;
  notes?: string;
  installments: FinancingInstallment[];
}

export interface MorosoRecord {
  planId: string;
  clientName: string;
  clientCedula?: string;
  clientPhone?: string;
  clientEmail?: string;
  productName: string;
  modality: FinancingModality;
  overdueInstallmentsCount: number;
  overdueInstallmentNumbers: number[];
  oldestDueDate: string;
  maxDaysOverdue: number;
  overdueAmount: number;
  totalRemainingBalance: number;
  nextPendingInstallment?: FinancingInstallment;
}

export interface ScheduledAlertItem {
  id: string;
  planId: string;
  installmentNumber: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  productName: string;
  modality: FinancingModality;
  dueDate: string;
  scheduledTriggerDate: string; // YYYY-MM-DD (ej. dueDate - 3 días o dueDate)
  triggerType: NotificationTriggerType;
  triggerLabel: string;
  daysUntilDue: number;
  amount: number;
  dispatchStatus: NotificationDispatchStatus;
  suggestedMessage: string;
  /** Payload estándar listo para el colaborador que conecte el canal externo */
  webhookPayload: {
    event: NotificationTriggerType;
    plan_id: string;
    installment_number: number;
    modality: FinancingModality;
    recipient: { name: string; phone?: string; email?: string };
    product: string;
    amount_usd: number;
    due_date: string;
    scheduled_for: string;
    message_body: string;
  };
}

export interface FinancingAlertsSummary {
  asOfDate: string;
  overdueClientsCount: number;
  overdueInstallmentsCount: number;
  overdueTotalAmount: number;
  dueTodayCount: number;
  dueIn3DaysCount: number;
  activePlansCount: number;
  totalPortfolioReceivable: number;
  headlineMessage: string;
  morosos: MorosoRecord[];
  scheduledNotifications: ScheduledAlertItem[];
}

// ─── Utilidades de Fecha Local (sin desfase UTC) ──────────────────────────────

export function getLocalTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + days, 12, 0, 0);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function addMonthsISO(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1 + months, d || 1, 12, 0, 0);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

/**
 * Retorna la diferencia en días calendario: (targetDate - refDate).
 * - Negativo: ya venció hace |N| días.
 * - 0: vence exactamente hoy.
 * - Positivo: faltan N días para vencer.
 */
export function diffDaysISO(targetIso: string, refIso: string = getLocalTodayISO()): number {
  const [ty, tm, td] = targetIso.split('-').map(Number);
  const [ry, rm, rd] = refIso.split('-').map(Number);
  const tMs = new Date(ty, (tm || 1) - 1, td || 1, 12, 0, 0).getTime();
  const rMs = new Date(ry, (rm || 1) - 1, rd || 1, 12, 0, 0).getTime();
  return Math.round((tMs - rMs) / 86_400_000);
}

// ─── 1. Cálculo Automático de Cronograma (Cuotas Quincenales o Alquiler Mensual) ──

export function generateInstallmentSchedule(params: {
  planId: string;
  startDate: string;
  totalAmount: number;
  initialPayment: number;
  installmentsCount?: InstallmentCount;
  modality?: FinancingModality;
  monthlyRate?: number;
  contractMonths?: number;
  initialPaymentMethod?: 'cash' | 'card' | 'transfer';
  refDate?: string;
}): FinancingInstallment[] {
  const {
    planId,
    startDate,
    totalAmount,
    initialPayment,
    installmentsCount = 3,
    modality = 'installments',
    monthlyRate,
    contractMonths = 3,
    initialPaymentMethod = 'cash',
    refDate = getLocalTodayISO(),
  } = params;

  if (modality === 'monthly_rental') {
    const rate = Math.max(
      0,
      monthlyRate !== undefined
        ? Number(monthlyRate)
        : contractMonths > 0
        ? Number(((totalAmount - initialPayment) / contractMonths).toFixed(2))
        : 35
    );
    const months = Math.max(1, contractMonths);
    const list: FinancingInstallment[] = [];

    // Depósito en garantía o adelanto inicial si aplica
    if (initialPayment > 0) {
      list.push({
        id: `${planId}-R0`,
        planId,
        number: 0,
        label: 'Depósito / Pago Inicial',
        dueDate: startDate,
        amount: Number(initialPayment.toFixed(2)),
        paidAmount: Number(initialPayment.toFixed(2)),
        paidAt: startDate,
        paymentMethod: initialPaymentMethod,
        status: 'paid',
        daysDiff: diffDaysISO(startDate, refDate),
      });
    }

    // Cuotas mensuales (cada mes)
    for (let i = 1; i <= months; i++) {
      const dueDate = addMonthsISO(startDate, i);
      const daysDiff = diffDaysISO(dueDate, refDate);
      const status: InstallmentStatus = daysDiff < 0 ? 'overdue' : 'pending';

      list.push({
        id: `${planId}-R${i}`,
        planId,
        number: i,
        label: `Mensualidad Mes ${i} de ${months}`,
        dueDate,
        amount: Number(rate.toFixed(2)),
        paidAmount: 0,
        status,
        daysDiff,
      });
    }

    return list;
  }

  // Modality: 'installments' (Quincenal cada 15 días)
  const count = (installmentsCount >= 2 && installmentsCount <= 4) ? installmentsCount : 3;
  const financed = Math.max(0, Number((totalAmount - initialPayment).toFixed(2)));
  const baseQuota = Math.floor((financed / count) * 100) / 100;
  const remainder = Number((financed - baseQuota * count).toFixed(2));

  const list: FinancingInstallment[] = [
    {
      id: `${planId}-Q0`,
      planId,
      number: 0,
      label: 'Cuota Inicial',
      dueDate: startDate,
      amount: Number(initialPayment.toFixed(2)),
      paidAmount: Number(initialPayment.toFixed(2)),
      paidAt: startDate,
      paymentMethod: initialPaymentMethod,
      status: 'paid',
      daysDiff: diffDaysISO(startDate, refDate),
    },
  ];

  for (let i = 1; i <= count; i++) {
    // Periodicidad quincenal: cada 15 días a partir de la fecha inicial
    const dueDate = addDaysISO(startDate, i * 15);
    const amount = i === count ? Number((baseQuota + remainder).toFixed(2)) : baseQuota;
    const daysDiff = diffDaysISO(dueDate, refDate);
    const status: InstallmentStatus = daysDiff < 0 ? 'overdue' : 'pending';

    list.push({
      id: `${planId}-Q${i}`,
      planId,
      number: i,
      label: `Cuota ${i} de ${count}`,
      dueDate,
      amount,
      paidAmount: 0,
      status,
      daysDiff,
    });
  }

  return list;
}

// ─── 2. Renovación de Alquiler Mensual ────────────────────────────────────────

export function renewMonthlyRentalPlan(
  plan: FinancingPlan,
  additionalMonths: number,
  refDate: string = getLocalTodayISO()
): FinancingPlan {
  const currentMonths =
    plan.contractMonths ||
    Math.max(1, plan.installments.filter(i => i.number > 0).length);
  const newTotalMonths = currentMonths + additionalMonths;
  const rate =
    plan.monthlyRate ||
    (plan.installments.find(i => i.number > 0)?.amount ?? 35);

  const postInstallments = plan.installments.filter(i => i.number > 0);
  const lastDueDate =
    postInstallments.length > 0
      ? postInstallments[postInstallments.length - 1].dueDate
      : plan.startDate;

  const newInstallments: FinancingInstallment[] = [...plan.installments];

  for (let m = 1; m <= additionalMonths; m++) {
    const newNumber = currentMonths + m;
    const dueDate = addMonthsISO(lastDueDate, m);
    const daysDiff = diffDaysISO(dueDate, refDate);
    const status: InstallmentStatus = daysDiff < 0 ? 'overdue' : 'pending';

    newInstallments.push({
      id: `${plan.id}-R${newNumber}`,
      planId: plan.id,
      number: newNumber,
      label: `Mensualidad Mes ${newNumber} (Renovado)`,
      dueDate,
      amount: Number(rate.toFixed(2)),
      paidAmount: 0,
      status,
      daysDiff,
    });
  }

  const addedCost = Number((rate * additionalMonths).toFixed(2));
  const updatedTotal = Number((plan.totalAmount + addedCost).toFixed(2));
  const updatedFinanced = Number((plan.financedAmount + addedCost).toFixed(2));

  const updatedPlan: FinancingPlan = {
    ...plan,
    modality: 'monthly_rental',
    monthlyRate: rate,
    totalAmount: updatedTotal,
    financedAmount: updatedFinanced,
    contractMonths: newTotalMonths,
    installmentsCount: newTotalMonths,
    frequencyDays: 30,
    renewalsCount: (plan.renewalsCount || 0) + 1,
    lastRenewedAt: refDate,
    installments: newInstallments,
    status: 'active',
  };

  return evaluateFinancingPlan(updatedPlan, refDate);
}

// ─── 3. Re-evaluación Dinámica de Estados de Cuenta y Vencimientos ───────────

export function evaluateFinancingPlan(plan: FinancingPlan, refDate: string = getLocalTodayISO()): FinancingPlan {
  const installments = plan.installments.map(inst => {
    const daysDiff = diffDaysISO(inst.dueDate, refDate);
    if (inst.status === 'paid' || inst.paidAmount >= inst.amount) {
      return { ...inst, status: 'paid' as InstallmentStatus, daysDiff };
    }
    const status: InstallmentStatus = daysDiff < 0 ? 'overdue' : 'pending';
    return { ...inst, status, daysDiff };
  });

  const postInstallments = installments.filter(i => i.number > 0);
  const allPaid = postInstallments.length > 0 && postInstallments.every(i => i.status === 'paid');
  const hasOverdue = postInstallments.some(i => i.status === 'overdue');

  let status: FinancingPlanStatus = plan.status;
  if (plan.status !== 'cancelled') {
    if (allPaid) status = 'completed';
    else if (hasOverdue) status = 'overdue';
    else status = 'active';
  }

  return { ...plan, installments, status, modality: plan.modality || 'installments' };
}

// ─── 4. Motor de Conteo, Listado de Morosos y Programación de Avisos ──────────

export function computeFinancingAlerts(
  rawPlans: FinancingPlan[],
  refDate: string = getLocalTodayISO(),
  dispatchedIds: Set<string> = new Set()
): FinancingAlertsSummary {
  const plans = rawPlans.map(p => evaluateFinancingPlan(p, refDate));

  const morosos: MorosoRecord[] = [];
  const scheduledNotifications: ScheduledAlertItem[] = [];

  let overdueInstallmentsCount = 0;
  let overdueTotalAmount = 0;
  let dueTodayCount = 0;
  let dueIn3DaysCount = 0;
  let activePlansCount = 0;
  let totalPortfolioReceivable = 0;

  for (const plan of plans) {
    if (plan.status === 'cancelled') continue;
    if (plan.status === 'active' || plan.status === 'overdue') activePlansCount++;

    const unpaid = plan.installments.filter(i => i.status !== 'paid');
    const planRemaining = unpaid.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
    totalPortfolioReceivable += planRemaining;

    const overdueList = unpaid.filter(i => i.status === 'overdue');
    if (overdueList.length > 0) {
      const overdueSum = overdueList.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
      overdueInstallmentsCount += overdueList.length;
      overdueTotalAmount += overdueSum;

      const sortedOverdue = [...overdueList].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const oldest = sortedOverdue[0];
      const nextPending = unpaid.find(i => i.status === 'pending');

      morosos.push({
        planId: plan.id,
        clientName: plan.clientName,
        clientCedula: plan.clientCedula,
        clientPhone: plan.clientPhone,
        clientEmail: plan.clientEmail,
        productName: plan.productName,
        modality: plan.modality || 'installments',
        overdueInstallmentsCount: overdueList.length,
        overdueInstallmentNumbers: overdueList.map(i => i.number),
        oldestDueDate: oldest.dueDate,
        maxDaysOverdue: Math.abs(oldest.daysDiff),
        overdueAmount: Number(overdueSum.toFixed(2)),
        totalRemainingBalance: Number(planRemaining.toFixed(2)),
        nextPendingInstallment: nextPending,
      });
    }

    // Programación de avisos para cada cuota no pagada
    for (const inst of unpaid) {
      const d = inst.daysDiff;
      const preDueTriggerDate = addDaysISO(inst.dueDate, -3);

      if (d === 0) dueTodayCount++;
      else if (d > 0 && d <= 3) dueIn3DaysCount++;

      let triggerType: NotificationTriggerType | null = null;
      let triggerLabel = '';
      let scheduledTriggerDate = preDueTriggerDate;
      let suggestedMessage = '';

      const isRental = plan.modality === 'monthly_rental';
      const termNoun = isRental ? 'tu mensualidad de alquiler' : `tu ${inst.label}`;

      if (d < 0) {
        triggerType = 'OVERDUE';
        triggerLabel = `Vencida hace ${Math.abs(d)} día${Math.abs(d) === 1 ? '' : 's'}`;
        scheduledTriggerDate = inst.dueDate;
        suggestedMessage = isRental
          ? `Hola ${plan.clientName}, recordatorio de Luigi Digital: tu mensualidad ($${inst.amount.toFixed(2)}) del alquiler de "${plan.productName}" venció el ${inst.dueDate} (${Math.abs(d)} día(s) de atraso). Puedes renovar tu contrato o abonar comunicándote con administración.`
          : `Hola ${plan.clientName}, te recordamos de Luigi Digital que tu ${inst.label} ($${inst.amount.toFixed(2)}) de "${plan.productName}" venció el ${inst.dueDate} (${Math.abs(d)} día(s) de atraso). Por favor comunícate con administración para regularizar tu estado de cuenta.`;
      } else if (d === 0) {
        triggerType = 'DUE_TODAY';
        triggerLabel = 'Vence hoy (Mismo día)';
        scheduledTriggerDate = inst.dueDate;
        suggestedMessage = isRental
          ? `Hola ${plan.clientName}, hoy (${inst.dueDate}) vence tu mensualidad de alquiler por $${inst.amount.toFixed(2)} correspondiente a "${plan.productName}" en Luigi Digital. Puedes regularizar o renovar tu contrato mensual.`
          : `Hola ${plan.clientName}, hoy (${inst.dueDate}) vence tu ${inst.label} por $${inst.amount.toFixed(2)} correspondiente a "${plan.productName}" en Luigi Digital.`;
      } else if (d > 0 && d <= 3) {
        triggerType = 'PRE_DUE_3D';
        triggerLabel = `Aviso previo (${d} día${d === 1 ? '' : 's'} antes)`;
        scheduledTriggerDate = preDueTriggerDate;
        suggestedMessage = `Hola ${plan.clientName}, aviso preventivo de Luigi Digital: en ${d} día(s) (${inst.dueDate}) vence ${termNoun} por $${inst.amount.toFixed(2)} de "${plan.productName}".`;
      } else if (d > 3) {
        triggerType = 'PRE_DUE_3D';
        triggerLabel = `Programado para ${preDueTriggerDate} (3 días antes)`;
        scheduledTriggerDate = preDueTriggerDate;
        suggestedMessage = `Hola ${plan.clientName}, aviso preventivo de Luigi Digital: el ${inst.dueDate} vence ${termNoun} por $${inst.amount.toFixed(2)} de "${plan.productName}".`;
      }

      if (triggerType) {
        const alertId = `ALT-${plan.id}-Q${inst.number}-${triggerType}`;
        const isReadyNow = d <= 3;
        const dispatchStatus: NotificationDispatchStatus = dispatchedIds.has(alertId)
          ? 'sent'
          : isReadyNow
          ? 'ready_to_send'
          : 'scheduled';

        scheduledNotifications.push({
          id: alertId,
          planId: plan.id,
          installmentNumber: inst.number,
          clientName: plan.clientName,
          clientPhone: plan.clientPhone,
          clientEmail: plan.clientEmail,
          productName: plan.productName,
          modality: plan.modality || 'installments',
          dueDate: inst.dueDate,
          scheduledTriggerDate,
          triggerType,
          triggerLabel,
          daysUntilDue: d,
          amount: inst.amount,
          dispatchStatus,
          suggestedMessage,
          webhookPayload: {
            event: triggerType,
            plan_id: plan.id,
            installment_number: inst.number,
            modality: plan.modality || 'installments',
            recipient: {
              name: plan.clientName,
              phone: plan.clientPhone,
              email: plan.clientEmail,
            },
            product: plan.productName,
            amount_usd: inst.amount,
            due_date: inst.dueDate,
            scheduled_for: scheduledTriggerDate,
            message_body: suggestedMessage,
          },
        });
      }
    }
  }

  // Ordenar morosos por mayor cantidad de días vencidos primero
  morosos.sort((a, b) => b.maxDaysOverdue - a.maxDaysOverdue);

  // Ordenar avisos por urgencia (vencidos -> vencen hoy -> 3 días antes -> futuros)
  scheduledNotifications.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const overdueClientsCount = morosos.length;
  const headlineMessage =
    overdueClientsCount === 0
      ? 'Hoy no hay clientes con cuotas vencidas'
      : overdueClientsCount === 1
      ? 'Hoy hay 1 cliente con cuotas vencidas'
      : `Hoy hay ${overdueClientsCount} clientes con cuotas vencidas`;

  return {
    asOfDate: refDate,
    overdueClientsCount,
    overdueInstallmentsCount,
    overdueTotalAmount: Number(overdueTotalAmount.toFixed(2)),
    dueTodayCount,
    dueIn3DaysCount,
    activePlansCount,
    totalPortfolioReceivable: Number(totalPortfolioReceivable.toFixed(2)),
    headlineMessage,
    morosos,
    scheduledNotifications,
  };
}

// ─── 5. Datos Semilla Demostrativos y Persistencia Local ──────────────────────

const STORAGE_KEY = 'luigi_financing_plans_v2';
const DISPATCHED_KEY = 'luigi_financing_dispatched_v2';

export function buildSeedFinancingPlans(today: string = getLocalTodayISO()): FinancingPlan[] {
  // Plan 1: Carlos Mendoza - FIN-101 - En Cuotas (Quincenal): 1 cuota pagada, 1 vencida hace 6 días (Moroso)
  const start1 = addDaysISO(today, -36);
  const plan1Schedule = generateInstallmentSchedule({
    planId: 'FIN-101',
    startDate: start1,
    totalAmount: 650,
    initialPayment: 200,
    installmentsCount: 3,
    modality: 'installments',
    initialPaymentMethod: 'transfer',
    refDate: today,
  });
  plan1Schedule[1] = {
    ...plan1Schedule[1],
    paidAmount: plan1Schedule[1].amount,
    paidAt: addDaysISO(start1, 15),
    paymentMethod: 'transfer',
    status: 'paid',
  };

  // Plan 2: Mariana Torres - FIN-102 - En Cuotas (Quincenal): 1 cuota vencida hace 4 días (Morosa)
  const start2 = addDaysISO(today, -19);
  const plan2Schedule = generateInstallmentSchedule({
    planId: 'FIN-102',
    startDate: start2,
    totalAmount: 520,
    initialPayment: 160,
    installmentsCount: 4,
    modality: 'installments',
    refDate: today,
  });

  // Plan 3: José Gregorio Pérez - FIN-103 - En Cuotas (Quincenal): Al día, próxima vence en 2 días (Aviso preventivo)
  const start3 = addDaysISO(today, -13);
  const plan3Schedule = generateInstallmentSchedule({
    planId: 'FIN-103',
    startDate: start3,
    totalAmount: 380,
    initialPayment: 140,
    installmentsCount: 2,
    modality: 'installments',
    refDate: today,
  });

  // Plan 4: Andrea Valentina Ríos - FIN-104 - Alquiler Mensual Renovable ($60/mes por 3 meses)
  // Vence mensualidad exactamente HOY (Dispara aviso del mismo día y cuenta con botón "Renovar Contrato")
  const start4 = addMonthsISO(today, -1);
  const plan4Schedule = generateInstallmentSchedule({
    planId: 'FIN-104',
    startDate: start4,
    totalAmount: 180,
    initialPayment: 0,
    modality: 'monthly_rental',
    monthlyRate: 60,
    contractMonths: 3,
    refDate: today,
  });

  return [
    evaluateFinancingPlan(
      {
        id: 'FIN-101',
        clientName: 'Carlos Mendoza',
        clientCedula: 'V-19845120',
        clientPhone: '+58 412-555-8910',
        clientEmail: 'cmendoza@correo.com',
        productName: 'PlayStation 5 Slim 1TB',
        modality: 'installments',
        startDate: start1,
        totalAmount: 650,
        initialPayment: 200,
        financedAmount: 450,
        installmentsCount: 3,
        frequencyDays: 15,
        status: 'overdue',
        notes: 'Financiamiento en 3 cuotas quincenales. Contactar por WhatsApp.',
        installments: plan1Schedule,
      },
      today
    ),
    evaluateFinancingPlan(
      {
        id: 'FIN-102',
        clientName: 'Mariana Torres',
        clientCedula: 'V-24110982',
        clientPhone: '+58 414-321-7741',
        clientEmail: 'mtorres@correo.com',
        productName: 'Xbox Series X 1TB',
        modality: 'installments',
        startDate: start2,
        totalAmount: 520,
        initialPayment: 160,
        financedAmount: 360,
        installmentsCount: 4,
        frequencyDays: 15,
        status: 'overdue',
        notes: 'Plan de 4 cuotas quincenales.',
        installments: plan2Schedule,
      },
      today
    ),
    evaluateFinancingPlan(
      {
        id: 'FIN-103',
        clientName: 'José Gregorio Pérez',
        clientCedula: 'V-16432998',
        clientPhone: '+58 424-889-1102',
        clientEmail: 'jgperez@correo.com',
        productName: 'Nintendo Switch OLED + Mario Kart',
        modality: 'installments',
        startDate: start3,
        totalAmount: 380,
        initialPayment: 140,
        financedAmount: 240,
        installmentsCount: 2,
        frequencyDays: 15,
        status: 'active',
        notes: 'Plan corto de 2 cuotas quincenales al día.',
        installments: plan3Schedule,
      },
      today
    ),
    evaluateFinancingPlan(
      {
        id: 'FIN-104',
        clientName: 'Andrea Valentina Ríos',
        clientCedula: 'V-26901445',
        clientPhone: '+58 412-901-3344',
        clientEmail: 'andrea.rios@correo.com',
        productName: 'PlayStation 5 Pro + 2 Controles DualSense',
        modality: 'monthly_rental',
        startDate: start4,
        totalAmount: 180,
        initialPayment: 0,
        financedAmount: 180,
        installmentsCount: 3,
        frequencyDays: 30,
        monthlyRate: 60,
        contractMonths: 3,
        renewalsCount: 0,
        status: 'active',
        notes: 'Alquiler mensual por $60/mes. Renovable al término de cada ciclo.',
        installments: plan4Schedule,
      },
      today
    ),
  ];
}

export function loadFinancingPlans(): FinancingPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildSeedFinancingPlans();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as FinancingPlan[];
    return parsed.map(p => evaluateFinancingPlan(p));
  } catch {
    return buildSeedFinancingPlans();
  }
}

export function saveFinancingPlans(plans: FinancingPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // ignore storage quota errors
  }
}

export function loadDispatchedAlertIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISPATCHED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveDispatchedAlertIds(ids: Set<string>): void {
  try {
    localStorage.setItem(DISPATCHED_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}
