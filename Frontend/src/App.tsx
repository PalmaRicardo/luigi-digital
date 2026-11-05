import { useState, useMemo, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, Car, Settings, ShoppingBag, Wrench, Shield, Package,
  Search, Plus, Calendar, AlertTriangle, CheckCircle2, Star, Tag,
  Phone, Mail, MapPin, DollarSign, ArrowUpRight,
  Menu, X, ChevronRight, ChevronLeft, Layers, RotateCcw, Filter, Lock, LogOut,
  Sun, Moon, SlidersHorizontal, Navigation, MessageSquare, Droplets, Zap
} from 'lucide-react';
import { api } from './api';
import type {
  Product, ProductCategory, ServiceType, PaymentMethod, Vehicle, Client,
  ServiceOrder, Sale, Purchase, Warranty, ContactMessage, StoreInfo
} from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'catalog' | 'admin';
type AdminSection = 'dashboard' | 'clients' | 'vehicles' | 'serviceOrders' | 'sales' | 'purchases' | 'warranties' | 'contact';
type CatalogCategory = 'all' | 'parts' | 'oils' | 'filters' | 'batteries' | 'tires' | 'services';
type FilterType = 'all' | 'sale' | 'service';
const BUSINESS_NAME = 'Multiservicios Llanos Guaro C.A';

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
        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-black dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
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
      style={{ background: 'var(--c-primary)', boxShadow: '0 2px 6px rgba(97,83,214,0.18)' }}>
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
      <div onClick={() => setIsOpen(!isOpen)} className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer select-none transition-all hover:border-purple text-sm ${className}`}>
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
            {dayNames.map(d => <span key={d} className="text-[10px] font-700 text-purple-light uppercase py-1">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const cellStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
              const isSelected = value === cellStr;
              const isToday = todayStr === cellStr;
              return (
                <button key={idx} type="button" onClick={() => selectDate(cell.year, cell.month, cell.day)}
                  className={`h-8 w-8 text-xs font-500 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-purple text-white font-700 shadow-md shadow-purple/30 scale-105' : isToday ? 'bg-purple-soft text-purple-light font-700 border border-purple/30' : cell.isCurrentMonth ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                  {cell.day}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button type="button" onClick={setToday} className="text-purple-light font-600 hover:underline">Hoy</button>
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
const CATEGORY_ICONS: Record<CatalogCategory, React.ReactNode> = {
  all: <Layers size={15} />, parts: <Settings size={15} />, oils: <Droplets size={15} />,
  filters: <Filter size={15} />, batteries: <Zap size={15} />, tires: <Car size={15} />, services: <Wrench size={15} />
};

const CAR_MAKERS = [
  'Abarth', 'Aiways', 'Aixam', 'Alfa Romeo', 'Alpina', 'Alpine', 'Artega', 'Aston Martin', 'Audi', 'Austin',
  'BAW', 'Bentley', 'Bertone', 'BMW', 'Borgward', 'Bovensiepen', 'Brabus', 'Bugatti', 'Buick', 'BYD',
  'Cadillac', 'Caterham', 'Chevrolet', 'Chrysler', 'Citroën', 'Cupra', 'Dacia', 'Daewoo', 'Daihatsu', 'Dallara',
  'De Tomaso', 'Deepal', 'DeLorean', 'Dodge', 'Dongfeng', 'DS', 'Farizon Auto', 'FAW', 'Ferrari', 'Fest',
  'Fiat', 'Firefly', 'Fisker', 'Ford', 'Foton', 'Geely', 'Genesis', 'Gordon Murray', 'Gumpert', 'GWM Tank',
  'Hennessey', 'Honda', 'Hummer', 'Hyundai', 'Ineos', 'Infiniti', 'Isuzu', 'Iveco', 'Jaecoo', 'Jaguar',
  'Jeep', 'KGM', 'Kia', 'Koenigsegg', 'KTM', 'Lada', 'Lamborghini', 'Lancia', 'Land Rover', 'Leapmotor',
  'Lexus', 'Ligier', 'Lincoln', 'Lotus', 'Lucid', 'Luxgen', 'Lynk & Co', 'MAN', 'Marussia', 'Maserati',
  'Maxus', 'Maybach', 'Mazda', 'McLaren', 'Mercedes-AMG', 'Mercedes-Benz', 'MG', 'MG Rover', 'Mia Eléctrico', 'Microcar',
  'Mini', 'Mitsubishi', 'Mitsubishi Fuso', 'Morgan', 'Nio', 'Nissan', 'Omoda', 'Opel', 'Ora', 'Pagani',
  'Peugeot', 'PGO', 'Piaggio', 'Polaris', 'Polestar', 'Pontiac', 'Porsche', 'Praga', 'Renault', 'Rivian',
  'Rolls Royce', 'Rover', 'Saab', 'Santana', 'Seat', 'Seres', 'Skoda', 'Skyworth', 'Smart', 'Spyker',
  'SsangYong', 'SSC', 'Subaru', 'Suzuki', 'Tesla', 'Togg', 'Toyota', 'Trabant', 'TVR', 'VinFast',
  'Volkswagen', 'Volvo', 'Wiesmann', 'Xiaomi', 'XPeng', 'Zeekr', 'Zenvo'
];

const VEHICLE_YEARS = Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) => new Date().getFullYear() + 1 - i);
const SERVICE_TYPE_LABELS: Record<ServiceType, string> = { oil_change: 'Cambio de aceite', maintenance: 'Mantenimiento', repair: 'Reparación', inspection: 'Inspección', tire: 'Llantas', battery: 'Batería' };
function ProductArtwork({ product }: { product: Product }) {
  return (
    <div className="product-art relative h-56 overflow-hidden product-art-container flex items-center justify-center p-1.5">
      <div className="absolute inset-0 bg-slate-950/80 product-art-grid opacity-30 pointer-events-none" />
      {product.image ? (
        <img
          src={product.image}
          alt={`Imagen referencial de ${product.name}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 rounded-xl relative z-0"
        />
      ) : (
        <Package size={48} className="text-slate-600 relative z-0" />
      )}
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
        {(product.compatibility || product.compatYearFrom) && (
          <p className="text-[11px] text-mint">
            <Tag size={11} className="inline mr-1" />
            {[product.compatibility, product.compatYearFrom ? (product.compatYearTo && product.compatYearTo !== product.compatYearFrom ? `${product.compatYearFrom}–${product.compatYearTo}` : `${product.compatYearFrom}`) : ''].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="mt-auto pt-3 border-t border-[rgba(248,90,0,0.1)] flex flex-col gap-1">
          {product.salePrice && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted flex items-center gap-1"><Tag size={11} /> Precio</span>
              <span className="font-display font-700 text-mint" style={{ fontSize: '17px' }}>{fmtMoney(product.salePrice)}</span>
            </div>
          )}
          {product.type !== 'service' && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-muted">Stock: <span className="text-gtext font-600">{product.stock}</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<CatalogCategory>('all');
  const [filter, setFilter] = useState<FilterType>('all');
  const [brand, setBrand] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [vehBrand, setVehBrand] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehYear, setVehYear] = useState('');
  const [vehMotor, setVehMotor] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<{ brand: string; year?: number; desc: string } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [carModels, setCarModels] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch('/vehicles.json').then(r => r.json()).then(setCarModels).catch(() => {});
    api.getProducts().then(setProducts).catch(() => {});
  }, []);

  const availableModels = carModels[vehBrand] ?? [];

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach(p => { counts[p.category] = (counts[p.category] ?? 0) + 1; });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (category !== 'all' && p.category !== CAT_MAP[category]) return false;
      if (filter === 'sale' && p.type !== 'sale') return false;
      if (filter === 'service' && p.type !== 'service') return false;
      if (brand !== 'all' && p.brand !== brand) return false;
      if (vehicleFilter) {
        const brandOk = p.brand === 'Generic' || p.brand === vehicleFilter.brand || (p.compatibility ?? '').toLowerCase().includes(vehicleFilter.brand.toLowerCase());
        if (!brandOk) return false;
        if (vehicleFilter.year && (p.compatYearFrom || p.compatYearTo)) {
          if (p.compatYearFrom && vehicleFilter.year < p.compatYearFrom) return false;
          if (p.compatYearTo && vehicleFilter.year > p.compatYearTo) return false;
        }
      }
      const price = p.salePrice ?? 0;
      if (minPrice !== '' && price < Number(minPrice)) return false;
      if (maxPrice !== '' && price > Number(maxPrice)) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, category, filter, brand, search, minPrice, maxPrice, vehicleFilter]);

  const hasActiveFilters = category !== 'all' || filter !== 'all' || brand !== 'all' || search !== '' || minPrice !== '' || maxPrice !== '' || vehicleFilter !== null;
  const clearFilters = () => {
    setCategory('all'); setFilter('all'); setBrand('all'); setSearch(''); setMinPrice(''); setMaxPrice('');
    setVehBrand(''); setVehModel(''); setVehYear(''); setVehMotor(''); setVehicleFilter(null);
  };

  const applyVehicle = () => {
    if (!vehBrand) return;
    setVehicleFilter({ brand: vehBrand, year: vehYear ? Number(vehYear) : undefined, desc: [vehBrand, vehModel, vehYear, vehMotor].filter(Boolean).join(' · ') });
  };

  const selectClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white transition-shadow disabled:opacity-50 disabled:cursor-not-allowed';
  const filterLabel = 'block text-[11px] font-700 uppercase tracking-[0.12em] text-muted mb-2.5';

  return (
    <div className="min-h-screen bg-bg transition-colors duration-200">
      <div className="relative overflow-hidden bg-[#0d171d]">
        <img src="/hero-car.jpg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-[68%_center] hidden motion-reduce:block" />
        <video
          className="absolute inset-0 w-full h-full object-cover object-[68%_center] motion-reduce:hidden"
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-car.jpg"
          aria-hidden="true"
        >
          <source src="/hero-car.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/15 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
        <div className="relative w-[90%] mx-auto px-6 py-14 md:py-20 lg:py-24">
          <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-5">
              <span className="badge badge-sale">Servicio garantizado</span>
            </div>
            <h1 className="font-display font-700 text-4xl md:text-5xl lg:text-[56px] text-white leading-[1.04] mb-5 tracking-[-0.035em] [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]">
              Cuidamos tu auto como <span className="text-mint-light">mereces.</span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-lg">
              Repuestos originales, aceites de calidad y servicios de mantenimiento con diagnóstico profesional y garantía real.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <button onClick={() => setCategory(category === 'services' ? 'all' : 'services')} className={`px-5 py-3 rounded-xl text-sm font-600 transition-all duration-300 flex items-center gap-2 ${category === 'services' || category === 'all' ? 'bg-purple hover:bg-purple-dark text-white shadow-lg shadow-purple/40 scale-[1.02]' : 'bg-white/10 backdrop-blur border border-white/25 text-white hover:bg-white/20 hover:border-white/40'}`}>
                <Wrench size={16} /> Ver servicios
              </button>
              <button onClick={() => setCategory(category === 'oils' ? 'all' : 'oils')} className={`px-5 py-3 rounded-xl text-sm font-600 transition-all duration-300 flex items-center gap-2 ${category === 'oils' ? 'bg-purple hover:bg-purple-dark text-white shadow-lg shadow-purple/40 scale-[1.02]' : 'bg-white/10 backdrop-blur border border-white/25 text-white hover:bg-white/20 hover:border-white/40'}`}>
                <Droplets size={16} /> Aceites
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[90%] mx-auto px-6 py-8">
        <button onClick={() => setMobileFiltersOpen(o => !o)} className="lg:hidden w-full mb-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-card text-sm font-600 text-gtext shadow-sm">
          <SlidersHorizontal size={15} className="text-purple-light" /> Filtros y búsqueda {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-purple" />}
        </button>

        <div className="grid lg:grid-cols-[272px_minmax(0,1fr)] gap-8 items-start">
          <aside className={`space-y-5 lg:sticky lg:top-20 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="glow-card rounded-2xl bg-card overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple to-accent" />
              <div className="p-5">
                <h3 className="font-display font-600 text-gtext flex items-center gap-2"><Car size={16} className="text-mint" /> Buscar por vehículo</h3>
                <p className="text-[11px] text-muted mt-1 mb-4">Encuentra repuestos y servicios compatibles</p>
                <div className="space-y-3">
                  <div>
                    <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">Fabricante<span className="text-danger">*</span></span>
                    <select value={vehBrand} onChange={e => { setVehBrand(e.target.value); setVehModel(''); setVehYear(''); setVehMotor(''); }} className={selectClass}>
                      <option value="">Seleccionar</option>
                      {CAR_MAKERS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">Modelo</span>
                    {availableModels.length > 0 ? (
                      <select value={vehModel} onChange={e => { setVehModel(e.target.value); setVehYear(''); setVehMotor(''); }} disabled={!vehBrand} className={selectClass}>
                        <option value="">Seleccionar</option>
                        {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : (
                      <input value={vehModel} onChange={e => { setVehModel(e.target.value); setVehYear(''); setVehMotor(''); }} disabled={!vehBrand} placeholder="Ej. Corolla" className={selectClass} />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">Año</span>
                      <select value={vehYear} onChange={e => setVehYear(e.target.value)} disabled={!vehModel} className={selectClass}>
                        <option value="">Todos</option>
                        {VEHICLE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">Motor</span>
                      <input value={vehMotor} onChange={e => setVehMotor(e.target.value)} disabled={!vehYear} placeholder="Ej. 1.8L" className={selectClass} />
                    </div>
                  </div>
                </div>
                <button onClick={applyVehicle} disabled={!vehBrand} className="w-full mt-4 py-2.5 rounded-xl text-sm font-600 text-white bg-purple hover:bg-purple-dark transition-colors shadow-md shadow-purple/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  Buscar <ChevronRight size={14} />
                </button>
                {vehicleFilter && (
                  <div className="mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-purple/10 border border-purple/25 text-xs">
                    <span className="font-600 text-purple-light truncate flex items-center gap-1.5"><Car size={12} />{vehicleFilter.desc}</span>
                    <button onClick={() => setVehicleFilter(null)} className="text-muted hover:text-danger transition-colors flex-shrink-0"><X size={13} /></button>
                  </div>
                )}
              </div>
            </div>

            <div className="glow-card rounded-2xl bg-card p-5 space-y-6">
              <SearchBar value={search} onChange={setSearch} placeholder="Buscar producto..." />

              <div>
                <span className={filterLabel}>Categorías</span>
                <div className="space-y-1">
                  {(Object.keys(CATEGORY_LABELS) as CatalogCategory[]).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${category === cat ? 'bg-purple text-white shadow-sm shadow-purple/30 font-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      <span className={category === cat ? 'text-white/80' : 'text-mint'}>{CATEGORY_ICONS[cat]}</span>
                      <span className="flex-1 text-left">{CATEGORY_LABELS[cat]}</span>
                      <span className={`text-[10px] font-700 px-1.5 py-0.5 rounded-full ${category === cat ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted'}`}>{cat === 'all' ? products.length : (catCounts[CAT_MAP[cat]] ?? 0)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={filterLabel}>Tipo</span>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {(['all', 'sale', 'service'] as FilterType[]).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-500 transition-all ${filter === f ? 'bg-purple text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                      {f === 'all' ? 'Todos' : f === 'sale' ? 'Venta' : 'Servicio'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={filterLabel}>Marca del repuesto</span>
                <div className="flex flex-wrap gap-1.5">
                  {['all', ...Array.from(new Set(products.map(p => p.brand))).sort((a, b) => a === 'Generic' ? -1 : b === 'Generic' ? 1 : a.localeCompare(b))].map(b => (
                    <button key={b} onClick={() => setBrand(b)} className={`px-2.5 py-1.5 rounded-lg text-xs font-500 transition-all border ${brand === b ? 'bg-purple text-white border-purple shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple/50'}`}>
                      {b === 'all' ? 'Todas' : b === 'Generic' ? 'Genérico' : b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={filterLabel}>Rango de precio ($)</span>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Mín" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" />
                  <span className="text-slate-400">–</span>
                  <input type="number" placeholder="Máx" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" />
                </div>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-xs font-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-1.5">
                  <RotateCcw size={12} /> Limpiar todos los filtros
                </button>
              )}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}{vehicleFilter ? ` para ${vehicleFilter.desc}` : ''}</p>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-24 text-muted">
                <Settings size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg">No se encontraron productos</p>
                <p className="text-sm mt-1">Intenta ajustando los filtros o la búsqueda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin: Dashboard ─────────────────────────────────────────────────────────

function Dashboard({ inventory, serviceOrders, clients, sales }: { inventory: Product[]; serviceOrders: ServiceOrder[]; clients: Client[]; sales: Sale[] }) {
  const stats = [
    { label: 'Clientes Registrados', value: clients.length, sub: `${clients.filter(c => c.status === 'active').length} activos`, icon: <Users size={20} />, color: '#F85A00', bg: 'rgba(248,90,0,0.12)' },
    { label: 'Órdenes Activas', value: serviceOrders.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length, sub: `${serviceOrders.filter(r => r.status === 'ready').length} listas`, icon: <Wrench size={20} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
    { label: 'Ingresos del Mes', value: fmtMoney(sales.reduce((s, x) => s + x.total, 0)), sub: `${sales.length} ventas`, icon: <DollarSign size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)', isText: true },
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
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid rgba(248,90,0,0.12)' }}>
          <h3 className="font-display font-600 text-gtext mb-4 flex items-center gap-2"><Wrench size={16} className="text-purple" /> Órdenes de Servicio Recientes</h3>
          <div className="space-y-3">
            {serviceOrders.slice(0, 4).map(o => (
              <div key={o.id} className="flex items-center gap-3 py-2 border-b border-[rgba(248,90,0,0.07)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-500 text-gtext truncate">{o.vehicleDesc}</p>
                  <p className="text-xs text-muted truncate">{o.clientName} · {SERVICE_TYPE_LABELS[o.serviceType]}</p>
                </div>
                <Badge cls={o.status}>{o.status === 'pending' ? 'Pendiente' : o.status === 'in_progress' ? 'En taller' : o.status === 'ready' ? 'Listo' : 'Completada'}</Badge>
                <span className="text-sm font-600 text-mint">{fmtMoney(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid rgba(248,90,0,0.12)' }}>
          <h3 className="font-display font-600 text-gtext mb-4 flex items-center gap-2"><ShoppingBag size={16} className="text-warning" /> Ventas Recientes</h3>
          <div className="space-y-3">
            {sales.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-[rgba(248,90,0,0.07)] last:border-0">
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
  const saveClient = async (e: React.FormEvent) => {
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
    try {
      const created = await api.createClient({ name: form.name.trim(), idDoc: form.idDoc.trim().toUpperCase(), phone: form.phone.trim(), email: form.email.trim().toLowerCase(), address: form.address.trim(), status: form.status, joinDate: new Date().toISOString().slice(0, 10) });
      setClients(current => [created, ...current]);
      closeModal();
    } catch (err) {
      setErrors({ name: err instanceof Error ? err.message : 'No se pudo guardar el cliente' });
    }
  };
  const fieldClass = (field: string) => `w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow ${errors[field] ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'}`;

  return (
    <div>
      <SectionHeader title="Clientes" subtitle={`${clients.length} clientes registrados`} action={<AddBtn label="Nuevo Cliente" onClick={() => setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o documento..." /></div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(248,90,0,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(248,90,0,0.08)', borderBottom: '1px solid rgba(248,90,0,0.12)' }}>{['Cliente', 'Documento', 'Teléfono', 'Email', 'Dirección', 'Desde', 'Estado'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="table-row-hover border-b border-[rgba(248,90,0,0.06)] last:border-0">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-700 text-white flex-shrink-0" style={{ background: 'var(--c-primary)' }}>{c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div><span className="font-500 text-gtext whitespace-nowrap">{c.name}</span></div></td>
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
            <div className="h-1.5 bg-gradient-to-r from-purple to-accent" />
            <div className="flex items-start justify-between px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-purple-soft text-purple-light flex items-center justify-center"><Users size={22} /></div><div><div className="text-[11px] font-700 tracking-[0.14em] text-purple-light uppercase">Gestión de clientes</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nuevo cliente</h3></div></div>
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
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple text-white text-sm font-600 shadow-lg shadow-purple/20 hover:bg-purple-dark transition-colors">Guardar cliente</button>
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
  const saveVehicle = async (e: React.FormEvent) => {
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
    try {
      const created = await api.createVehicle({ clientId: form.clientId, plate: form.plate.trim().toUpperCase(), brand: form.brand.trim(), model: form.model.trim(), year: Number(form.year), vin: form.vin.trim(), motor: form.motor.trim() });
      setVehicles(current => [created, ...current]);
      closeModal();
    } catch (err) {
      setErrors({ plate: err instanceof Error ? err.message : 'No se pudo guardar el vehículo' });
    }
  };
  const fieldClass = (field: string) => `w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow ${errors[field] ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'}`;

  return (
    <div>
      <SectionHeader title="Vehículos" subtitle={`${vehicles.length} vehículos registrados`} action={<AddBtn label="Nuevo Vehículo" onClick={() => setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por placa, marca o modelo..." /></div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(248,90,0,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(248,90,0,0.08)', borderBottom: '1px solid rgba(248,90,0,0.12)' }}>{['Placa', 'Marca', 'Modelo', 'Año', 'VIN / Serial', 'Motor', 'Cliente'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="table-row-hover border-b border-[rgba(248,90,0,0.06)] last:border-0">
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
            <div className="h-1.5 bg-gradient-to-r from-purple to-accent" />
            <div className="flex items-start justify-between px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-purple-soft text-purple-light flex items-center justify-center"><Car size={22} /></div><div><div className="text-[11px] font-700 tracking-[0.14em] text-purple-light uppercase">Gestión de flota</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar vehículo</h3></div></div>
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
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple text-white text-sm font-600 shadow-lg shadow-purple/20 hover:bg-purple-dark transition-colors">Guardar vehículo</button>
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

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.vehicleId || !form.technician) { setErrors('Selecciona cliente, vehículo y técnico responsable.'); return; }
    const productsUsed = selectedProducts.map(p => ({ productId: p.id, name: p.name, qty: form.quantities[p.id] || 1, price: p.salePrice || 0 }));
    try {
      const created = await api.createServiceOrder({
        clientId: form.clientId, clientName: selectedClient?.name || '', vehicleId: form.vehicleId,
        vehicleDesc: `${selectedVehicle?.brand} ${selectedVehicle?.model} ${selectedVehicle?.plate}`,
        serviceType: form.serviceType, productsUsed, laborCost: Number(form.laborCost || 0), total,
        date: form.date, dueDate: form.dueDate, status: form.status, notes: form.notes.trim(), technician: form.technician,
      });
      setServiceOrders(current => [created, ...current]);
      setInventory(current => current.map(p => {
        const used = productsUsed.find(u => u.productId === p.id);
        return used ? { ...p, stock: p.stock - used.qty } : p;
      }));
      setForm({ clientId: '', vehicleId: '', serviceType: 'oil_change', productIds: [], quantities: {}, laborCost: 0, date: today, dueDate: today, notes: '', technician: '', status: 'pending' });
      setErrors('');
      setModalOpen(false);
    } catch (err) {
      setErrors(err instanceof Error ? err.message : 'No se pudo crear la orden');
    }
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
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(248,90,0,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(248,90,0,0.08)', borderBottom: '1px solid rgba(248,90,0,0.12)' }}>{['ID', 'Cliente', 'Vehículo', 'Servicio', 'Ingreso', 'Entrega', 'Total', 'Estado', 'Técnico'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="table-row-hover border-b border-[rgba(248,90,0,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{o.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{o.clientName}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{o.vehicleDesc}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{SERVICE_TYPE_LABELS[o.serviceType]}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(o.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={o.status === 'pending' && new Date(o.dueDate) < new Date() ? 'text-danger' : 'text-muted'}>{fmtDate(o.dueDate)}</span></td>
                  <td className="px-4 py-3 font-600 text-mint">{fmtMoney(o.total)}</td>
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
            <div className="h-1.5 bg-gradient-to-r from-purple to-accent" />
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-4"><div className="w-12 h-12 rounded-2xl bg-purple-soft text-mint flex items-center justify-center"><Wrench size={22} /></div><div><div className="text-[11px] font-700 tracking-[.14em] text-mint uppercase">Taller</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar orden de servicio</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Asigna vehículo, repuestos/aceite y mano de obra.</p></div></div>
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
              <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-purple text-white text-sm font-600 shadow-lg shadow-purple/20 hover:bg-purple-dark transition-colors">Crear orden de servicio</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Sales ─────────────────────────────────────────────────────────────

function SalesSection({ sales, setSales, inventory, setInventory, clients }: { sales: Sale[]; setSales: React.Dispatch<React.SetStateAction<Sale[]>>; inventory: Product[]; setInventory: React.Dispatch<React.SetStateAction<Product[]>>; clients: Client[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [clientId, setClientId] = useState('');
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
  const saveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === clientId);
    if (!client || !cartItems.length) { setError('Selecciona un cliente y agrega al menos un producto.'); return; }
    if (discount > subtotal) { setError('El descuento no puede superar el subtotal.'); return; }
    try {
      const created = await api.createSale({
        clientId, clientName: client.name, date: today, subtotal, discount: Number(discount), total,
        paymentMethod, items: cartItems.map(({ product, qty }) => ({ productId: product.id, name: product.name, qty, price: product.salePrice ?? 0 })),
      });
      setSales(current => [created, ...current]);
      setInventory(current => current.map(p => cart[p.id] ? { ...p, stock: p.stock - cart[p.id] } : p));
      setClientId(''); setCart({}); setDiscount(0); setPaymentMethod('cash'); setError(''); setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la venta');
    }
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
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(248,90,0,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(248,90,0,0.08)', borderBottom: '1px solid rgba(248,90,0,0.12)' }}>{['ID', 'Cliente', 'Productos', 'Fecha', 'Subtotal', 'Descuento', 'Total', 'Método'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="table-row-hover border-b border-[rgba(248,90,0,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{s.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{s.clientName}</td>
                  <td className="px-4 py-3 text-muted max-w-[220px]"><div className="flex flex-col gap-0.5">{s.products.map((p, i) => <span key={i} className="text-xs truncate">{p}</span>)}</div></td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(s.date)}</td>
                  <td className="px-4 py-3 text-muted">{fmtMoney(s.subtotal)}</td>
                  <td className="px-4 py-3 text-warning">{s.discount > 0 ? `-${fmtMoney(s.discount)}` : '—'}</td>
                  <td className="px-4 py-3 font-700 text-mint">{fmtMoney(s.total)}</td>
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
            <div className="h-1.5 bg-gradient-to-r from-purple to-accent" />
            <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><ShoppingBag size={22} /></div><div><div className="text-[11px] font-700 tracking-[.14em] text-emerald-600 dark:text-emerald-400 uppercase">Punto de venta</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nueva venta</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Agrega repuestos, aceites o accesorios y confirma el pago.</p></div></div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>
            <form onSubmit={saveSale} className="p-7">
              <div className="grid lg:grid-cols-[1.35fr_.75fr] gap-7">
                <div>
                  <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm shadow-sm hover:border-[#86CCC0] transition-colors"><option value="">Seleccionar cliente</option>{clients.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
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
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><p className="text-xs text-slate-500 dark:text-slate-400">El stock se descontará al confirmar la operación.</p><div className="flex gap-3"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-purple text-white text-sm font-600 shadow-lg shadow-purple/20 hover:bg-purple-dark transition-colors">Confirmar venta</button></div></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Inventory / Purchases ───────────────────────────────────────────────

function InventorySection({ inventory, setInventory, purchases, setPurchases }: { inventory: Product[]; setInventory: React.Dispatch<React.SetStateAction<Product[]>>; purchases: Purchase[]; setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>> }) {
  const emptyProduct = { name: '', category: 'part' as ProductCategory, brand: 'Generic', stock: 1, description: '', compatibility: '', salePrice: 0, yearFrom: '', yearTo: '' };
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ supplier: '', productName: '', quantity: 1, unitCost: 0, date: new Date().toISOString().slice(0, 10), invoiceNumber: '' });
  const filtered = inventory.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
  const totalStock = inventory.filter(p => p.type === 'sale').reduce((sum, p) => sum + p.stock, 0);

  const closeProductModal = () => { setModalOpen(false); setForm(emptyProduct); setImageFile(null); setImagePreview(''); setFormError(''); };

  const pickImage = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const image = imageFile
        ? await api.uploadImage(imageFile)
        : 'https://upload.wikimedia.org/wikipedia/commons/3/34/Car_workshop_tools.jpg';
      const yearFrom = form.yearFrom ? Number(form.yearFrom) : undefined;
      const yearTo = form.yearTo ? Number(form.yearTo) : yearFrom;
      const created = await api.createProduct({ ...form, type: 'sale', image, compatYearFrom: yearFrom, compatYearTo: yearTo });
      setInventory(current => [created, ...current]);
      closeProductModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el producto');
    }
  };

  const savePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(purchaseForm.quantity) * Number(purchaseForm.unitCost);
    try {
      const created = await api.createPurchase({ supplier: purchaseForm.supplier, product: purchaseForm.productName, quantity: Number(purchaseForm.quantity), unitCost: Number(purchaseForm.unitCost), total, date: purchaseForm.date, invoiceNumber: purchaseForm.invoiceNumber, status: 'pending' });
      setPurchases(current => [created, ...current]);
      setPurchaseForm({ supplier: '', productName: '', quantity: 1, unitCost: 0, date: new Date().toISOString().slice(0, 10), invoiceNumber: '' });
      setPurchaseModalOpen(false);
    } catch { /* keep modal open on failure */ }
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Inventario" subtitle={`${inventory.filter(p => p.type === 'sale').length} productos · ${totalStock} unidades disponibles`} action={<AddBtn label="Nuevo Producto" onClick={() => setModalOpen(true)} />} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Unidades en stock</div><div className="font-display font-700 text-2xl text-gtext mt-1">{totalStock}</div></div>
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Productos en catálogo</div><div className="font-display font-700 text-2xl text-mint mt-1">{inventory.filter(p => p.type === 'sale').length}</div></div>
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
                  <td className="px-4 py-3 text-muted max-w-[180px] truncate">{[p.compatibility, p.compatYearFrom ? (p.compatYearTo && p.compatYearTo !== p.compatYearFrom ? `${p.compatYearFrom}–${p.compatYearTo}` : `${p.compatYearFrom}`) : ''].filter(Boolean).join(' · ') || '—'}</td>
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
                  <td className="px-4 py-3 font-600 text-mint">{fmtMoney(pc.total)}</td>
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
          <button className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={closeProductModal} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-purple to-accent" />
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div><div className="text-[11px] font-700 tracking-[.14em] text-purple-light uppercase">Control de inventario</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar producto</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configura sus características comerciales y disponibilidad.</p></div><button onClick={closeProductModal} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button></div>
            <form onSubmit={saveProduct} className="p-7 grid sm:grid-cols-2 gap-5">
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nombre comercial</span><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej. Filtro de aceite Toyota" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Categoría</span><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ProductCategory })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="part">Repuesto</option><option value="oil">Aceite</option><option value="filter">Filtro</option><option value="battery">Batería</option><option value="tire">Llanta</option><option value="service">Servicio</option></select></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Marca / Compatibilidad</span><select value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="Generic">Genérico (universal)</option>{CAR_MAKERS.map(b => <option key={b} value={b}>{b}</option>)}</select></label>
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Descripción</span><input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Especificaciones del producto" /></label>
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Compatibilidad / Modelos</span><input value={form.compatibility} onChange={e => setForm({ ...form, compatibility: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej. Corolla, Yaris, RAV4" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Compatible desde el año</span><select value={form.yearFrom} onChange={e => setForm({ ...form, yearFrom: e.target.value, yearTo: form.yearTo && Number(form.yearTo) < Number(e.target.value) ? '' : form.yearTo })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="">Cualquiera</option>{VEHICLE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Hasta el año</span><select value={form.yearTo} onChange={e => setForm({ ...form, yearTo: e.target.value })} disabled={!form.yearFrom} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"><option value="">{form.yearFrom ? `Solo ${form.yearFrom}` : 'Cualquiera'}</option>{VEHICLE_YEARS.filter(y => y >= Number(form.yearFrom || 0)).map(y => <option key={y} value={y}>{y}</option>)}</select></label>
              <div className="sm:col-span-2">
                <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Foto del producto</span>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:border-purple/50 hover:text-purple-light transition-colors">
                    <Package size={16} /> {imageFile ? imageFile.name : 'Subir imagen (png, jpg, webp — máx. 5 MB)'}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={e => pickImage(e.target.files?.[0] ?? null)} />
                  </label>
                  {imagePreview && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                      <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => pickImage(null)} className="absolute top-0.5 right-0.5 p-0.5 rounded-md bg-slate-900/70 text-white"><X size={11} /></button>
                    </div>
                  )}
                </div>
              </div>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Stock inicial</span><input type="number" min={0} required value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Precio de venta</span><input type="number" min={0} step={0.01} required value={form.salePrice} onChange={e => setForm({ ...form, salePrice: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              {formError && <div className="sm:col-span-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{formError}</div>}
              <div className="sm:col-span-2 flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={closeProductModal} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-purple text-white text-sm font-600 shadow-lg shadow-purple/20 hover:bg-purple-dark transition-colors">Guardar producto</button></div>
            </form>
          </div>
        </div>
      )}

      {purchaseModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setPurchaseModalOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-purple to-accent" />
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div><div className="text-[11px] font-700 tracking-[.14em] text-purple-light uppercase">Compras</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar compra a proveedor</h3></div><button onClick={() => setPurchaseModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button></div>
            <form onSubmit={savePurchase} className="p-7 grid sm:grid-cols-2 gap-5">
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Proveedor</span><input required value={purchaseForm.supplier} onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Nombre del proveedor" /></label>
              <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Producto</span><input required value={purchaseForm.productName} onChange={e => setPurchaseForm({ ...purchaseForm, productName: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Descripción del lote" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cantidad</span><input type="number" min={1} required value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Costo unitario</span><input type="number" min={0} step={0.01} required value={purchaseForm.unitCost} onChange={e => setPurchaseForm({ ...purchaseForm, unitCost: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha</span><input type="date" required value={purchaseForm.date} onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nº Factura</span><input required value={purchaseForm.invoiceNumber} onChange={e => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="FAC-2024-0001" /></label>
              <div className="sm:col-span-2 flex justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-800">
                <div className="text-sm text-slate-600 dark:text-slate-300">Total estimado: <strong className="text-gtext">{fmtMoney(purchaseForm.quantity * purchaseForm.unitCost)}</strong></div>
                <div className="flex gap-3"><button type="button" onClick={() => setPurchaseModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-purple text-white text-sm font-600 shadow-lg shadow-purple/20 hover:bg-purple-dark transition-colors">Guardar compra</button></div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Warranties ──────────────────────────────────────────────────────────

function WarrantiesSection({ warranties, setWarranties, clients }: { warranties: Warranty[]; setWarranties: React.Dispatch<React.SetStateAction<Warranty[]>>; clients: Client[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { clientId: '', product: '', serial: '', purchaseDate: today, months: 12, type: 'store' as Warranty['type'] };
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const expiry = new Date(`${form.purchaseDate}T12:00:00`);
  expiry.setMonth(expiry.getMonth() + Number(form.months || 0));
  const filtered = warranties.filter(w => !search || w.clientName.toLowerCase().includes(search.toLowerCase()) || w.product.toLowerCase().includes(search.toLowerCase()) || w.serial.toLowerCase().includes(search.toLowerCase()));

  const saveWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === form.clientId);
    if (!client || form.product.trim().length < 3 || form.serial.trim().length < 3) { setError('Completa el cliente, producto y un serial válido.'); return; }
    if (warranties.some(w => w.serial.toLowerCase() === form.serial.trim().toLowerCase())) { setError('Este número serial ya tiene una garantía registrada.'); return; }
    try {
      const created = await api.createWarranty({ clientId: form.clientId, clientName: client.name, product: form.product.trim(), serial: form.serial.trim().toUpperCase(), purchaseDate: form.purchaseDate, expiryDate: expiry.toISOString().slice(0, 10), type: form.type });
      setWarranties(current => [created, ...current]);
      setForm(emptyForm); setError(''); setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la garantía');
    }
  };

  return (
    <div>
      <SectionHeader title="Garantías" subtitle={`${warranties.filter(w => w.status === 'active').length} activas · ${warranties.filter(w => w.status === 'expired').length} vencidas`} action={<AddBtn label="Nueva Garantía" onClick={() => setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o producto..." /></div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(248,90,0,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(248,90,0,0.08)', borderBottom: '1px solid rgba(248,90,0,0.12)' }}>{['ID', 'Cliente', 'Producto', 'Nº Serial', 'F. Compra', 'F. Vencimiento', 'Tipo', 'Estado'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} className="table-row-hover border-b border-[rgba(248,90,0,0.06)] last:border-0">
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
            <div className="h-1.5 bg-gradient-to-r from-purple to-accent" />
            <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-purple-soft text-purple-light flex items-center justify-center"><Shield size={22} /></div><div><div className="text-[11px] font-700 tracking-[.14em] text-purple-light uppercase">Protección postventa</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nueva garantía</h3></div></div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>
            <form onSubmit={saveWarranty} className="p-7 grid sm:grid-cols-2 gap-5">
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar cliente</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Producto</span><input required value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej. Batería 24F-600" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nº Serial</span><input required value={form.serial} onChange={e => setForm({ ...form, serial: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="BT-000000" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Duración (meses)</span><input type="number" min={1} required value={form.months} onChange={e => setForm({ ...form, months: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha de compra</span><DatePicker value={form.purchaseDate} onChange={val => setForm({ ...form, purchaseDate: val })} /></label>
              <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Tipo de garantía</span><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Warranty['type'] })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="store">Taller</option><option value="manufacturer">Fabricante</option></select></label>
              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200">Vencimiento calculado: <strong className="text-gtext">{fmtDate(expiry.toISOString().slice(0, 10))}</strong></div>
              {error && <div className="sm:col-span-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
              <div className="sm:col-span-2 flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-purple text-white text-sm font-600 shadow-lg shadow-purple/20 hover:bg-purple-dark transition-colors">Guardar garantía</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Contact & Location ─────────────────────────────────────────────────

function ContactLocationSection({ messages, storeInfo, onSaveStoreInfo }: { messages: ContactMessage[]; storeInfo: StoreInfo | null; onSaveStoreInfo: (info: StoreInfo) => Promise<void> }) {
  const [info, setInfo] = useState<StoreInfo>(storeInfo ?? { address: '', phone: '', whatsapp: '', email: '', hours: '' });
  useEffect(() => { if (storeInfo) setInfo(storeInfo); }, [storeInfo]);
  const [savedNotice, setSavedNotice] = useState(false);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSaveStoreInfo(info);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch { /* save failed */ }
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Ubicación y Contacto" subtitle="Gestión de datos públicos del taller y mensajes de clientes" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="glow-card rounded-2xl p-6 bg-card">
            <h3 className="font-display text-lg font-600 text-gtext mb-4 flex items-center gap-2"><MapPin size={18} className="text-mint" /> Ubicación en el Mapa</h3>
            <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative bg-slate-900">
              <iframe title={`Mapa de Ubicación ${BUSINESS_NAME}`} src="https://maps.google.com/maps?q=Caracas,Venezuela&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
            </div>
            <div className="mt-4 p-3 rounded-lg bg-surface flex items-start gap-3 text-xs text-muted">
              <Navigation size={16} className="text-mint flex-shrink-0 mt-0.5" />
              <div><strong className="text-gtext block">Punto de referencia:</strong>A 200 metros de la estación de servicio. Estacionamiento para clientes.</div>
            </div>
          </div>
          <div className="glow-card rounded-2xl p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-600 text-gtext flex items-center gap-2"><Phone size={18} className="text-purple-light" /> Datos de Contacto Público</h3>
              {savedNotice && <span className="text-xs text-success font-600">¡Guardado con éxito!</span>}
            </div>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Dirección del Taller</label><input type="text" value={info.address} onChange={e => setInfo({ ...info, address: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Teléfono</label><input type="text" value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" /></div>
                <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label><input type="text" value={info.whatsapp} onChange={e => setInfo({ ...info, whatsapp: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label><input type="email" value={info.email} onChange={e => setInfo({ ...info, email: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" /></div>
                <div><label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Horario de Atención</label><input type="text" value={info.hours} onChange={e => setInfo({ ...info, hours: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" /></div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-600 text-white bg-purple hover:bg-purple-dark transition-colors shadow-md">Guardar Cambios de Contacto</button>
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
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await api.login(username.trim().toLowerCase(), password);
      sessionStorage.setItem('admin_token', token);
      onLoginSuccess();
    } catch {
      setError('Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 hero-banner dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden animate-in fade-in duration-300">
        <div className="h-2 bg-gradient-to-r from-purple via-purple-light to-accent" />
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-soft text-purple-light mx-auto flex items-center justify-center mb-4 shadow-sm border border-purple/25 dark:border-purple/30"><Shield size={32} /></div>
            <h2 className="font-display text-2xl font-700 text-slate-900 dark:text-white">Acceso Administrativo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ingresa tus credenciales para acceder al panel de {BUSINESS_NAME}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">Usuario de Administrador</label><div className="relative"><Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" required value={username} onChange={e => { setUsername(e.target.value); setError(''); }} placeholder="admin" className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple shadow-sm" /></div></div>
            <div><label className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">Contraseña</label><div className="relative"><Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" required value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple shadow-sm" /></div></div>
            {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 font-500 animate-in fade-in">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 px-4 rounded-xl bg-purple hover:bg-purple-dark text-white font-600 text-sm shadow-lg shadow-purple/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60">{loading ? 'Verificando…' : 'Iniciar Sesión'}</button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 text-center">
            <button type="button" onClick={() => navigateTo('catalog')} className="text-xs text-slate-500 dark:text-slate-400 hover:text-purple-light font-500 transition-colors inline-flex items-center gap-1.5"><Layers size={13} /> Volver al catálogo público</button>
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const handleLoginSuccess = () => { sessionStorage.setItem('admin_authenticated', 'true'); setIsAuthenticated(true); };
  const handleLogout = () => { sessionStorage.removeItem('admin_authenticated'); sessionStorage.removeItem('admin_token'); setIsAuthenticated(false); };

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setLoadError('');
    Promise.all([
      api.getProducts(), api.getClients(), api.getVehicles(), api.getServiceOrders(),
      api.getSales(), api.getPurchases(), api.getWarranties(), api.getMessages(), api.getStoreInfo(),
    ]).then(([products, clients, vehicles, orders, sales, purchases, warranties, messages, info]) => {
      setInventory(products);
      setClients(clients);
      setVehicles(vehicles);
      setServiceOrders(orders);
      setSales(sales);
      setPurchases(purchases);
      setWarranties(warranties);
      setMessages(messages);
      setStoreInfo(info);
    }).catch(() => setLoadError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en https://apimechanic.enigmastudioss.com'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleSaveStoreInfo = async (info: StoreInfo) => {
    const saved = await api.updateStoreInfo(info);
    setStoreInfo(saved);
  };

  if (!isAuthenticated) return <AdminLoginModal onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} />;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-muted text-sm">
        Cargando datos del taller…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <AlertTriangle size={32} className="mx-auto text-warning" />
          <p className="text-sm text-gtext font-600">{loadError}</p>
          <button onClick={() => { setIsAuthenticated(false); setIsAuthenticated(true); }} className="px-4 py-2 rounded-xl bg-purple text-white text-sm font-600 hover:bg-purple-dark transition-colors">Reintentar</button>
        </div>
      </div>
    );
  }

  const SIDEBAR_ITEMS: { key: AdminSection; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: 'Panel Principal', icon: <LayoutDashboard size={18} /> },
    { key: 'clients', label: 'Clientes', icon: <Users size={18} />, count: clients.length },
    { key: 'vehicles', label: 'Vehículos', icon: <Car size={18} />, count: vehicles.length },
    { key: 'serviceOrders', label: 'Órdenes de Servicio', icon: <Wrench size={18} />, count: serviceOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length },
    { key: 'sales', label: 'Ventas', icon: <ShoppingBag size={18} />, count: sales.length },
    { key: 'purchases', label: 'Inventario y Compras', icon: <Package size={18} />, count: inventory.filter(p => p.type === 'sale' && p.stock <= 5).length },
    { key: 'warranties', label: 'Garantías', icon: <Shield size={18} />, count: warranties.filter(w => w.status === 'active').length },
    { key: 'contact', label: 'Ubicación y Contacto', icon: <MapPin size={18} /> },
  ];

  const SectionContent = {
    dashboard: <Dashboard inventory={inventory} serviceOrders={serviceOrders} clients={clients} sales={sales} />,
    clients: <ClientsSection clients={clients} setClients={setClients} />,
    vehicles: <VehiclesSection clients={clients} vehicles={vehicles} setVehicles={setVehicles} />,
    serviceOrders: <ServiceOrdersSection serviceOrders={serviceOrders} setServiceOrders={setServiceOrders} inventory={inventory} setInventory={setInventory} clients={clients} vehicles={vehicles} />,
    sales: <SalesSection sales={sales} setSales={setSales} inventory={inventory} setInventory={setInventory} clients={clients} />,
    purchases: <InventorySection inventory={inventory} setInventory={setInventory} purchases={purchases} setPurchases={setPurchases} />,
    warranties: <WarrantiesSection warranties={warranties} setWarranties={setWarranties} clients={clients} />,
    contact: <ContactLocationSection messages={messages} storeInfo={storeInfo} onSaveStoreInfo={handleSaveStoreInfo} />,
  }[section];

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ overflow: 'hidden' }}>
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col flex-shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ borderRight: '1px solid #e2e8f0', top: '64px', height: 'calc(100vh - 64px)' }}>
        <nav className="flex-1 py-4 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => {
            const active = section === item.key;
            return (
              <button key={item.key} onClick={() => { setSection(item.key); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all relative ${active ? 'sidebar-item-active font-600' : 'text-muted hover:text-gtext hover:bg-[rgba(248,90,0,0.05)]'}`}>
                <span style={{ color: active ? '#FFA15C' : undefined }}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && <span className="text-[10px] font-700 px-1.5 py-0.5 rounded-full" style={{ background: active ? 'rgba(248,90,0,0.3)' : 'rgba(248,90,0,0.15)', color: active ? '#FFB380' : '#B5795A' }}>{item.count}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[rgba(248,90,0,0.1)] flex flex-col gap-2">
          <button onClick={() => navigateTo('catalog')} className="w-full py-2.5 px-3 rounded-xl bg-[#172033] dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors text-xs font-600 flex items-center justify-center gap-1.5 shadow-sm"><Layers size={14} className="text-white" /> Volver al Catálogo</button>
          <button onClick={handleLogout} className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all text-xs font-600 flex items-center justify-center gap-1.5 shadow-sm"><LogOut size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" /> Cerrar Sesión</button>
          <div className="text-xs text-muted text-center mt-1">{BUSINESS_NAME} v1.0</div>
          <div className="text-[10px] text-muted text-center opacity-50">Sistema de Gestión de Taller</div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-bg">
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-[rgba(248,90,0,0.1)]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-muted hover:text-gtext" style={{ background: 'rgba(248,90,0,0.08)' }}><Menu size={18} /></button>
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
      <button type="button" onClick={() => navigateTo('catalog')} className="flex items-center gap-2.5 min-w-0 group">
        <span className="w-9 h-9 rounded-xl bg-purple text-white flex items-center justify-center shadow-md shadow-purple/30 group-hover:bg-purple-dark transition-colors flex-shrink-0"><Wrench size={17} /></span>
        <span className="font-display font-700 text-gtext text-sm sm:text-base leading-tight truncate">{BUSINESS_NAME}</span>
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => setDarkMode(d => !d)}
        aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        className="relative w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-300 flex items-center justify-center shadow-sm hover:border-purple/50 hover:text-purple dark:hover:text-amber-200 transition-all duration-200 overflow-hidden"
      >
        <Sun size={16} className={`absolute transition-all duration-300 ${darkMode ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'}`} />
        <Moon size={16} className={`absolute transition-all duration-300 ${darkMode ? '-rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
      </button>
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
