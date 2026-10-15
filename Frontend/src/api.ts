// ─── API client ───────────────────────────────────────────────────────────────
// Fetches data from the Express + PostgreSQL backend.
// Falls back gracefully when the backend is unreachable.

import { useEffect, useState } from 'react';
import { toast } from './alerts';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://luigii.enigmastudioss.com';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`);
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json();
}

const ENTITY_LABELS: Record<string, string> = {
  products: 'Producto', clients: 'Cliente', rentals: 'Alquiler', sales: 'Venta',
  deliveries: 'Nota de entrega', 'tech-services': 'Servicio técnico', warranties: 'Garantía',
  purchases: 'Compra', contact: 'Mensaje',
};
const ACTION_LABELS = { POST: 'registrado', PUT: 'actualizado', DELETE: 'eliminado' } as const;

async function send<T = any>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T | null> {
  const entity = ENTITY_LABELS[path.split('/')[1]] ?? 'Registro';
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${method} ${path} -> ${res.status}`);
    toast.success(`${entity} ${ACTION_LABELS[method]} correctamente`);
    return res.status === 204 ? null : res.json();
  } catch (err) {
    toast.error(`No se pudo completar la operación (${entity.toLowerCase()})`);
    throw err;
  }
}

const toStr = (v: unknown) => String(v);
const toNum = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const toDate = (v: unknown) => (v ? String(v).slice(0, 10) : '');

// ─── Mappers (snake_case DB → camelCase UI) ───────────────────────────────────

export const mapProduct = (p: any) => ({
  id: toStr(p.id),
  name: p.name,
  category: p.category,
  brand: p.brand,
  salePrice: p.sale_price === null ? undefined : toNum(p.sale_price),
  rentalPrice: p.rental_price === null ? undefined : toNum(p.rental_price),
  type: p.type,
  image: p.image || '',
  stock: toNum(p.stock),
  description: p.description || '',
  featured: !!p.featured,
  active: p.active !== false,
  offerPrice: p.offer_price === null || p.offer_price === undefined ? undefined : toNum(p.offer_price),
});

export const mapClient = (c: any) => ({
  id: toStr(c.id),
  name: c.name,
  phone: c.phone || '',
  email: c.email || '',
  cedula: c.cedula || '',
  address: c.address || '',
  joinDate: toDate(c.join_date),
  status: c.status,
});

export const mapRental = (r: any) => ({
  id: toStr(r.id),
  clientName: r.client_name,
  product: r.product_name,
  startDate: toDate(r.start_date),
  dueDate: toDate(r.due_date),
  returnDate: r.return_date ? toDate(r.return_date) : undefined,
  dailyRate: toNum(r.daily_rate),
  totalDays: toNum(r.total_days),
  amount: toNum(r.amount),
  deposit: toNum(r.deposit),
  status: r.status,
});

export const mapSale = (s: any) => ({
  id: toStr(s.id),
  clientName: s.client_name,
  products: (s.items || []).map((i: any) => `${i.product_name}${toNum(i.qty) > 1 ? ` x${toNum(i.qty)}` : ''}`),
  items: (s.items || []).map((i: any) => ({ product_id: i.product_id, product_name: i.product_name, qty: toNum(i.qty), price: toNum(i.price) })),
  date: toDate(s.date),
  subtotal: toNum(s.subtotal),
  discount: toNum(s.discount),
  total: toNum(s.total),
  paymentMethod: s.payment_method,
});

export const mapDelivery = (d: any) => ({
  id: toStr(d.id),
  clientName: d.client_name,
  date: toDate(d.date),
  items: d.items || [],
  shippingType: (d.shipping_type === 'national' ? 'national' : 'local') as 'national' | 'local',
  address: d.address || '',
  state: d.state || '',
  agency: d.agency || '',
  officeCode: d.office_code || '',
  status: d.status,
  notes: d.notes || '',
});

export const mapTechService = (t: any) => ({
  id: toStr(t.id),
  clientName: t.client_name,
  device: t.device,
  issue: t.issue,
  receiveDate: toDate(t.receive_date),
  estimatedDate: toDate(t.estimated_date),
  returnDate: t.return_date ? toDate(t.return_date) : undefined,
  technician: t.technician || '',
  cost: toNum(t.cost),
  status: t.status,
  notes: t.notes || '',
});

export const mapWarranty = (w: any) => ({
  id: toStr(w.id),
  clientName: w.client_name,
  product: w.product,
  serial: w.serial || '',
  purchaseDate: toDate(w.purchase_date),
  expiryDate: toDate(w.expiry_date),
  status: w.status,
  type: w.type,
});

export const mapPurchase = (p: any) => ({
  id: toStr(p.id),
  supplier: p.supplier,
  product: p.product,
  quantity: toNum(p.quantity),
  unitCost: toNum(p.unit_cost),
  total: toNum(p.total),
  date: toDate(p.date),
  invoiceNumber: p.invoice_number || '',
  status: p.status,
});

export const mapContactMessage = (m: any) => ({
  id: toStr(m.id),
  name: m.name,
  email: m.email || '',
  phone: m.phone || '',
  subject: m.subject || '',
  message: m.message,
  date: toDate(m.date),
  status: m.status,
});

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const api = {
  products: {
    list: async () => (await get<any[]>('/products')).map(mapProduct),
    create: (p: any) => send('POST', '/products', p),
    update: (id: string, p: any) => send('PUT', `/products/${id}`, p),
    remove: (id: string) => send('DELETE', `/products/${id}`),
  },
  clients: {
    list: async () => (await get<any[]>('/clients')).map(mapClient),
    create: (c: any) => send('POST', '/clients', c),
    update: (id: string, c: any) => send('PUT', `/clients/${id}`, c),
    remove: (id: string) => send('DELETE', `/clients/${id}`),
  },
  rentals: {
    list: async () => (await get<any[]>('/rentals')).map(mapRental),
    create: (r: any) => send('POST', '/rentals', r),
    update: (id: string, r: any) => send('PUT', `/rentals/${id}`, r),
    remove: (id: string) => send('DELETE', `/rentals/${id}`),
  },
  sales: {
    list: async () => (await get<any[]>('/sales')).map(mapSale),
    create: (s: any) => send('POST', '/sales', s),
    update: (id: string, s: any) => send('PUT', `/sales/${id}`, s),
    remove: (id: string) => send('DELETE', `/sales/${id}`),
  },
  deliveries: {
    list: async () => (await get<any[]>('/deliveries')).map(mapDelivery),
    create: (d: any) => send('POST', '/deliveries', d),
    update: (id: string, d: any) => send('PUT', `/deliveries/${id}`, d),
    remove: (id: string) => send('DELETE', `/deliveries/${id}`),
  },
  techServices: {
    list: async () => (await get<any[]>('/tech-services')).map(mapTechService),
    create: (t: any) => send('POST', '/tech-services', t),
    update: (id: string, t: any) => send('PUT', `/tech-services/${id}`, t),
    remove: (id: string) => send('DELETE', `/tech-services/${id}`),
  },
  warranties: {
    list: async () => (await get<any[]>('/warranties')).map(mapWarranty),
    create: (w: any) => send('POST', '/warranties', w),
    update: (id: string, w: any) => send('PUT', `/warranties/${id}`, w),
    remove: (id: string) => send('DELETE', `/warranties/${id}`),
  },
  purchases: {
    list: async () => (await get<any[]>('/purchases')).map(mapPurchase),
    create: (p: any) => send('POST', '/purchases', p),
    update: (id: string, p: any) => send('PUT', `/purchases/${id}`, p),
    remove: (id: string) => send('DELETE', `/purchases/${id}`),
  },
  contact: {
    list: async () => (await get<any[]>('/contact')).map(mapContactMessage),
    create: (m: any) => send('POST', '/contact', m),
  },
  dashboard: () => get<any>('/dashboard'),
  health: () => get<{ status: string }>('/health'),
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/uploads`, { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return `${API_URL}${data.url}`;
  },
  auth: {
    login: async (username: string, password: string) => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
      return data as { token: string; user: { id: number; username: string; name: string; role: string } };
    },
  },
};

// ─── React hook: load from API, keep local state, fallback to mock ────────────

export function useApiData<T>(
  loader: () => Promise<T>,
  fallback: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [data, setData] = useState<T>(fallback);
  useEffect(() => {
    let alive = true;
    loader().then(d => { if (alive) setData(d); }).catch(() => { /* backend offline: keep fallback */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [data, setData];
}
