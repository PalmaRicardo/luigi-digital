import { useState, useMemo, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, Car, Settings, ShoppingBag, Wrench, Shield, Package,
  Search, Plus, TrendingUp, Calendar, AlertTriangle, CheckCircle2, Star, Tag,
  Phone, Mail, MapPin, Hash, DollarSign, ArrowUpRight, CreditCard,
  Menu, X, ChevronRight, ChevronLeft, Layers, RotateCcw, Clipboard, Filter, Lock, LogOut,
  Sun, Moon, SlidersHorizontal, Send, Navigation, MessageSquare, Gauge, Droplets
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'catalog' | 'admin';
type AdminSection = 'dashboard' | 'clients' | 'vehicles' | 'serviceOrders' | 'sales' | 'purchases' | 'warranties' | 'contact';
type CatalogCategory = 'all' | 'parts' | 'oils' | 'filters' | 'batteries' | 'tires' | 'services';
type ProductCategory = 'part' | 'oil' | 'filter' | 'battery' | 'tire' | 'service';
type ServiceType = 'oil_change' | 'maintenance' | 'repair' | 'inspection' | 'tire' | 'battery';
type FilterType = 'all' | 'sale' | 'service';
type BrandFilter = 'all' | 'Toyota' | 'Ford' | 'Chevrolet' | 'Generic';
type PaymentMethod = 'cash' | 'card' | 'transfer';

interface Vehicle {
  id: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
  motor?: string;
}

interface Client {
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

interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: BrandFilter;
  salePrice?: number;
  type: 'sale' | 'service';
  image: string;
  stock: number;
  description: string;
  compatibility?: string;
  featured?: boolean;
}

interface ServiceOrder {
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

interface Sale {
  id: string;
  clientName: string;
  products: string[];
  date: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
}

interface Purchase {
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

interface Warranty {
  id: string;
  clientName: string;
  product: string;
  serial: string;
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'claimed';
  type: 'store' | 'manufacturer';
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  status: 'unread' | 'read' | 'replied';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const VEHICLES: Vehicle[] = [
  { id: 'v1', clientId: 'c1', plate: 'ABC-123', brand: 'Toyota', model: 'Corolla', year: 2018, vin: 'JTDBU4EE3B9123456', motor: '1.8L' },
  { id: 'v2', clientId: 'c1', plate: 'XYZ-789', brand: 'Ford', model: 'F-150', year: 2020, vin: '1FTFW1EF7EKG12345', motor: '5.0L V8' },
  { id: 'v3', clientId: 'c2', plate: 'DEF-456', brand: 'Chevrolet', model: 'Spark', year: 2016, vin: 'KL8CB6S99GC123456', motor: '1.4L' },
  { id: 'v4', clientId: 'c3', plate: 'GHI-321', brand: 'Toyota', model: 'Hilux', year: 2021, vin: 'MR0HA3CDX00012345', motor: '2.8L' },
  { id: 'v5', clientId: 'c4', plate: 'JKL-654', brand: 'Ford', model: 'Escape', year: 2019, vin: '1FMCU9G99KUA12345', motor: '2.0L EcoBoost' },
  { id: 'v6', clientId: 'c5', plate: 'MNO-987', brand: 'Chevrolet', model: 'Silverado', year: 2022, vin: '3GCUYDED7NG123456', motor: '5.3L V8' },
];

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Filtro de Aceite Toyota', category: 'filter', brand: 'Toyota', salePrice: 18, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Engine_oil_filter.JPG', stock: 24, description: 'Filtro de aceite original para Corolla, Yaris, RAV4', compatibility: 'Toyota', featured: true },
  { id: 'p2', name: 'Aceite Sintético 5W-30', category: 'oil', brand: 'Generic', salePrice: 32, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Castrol_oil_cans.jpg', stock: 45, description: 'Aceite 100% sintético API SP, 1 cuarto', compatibility: 'Universal', featured: true },
  { id: 'p3', name: 'Batería 24F-600', category: 'battery', brand: 'Generic', salePrice: 145, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Exhausted_battery.JPG', stock: 12, description: 'Batería 600 CCA, garantía 12 meses', compatibility: 'Sedanes / SUVs medianos' },
  { id: 'p4', name: 'Pastillas de Freno Delanteras', category: 'part', brand: 'Generic', salePrice: 85, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Brake_pad.jpg', stock: 18, description: 'Pastillas cerámicas de alto rendimiento', compatibility: 'Toyota / Ford / Chevrolet' },
  { id: 'p5', name: 'Llanta 205/55 R16', category: 'tire', brand: 'Generic', salePrice: 110, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/2017-09-28_%28593%29_Michelin_Energy_Saver_195-55_R_16_91_V_tire_at_Bahnhof_Stockerau.jpg', stock: 8, description: 'Llanta radial touring, 50.000 millas', compatibility: 'Universal 16"' },
  { id: 'p6', name: 'Cambio de Aceite + Filtro', category: 'service', brand: 'Generic', salePrice: 55, type: 'service', image: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Woman_mechanic_working_on_engine_%28cropped%29.jpeg', stock: 99, description: 'Servicio completo: drenado, filtro y aceite incluido', compatibility: 'Universal', featured: true },
  { id: 'p7', name: 'Filtro de Aire Ford', category: 'filter', brand: 'Ford', salePrice: 22, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Dirty-air-filter.jpg', stock: 15, description: 'Filtro de aire motor para F-150, Escape, Explorer', compatibility: 'Ford' },
  { id: 'p8', name: 'Aceite 10W-40 Semi-Sintético', category: 'oil', brand: 'Generic', salePrice: 26, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Fuchs_Motor_Oil.jpg', stock: 30, description: 'Aceite semi-sintético para motores de alto kilometraje', compatibility: 'Universal' },
  { id: 'p9', name: 'Bujías Iridium (juego)', category: 'part', brand: 'Generic', salePrice: 42, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Spark_plugs.jpg', stock: 20, description: 'Bujías de iridium, mejor combustión y durabilidad', compatibility: 'Toyota / Ford / Chevrolet' },
  { id: 'p10', name: 'Revisión General 21 Puntos', category: 'service', brand: 'Generic', salePrice: 75, type: 'service', image: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Car_workshop_tools.jpg', stock: 99, description: 'Inspección completa: frenos, suspensiones, fluidos y más', compatibility: 'Universal', featured: true },
  { id: 'p11', name: 'Filtro de Combustible', category: 'filter', brand: 'Generic', salePrice: 28, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Framoilfilterassortment.JPG', stock: 10, description: 'Filtro de gasolina compatible con múltiples marcas', compatibility: 'Universal' },
  { id: 'p12', name: 'Kit de Frenos Traseros', category: 'part', brand: 'Generic', salePrice: 95, type: 'sale', image: 'https://upload.wikimedia.org/wikipedia/commons/7/79/New_rotor_on_%285049374539%29.jpg', stock: 9, description: 'Pastillas y discos traseros incluidos', compatibility: 'Toyota / Ford' },
];

const CLIENTS: Client[] = [
  { id: 'c1', name: 'Carlos Mendoza', phone: '0412-555-1234', email: 'carlos.m@gmail.com', idDoc: 'V-12345678', address: 'Av. Principal, Urb. Las Palmas, Qta 5', joinDate: '2024-01-15', status: 'active', vehicles: [VEHICLES[0], VEHICLES[1]] },
  { id: 'c2', name: 'María García', phone: '0424-555-5678', email: 'maria.g@gmail.com', idDoc: 'V-23456789', address: 'Calle 5, Urb. El Paraíso, Casa 12', joinDate: '2024-02-20', status: 'active', vehicles: [VEHICLES[2]] },
  { id: 'c3', name: 'José Rodríguez', phone: '0416-555-9012', email: 'jose.r@gmail.com', idDoc: 'V-34567890', address: 'Torre Central, Piso 3, Apt 3B', joinDate: '2024-03-10', status: 'active', vehicles: [VEHICLES[3]] },
  { id: 'c4', name: 'Ana Martínez', phone: '0414-555-3456', email: 'ana.m@hotmail.com', idDoc: 'V-45678901', address: 'Sector Norte, Casa 15', joinDate: '2024-01-05', status: 'inactive', vehicles: [VEHICLES[4]] },
  { id: 'c5', name: 'Luis Pérez', phone: '0426-555-7890', email: 'luis.p@gmail.com', idDoc: 'V-56789012', address: 'Urb. Oeste, Qta 8, Calle Mango', joinDate: '2024-04-18', status: 'active', vehicles: [VEHICLES[5]] },
  { id: 'c6', name: 'Sofía Torres', phone: '0412-555-2468', email: 'sofia.t@gmail.com', idDoc: 'V-67890123', address: 'Res. Las Américas, Piso 7, Apt 7A', joinDate: '2024-05-22', status: 'active' },
];

const SERVICE_ORDERS: ServiceOrder[] = [
  { id: 'so1', clientId: 'c1', clientName: 'Carlos Mendoza', vehicleId: 'v1', vehicleDesc: 'Toyota Corolla ABC-123', serviceType: 'oil_change', productsUsed: [{ productId: 'p2', name: 'Aceite Sintético 5W-30', qty: 4, price: 32 }, { productId: 'p1', name: 'Filtro de Aceite Toyota', qty: 1, price: 18 }], laborCost: 25, total: 171, date: '2024-09-20', dueDate: '2024-09-20', status: 'completed', notes: 'Cliente solicita revisión de frenos próxima visita.', technician: 'Miguel Ángel' },
  { id: 'so2', clientId: 'c2', clientName: 'María García', vehicleId: 'v3', vehicleDesc: 'Chevrolet Spark DEF-456', serviceType: 'maintenance', productsUsed: [{ productId: 'p7', name: 'Filtro de Aire Ford', qty: 1, price: 22 }], laborCost: 45, total: 67, date: '2024-09-22', dueDate: '2024-09-23', status: 'in_progress', notes: 'Revisión general programada.', technician: 'Roberto Silva' },
  { id: 'so3', clientId: 'c3', clientName: 'José Rodríguez', vehicleId: 'v4', vehicleDesc: 'Toyota Hilux GHI-321', serviceType: 'repair', productsUsed: [{ productId: 'p4', name: 'Pastillas de Freno Delanteras', qty: 1, price: 85 }], laborCost: 60, total: 145, date: '2024-09-18', dueDate: '2024-09-25', status: 'ready', notes: 'Cambio de pastillas delanteras.', technician: 'Miguel Ángel' },
  { id: 'so4', clientId: 'c5', clientName: 'Luis Pérez', vehicleId: 'v6', vehicleDesc: 'Chevrolet Silverado MNO-987', serviceType: 'battery', productsUsed: [{ productId: 'p3', name: 'Batería 24F-600', qty: 1, price: 145 }], laborCost: 20, total: 165, date: '2024-09-24', dueDate: '2024-09-24', status: 'pending', notes: 'Batería descargada, requiere cambio.', technician: 'Daniel Rojas' },
];

const SALES: Sale[] = [
  { id: 's1', clientName: 'Carlos Mendoza', products: ['Aceite Sintético 5W-30 x4', 'Filtro de Aceite Toyota'], date: '2024-09-22', subtotal: 146, discount: 6, total: 140, paymentMethod: 'cash' },
  { id: 's2', clientName: 'María García', products: ['Filtro de Aire Ford'], date: '2024-09-20', subtotal: 22, discount: 0, total: 22, paymentMethod: 'transfer' },
  { id: 's3', clientName: 'Luis Pérez', products: ['Batería 24F-600'], date: '2024-09-19', subtotal: 145, discount: 0, total: 145, paymentMethod: 'card' },
  { id: 's4', clientName: 'Sofía Torres', products: ['Bujías Iridium (juego)', 'Filtro de Aceite Toyota'], date: '2024-09-18', subtotal: 60, discount: 10, total: 50, paymentMethod: 'transfer' },
];

const PURCHASES: Purchase[] = [
  { id: 'pc1', supplier: 'Autopartes Venezuela C.A.', product: 'Filtro de Aceite Toyota (caja x24)', quantity: 24, unitCost: 9, total: 216, date: '2024-09-01', invoiceNumber: 'FAC-2024-0891', status: 'received' },
  { id: 'pc2', supplier: 'Lubricantes del Sur', product: 'Aceite Sintético 5W-30 (caja x12)', quantity: 12, unitCost: 18, total: 216, date: '2024-09-10', invoiceNumber: 'FAC-2024-0945', status: 'received' },
  { id: 'pc3', supplier: 'Baterías Nacional', product: 'Batería 24F-600 (lote x10)', quantity: 10, unitCost: 85, total: 850, date: '2024-09-20', invoiceNumber: 'FAC-2024-1023', status: 'received' },
  { id: 'pc4', supplier: 'Autopartes Venezuela C.A.', product: 'Pastillas de Freno (caja x20)', quantity: 20, unitCost: 42, total: 840, date: '2024-09-22', invoiceNumber: 'FAC-2024-1045', status: 'pending' },
];

const WARRANTIES: Warranty[] = [
  { id: 'w1', clientName: 'Carlos Mendoza', product: 'Filtro de Aceite Toyota', serial: 'FT-2024-001', purchaseDate: '2024-01-15', expiryDate: '2025-01-15', status: 'active', type: 'store' },
  { id: 'w2', clientName: 'Luis Pérez', product: 'Batería 24F-600', serial: 'BT-987654', purchaseDate: '2024-03-10', expiryDate: '2025-03-10', status: 'active', type: 'store' },
  { id: 'w3', clientName: 'José Rodríguez', product: 'Pastillas de Freno Delanteras', serial: 'BK-112233', purchaseDate: '2023-06-20', expiryDate: '2024-06-20', status: 'expired', type: 'manufacturer' },
];

const CONTACT_MESSAGES: ContactMessage[] = [
  { id: 'm1', name: 'Gabriel Torres', email: 'gabriel.t@gmail.com', phone: '0412-111-2233', subject: 'Cambio de aceite Toyota', message: 'Buenas tardes, ¿tienen disponibilidad para cambio de aceite este fin de semana?', date: '2024-09-24', status: 'unread' },
  { id: 'm2', name: 'Elena Rivas', email: 'elena.r@hotmail.com', phone: '0424-999-8877', subject: 'Revisión de frenos', message: 'Hola, mi Ford Escape hace ruido al frenar. ¿Hacen diagnóstico?', date: '2024-09-23', status: 'read' },
  { id: 'm3', name: 'Marcos Silva', email: 'marcos.silva@yahoo.com', phone: '0414-333-4455', subject: 'Garantía batería', message: 'Compré una batería hace 2 meses y no carga bien.', date: '2024-09-21', status: 'replied' },
];

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`badge badge-${cls}`}>{children}</span>;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Buscar...'}
        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-black dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all"
      />
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="font-display text-2xl font-700 text-gtext">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 text-white transition-all"
      style={{ background: '#6153d6', boxShadow: '0 2px 6px rgba(97,83,214,0.18)' }}>
      <Plus size={15} /> {label}
    </button>
  );
}

function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  className = ''
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const parsedDate = useMemo(() => value ? new Date(value.split('-').map(Number)[0], value.split('-').map(Number)[1] - 1, value.split('-').map(Number)[2]) : new Date(), [value]);
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth());

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayNames = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    const days = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) days.push({ day: prevMonthLastDay - i, month: viewMonth - 1, year: viewMonth === 0 ? viewYear - 1 : viewYear, isCurrentMonth: false });
    for (let d = 1; d <= lastDay.getDate(); d++) days.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) days.push({ day: d, month: viewMonth + 1, year: viewMonth === 11 ? viewYear + 1 : viewYear, isCurrentMonth: false });
    return days;
  }, [viewYear, viewMonth]);

  const selectDate = (y: number, m: number, d: number) => {
    const realDate = new Date(y, m, d);
    onChange(`${realDate.getFullYear()}-${String(realDate.getMonth() + 1).padStart(2, '0')}-${String(realDate.getDate()).padStart(2, '0')}`);
    setIsOpen(false);
  };

  const setToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    selectDate(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <div onClick={() => setIsOpen(!isOpen)} className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer select-none transition-all hover:border-indigo-400 dark:hover:border-indigo-500 text-sm ${className}`}>
        <span className={value ? 'font-500' : 'text-slate-400 dark:text-slate-500'}>{value ? fmtDate(value) : placeholder}</span>
        <Calendar size={16} className="text-slate-400 dark:text-slate-400 flex-shrink-0 ml-2" />
      </div>
      {isOpen && (
        <div className="absolute z-[100] top-full left-0 mt-2 w-72 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setViewMonth(m => m === 0 ? (setViewYear(y => y - 1), 11) : m - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><ChevronLeft size={16} /></button>
            <span className="font-display font-700 text-sm capitalize">{monthNames[viewMonth]} {viewYear}</span>
            <button type="button" onClick={() => setViewMonth(m => m === 11 ? (setViewYear(y => y + 1), 0) : m + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayNames.map(d => <span key={d} className="text-[10px] font-700 text-indigo-600 dark:text-indigo-400 uppercase py-1">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const cellStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
              const isSelected = value === cellStr;
              const isToday = todayStr === cellStr;
              return (
                <button key={idx} type="button" onClick={() => selectDate(cell.year, cell.month, cell.day)}
                  className={`h-8 w-8 text-xs font-500 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-[#6153d6] text-white font-700 shadow-md shadow-indigo-500/30 scale-105' : isToday ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-700 border border-indigo-200 dark:border-indigo-800' : cell.isCurrentMonth ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                  {cell.day}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button type="button" onClick={setToday} className="text-indigo-600 dark:text-indigo-400 font-600 hover:underline">Hoy</button>
            <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-500">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Catalog View ─────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  all: 'Todos', parts: 'Repuestos', oils: 'Aceites', filters: 'Filtros', batteries: 'Baterías', tires: 'Llantas', services: 'Servicios'
};

const CAT_MAP: Record<string, ProductCategory> = { parts: 'part', oils: 'oil', filters: 'filter', batteries: 'battery', tires: 'tire', services: 'service' };
const SERVICE_TYPE_LABELS: Record<ServiceType, string> = { oil_change: 'Cambio de aceite', maintenance: 'Mantenimiento', repair: 'Reparación', inspection: 'Inspección', tire: 'Llantas', battery: 'Batería' };
const SERVICE_TYPE_ICONS: Record<ServiceType, React.ReactNode> = {
  oil_change: <Droplets size={20} />, maintenance: <Settings size={20} />, repair: <Wrench size={20} />, inspection: <Gauge size={20} />, tire: <Car size={20} />, battery: <ZapIcon size={20} />
};

function ZapIcon({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>; }

function ProductArtwork({ product }: { product: Product }) {
  return (
    <div className="product-art relative h-56 overflow-hidden product-art-container flex items-center justify-center p-1.5">
      <div className="absolute inset-0 bg-slate-950/80 product-art-grid opacity-30 pointer-events-none" />
      <img
        src={product.image}
        alt={`Imagen referencial de ${product.name}`}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 rounded-xl relative z-0"
      />
      <div className="absolute inset-0 product-art-shadow-overlay pointer-events-none z-10" />
      <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-white/20 text-[9px] font-700 tracking-[0.16em] text-slate-100 shadow-md">
        {product.category === 'service' ? 'SERVICIO' : 'PRODUCTO'}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const typeBadge = product.type === 'service' ? 'service' : 'sale';
  return (
    <div className="glow-card product-card rounded-2xl overflow-hidden bg-card flex flex-col group cursor-pointer">
      <div className="relative">
        <ProductArtwork product={product} />
        {product.featured && (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-700 text-amber-700 bg-amber-50 border border-amber-200">
            <Star size={10} fill="currentColor" /> DESTACADO
          </div>
        )}
        <div className="absolute bottom-4 left-4"><Badge cls={product.brand.toLowerCase()}>{product.brand === 'Generic' ? 'Genérico' : product.brand}</Badge></div>
        {product.stock <= 5 && product.type !== 'service' && (
          <div className="absolute bottom-4 right-4"><span className="badge bg-red-50 text-red-700 border border-red-200">Stock bajo</span></div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-600 text-gtext text-[15px] leading-tight">{product.name}</h3>
          <Badge cls={typeBadge}>{typeBadge === 'service' ? 'Servicio' : 'Venta'}</Badge>
        </div>
        <p className="text-xs text-muted leading-relaxed">{product.description}</p>
        {product.compatibility && <p className="text-[11px] text-blue"><Tag size={11} className="inline mr-1" />{product.compatibility}</p>}
        <div className="mt-auto pt-3 border-t border-[rgba(139,92,246,0.1)] flex flex-col gap-1">
          {product.salePrice && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted flex items-center gap-1"><Tag size={11} /> Precio</span>
              <span className="font-display font-700 text-blue" style={{ fontSize: '17px' }}>{fmtMoney(product.salePrice)}</span>
            </div>
          )}
          {product.type !== 'service' && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-muted">Stock: <span className="text-gtext font-600">{product.stock}</span></span>
              <button className="text-[12px] font-600 text-blue hover:text-blue-light transition-colors flex items-center gap-0.5">Ver detalle <ChevronRight size={12} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const HERO_SHOWCASE: Record<string, { tag: string; title: string; subtitle: string; image: string; icon: React.ReactNode }> = {
  all: { tag: 'DESTACADO · TALLER AUTORIZADO', title: 'Servicio Integral Automotriz', subtitle: 'Repuestos, aceites y mantenimiento con garantía', image: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Car_repair_shop.jpg', icon: <Car size={20} /> },
  parts: { tag: 'DESTACADO · REPUESTOS', title: 'Piezas de Calidad para tu Vehículo', subtitle: 'Pastillas, bujías, filtros y más con garantía', image: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Spark_plugs.jpg', icon: <Settings size={20} /> },
  oils: { tag: 'DESTACADO · ACEITES', title: 'Lubricantes Sintéticos y Semi-sintéticos', subtitle: 'Protección superior para tu motor', image: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Castrol_oil_cans.jpg', icon: <Droplets size={20} /> },
  filters: { tag: 'DESTACADO · FILTROS', title: 'Filtros de Aceite, Aire y Combustible', subtitle: 'Rendimiento óptimo y mayor vida útil', image: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Engine_oil_filter.JPG', icon: <Filter size={20} /> },
  batteries: { tag: 'DESTACADO · BATERÍAS', title: 'Baterías de Alto Rendimiento', subtitle: 'Arranque confiable en cualquier clima', image: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Exhausted_battery.JPG', icon: <ZapIcon size={20} /> },
  tires: { tag: 'DESTACADO · LLANTAS', title: 'Llantas para Todo Terreno', subtitle: 'Seguridad y durabilidad en cada kilómetro', image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/2017-09-28_%28593%29_Michelin_Energy_Saver_195-55_R_16_91_V_tire_at_Bahnhof_Stockerau.jpg', icon: <Car size={20} /> },
  services: { tag: 'DESTACADO · SERVICIOS', title: 'Mantenimiento y Reparación', subtitle: 'Técnicos certificados y diagnóstico preciso', image: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Woman_mechanic_working_on_engine_%28cropped%29.jpeg', icon: <Wrench size={20} /> },
};

function CatalogView() {
  const [category, setCategory] = useState<CatalogCategory>('all');
  const [filter, setFilter] = useState<FilterType>('all');
  const [brand, setBrand] = useState<BrandFilter>('all');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showPriceFilter, setShowPriceFilter] = useState<boolean>(false);
  const heroData = HERO_SHOWCASE[category] || HERO_SHOWCASE.all;

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (category !== 'all' && p.category !== CAT_MAP[category]) return false;
      if (filter === 'sale' && p.type !== 'sale') return false;
      if (filter === 'service' && p.type !== 'service') return false;
      if (brand !== 'all' && p.brand !== brand) return false;
      const price = p.salePrice ?? 0;
      if (minPrice !== '' && price < Number(minPrice)) return false;
      if (maxPrice !== '' && price > Number(maxPrice)) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category, filter, brand, search, minPrice, maxPrice]);

  const hasActiveFilters = category !== 'all' || filter !== 'all' || brand !== 'all' || search !== '' || minPrice !== '' || maxPrice !== '';
  const clearFilters = () => { setCategory('all'); setFilter('all'); setBrand('all'); setSearch(''); setMinPrice(''); setMaxPrice(''); };

  return (
    <div className="min-h-screen bg-bg transition-colors duration-200">
      <div className="relative overflow-hidden bg-blue-50/80 dark:bg-slate-900 border-b border-blue-100 dark:border-slate-800 hero-banner">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 85% 20%, rgba(99,102,241,0.12), transparent 45%), radial-gradient(circle at 15% 85%, rgba(37,99,235,0.10), transparent 45%)' }} />
        <div className="relative max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] items-center gap-10 lg:gap-14">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-5">
                <span className="badge badge-sale">Taller Autorizado</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Servicio garantizado</span>
              </div>
              <h1 className="font-display font-700 text-4xl md:text-5xl lg:text-[56px] text-slate-900 dark:text-white leading-[1.04] mb-5 tracking-[-0.035em]">
                Cuidamos tu auto como <span className="text-[#5488D6]">mereces.</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed max-w-lg">
                Repuestos originales, aceites de calidad y servicios de mantenimiento con diagnóstico profesional y garantía real.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <button onClick={() => setCategory(category === 'services' ? 'all' : 'services')} className={`px-5 py-3 rounded-xl text-sm font-600 transition-all duration-300 flex items-center gap-2 ${category === 'services' || category === 'all' ? 'bg-[#5488D6] hover:bg-[#4677c4] text-white shadow-lg shadow-[#5488D6]/30 scale-[1.02]' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#5488D6]'}`}>
                  <Wrench size={16} /> Ver servicios
                </button>
                <button onClick={() => setCategory(category === 'oils' ? 'all' : 'oils')} className={`px-5 py-3 rounded-xl text-sm font-600 transition-all duration-300 flex items-center gap-2 ${category === 'oils' ? 'bg-[#5488D6] hover:bg-[#4677c4] text-white shadow-lg shadow-[#5488D6]/30 scale-[1.02]' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#5488D6]'}`}>
                  <Droplets size={16} /> Aceites
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-9 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div><strong className="block font-display text-xl text-slate-900 dark:text-white">{PRODUCTS.length}+</strong><span className="text-xs text-slate-500 dark:text-slate-400">Productos</span></div>
                <div><strong className="block font-display text-xl text-slate-900 dark:text-white">12 meses</strong><span className="text-xs text-slate-500 dark:text-slate-400">Garantía</span></div>
                <div><strong className="block font-display text-xl text-slate-900 dark:text-white">Soporte</strong><span className="text-xs text-slate-500 dark:text-slate-400">Especializado</span></div>
              </div>
            </div>
            <div className="relative lg:min-h-[430px]">
              <div key={category} className="hero-animate hero-photo relative h-[340px] sm:h-[420px] overflow-hidden rounded-[28px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl">
                <img src={heroData.image} alt={heroData.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute left-6 bottom-6 text-white max-w-md">
                  <span className="text-[10px] font-700 tracking-[0.18em] text-white bg-[#5488D6] border border-[#5488D6]/60 px-2.5 py-1 rounded-full inline-block mb-2 shadow-sm">{heroData.tag}</span>
                  <div className="font-display text-2xl md:text-3xl font-700 leading-tight text-white">{heroData.title}</div>
                  <div className="text-sm text-white/80 mt-1">{heroData.subtitle}</div>
                </div>
              </div>
              <div className="absolute -left-4 sm:-left-7 top-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue dark:text-blue-400 flex items-center justify-center">{heroData.icon}</div>
                <div><div className="text-xs text-slate-500 dark:text-slate-400">Disponible</div><div className="text-sm font-600 text-slate-900 dark:text-white">Venta y servicio</div></div>
              </div>
              <div className="absolute -right-2 sm:-right-5 bottom-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 px-4 py-3">
                <div className="flex items-center gap-1 text-amber-500 mb-1"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                <div className="text-xs font-600 text-slate-900 dark:text-white">Servicio certificado</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[64px] z-30 border-b border-slate-200 dark:border-slate-800 sticky-filter-bar backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col gap-3 py-3">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div className="flex items-center gap-1 flex-wrap">
                {(Object.keys(CATEGORY_LABELS) as CatalogCategory[]).map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-500 transition-all ${category === cat ? 'bg-[#5488D6] text-white shadow-sm shadow-[#5488D6]/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {(['all', 'Toyota', 'Ford', 'Chevrolet', 'Generic'] as BrandFilter[]).map(b => (
                    <button key={b} onClick={() => setBrand(b)} className={`px-2.5 py-1 rounded-md text-xs font-500 transition-all ${brand === b ? 'bg-[#5488D6] text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                      {b === 'all' ? 'Marcas' : b === 'Generic' ? 'Genérico' : b}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#5488D6]/10 dark:bg-[#5488D6]/15 border border-[#5488D6]/25 dark:border-[#5488D6]/30">
                  {(['all', 'sale', 'service'] as FilterType[]).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-md text-xs font-500 transition-all ${filter === f ? 'bg-[#5488D6] text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                      {f === 'all' ? 'Todos' : f === 'sale' ? 'Venta' : 'Servicio'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowPriceFilter(!showPriceFilter)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-600 transition-colors ${showPriceFilter || minPrice || maxPrice ? 'bg-blue/10 border-blue text-blue dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                  <SlidersHorizontal size={14} /> Precios
                </button>
                <div className="w-full sm:w-64"><SearchBar value={search} onChange={setSearch} placeholder="Buscar producto o servicio..." /></div>
              </div>
            </div>
            {showPriceFilter && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-200">
                <span className="font-600 text-slate-800 dark:text-slate-200 flex items-center gap-1"><Tag size={13} className="text-blue dark:text-indigo-400" /> Rango de Precio ($):</span>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Mín $" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                  <span className="text-slate-500">-</span>
                  <input type="number" placeholder="Máx $" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="ml-auto text-xs font-600 text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"><RotateCcw size={12} /> Limpiar filtros</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted">{filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
          {hasActiveFilters && !showPriceFilter && (
            <button onClick={clearFilters} className="text-xs text-red-600 font-600 hover:underline flex items-center gap-1"><RotateCcw size={12} /> Limpiar filtros</button>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-muted">
            <Settings size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">No se encontraron productos</p>
            <p className="text-sm mt-1">Intenta ajustando los filtros de precio o búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin: Dashboard ─────────────────────────────────────────────────────────

function Dashboard({ inventory, serviceOrders }: { inventory: Product[]; serviceOrders: ServiceOrder[] }) {
  const stats = [
    { label: 'Clientes Registrados', value: CLIENTS.length, sub: `${CLIENTS.filter(c => c.status === 'active').length} activos`, icon: <Users size={20} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Órdenes Activas', value: serviceOrders.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length, sub: `${serviceOrders.filter(r => r.status === 'ready').length} listas`, icon: <Wrench size={20} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
    { label: 'Ingresos del Mes', value: fmtMoney(SALES.reduce((s, x) => s + x.total, 0)), sub: `${SALES.length} ventas`, icon: <DollarSign size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)', isText: true },
    { label: 'Stock Crítico', value: inventory.filter(p => p.type !== 'service' && p.stock <= 5).length, sub: 'productos bajos', icon: <AlertTriangle size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="Panel Principal" subtitle="Resumen de operaciones del taller" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card rounded-xl p-5 bg-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-lg" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <ArrowUpRight size={16} className="text-muted" />
            </div>
            <div className="font-display font-700 text-3xl text-gtext mb-1">{s.value}</div>
            <div className="text-xs font-600 text-muted mb-0.5">{s.label}</div>
            <div className="text-xs text-muted opacity-70">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
          <h3 className="font-display font-600 text-gtext mb-4 flex items-center gap-2"><Wrench size={16} className="text-purple" /> Órdenes de Servicio Recientes</h3>
          <div className="space-y-3">
            {serviceOrders.slice(0, 4).map(o => (
              <div key={o.id} className="flex items-center gap-3 py-2 border-b border-[rgba(139,92,246,0.07)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-500 text-gtext truncate">{o.vehicleDesc}</p>
                  <p className="text-xs text-muted truncate">{o.clientName} · {SERVICE_TYPE_LABELS[o.serviceType]}</p>
                </div>
                <Badge cls={o.status}>{o.status === 'pending' ? 'Pendiente' : o.status === 'in_progress' ? 'En taller' : o.status === 'ready' ? 'Listo' : 'Completada'}</Badge>
                <span className="text-sm font-600 text-blue">{fmtMoney(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
          <h3 className="font-display font-600 text-gtext mb-4 flex items-center gap-2"><ShoppingBag size={16} className="text-warning" /> Ventas Recientes</h3>
          <div className="space-y-3">
            {SALES.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-[rgba(139,92,246,0.07)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-500 text-gtext truncate">{s.clientName}</p>
                  <p className="text-xs text-muted truncate">{s.products.length} artículo(s)</p>
                </div>
                <Badge cls={s.paymentMethod}>{s.paymentMethod === 'cash' ? 'Efectivo' : s.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</Badge>
                <span className="text-sm font-600 text-success">{fmtMoney(s.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(serviceOrders.some(o => o.status === 'pending' && new Date(o.dueDate) < new Date()) || serviceOrders.some(o => o.status === 'ready')) && (
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
          <h3 className="font-display font-600 text-warning mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Alertas del Taller</h3>
          <div className="space-y-2">
            {serviceOrders.filter(o => o.status === 'pending' && new Date(o.dueDate) < new Date()).map(o => (
              <div key={o.id} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <AlertTriangle size={13} className="text-danger flex-shrink-0" />
                <span className="text-gtext">Orden vencida: <span className="font-600">{o.vehicleDesc}</span> – {o.clientName}</span>
              </div>
            ))}
            {serviceOrders.filter(o => o.status === 'ready').map(o => (
              <div key={o.id} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)' }}>
                <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                <span className="text-gtext">Listo para entrega: <span className="font-600">{o.vehicleDesc}</span> de {o.clientName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Clients ───────────────────────────────────────────────────────────

function ClientsSection({ clients, setClients }: { clients: Client[]; setClients: React.Dispatch<React.SetStateAction<Client[]>> }) {
  const emptyForm = { name: '', idDoc: '', phone: '', email: '', address: '', status: 'active' as Client['status'] };
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.idDoc.includes(search));

  const closeModal = () => { setModalOpen(false); setForm(emptyForm); setErrors({}); };
  const saveClient = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Ingresa el nombre completo';
    if (!/^[VEJ]-?\d{6,9}$/i.test(form.idDoc.trim())) nextErrors.idDoc = 'Usa un formato como V-12345678';
    if (form.phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Ingresa un teléfono válido';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Ingresa un correo válido';
    if (form.address.trim().length < 8) nextErrors.address = 'Completa la dirección';
    if (clients.some(c => c.idDoc.toLowerCase() === form.idDoc.trim().toLowerCase())) nextErrors.idDoc = 'Este documento ya está registrado';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setClients(current => [{ id: `c${Date.now()}`, name: form.name.trim(), idDoc: form.idDoc.trim().toUpperCase(), phone: form.phone.trim(), email: form.email.trim().toLowerCase(), address: form.address.trim(), status: form.status, joinDate: new Date().toISOString().slice(0, 10) }, ...current]);
    closeModal();
  };
  const fieldClass = (field: string) => `w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow ${errors[field] ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'}`;

  return (
    <div>
      <SectionHeader title="Clientes" subtitle={`${clients.length} clientes registrados`} action={<AddBtn label="Nuevo Cliente" onClick={() => setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o documento..." /></div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>{['Cliente', 'Documento', 'Teléfono', 'Email', 'Dirección', 'Desde', 'Estado'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-700 text-white flex-shrink-0" style={{ background: '#6153d6' }}>{c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div><span className="font-500 text-gtext whitespace-nowrap">{c.name}</span></div></td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{c.idDoc}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-gtext whitespace-nowrap"><Phone size={11} className="text-muted" />{c.phone}</span></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-muted whitespace-nowrap"><Mail size={11} />{c.email}</span></td>
                  <td className="px-4 py-3 text-muted max-w-[180px] truncate"><span className="flex items-center gap-1"><MapPin size={11} className="flex-shrink-0" />{c.address}</span></td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(c.joinDate)}</td>
                  <td className="px-4 py-3"><Badge cls={c.status}>{c.status === 'active' ? 'Activo' : 'Inactivo'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button aria-label="Cerrar modal" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex items-start justify-between px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-[#f1efff] dark:bg-indigo-950/60 text-[#6153d6] dark:text-indigo-400 flex items-center justify-center"><Users size={22} /></div><div><div className="text-[11px] font-700 tracking-[0.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Gestión de clientes</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nuevo cliente</h3></div></div>
              <button onClick={closeModal} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>
            <form onSubmit={saveClient} className="px-6 sm:px-8 py-6">
              <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nombre completo</span><input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={fieldClass('name')} placeholder="Ej. Andrea Ramírez" />{errors.name && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.name}</span>}</label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Documento de identidad</span><input value={form.idDoc} onChange={e => setForm({ ...form, idDoc: e.target.value })} className={fieldClass('idDoc')} placeholder="V-12345678" />{errors.idDoc && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.idDoc}</span>}</label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Teléfono</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={fieldClass('phone')} placeholder="0412-000-0000" />{errors.phone && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.phone}</span>}</label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Correo electrónico</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={fieldClass('email')} placeholder="cliente@correo.com" />{errors.email && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.email}</span>}</label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Estado inicial</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Client['status'] })} className={fieldClass('status')}><option value="active">Cliente activo</option><option value="inactive">Cliente inactivo</option></select></label>
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Dirección de residencia o taller</span><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={`${fieldClass('address')} min-h-24 resize-none`} placeholder="Urbanización, calle, edificio o casa y referencias" />{errors.address && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.address}</span>}</label>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">El cliente se añadirá temporalmente a esta sesión.</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Guardar cliente</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Vehicles ────────────────────────────────────────────────────────────

function VehiclesSection({ clients, vehicles, setVehicles }: { clients: Client[]; vehicles: Vehicle[]; setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>> }) {
  const emptyForm = { clientId: '', plate: '', brand: '', model: '', year: new Date().getFullYear(), vin: '', motor: '' };
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const filtered = vehicles.filter(v => !search || v.plate.toLowerCase().includes(search.toLowerCase()) || v.brand.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()));

  const closeModal = () => { setModalOpen(false); setForm(emptyForm); setErrors({}); };
  const saveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.clientId) nextErrors.clientId = 'Selecciona un cliente';
    if (form.plate.trim().length < 5) nextErrors.plate = 'Ingresa una placa válida';
    if (form.brand.trim().length < 2) nextErrors.brand = 'Ingresa la marca';
    if (form.model.trim().length < 2) nextErrors.model = 'Ingresa el modelo';
    if (form.year < 1900 || form.year > new Date().getFullYear() + 1) nextErrors.year = 'Año inválido';
    if (vehicles.some(v => v.plate.toLowerCase() === form.plate.trim().toLowerCase())) nextErrors.plate = 'Esta placa ya está registrada';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setVehicles(current => [{ id: `v${Date.now()}`, clientId: form.clientId, plate: form.plate.trim().toUpperCase(), brand: form.brand.trim(), model: form.model.trim(), year: Number(form.year), vin: form.vin.trim(), motor: form.motor.trim() }, ...current]);
    closeModal();
  };
  const fieldClass = (field: string) => `w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow ${errors[field] ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'}`;

  return (
    <div>
      <SectionHeader title="Vehículos" subtitle={`${vehicles.length} vehículos registrados`} action={<AddBtn label="Nuevo Vehículo" onClick={() => setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por placa, marca o modelo..." /></div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>{['Placa', 'Marca', 'Modelo', 'Año', 'VIN / Serial', 'Motor', 'Cliente'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3 font-600 text-gtext whitespace-nowrap"><span className="flex items-center gap-1"><Car size={14} className="text-muted" />{v.plate}</span></td>
                  <td className="px-4 py-3 text-gtext whitespace-nowrap">{v.brand}</td>
                  <td className="px-4 py-3 text-muted">{v.model}</td>
                  <td className="px-4 py-3 text-muted">{v.year}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs truncate max-w-[140px]">{v.vin || '—'}</td>
                  <td className="px-4 py-3 text-muted text-xs">{v.motor || '—'}</td>
                  <td className="px-4 py-3 text-gtext whitespace-nowrap">{clients.find(c => c.id === v.clientId)?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button aria-label="Cerrar modal" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex items-start justify-between px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-[#f1efff] dark:bg-indigo-950/60 text-[#6153d6] dark:text-indigo-400 flex items-center justify-center"><Car size={22} /></div><div><div className="text-[11px] font-700 tracking-[0.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Gestión de flota</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar vehículo</h3></div></div>
              <button onClick={closeModal} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>
            <form onSubmit={saveVehicle} className="px-6 sm:px-8 py-6">
              <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente propietario</span><select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} className={fieldClass('clientId')}><option value="">Seleccionar cliente</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name} · {c.idDoc}</option>)}</select>{errors.clientId && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.clientId}</span>}</label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Placa</span><input value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} className={fieldClass('plate')} placeholder="ABC-123" />{errors.plate && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.plate}</span>}</label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Marca</span><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className={fieldClass('brand')} placeholder="Toyota" />{errors.brand && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.brand}</span>}</label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Modelo</span><input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className={fieldClass('model')} placeholder="Corolla" />{errors.model && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.model}</span>}</label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Año</span><input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} className={fieldClass('year')} />{errors.year && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.year}</span>}</label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">VIN / Serial (opcional)</span><input value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} className={fieldClass('vin')} placeholder="JTDBU4EE3B9123456" /></label>
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Motor (opcional)</span><input value={form.motor} onChange={e => setForm({ ...form, motor: e.target.value })} className={fieldClass('motor')} placeholder="1.8L / 2.0L EcoBoost" /></label>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">El vehículo quedará asociado al cliente seleccionado.</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Guardar vehículo</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Service Orders ─────────────────────────────────────────────────────

function ServiceOrdersSection({ serviceOrders, setServiceOrders, inventory, setInventory, clients, vehicles }: { serviceOrders: ServiceOrder[]; setServiceOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>>; inventory: Product[]; setInventory: React.Dispatch<React.SetStateAction<Product[]>>; clients: Client[]; vehicles: Vehicle[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ clientId: '', vehicleId: '', serviceType: 'oil_change' as ServiceType, productIds: [] as string[], quantities: {} as Record<string, number>, laborCost: 0, date: today, dueDate: today, notes: '', technician: '', status: 'pending' as ServiceOrder['status'] });
  const [errors, setErrors] = useState('');

  const selectedClient = clients.find(c => c.id === form.clientId);
  const clientVehicles = vehicles.filter(v => v.clientId === form.clientId);
  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);
  const usableProducts = inventory.filter(p => p.type === 'sale' && p.stock > 0);
  const selectedProducts = usableProducts.filter(p => form.productIds.includes(p.id));
  const partsTotal = selectedProducts.reduce((sum, p) => sum + (p.salePrice || 0) * (form.quantities[p.id] || 1), 0);
  const total = partsTotal + Number(form.laborCost || 0);

  const toggleProduct = (id: string) => {
    setForm(current => {
      const exists = current.productIds.includes(id);
      const nextIds = exists ? current.productIds.filter(pid => pid !== id) : [...current.productIds, id];
      const nextQty = { ...current.quantities, [id]: current.quantities[id] || 1 };
      if (!exists) nextQty[id] = 1;
      return { ...current, productIds: nextIds, quantities: nextQty };
    });
  };

  const setQty = (id: string, qty: number) => {
    const product = inventory.find(p => p.id === id);
    const max = product?.stock || 1;
    setForm(current => ({ ...current, quantities: { ...current.quantities, [id]: Math.max(1, Math.min(max, qty)) } }));
  };

  const saveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.vehicleId || !form.technician) { setErrors('Selecciona cliente, vehículo y técnico responsable.'); return; }
    const productsUsed = selectedProducts.map(p => ({ productId: p.id, name: p.name, qty: form.quantities[p.id] || 1, price: p.salePrice || 0 }));
    setServiceOrders(current => [{ id: `so${Date.now()}`, clientId: form.clientId, clientName: selectedClient?.name || '', vehicleId: form.vehicleId, vehicleDesc: `${selectedVehicle?.brand} ${selectedVehicle?.model} ${selectedVehicle?.plate}`, serviceType: form.serviceType, productsUsed, laborCost: Number(form.laborCost || 0), total, date: form.date, dueDate: form.dueDate, status: form.status, notes: form.notes.trim(), technician: form.technician }, ...current]);
    setInventory(current => current.map(p => {
      const used = productsUsed.find(u => u.productId === p.id);
      return used ? { ...p, stock: p.stock - used.qty } : p;
    }));
    setForm({ clientId: '', vehicleId: '', serviceType: 'oil_change', productIds: [], quantities: {}, laborCost: 0, date: today, dueDate: today, notes: '', technician: '', status: 'pending' });
    setErrors('');
    setModalOpen(false);
  };

  const filtered = serviceOrders.filter(o => {
    if (statusF !== 'all' && o.status !== statusF) return false;
    if (search && !o.clientName.toLowerCase().includes(search.toLowerCase()) && !o.vehicleDesc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <SectionHeader title="Órdenes de Servicio" subtitle={`${serviceOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} activas · ${serviceOrders.filter(o => o.status === 'ready').length} listas`} action={<AddBtn label="Nueva Orden" onClick={() => setModalOpen(true)} />} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o vehículo..." />
        <select value={statusF} onChange={e => setStatusF(e.target.value)} className="px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-gtext flex-shrink-0">
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En taller</option>
          <option value="ready">Listo</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>{['ID', 'Cliente', 'Vehículo', 'Servicio', 'Ingreso', 'Entrega', 'Total', 'Estado', 'Técnico'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{o.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{o.clientName}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{o.vehicleDesc}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{SERVICE_TYPE_LABELS[o.serviceType]}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(o.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={o.status === 'pending' && new Date(o.dueDate) < new Date() ? 'text-danger' : 'text-muted'}>{fmtDate(o.dueDate)}</span></td>
                  <td className="px-4 py-3 font-600 text-blue">{fmtMoney(o.total)}</td>
                  <td className="px-4 py-3"><Badge cls={o.status}>{o.status === 'pending' ? 'Pendiente' : o.status === 'in_progress' ? 'En taller' : o.status === 'ready' ? 'Listo' : o.status === 'completed' ? 'Completada' : 'Cancelada'}</Badge></td>
                  <td className="px-4 py-3 text-gtext whitespace-nowrap">{o.technician}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <button aria-label="Cerrar" className="fixed inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-5xl my-8 max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-4"><div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue dark:text-blue-400 flex items-center justify-center"><Wrench size={22} /></div><div><div className="text-[11px] font-700 tracking-[.14em] text-blue dark:text-blue-400 uppercase">Taller</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar orden de servicio</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Asigna vehículo, repuestos/aceite y mano de obra.</p></div></div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>
            <form onSubmit={saveOrder} className="p-7">
              <div className="grid lg:grid-cols-[1fr_1fr] gap-7">
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value, vehicleId: '' })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar cliente</option>{clients.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                    <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Vehículo</span><select required value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">{form.clientId ? 'Seleccionar vehículo' : 'Primero selecciona un cliente'}</option>{clientVehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.plate}</option>)}</select></label>
                    <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Tipo de servicio</span><select value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value as ServiceType })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm">{Object.entries(SERVICE_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                    <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Técnico responsable</span><select required value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Asignar técnico</option><option>Miguel Ángel</option><option>Roberto Silva</option><option>Daniel Rojas</option></select></label>
                    <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha de ingreso</span><DatePicker value={form.date} onChange={val => setForm({ ...form, date: val })} /></label>
                    <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha estimada de entrega</span><DatePicker value={form.dueDate} onChange={val => setForm({ ...form, dueDate: val })} /></label>
                  </div>
                  <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Notas / Falla reportada</span><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full min-h-24 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm" placeholder="Describe la falla, el trabajo a realizar o recomendaciones del cliente" /></label>
                  <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Estado inicial</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ServiceOrder['status'] })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="pending">Pendiente</option><option value="in_progress">En taller</option><option value="ready">Listo</option><option value="completed">Completada</option></select></label>
                </div>
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"><strong className="text-sm text-slate-900 dark:text-white">Repuestos / Aceite / Filtros</strong><span className="block text-xs text-slate-500 dark:text-slate-400">Selecciona los productos utilizados</span></div>
                    <div className="max-h-[320px] overflow-y-auto p-2.5 space-y-2 bg-slate-50/70 dark:bg-slate-900">
                      {usableProducts.map(p => {
                        const isSelected = form.productIds.includes(p.id);
                        return (
                          <label key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-[#86CCC0]/15 border-[#86CCC0] dark:bg-[#86CCC0]/25 dark:border-[#86CCC0]/50 shadow-sm' : 'bg-white border-slate-200/90 hover:border-[#86CCC0]/60 dark:bg-slate-900 dark:border-slate-800'}`}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleProduct(p.id)} className="w-4 h-4 accent-[#86CCC0] rounded cursor-pointer" />
                            <div className="flex-1 min-w-0"><span className={`block text-sm truncate ${isSelected ? 'font-700 text-slate-900 dark:text-white' : 'font-500 text-slate-800 dark:text-slate-200'}`}>{p.name}</span><span className="text-xs text-slate-500 dark:text-slate-400">{p.brand} · Stock {p.stock}</span></div>
                            {isSelected && <input type="number" min={1} max={p.stock} value={form.quantities[p.id] || 1} onChange={e => setQty(p.id, Number(e.target.value))} className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs text-center" />}
                            <strong className="text-sm text-[#0d9488] dark:text-[#86CCC0]">{fmtMoney(p.salePrice!)}</strong>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-5 shadow-sm">
                    <div className="text-[11px] font-700 tracking-[.14em] text-slate-500 dark:text-white/50 uppercase">Resumen de orden</div>
                    <div className="mt-4 space-y-2">
                      {selectedProducts.length ? selectedProducts.map(p => <div key={p.id} className="flex justify-between gap-3 text-sm"><span className="text-slate-600 dark:text-white/70 truncate">{form.quantities[p.id] || 1}× {p.name}</span><span className="font-600 text-slate-900 dark:text-white">{fmtMoney((p.salePrice || 0) * (form.quantities[p.id] || 1))}</span></div>) : <p className="text-sm text-slate-400 dark:text-white/45">Sin repuestos seleccionados.</p>}
                    </div>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-white/60 mt-4 pt-4 border-t border-slate-200 dark:border-white/10"><span>Mano de obra</span><input type="number" min={0} value={form.laborCost} onChange={e => setForm({ ...form, laborCost: Number(e.target.value) })} className="w-24 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-right text-slate-900 dark:text-white font-600" /></label>
                    <div className="flex justify-between items-end pt-4 mt-4 border-t border-slate-200 dark:border-white/10"><span className="text-sm text-slate-600 dark:text-white/60">Total estimado</span><strong className="font-display text-3xl text-[#0d9488] dark:text-white">{fmtMoney(total)}</strong></div>
                  </div>
                </div>
              </div>
              {errors && <div className="mt-5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{errors}</div>}
              <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Crear orden de servicio</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Sales ─────────────────────────────────────────────────────────────

function SalesSection({ inventory, setInventory }: { inventory: Product[]; setInventory: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const today = new Date().toISOString().slice(0, 10);
  const [sales, setSales] = useState<Sale[]>(SALES);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [error, setError] = useState('');
  const saleableProducts = inventory.filter(p => p.type === 'sale' && p.stock > 0);
  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => ({ product: inventory.find(p => p.id === id)!, qty }));
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.salePrice ?? 0) * item.qty, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const filtered = sales.filter(s => !search || s.clientName.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);
  const setQuantity = (product: Product, quantity: number) => setCart(current => ({ ...current, [product.id]: Math.max(0, Math.min(product.stock, quantity)) }));
  const saveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !cartItems.length) { setError('Selecciona un cliente y agrega al menos un producto.'); return; }
    if (discount > subtotal) { setError('El descuento no puede superar el subtotal.'); return; }
    setSales(current => [{ id: `s${Date.now()}`, clientName, products: cartItems.map(({ product, qty }) => `${product.name}${qty > 1 ? ` x${qty}` : ''}`), date: today, subtotal, discount: Number(discount), total, paymentMethod }, ...current]);
    setInventory(current => current.map(p => cart[p.id] ? { ...p, stock: p.stock - cart[p.id] } : p));
    setClientName(''); setCart({}); setDiscount(0); setPaymentMethod('cash'); setError(''); setModalOpen(false);
  };

  return (
    <div>
      <SectionHeader title="Ventas" subtitle={`${sales.length} ventas · Total: ${fmtMoney(sales.reduce((s, x) => s + x.total, 0))}`} action={<AddBtn label="Nueva Venta" onClick={() => setModalOpen(true)} />} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Ingresos', val: fmtMoney(totalRevenue), color: '#10b981' },
          { label: 'Venta Promedio', val: fmtMoney(filtered.length ? totalRevenue / filtered.length : 0), color: '#38bdf8' },
          { label: 'Descuentos Otorgados', val: fmtMoney(sales.reduce((s, x) => s + x.discount, 0)), color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted mb-1">{s.label}</div><div className="font-display font-700 text-xl" style={{ color: s.color }}>{s.val}</div></div>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente..." /></div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>{['ID', 'Cliente', 'Productos', 'Fecha', 'Subtotal', 'Descuento', 'Total', 'Método'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{s.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{s.clientName}</td>
                  <td className="px-4 py-3 text-muted max-w-[220px]"><div className="flex flex-col gap-0.5">{s.products.map((p, i) => <span key={i} className="text-xs truncate">{p}</span>)}</div></td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(s.date)}</td>
                  <td className="px-4 py-3 text-muted">{fmtMoney(s.subtotal)}</td>
                  <td className="px-4 py-3 text-warning">{s.discount > 0 ? `-${fmtMoney(s.discount)}` : '—'}</td>
                  <td className="px-4 py-3 font-700 text-blue">{fmtMoney(s.total)}</td>
                  <td className="px-4 py-3"><Badge cls={s.paymentMethod}>{s.paymentMethod === 'cash' ? 'Efectivo' : s.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><ShoppingBag size={22} /></div><div><div className="text-[11px] font-700 tracking-[.14em] text-emerald-600 dark:text-emerald-400 uppercase">Punto de venta</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nueva venta</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Agrega repuestos, aceites o accesorios y confirma el pago.</p></div></div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>
            <form onSubmit={saveSale} className="p-7">
              <div className="grid lg:grid-cols-[1.35fr_.75fr] gap-7">
                <div>
                  <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm shadow-sm hover:border-[#86CCC0] transition-colors"><option value="">Seleccionar cliente</option>{CLIENTS.filter(c => c.status === 'active').map(c => <option key={c.id}>{c.name}</option>)}</select></label>
                  <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"><div><strong className="text-sm text-slate-900 dark:text-white">Productos disponibles</strong><span className="block text-xs text-slate-500 dark:text-slate-400">Define la cantidad de cada artículo</span></div></div>
                    <div className="max-h-[410px] overflow-y-auto p-2.5 space-y-2 bg-slate-50/70 dark:bg-slate-900">
                      {saleableProducts.map(p => {
                        const qty = cart[p.id] || 0;
                        return (
                          <div key={p.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${qty > 0 ? 'bg-[#86CCC0]/15 border-[#86CCC0] dark:bg-[#86CCC0]/25 dark:border-[#86CCC0]/50 shadow-sm' : 'bg-white border-slate-200/90 hover:border-[#86CCC0]/60 dark:bg-slate-900 dark:border-slate-800'}`}>
                            <div className="flex-1 min-w-0"><span className="block text-sm font-600 text-slate-900 dark:text-white truncate">{p.name}</span><span className="text-xs text-slate-500 dark:text-slate-400">{p.brand} · Stock {p.stock}</span></div>
                            <strong className="text-sm text-[#0d9488] dark:text-[#86CCC0]">{fmtMoney(p.salePrice!)}</strong>
                            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                              <button type="button" onClick={() => setQuantity(p, qty - 1)} className="px-2.5 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"><ChevronLeft size={14} /></button>
                              <span className="w-8 text-center text-sm font-600 text-slate-900 dark:text-white">{qty}</span>
                              <button type="button" onClick={() => setQuantity(p, qty + 1)} className="px-2.5 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"><ChevronRight size={14} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="sticky top-0 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-5 shadow-sm">
                    <div className="text-[11px] font-700 tracking-[.14em] text-slate-500 dark:text-white/50 uppercase">Resumen de venta</div>
                    <div className="mt-5 space-y-3 max-h-44 overflow-y-auto">
                      {cartItems.length ? cartItems.map(({ product, qty }) => <div key={product.id} className="flex justify-between gap-3 text-sm"><span className="text-slate-600 dark:text-white/70 truncate">{qty}× {product.name}</span><span className="font-600 text-slate-900 dark:text-white">{fmtMoney((product.salePrice || 0) * qty)}</span></div>) : <p className="text-sm text-slate-400 dark:text-white/45">Aún no hay productos.</p>}
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                      <div className="flex justify-between text-sm text-slate-600 dark:text-white/60"><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div>
                      <label className="flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-white/60"><span>Descuento</span><input type="number" min={0} max={subtotal} value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-24 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-right text-slate-900 dark:text-white font-600" /></label>
                      <div className="flex justify-between items-end pt-2"><span className="text-sm text-slate-600 dark:text-white/60">Total</span><strong className="font-display text-3xl text-[#0d9488] dark:text-white">{fmtMoney(total)}</strong></div>
                    </div>
                  </div>
                  <label className="block mt-5"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Método de pago</span><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option></select></label>
                </div>
              </div>
              {error && <div className="mt-5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><p className="text-xs text-slate-500 dark:text-slate-400">El stock se descontará al confirmar la operación.</p><div className="flex gap-3"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Confirmar venta</button></div></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Inventory / Purchases ───────────────────────────────────────────────

function InventorySection({ inventory, setInventory }: { inventory: Product[]; setInventory: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const emptyProduct = { name: '', category: 'part' as ProductCategory, brand: 'Generic' as BrandFilter, stock: 1, description: '', compatibility: '', salePrice: 0 };
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [purchases, setPurchases] = useState<Purchase[]>(PURCHASES);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ supplier: '', productName: '', quantity: 1, unitCost: 0, date: new Date().toISOString().slice(0, 10), invoiceNumber: '' });
  const filtered = inventory.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
  const totalStock = inventory.filter(p => p.type === 'sale').reduce((sum, p) => sum + p.stock, 0);

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setInventory(current => [{ id: `p${Date.now()}`, ...form, type: 'sale' as const, image: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Car_workshop_tools.jpg' }, ...current]);
    setForm(emptyProduct);
    setModalOpen(false);
  };

  const savePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(purchaseForm.quantity) * Number(purchaseForm.unitCost);
    setPurchases(current => [{ id: `pc${Date.now()}`, supplier: purchaseForm.supplier, product: purchaseForm.productName, quantity: Number(purchaseForm.quantity), unitCost: Number(purchaseForm.unitCost), total, date: purchaseForm.date, invoiceNumber: purchaseForm.invoiceNumber, status: 'pending' }, ...current]);
    setPurchaseForm({ supplier: '', productName: '', quantity: 1, unitCost: 0, date: new Date().toISOString().slice(0, 10), invoiceNumber: '' });
    setPurchaseModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Inventario" subtitle={`${inventory.filter(p => p.type === 'sale').length} productos · ${totalStock} unidades disponibles`} action={<AddBtn label="Nuevo Producto" onClick={() => setModalOpen(true)} />} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Unidades en stock</div><div className="font-display font-700 text-2xl text-gtext mt-1">{totalStock}</div></div>
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Productos en catálogo</div><div className="font-display font-700 text-2xl text-blue mt-1">{inventory.filter(p => p.type === 'sale').length}</div></div>
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Stock crítico</div><div className="font-display font-700 text-2xl text-warning mt-1">{inventory.filter(p => p.type === 'sale' && p.stock <= 5).length}</div></div>
      </div>
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por producto o marca..." /></div>
      <div className="bg-card rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr>{['Producto', 'Categoría', 'Marca', 'Especificación', 'Compatibilidad', 'Stock', 'Precio'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="table-row-hover border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-3 font-600 text-gtext whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-3 text-muted capitalize">{p.category === 'part' ? 'Repuesto' : p.category === 'oil' ? 'Aceite' : p.category === 'filter' ? 'Filtro' : p.category === 'battery' ? 'Batería' : p.category === 'tire' ? 'Llanta' : 'Servicio'}</td>
                  <td className="px-4 py-3"><Badge cls={p.brand.toLowerCase()}>{p.brand === 'Generic' ? 'Genérico' : p.brand}</Badge></td>
                  <td className="px-4 py-3 text-muted max-w-[260px] truncate">{p.description}</td>
                  <td className="px-4 py-3 text-muted max-w-[180px] truncate">{p.compatibility || '—'}</td>
                  <td className="px-4 py-3"><span className={`font-700 ${p.type === 'service' ? 'text-muted' : p.stock <= 5 ? 'text-danger' : 'text-success'}`}>{p.type === 'service' ? '∞' : p.stock}</span></td>
                  <td className="px-4 py-3 text-muted">{p.salePrice ? fmtMoney(p.salePrice) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SectionHeader title="Compras a Proveedores" subtitle={`${purchases.length} pedidos registrados`} action={<AddBtn label="Nueva Compra" onClick={() => setPurchaseModalOpen(true)} />} />
      <div className="bg-card rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr>{['ID', 'Proveedor', 'Producto', 'Cantidad', 'Costo Unit.', 'Total', 'Fecha', 'Factura', 'Estado'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {purchases.map(pc => (
                <tr key={pc.id} className="table-row-hover border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{pc.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{pc.supplier}</td>
                  <td className="px-4 py-3 text-muted max-w-[200px] truncate">{pc.product}</td>
                  <td className="px-4 py-3 text-muted">{pc.quantity}</td>
                  <td className="px-4 py-3 text-muted">{fmtMoney(pc.unitCost)}</td>
                  <td className="px-4 py-3 font-600 text-blue">{fmtMoney(pc.total)}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(pc.date)}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{pc.invoiceNumber}</td>
                  <td className="px-4 py-3"><Badge cls={pc.status}>{pc.status === 'received' ? 'Recibido' : pc.status === 'pending' ? 'Pendiente' : 'Devuelto'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div><div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Control de inventario</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar producto</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configura sus características comerciales y disponibilidad.</p></div><button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button></div>
            <form onSubmit={saveProduct} className="p-7 grid sm:grid-cols-2 gap-5">
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nombre comercial</span><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej. Filtro de aceite Toyota" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Categoría</span><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ProductCategory })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="part">Repuesto</option><option value="oil">Aceite</option><option value="filter">Filtro</option><option value="battery">Batería</option><option value="tire">Llanta</option><option value="service">Servicio</option></select></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Marca / Compatibilidad</span><select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value as BrandFilter })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="Generic">Genérico</option><option value="Toyota">Toyota</option><option value="Ford">Ford</option><option value="Chevrolet">Chevrolet</option></select></label>
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Descripción</span><input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Especificaciones del producto" /></label>
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Compatibilidad / Modelos</span><input value={form.compatibility} onChange={e => setForm({ ...form, compatibility: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej. Toyota Corolla 2018-2024" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Stock inicial</span><input type="number" min={0} required value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Precio de venta</span><input type="number" min={0} step={0.01} required value={form.salePrice} onChange={e => setForm({ ...form, salePrice: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Guardar producto</button></div>
            </form>
          </div>
        </div>
      )}

      {purchaseModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setPurchaseModalOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div><div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Compras</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar compra a proveedor</h3></div><button onClick={() => setPurchaseModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button></div>
            <form onSubmit={savePurchase} className="p-7 grid sm:grid-cols-2 gap-5">
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Proveedor</span><input required value={purchaseForm.supplier} onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Nombre del proveedor" /></label>
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Producto</span><input required value={purchaseForm.productName} onChange={e => setPurchaseForm({ ...purchaseForm, productName: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Descripción del lote" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cantidad</span><input type="number" min={1} required value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Costo unitario</span><input type="number" min={0} step={0.01} required value={purchaseForm.unitCost} onChange={e => setPurchaseForm({ ...purchaseForm, unitCost: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha</span><input type="date" required value={purchaseForm.date} onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nº Factura</span><input required value={purchaseForm.invoiceNumber} onChange={e => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="FAC-2024-0001" /></label>
              <div className="sm:col-span-2 flex justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-800">
                <div className="text-sm text-slate-600 dark:text-slate-300">Total estimado: <strong className="text-gtext">{fmtMoney(purchaseForm.quantity * purchaseForm.unitCost)}</strong></div>
                <div className="flex gap-3"><button type="button" onClick={() => setPurchaseModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Guardar compra</button></div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Warranties ──────────────────────────────────────────────────────────

function WarrantiesSection() {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { clientName: '', product: '', serial: '', purchaseDate: today, months: 12, type: 'store' as Warranty['type'] };
  const [warranties, setWarranties] = useState<Warranty[]>(WARRANTIES);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const expiry = new Date(`${form.purchaseDate}T12:00:00`);
  expiry.setMonth(expiry.getMonth() + Number(form.months || 0));
  const filtered = warranties.filter(w => !search || w.clientName.toLowerCase().includes(search.toLowerCase()) || w.product.toLowerCase().includes(search.toLowerCase()) || w.serial.toLowerCase().includes(search.toLowerCase()));

  const saveWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || form.product.trim().length < 3 || form.serial.trim().length < 3) { setError('Completa el cliente, producto y un serial válido.'); return; }
    if (warranties.some(w => w.serial.toLowerCase() === form.serial.trim().toLowerCase())) { setError('Este número serial ya tiene una garantía registrada.'); return; }
    setWarranties(current => [{ id: `w${Date.now()}`, clientName: form.clientName, product: form.product.trim(), serial: form.serial.trim().toUpperCase(), purchaseDate: form.purchaseDate, expiryDate: expiry.toISOString().slice(0, 10), status: 'active', type: form.type }, ...current]);
    setForm(emptyForm); setError(''); setModalOpen(false);
  };

  return (
    <div>
      <SectionHeader title="Garantías" subtitle={`${warranties.filter(w => w.status === 'active').length} activas · ${warranties.filter(w => w.status === 'expired').length} vencidas`} action={<AddBtn label="Nueva Garantía" onClick={() => setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o producto..." /></div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>{['ID', 'Cliente', 'Producto', 'Nº Serial', 'F. Compra', 'F. Vencimiento', 'Tipo', 'Estado'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{w.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{w.clientName}</td>
                  <td className="px-4 py-3 text-muted max-w-[200px] truncate">{w.product}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{w.serial}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(w.purchaseDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={new Date(w.expiryDate) < new Date() ? 'text-danger' : 'text-muted'}>{fmtDate(w.expiryDate)}</span></td>
                  <td className="px-4 py-3"><Badge cls={w.type}>{w.type === 'store' ? 'Taller' : 'Fabricante'}</Badge></td>
                  <td className="px-4 py-3"><Badge cls={w.status}>{w.status === 'active' ? 'Activa' : w.status === 'expired' ? 'Vencida' : 'Reclamada'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-[#f1efff] dark:bg-indigo-950/60 text-[#6153d6] dark:text-indigo-400 flex items-center justify-center"><Shield size={22} /></div><div><div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Protección postventa</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nueva garantía</h3></div></div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>
            <form onSubmit={saveWarranty} className="p-7 grid sm:grid-cols-2 gap-5">
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar cliente</option>{CLIENTS.map(c => <option key={c.id}>{c.name}</option>)}</select></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Producto</span><input required value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej. Batería 24F-600" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nº Serial</span><input required value={form.serial} onChange={e => setForm({ ...form, serial: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="BT-000000" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Duración (meses)</span><input type="number" min={1} required value={form.months} onChange={e => setForm({ ...form, months: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha de compra</span><DatePicker value={form.purchaseDate} onChange={val => setForm({ ...form, purchaseDate: val })} /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Tipo de garantía</span><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Warranty['type'] })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="store">Taller</option><option value="manufacturer">Fabricante</option></select></label>
              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200">Vencimiento calculado: <strong className="text-gtext">{fmtDate(expiry.toISOString().slice(0, 10))}</strong></div>
              {error && <div className="sm:col-span-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
              <div className="sm:col-span-2 flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Guardar garantía</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Contact & Location ─────────────────────────────────────────────────

function ContactLocationSection() {
  const [messages] = useState<ContactMessage[]>(CONTACT_MESSAGES);
  const [info, setInfo] = useState({
    address: 'Av. Principal del Taller, Zona Industrial Norte, Caracas 1050, Venezuela',
    phone: '+58 (412) 555-1234',
    whatsapp: '+58 (414) 999-0011',
    email: 'taller@autocenterpro.com',
    hours: 'Lunes a Sábado: 8:00 AM - 6:00 PM',
  });
  const [savedNotice, setSavedNotice] = useState(false);
  const handleSave = (e: React.FormEvent) => { e.preventDefault(); setSavedNotice(true); setTimeout(() => setSavedNotice(false), 3000); };

  return (
    <div className="space-y-8">
      <SectionHeader title="Ubicación y Contacto" subtitle="Gestión de datos públicos del taller y mensajes de clientes" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="glow-card rounded-2xl p-6 bg-card">
            <h3 className="font-display text-lg font-600 text-gtext mb-4 flex items-center gap-2"><MapPin size={18} className="text-blue" /> Ubicación en el Mapa</h3>
            <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative bg-slate-900">
              <iframe title="Mapa de Ubicación AutoCenter Pro" src="https://maps.google.com/maps?q=Caracas,Venezuela&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
            </div>
            <div className="mt-4 p-3 rounded-lg bg-surface flex items-start gap-3 text-xs text-muted">
              <Navigation size={16} className="text-blue flex-shrink-0 mt-0.5" />
              <div><strong className="text-gtext block">Punto de referencia:</strong>A 200 metros de la estación de servicio. Estacionamiento para clientes.</div>
            </div>
          </div>
          <div className="glow-card rounded-2xl p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-600 text-gtext flex items-center gap-2"><Phone size={18} className="text-purple-light" /> Datos de Contacto Público</h3>
              {savedNotice && <span className="text-xs text-success font-600">¡Guardado con éxito!</span>}
            </div>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Dirección del Taller</label><input type="text" value={info.address} onChange={e => setInfo({ ...info, address: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Teléfono</label><input type="text" value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all" /></div>
                <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label><input type="text" value={info.whatsapp} onChange={e => setInfo({ ...info, whatsapp: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label><input type="email" value={info.email} onChange={e => setInfo({ ...info, email: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all" /></div>
                <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Horario de Atención</label><input type="text" value={info.hours} onChange={e => setInfo({ ...info, hours: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all" /></div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-600 text-white bg-[#6153d6] hover:bg-[#5244be] transition-colors shadow-md">Guardar Cambios de Contacto</button>
            </form>
          </div>
        </div>
        <div className="space-y-6">
          <div className="glow-card rounded-2xl p-6 bg-card">
            <h3 className="font-display text-lg font-600 text-gtext mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-amber-500" /> Mensajes de Clientes Recibidos</h3>
            <div className="space-y-3">
              {messages.map(m => (
                <div key={m.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface flex flex-col gap-2">
                  <div className="flex items-center justify-between"><span className="font-600 text-gtext text-sm">{m.name}</span><span className={`badge ${m.status === 'unread' ? 'badge-overdue' : m.status === 'read' ? 'badge-pending' : 'badge-active'}`}>{m.status === 'unread' ? 'Nuevo' : m.status === 'read' ? 'Leído' : 'Respondido'}</span></div>
                  <div className="text-xs text-muted flex items-center gap-3"><span><Mail size={10} className="inline mr-1" />{m.email}</span><span><Phone size={10} className="inline mr-1" />{m.phone}</span><span className="ml-auto">{m.date}</span></div>
                  <div className="font-500 text-xs text-gtext mt-1">Asunto: {m.subject}</div>
                  <p className="text-xs text-muted bg-card p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700 leading-relaxed">"{m.message}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Layout ───────────────────────────────────────────────────────────────

function AdminLoginModal({ onLoginSuccess, navigateTo }: { onLoginSuccess: () => void; navigateTo: (v: View) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (username.trim().toLowerCase() === 'admin' && (password === 'admin' || password === 'admin123')) { onLoginSuccess(); } else { setError('Usuario o contraseña incorrectos. (Prueba admin / admin123)'); } };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 hero-banner dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden animate-in fade-in duration-300">
        <div className="h-2 bg-gradient-to-r from-[#6153d6] via-indigo-500 to-[#86CCC0]" />
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-100/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-sm border border-blue-200/70 dark:border-indigo-900/50"><Shield size={32} /></div>
            <h2 className="font-display text-2xl font-700 text-slate-900 dark:text-white">Acceso Administrativo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ingresa tus credenciales para acceder al panel de AutoCenter Pro</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">Usuario de Administrador</label><div className="relative"><Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" required value={username} onChange={e => { setUsername(e.target.value); setError(''); }} placeholder="admin" className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm" /></div></div>
            <div><label className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">Contraseña</label><div className="relative"><Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" required value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm" /></div></div>
            {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 font-500 animate-in fade-in">{error}</div>}
            <button type="submit" className="w-full py-3 px-4 rounded-xl bg-[#6153d6] hover:bg-[#5244be] text-white font-600 text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mt-2">Iniciar Sesión</button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 text-center">
            <button type="button" onClick={() => navigateTo('catalog')} className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-500 transition-colors inline-flex items-center gap-1.5"><Layers size={13} /> Volver al catálogo público</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminView({ navigateTo }: { navigateTo: (v: View) => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('admin_authenticated') === 'true');
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventory, setInventory] = useState<Product[]>(PRODUCTS);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(SERVICE_ORDERS);
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(VEHICLES);
  const handleLoginSuccess = () => { sessionStorage.setItem('admin_authenticated', 'true'); setIsAuthenticated(true); };
  const handleLogout = () => { sessionStorage.removeItem('admin_authenticated'); setIsAuthenticated(false); };
  if (!isAuthenticated) return <AdminLoginModal onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} />;

  const SIDEBAR_ITEMS: { key: AdminSection; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: 'Panel Principal', icon: <LayoutDashboard size={18} /> },
    { key: 'clients', label: 'Clientes', icon: <Users size={18} />, count: clients.length },
    { key: 'vehicles', label: 'Vehículos', icon: <Car size={18} />, count: vehicles.length },
    { key: 'serviceOrders', label: 'Órdenes de Servicio', icon: <Wrench size={18} />, count: serviceOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length },
    { key: 'sales', label: 'Ventas', icon: <ShoppingBag size={18} />, count: SALES.length },
    { key: 'purchases', label: 'Inventario y Compras', icon: <Package size={18} />, count: inventory.filter(p => p.type === 'sale' && p.stock <= 5).length },
    { key: 'warranties', label: 'Garantías', icon: <Shield size={18} />, count: WARRANTIES.filter(w => w.status === 'active').length },
    { key: 'contact', label: 'Ubicación y Contacto', icon: <MapPin size={18} /> },
  ];

  const SectionContent = {
    dashboard: <Dashboard inventory={inventory} serviceOrders={serviceOrders} />,
    clients: <ClientsSection clients={clients} setClients={setClients} />,
    vehicles: <VehiclesSection clients={clients} vehicles={vehicles} setVehicles={setVehicles} />,
    serviceOrders: <ServiceOrdersSection serviceOrders={serviceOrders} setServiceOrders={setServiceOrders} inventory={inventory} setInventory={setInventory} clients={clients} vehicles={vehicles} />,
    sales: <SalesSection inventory={inventory} setInventory={setInventory} />,
    purchases: <InventorySection inventory={inventory} setInventory={setInventory} />,
    warranties: <WarrantiesSection />,
    contact: <ContactLocationSection />,
  }[section];

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ overflow: 'hidden' }}>
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col flex-shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ borderRight: '1px solid #e2e8f0', top: '64px', height: 'calc(100vh - 64px)' }}>
        <nav className="flex-1 py-4 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => {
            const active = section === item.key;
            return (
              <button key={item.key} onClick={() => { setSection(item.key); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all relative ${active ? 'sidebar-item-active font-600' : 'text-muted hover:text-gtext hover:bg-[rgba(139,92,246,0.05)]'}`}>
                <span style={{ color: active ? '#a78bfa' : undefined }}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && <span className="text-[10px] font-700 px-1.5 py-0.5 rounded-full" style={{ background: active ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.15)', color: active ? '#c4b5fd' : '#7c6fa8' }}>{item.count}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[rgba(139,92,246,0.1)] flex flex-col gap-2">
          <button onClick={() => navigateTo('catalog')} className="w-full py-2.5 px-3 rounded-xl bg-[#172033] dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors text-xs font-600 flex items-center justify-center gap-1.5 shadow-sm"><Layers size={14} className="text-white" /> Volver al Catálogo</button>
          <button onClick={handleLogout} className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all text-xs font-600 flex items-center justify-center gap-1.5 shadow-sm"><LogOut size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" /> Cerrar Sesión</button>
          <div className="text-xs text-muted text-center mt-1">AutoCenter Pro v1.0</div>
          <div className="text-[10px] text-muted text-center opacity-50">Sistema de Gestión de Taller</div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-bg">
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-[rgba(139,92,246,0.1)]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-muted hover:text-gtext" style={{ background: 'rgba(139,92,246,0.08)' }}><Menu size={18} /></button>
          <span className="text-sm font-600 text-gtext">{SIDEBAR_ITEMS.find(i => i.key === section)?.label}</span>
        </div>
        <div className="p-6 lg:p-8">{SectionContent}</div>
      </main>
    </div>
  );
}

// ─── Top Navbar ───────────────────────────────────────────────────────────────

function Navbar({ navigateTo, darkMode, setDarkMode }: { navigateTo: (v: View) => void; darkMode: boolean; setDarkMode: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <header className="navbar-blur fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-6 gap-6 transition-colors duration-200">
      <div onClick={() => navigateTo('catalog')} className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#172033] dark:bg-indigo-600 shadow-md"><Car size={19} className="text-white" /></div>
        <div><div className="font-display font-700 text-gtext text-base leading-none">AutoCenter</div><div className="text-[10px] text-muted leading-none mt-0.5">Pro</div></div>
      </div>
      <div className="flex-1" />
      <div className="hidden md:flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />{SERVICE_ORDERS.filter(o => o.status === 'in_progress').length} en taller</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SERVICE_ORDERS.some(o => o.status === 'pending' && new Date(o.dueDate) < new Date()) ? '#ef4444' : '#6b7280' }} />{SERVICE_ORDERS.filter(o => o.status === 'pending' && new Date(o.dueDate) < new Date()).length} atrasadas</span>
      </div>
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 relative text-xs font-600 shadow-inner select-none">
        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#6153d6] dark:bg-indigo-600 shadow-sm transition-all duration-300 ease-out ${darkMode ? 'left-[calc(50%+2px)]' : 'left-1'}`} />
        <button type="button" onClick={() => setDarkMode(false)} className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg transition-colors duration-200 ${!darkMode ? 'text-white font-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Sun size={14} className={!darkMode ? 'text-amber-300' : ''} /> Claro</button>
        <button type="button" onClick={() => setDarkMode(true)} className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg transition-colors duration-200 ${darkMode ? 'text-white font-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Moon size={14} className={darkMode ? 'text-amber-300' : ''} /> Oscuro</button>
      </div>
    </header>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>(() => window.location.pathname.startsWith('/admin') ? 'admin' : 'catalog');
  const [darkMode, setDarkMode] = useState<boolean>(() => { const saved = localStorage.getItem('theme'); if (saved) return saved === 'dark'; return true; });
  useEffect(() => { if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); } }, [darkMode]);
  useEffect(() => { const handlePopState = () => setView(window.location.pathname.startsWith('/admin') ? 'admin' : 'catalog'); window.addEventListener('popstate', handlePopState); return () => window.removeEventListener('popstate', handlePopState); }, []);
  const navigateTo = (newView: View) => { setView(newView); const newPath = newView === 'admin' ? '/admin' : '/'; if (window.location.pathname !== newPath) window.history.pushState({}, '', newPath); };
  return (
    <div className="bg-bg min-h-screen text-gtext transition-colors duration-200">
      <Navbar navigateTo={navigateTo} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="pt-16">{view === 'catalog' ? <CatalogView /> : <AdminView navigateTo={navigateTo} />}</div>
    </div>
  );
}
