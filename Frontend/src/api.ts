// ─── API client ──────────────────────────────────────────────────────────────

const rawApiUrl: string = ((import.meta as any).env?.VITE_API_URL ?? 'https://apimechanic.enigmastudioss.com').replace(/\/+$/, '');
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
export const API_ORIGIN = API_URL.replace(/\/api$/, '');

export const resolveImageUrl = (url?: string) =>
  !url ? '' : url.startsWith('http') ? url : `${API_ORIGIN}${url}`;

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductCategory = 'part' | 'oil' | 'filter' | 'battery' | 'tire' | 'service';
export type ServiceType = 'oil_change' | 'maintenance' | 'repair' | 'inspection' | 'tire' | 'battery';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface Vehicle {
  id: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
  motor?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  idDoc: string;
  address: string;
  joinDate: string;
  status: 'active' | 'inactive';
  vehicles?: Vehicle[];
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  salePrice?: number;
  type: 'sale' | 'service';
  image: string;
  stock: number;
  description: string;
  compatibility?: string;
  compatYearFrom?: number;
  compatYearTo?: number;
  featured?: boolean;
}

export interface ServiceOrder {
  id: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleDesc: string;
  serviceType: ServiceType;
  productsUsed: { productId: string; name: string; qty: number; price: number }[];
  laborCost: number;
  total: number;
  date: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
  notes: string;
  technician: string;
}

export interface Sale {
  id: string;
  clientName: string;
  products: string[];
  date: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
}

export interface Purchase {
  id: string;
  supplier: string;
  product: string;
  quantity: number;
  unitCost: number;
  total: number;
  date: string;
  invoiceNumber: string;
  status: 'received' | 'pending' | 'returned';
}

export interface Warranty {
  id: string;
  clientName: string;
  product: string;
  serial: string;
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'claimed';
  type: 'store' | 'manufacturer';
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  status: 'unread' | 'read' | 'replied';
}

export interface StoreInfo {
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  mapUrl?: string;
  reference?: string;
}

// ─── Mappers (snake_case DB → camelCase UI) ──────────────────────────────────

const d = (v: any) => (v ? String(v).slice(0, 10) : '');
const n = (v: any) => (v === null || v === undefined ? undefined : Number(v));

export const mapProduct = (r: any): Product => ({
  id: String(r.id),
  name: r.name,
  category: r.category,
  brand: r.brand,
  salePrice: n(r.sale_price),
  type: r.type,
  image: resolveImageUrl(r.image),
  stock: Number(r.stock ?? 0),
  description: r.description ?? '',
  compatibility: r.compatibility ?? undefined,
  compatYearFrom: n(r.compat_year_from),
  compatYearTo: n(r.compat_year_to),
  featured: r.featured ?? false,
});

export const mapClient = (r: any): Client => ({
  id: String(r.id),
  name: r.name,
  phone: r.phone ?? '',
  email: r.email ?? '',
  idDoc: r.id_doc ?? '',
  address: r.address ?? '',
  joinDate: d(r.join_date),
  status: r.status,
});

export const mapVehicle = (r: any): Vehicle => ({
  id: String(r.id),
  clientId: String(r.client_id),
  plate: r.plate,
  brand: r.brand,
  model: r.model,
  year: Number(r.year),
  vin: r.vin ?? undefined,
  motor: r.motor ?? undefined,
});

export const mapOrder = (r: any): ServiceOrder => ({
  id: String(r.id),
  clientId: String(r.client_id),
  clientName: r.client_name,
  vehicleId: String(r.vehicle_id),
  vehicleDesc: r.vehicle_desc,
  serviceType: r.service_type,
  productsUsed: (r.products_used ?? []).map((i: any) => ({ productId: String(i.productId), name: i.name, qty: Number(i.qty), price: Number(i.price) })),
  laborCost: Number(r.labor_cost ?? 0),
  total: Number(r.total ?? 0),
  date: d(r.date),
  dueDate: d(r.due_date),
  status: r.status,
  notes: r.notes ?? '',
  technician: r.technician ?? '',
});

export const mapSale = (r: any): Sale => ({
  id: String(r.id),
  clientName: r.client_name,
  products: (r.items ?? []).map((i: any) => `${i.name}${Number(i.qty) > 1 ? ` x${i.qty}` : ''}`),
  date: d(r.date),
  subtotal: Number(r.subtotal ?? 0),
  discount: Number(r.discount ?? 0),
  total: Number(r.total ?? 0),
  paymentMethod: r.payment_method,
});

export const mapPurchase = (r: any): Purchase => ({
  id: String(r.id),
  supplier: r.supplier,
  product: r.product,
  quantity: Number(r.quantity),
  unitCost: Number(r.unit_cost),
  total: Number(r.total),
  date: d(r.date),
  invoiceNumber: r.invoice_number ?? '',
  status: r.status,
});

export const mapWarranty = (r: any): Warranty => ({
  id: String(r.id),
  clientName: r.client_name,
  product: r.product,
  serial: r.serial ?? '',
  purchaseDate: d(r.purchase_date),
  expiryDate: d(r.expiry_date),
  status: r.status,
  type: r.type,
});

export const mapMessage = (r: any): ContactMessage => ({
  id: String(r.id),
  name: r.name,
  email: r.email ?? '',
  phone: r.phone ?? '',
  subject: r.subject ?? '',
  message: r.message,
  date: d(r.date),
  status: r.status,
});

export const mapStoreInfo = (r: any): StoreInfo => ({
  address: r.address ?? '',
  phone: r.phone ?? '',
  whatsapp: r.whatsapp ?? '',
  email: r.email ?? '',
  hours: r.hours ?? '',
  mapUrl: r.map_url ?? undefined,
  reference: r.reference ?? undefined,
});

// ─── Endpoints ───────────────────────────────────────────────────────────────

export const api = {
  login: (username: string, password: string) =>
    req<{ token: string; user: { id: number; username: string; name: string; role: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }
    ),

  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/uploads`, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? `Error ${res.status}`);
    }
    const { url } = await res.json();
    return url;
  },

  getProducts: () => req<any[]>('/products').then(rs => rs.map(mapProduct)),
  createProduct: (p: Partial<Product>) =>
    req<any>('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: p.name, category: p.category, brand: p.brand, sale_price: p.salePrice,
        type: p.type, image: p.image, stock: p.stock, description: p.description,
        compatibility: p.compatibility, compat_year_from: p.compatYearFrom,
        compat_year_to: p.compatYearTo, featured: p.featured,
      }),
    }).then(mapProduct),

  getClients: () => req<any[]>('/clients').then(rs => rs.map(mapClient)),
  createClient: (c: Partial<Client>) =>
    req<any>('/clients', {
      method: 'POST',
      body: JSON.stringify({
        name: c.name, phone: c.phone, email: c.email, id_doc: c.idDoc,
        address: c.address, join_date: c.joinDate, status: c.status,
      }),
    }).then(mapClient),

  getVehicles: () => req<any[]>('/vehicles').then(rs => rs.map(mapVehicle)),
  createVehicle: (v: Partial<Vehicle>) =>
    req<any>('/vehicles', {
      method: 'POST',
      body: JSON.stringify({
        client_id: v.clientId ? Number(v.clientId) : null, plate: v.plate, brand: v.brand,
        model: v.model, year: v.year, vin: v.vin, motor: v.motor,
      }),
    }).then(mapVehicle),

  getServiceOrders: () => req<any[]>('/service-orders').then(rs => rs.map(mapOrder)),
  createServiceOrder: (o: Partial<ServiceOrder>) =>
    req<any>('/service-orders', {
      method: 'POST',
      body: JSON.stringify({
        client_id: o.clientId ? Number(o.clientId) : null, client_name: o.clientName,
        vehicle_id: o.vehicleId ? Number(o.vehicleId) : null, vehicle_desc: o.vehicleDesc,
        service_type: o.serviceType, products_used: o.productsUsed?.map(i => ({ product_id: Number(i.productId), name: i.name, qty: i.qty, price: i.price })),
        labor_cost: o.laborCost, total: o.total, date: o.date, due_date: o.dueDate,
        status: o.status, notes: o.notes, technician: o.technician,
      }),
    }).then(mapOrder),

  getSales: () => req<any[]>('/sales').then(rs => rs.map(mapSale)),
  createSale: (s: { clientId?: string; clientName: string; date: string; subtotal: number; discount: number; total: number; paymentMethod: PaymentMethod; items: { productId: string; name: string; qty: number; price: number }[] }) =>
    req<any>('/sales', {
      method: 'POST',
      body: JSON.stringify({
        client_id: s.clientId ? Number(s.clientId) : null, client_name: s.clientName, date: s.date,
        subtotal: s.subtotal, discount: s.discount, total: s.total, payment_method: s.paymentMethod,
        items: s.items.map(i => ({ product_id: Number(i.productId), name: i.name, qty: i.qty, price: i.price })),
      }),
    }).then(mapSale),

  getPurchases: () => req<any[]>('/purchases').then(rs => rs.map(mapPurchase)),
  createPurchase: (p: Partial<Purchase>) =>
    req<any>('/purchases', {
      method: 'POST',
      body: JSON.stringify({
        supplier: p.supplier, product: p.product, quantity: p.quantity, unit_cost: p.unitCost,
        total: p.total, date: p.date, invoice_number: p.invoiceNumber, status: p.status,
      }),
    }).then(mapPurchase),

  getWarranties: () => req<any[]>('/warranties').then(rs => rs.map(mapWarranty)),
  createWarranty: (w: { clientId?: string; clientName: string; product: string; serial: string; purchaseDate: string; expiryDate: string; type: Warranty['type'] }) =>
    req<any>('/warranties', {
      method: 'POST',
      body: JSON.stringify({
        client_id: w.clientId ? Number(w.clientId) : null, client_name: w.clientName, product: w.product,
        serial: w.serial, purchase_date: w.purchaseDate, expiry_date: w.expiryDate, type: w.type,
      }),
    }).then(mapWarranty),

  getMessages: () => req<any[]>('/contact/messages').then(rs => rs.map(mapMessage)),
  getStoreInfo: () => req<any>('/contact/store-info').then(r => (r ? mapStoreInfo(r) : null)),
  updateStoreInfo: (info: StoreInfo) =>
    req<any>('/contact/store-info', {
      method: 'PUT',
      body: JSON.stringify({
        address: info.address, phone: info.phone, whatsapp: info.whatsapp,
        email: info.email, hours: info.hours, map_url: info.mapUrl, reference: info.reference,
      }),
    }).then(mapStoreInfo),
};
