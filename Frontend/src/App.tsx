import { useState, useMemo, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, Gamepad2, ShoppingBag, Truck, Wrench, Shield, Package,
  Search, Plus, TrendingUp, Clock, AlertTriangle, CheckCircle2, Star, Tag,
  Phone, Mail, MapPin, Hash, DollarSign, ArrowUpRight, CreditCard,
  Menu, X, ChevronRight, ChevronLeft, Layers, RotateCcw, Clipboard, Monitor, Headphones, Gift, Disc3,
  Sun, Moon, SlidersHorizontal, Send, Navigation, MessageSquare, Filter, Lock, LogOut, Edit3, Trash2, Eye, EyeOff, FileDown, Upload, CheckCircle
} from 'lucide-react';
import { confirmAction, alertError, alertSuccess, toast } from './alerts';
import { api, useApiData, mapClient, mapRental, mapDelivery, mapTechService, mapWarranty, mapProduct } from './api';


// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'catalog' | 'admin';
type AdminSection = 'dashboard' | 'clients' | 'rentals' | 'sales' | 'deliveries' | 'technical' | 'warranties' | 'purchases' | 'contact';
type CatalogCategory = 'all' | 'consoles' | 'accessories' | 'games' | 'cards';
type FilterType = 'all' | 'sale' | 'rental';
type BrandFilter = 'all' | 'PS5' | 'PS4' | 'Xbox';

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


interface Product {
  id: string;
  name: string;
  category: 'console' | 'accessory' | 'game' | 'card';
  brand: 'PS5' | 'PS4' | 'Xbox' | 'Multi';
  salePrice?: number;
  rentalPrice?: number;
  type: 'sale' | 'rental' | 'both';
  image: string;
  stock: number;
  description: string;
  featured?: boolean;
  active?: boolean;
  offerPrice?: number;
}

interface Client {
  id: string; name: string; phone: string; email: string;
  cedula: string; address: string; joinDate: string; status: 'active' | 'inactive';
}

interface Rental {
  id: string; clientName: string; product: string;
  startDate: string; dueDate: string; returnDate?: string;
  dailyRate: number; totalDays: number; amount: number;
  status: 'active' | 'returned' | 'overdue'; deposit: number;
}

interface Sale {
  id: string; clientName: string; products: string[];
  items?: { product_id?: number | null; product_name: string; qty: number; price: number }[];
  date: string; subtotal: number; discount: number; total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
}

interface DeliveryNote {
  id: string; clientName: string; date: string; items: string[];
  shippingType: 'local' | 'national';
  address?: string; state?: string; agency?: string; officeCode?: string;
  status: 'pending' | 'delivered' | 'failed'; notes: string;
}

interface TechService {
  id: string; clientName: string; device: string; issue: string;
  receiveDate: string; estimatedDate: string; returnDate?: string;
  technician: string; cost: number;
  status: 'received' | 'diagnosing' | 'repairing' | 'ready' | 'delivered'; notes: string;
}

interface Warranty {
  id: string; clientName: string; product: string; serial: string;
  purchaseDate: string; expiryDate: string;
  status: 'active' | 'expired' | 'claimed'; type: 'store' | 'manufacturer';
}

// ─── Data: all entities come from the API (PostgreSQL backend) ────────────────

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

  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [value]);

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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const totalDaysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        month: viewMonth - 1,
        year: viewMonth === 0 ? viewYear - 1 : viewYear,
        isCurrentMonth: false
      });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true
      });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        month: viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
        isCurrentMonth: false
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(v => v - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(v => v + 1);
    }
  };

  const selectDate = (y: number, m: number, d: number) => {
    const realDate = new Date(y, m, d);
    const yStr = realDate.getFullYear();
    const mStr = String(realDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(realDate.getDate()).padStart(2, '0');
    const formatted = `${yStr}-${mStr}-${dStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const setToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    selectDate(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const formatDisplay = (val: string) => {
    if (!val) return '';
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  };

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer select-none transition-all hover:border-indigo-400 dark:hover:border-indigo-500 text-sm ${className}`}
      >
        <span className={value ? 'font-500' : 'text-slate-400 dark:text-slate-500'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Clock size={16} className="text-slate-400 dark:text-slate-400 flex-shrink-0 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] top-full left-0 mt-2 w-72 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-display font-700 text-sm capitalize">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayNames.map(d => (
              <span key={d} className="text-[10px] font-700 text-indigo-600 dark:text-indigo-400 uppercase py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const cellDateObj = new Date(cell.year, cell.month, cell.day);
              const cellStr = `${cellDateObj.getFullYear()}-${String(cellDateObj.getMonth() + 1).padStart(2, '0')}-${String(cellDateObj.getDate()).padStart(2, '0')}`;
              const isSelected = value === cellStr;
              const isToday = todayStr === cellStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDate(cell.year, cell.month, cell.day)}
                  className={`h-8 w-8 text-xs font-500 rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#6153d6] text-white font-700 shadow-md shadow-indigo-500/30 scale-105'
                      : isToday
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-700 border border-indigo-200 dark:border-indigo-800'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={setToday}
              className="text-indigo-600 dark:text-indigo-400 font-600 hover:underline"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Catalog View ─────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todos', consoles: 'Consolas', accessories: 'Accesorios', games: 'Juegos', cards: 'Tarjetas'
};

const CAT_MAP: Record<string, string> = { consoles: 'console', accessories: 'accessory', games: 'game', cards: 'card' };

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Layers size={15} />, consoles: <Gamepad2 size={15} />, accessories: <Headphones size={15} />,
  games: <Disc3 size={15} />, cards: <CreditCard size={15} />,
};

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name';

const priceOf = (p: Product) => {
  const offer = p.offerPrice && p.salePrice && p.offerPrice < p.salePrice ? p.offerPrice : undefined;
  return offer ?? p.salePrice ?? p.rentalPrice;
};

const WHATSAPP_NUMBER = '584124010740';

const waConsultLink = (p: Product) => {
  const productUrl = `${window.location.origin}/?producto=${p.id}`;
  const text = `Hola, me interesa el producto "${p.name}". ¿Podrían darme más información?\n${productUrl}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
};

function ProductCard({ product }: { product: Product }) {
  const hasOffer = product.offerPrice !== undefined && product.salePrice !== undefined && product.offerPrice > 0 && product.offerPrice < product.salePrice;
  const discount = hasOffer ? Math.round((1 - product.offerPrice! / product.salePrice!) * 100) : 0;
  const effectiveSalePrice = hasOffer ? product.offerPrice! : product.salePrice;
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 2;
  const catLabel = { console: 'Consola', accessory: 'Accesorio', game: 'Juego', card: 'Tarjeta digital' }[product.category];

  return (
    <article className="shop-card group">
      <div className="shop-card-media">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><Gamepad2 size={56} /></div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {discount > 0 && <span className="shop-pill bg-rose-600 text-white">-{discount}%</span>}
          {product.featured && !discount && <span className="shop-pill bg-amber-400 text-amber-950"><Star size={10} fill="currentColor" /> Top</span>}
          {product.category === 'card' && <span className="shop-pill card-pill">Digital</span>}
        </div>
        <span className="absolute top-3 right-3 shop-pill card-pill">{product.brand}</span>
        {outOfStock && (
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center">
            <span className="shop-pill bg-white text-slate-900 text-xs">Agotado</span>
          </div>
        )}
        <div className="shop-card-cta">
<<<<<<< HEAD
          <a href={waConsultLink(product)} target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur text-slate-900 dark:text-white text-xs font-700 hover:bg-white dark:hover:bg-slate-700 dark:hover:text-white transition-colors">
=======
          <a href={`https://wa.me/?text=${encodeURIComponent(`Hola, me interesa: ${product.name}`)}`} target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl card-cta-btn backdrop-blur text-xs font-700">
>>>>>>> 827bb78 (cambios 23/10)
            <MessageSquare size={14} /> Consultar
          </a>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-700 uppercase tracking-[0.14em] text-muted">{catLabel}</span>
          <span className="text-[10px] font-600 text-muted">
            {product.type === 'both' ? 'Venta · Alquiler' : product.type === 'sale' ? 'Venta' : 'Alquiler'}
          </span>
        </div>
        <h3 className="font-display font-600 text-gtext text-[15px] leading-snug line-clamp-2 min-h-[2.6em]">{product.name}</h3>

        <div className="mt-auto pt-3">
          {effectiveSalePrice ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display font-700 text-[22px] text-gtext">{fmtMoney(effectiveSalePrice)}</span>
              {hasOffer && <span className="text-xs text-muted line-through">{fmtMoney(product.salePrice!)}</span>}
            </div>
          ) : !product.rentalPrice ? (
            <span className="font-display font-600 text-base text-gtext">Consultar precio</span>
          ) : null}
          {product.rentalPrice ? (
            <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
              <Clock size={11} /> Alquiler <strong className="text-gtext">{fmtMoney(product.rentalPrice)}</strong>/mes
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-600">
            <span className={`w-1.5 h-1.5 rounded-full ${outOfStock ? 'bg-rose-500' : lowStock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className={outOfStock ? 'text-rose-500' : lowStock ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}>
              {outOfStock ? 'Sin stock' : lowStock ? `Últimas ${product.stock} unidades` : 'En stock'}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-[var(--c-border)] last:border-0">
      <h4 className="text-[11px] font-700 uppercase tracking-[0.14em] text-muted mb-3">{title}</h4>
      {children}
    </div>
  );
}

function FilterOption({ active, onClick, label, count, icon }: { active: boolean; onClick: () => void; label: string; count?: number; icon?: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-[#6153d6] text-white font-600 shadow-sm shadow-[#6153d6]/30' : 'text-gtext hover:bg-[var(--c-row-hover)]'}`}>
      {icon && <span className={active ? 'text-white' : 'text-muted'}>{icon}</span>}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && <span className={`text-[11px] font-600 ${active ? 'text-white/80' : 'text-muted'}`}>{count}</span>}
    </button>
  );
}

function CatalogView() {
  const [category, setCategory] = useState<CatalogCategory>('all');
  const [filter, setFilter] = useState<FilterType>('all');
  const [brand, setBrand] = useState<BrandFilter>('all');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('featured');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [products] = useApiData<Product[]>(api.products.list, []);

  const visible = useMemo(() => products.filter(p => p.active !== false), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = visible.filter(p => {
      if (category !== 'all' && p.category !== CAT_MAP[category]) return false;
      if (filter === 'sale' && p.type === 'rental') return false;
      if (filter === 'rental' && p.type === 'sale') return false;
      if (brand !== 'all' && p.brand !== brand) return false;
      if (inStockOnly && p.stock <= 0) return false;
      const price = priceOf(p) ?? 0;
      if (minPrice !== '' && price < Number(minPrice)) return false;
      if (maxPrice !== '' && price > Number(maxPrice)) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => (priceOf(a) ?? Infinity) - (priceOf(b) ?? Infinity));
    if (sort === 'price-desc') sorted.sort((a, b) => (priceOf(b) ?? -1) - (priceOf(a) ?? -1));
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'featured') sorted.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return sorted;
  }, [visible, category, filter, brand, search, minPrice, maxPrice, inStockOnly, sort]);

  const countFor = (cat: CatalogCategory) => cat === 'all' ? visible.length : visible.filter(p => p.category === CAT_MAP[cat]).length;
  const hasActiveFilters = category !== 'all' || filter !== 'all' || brand !== 'all' || search !== '' || minPrice !== '' || maxPrice !== '' || inStockOnly;

  const clearFilters = () => {
    setCategory('all'); setFilter('all'); setBrand('all'); setSearch('');
    setMinPrice(''); setMaxPrice(''); setInStockOnly(false);
  };

  const filterPanel = (
    <div>
      <div className="pb-5 border-b border-[var(--c-border)]">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar producto..." />
      </div>
      <FilterGroup title="Categorías">
        <div className="space-y-1">
          {(Object.keys(CATEGORY_LABELS) as CatalogCategory[]).map(cat => (
            <FilterOption key={cat} active={category === cat} onClick={() => setCategory(cat)} label={CATEGORY_LABELS[cat]} count={countFor(cat)} icon={CATEGORY_ICONS[cat]} />
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Plataforma">
        <div className="grid grid-cols-2 gap-2">
          {(['all', 'PS5', 'PS4', 'Xbox'] as BrandFilter[]).map(b => (
            <button key={b} type="button" onClick={() => setBrand(b)}
              className={`px-3 py-2 rounded-lg text-xs font-600 border transition-all ${brand === b ? 'bg-[#6153d6] border-[#6153d6] text-white' : 'border-[var(--c-border)] text-gtext hover:border-[#6153d6]'}`}>
              {b === 'all' ? 'Todas' : b}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Modalidad">
        <div className="flex p-1 rounded-xl bg-[var(--c-row-hover)]">
          {(['all', 'sale', 'rental'] as FilterType[]).map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-600 transition-all ${filter === f ? 'bg-[var(--c-card)] text-gtext shadow-sm' : 'text-muted hover:text-gtext'}`}>
              {f === 'all' ? 'Todos' : f === 'sale' ? 'Venta' : 'Alquiler'}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Precio (USD)">
        <div className="flex items-center gap-2">
          <input type="number" min="0" placeholder="Mín" value={minPrice} onChange={e => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--c-input-border)] bg-[var(--c-input-bg)] text-gtext text-sm" />
          <span className="text-muted">—</span>
          <input type="number" min="0" placeholder="Máx" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--c-input-border)] bg-[var(--c-input-bg)] text-gtext text-sm" />
        </div>
      </FilterGroup>
      <FilterGroup title="Disponibilidad">
        <label className="flex items-center justify-between cursor-pointer text-sm text-gtext">
          Solo con stock
          <span className={`relative w-10 h-6 rounded-full transition-colors ${inStockOnly ? 'bg-[#6153d6]' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} className="sr-only" />
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${inStockOnly ? 'left-5' : 'left-1'}`} />
          </span>
        </label>
      </FilterGroup>
      {hasActiveFilters && (
        <button type="button" onClick={clearFilters} className="w-full mt-2 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-700 flex items-center justify-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30">
          <RotateCcw size={13} /> Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg transition-colors duration-200">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1800&h=900&fit=crop&auto=format" alt="Consola de videojuegos" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/20" />
        <div className="relative w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-2xl">
            <span className="glass-pill shop-pill mb-5">Colección 2026 · Envíos a toda Venezuela</span>
            <h1 className="font-display font-700 text-4xl md:text-6xl text-white leading-[1.05] tracking-[-0.03em]">
              Tu próxima partida <span className="bg-gradient-to-r from-[#a5a0ff] to-[#86CCC0] bg-clip-text text-transparent">empieza aquí.</span>
            </h1>
            <p className="mt-5 text-white/75 text-base md:text-lg max-w-lg">Consolas, controles, juegos y tarjetas digitales con garantía y soporte especializado.</p>
            <a href="#tienda" className="inline-flex items-center gap-2 mt-7 px-6 py-3 rounded-xl bg-white text-slate-900 text-sm font-700 hover:bg-white/90 transition-colors">
              <ShoppingBag size={16} /> Ver productos
            </a>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-12 max-w-4xl">
            {[
              { icon: <Shield size={18} />, title: 'Garantía real', text: 'Hasta 12 meses en equipos seleccionados.' },
              { icon: <Truck size={18} />, title: 'Envíos nacionales', text: 'MRW, Tealca, Zoom y entregas locales.' },
              { icon: <Wrench size={18} />, title: 'Servicio técnico', text: 'Diagnóstico y reparación especializada.' },
            ].map(f => (
              <div key={f.title} className="liquid-glass p-5">
                <div className="flex items-center gap-2 text-white font-display font-600">{f.icon}{f.title}</div>
                <p className="text-white/70 text-sm mt-2 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category strip */}
      <div className="border-b border-[var(--c-border)] bg-[var(--c-card)]">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 overflow-x-auto py-3 no-scrollbar">
          {(Object.keys(CATEGORY_LABELS) as CatalogCategory[]).map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-600 border transition-all ${category === cat ? 'bg-[#6153d6] border-[#6153d6] text-white' : 'border-[var(--c-border)] text-gtext hover:border-[#6153d6]'}`}>
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Shop */}
      <div id="tienda" className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-start gap-6 xl:gap-8 scroll-mt-20">
        <aside className="hidden lg:block lg:w-72 xl:w-80 2xl:w-[340px] flex-shrink-0 !bg-transparent sticky top-20">
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-5 xl:p-6 shadow-[var(--c-shadow)]">
            <div className="flex items-center gap-2 font-display font-700 text-gtext pb-4"><SlidersHorizontal size={16} /> Filtros</div>
            {filterPanel}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="font-display text-2xl font-700 text-gtext">{CATEGORY_LABELS[category]}</h2>
              <p className="text-sm text-muted">{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawerOpen(true)} className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-card)] text-sm font-600 text-gtext">
                <Filter size={15} /> Filtros {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#6153d6]" />}
              </button>
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                className="px-3.5 py-2.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-card)] text-sm font-500 text-gtext">
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24 text-muted rounded-2xl border border-dashed border-[var(--c-border)]">
              <Gamepad2 size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-600 text-gtext">No se encontraron productos</p>
              <p className="text-sm mt-1">Ajusta los filtros o la búsqueda</p>
              {hasActiveFilters && <button onClick={clearFilters} className="mt-4 text-sm font-600 text-[#6153d6] hover:underline">Limpiar filtros</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button aria-label="Cerrar filtros" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[86%] max-w-sm bg-[var(--c-card)] p-5 overflow-y-auto shadow-2xl animate-[slideIn_.25s_ease-out]">
            <div className="flex items-center justify-between pb-4">
              <span className="flex items-center gap-2 font-display font-700 text-gtext"><SlidersHorizontal size={16} /> Filtros</span>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-[var(--c-row-hover)] text-muted"><X size={18} /></button>
            </div>
            {filterPanel}
            <button onClick={() => setDrawerOpen(false)} className="w-full mt-4 py-3 rounded-xl bg-[#6153d6] text-white text-sm font-700">
              Ver {filtered.length} resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Dashboard ─────────────────────────────────────────────────────────

function Dashboard() {
  const [clients] = useApiData<Client[]>(api.clients.list, []);
  const [rentals] = useApiData<Rental[]>(api.rentals.list, []);
  const [sales] = useApiData<Sale[]>(api.sales.list, []);
  const [services] = useApiData<TechService[]>(api.techServices.list, []);

  const stats = [
    { label: 'Clientes Registrados', value: clients.length, sub: `${clients.filter(c=>c.status==='active').length} activos`, icon: <Users size={20} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Alquileres Activos', value: rentals.filter(r=>r.status==='active').length, sub: `${rentals.filter(r=>r.status==='overdue').length} en mora`, icon: <Gamepad2 size={20} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
    { label: 'Ingresos del Mes', value: fmtMoney(sales.reduce((s,x)=>s+x.total,0)), sub: `${sales.length} ventas`, icon: <DollarSign size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)', isText: true },
    { label: 'En Servicio Técnico', value: services.filter(t=>!['delivered'].includes(t.status)).length, sub: `${services.filter(t=>t.status==='ready').length} listos para entrega`, icon: <Wrench size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="Panel Principal" subtitle="Resumen de operaciones en tiempo real" />

      {/* Stats */}
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

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent rentals */}
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
          <h3 className="font-display font-600 text-gtext mb-4 flex items-center gap-2">
            <Gamepad2 size={16} className="text-purple" /> Alquileres Recientes
          </h3>
          <div className="space-y-3">
            {rentals.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[rgba(139,92,246,0.07)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-500 text-gtext truncate">{r.clientName}</p>
                  <p className="text-xs text-muted truncate">{r.product}</p>
                </div>
                <Badge cls={r.status}>{r.status === 'active' ? 'Activo' : r.status === 'returned' ? 'Devuelto' : 'En Mora'}</Badge>
                <span className="text-sm font-600 text-blue">{fmtMoney(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent tech services */}
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
          <h3 className="font-display font-600 text-gtext mb-4 flex items-center gap-2">
            <Wrench size={16} className="text-warning" /> Servicio Técnico Activo
          </h3>
          <div className="space-y-3">
            {services.filter(t => t.status !== 'delivered').map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-[rgba(139,92,246,0.07)] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-500 text-gtext truncate">{t.device}</p>
                  <p className="text-xs text-muted truncate">{t.clientName} · {t.technician}</p>
                </div>
                <Badge cls={t.status}>{
                  t.status === 'received' ? 'Recibido' :
                  t.status === 'diagnosing' ? 'Diagnóstico' :
                  t.status === 'repairing' ? 'Reparando' : 'Listo'
                }</Badge>
                <span className="text-sm font-600 text-success">{fmtMoney(t.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(rentals.some(r=>r.status==='overdue') || services.some(t=>t.status==='ready')) && (
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
          <h3 className="font-display font-600 text-warning mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Alertas Pendientes
          </h3>
          <div className="space-y-2">
            {rentals.filter(r=>r.status==='overdue').map(r => (
              <div key={r.id} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <AlertTriangle size={13} className="text-danger flex-shrink-0" />
                <span className="text-gtext">Alquiler en mora: <span className="font-600">{r.clientName}</span> – {r.product}</span>
              </div>
            ))}
            {services.filter(t=>t.status==='ready').map(t => (
              <div key={t.id} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)' }}>
                <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                <span className="text-gtext">Listo para entrega: <span className="font-600">{t.device}</span> de {t.clientName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Clients ───────────────────────────────────────────────────────────

function ClientsSection() {
  const emptyForm = { name: '', cedula: '', phone: '', email: '', address: '', status: 'active' as Client['status'] };
  const [clients, setClients] = useApiData<Client[]>(api.clients.list, []);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.cedula.includes(search));

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const openEdit = (c: Client) => {
    setEditingId(c.id);
    setForm({ name: c.name, cedula: c.cedula, phone: c.phone, email: c.email, address: c.address, status: c.status });
    setErrors({}); setModalOpen(true);
  };

  const deleteClient = async (c: Client) => {
    if (!await confirmAction('¿Confirmar eliminación?', `¿Eliminar al cliente "${c.name}"? Sus registros históricos se conservarán.`)) return;
    try {
      await api.clients.remove(c.id);
      setClients(current => current.filter(x => x.id !== c.id));
    } catch {
      setErrors({ server: 'No se pudo eliminar el cliente.' });
      setModalOpen(true);
    }
  };

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const cedulaRaw = form.cedula.trim().toUpperCase().replace(/[^0-9VEJ-]/g, '');
    const cedulaNorm = /^\d/.test(cedulaRaw) ? `V-${cedulaRaw.replace(/^0+/, '')}` : cedulaRaw;
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Ingresa el nombre completo';
    if (!/^[VEJ]-?\d{4,10}$/.test(cedulaNorm)) nextErrors.cedula = 'Usa un formato como V-12345678';
    if (form.phone.replace(/\D/g, '').length < 7) nextErrors.phone = 'Ingresa un teléfono válido';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Ingresa un correo válido';
    if (form.address.trim().length < 5) nextErrors.address = 'Completa la dirección';
    if (clients.some(c => c.cedula.toLowerCase() === cedulaNorm.toLowerCase() && c.id !== editingId)) nextErrors.cedula = 'Esta cédula ya está registrada';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const joinDate = new Date().toISOString().slice(0, 10);
    const body = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim().toLowerCase(), cedula: cedulaNorm, address: form.address.trim(), join_date: joinDate, status: form.status };
    try {
      if (editingId) {
        const updated = await api.clients.update(editingId, body);
        setClients(current => current.map(c => c.id === editingId ? mapClient(updated) : c));
      } else {
        const created = await api.clients.create(body);
        setClients(current => [mapClient(created), ...current]);
      }
      closeModal();
    } catch {
      setErrors({ server: 'No se pudo guardar el cliente. Verifica la conexión con el servidor.' });
    }
  };

  const fieldClass = (field: string) => `w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow ${errors[field] ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'}`;

  return (
    <div>
      <SectionHeader title="Clientes" subtitle={`${clients.length} clientes registrados`} action={<AddBtn label="Nuevo Cliente" onClick={() => setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o cédula..." />
      </div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
                {['Cliente', 'Cédula', 'Teléfono', 'Email', 'Dirección', 'Desde', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-700 text-white flex-shrink-0" style={{ background: '#6153d6' }}>
                        {c.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                      </div>
                      <span className="font-500 text-gtext whitespace-nowrap">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{c.cedula}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-gtext whitespace-nowrap"><Phone size={11} className="text-muted" />{c.phone}</span></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-muted whitespace-nowrap"><Mail size={11} />{c.email}</span></td>
                  <td className="px-4 py-3 text-muted max-w-[180px] truncate"><span className="flex items-center gap-1"><MapPin size={11} className="flex-shrink-0" />{c.address}</span></td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(c.joinDate)}</td>
                  <td className="px-4 py-3"><Badge cls={c.status}>{c.status === 'active' ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>openEdit(c)} title="Editar cliente" className="p-1.5 rounded-lg text-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><Edit3 size={15}/></button>
                      <button onClick={()=>deleteClient(c)} title="Eliminar cliente" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"><Trash2 size={15}/></button>
                    </div>
                  </td>
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
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f1efff] dark:bg-indigo-950/60 text-[#6153d6] dark:text-indigo-400 flex items-center justify-center"><Users size={22} /></div>
                <div>
                  <div className="text-[11px] font-700 tracking-[0.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Gestión de clientes</div>
                  <h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">{editingId ? `Editar cliente #${editingId}` : 'Registrar nuevo cliente'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Completa la información para crear su perfil comercial.</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>

            <form onSubmit={saveClient} className="px-6 sm:px-8 py-6">
              {Object.keys(errors).length > 0 && (
                <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300 font-500">
                  {errors.server || 'Revisa los campos marcados en rojo antes de guardar.'}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
                <label className="sm:col-span-2">
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nombre completo</span>
                  <input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={fieldClass('name')} placeholder="Ej. Andrea Ramírez" />
                  {errors.name && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.name}</span>}
                </label>
                <label>
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Documento de identidad</span>
                  <input value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} className={fieldClass('cedula')} placeholder="V-12345678" />
                  {errors.cedula && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.cedula}</span>}
                </label>
                <label>
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Teléfono</span>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={fieldClass('phone')} placeholder="0412-000-0000" />
                  {errors.phone && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.phone}</span>}
                </label>
                <label>
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Correo electrónico</span>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={fieldClass('email')} placeholder="cliente@correo.com" />
                  {errors.email && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.email}</span>}
                </label>
                <label>
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Estado inicial</span>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Client['status'] })} className={fieldClass('status')}>
                    <option value="active">Cliente activo</option>
                    <option value="inactive">Cliente inactivo</option>
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Dirección de residencia o entrega</span>
                  <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={`${fieldClass('address')} min-h-24 resize-none`} placeholder="Urbanización, calle, edificio o casa y referencias" />
                  {errors.address && <span className="block text-xs text-red-600 dark:text-red-400 mt-1.5">{errors.address}</span>}
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800">
                {errors.server ? <p className="text-xs text-red-600 dark:text-red-400 font-500">{errors.server}</p> : <p className="text-xs text-slate-500 dark:text-slate-400">El cliente se guardará en la base de datos.</p>}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">{editingId ? 'Guardar cambios' : 'Guardar cliente'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Rentals ───────────────────────────────────────────────────────────

function RentalsSection({ rentals, setRentals, inventory, setInventory }: { rentals: Rental[]; setRentals: React.Dispatch<React.SetStateAction<Rental[]>>; inventory: Product[]; setInventory: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ clientName: '', productId: '', startDate: today, days: 1, deposit: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [error, setError] = useState('');
  const [clients] = useApiData<Client[]>(api.clients.list, []);
  const rentableProducts = inventory.filter(p => p.rentalPrice && (p.stock > 0 || p.id === form.productId) && p.type !== 'sale' && p.active !== false);
  const selectedProduct = inventory.find(p => p.id === form.productId);
  const dueDate = new Date(`${form.startDate}T12:00:00`);
  dueDate.setMonth(dueDate.getMonth() + Number(form.days || 0));
  const total = (selectedProduct?.rentalPrice ?? 0) * Number(form.days || 0);
  const filtered = rentals.filter(r => {
    if (statusF !== 'all' && r.status !== statusF) return false;
    if (search && !r.clientName.toLowerCase().includes(search.toLowerCase()) && !r.product.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const adjustStock = async (productId: string, delta: number) => {
    const p = inventory.find(x => x.id === productId);
    if (!p) return;
    try {
      await api.products.update(productId, { name: p.name, category: p.category, brand: p.brand, sale_price: p.salePrice ?? null, rental_price: p.rentalPrice ?? null, type: p.type, image: p.image, stock: Math.max(0, p.stock + delta), description: p.description, featured: p.featured ?? false, active: p.active ?? true, offer_price: p.offerPrice ?? null });
      setInventory(current => current.map(x => x.id === productId ? { ...x, stock: Math.max(0, x.stock + delta) } : x));
    } catch { /* best-effort */ }
  };

  const resetRentalForm = () => { setEditingId(null); setEditingRental(null); setForm({ clientName: '', productId: '', startDate: today, days: 1, deposit: 0 }); setError(''); };

  const openEdit = (r: Rental) => {
    setEditingId(r.id);
    setEditingRental(r);
    const prod = inventory.find(p => p.name === r.product);
    setForm({ clientName: r.clientName, productId: prod?.id ?? '', startDate: r.startDate, days: r.totalDays, deposit: r.deposit });
    setError(''); setModalOpen(true);
  };

  const markReturned = async (r: Rental) => {
    try {
      const prod = inventory.find(p => p.name === r.product);
      const updated = await api.rentals.update(r.id, { client_name: r.clientName, product_id: prod ? Number(prod.id) : null, product_name: r.product, start_date: r.startDate, due_date: r.dueDate, return_date: today, daily_rate: r.dailyRate, total_days: r.totalDays, deposit: r.deposit, status: 'returned' });
      setRentals(current => current.map(x => x.id === r.id ? mapRental(updated) : x));
      if (prod) await adjustStock(prod.id, 1);
    } catch { /* ignore */ }
  };

  const deleteRental = async (r: Rental) => {
    if (!await confirmAction('¿Confirmar eliminación?', `¿Eliminar el alquiler de ${r.clientName} (${r.product})?`)) return;
    try {
      await api.rentals.remove(r.id);
      setRentals(current => current.filter(x => x.id !== r.id));
      if (r.status !== 'returned') {
        const prod = inventory.find(p => p.name === r.product);
        if (prod) await adjustStock(prod.id, 1);
      }
    } catch {
      setError('No se pudo eliminar el alquiler.');
    }
  };

  const saveRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !selectedProduct || form.days < 1) return;
    const client = clients.find(c => c.name === form.clientName);
    const body = { client_id: client ? Number(client.id) : null, client_name: form.clientName, product_id: Number(selectedProduct.id) || null, product_name: selectedProduct.name, start_date: form.startDate, due_date: dueDate.toISOString().slice(0, 10), daily_rate: selectedProduct.rentalPrice!, total_days: Number(form.days), deposit: Number(form.deposit), status: 'active' };
    try {
      if (editingId && editingRental) {
        const updated = await api.rentals.update(editingId, { ...body, status: editingRental.status });
        setRentals(current => current.map(x => x.id === editingId ? mapRental(updated) : x));
        if (editingRental.status !== 'returned') {
          const oldProd = inventory.find(p => p.name === editingRental.product);
          if (oldProd && oldProd.id !== selectedProduct.id) await adjustStock(oldProd.id, 1);
          if (oldProd?.id !== selectedProduct.id) await adjustStock(selectedProduct.id, -1);
        }
      } else {
        const created = await api.rentals.create(body);
        setRentals(current => [mapRental(created), ...current]);
        await adjustStock(selectedProduct.id, -1);
      }
      resetRentalForm();
      setModalOpen(false);
    } catch {
      setError('No se pudo guardar el alquiler. Verifica la conexión con el servidor.');
    }
  };

  return (
    <div>
      <SectionHeader title="Alquileres" subtitle={`${rentals.filter(r=>r.status==='active').length} activos · ${rentals.filter(r=>r.status==='overdue').length} en mora`} action={<AddBtn label="Nuevo Alquiler" onClick={() => { resetRentalForm(); setModalOpen(true); }} />} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o producto..." />
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-gtext flex-shrink-0">
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="returned">Devueltos</option>
          <option value="overdue">En mora</option>
        </select>
      </div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
                {['ID', 'Cliente', 'Producto', 'Inicio', 'Vence', 'Meses', 'Tarifa/mes', 'Total', 'Depósito', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{r.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{r.clientName}</td>
                  <td className="px-4 py-3 text-muted max-w-[180px] truncate">{r.product}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(r.startDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={r.status === 'overdue' ? 'text-danger' : 'text-muted'}>{fmtDate(r.dueDate)}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted">{r.totalDays}</td>
                  <td className="px-4 py-3 text-muted">{fmtMoney(r.dailyRate)}</td>
                  <td className="px-4 py-3 font-600 text-blue">{fmtMoney(r.amount)}</td>
                  <td className="px-4 py-3 text-muted">{fmtMoney(r.deposit)}</td>
                  <td className="px-4 py-3"><Badge cls={r.status}>{r.status === 'active' ? 'Activo' : r.status === 'returned' ? 'Devuelto' : 'En Mora'}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {r.status === 'active' && <button onClick={()=>markReturned(r)} title="Marcar devuelto" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"><CheckCircle size={15}/></button>}
                      <button onClick={()=>openEdit(r)} title="Editar alquiler" className="p-1.5 rounded-lg text-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><Edit3 size={15}/></button>
                      <button onClick={()=>deleteRental(r)} title="Eliminar alquiler" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"><Trash2 size={15}/></button>
                    </div>
                  </td>
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
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-4"><div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue dark:text-blue-400 flex items-center justify-center"><Gamepad2 size={22} /></div><div><div className="text-[11px] font-700 tracking-[.14em] text-blue dark:text-blue-400 uppercase">Operación de inventario</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">{editingId ? `Editar alquiler #${editingId}` : 'Registrar nuevo alquiler'}</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Selecciona un artículo disponible y configura la operación.</p></div></div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>
            <form onSubmit={saveRental} className="p-7">
              <div className="grid sm:grid-cols-2 gap-5">
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar cliente registrado</option>{clients.filter(c=>c.status==='active').map(c=><option key={c.id}>{c.name}</option>)}</select></label>
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Producto del inventario</span><select required value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar producto disponible</option>{rentableProducts.map(p=><option key={p.id} value={p.id}>{p.name} · Stock {p.stock} · {fmtMoney(p.rentalPrice!)}/mes</option>)}</select></label>
                {selectedProduct && <div className="sm:col-span-2 grid grid-cols-3 gap-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4"><div><span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Tipo</span><strong className="text-sm text-slate-900 dark:text-white">{selectedProduct.category === 'console' ? 'Consola' : selectedProduct.category === 'game' ? 'Juego' : 'Accesorio'}</strong></div><div><span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Especificación</span><strong className="text-sm text-slate-900 dark:text-white">{selectedProduct.description.split('·')[0]}</strong></div><div><span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Disponibles</span><strong className="text-sm text-emerald-600 dark:text-emerald-400">{selectedProduct.stock} unidades</strong></div></div>}
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha de inicio</span><DatePicker value={form.startDate} onChange={val=>setForm({...form,startDate:val})} /></label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Duración en meses</span><input type="number" min="1" required value={form.days} onChange={e=>setForm({...form,days:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Depósito de garantía</span><input type="number" min="0" value={form.deposit} onChange={e=>setForm({...form,deposit:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
                <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900 text-slate-900 dark:text-white p-4"><span className="block text-xs text-slate-600 dark:text-white/70">Total estimado · vence {dueDate.toLocaleDateString('es-VE')}</span><strong className="font-display text-2xl text-indigo-600 dark:text-white">{fmtMoney(total)}</strong></div>
                {error && <div className="sm:col-span-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
              </div>
              <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">{editingId ? 'Guardar cambios' : 'Confirmar alquiler'}</button></div>
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
  const [sales, setSales] = useApiData<Sale[]>(api.sales.list, []);
  const [clients] = useApiData<Client[]>(api.clients.list, []);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [withDelivery, setWithDelivery] = useState(false);
  const [ship, setShip] = useState<ShipData>(EMPTY_SHIP);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deliveryFor, setDeliveryFor] = useState<Sale | null>(null);
  const [noteError, setNoteError] = useState('');
  const [error, setError] = useState('');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [productSearch, setProductSearch] = useState('');
  // Todos los productos activos aparecen, tengan o no precio. El precio se puede ajustar en la venta.
  const saleableProducts = inventory
    .filter(p => p.type !== 'rental' && p.active !== false)
    .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
  const effectivePrice = (p: Product) => (p.offerPrice && p.salePrice && p.offerPrice < p.salePrice) ? p.offerPrice : p.salePrice;
  const unitPrice = (p: Product) => prices[p.id] ?? effectivePrice(p) ?? 0;
  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => ({ product: inventory.find(p=>p.id===id)!, qty })).filter(i => i.product);
  const subtotal = cartItems.reduce((sum, item) => sum + unitPrice(item.product) * item.qty, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const filtered = sales.filter(s => !search || s.clientName.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);
  const setQuantity = (product: Product, quantity: number) => setCart(current => ({ ...current, [product.id]: Math.max(0, Math.min(product.stock, quantity)) }));
  const resetSaleForm = () => { setEditingId(null); setClientName(''); setCart({}); setDiscount(0); setPaymentMethod('cash'); setWithDelivery(false); setShip(EMPTY_SHIP); setError(''); setPrices({}); setProductSearch(''); };

  const openEdit = (s: Sale) => {
    resetSaleForm();
    setEditingId(s.id);
    setClientName(s.clientName);
    setDiscount(s.discount);
    setPaymentMethod(s.paymentMethod);
    const newCart: Record<string, number> = {};
    const newPrices: Record<string, number> = {};
    (s.items || []).forEach(item => {
      const prod = item.product_id != null ? inventory.find(p => p.id === String(item.product_id)) : undefined;
      const byName = prod || inventory.find(p => p.name === item.product_name);
      if (byName) { newCart[byName.id] = item.qty; newPrices[byName.id] = item.price; }
    });
    setCart(newCart);
    setPrices(newPrices);
    setModalOpen(true);
  };

  const deleteSale = async (s: Sale) => {
    if (!await confirmAction('¿Confirmar eliminación?', `¿Eliminar la venta #${s.id} de ${s.clientName}? El stock se devolverá al inventario.`)) return;
    try {
      await api.sales.remove(s.id);
      setSales(current => current.filter(x => x.id !== s.id));
      api.products.list().then(setInventory).catch(() => {});
    } catch {
      setError('No se pudo eliminar la venta. Verifica la conexión con el servidor.');
    }
  };

  const saveDeliveryNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryFor) return;
    if (!validateShip(ship)) { setNoteError(ship.type === 'local' ? 'Completa la dirección de entrega.' : 'Completa estado, agencia y código de oficina.'); return; }
    const client = clients.find(c => c.name === deliveryFor.clientName);
    try {
      await api.deliveries.create({ client_id: client ? Number(client.id) : null, client_name: deliveryFor.clientName, date: today, ...shipToPayload(ship), status: 'pending', notes: `Venta #${deliveryFor.id} del ${deliveryFor.date}`, items: deliveryFor.products });
      setDeliveryFor(null); setShip(EMPTY_SHIP); setNoteError('');
    } catch {
      setNoteError('No se pudo crear la nota de entrega.');
    }
  };

  const saveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !cartItems.length) { setError('Selecciona un cliente y agrega al menos un producto.'); return; }
    if (discount > subtotal) { setError('El descuento no puede superar el subtotal.'); return; }
    if (!editingId && withDelivery && !validateShip(ship)) { setError(ship.type === 'local' ? 'Completa la dirección de entrega.' : 'Para el envío nacional completa estado, agencia y código de oficina.'); return; }
    if (cartItems.some(({ product }) => unitPrice(product) <= 0) &&
      !await confirmAction('Productos sin precio', 'Hay productos con precio $0.00. ¿Deseas registrar la venta de todas formas?', { confirmText: 'Sí, continuar', danger: false })) return;
    const client = clients.find(c => c.name === clientName);
    const itemsPayload = cartItems.map(({ product, qty }) => ({ product_id: Number(product.id) || null, product_name: product.name, qty, price: unitPrice(product) }));
    const body = { client_id: client ? Number(client.id) : null, client_name: clientName, date: today, subtotal, discount: Number(discount), total, payment_method: paymentMethod, items: itemsPayload };
    try {
      if (editingId) {
        await api.sales.update(editingId, body);
      } else {
        await api.sales.create(body);
        if (withDelivery) {
          await api.deliveries.create({ client_id: client ? Number(client.id) : null, client_name: clientName, date: today, ...shipToPayload(ship), status: 'pending', notes: `Venta del ${today}`, items: cartItems.map(({ product, qty }) => `${product.name}${qty > 1 ? ` x${qty}` : ''}`) });
        }
      }
      api.sales.list().then(setSales).catch(() => {});
      api.products.list().then(setInventory).catch(() => {});
      resetSaleForm(); setModalOpen(false);
    } catch {
      setError(editingId ? 'No se pudo actualizar la venta.' : 'No se pudo registrar la venta. Verifica la conexión con el servidor.');
    }
  };

  return (
    <div>
      <SectionHeader title="Ventas" subtitle={`${sales.length} ventas · Total: ${fmtMoney(sales.reduce((s,x)=>s+x.total,0))}`} action={<AddBtn label="Nueva Venta" onClick={()=>{ resetSaleForm(); setModalOpen(true); }} />} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Ingresos', val: fmtMoney(totalRevenue), color: '#10b981' },
          { label: 'Venta Promedio', val: fmtMoney(filtered.length ? totalRevenue / filtered.length : 0), color: '#38bdf8' },
          { label: 'Descuentos Otorgados', val: fmtMoney(sales.reduce((s,x)=>s+x.discount,0)), color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="stat-card bg-card rounded-xl p-4">
            <div className="text-xs text-muted mb-1">{s.label}</div>
            <div className="font-display font-700 text-xl" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente..." />
      </div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
                {['ID', 'Cliente', 'Productos', 'Fecha', 'Subtotal', 'Descuento', 'Total', 'Método', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{s.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{s.clientName}</td>
                  <td className="px-4 py-3 text-muted max-w-[220px]">
                    <div className="flex flex-col gap-0.5">{s.products.map((p,i) => <span key={i} className="text-xs truncate">{p}</span>)}</div>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(s.date)}</td>
                  <td className="px-4 py-3 text-muted">{fmtMoney(s.subtotal)}</td>
                  <td className="px-4 py-3 text-warning">{s.discount > 0 ? `-${fmtMoney(s.discount)}` : '—'}</td>
                  <td className="px-4 py-3 font-700 text-blue">{fmtMoney(s.total)}</td>
                  <td className="px-4 py-3">
                    <Badge cls={s.paymentMethod}>{s.paymentMethod === 'cash' ? 'Efectivo' : s.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>openEdit(s)} title="Editar venta" className="p-1.5 rounded-lg text-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><Edit3 size={15}/></button>
                      <button onClick={()=>{ setDeliveryFor(s); const c = clients.find(x=>x.name===s.clientName); setShip({ ...EMPTY_SHIP, address: c?.address ?? '' }); setNoteError(''); }} title="Generar nota de entrega" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"><Truck size={15}/></button>
                      <button onClick={()=>deleteSale(s)} title="Eliminar venta" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><ShoppingBag size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-emerald-600 dark:text-emerald-400 uppercase">Punto de venta</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">{editingId ? `Editar venta #${editingId}` : 'Registrar nueva venta'}</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Agrega productos, valida existencias y confirma el pago.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div>
      <form onSubmit={saveSale} className="p-7"><div className="grid lg:grid-cols-[1.35fr_.75fr] gap-7"><div><label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={clientName} onChange={e=>{ setClientName(e.target.value); const c = clients.find(x=>x.name===e.target.value); if (c) setShip(s => ({ ...s, address: c.address })); }} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm shadow-sm hover:border-[#86CCC0] transition-colors"><option value="">Seleccionar cliente</option>{clients.filter(c=>c.status==='active').map(c=><option key={c.id}>{c.name}</option>)}</select></label><div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm"><div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"><div><strong className="text-sm text-slate-900 dark:text-white">Productos disponibles</strong><span className="block text-xs text-slate-500 dark:text-slate-400">Define cantidad y precio de cada artículo</span></div><div className="w-44 sm:w-56"><SearchBar value={productSearch} onChange={setProductSearch} placeholder="Buscar..." /></div></div><div className="max-h-[410px] overflow-y-auto p-2.5 space-y-2 bg-slate-50/70 dark:bg-slate-900">{saleableProducts.length===0 && <p className="text-center text-sm text-slate-500 py-8">No hay productos que coincidan.</p>}{saleableProducts.map(p=>{const qty=cart[p.id]||0; const noStock=p.stock<=0; const noPrice=!effectivePrice(p); return (<div key={p.id} className={`flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl border transition-all ${noStock?'opacity-55':''} ${qty>0?'bg-[#86CCC0]/15 border-[#86CCC0] dark:bg-[#86CCC0]/25 dark:border-[#86CCC0]/50 shadow-sm':'bg-white border-slate-200/90 hover:border-[#86CCC0]/60 dark:bg-slate-900 dark:border-slate-800'}`}><div className="flex-1 min-w-[140px]"><span className="block text-sm font-600 text-slate-900 dark:text-white truncate">{p.name}</span><span className="text-xs text-slate-500 dark:text-slate-400">{p.brand} · {noStock ? <span className="text-rose-500 font-600">Sin stock</span> : `Stock ${p.stock}`}{noPrice && <span className="ml-1.5 text-amber-600 dark:text-amber-400 font-600">· Sin precio</span>}</span></div><label className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 shadow-sm focus-within:border-[#86CCC0]" title="Precio unitario (editable)"><span className="text-xs font-700 text-slate-400">$</span><input type="number" min="0" step="0.01" inputMode="decimal" value={prices[p.id] ?? effectivePrice(p) ?? ''} placeholder="0.00" onChange={e=>{const v=e.target.value; setPrices(cur=>{const n={...cur}; if(v==='') delete n[p.id]; else n[p.id]=Math.max(0,Number(v)); return n;});}} className="w-20 bg-transparent !border-0 !shadow-none p-0 text-sm font-700 text-right text-[#0d9488] dark:text-[#86CCC0] focus:!ring-0" /></label><div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 shadow-inner"><button type="button" onClick={()=>setQuantity(p,(cart[p.id]||0)-1)} className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold">−</button><span className="w-9 text-center text-sm font-700 text-slate-900 dark:text-white bg-white dark:bg-slate-900 py-1 border-x border-slate-200 dark:border-slate-700">{cart[p.id]||0}</span><button type="button" onClick={()=>setQuantity(p,(cart[p.id]||0)+1)} className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold">+</button></div></div>);})}</div></div></div>
      <div><div className="sticky top-0 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-5 shadow-sm"><div className="text-[11px] font-700 tracking-[.14em] text-slate-500 dark:text-white/50 uppercase">Resumen de venta</div><div className="mt-5 space-y-3 max-h-44 overflow-y-auto">{cartItems.length?cartItems.map(({product,qty})=><div key={product.id} className="flex justify-between gap-3 text-sm"><span className="text-slate-600 dark:text-white/70 truncate">{qty}× {product.name}</span><span className="font-600 text-slate-900 dark:text-white">{fmtMoney(unitPrice(product)*qty)}</span></div>):<p className="text-sm text-slate-400 dark:text-white/45">Aún no hay productos.</p>}</div><div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 space-y-3"><div className="flex justify-between text-sm text-slate-600 dark:text-white/60"><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div><label className="flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-white/60"><span>Descuento</span><input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(Number(e.target.value))} className="w-24 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-right text-slate-900 dark:text-white font-600" /></label><div className="flex justify-between items-end pt-2"><span className="text-sm text-slate-600 dark:text-white/60">Total</span><strong className="font-display text-3xl text-[#0d9488] dark:text-white">{fmtMoney(total)}</strong></div></div></div><label className="block mt-5"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Método de pago</span><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as Sale['paymentMethod'])} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-[#86CCC0] transition-colors"><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option></select></label>
      {!editingId && <label className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 cursor-pointer"><input type="checkbox" checked={withDelivery} onChange={e=>setWithDelivery(e.target.checked)} className="w-4 h-4 accent-[#6153d6]" /><span className="text-sm font-600 text-slate-700 dark:text-slate-200 flex items-center gap-2"><Truck size={15} className="text-blue" /> Generar nota de entrega automática</span></label>}
      {!editingId && withDelivery && <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4"><ShippingFields value={ship} onChange={setShip} /></div>}
      </div></div>
      {error && <div className="mt-5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}<div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><p className="text-xs text-slate-500 dark:text-slate-400">El stock se descontará al confirmar la operación.</p><div className="flex gap-3"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">{editingId ? 'Guardar cambios' : 'Confirmar venta'}</button></div></div></form></div></div>}

      {deliveryFor && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setDeliveryFor(null)} />
          <div className="relative w-full max-w-md rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-[11px] font-700 tracking-[.14em] text-emerald-600 dark:text-emerald-400 uppercase">Nota de entrega</div>
                <h3 className="font-display text-xl font-700 text-slate-900 dark:text-white mt-1">Venta #{deliveryFor.id} · {deliveryFor.clientName}</h3>
              </div>
              <button onClick={()=>setDeliveryFor(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={saveDeliveryNote} className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 p-3 text-xs text-muted">
                {deliveryFor.products.map((p,i)=><div key={i}>· {p}</div>)}
              </div>
              <ShippingFields value={ship} onChange={setShip} />
              {noteError && <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{noteError}</div>}
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={()=>setDeliveryFor(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Generar nota</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shipping helpers ─────────────────────────────────────────────────────────

const VE_STATES = ['Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo','Cojedes','Delta Amacuro','Distrito Capital','Falcón','Guárico','Lara','Mérida','Miranda','Monagas','Nueva Esparta','Portuguesa','Sucre','Táchira','Trujillo','La Guaira','Yaracuy','Zulia'];
const SHIPPING_AGENCIES = ['MRW', 'Tealca', 'Zoom', 'Liberty Express'];

interface ShipData { type: 'local' | 'national'; address: string; state: string; agency: string; officeCode: string; }
const EMPTY_SHIP: ShipData = { type: 'local', address: '', state: '', agency: '', officeCode: '' };

function ShippingFields({ value, onChange }: { value: ShipData; onChange: (v: ShipData) => void }) {
  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm shadow-sm';
  const labelCls = 'block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(['local', 'national'] as const).map(t => (
          <button key={t} type="button" onClick={() => onChange({ ...value, type: t })}
            className={`px-4 py-3 rounded-xl border text-sm font-600 transition-all ${value.type === t ? 'bg-[#6153d6] border-[#6153d6] text-white shadow-md shadow-[#6153d6]/25' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#6153d6]/50 bg-white dark:bg-slate-800'}`}>
            {t === 'local' ? 'Envío cercano' : 'Envío nacional'}
          </button>
        ))}
      </div>
      {value.type === 'local' ? (
        <label className="block"><span className={labelCls}>Dirección de entrega</span><textarea value={value.address} onChange={e => onChange({ ...value, address: e.target.value })} className={`${inputCls} min-h-20 resize-none`} placeholder="Dirección completa y puntos de referencia" /></label>
      ) : (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block"><span className={labelCls}>Estado destino</span><select value={value.state} onChange={e => onChange({ ...value, state: e.target.value })} className={inputCls}><option value="">Seleccionar estado</option>{VE_STATES.map(s => <option key={s}>{s}</option>)}</select></label>
            <label className="block"><span className={labelCls}>Agencia de envío</span><select value={value.agency} onChange={e => onChange({ ...value, agency: e.target.value })} className={inputCls}><option value="">Seleccionar agencia</option>{SHIPPING_AGENCIES.map(a => <option key={a}>{a}</option>)}</select></label>
          </div>
          <label className="block"><span className={labelCls}>Código de oficina destino</span><input value={value.officeCode} onChange={e => onChange({ ...value, officeCode: e.target.value })} className={inputCls} placeholder="Ej. CCS-0451" /></label>
        </div>
      )}
    </div>
  );
}

const deliveryDestination = (d: Pick<DeliveryNote, 'shippingType' | 'address' | 'state' | 'agency' | 'officeCode'>) =>
  d.shippingType === 'national'
    ? `${d.agency || ''} · ${d.state || ''}${d.officeCode ? ` · Of. ${d.officeCode}` : ''}`
    : (d.address || '');

const shipToPayload = (ship: ShipData) => ({
  shipping_type: ship.type,
  address: ship.type === 'local' ? ship.address.trim() : null,
  state: ship.type === 'national' ? ship.state : null,
  agency: ship.type === 'national' ? ship.agency : null,
  office_code: ship.type === 'national' ? ship.officeCode.trim() : null,
});

const validateShip = (ship: ShipData) =>
  ship.type === 'local'
    ? !!ship.address.trim()
    : !!(ship.state && ship.agency && ship.officeCode.trim());

const generateDeliveryPdf = async (d: DeliveryNote) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(97, 83, 214);
  doc.rect(0, 0, pageW, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Luigi Digital', 16, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gaming Store · Nota de Entrega', 16, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`N° ${String(d.id).padStart(5, '0')}`, pageW - 16, 16, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtDate(d.date), pageW - 16, 24, { align: 'right' });

  doc.setTextColor(30, 30, 40);
  let y = 48;
  const section = (title: string, lines: string[]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, 16, y); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    lines.forEach(l => { doc.text(l, 16, y); y += 5.5; });
    y += 6;
  };

  section('CLIENTE', [d.clientName]);
  doc.setDrawColor(220, 220, 230);
  doc.line(16, y - 8, pageW - 16, y - 8);
  section('DESPACHO', d.shippingType === 'national'
    ? [`Tipo: Envío nacional`, `Agencia: ${d.agency || '—'}`, `Estado destino: ${d.state || '—'}`, `Oficina: ${d.officeCode || '—'}`]
    : [`Tipo: Envío cercano`, `Dirección: ${d.address || '—'}`]);
  doc.line(16, y - 8, pageW - 16, y - 8);
  section('ARTÍCULOS', d.items.map(it => `• ${it}`));
  doc.line(16, y - 8, pageW - 16, y - 8);
  section('ESTADO Y NOTAS', [
    `Estado: ${d.status === 'pending' ? 'Pendiente' : d.status === 'delivered' ? 'Entregado' : 'Fallido'}`,
    ...(d.notes ? doc.splitTextToSize(`Notas: ${d.notes}`, pageW - 32) : []),
  ]);

  y += 30;
  doc.setDrawColor(120, 120, 140);
  doc.line(16, y, 76, y);
  doc.setFontSize(9);
  doc.text('Firma del receptor', 16, y + 5);
  doc.line(pageW - 76, y, pageW - 16, y);
  doc.text('Sello / Firma Luigi Digital', pageW - 76, y + 5);
  doc.setTextColor(150, 150, 160);
  doc.setFontSize(8);
  doc.text(`Generado el ${new Date().toLocaleString('es-VE')} · Luigi Digital — Gaming Store`, 16, 285);
  doc.save(`nota-entrega-${d.id}.pdf`);
};

// ─── Admin: Delivery Notes ────────────────────────────────────────────────────

function DeliveriesSection({ inventory }: { inventory: Product[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { clientName: '', itemIds: [] as string[], ship: EMPTY_SHIP, date: today, status: 'pending' as DeliveryNote['status'], notes: '' };
  const [deliveries, setDeliveries] = useApiData<DeliveryNote[]>(api.deliveries.list, []);
  const [clients] = useApiData<Client[]>(api.clients.list, []);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<DeliveryNote | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const filtered = deliveries.filter(d => !search || d.clientName.toLowerCase().includes(search.toLowerCase()) || (d.address || '').toLowerCase().includes(search.toLowerCase()) || (d.state || '').toLowerCase().includes(search.toLowerCase()));
  const selectClient = (name: string) => {
    const client = clients.find(c => c.name === name);
    setForm(current => ({ ...current, clientName: name, ship: { ...current.ship, address: client?.address ?? current.ship.address } }));
  };
  const toggleItem = (id: string) => setForm(current => ({ ...current, itemIds: current.itemIds.includes(id) ? current.itemIds.filter(itemId => itemId !== id) : [...current.itemIds, id] }));

  const openEdit = (d: DeliveryNote) => {
    setEditingId(d.id);
    const itemIds = inventory.filter(p => d.items.some(it => it.startsWith(p.name))).map(p => p.id);
    setForm({ clientName: d.clientName, itemIds, ship: { type: d.shippingType, address: d.address || '', state: d.state || '', agency: d.agency || '', officeCode: d.officeCode || '' }, date: d.date, status: d.status, notes: d.notes || '' });
    setError(''); setModalOpen(true);
  };

  const deleteDelivery = async (d: DeliveryNote) => {
    if (!await confirmAction('¿Confirmar eliminación?', `¿Eliminar la nota de entrega #${d.id} de ${d.clientName}?`)) return;
    try {
      await api.deliveries.remove(d.id);
      setDeliveries(current => current.filter(x => x.id !== d.id));
    } catch {
      setError('No se pudo eliminar la nota de entrega.');
    }
  };

  const saveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.itemIds.length) { setError('Selecciona cliente y al menos un artículo.'); return; }
    if (!validateShip(form.ship)) { setError(form.ship.type === 'local' ? 'Completa la dirección de entrega.' : 'Completa estado, agencia y código de oficina.'); return; }
    const items = form.itemIds.map(id => inventory.find(p=>p.id===id)?.name).filter(Boolean) as string[];
    const client = clients.find(c => c.name === form.clientName);
    const body = { client_id: client ? Number(client.id) : null, client_name: form.clientName, date: form.date, ...shipToPayload(form.ship), status: form.status, notes: form.notes.trim(), items };
    try {
      if (editingId) {
        const updated = await api.deliveries.update(editingId, body);
        setDeliveries(current => current.map(d => d.id === editingId ? mapDelivery({ ...updated, items }) : d));
      } else {
        const created = await api.deliveries.create(body);
        setDeliveries(current => [mapDelivery({ ...created, items }), ...current]);
      }
      setForm(emptyForm); setEditingId(null); setError(''); setModalOpen(false);
    } catch {
      setError('No se pudo guardar la nota de entrega. Verifica la conexión con el servidor.');
    }
  };

  return (
    <div>
      <SectionHeader title="Notas de Entrega" subtitle={`${deliveries.filter(d=>d.status==='pending').length} pendientes · ${deliveries.filter(d=>d.status==='delivered').length} entregadas`} action={<AddBtn label="Nueva Nota" onClick={()=>{ setEditingId(null); setForm(emptyForm); setError(''); setModalOpen(true); }} />} />
      <div className="flex items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente, dirección o estado..." />
      </div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
                {['ID', 'Cliente', 'Artículos', 'Tipo de envío', 'Destino', 'Fecha', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{d.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{d.clientName}</td>
                  <td className="px-4 py-3 text-muted max-w-[180px]">
                    <div className="flex flex-col gap-0.5">{d.items.map((it,i) => <span key={i} className="text-xs truncate">{it}</span>)}</div>
                  </td>
                  <td className="px-4 py-3"><Badge cls={d.shippingType === 'national' ? 'transfer' : 'sale'}>{d.shippingType === 'national' ? 'Nacional' : 'Cercano'}</Badge></td>
                  <td className="px-4 py-3 text-muted max-w-[220px]">
                    <span className="flex items-center gap-1 text-xs"><MapPin size={11} className="flex-shrink-0" />{deliveryDestination(d) || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(d.date)}</td>
                  <td className="px-4 py-3"><Badge cls={d.status}>{d.status === 'pending' ? 'Pendiente' : d.status === 'delivered' ? 'Entregado' : 'Fallido'}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>setViewing(d)} title="Ver nota" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Eye size={15}/></button>
                      <button onClick={()=>generateDeliveryPdf(d)} title="Descargar PDF" className="p-1.5 rounded-lg text-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><FileDown size={15}/></button>
                      <button onClick={()=>openEdit(d)} title="Editar" className="p-1.5 rounded-lg text-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><Edit3 size={15}/></button>
                      <button onClick={()=>deleteDelivery(d)} title="Eliminar" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue dark:text-blue-400 flex items-center justify-center"><Truck size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-blue dark:text-blue-400 uppercase">Logística y despacho</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">{editingId ? `Editar nota #${editingId}` : 'Crear nota de entrega'}</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Organiza los artículos, método de despacho y destino.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div>
      <form onSubmit={saveDelivery} className="p-7"><div className="grid lg:grid-cols-[1fr_.9fr] gap-7"><div className="space-y-5">
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente destinatario</span><select required value={form.clientName} onChange={e=>selectClient(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm shadow-sm hover:border-[#86CCC0] transition-colors"><option value="">Seleccionar cliente</option>{clients.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
        <div><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Método de despacho</span><ShippingFields value={form.ship} onChange={ship=>setForm({...form,ship})} /></div>
        <div className="grid sm:grid-cols-2 gap-4"><label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha programada</span><DatePicker value={form.date} onChange={val=>setForm({...form,date:val})} /></label><label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Estado</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as DeliveryNote['status']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-[#86CCC0] transition-colors"><option value="pending">Pendiente</option><option value="delivered">Entregado</option><option value="failed">Fallido</option></select></label></div>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Instrucciones y observaciones</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full min-h-20 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-[#86CCC0] transition-colors" placeholder="Horario, persona autorizada, referencias o cuidados especiales" /></label>
      </div><div><div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm"><div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"><strong className="text-sm text-slate-900 dark:text-white">Artículos del inventario</strong><span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Selecciona uno o varios productos</span></div><div className="max-h-[390px] overflow-y-auto p-2.5 space-y-2 bg-slate-50/70 dark:bg-slate-900">{inventory.filter(p=>p.stock>0).map(p => { const isSelected = form.itemIds.includes(p.id); return (<label key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-[#86CCC0]/15 border-[#86CCC0] dark:bg-[#86CCC0]/25 dark:border-[#86CCC0]/50 shadow-sm' : 'bg-white border-slate-200/90 hover:border-[#86CCC0]/60 dark:bg-slate-900 dark:border-slate-800'}`}><input type="checkbox" checked={isSelected} onChange={()=>toggleItem(p.id)} className="w-4 h-4 accent-[#86CCC0] rounded cursor-pointer"/><div className="flex-1 min-w-0"><span className={`block text-sm truncate ${isSelected ? 'font-700 text-slate-900 dark:text-white' : 'font-500 text-slate-800 dark:text-slate-200'}`}>{p.name}</span><span className="text-xs text-slate-500 dark:text-slate-400">{p.brand} · Stock {p.stock}</span></div><Badge cls={p.category==='game'?'sale':p.brand.toLowerCase()}>{p.category==='console'?'Consola':p.category==='game'?'Juego':'Producto'}</Badge></label>);})}</div><div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-xs font-600 text-slate-600 dark:text-slate-300 flex justify-between items-center"><span>{form.itemIds.length} artículo{form.itemIds.length===1?'':'s'} seleccionado{form.itemIds.length===1?'':'s'}</span>{form.itemIds.length > 0 && <span className="inline-block px-2 py-0.5 rounded-full bg-[#86CCC0] text-slate-900 font-bold text-[10px]">Seleccionado</span>}</div></div></div></div>
        {error && <div className="mt-5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">{editingId ? 'Guardar cambios' : 'Generar nota'}</button></div></form></div></div>}

      {viewing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setViewing(null)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-[#6153d6] px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-700 tracking-[.16em] text-white/70 uppercase">Luigi Digital · Gaming Store</div>
                <h3 className="font-display text-lg font-700 text-white">Nota de Entrega N° {viewing.id.padStart(5,'0')}</h3>
              </div>
              <Badge cls={viewing.status}>{viewing.status === 'pending' ? 'Pendiente' : viewing.status === 'delivered' ? 'Entregado' : 'Fallido'}</Badge>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="block text-[10px] uppercase tracking-wider text-muted mb-1">Cliente</span><strong>{viewing.clientName}</strong></div>
                <div><span className="block text-[10px] uppercase tracking-wider text-muted mb-1">Fecha</span><strong>{fmtDate(viewing.date)}</strong></div>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">Despacho</span>
                {viewing.shippingType === 'national' ? (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 px-4 py-3 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted">Tipo</span><strong>Nacional</strong></div>
                    <div className="flex justify-between"><span className="text-muted">Agencia</span><strong>{viewing.agency || '—'}</strong></div>
                    <div className="flex justify-between"><span className="text-muted">Estado</span><strong>{viewing.state || '—'}</strong></div>
                    <div className="flex justify-between"><span className="text-muted">Oficina</span><strong>{viewing.officeCode || '—'}</strong></div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 px-4 py-3 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted">Tipo</span><strong>Envío cercano</strong></div>
                    <div><span className="text-muted">Dirección</span><p className="font-500 mt-0.5">{viewing.address || '—'}</p></div>
                  </div>
                )}
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted mb-1">Artículos</span>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {viewing.items.map((it,i)=><div key={i} className="px-4 py-2 text-xs flex items-center gap-2"><Package size={12} className="text-blue flex-shrink-0" />{it}</div>)}
                </div>
              </div>
              {viewing.notes && <div><span className="block text-[10px] uppercase tracking-wider text-muted mb-1">Notas</span><p className="text-xs text-muted">{viewing.notes}</p></div>}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button onClick={()=>setViewing(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cerrar</button>
                <button onClick={()=>generateDeliveryPdf(viewing)} className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors flex items-center gap-2"><FileDown size={15}/> Descargar PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Technical Service ─────────────────────────────────────────────────

function TechnicalSection() {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { clientName: '', device: '', issue: '', receiveDate: today, estimatedDate: today, technician: '', cost: 0, status: 'received' as TechService['status'], notes: '' };
  const [services, setServices] = useApiData<TechService[]>(api.techServices.list, []);
  const [clients] = useApiData<Client[]>(api.clients.list, []);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const filtered = services.filter(t => !search || t.clientName.toLowerCase().includes(search.toLowerCase()) || t.device.toLowerCase().includes(search.toLowerCase()));

  const statusLabel: Record<string, string> = {
    received: 'Recibido', diagnosing: 'Diagnóstico', repairing: 'Reparando', ready: 'Listo', delivered: 'Entregado'
  };
  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || form.device.trim().length < 3 || form.issue.trim().length < 5 || !form.technician) { setError('Completa cliente, dispositivo, falla y técnico responsable.'); return; }
    if (form.estimatedDate < form.receiveDate) { setError('La fecha estimada no puede ser anterior a la recepción.'); return; }
    const client = clients.find(c => c.name === form.clientName);
    try {
      const created = await api.techServices.create({ client_id: client ? Number(client.id) : null, client_name: form.clientName, device: form.device.trim(), issue: form.issue.trim(), receive_date: form.receiveDate, estimated_date: form.estimatedDate, technician: form.technician, cost: Number(form.cost), status: form.status, notes: form.notes.trim() });
      setServices(current => [mapTechService(created), ...current]);
      setForm(emptyForm); setError(''); setModalOpen(false);
    } catch {
      setError('No se pudo crear la orden. Verifica la conexión con el servidor.');
    }
  };

  return (
    <div>
      <SectionHeader title="Servicio Técnico" subtitle={`${services.filter(t=>t.status!=='delivered').length} activos · ${services.filter(t=>t.status==='ready').length} listos para entrega`} action={<AddBtn label="Nueva Orden" onClick={()=>setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o dispositivo..." />
      </div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
                {['ID', 'Cliente', 'Dispositivo', 'Falla', 'Recibido', 'Est. Entrega', 'Técnico', 'Costo', 'Estado', 'Notas'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{t.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{t.clientName}</td>
                  <td className="px-4 py-3 text-gtext whitespace-nowrap">{t.device}</td>
                  <td className="px-4 py-3 text-muted max-w-[160px] truncate text-xs">{t.issue}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(t.receiveDate)}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(t.estimatedDate)}</td>
                  <td className="px-4 py-3 text-gtext whitespace-nowrap">{t.technician}</td>
                  <td className="px-4 py-3 font-600 text-success">{fmtMoney(t.cost)}</td>
                  <td className="px-4 py-3"><Badge cls={t.status}>{statusLabel[t.status]}</Badge></td>
                  <td className="px-4 py-3 text-muted text-xs max-w-[160px] truncate">{t.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Wrench size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-amber-600 dark:text-amber-400 uppercase">Recepción técnica</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Crear orden de servicio</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Documenta el equipo, la falla reportada y la planificación inicial.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div>
      <form onSubmit={saveService} className="p-7"><div className="grid sm:grid-cols-2 gap-5">
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar cliente</option>{clients.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Dispositivo recibido</span><input required value={form.device} onChange={e=>setForm({...form,device:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej. PlayStation 5 Slim" /></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Falla reportada por el cliente</span><textarea required value={form.issue} onChange={e=>setForm({...form,issue:e.target.value})} className="w-full min-h-24 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Describe síntomas, errores, daños físicos y cuándo comenzó la falla" /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha de recepción</span><DatePicker value={form.receiveDate} onChange={val=>setForm({...form,receiveDate:val})} /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Entrega estimada</span><DatePicker value={form.estimatedDate} onChange={val=>setForm({...form,estimatedDate:val})} /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Técnico responsable</span><select required value={form.technician} onChange={e=>setForm({...form,technician:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="">Asignar técnico</option><option>Miguel Ángel</option><option>Roberto Silva</option><option>Daniel Rojas</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Costo estimado</span><div className="relative"><DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="number" min="0" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:Number(e.target.value)})} className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></div></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Estado inicial</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as TechService['status']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="received">Recibido</option><option value="diagnosing">En diagnóstico</option><option value="repairing">En reparación</option><option value="ready">Listo para entrega</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Prioridad</span><select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option>Normal</option><option>Alta</option><option>Urgente</option></select></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Notas internas y condiciones de recepción</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full min-h-20 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Accesorios recibidos, estado físico, observaciones o diagnóstico preliminar" /></label>
        {error && <div className="sm:col-span-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
      </div><div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><p className="text-xs text-slate-500 dark:text-slate-400">Se generará un número de orden automáticamente.</p><div className="flex gap-3"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Crear orden técnica</button></div></div></form></div></div>}
    </div>
  );
}

// ─── Admin: Warranties ────────────────────────────────────────────────────────

function WarrantiesSection({ inventory }: { inventory: Product[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { clientName: '', productId: '', serial: '', purchaseDate: today, months: 12, type: 'store' as Warranty['type'] };
  const [warranties, setWarranties] = useApiData<Warranty[]>(api.warranties.list, []);
  const [clients] = useApiData<Client[]>(api.clients.list, []);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const selectedProduct = inventory.find(p => p.id === form.productId);
  const expiry = new Date(`${form.purchaseDate}T12:00:00`);
  expiry.setMonth(expiry.getMonth() + Number(form.months || 0));
  const filtered = warranties.filter(w => !search || w.clientName.toLowerCase().includes(search.toLowerCase()) || w.product.toLowerCase().includes(search.toLowerCase()) || w.serial.toLowerCase().includes(search.toLowerCase()));

  const saveWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !selectedProduct || form.serial.trim().length < 5) { setError('Completa el cliente, producto y un serial válido.'); return; }
    if (warranties.some(w => w.serial.toLowerCase() === form.serial.trim().toLowerCase())) { setError('Este número serial ya tiene una garantía registrada.'); return; }
    const client = clients.find(c => c.name === form.clientName);
    try {
      const created = await api.warranties.create({ client_id: client ? Number(client.id) : null, client_name: form.clientName, product: selectedProduct.name, serial: form.serial.trim().toUpperCase(), purchase_date: form.purchaseDate, expiry_date: expiry.toISOString().slice(0, 10), status: 'active', type: form.type });
      setWarranties(current => [mapWarranty(created), ...current]);
      setForm(emptyForm); setError(''); setModalOpen(false);
    } catch {
      setError('No se pudo registrar la garantía. Verifica la conexión con el servidor.');
    }
  };

  return (
    <div>
      <SectionHeader title="Garantías" subtitle={`${warranties.filter(w=>w.status==='active').length} activas · ${warranties.filter(w=>w.status==='expired').length} vencidas`} action={<AddBtn label="Nueva Garantía" onClick={()=>setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o producto..." />
      </div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
                {['ID', 'Cliente', 'Producto', 'Nº Serial', 'F. Compra', 'F. Vencimiento', 'Tipo', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} className="table-row-hover border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{w.id}</td>
                  <td className="px-4 py-3 font-500 text-gtext whitespace-nowrap">{w.clientName}</td>
                  <td className="px-4 py-3 text-gtext">{w.product}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{w.serial}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(w.purchaseDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={w.status === 'expired' ? 'text-danger' : w.status === 'claimed' ? 'text-warning' : 'text-success'}>
                      {fmtDate(w.expiryDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3"><Badge cls={w.type}>{w.type === 'store' ? 'Tienda' : 'Fabricante'}</Badge></td>
                  <td className="px-4 py-3"><Badge cls={w.status}>{w.status === 'active' ? 'Activa' : w.status === 'expired' ? 'Vencida' : 'Reclamada'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-[#f1efff] dark:bg-indigo-950/60 text-[#6153d6] dark:text-indigo-400 flex items-center justify-center"><Shield size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Protección postventa</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nueva garantía</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Asocia un producto y define las condiciones de cobertura.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div>
      <form onSubmit={saveWarranty} className="p-7"><div className="grid sm:grid-cols-2 gap-5">
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente titular</span><select required value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar cliente</option>{clients.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Producto cubierto</span><select required value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar del inventario</option>{inventory.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Número serial / identificador único</span><input required value={form.serial} onChange={e=>setForm({...form,serial:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm uppercase" placeholder="Ej. CFI-2015A-001928" /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha de compra</span><DatePicker value={form.purchaseDate} onChange={val=>setForm({...form,purchaseDate:val})} /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Tipo de cobertura</span><select value={form.type} onChange={e=>setForm({...form,type:e.target.value as Warranty['type']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="store">Garantía de tienda</option><option value="manufacturer">Garantía del fabricante</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Duración de cobertura</span><select value={form.months} onChange={e=>setForm({...form,months:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value={3}>3 meses</option><option value={6}>6 meses</option><option value={12}>12 meses</option><option value={24}>24 meses</option></select></label>
        <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4"><span className="block text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Vencimiento calculado</span><strong className="block font-display text-lg text-slate-900 dark:text-white mt-1">{expiry.toLocaleDateString('es-VE',{day:'2-digit',month:'long',year:'numeric'})}</strong></div>
        {selectedProduct && <div className="sm:col-span-2 flex items-center gap-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 p-4"><div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-blue dark:text-blue-400 flex items-center justify-center"><Package size={19}/></div><div><strong className="block text-sm text-slate-900 dark:text-white">{selectedProduct.name}</strong><span className="text-xs text-slate-500 dark:text-slate-400">{selectedProduct.brand} · {selectedProduct.description}</span></div></div>}
        {error && <div className="sm:col-span-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
      </div><div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Activar garantía</button></div></form></div></div>}
    </div>
  );
}

// ─── Admin: Purchases ─────────────────────────────────────────────────────────

function PurchasesSection({ inventory, setInventory }: { inventory: Product[]; setInventory: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const emptyProduct = { name: '', category: 'console' as Product['category'], brand: 'PS5' as Product['brand'], stock: 1, specification: '', salePrice: 0, rentalPrice: 0, offerPrice: 0, imageUrl: '', type: 'both' as Product['type'] };
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const filtered = inventory.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
  const totalStock = inventory.reduce((sum, p) => sum + p.stock, 0);

  const openNew = () => { setEditingId(null); setForm(emptyProduct); setError(''); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, category: p.category, brand: p.brand, stock: p.stock, specification: p.description, salePrice: p.salePrice ?? 0, rentalPrice: p.rentalPrice ?? 0, offerPrice: p.offerPrice ?? 0, imageUrl: p.image, type: p.type });
    setError(''); setModalOpen(true);
  };

  const payload = (p?: Product) => ({
    name: form.name.trim(), category: form.category, brand: form.brand,
    sale_price: form.salePrice || null, rental_price: form.rentalPrice || null,
    type: form.type, image: form.imageUrl.trim() || p?.image || 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=720&h=520&fit=crop&auto=format',
    stock: Number(form.stock), description: form.specification.trim(),
    featured: p?.featured ?? false, active: p?.active ?? true,
    offer_price: form.offerPrice || null,
  });

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const existing = inventory.find(p => p.id === editingId);
        const updated = await api.products.update(editingId, payload(existing));
        setInventory(current => current.map(p => p.id === editingId ? mapProduct(updated) : p));
      } else {
        const created = await api.products.create(payload());
        setInventory(current => [mapProduct(created), ...current]);
      }
      setForm(emptyProduct); setEditingId(null); setModalOpen(false);
    } catch {
      setError('No se pudo guardar el producto. Verifica la conexión con el servidor.');
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      const updated = await api.products.update(p.id, { name: p.name, category: p.category, brand: p.brand, sale_price: p.salePrice ?? null, rental_price: p.rentalPrice ?? null, type: p.type, image: p.image, stock: p.stock, description: p.description, featured: p.featured ?? false, active: p.active === false, offer_price: p.offerPrice ?? null });
      setInventory(current => current.map(x => x.id === p.id ? mapProduct(updated) : x));
    } catch { /* ignore */ }
  };

  const deleteProduct = async (p: Product) => {
    if (!await confirmAction('¿Confirmar eliminación?', `¿Eliminar "${p.name}" del inventario?`)) return;
    try {
      await api.products.remove(p.id);
      setInventory(current => current.filter(x => x.id !== p.id));
    } catch {
      setError('No se pudo eliminar el producto.');
    }
  };

  return (
    <div>
      <SectionHeader title="Inventario" subtitle={`${inventory.length} productos · ${totalStock} unidades disponibles`} action={<AddBtn label="Nuevo Producto" onClick={openNew} />} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Unidades en stock</div><div className="font-display font-700 text-2xl text-gtext mt-1">{totalStock}</div></div>
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Disponibles para alquiler</div><div className="font-display font-700 text-2xl text-blue mt-1">{inventory.filter(p=>p.rentalPrice && p.stock>0).length}</div></div>
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Stock crítico</div><div className="font-display font-700 text-2xl text-warning mt-1">{inventory.filter(p=>p.stock<=2).length}</div></div>
      </div>
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por producto o marca..." /></div>
      <div className="bg-card rounded-xl overflow-hidden border border-slate-200"><div className="table-scroll"><table className="w-full text-sm"><thead><tr>{['Producto','Tipo','Marca','Capacidad / Especificación','Stock','Venta','Oferta','Alquiler / mes','Modalidad','Estado','Acciones'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{filtered.map(p=><tr key={p.id} className="table-row-hover border-b border-slate-100 last:border-0"><td className="px-4 py-3 font-600 text-gtext whitespace-nowrap">{p.name}</td><td className="px-4 py-3 text-muted capitalize">{p.category === 'console' ? 'Consola' : p.category === 'game' ? 'Juego' : p.category === 'accessory' ? 'Accesorio' : 'Digital'}</td><td className="px-4 py-3"><Badge cls={p.brand.toLowerCase()}>{p.brand}</Badge></td><td className="px-4 py-3 text-muted max-w-[260px] truncate">{p.description}</td><td className="px-4 py-3"><span className={`font-700 ${p.stock<=2?'text-danger':'text-success'}`}>{p.stock}</span></td><td className="px-4 py-3 text-muted">{p.salePrice?fmtMoney(p.salePrice):'—'}</td><td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-600">{p.offerPrice?fmtMoney(p.offerPrice):'—'}</td><td className="px-4 py-3 text-blue font-600">{p.rentalPrice?fmtMoney(p.rentalPrice):'—'}</td><td className="px-4 py-3"><Badge cls={p.type}>{p.type==='both'?'Venta / Alquiler':p.type==='sale'?'Venta':'Alquiler'}</Badge></td><td className="px-4 py-3"><button onClick={()=>toggleActive(p)} title={p.active===false?'Activar producto':'Desactivar producto'} className={`relative w-9 h-5 rounded-full transition-colors ${p.active!==false?'bg-emerald-500':'bg-slate-300 dark:bg-slate-600'}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${p.active!==false?'left-4':'left-0.5'}`} /></button></td><td className="px-4 py-3"><div className="flex items-center gap-1.5"><button onClick={()=>openEdit(p)} title="Editar" className="p-1.5 rounded-lg text-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"><Edit3 size={15}/></button><button onClick={()=>deleteProduct(p)} title="Eliminar" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></div>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><button className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div><div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Control de inventario</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">{editingId ? 'Editar producto' : 'Registrar producto'}</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configura sus características comerciales y disponibilidad.</p></div><button onClick={()=>setModalOpen(false)} className="p-2 h-fit rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div><form onSubmit={saveProduct} className="p-7 grid sm:grid-cols-2 gap-5">
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nombre comercial</span><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej. PlayStation 5 Slim 1TB" /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Tipo de producto</span><select value={form.category} onChange={e=>setForm({...form,category:e.target.value as Product['category']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="console">Consola</option><option value="game">Videojuego</option><option value="accessory">Accesorio</option><option value="card">Digital</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Marca / Plataforma</span><select value={form.brand} onChange={e=>setForm({...form,brand:e.target.value as Product['brand']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option>PS5</option><option>PS4</option><option>Xbox</option><option>Multi</option></select></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Capacidad y especificaciones</span><input required value={form.specification} onChange={e=>setForm({...form,specification:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Consola: 1TB SSD · Juego: edición/plataforma · Accesorio: color/conectividad" /></label>
        <div className="sm:col-span-2">
          <span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Foto del producto · se muestra en el catálogo</span>
          <div className="flex items-start gap-4">
            <label className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[#6153d6] dark:hover:border-[#6153d6] bg-slate-50 dark:bg-slate-800/60 cursor-pointer transition-colors text-center">
              <Upload size={20} className="text-slate-400" />
              <span className="text-xs font-600 text-slate-600 dark:text-slate-300">{uploading ? 'Subiendo imagen...' : 'Click para subir una foto'}</span>
              <span className="text-[10px] text-slate-400">PNG, JPG o WebP · máx 5MB</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" disabled={uploading} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const url = await api.uploadImage(file);
                  setForm(current => ({ ...current, imageUrl: url }));
                } catch {
                  setError('No se pudo subir la imagen. Intenta con otra.');
                } finally { setUploading(false); }
              }} />
            </label>
            {form.imageUrl.trim() && <img src={form.imageUrl} alt="Vista previa" className="h-24 w-32 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />}
          </div>
        </div>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Stock inicial</span><input type="number" min="0" required value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Modalidad</span><select value={form.type} onChange={e=>setForm({...form,type:e.target.value as Product['type']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="both">Venta y alquiler</option><option value="sale">Solo venta</option><option value="rental">Solo alquiler</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Precio de venta</span><input type="number" min="0" value={form.salePrice} onChange={e=>setForm({...form,salePrice:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Tarifa de alquiler / mes</span><input type="number" min="0" value={form.rentalPrice} onChange={e=>setForm({...form,rentalPrice:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Precio de oferta (opcional · 0 = sin oferta)</span><input type="number" min="0" step="0.01" value={form.offerPrice} onChange={e=>setForm({...form,offerPrice:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-slate-900 dark:text-white" placeholder="Ej. 649.99" /></label>
        {error && <div className="sm:col-span-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="sm:col-span-2 flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">{editingId ? 'Guardar cambios' : 'Guardar producto'}</button></div>
      </form></div></div>}
    </div>
  );
}

// ─── Admin: Contact & Location ───────────────────────────────────────────────

function ContactLocationSection() {
  const [messages] = useApiData<ContactMessage[]>(api.contact.list, []);
  const [info, setInfo] = useState({
    address: 'Av. Principal, Urb. Las Palmas, Quinta 5, Caracas 1050, Venezuela',
    phone: '+58 (412) 555-1234',
    whatsapp: '+58 (414) 999-0011',
    email: 'contacto@luigidigital.com',
    hours: 'Lunes a Sábado: 9:00 AM - 7:00 PM',
  });
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Ubicación y Contacto"
        subtitle="Gestión de la ubicación del negocio, información de contacto y mensajes de clientes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Store Details & Interactive Map */}
        <div className="space-y-6">
          <div className="glow-card rounded-2xl p-6 bg-card">
            <h3 className="font-display text-lg font-600 text-gtext mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-blue" /> Ubicación en el Mapa
            </h3>
            <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative bg-slate-900">
              <iframe
                title="Mapa de Ubicación Luigi Digital"
                src="https://maps.google.com/maps?q=Caracas,Venezuela&t=&z=13&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
            <div className="mt-4 p-3 rounded-lg bg-surface flex items-start gap-3 text-xs text-muted">
              <Navigation size={16} className="text-blue flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-gtext block">Punto de referencia:</strong>
                A 50 metros del Centro Comercial, diagonal a la Estación de Metro. Estacionamiento privado disponible.
              </div>
            </div>
          </div>

          <div className="glow-card rounded-2xl p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-600 text-gtext flex items-center gap-2">
                <Phone size={18} className="text-purple-light" /> Datos de Contacto Público
              </h3>
              {savedNotice && <span className="text-xs text-success font-600">¡Guardado con éxito!</span>}
            </div>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Dirección del Local</label>
                <input
                  type="text"
                  value={info.address}
                  onChange={e => setInfo({ ...info, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Teléfono Fijo / Móvil</label>
                  <input
                    type="text"
                    value={info.phone}
                    onChange={e => setInfo({ ...info, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={info.whatsapp}
                    onChange={e => setInfo({ ...info, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={info.email}
                    onChange={e => setInfo({ ...info, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-600 text-slate-700 dark:text-slate-300 mb-1">Horario de Atención</label>
                  <input
                    type="text"
                    value={info.hours}
                    onChange={e => setInfo({ ...info, hours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:border-[#86CCC0] focus:ring-2 focus:ring-[#86CCC0]/20 transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-sm font-600 text-white bg-[#6153d6] hover:bg-[#5244be] transition-colors shadow-md"
              >
                Guardar Cambios de Contacto
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Customer Inquiries & Messages */}
        <div className="space-y-6">
          <div className="glow-card rounded-2xl p-6 bg-card">
            <h3 className="font-display text-lg font-600 text-gtext mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-amber-500" /> Mensajes de Clientes Recibidos
            </h3>
            <div className="space-y-3">
              {messages.map(m => (
                <div key={m.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-600 text-gtext text-sm">{m.name}</span>
                    <span className={`badge ${m.status === 'unread' ? 'badge-overdue' : m.status === 'read' ? 'badge-pending' : 'badge-active'}`}>
                      {m.status === 'unread' ? 'Nuevo' : m.status === 'read' ? 'Leído' : 'Respondido'}
                    </span>
                  </div>
                  <div className="text-xs text-muted flex items-center gap-3">
                    <span><Mail size={10} className="inline mr-1" />{m.email}</span>
                    <span><Phone size={10} className="inline mr-1" />{m.phone}</span>
                    <span className="ml-auto">{m.date}</span>
                  </div>
                  <div className="font-500 text-xs text-gtext mt-1">Asunto: {m.subject}</div>
                  <p className="text-xs text-muted bg-card p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700 leading-relaxed">
                    "{m.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────

const buildSidebarItems = (c: { clients: number; rentalsActive: number; sales: number; deliveriesPending: number; techActive: number; warrantiesActive: number; lowStock: number }): { key: AdminSection; label: string; icon: React.ReactNode; count?: number }[] => [
  { key: 'dashboard', label: 'Panel Principal', icon: <LayoutDashboard size={18} /> },
  { key: 'clients', label: 'Clientes', icon: <Users size={18} />, count: c.clients },
  { key: 'rentals', label: 'Alquileres', icon: <Gamepad2 size={18} />, count: c.rentalsActive },
  { key: 'sales', label: 'Ventas', icon: <ShoppingBag size={18} />, count: c.sales },
  { key: 'deliveries', label: 'Notas de Entrega', icon: <Truck size={18} />, count: c.deliveriesPending },
  { key: 'technical', label: 'Servicio Técnico', icon: <Wrench size={18} />, count: c.techActive },
  { key: 'warranties', label: 'Garantías', icon: <Shield size={18} />, count: c.warrantiesActive },
  { key: 'purchases', label: 'Inventario', icon: <Package size={18} />, count: c.lowStock },
  { key: 'contact', label: 'Ubicación y Contacto', icon: <MapPin size={18} /> },
];

function AdminLoginModal({ onLoginSuccess, navigateTo }: { onLoginSuccess: () => void; navigateTo: (v: View) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await api.auth.login(username.trim(), password);
      sessionStorage.setItem('admin_token', token);
      await alertSuccess('¡Bienvenido!', `Sesión iniciada como ${user?.name || username}`);
      onLoginSuccess();
    } catch (err) {
      const offline = !(err instanceof Error) || err.message === 'Failed to fetch';
      setPassword('');
      alertError(
        offline ? 'Sin conexión' : 'Credenciales incorrectas',
        offline ? 'No se pudo conectar con el servidor. Verifica que el backend esté activo.' : 'El usuario o la contraseña no son válidos. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2 bg-[var(--c-card)]">
      {/* Visual panel */}
      <div className="relative hidden lg:flex flex-col justify-end p-10 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1400&h=1600&fit=crop&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/10" />
        <div className="relative">
          <h2 className="font-display text-4xl font-700 text-white leading-tight max-w-md">Gestiona tu tienda gamer desde un solo lugar.</h2>
          <div className="grid grid-cols-2 gap-4 mt-8 max-w-lg">
            <div className="liquid-glass p-5">
              <div className="flex items-center gap-2 text-white font-600 text-sm"><Package size={16} /> Inventario</div>
              <p className="text-white/70 text-xs mt-2 leading-relaxed">Control de stock, precios y ofertas en tiempo real.</p>
            </div>
            <div className="liquid-glass p-5">
              <div className="flex items-center gap-2 text-white font-600 text-sm"><TrendingUp size={16} /> Ventas</div>
              <p className="text-white/70 text-xs mt-2 leading-relaxed">Ventas, alquileres y notas de entrega integradas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center mb-8">
            <Gamepad2 size={20} className="text-white dark:text-slate-900" />
          </div>
          <h1 className="font-display text-3xl font-700 text-gtext tracking-tight">Iniciar sesión</h1>
          <p className="text-sm text-muted mt-2">Accede al panel administrativo de Luigi Digital.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="login-user" className="block text-sm font-500 text-gtext mb-1.5">Usuario</label>
              <input id="login-user" type="text" required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--c-input-border)] bg-[var(--c-input-bg)] text-gtext" />
            </div>
            <div>
              <label htmlFor="login-pass" className="block text-sm font-500 text-gtext mb-1.5">Contraseña</label>
              <div className="relative">
                <input id="login-pass" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-lg border border-[var(--c-input-border)] bg-[var(--c-input-bg)] text-gtext" />
                <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-gtext">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button id="login-submit" type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-600 hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Lock size={15} />}
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          <button type="button" onClick={() => navigateTo('catalog')} className="mt-8 text-sm text-muted hover:text-gtext inline-flex items-center gap-1.5">
            <ChevronLeft size={15} /> Volver a la tienda
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminView({ navigateTo }: { navigateTo: (v: View) => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });

  const [section, setSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventory, setInventory] = useApiData<Product[]>(api.products.list, []);
  const [rentals, setRentals] = useApiData<Rental[]>(api.rentals.list, []);
  const [clientsList] = useApiData<Client[]>(api.clients.list, []);
  const [salesList] = useApiData<Sale[]>(api.sales.list, []);
  const [deliveriesList] = useApiData<DeliveryNote[]>(api.deliveries.list, []);
  const [servicesList] = useApiData<TechService[]>(api.techServices.list, []);
  const [warrantiesList] = useApiData<Warranty[]>(api.warranties.list, []);

  const SIDEBAR_ITEMS = buildSidebarItems({
    clients: clientsList.length,
    rentalsActive: rentals.filter(r=>r.status==='active').length,
    sales: salesList.length,
    deliveriesPending: deliveriesList.filter(d=>d.status==='pending').length,
    techActive: servicesList.filter(t=>t.status!=='delivered').length,
    warrantiesActive: warrantiesList.filter(w=>w.status==='active').length,
    lowStock: inventory.filter(p=>p.stock<=2).length,
  });

  const handleLoginSuccess = () => {
    sessionStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    if (!await confirmAction('¿Cerrar sesión?', 'Tendrás que ingresar tus credenciales nuevamente.', { confirmText: 'Sí, salir', danger: false })) return;
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    toast.success('Sesión cerrada correctamente');
  };

  // Etiqueta cada celda con su encabezado para que las tablas se apilen como tarjetas en móvil.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const label = () => root.querySelectorAll('table').forEach(table => {
      const heads = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() ?? '');
      table.querySelectorAll('tbody tr').forEach(tr => {
        Array.from(tr.children).forEach((td, i) => {
          if (heads[i] !== undefined && td.getAttribute('data-label') !== heads[i]) td.setAttribute('data-label', heads[i]);
        });
      });
    });
    label();
    const obs = new MutationObserver(label);
    obs.observe(root, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [isAuthenticated, section]);

  if (!isAuthenticated) {
    return <AdminLoginModal onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} />;
  }

  const SectionContent = {
    dashboard: <Dashboard />,
    clients: <ClientsSection />,
    rentals: <RentalsSection rentals={rentals} setRentals={setRentals} inventory={inventory} setInventory={setInventory} />,
    sales: <SalesSection inventory={inventory} setInventory={setInventory} />,
    deliveries: <DeliveriesSection inventory={inventory} />,
    technical: <TechnicalSection />,
    warranties: <WarrantiesSection inventory={inventory} />,
    purchases: <PurchasesSection inventory={inventory} setInventory={setInventory} />,
    contact: <ContactLocationSection />,
  }[section];

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col flex-shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ top: '64px', height: 'calc(100vh - 64px)' }}>
        <div className="sb-label px-5 pt-5 pb-2 text-[10px] font-700 tracking-[0.16em] uppercase">Menú principal</div>
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5">
          {SIDEBAR_ITEMS.map(item => {
            const active = section === item.key;
            return (
              <button key={item.key}
                onClick={() => { setSection(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active ? 'sb-item-active font-600' : 'sb-item'}`}>
                <span>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] font-700 px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'sb-count'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="sb-footer p-4 border-t flex flex-col gap-2">
          <button
            onClick={() => navigateTo('catalog')}
            className="w-full py-2.5 px-3 rounded-lg sb-btn transition-colors text-xs font-600 flex items-center justify-center gap-1.5"
          >
            <Layers size={14} /> Volver a la tienda
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-600 flex items-center justify-center gap-1.5"
          >
            <LogOut size={14} className="flex-shrink-0" /> Cerrar sesión
          </button>
          <div className="sb-label text-[10px] text-center mt-1">Luigi Digital v1.0 · Sistema de Gestión</div>
        </div>
      </aside>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto bg-bg">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-[rgba(139,92,246,0.1)]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-muted hover:text-gtext" style={{ background: 'rgba(139,92,246,0.08)' }}>
            <Menu size={18} />
          </button>
          <span className="text-sm font-600 text-gtext">{SIDEBAR_ITEMS.find(i=>i.key===section)?.label}</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          {SectionContent}
        </div>
      </main>
    </div>
  );
}

// ─── Top Navbar ───────────────────────────────────────────────────────────────

function Navbar({ navigateTo, darkMode, setDarkMode }: { navigateTo: (v: View) => void; darkMode: boolean; setDarkMode: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <header className="navbar-blur fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-6 gap-6 transition-colors duration-200">
      {/* Logo */}
      <div onClick={() => navigateTo('catalog')} className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#172033] dark:bg-indigo-600 shadow-md">
          <Gamepad2 size={19} className="text-white" />
        </div>
        <div>
          <div className="font-display font-700 text-gtext text-base leading-none">Luigi Digital</div>
          <div className="text-[10px] text-muted leading-none mt-0.5">Gaming Store</div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Animated 2-option Theme Switcher */}
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 relative text-xs font-600 shadow-inner select-none">
        {/* Sliding background pill indicator */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#6153d6] dark:bg-indigo-600 shadow-sm transition-all duration-300 ease-out ${
            darkMode ? 'left-[calc(50%+2px)]' : 'left-1'
          }`}
        />
        <button
          type="button"
          onClick={() => setDarkMode(false)}
          className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg transition-colors duration-200 ${
            !darkMode ? 'text-white font-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sun size={14} className={!darkMode ? 'text-amber-300' : ''} /> Claro
        </button>
        <button
          type="button"
          onClick={() => setDarkMode(true)}
          className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg transition-colors duration-200 ${
            darkMode ? 'text-white font-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Moon size={14} className={darkMode ? 'text-amber-300' : ''} /> Oscuro
        </button>
      </div>
    </header>

  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>(() => {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'catalog';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Modo Oscuro predeterminado
  });



  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handlePopState = () => {
      setView(window.location.pathname.startsWith('/admin') ? 'admin' : 'catalog');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newView: View) => {
    setView(newView);
    const newPath = newView === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  return (
    <div className="bg-bg min-h-screen text-gtext transition-colors duration-200">
      <Navbar navigateTo={navigateTo} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="pt-16">
        {view === 'catalog' ? <CatalogView /> : <AdminView navigateTo={navigateTo} />}
      </div>
    </div>
  );
}

