import React, { useState, useMemo } from 'react';
import {
  CreditCard, AlertTriangle, CheckCircle2, Clock, Users, Calendar,
  DollarSign, Plus, Search, Eye, CheckCircle, Bell, FileText, X,
  Copy, Phone, Mail, RotateCcw, Trash2, Code2, Send
} from 'lucide-react';
import {
  FinancingPlan,
  FinancingInstallment,
  InstallmentCount,
  FinancingModality,
  ScheduledAlertItem,
  generateInstallmentSchedule,
  evaluateFinancingPlan,
  computeFinancingAlerts,
  renewMonthlyRentalPlan,
  getLocalTodayISO,
  loadDispatchedAlertIds,
  saveDispatchedAlertIds,
} from './financing';
import { confirmAction, toast } from './alerts';

interface ClientLite {
  id: string;
  name: string;
  cedula: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

interface ProductLite {
  id: string;
  name: string;
  brand: string;
  salePrice?: number;
  offerPrice?: number;
  stock: number;
  active?: boolean;
}

interface Props {
  plans: FinancingPlan[];
  setPlans: React.Dispatch<React.SetStateAction<FinancingPlan[]>>;
  clients: ClientLite[];
  inventory: ProductLite[];
}

type SubTab = 'plans' | 'morosos' | 'account' | 'alerts_queue';

function fmtLocalDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d, 12, 0, 0).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtMoney(n: number): string {
  return `$${Number(n || 0).toFixed(2)}`;
}

export function FinancingSection({ plans, setPlans, clients, inventory }: Props) {
  const today = getLocalTodayISO();
  const [activeTab, setActiveTab] = useState<SubTab>('plans');
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState<'all' | FinancingModality>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailPlanId, setDetailPlanId] = useState<string | null>(null);
  const [payloadPreview, setPayloadPreview] = useState<ScheduledAlertItem | null>(null);
  const [dispatchedIds, setDispatchedIds] = useState<Set<string>>(() => loadDispatchedAlertIds());
  const [queueFilter, setQueueFilter] = useState<'all' | 'ready_to_send' | 'scheduled' | 'PRE_DUE_3D' | 'DUE_TODAY' | 'OVERDUE'>('all');

  // Modal de Renovación de Alquiler Mensual
  const [renewModalPlan, setRenewModalPlan] = useState<FinancingPlan | null>(null);
  const [renewMonths, setRenewMonths] = useState<number>(1);

  // Formulario de Nuevo Plan
  const [form, setForm] = useState<{
    clientName: string;
    modality: FinancingModality;
    productId: string;
    customProductName: string;
    startDate: string;
    totalAmount: number;
    initialPayment: number;
    installmentsCount: InstallmentCount;
    monthlyRate: number;
    contractMonths: number;
    paymentMethod: 'cash' | 'card' | 'transfer';
    notes: string;
  }>({
    clientName: '',
    modality: 'installments',
    productId: '',
    customProductName: '',
    startDate: today,
    totalAmount: 500,
    initialPayment: 150,
    installmentsCount: 3,
    monthlyRate: 50,
    contractMonths: 3,
    paymentMethod: 'cash',
    notes: '',
  });
  const [formError, setFormError] = useState('');

  // Evaluación automática de todos los planes y alertas al día de hoy
  const evaluatedPlans = useMemo(() => plans.map(p => evaluateFinancingPlan(p, today)), [plans, today]);
  const alertsSummary = useMemo(
    () => computeFinancingAlerts(evaluatedPlans, today, dispatchedIds),
    [evaluatedPlans, today, dispatchedIds]
  );

  const detailPlan = useMemo(
    () => evaluatedPlans.find(p => p.id === detailPlanId) ?? null,
    [evaluatedPlans, detailPlanId]
  );

  // Previsualización en tiempo real del cronograma dentro del modal
  const previewSchedule = useMemo(() => {
    const isRental = form.modality === 'monthly_rental';
    const total = isRental
      ? Number((form.monthlyRate * form.contractMonths + (Number(form.initialPayment) || 0)).toFixed(2))
      : Math.max(0, Number(form.totalAmount) || 0);
    const initial = Math.max(0, Number(form.initialPayment) || 0);

    return generateInstallmentSchedule({
      planId: 'PREVIEW',
      startDate: form.startDate || today,
      totalAmount: total,
      initialPayment: initial,
      installmentsCount: form.installmentsCount,
      modality: form.modality,
      monthlyRate: form.monthlyRate,
      contractMonths: form.contractMonths,
      initialPaymentMethod: form.paymentMethod,
      refDate: today,
    });
  }, [
    form.startDate,
    form.totalAmount,
    form.initialPayment,
    form.installmentsCount,
    form.modality,
    form.monthlyRate,
    form.contractMonths,
    form.paymentMethod,
    today,
  ]);

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return evaluatedPlans.filter(p => {
      if (modalityFilter !== 'all' && (p.modality || 'installments') !== modalityFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (
        q &&
        !p.clientName.toLowerCase().includes(q) &&
        !p.productName.toLowerCase().includes(q) &&
        !(p.clientCedula || '').toLowerCase().includes(q) &&
        !p.id.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [evaluatedPlans, search, modalityFilter, statusFilter]);

  const filteredQueue = useMemo(() => {
    return alertsSummary.scheduledNotifications.filter(item => {
      if (queueFilter === 'all') return true;
      if (queueFilter === 'ready_to_send') return item.dispatchStatus === 'ready_to_send';
      if (queueFilter === 'scheduled') return item.dispatchStatus === 'scheduled';
      return item.triggerType === queueFilter;
    });
  }, [alertsSummary.scheduledNotifications, queueFilter]);

  const uniqueClientNames = useMemo(() => {
    const set = new Set<string>();
    evaluatedPlans.forEach(p => set.add(p.clientName));
    return Array.from(set).sort();
  }, [evaluatedPlans]);

  const handleSelectProduct = (productId: string) => {
    const prod = inventory.find(p => p.id === productId);
    const price = prod ? (prod.offerPrice && prod.salePrice && prod.offerPrice < prod.salePrice ? prod.offerPrice : prod.salePrice) ?? 0 : 0;
    const suggestedInitial = price > 0 ? Math.round(price * 0.3 * 100) / 100 : form.initialPayment;
    setForm(curr => ({
      ...curr,
      productId,
      customProductName: prod ? prod.name : curr.customProductName,
      totalAmount: price > 0 ? price : curr.totalAmount,
      initialPayment: curr.modality === 'installments' ? (price > 0 ? suggestedInitial : curr.initialPayment) : 0,
      monthlyRate: curr.modality === 'monthly_rental' ? (price > 100 ? 50 : 35) : curr.monthlyRate,
    }));
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const productName = form.customProductName.trim();
    if (!form.clientName.trim() || !productName) {
      setFormError('Selecciona un cliente y escribe el concepto o artículo para el plan.');
      return;
    }

    const isRental = form.modality === 'monthly_rental';
    let totalAmount = Number(form.totalAmount) || 0;
    const initialPayment = Number(form.initialPayment) || 0;

    if (isRental) {
      if (form.monthlyRate <= 0) {
        setFormError('El canon de alquiler mensual debe ser mayor a $0.00.');
        return;
      }
      if (form.contractMonths < 1) {
        setFormError('El contrato debe ser de al menos 1 mes.');
        return;
      }
      totalAmount = Number((form.monthlyRate * form.contractMonths + initialPayment).toFixed(2));
    } else {
      if (totalAmount <= 0) {
        setFormError('El monto total debe ser mayor a $0.00.');
        return;
      }
      if (initialPayment < 0 || initialPayment >= totalAmount) {
        setFormError('La cuota inicial debe ser menor al monto total a financiar.');
        return;
      }
      if (![2, 3, 4].includes(form.installmentsCount)) {
        setFormError('El plan debe tener entre 2 y 4 cuotas posteriores quincenales.');
        return;
      }
    }

    const clientObj = clients.find(c => c.name === form.clientName);
    const nextNum =
      evaluatedPlans.reduce((max, p) => {
        const m = p.id.match(/(\d+)/);
        return m ? Math.max(max, Number(m[1])) : max;
      }, 100) + 1;
    const planId = `FIN-${nextNum}`;

    const installments = generateInstallmentSchedule({
      planId,
      startDate: form.startDate,
      totalAmount,
      initialPayment,
      installmentsCount: form.installmentsCount,
      modality: form.modality,
      monthlyRate: form.monthlyRate,
      contractMonths: form.contractMonths,
      initialPaymentMethod: form.paymentMethod,
      refDate: today,
    });

    const newPlan = evaluateFinancingPlan(
      {
        id: planId,
        clientId: clientObj?.id,
        clientName: form.clientName.trim(),
        clientCedula: clientObj?.cedula,
        clientPhone: clientObj?.phone,
        clientEmail: clientObj?.email,
        productId: form.productId || undefined,
        productName,
        modality: form.modality,
        startDate: form.startDate,
        totalAmount,
        initialPayment,
        financedAmount: Number((totalAmount - initialPayment).toFixed(2)),
        installmentsCount: isRental ? form.contractMonths : form.installmentsCount,
        frequencyDays: isRental ? 30 : 15,
        monthlyRate: isRental ? form.monthlyRate : undefined,
        contractMonths: isRental ? form.contractMonths : undefined,
        renewalsCount: 0,
        status: 'active',
        notes: form.notes.trim(),
        installments,
      },
      today
    );

    setPlans(curr => [newPlan, ...curr]);
    toast.success(
      isRental
        ? `Plan ${planId} de alquiler mensual registrado (${form.contractMonths} meses)`
        : `Plan ${planId} registrado con ${form.installmentsCount} cuotas quincenales`
    );
    setModalOpen(false);
    setFormError('');
  };

  const handleConfirmRenewal = () => {
    if (!renewModalPlan) return;
    const updated = renewMonthlyRentalPlan(renewModalPlan, renewMonths, today);
    setPlans(curr => curr.map(p => (p.id === updated.id ? updated : p)));
    toast.success(`Contrato del plan ${renewModalPlan.id} renovado por +${renewMonths} mes(es)`);
    setRenewModalPlan(null);
    setRenewMonths(1);
  };

  const markInstallmentPaid = async (planId: string, installmentNumber: number, method: 'cash' | 'card' | 'transfer' = 'cash') => {
    const plan = evaluatedPlans.find(p => p.id === planId);
    const inst = plan?.installments.find(i => i.number === installmentNumber);
    if (!plan || !inst) return;

    const ok = await confirmAction(
      `Registrar cobro de ${inst.label}`,
      `Cliente: ${plan.clientName} · Concepto: ${plan.productName} · Monto: ${fmtMoney(inst.amount)}`
    );
    if (!ok) return;

    setPlans(curr =>
      curr.map(p => {
        if (p.id !== planId) return p;
        const updatedInstallments = p.installments.map(i =>
          i.number === installmentNumber
            ? { ...i, paidAmount: i.amount, paidAt: today, paymentMethod: method, status: 'paid' as const }
            : i
        );
        return evaluateFinancingPlan({ ...p, installments: updatedInstallments }, today);
      })
    );
    toast.success(`${inst.label} marcada como pagada (${fmtMoney(inst.amount)})`);
  };

  const revertInstallmentPayment = async (planId: string, installmentNumber: number) => {
    if (installmentNumber === 0) return;
    const ok = await confirmAction(
      'Revertir pago de cuota',
      'La cuota volverá a estado pendiente o vencida según su fecha de corte.'
    );
    if (!ok) return;

    setPlans(curr =>
      curr.map(p => {
        if (p.id !== planId) return p;
        const updatedInstallments = p.installments.map(i =>
          i.number === installmentNumber
            ? { ...i, paidAmount: 0, paidAt: undefined, paymentMethod: undefined, status: 'pending' as const }
            : i
        );
        return evaluateFinancingPlan({ ...p, installments: updatedInstallments }, today);
      })
    );
    toast.info('Pago de cuota revertido');
  };

  const deletePlan = async (plan: FinancingPlan) => {
    const ok = await confirmAction(
      'Eliminar plan de financiamiento',
      `Se eliminará el plan ${plan.id} de ${plan.clientName} (${plan.productName}).`
    );
    if (!ok) return;
    setPlans(curr => curr.filter(p => p.id !== plan.id));
    if (detailPlanId === plan.id) setDetailPlanId(null);
    toast.success(`Plan ${plan.id} eliminado`);
  };

  const markAlertDispatched = (alertItem: ScheduledAlertItem) => {
    const next = new Set(dispatchedIds);
    next.add(alertItem.id);
    setDispatchedIds(next);
    saveDispatchedAlertIds(next);

    window.dispatchEvent(
      new CustomEvent('luigi:financing-alert-dispatch', {
        detail: alertItem.webhookPayload,
      })
    );
    toast.success(`Evento ${alertItem.triggerType} marcado como listo/enviado en cola`);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.info(`${label} copiado al portapapeles`);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-700 text-gtext">Financiamiento y Alertas</h2>
          <p className="text-sm text-muted mt-0.5">
            Control de planes en cuotas quincenales, alquileres mensuales renovables, estados de cuenta y avisos
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-600 text-white transition-all self-start sm:self-auto hover:opacity-95"
          style={{ background: '#6153d6', boxShadow: '0 4px 12px rgba(97,83,214,0.25)' }}
        >
          <Plus size={16} /> Nuevo Plan / Alquiler
        </button>
      </div>

      {/* ─── Banner de Conteo Automático de Vencimientos ───────────────────────── */}
      <div
        className={`rounded-2xl p-5 border transition-all ${
          alertsSummary.overdueClientsCount > 0
            ? 'bg-rose-500/10 border-rose-500/30 dark:bg-rose-950/35 dark:border-rose-500/40'
            : 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/30 dark:border-emerald-500/30'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                alertsSummary.overdueClientsCount > 0
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              }`}
            >
              {alertsSummary.overdueClientsCount > 0 ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-700 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 text-gtext">
                  Monitor Automático · Corte {fmtLocalDate(today)}
                </span>
                {alertsSummary.dueTodayCount > 0 && (
                  <span className="text-[11px] font-700 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                    {alertsSummary.dueTodayCount} cuota{alertsSummary.dueTodayCount === 1 ? '' : 's'} vence{alertsSummary.dueTodayCount === 1 ? '' : 'n'} HOY
                  </span>
                )}
                {alertsSummary.dueIn3DaysCount > 0 && (
                  <span className="text-[11px] font-700 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                    {alertsSummary.dueIn3DaysCount} aviso{alertsSummary.dueIn3DaysCount === 1 ? '' : 's'} preventivo{alertsSummary.dueIn3DaysCount === 1 ? '' : 's'} (≤ 3 días)
                  </span>
                )}
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-700 text-gtext mt-1">
                {alertsSummary.headlineMessage}
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                {alertsSummary.overdueInstallmentsCount} cuota(s) vencida(s) por un monto exigible inmediato de{' '}
                <strong className="text-rose-600 dark:text-rose-400">{fmtMoney(alertsSummary.overdueTotalAmount)}</strong> · Cartera total pendiente:{' '}
                <strong className="text-gtext">{fmtMoney(alertsSummary.totalPortfolioReceivable)}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('morosos')}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <AlertTriangle size={14} /> Ver Listado de Morosos ({alertsSummary.overdueClientsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('alerts_queue')}
              className="px-4 py-2.5 rounded-xl bg-[var(--c-card)] hover:bg-[var(--c-row-hover)] text-gtext border border-[var(--c-border)] text-xs font-700 transition-colors flex items-center gap-2"
            >
              <Bell size={14} className="text-purple" /> Cola de Avisos ({alertsSummary.scheduledNotifications.length})
            </button>
          </div>
        </div>
      </div>

      {/* ─── KPIs de Cartera ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="stat-card bg-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>Planes Activos</span>
            <CreditCard size={15} className="text-purple" />
          </div>
          <div className="font-display font-700 text-2xl text-gtext">{alertsSummary.activePlansCount}</div>
          <div className="text-[11px] text-muted mt-0.5">{evaluatedPlans.length} registrados en total</div>
        </div>

        <div className="stat-card bg-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>Clientes en Mora</span>
            <AlertTriangle size={15} className="text-danger" />
          </div>
          <div className="font-display font-700 text-2xl text-danger">{alertsSummary.overdueClientsCount}</div>
          <div className="text-[11px] text-muted mt-0.5">{alertsSummary.overdueInstallmentsCount} cuotas vencidas sin cobrar</div>
        </div>

        <div className="stat-card bg-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>Saldo Exigible en Mora</span>
            <DollarSign size={15} className="text-warning" />
          </div>
          <div className="font-display font-700 text-2xl text-warning">{fmtMoney(alertsSummary.overdueTotalAmount)}</div>
          <div className="text-[11px] text-muted mt-0.5">Para gestión de cobro manual</div>
        </div>

        <div className="stat-card bg-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>Avisos Listos para Disparo</span>
            <Bell size={15} className="text-blue" />
          </div>
          <div className="font-display font-700 text-2xl text-blue">
            {alertsSummary.scheduledNotifications.filter(n => n.dispatchStatus === 'ready_to_send').length}
          </div>
          <div className="text-[11px] text-muted mt-0.5">Ventana 3 días antes / Día de corte</div>
        </div>
      </div>

      {/* ─── Navegación Interna del Módulo ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--c-border)] pb-3">
        {[
          { key: 'plans', label: 'Planes y Alquileres', icon: <CreditCard size={15} />, badge: evaluatedPlans.length },
          { key: 'morosos', label: 'Listado Directo de Morosos', icon: <AlertTriangle size={15} />, badge: alertsSummary.overdueClientsCount, danger: true },
          { key: 'account', label: 'Estado de Cuenta por Cliente', icon: <FileText size={15} /> },
          {
            key: 'alerts_queue',
            label: 'Programación de Avisos (3 días antes / Hoy)',
            icon: <Bell size={15} />,
            badge: alertsSummary.scheduledNotifications.filter(n => n.dispatchStatus === 'ready_to_send').length,
          },
        ].map(t => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as SubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-600 transition-all ${
                isActive
                  ? 'bg-[#6153d6] text-white shadow-md shadow-[#6153d6]/25'
                  : 'bg-[var(--c-card)] text-gtext border border-[var(--c-border)] hover:border-[#6153d6]/50'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-700 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : t.danger && t.badge > 0
                      ? 'bg-rose-500/15 text-rose-500'
                      : 'bg-slate-200 dark:bg-slate-800 text-muted'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 1: PLANES Y ALQUILERES
         ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por cliente, cédula, concepto o código FIN..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-gtext"
              />
            </div>
            <select
              value={modalityFilter}
              onChange={e => setModalityFilter(e.target.value as any)}
              className="px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-gtext"
            >
              <option value="all">Todas las modalidades</option>
              <option value="installments">En Cuotas Quincenales</option>
              <option value="monthly_rental">Alquiler Mensual (Renovable)</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-gtext"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Al día (Activos)</option>
              <option value="overdue">Con cuotas vencidas (En Mora)</option>
              <option value="completed">Pagados / Completados</option>
            </select>
          </div>

          <div className="bg-card rounded-xl overflow-hidden border border-[var(--c-border)]">
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {[
                      'Plan',
                      'Cliente',
                      'Concepto Financiado',
                      'Inicio',
                      'Total',
                      'Inicial',
                      'Modalidad / Plan',
                      'Progreso Cuotas',
                      'Próximo Vencimiento',
                      'Saldo Pendiente',
                      'Estado',
                      'Acciones',
                    ].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map(plan => {
                    const isRental = plan.modality === 'monthly_rental';
                    const postQuotas = plan.installments.filter(i => i.number > 0);
                    const paidQuotas = postQuotas.filter(i => i.status === 'paid').length;
                    const nextUnpaid = postQuotas.find(i => i.status !== 'paid');
                    const remainingBalance = postQuotas
                      .filter(i => i.status !== 'paid')
                      .reduce((s, i) => s + (i.amount - i.paidAmount), 0);

                    return (
                      <tr key={plan.id} className="table-row-hover border-b border-[var(--c-divider)] last:border-0">
                        <td className="px-4 py-3 font-mono text-xs font-700 text-purple whitespace-nowrap">{plan.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-600 text-gtext">{plan.clientName}</div>
                          {plan.clientCedula && <div className="text-[11px] text-muted font-mono">{plan.clientCedula}</div>}
                        </td>
                        <td className="px-4 py-3 text-gtext max-w-[200px] truncate" title={plan.productName}>
                          {plan.productName}
                        </td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtLocalDate(plan.startDate)}</td>
                        <td className="px-4 py-3 font-600 text-gtext whitespace-nowrap">{fmtMoney(plan.totalAmount)}</td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-600 whitespace-nowrap">
                          {fmtMoney(plan.initialPayment)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isRental ? (
                            <div>
                              <span className="text-xs font-600 text-emerald-500">
                                Alquiler · {fmtMoney(plan.monthlyRate || postQuotas[0]?.amount || 0)}/mes
                              </span>
                              <span className="block text-[10px] text-muted">
                                {postQuotas.length} mes(es){plan.renewalsCount ? ` · ${plan.renewalsCount} ren.` : ' · Renovable'}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs font-600 text-gtext">
                                {plan.installmentsCount} cuotas × {fmtMoney(postQuotas[0]?.amount ?? 0)}
                              </span>
                              <span className="block text-[10px] text-muted">Cada 15 días</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {postQuotas.map(q => (
                              <span
                                key={q.number}
                                title={`${q.label}: ${fmtMoney(q.amount)} · Vence ${fmtLocalDate(q.dueDate)} (${
                                  q.status === 'paid' ? 'Pagada' : q.status === 'overdue' ? 'Vencida' : 'Pendiente'
                                })`}
                                className={`w-6 h-6 rounded-lg text-[11px] font-700 flex items-center justify-center border ${
                                  q.status === 'paid'
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                                    : q.status === 'overdue'
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-300'
                                    : 'bg-slate-200/70 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-muted'
                                }`}
                              >
                                {q.number}
                              </span>
                            ))}
                            <span className="text-xs text-muted ml-1">
                              ({paidQuotas}/{postQuotas.length})
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {nextUnpaid ? (
                            <div>
                              <span
                                className={`text-xs font-600 ${
                                  nextUnpaid.status === 'overdue'
                                    ? 'text-danger'
                                    : nextUnpaid.daysDiff <= 3
                                    ? 'text-warning'
                                    : 'text-gtext'
                                }`}
                              >
                                {fmtLocalDate(nextUnpaid.dueDate)}
                              </span>
                              <span className="block text-[10px] text-muted">
                                {nextUnpaid.daysDiff < 0
                                  ? `Vencida hace ${Math.abs(nextUnpaid.daysDiff)}d`
                                  : nextUnpaid.daysDiff === 0
                                  ? 'Vence HOY'
                                  : `En ${nextUnpaid.daysDiff} días`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-success font-600">Saldado</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-700 text-blue whitespace-nowrap">{fmtMoney(remainingBalance)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`badge ${
                              plan.status === 'completed'
                                ? 'badge-active'
                                : plan.status === 'overdue'
                                ? 'badge-overdue'
                                : 'badge-pending'
                            }`}
                          >
                            {plan.status === 'completed' ? 'Completado' : plan.status === 'overdue' ? 'En Mora' : 'Al Día'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailPlanId(plan.id)}
                              title="Ver estado de cuenta y cuotas"
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-purple text-xs font-600 flex items-center gap-1 transition-colors"
                            >
                              <Eye size={14} /> Cuotas
                            </button>
                            {isRental && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRenewModalPlan(plan);
                                  setRenewMonths(1);
                                }}
                                title="Renovar contrato mensual"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-600 flex items-center gap-1 transition-colors"
                              >
                                <RotateCcw size={13} /> Renovar
                              </button>
                            )}
                            {nextUnpaid && (
                              <button
                                type="button"
                                onClick={() => markInstallmentPaid(plan.id, nextUnpaid.number)}
                                title={`Cobrar ${nextUnpaid.label} (${fmtMoney(nextUnpaid.amount)})`}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              >
                                <CheckCircle size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deletePlan(plan)}
                              title="Eliminar plan"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 2: LISTADO DIRECTO DE MOROSOS (COBRO MANUAL)
         ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'morosos' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-card border border-[var(--c-border)] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-lg font-700 text-gtext flex items-center gap-2">
                  <AlertTriangle size={18} className="text-danger" /> Listado Directo de Clientes en Mora (Cobro Manual)
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Clientes que presentan una o más cuotas o mensualidades con fecha de vencimiento superada. Ordenados por antigüedad de mora.
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-700">
                Total a recuperar hoy: {fmtMoney(alertsSummary.overdueTotalAmount)}
              </span>
            </div>

            {alertsSummary.morosos.length === 0 ? (
              <div className="text-center py-14 text-muted">
                <CheckCircle2 size={42} className="mx-auto mb-3 text-emerald-500 opacity-80" />
                <p className="font-display font-600 text-base text-gtext">No hay clientes en mora en este momento</p>
                <p className="text-xs mt-1">Todas las cuotas y mensualidades vencidas han sido cobradas.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {[
                        'Plan',
                        'Cliente Moroso',
                        'Contacto Directo',
                        'Concepto Financiado',
                        'Cuotas Vencidas',
                        'Vencimiento Más Antiguo',
                        'Atraso',
                        'Monto Vencido Exigible',
                        'Deuda Total Restante',
                        'Gestión de Cobro Manual',
                      ].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alertsSummary.morosos.map(m => {
                      const firstOverdueNum = m.overdueInstallmentNumbers[0];
                      const cobroMsg = `Hola ${m.clientName}, te escribimos del departamento administrativo de Luigi Digital. Tu plan ${m.planId} (${m.productName}) presenta ${m.overdueInstallmentsCount} cuota(s) vencida(s) con ${m.maxDaysOverdue} día(s) de mora por un monto exigible de ${fmtMoney(m.overdueAmount)}. Por favor indícanos tu método de pago para actualizar tu estado de cuenta.`;

                      return (
                        <tr key={m.planId} className="table-row-hover border-b border-[var(--c-divider)] last:border-0">
                          <td className="px-4 py-3 font-mono text-xs font-700 text-rose-500 whitespace-nowrap">{m.planId}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-700 text-gtext">{m.clientName}</div>
                            <div className="text-[11px] font-mono text-muted">{m.clientCedula || 'Sin cédula'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5 text-xs">
                              {m.clientPhone && (
                                <span className="flex items-center gap-1 text-gtext font-500">
                                  <Phone size={11} className="text-emerald-500" /> {m.clientPhone}
                                </span>
                              )}
                              {m.clientEmail && (
                                <span className="flex items-center gap-1 text-muted">
                                  <Mail size={11} /> {m.clientEmail}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gtext max-w-[190px] truncate">{m.productName}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="badge badge-overdue">
                              {m.overdueInstallmentsCount} cuota{m.overdueInstallmentsCount === 1 ? '' : 's'} (#
                              {m.overdueInstallmentNumbers.join(', #')})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-danger font-600 whitespace-nowrap">{fmtLocalDate(m.oldestDueDate)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-300 font-700 text-xs">
                              {m.maxDaysOverdue} día{m.maxDaysOverdue === 1 ? '' : 's'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-display font-700 text-base text-danger whitespace-nowrap">
                            {fmtMoney(m.overdueAmount)}
                          </td>
                          <td className="px-4 py-3 font-600 text-muted whitespace-nowrap">{fmtMoney(m.totalRemainingBalance)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => markInstallmentPaid(m.planId, firstOverdueNum)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-700 flex items-center gap-1.5 transition-colors shadow-sm"
                              >
                                <CheckCircle size={13} /> Registrar Cobro Cuota #{firstOverdueNum}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyText(cobroMsg, 'Texto de cobro')}
                                title="Copiar aviso de cobro para enviar manualmente"
                                className="p-1.5 rounded-lg border border-[var(--c-border)] text-gtext hover:bg-[var(--c-row-hover)] transition-colors"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailPlanId(m.planId)}
                                title="Ver expediente completo"
                                className="p-1.5 rounded-lg border border-[var(--c-border)] text-purple hover:bg-[var(--c-row-hover)] transition-colors"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 3: HISTORIAL Y ESTADO DE CUENTA POR CLIENTE
         ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'account' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-[var(--c-border)]">
            <div>
              <h3 className="font-display font-700 text-base text-gtext">Consultar Estado de Cuenta por Cliente</h3>
              <p className="text-xs text-muted">Visualiza el historial detallado de cuotas pagadas, pendientes y vencidas de cada cliente</p>
            </div>
            <select
              value={selectedClientForHistory}
              onChange={e => setSelectedClientForHistory(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-600 text-gtext min-w-[250px]"
            >
              <option value="all">Mostrar todos los clientes ({uniqueClientNames.length})</option>
              {uniqueClientNames.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {evaluatedPlans
              .filter(p => selectedClientForHistory === 'all' || p.clientName === selectedClientForHistory)
              .map(plan => {
                const isRental = plan.modality === 'monthly_rental';
                const paidTotal = plan.installments
                  .filter(i => i.status === 'paid')
                  .reduce((s, i) => s + i.paidAmount, 0);
                const pendingTotal = plan.installments
                  .filter(i => i.status === 'pending')
                  .reduce((s, i) => s + (i.amount - i.paidAmount), 0);
                const overdueTotal = plan.installments
                  .filter(i => i.status === 'overdue')
                  .reduce((s, i) => s + (i.amount - i.paidAmount), 0);
                const progressPct = Math.min(100, Math.round((paidTotal / plan.totalAmount) * 100));

                return (
                  <div key={plan.id} className="bg-card rounded-2xl border border-[var(--c-border)] overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-[var(--c-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-700 px-2.5 py-0.5 rounded-md bg-purple/15 text-purple">{plan.id}</span>
                          <h4 className="font-display font-700 text-lg text-gtext">{plan.clientName}</h4>
                          {plan.clientCedula && <span className="text-xs font-mono text-muted">({plan.clientCedula})</span>}
                          <span
                            className={`badge ${
                              plan.status === 'completed'
                                ? 'badge-active'
                                : plan.status === 'overdue'
                                ? 'badge-overdue'
                                : 'badge-pending'
                            }`}
                          >
                            {plan.status === 'completed' ? 'Solvente / Pagado' : plan.status === 'overdue' ? 'Con Mora Activa' : 'Al Día'}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-1">
                          Concepto: <strong className="text-gtext">{plan.productName}</strong> · Inicio: {fmtLocalDate(plan.startDate)} · Modalidad:{' '}
                          {isRental
                            ? `Alquiler Mensual Renovable (${plan.installmentsCount} meses)`
                            : `Inicial + ${plan.installmentsCount} cuotas quincenales (15 días)`}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-right">
                        <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <span className="block text-[10px] uppercase font-700 text-emerald-600 dark:text-emerald-400">Pagado</span>
                          <strong className="font-display text-sm text-emerald-600 dark:text-emerald-300">{fmtMoney(paidTotal)}</strong>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <span className="block text-[10px] uppercase font-700 text-amber-600 dark:text-amber-400">Pendiente</span>
                          <strong className="font-display text-sm text-amber-600 dark:text-amber-300">{fmtMoney(pendingTotal)}</strong>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <span className="block text-[10px] uppercase font-700 text-rose-600 dark:text-rose-400">Vencido</span>
                          <strong className="font-display text-sm text-rose-600 dark:text-rose-300">{fmtMoney(overdueTotal)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso financiero */}
                    <div className="px-5 py-2.5 bg-surface flex items-center gap-3">
                      <span className="text-xs font-600 text-muted">Avance de pago:</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#6153d6] to-[#22d3ee] transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-700 text-gtext">{progressPct}%</span>
                    </div>

                    {/* Desglose de cuotas */}
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {plan.installments.map(inst => (
                        <div
                          key={inst.id}
                          className={`rounded-xl p-3.5 border flex flex-col justify-between gap-2 ${
                            inst.status === 'paid'
                              ? 'bg-emerald-500/5 border-emerald-500/30'
                              : inst.status === 'overdue'
                              ? 'bg-rose-500/10 border-rose-500/40'
                              : 'bg-surface border-[var(--c-border)]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-700 text-gtext">{inst.label}</span>
                              <span
                                className={`badge ${
                                  inst.status === 'paid'
                                    ? 'badge-active'
                                    : inst.status === 'overdue'
                                    ? 'badge-overdue'
                                    : 'badge-pending'
                                }`}
                              >
                                {inst.status === 'paid' ? 'Pagada' : inst.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                              </span>
                            </div>
                            <div className="font-display font-700 text-lg text-gtext mt-1">{fmtMoney(inst.amount)}</div>
                            <div className="text-[11px] text-muted mt-0.5 flex items-center gap-1">
                              <Calendar size={11} /> Vence: {fmtLocalDate(inst.dueDate)}
                            </div>
                            {inst.status === 'paid' && inst.paidAt && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-600 mt-1">
                                Pagada el {fmtLocalDate(inst.paidAt)}
                              </div>
                            )}
                            {inst.status === 'overdue' && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-700 mt-1">
                                Atraso de {Math.abs(inst.daysDiff)} día(s)
                              </div>
                            )}
                            {inst.status === 'pending' && (
                              <div className="text-[10px] text-muted mt-1">
                                {inst.daysDiff === 0 ? 'Vence hoy' : `Faltan ${inst.daysDiff} día(s)`}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[var(--c-divider)] flex items-center justify-between">
                            {inst.status !== 'paid' ? (
                              <button
                                type="button"
                                onClick={() => markInstallmentPaid(plan.id, inst.number)}
                                className="w-full py-1.5 rounded-lg bg-[#6153d6] hover:bg-[#5244be] text-white text-xs font-600 transition-colors"
                              >
                                Registrar Pago
                              </button>
                            ) : inst.number > 0 ? (
                              <button
                                type="button"
                                onClick={() => revertInstallmentPayment(plan.id, inst.number)}
                                className="text-[11px] text-muted hover:text-danger flex items-center gap-1"
                              >
                                <RotateCcw size={11} /> Revertir
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted font-600">Abono inicial fijo</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 4: PROGRAMACIÓN INTERNA DE AVISOS (COLA PARA CANAL EXTERNO)
         ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'alerts_queue' && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-[var(--c-border)] p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-lg font-700 text-gtext flex items-center gap-2">
                  <Bell size={18} className="text-purple" /> Cola de Avisos Programados (Pre-vencimiento y Corte)
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Avisos preventivos (3 días antes), recordatorios del mismo día y alertas por mora.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'ready_to_send', label: 'Listos para disparar HOY' },
                  { id: 'PRE_DUE_3D', label: '3 Días Antes' },
                  { id: 'DUE_TODAY', label: 'Mismo Día' },
                  { id: 'OVERDUE', label: 'Mora' },
                  { id: 'scheduled', label: 'Programados a futuro' },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setQueueFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-600 transition-colors ${
                      queueFilter === f.id
                        ? 'bg-[#6153d6] text-white'
                        : 'bg-surface text-muted hover:text-gtext border border-[var(--c-border)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {[
                      'Regla / Evento',
                      'Fecha de Disparo',
                      'Vencimiento Cuota',
                      'Cliente',
                      'Concepto / Cuota',
                      'Monto',
                      'Estado de Cola',
                      'Acciones / Payload',
                    ].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map(item => (
                    <tr key={item.id} className="table-row-hover border-b border-[var(--c-divider)] last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`badge ${
                            item.triggerType === 'OVERDUE'
                              ? 'badge-overdue'
                              : item.triggerType === 'DUE_TODAY'
                              ? 'badge-pending'
                              : 'badge-sale'
                          }`}
                        >
                          {item.triggerType === 'OVERDUE'
                            ? 'ALERTA MORA'
                            : item.triggerType === 'DUE_TODAY'
                            ? 'MISMO DÍA (0d)'
                            : 'PREVIO (-3 días)'}
                        </span>
                        <span className="block text-[11px] text-muted mt-0.5">{item.triggerLabel}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gtext whitespace-nowrap">
                        {fmtLocalDate(item.scheduledTriggerDate)}
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtLocalDate(item.dueDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-600 text-gtext">{item.clientName}</div>
                        <div className="text-[11px] text-muted">{item.clientPhone || item.clientEmail || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-600 text-gtext truncate max-w-[180px]">{item.productName}</div>
                        <div className="text-[11px] text-muted">
                          Plan {item.planId} · {item.modality === 'monthly_rental' ? 'Mensualidad' : 'Cuota'} #{item.installmentNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-700 text-blue whitespace-nowrap">{fmtMoney(item.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`badge ${
                            item.dispatchStatus === 'sent'
                              ? 'badge-active'
                              : item.dispatchStatus === 'ready_to_send'
                              ? 'badge-pending'
                              : 'badge-inactive'
                          }`}
                        >
                          {item.dispatchStatus === 'sent'
                            ? 'Despachado'
                            : item.dispatchStatus === 'ready_to_send'
                            ? 'Listo para disparar'
                            : 'En espera de fecha'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPayloadPreview(item)}
                            title="Ver JSON Payload para integración externa"
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--c-border)] hover:bg-[var(--c-row-hover)] text-xs font-600 text-gtext flex items-center gap-1"
                          >
                            <Code2 size={13} className="text-purple" /> Payload
                          </button>
                          {item.dispatchStatus !== 'sent' && (
                            <button
                              type="button"
                              onClick={() => markAlertDispatched(item)}
                              title="Simular disparo al canal de envío"
                              className="px-2.5 py-1.5 rounded-lg bg-[#6153d6] hover:bg-[#5244be] text-white text-xs font-600 flex items-center gap-1"
                            >
                              <Send size={12} /> Disparar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          MODAL: REGISTRAR NUEVO PLAN (CUOTAS QUINCENALES O ALQUILER MENSUAL)
         ═════════════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6153d6] dark:text-indigo-400 flex items-center justify-center">
                  <CreditCard size={22} />
                </div>
                <div>
                  <div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] dark:text-indigo-400 uppercase">
                    Renglón de Financiamiento Libre
                  </div>
                  <h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">
                    Registrar Plan o Alquiler
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Financia cualquier concepto en cuotas quincenales o mediante alquiler mensual renovable.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-7 space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <label>
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente titular</span>
                  <select
                    required
                    value={form.clientName}
                    onChange={e => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  >
                    <option value="">Seleccionar cliente registrado</option>
                    {clients
                      .filter(c => c.status === 'active')
                      .map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.cedula})
                        </option>
                      ))}
                    <option value="Carlos Mendoza">Carlos Mendoza (V-19845120)</option>
                    <option value="Mariana Torres">Mariana Torres (V-24110982)</option>
                    <option value="José Gregorio Pérez">José Gregorio Pérez (V-16432998)</option>
                    <option value="Andrea Valentina Ríos">Andrea Valentina Ríos (V-26901445)</option>
                  </select>
                </label>

                <label>
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                    Autocompletar desde inventario (opcional)
                  </span>
                  <select
                    value={form.productId}
                    onChange={e => handleSelectProduct(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  >
                    <option value="">Escribir libremente abajo o elegir sugerencia...</option>
                    {inventory
                      .filter(p => p.active !== false)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {fmtMoney(p.offerPrice || p.salePrice || 0)}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                    Concepto / Artículo o Servicio a Financiar (Libre)
                  </span>
                  <input
                    required
                    type="text"
                    value={form.customProductName}
                    onChange={e => setForm({ ...form, customProductName: e.target.value })}
                    placeholder="Escribe lo que desees financiar: consola, servicio técnico, reparación, accesorios, combo..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </label>

                <div className="sm:col-span-2">
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Financiamiento
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, modality: 'installments' }))}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-700 transition-all flex items-center justify-center gap-2 ${
                        form.modality === 'installments'
                          ? 'bg-[#6153d6] border-[#6153d6] text-white shadow-md shadow-[#6153d6]/25'
                          : 'border-slate-200 dark:border-slate-700 text-gtext hover:border-[#6153d6]'
                      }`}
                    >
                      <CreditCard size={15} /> En Cuotas (Quincenales)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, modality: 'monthly_rental', initialPayment: 0 }))}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-700 transition-all flex items-center justify-center gap-2 ${
                        form.modality === 'monthly_rental'
                          ? 'bg-[#6153d6] border-[#6153d6] text-white shadow-md shadow-[#6153d6]/25'
                          : 'border-slate-200 dark:border-slate-700 text-gtext hover:border-[#6153d6]'
                      }`}
                    >
                      <RotateCcw size={15} /> Alquiler Mensual (Renovable)
                    </button>
                  </div>
                </div>

                <label>
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                    {form.modality === 'monthly_rental' ? 'Fecha de Inicio del Contrato' : 'Fecha Inicial del Contrato (Cuota Inicial)'}
                  </span>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </label>

                {form.modality === 'installments' ? (
                  <>
                    <label>
                      <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                        Cantidad de Cuotas Posteriores (Quincenales)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {([2, 3, 4] as InstallmentCount[]).map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setForm({ ...form, installmentsCount: n })}
                            className={`py-2.5 rounded-xl border text-xs font-700 transition-all ${
                              form.installmentsCount === n
                                ? 'bg-[#6153d6] border-[#6153d6] text-white shadow-md shadow-[#6153d6]/25'
                                : 'border-slate-200 dark:border-slate-700 text-gtext hover:border-[#6153d6]'
                            }`}
                          >
                            {n} Cuotas ({n * 15} días)
                          </button>
                        ))}
                      </div>
                    </label>

                    <label>
                      <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Monto Total del Plan (USD)</span>
                      <input
                        required
                        type="number"
                        min="1"
                        step="0.01"
                        value={form.totalAmount}
                        onChange={e => setForm({ ...form, totalAmount: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-700"
                      />
                    </label>

                    <label>
                      <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                        Cuota Inicial Pagada Hoy (USD)
                      </span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        max={form.totalAmount - 1}
                        value={form.initialPayment}
                        onChange={e => setForm({ ...form, initialPayment: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-700"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                        Meses Iniciales de Alquiler (Renovable al vencer)
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 6].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setForm({ ...form, contractMonths: m })}
                            className={`py-2.5 rounded-xl border text-xs font-700 transition-all ${
                              form.contractMonths === m
                                ? 'bg-[#6153d6] border-[#6153d6] text-white shadow-md shadow-[#6153d6]/25'
                                : 'border-slate-200 dark:border-slate-700 text-gtext hover:border-[#6153d6]'
                            }`}
                          >
                            {m} {m === 1 ? 'Mes' : 'Meses'}
                          </button>
                        ))}
                      </div>
                    </label>

                    <label>
                      <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                        Canon Mensual de Alquiler (USD / mes)
                      </span>
                      <input
                        required
                        type="number"
                        min="1"
                        step="0.01"
                        value={form.monthlyRate}
                        onChange={e => setForm({ ...form, monthlyRate: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-700"
                      />
                    </label>

                    <label>
                      <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                        Depósito o Pago Inicial Hoy (USD - Opcional)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.initialPayment}
                        onChange={e => setForm({ ...form, initialPayment: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-700"
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Cronograma Calculado Automáticamente */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-700 uppercase tracking-wider text-purple">
                    {form.modality === 'monthly_rental'
                      ? 'Cálculo Automático de Mensualidades (Renovable tras vencer)'
                      : 'Cálculo Automático de Vencimientos Quincenales (Cada 15 días)'}
                  </span>
                  <span className="text-xs text-muted">
                    {form.modality === 'monthly_rental' ? (
                      <>
                        Total contrato inicial:{' '}
                        <strong className="text-gtext">
                          {fmtMoney(form.monthlyRate * form.contractMonths + (Number(form.initialPayment) || 0))}
                        </strong>
                      </>
                    ) : (
                      <>
                        Saldo financiado:{' '}
                        <strong className="text-gtext">
                          {fmtMoney(Math.max(0, form.totalAmount - form.initialPayment))}
                        </strong>
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {previewSchedule.map(inst => (
                    <div
                      key={inst.number}
                      className={`p-3 rounded-xl border text-xs ${
                        inst.number === 0
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-card border-[var(--c-border)]'
                      }`}
                    >
                      <div className="font-700 text-gtext">{inst.label}</div>
                      <div className="font-display font-700 text-base text-purple mt-0.5">{fmtMoney(inst.amount)}</div>
                      <div className="text-[11px] text-muted mt-1">
                        {inst.number === 0 ? 'Pagada al iniciar' : `Vence: ${fmtLocalDate(inst.dueDate)}`}
                      </div>
                      {inst.number > 0 && (
                        <div className="text-[10px] text-muted mt-0.5">
                          {form.modality === 'monthly_rental'
                            ? `Mes ${inst.number} del contrato`
                            : `+${inst.number * 15} días desde inicio`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#6153d6] hover:bg-[#5244be] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/25"
                >
                  Guardar Plan y Programar Alertas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          MODAL: RENOVAR CONTRATO DE ALQUILER MENSUAL
         ═════════════════════════════════════════════════════════════════════════ */}
      {renewModalPlan && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setRenewModalPlan(null)}
          />
          <div className="relative w-full max-w-lg rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-700 uppercase tracking-wider text-purple">
                  Renovación de Alquiler Mensual · {renewModalPlan.id}
                </span>
                <h3 className="font-display text-xl font-700 text-gtext mt-0.5">
                  {renewModalPlan.clientName}
                </h3>
                <p className="text-xs text-muted mt-0.5">{renewModalPlan.productName}</p>
              </div>
              <button onClick={() => setRenewModalPlan(null)} className="p-2 rounded-xl text-muted hover:text-gtext">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">
                  Meses adicionales a renovar
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 6].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRenewMonths(m)}
                      className={`py-2.5 rounded-xl border text-xs font-700 transition-all ${
                        renewMonths === m
                          ? 'bg-[#6153d6] border-[#6153d6] text-white shadow-md shadow-[#6153d6]/25'
                          : 'border-slate-200 dark:border-slate-700 text-gtext hover:border-[#6153d6]'
                      }`}
                    >
                      +{m} {m === 1 ? 'Mes' : 'Meses'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-[var(--c-border)] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Canon mensual:</span>
                  <strong className="text-gtext">{fmtMoney(renewModalPlan.monthlyRate || 50)} / mes</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Monto total por la renovación:</span>
                  <strong className="text-purple">{fmtMoney((renewModalPlan.monthlyRate || 50) * renewMonths)}</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewModalPlan(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--c-border)] text-xs font-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRenewal}
                  className="px-5 py-2 rounded-xl bg-[#6153d6] hover:bg-[#5244be] text-white text-xs font-700 shadow-md shadow-[#6153d6]/25"
                >
                  Confirmar Renovación (+{renewMonths} {renewMonths === 1 ? 'Mes' : 'Meses'})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          MODAL: EXPEDIENTE / ESTADO DE CUENTA INDIVIDUAL
         ═════════════════════════════════════════════════════════════════════════ */}
      {detailPlan && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setDetailPlanId(null)}
          />
          <div className="relative w-full max-w-2xl rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-700 uppercase tracking-wider text-purple">
                  Estado de Cuenta · Expediente {detailPlan.id}
                </span>
                <h3 className="font-display text-xl font-700 text-gtext mt-0.5">
                  {detailPlan.clientName} — {detailPlan.productName}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Contrato iniciado el {fmtLocalDate(detailPlan.startDate)} · Total {fmtMoney(detailPlan.totalAmount)}
                </p>
              </div>
              <button onClick={() => setDetailPlanId(null)} className="p-2 rounded-xl text-muted hover:text-gtext">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {detailPlan.installments.map(inst => (
                <div
                  key={inst.id}
                  className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--c-border)] bg-card"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-gtext">{inst.label}</strong>
                      <span
                        className={`badge ${
                          inst.status === 'paid'
                            ? 'badge-active'
                            : inst.status === 'overdue'
                            ? 'badge-overdue'
                            : 'badge-pending'
                        }`}
                      >
                        {inst.status === 'paid' ? 'Pagada' : inst.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      Vencimiento: <strong>{fmtLocalDate(inst.dueDate)}</strong>
                      {inst.paidAt ? ` · Pagada el ${fmtLocalDate(inst.paidAt)}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-700 text-lg text-gtext">{fmtMoney(inst.amount)}</span>
                    {inst.status !== 'paid' ? (
                      <button
                        type="button"
                        onClick={() => markInstallmentPaid(detailPlan.id, inst.number)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-700"
                      >
                        Marcar Pagada
                      </button>
                    ) : (
                      inst.number > 0 && (
                        <button
                          type="button"
                          onClick={() => revertInstallmentPayment(detailPlan.id, inst.number)}
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--c-border)] text-xs text-muted hover:text-danger"
                        >
                          Revertir
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          MODAL: PAYLOAD JSON PARA COLABORADOR DE INTEGRACIÓN EXTERNA
         ═════════════════════════════════════════════════════════════════════════ */}
      {payloadPreview && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setPayloadPreview(null)}
          />
          <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-cyan-400" />
                <h4 className="font-display font-700 text-base">Payload de Evento Programado (Listo para Webhook / API)</h4>
              </div>
              <button onClick={() => setPayloadPreview(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Estructura generada por la lógica interna lista para que el colaborador la conecte a WhatsApp Cloud API, pasarela o servicio de correo:
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 overflow-x-auto font-mono">
              {JSON.stringify(payloadPreview.webhookPayload, null, 2)}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => copyText(JSON.stringify(payloadPreview.webhookPayload, null, 2), 'Payload JSON')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-600 flex items-center gap-1.5"
              >
                <Copy size={13} /> Copiar JSON
              </button>
              <button
                type="button"
                onClick={() => setPayloadPreview(null)}
                className="px-4 py-2 rounded-xl bg-[#6153d6] text-xs font-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
