import { useState, useMemo } from 'react';
import {
  LayoutDashboard, Users, Gamepad2, ShoppingBag, Truck, Wrench, Shield, Package,
  Search, Plus, TrendingUp, Clock, AlertTriangle, CheckCircle2, Star, Tag,
  Phone, Mail, MapPin, Hash, DollarSign, ArrowUpRight, CreditCard,
  Menu, X, ChevronRight, Layers, RotateCcw, Clipboard, Monitor, Headphones, Gift, Disc3
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'catalog' | 'admin';
type AdminSection = 'dashboard' | 'clients' | 'rentals' | 'sales' | 'deliveries' | 'technical' | 'warranties' | 'purchases';
type CatalogCategory = 'all' | 'consoles' | 'accessories' | 'games' | 'cards';
type FilterType = 'all' | 'sale' | 'rental';

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
  date: string; subtotal: number; discount: number; total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
}

interface DeliveryNote {
  id: string; clientName: string; date: string; items: string[];
  address: string; deliveredBy: string; status: 'pending' | 'delivered' | 'failed'; notes: string;
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

interface Purchase {
  id: string; supplier: string; product: string; quantity: number;
  unitCost: number; total: number; date: string; invoiceNumber: string;
  status: 'received' | 'pending' | 'returned';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'PlayStation 5 Disc Edition', category: 'console', brand: 'PS5', salePrice: 750, rentalPrice: 25, type: 'both', image: 'https://images.unsplash.com/photo-1752262526779-bd65a9b83c25?w=720&h=520&fit=crop&auto=format', stock: 3, description: '825GB SSD · Ray Tracing · 4K@120fps · DualSense', featured: true },
  { id: 'p2', name: 'PlayStation 5 Digital', category: 'console', brand: 'PS5', salePrice: 620, rentalPrice: 20, type: 'both', image: 'https://images.unsplash.com/photo-1752262526779-bd65a9b83c25?w=720&h=520&fit=crop&auto=format', stock: 2, description: '825GB SSD · Sin lector de discos · 4K gaming' },
  { id: 'p3', name: 'PlayStation 4 Pro', category: 'console', brand: 'PS4', salePrice: 350, rentalPrice: 12, type: 'both', image: 'https://images.unsplash.com/photo-1606813907291-d86eff9d8afd?w=480&h=340&fit=crop&auto=format', stock: 5, description: '1TB HDD · 4K streaming · HDR · 1 control' },
  { id: 'p4', name: 'PlayStation 4 Slim', category: 'console', brand: 'PS4', salePrice: 280, rentalPrice: 10, type: 'both', image: 'https://images.unsplash.com/photo-1606813907291-d86eff9d8afd?w=480&h=340&fit=crop&auto=format', stock: 4, description: '500GB HDD · Diseño compacto · HDR' },
  { id: 'p5', name: 'Xbox Series X', category: 'console', brand: 'Xbox', salePrice: 720, rentalPrice: 23, type: 'both', image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=480&h=340&fit=crop&auto=format', stock: 2, description: '1TB NVMe · 4K@120fps · Quick Resume · Xbox Game Pass', featured: true },
  { id: 'p6', name: 'Xbox Series S', category: 'console', brand: 'Xbox', salePrice: 430, rentalPrice: 15, type: 'both', image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=480&h=340&fit=crop&auto=format', stock: 3, description: '512GB SSD · 1440p · All-digital · Compacto' },
  { id: 'p7', name: 'Control DualSense PS5', category: 'accessory', brand: 'PS5', salePrice: 90, type: 'sale', image: 'https://images.unsplash.com/photo-1754594207981-8b97210a6d3a?w=720&h=520&fit=crop&auto=format', stock: 8, description: 'Vibración háptica · Gatillos adaptativos · Blanco' },
  { id: 'p8', name: 'DualSense Edge PS5', category: 'accessory', brand: 'PS5', salePrice: 160, type: 'sale', image: 'https://images.unsplash.com/photo-1754594207981-8b97210a6d3a?w=720&h=520&fit=crop&auto=format', stock: 3, description: 'Control Pro · Perfiles personalizables · Back buttons', featured: true },
  { id: 'p9', name: 'Control DualShock 4 PS4', category: 'accessory', brand: 'PS4', salePrice: 55, type: 'sale', image: 'https://images.unsplash.com/photo-1754594207981-8b97210a6d3a?w=720&h=520&fit=crop&auto=format', stock: 10, description: 'Inalámbrico · Touchpad · Barra de luz LED' },
  { id: 'p10', name: 'Control Xbox Series', category: 'accessory', brand: 'Xbox', salePrice: 65, type: 'sale', image: 'https://images.unsplash.com/photo-1754594207981-8b97210a6d3a?w=720&h=520&fit=crop&auto=format', stock: 7, description: 'Bluetooth · Share button · USB-C' },
  { id: 'p11', name: 'Headset PULSE 3D PS5', category: 'accessory', brand: 'PS5', salePrice: 100, type: 'sale', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=480&h=340&fit=crop&auto=format', stock: 4, description: 'Audio 3D · Inalámbrico · Micrófono dual' },
  { id: 'p12', name: 'Headset Xbox Wireless', category: 'accessory', brand: 'Xbox', salePrice: 95, type: 'sale', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=480&h=340&fit=crop&auto=format', stock: 5, description: 'Dolby Atmos · Bluetooth + Xbox Wireless' },
  { id: 'p13', name: 'Spider-Man 2 PS5', category: 'game', brand: 'PS5', salePrice: 70, rentalPrice: 5, type: 'both', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=480&h=340&fit=crop&auto=format', stock: 6, description: "Marvel's Spider-Man 2 · Acción/Aventura" },
  { id: 'p14', name: "God of War Ragnarök", category: 'game', brand: 'PS5', salePrice: 65, rentalPrice: 5, type: 'both', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=480&h=340&fit=crop&auto=format', stock: 4, description: 'PS4/PS5 · Acción · GOTY 2022' },
  { id: 'p15', name: 'Hogwarts Legacy PS5', category: 'game', brand: 'PS5', salePrice: 60, rentalPrice: 4, type: 'both', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=480&h=340&fit=crop&auto=format', stock: 5, description: 'RPG · Mundo abierto · Harry Potter' },
  { id: 'p16', name: 'Mortal Kombat 1 Xbox', category: 'game', brand: 'Xbox', salePrice: 60, rentalPrice: 4, type: 'both', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=480&h=340&fit=crop&auto=format', stock: 3, description: 'Peleas · Multijugador · Xbox Series X|S' },
  { id: 'p17', name: 'Tarjeta PSN $10', category: 'card', brand: 'PS5', salePrice: 11.5, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 25, description: 'PlayStation Store · Código digital · USA' },
  { id: 'p18', name: 'Tarjeta PSN $20', category: 'card', brand: 'PS5', salePrice: 23, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 20, description: 'PlayStation Store · Código digital · USA' },
  { id: 'p19', name: 'Tarjeta PSN $50', category: 'card', brand: 'PS5', salePrice: 56, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 12, description: 'PlayStation Store · Código digital · USA', featured: true },
  { id: 'p20', name: 'Game Pass Ultimate 1 mes', category: 'card', brand: 'Xbox', salePrice: 18, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 15, description: 'Xbox + PC · EA Play incluido · Online' },
  { id: 'p21', name: 'Game Pass Ultimate 3 meses', category: 'card', brand: 'Xbox', salePrice: 48, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 8, description: 'Xbox + PC · EA Play · 3 meses', featured: true },
  { id: 'p22', name: 'Xbox Gift Card $25', category: 'card', brand: 'Xbox', salePrice: 28, type: 'sale', image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=480&h=340&fit=crop&auto=format', stock: 18, description: 'Microsoft Store · Código digital · USA' },
];

const CLIENTS: Client[] = [
  { id: 'c1', name: 'Carlos Mendoza', phone: '0412-555-1234', email: 'carlos.m@gmail.com', cedula: 'V-12345678', address: 'Av. Principal, Urb. Las Palmas, Qta 5', joinDate: '2024-01-15', status: 'active' },
  { id: 'c2', name: 'María García', phone: '0424-555-5678', email: 'maria.g@gmail.com', cedula: 'V-23456789', address: 'Calle 5, Urb. El Paraíso, Casa 12', joinDate: '2024-02-20', status: 'active' },
  { id: 'c3', name: 'José Rodríguez', phone: '0416-555-9012', email: 'jose.r@gmail.com', cedula: 'V-34567890', address: 'Torre Central, Piso 3, Apt 3B', joinDate: '2024-03-10', status: 'active' },
  { id: 'c4', name: 'Ana Martínez', phone: '0414-555-3456', email: 'ana.m@hotmail.com', cedula: 'V-45678901', address: 'Sector Norte, Casa 15', joinDate: '2024-01-05', status: 'inactive' },
  { id: 'c5', name: 'Luis Pérez', phone: '0426-555-7890', email: 'luis.p@gmail.com', cedula: 'V-56789012', address: 'Urb. Oeste, Qta 8, Calle Mango', joinDate: '2024-04-18', status: 'active' },
  { id: 'c6', name: 'Sofía Torres', phone: '0412-555-2468', email: 'sofia.t@gmail.com', cedula: 'V-67890123', address: 'Res. Las Américas, Piso 7, Apt 7A', joinDate: '2024-05-22', status: 'active' },
];

const RENTALS: Rental[] = [
  { id: 'r1', clientName: 'Carlos Mendoza', product: 'PlayStation 5 Disc Edition', startDate: '2024-09-20', dueDate: '2024-09-27', dailyRate: 25, totalDays: 7, amount: 175, status: 'active', deposit: 100 },
  { id: 'r2', clientName: 'María García', product: 'PlayStation 4 Pro', startDate: '2024-09-18', dueDate: '2024-09-22', returnDate: '2024-09-22', dailyRate: 12, totalDays: 4, amount: 48, status: 'returned', deposit: 50 },
  { id: 'r3', clientName: 'José Rodríguez', product: 'Xbox Series X', startDate: '2024-09-15', dueDate: '2024-09-22', dailyRate: 23, totalDays: 7, amount: 161, status: 'overdue', deposit: 100 },
  { id: 'r4', clientName: 'Luis Pérez', product: "Spider-Man 2 PS5", startDate: '2024-09-23', dueDate: '2024-09-25', dailyRate: 5, totalDays: 2, amount: 10, status: 'active', deposit: 20 },
  { id: 'r5', clientName: 'Sofía Torres', product: 'PlayStation 5 Digital', startDate: '2024-09-10', dueDate: '2024-09-17', returnDate: '2024-09-17', dailyRate: 20, totalDays: 7, amount: 140, status: 'returned', deposit: 80 },
  { id: 'r6', clientName: 'Ana Martínez', product: 'PlayStation 4 Slim', startDate: '2024-09-01', dueDate: '2024-09-05', returnDate: '2024-09-05', dailyRate: 10, totalDays: 4, amount: 40, status: 'returned', deposit: 40 },
];

const SALES: Sale[] = [
  { id: 's1', clientName: 'Carlos Mendoza', products: ['Control DualSense PS5', 'Tarjeta PSN $20'], date: '2024-09-22', subtotal: 113, discount: 6, total: 107, paymentMethod: 'cash' },
  { id: 's2', clientName: 'María García', products: ['PlayStation 4 Slim'], date: '2024-09-20', subtotal: 280, discount: 0, total: 280, paymentMethod: 'transfer' },
  { id: 's3', clientName: 'Ana Martínez', products: ['Game Pass Ultimate 3 meses', 'Xbox Gift Card $25'], date: '2024-09-19', subtotal: 76, discount: 0, total: 76, paymentMethod: 'card' },
  { id: 's4', clientName: 'Sofía Torres', products: ['DualSense Edge PS5'], date: '2024-09-18', subtotal: 160, discount: 10, total: 150, paymentMethod: 'transfer' },
  { id: 's5', clientName: 'Luis Pérez', products: ['Tarjeta PSN $50', 'Tarjeta PSN $20'], date: '2024-09-17', subtotal: 79, discount: 0, total: 79, paymentMethod: 'cash' },
];

const DELIVERIES: DeliveryNote[] = [
  { id: 'nd1', clientName: 'Carlos Mendoza', date: '2024-09-22', items: ['PlayStation 5 Disc Edition', 'Control DualSense PS5'], address: 'Av. Principal, Urb. Las Palmas, Qta 5', deliveredBy: 'Pedro Gómez', status: 'delivered', notes: 'Entregado en perfectas condiciones. Firmado.' },
  { id: 'nd2', clientName: 'José Rodríguez', date: '2024-09-25', items: ['Xbox Series X', 'Control Xbox Series'], address: 'Torre Central, Piso 3, Apt 3B', deliveredBy: 'Juan Castro', status: 'pending', notes: 'Llamar antes de llegar. Portero eléctrico.' },
  { id: 'nd3', clientName: 'Sofía Torres', date: '2024-09-20', items: ['DualSense Edge PS5'], address: 'Res. Las Américas, Piso 7, Apt 7A', deliveredBy: 'Pedro Gómez', status: 'delivered', notes: '' },
  { id: 'nd4', clientName: 'Ana Martínez', date: '2024-09-23', items: ['Tarjeta PSN $50 x2'], address: 'Sector Norte, Casa 15', deliveredBy: 'Juan Castro', status: 'failed', notes: 'Nadie en casa. Se reprograma para mañana.' },
];

const TECH_SERVICES: TechService[] = [
  { id: 'ts1', clientName: 'Carlos Mendoza', device: 'PlayStation 4 Pro', issue: 'No enciende · Error CE-34878-0', receiveDate: '2024-09-18', estimatedDate: '2024-09-25', technician: 'Miguel Ángel', cost: 45, status: 'repairing', notes: 'Fuente de poder dañada. Esperando repuesto.' },
  { id: 'ts2', clientName: 'Ana Martínez', device: 'Xbox One S', issue: 'Lector de disco no reconoce juegos', receiveDate: '2024-09-20', estimatedDate: '2024-09-23', returnDate: '2024-09-23', technician: 'Miguel Ángel', cost: 60, status: 'delivered', notes: 'Limpieza y calibración de lentes. Listo.' },
  { id: 'ts3', clientName: 'Luis Pérez', device: 'DualSense PS5', issue: 'Stick izquierdo con drift', receiveDate: '2024-09-24', estimatedDate: '2024-09-26', technician: 'Roberto Silva', cost: 30, status: 'diagnosing', notes: '' },
  { id: 'ts4', clientName: 'José Rodríguez', device: 'PlayStation 5 Disc Edition', issue: 'Ruido al leer discos · vibración excesiva', receiveDate: '2024-09-22', estimatedDate: '2024-09-28', technician: 'Miguel Ángel', cost: 55, status: 'received', notes: 'En revisión inicial.' },
  { id: 'ts5', clientName: 'Sofía Torres', device: 'Control Xbox Series', issue: 'Botón RB no responde', receiveDate: '2024-09-21', estimatedDate: '2024-09-24', returnDate: '2024-09-24', technician: 'Roberto Silva', cost: 20, status: 'ready', notes: 'Soldadura realizada. Listo para entrega.' },
];

const WARRANTIES: Warranty[] = [
  { id: 'w1', clientName: 'Carlos Mendoza', product: 'PlayStation 5 Disc Edition', serial: 'CF12345678', purchaseDate: '2024-01-15', expiryDate: '2025-01-15', status: 'active', type: 'store' },
  { id: 'w2', clientName: 'María García', product: 'PlayStation 4 Slim', serial: 'GH98765432', purchaseDate: '2024-03-10', expiryDate: '2025-03-10', status: 'active', type: 'manufacturer' },
  { id: 'w3', clientName: 'José Rodríguez', product: 'Xbox Series X', serial: 'XB11223344', purchaseDate: '2023-06-20', expiryDate: '2024-06-20', status: 'expired', type: 'store' },
  { id: 'w4', clientName: 'Sofía Torres', product: 'DualSense Edge PS5', serial: 'DE55667788', purchaseDate: '2024-09-18', expiryDate: '2025-09-18', status: 'active', type: 'store' },
  { id: 'w5', clientName: 'Ana Martínez', product: 'Xbox One S', serial: 'XO99887766', purchaseDate: '2022-11-05', expiryDate: '2023-11-05', status: 'claimed', type: 'manufacturer' },
];

const PURCHASES: Purchase[] = [
  { id: 'pc1', supplier: 'TechVenezuela Dist.', product: 'PlayStation 5 Disc Edition', quantity: 5, unitCost: 620, total: 3100, date: '2024-09-01', invoiceNumber: 'FAC-2024-0891', status: 'received' },
  { id: 'pc2', supplier: 'GameWorld Import C.A.', product: 'Xbox Series X', quantity: 3, unitCost: 590, total: 1770, date: '2024-09-10', invoiceNumber: 'FAC-2024-0945', status: 'received' },
  { id: 'pc3', supplier: 'CardPlus Venezuela', product: 'Tarjetas PSN $20 (lote x50)', quantity: 50, unitCost: 19, total: 950, date: '2024-09-20', invoiceNumber: 'FAC-2024-1023', status: 'received' },
  { id: 'pc4', supplier: 'TechVenezuela Dist.', product: 'Control DualSense PS5 x10', quantity: 10, unitCost: 72, total: 720, date: '2024-09-22', invoiceNumber: 'FAC-2024-1045', status: 'pending' },
  { id: 'pc5', supplier: 'CardPlus Venezuela', product: 'Game Pass Ultimate 1 mes x20', quantity: 20, unitCost: 14, total: 280, date: '2024-09-23', invoiceNumber: 'FAC-2024-1067', status: 'pending' },
  { id: 'pc6', supplier: 'ConsoleHub Import', product: 'PlayStation 5 Digital', quantity: 2, unitCost: 500, total: 1000, date: '2024-08-28', invoiceNumber: 'FAC-2024-0820', status: 'returned' },
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
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Buscar...'}
        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-gtext placeholder:text-muted focus:outline-none"
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

// ─── Catalog View ─────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todos', consoles: 'Consolas', accessories: 'Accesorios', games: 'Juegos', cards: 'Tarjetas'
};

const CAT_MAP: Record<string, string> = { consoles: 'console', accessories: 'accessory', games: 'game', cards: 'card' };

function ProductArtwork({ product }: { product: Product }) {
  return (
    <div className="product-art relative h-52 overflow-hidden bg-slate-100">
      <img
        src={product.image}
        alt={`Imagen referencial de ${product.name}`}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-white/5" />
      <div className="absolute top-4 left-4 px-2 py-1 rounded-full bg-white/90 backdrop-blur text-[9px] font-700 tracking-[0.16em] text-slate-700">
        {product.category === 'card' ? 'ENTREGA DIGITAL' : 'IMAGEN REFERENCIAL'}
      </div>
    </div>
  );
}

const PRODUCT_DISCOUNTS: Record<string, number> = { p1: 12, p5: 10, p8: 15, p11: 8, p14: 18, p19: 10, p21: 12 };

function ProductCard({ product }: { product: Product }) {
  const brandBadge = product.brand === 'PS5' ? 'ps5' : product.brand === 'PS4' ? 'ps4' : product.brand === 'Xbox' ? 'xbox' : 'multi';
  const typeBadge = product.type === 'sale' ? 'sale' : product.type === 'rental' ? 'rental' : 'both';
  const discount = PRODUCT_DISCOUNTS[product.id];
  const originalPrice = product.salePrice && discount ? product.salePrice / (1 - discount / 100) : undefined;

  return (
    <div className="glow-card product-card rounded-2xl overflow-hidden bg-card flex flex-col group cursor-pointer">
      <div className="relative">
        <ProductArtwork product={product} />
        {discount ? (
          <div className="absolute top-4 right-4 px-2.5 py-1.5 rounded-full text-[10px] font-700 text-white bg-red-600 shadow-lg shadow-red-950/15">
            -{discount}% OFF
          </div>
        ) : product.featured && (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-700 text-amber-700 bg-amber-50 border border-amber-200">
            <Star size={10} fill="currentColor" /> SELECCIÓN
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <Badge cls={brandBadge}>{product.brand}</Badge>
        </div>
        {product.stock <= 2 && (
          <div className="absolute bottom-4 right-4">
            <span className="badge bg-red-50 text-red-700 border border-red-200">Últimas unidades</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-600 text-gtext text-[15px] leading-tight">{product.name}</h3>
          <Badge cls={typeBadge}>{typeBadge === 'both' ? 'Venta/Alquiler' : typeBadge === 'sale' ? 'Venta' : 'Alquiler'}</Badge>
        </div>
        <p className="text-xs text-muted leading-relaxed">{product.description}</p>

        <div className="mt-auto pt-3 border-t border-[rgba(139,92,246,0.1)] flex flex-col gap-1">
          {product.salePrice && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted flex items-center gap-1"><Tag size={11} /> Venta</span>
              <span className="flex items-baseline gap-2">
                {originalPrice && <span className="text-[11px] text-slate-400 line-through">{fmtMoney(originalPrice)}</span>}
                <span className="font-display font-700 text-blue" style={{ fontSize: '17px' }}>{fmtMoney(product.salePrice)}</span>
              </span>
            </div>
          )}
          {product.rentalPrice && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted flex items-center gap-1"><Clock size={11} /> Alquiler/día</span>
              <span className="font-display font-600 text-purple-light" style={{ fontSize: '15px' }}>{fmtMoney(product.rentalPrice)}</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-muted">Stock: <span className="text-gtext font-600">{product.stock}</span></span>
            <button className="text-[12px] font-600 text-blue hover:text-blue-light transition-colors flex items-center gap-0.5">
              Ver detalle <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogView() {
  const [category, setCategory] = useState<CatalogCategory>('all');
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (category !== 'all' && p.category !== CAT_MAP[category]) return false;
      if (filter === 'sale' && p.type === 'rental') return false;
      if (filter === 'rental' && p.type === 'sale') return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category, filter, search]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 85% 20%, rgba(37,99,235,0.07), transparent 28%), radial-gradient(circle at 72% 85%, rgba(109,92,231,0.06), transparent 30%)'
        }} />
        <div className="relative max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] items-center gap-10 lg:gap-14">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-5">
                <span className="badge badge-sale">Colección 2026</span>
                <span className="text-xs text-muted">Equipos seleccionados</span>
              </div>
              <h1 className="font-display font-700 text-4xl md:text-5xl lg:text-[56px] text-gtext leading-[1.04] mb-5 tracking-[-0.035em]">
                Tu próxima partida empieza <span className="text-blue">aquí.</span>
              </h1>
              <p className="text-muted text-base md:text-lg leading-relaxed max-w-lg">
                Consolas, controles y videojuegos seleccionados para ofrecer rendimiento, garantía y una experiencia de compra especializada.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <button onClick={() => setCategory('consoles')} className="px-5 py-3 rounded-xl bg-[#172033] text-white text-sm font-600 hover:bg-[#273249] transition-colors">
                  Explorar consolas
                </button>
                <button onClick={() => setCategory('accessories')} className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-gtext text-sm font-600 hover:border-slate-300 transition-colors">
                  Ver accesorios
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-9 pt-6 border-t border-slate-200">
                <div><strong className="block font-display text-xl text-gtext">22+</strong><span className="text-xs text-muted">Productos</span></div>
                <div><strong className="block font-display text-xl text-gtext">12 meses</strong><span className="text-xs text-muted">Garantía</span></div>
                <div><strong className="block font-display text-xl text-gtext">Soporte</strong><span className="text-xs text-muted">Especializado</span></div>
              </div>
            </div>

            <div className="relative lg:min-h-[430px]">
              <div className="hero-photo relative h-[340px] sm:h-[420px] overflow-hidden rounded-[28px] bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1100&h=850&fit=crop&auto=format"
                  alt="Consola PlayStation 5 y control DualSense"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                <div className="absolute left-6 bottom-6 text-white">
                  <span className="text-[10px] font-700 tracking-[0.18em] opacity-70">DESTACADO</span>
                  <div className="font-display text-2xl font-600 mt-1">PlayStation 5</div>
                  <div className="text-sm text-white/70 mt-1">Potencia de nueva generación</div>
                </div>
              </div>
              <div className="absolute -left-4 sm:-left-7 top-8 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue flex items-center justify-center"><Gamepad2 size={20} /></div>
                <div><div className="text-xs text-muted">Disponible para</div><div className="text-sm font-600 text-gtext">Venta y alquiler</div></div>
              </div>
              <div className="absolute -right-2 sm:-right-5 bottom-8 bg-white/95 backdrop-blur rounded-2xl border border-white shadow-xl shadow-slate-900/10 px-4 py-3">
                <div className="flex items-center gap-1 text-amber-500 mb-1"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                <div className="text-xs font-600 text-gtext">Productos verificados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-[64px] z-10 border-b border-slate-200" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-3">
            {/* Category tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              {(Object.keys(CATEGORY_LABELS) as CatalogCategory[]).map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-500 transition-all ${category === cat ? 'text-white' : 'text-muted hover:text-gtext'}`}
                  style={category === cat ? { background: '#172033', boxShadow: '0 2px 5px rgba(15,23,42,0.12)' } : { background: '#f1f5f9' }}>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
              {/* Type filter */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)' }}>
                {(['all', 'sale', 'rental'] as FilterType[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-md text-xs font-500 transition-all ${filter === f ? 'text-white' : 'text-muted hover:text-gtext'}`}
                    style={filter === f ? { background: 'rgba(56,189,248,0.2)', color: '#7dd3fc' } : {}}>
                    {f === 'all' ? 'Todos' : f === 'sale' ? 'Venta' : 'Alquiler'}
                  </button>
                ))}
              </div>
              {/* Search */}
              <SearchBar value={search} onChange={setSearch} placeholder="Buscar producto..." />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted">{filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-muted">
            <Gamepad2 size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">No se encontraron productos</p>
            <p className="text-sm mt-1">Intenta con otra búsqueda o categoría</p>
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

function Dashboard() {
  const stats = [
    { label: 'Clientes Registrados', value: CLIENTS.length, sub: `${CLIENTS.filter(c=>c.status==='active').length} activos`, icon: <Users size={20} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Alquileres Activos', value: RENTALS.filter(r=>r.status==='active').length, sub: `${RENTALS.filter(r=>r.status==='overdue').length} en mora`, icon: <Gamepad2 size={20} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
    { label: 'Ingresos del Mes', value: fmtMoney(SALES.reduce((s,x)=>s+x.total,0)), sub: `${SALES.length} ventas`, icon: <DollarSign size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)', isText: true },
    { label: 'En Servicio Técnico', value: TECH_SERVICES.filter(t=>!['delivered'].includes(t.status)).length, sub: `${TECH_SERVICES.filter(t=>t.status==='ready').length} listos para entrega`, icon: <Wrench size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
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
            {RENTALS.slice(0, 4).map(r => (
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
            {TECH_SERVICES.filter(t => t.status !== 'delivered').map(t => (
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
      {(RENTALS.some(r=>r.status==='overdue') || TECH_SERVICES.some(t=>t.status==='ready')) && (
        <div className="bg-card rounded-xl p-5" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
          <h3 className="font-display font-600 text-warning mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Alertas Pendientes
          </h3>
          <div className="space-y-2">
            {RENTALS.filter(r=>r.status==='overdue').map(r => (
              <div key={r.id} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <AlertTriangle size={13} className="text-danger flex-shrink-0" />
                <span className="text-gtext">Alquiler en mora: <span className="font-600">{r.clientName}</span> – {r.product}</span>
              </div>
            ))}
            {TECH_SERVICES.filter(t=>t.status==='ready').map(t => (
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
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.cedula.includes(search));

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setErrors({});
  };

  const saveClient = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Ingresa el nombre completo';
    if (!/^[VEJ]-?\d{6,9}$/i.test(form.cedula.trim())) nextErrors.cedula = 'Usa un formato como V-12345678';
    if (form.phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Ingresa un teléfono válido';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Ingresa un correo válido';
    if (form.address.trim().length < 8) nextErrors.address = 'Completa la dirección';
    if (clients.some(c => c.cedula.toLowerCase() === form.cedula.trim().toLowerCase())) nextErrors.cedula = 'Esta cédula ya está registrada';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setClients(current => [{
      id: `c${Date.now()}`,
      name: form.name.trim(),
      cedula: form.cedula.trim().toUpperCase(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      address: form.address.trim(),
      status: form.status,
      joinDate: new Date().toISOString().slice(0, 10),
    }, ...current]);
    closeModal();
  };

  const fieldClass = (field: string) => `w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm text-gtext placeholder:text-slate-400 transition-shadow ${errors[field] ? 'border-red-300' : 'border-slate-200'}`;

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
                {['Cliente', 'Cédula', 'Teléfono', 'Email', 'Dirección', 'Desde', 'Estado'].map(h => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button aria-label="Cerrar modal" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={closeModal} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-950/25">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#2563eb]" />
            <div className="flex items-start justify-between px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f1efff] text-[#6153d6] flex items-center justify-center"><Users size={22} /></div>
                <div>
                  <div className="text-[11px] font-700 tracking-[0.14em] text-[#6153d6] uppercase">Gestión de clientes</div>
                  <h3 className="font-display text-2xl font-700 text-gtext mt-1">Registrar nuevo cliente</h3>
                  <p className="text-sm text-muted mt-1">Completa la información para crear su perfil comercial.</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X size={19} /></button>
            </div>

            <form onSubmit={saveClient} className="px-6 sm:px-8 py-6">
              <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
                <label className="sm:col-span-2">
                  <span className="block text-xs font-600 text-slate-700 mb-2">Nombre completo</span>
                  <input autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={fieldClass('name')} placeholder="Ej. Andrea Ramírez" />
                  {errors.name && <span className="block text-xs text-red-600 mt-1.5">{errors.name}</span>}
                </label>
                <label>
                  <span className="block text-xs font-600 text-slate-700 mb-2">Documento de identidad</span>
                  <input value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} className={fieldClass('cedula')} placeholder="V-12345678" />
                  {errors.cedula && <span className="block text-xs text-red-600 mt-1.5">{errors.cedula}</span>}
                </label>
                <label>
                  <span className="block text-xs font-600 text-slate-700 mb-2">Teléfono</span>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={fieldClass('phone')} placeholder="0412-000-0000" />
                  {errors.phone && <span className="block text-xs text-red-600 mt-1.5">{errors.phone}</span>}
                </label>
                <label>
                  <span className="block text-xs font-600 text-slate-700 mb-2">Correo electrónico</span>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={fieldClass('email')} placeholder="cliente@correo.com" />
                  {errors.email && <span className="block text-xs text-red-600 mt-1.5">{errors.email}</span>}
                </label>
                <label>
                  <span className="block text-xs font-600 text-slate-700 mb-2">Estado inicial</span>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Client['status'] })} className={fieldClass('status')}>
                    <option value="active">Cliente activo</option>
                    <option value="inactive">Cliente inactivo</option>
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="block text-xs font-600 text-slate-700 mb-2">Dirección de residencia o entrega</span>
                  <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={`${fieldClass('address')} min-h-24 resize-none`} placeholder="Urbanización, calle, edificio o casa y referencias" />
                  {errors.address && <span className="block text-xs text-red-600 mt-1.5">{errors.address}</span>}
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100">
                <p className="text-xs text-muted">El cliente se añadirá temporalmente a esta sesión.</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-600 text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5]">Guardar cliente</button>
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
  const rentableProducts = inventory.filter(p => p.rentalPrice && p.stock > 0 && p.type !== 'sale');
  const selectedProduct = inventory.find(p => p.id === form.productId);
  const dueDate = new Date(`${form.startDate}T12:00:00`);
  dueDate.setDate(dueDate.getDate() + Number(form.days || 0));
  const total = (selectedProduct?.rentalPrice ?? 0) * Number(form.days || 0);
  const filtered = rentals.filter(r => {
    if (statusF !== 'all' && r.status !== statusF) return false;
    if (search && !r.clientName.toLowerCase().includes(search.toLowerCase()) && !r.product.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const saveRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !selectedProduct || form.days < 1) return;
    setRentals(current => [{ id: `r${Date.now()}`, clientName: form.clientName, product: selectedProduct.name, startDate: form.startDate, dueDate: dueDate.toISOString().slice(0, 10), dailyRate: selectedProduct.rentalPrice!, totalDays: Number(form.days), amount: total, status: 'active', deposit: Number(form.deposit) }, ...current]);
    setInventory(current => current.map(p => p.id === selectedProduct.id ? { ...p, stock: p.stock - 1 } : p));
    setForm({ clientName: '', productId: '', startDate: today, days: 1, deposit: 0 });
    setModalOpen(false);
  };

  return (
    <div>
      <SectionHeader title="Alquileres" subtitle={`${rentals.filter(r=>r.status==='active').length} activos · ${rentals.filter(r=>r.status==='overdue').length} en mora`} action={<AddBtn label="Nuevo Alquiler" onClick={() => setModalOpen(true)} />} />
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
                {['ID', 'Cliente', 'Producto', 'Inicio', 'Vence', 'Días', 'Tarifa/día', 'Total', 'Depósito', 'Estado'].map(h => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <button aria-label="Cerrar" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#2563eb]" />
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100">
              <div className="flex gap-4"><div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue flex items-center justify-center"><Gamepad2 size={22} /></div><div><div className="text-[11px] font-700 tracking-[.14em] text-blue uppercase">Operación de inventario</div><h3 className="font-display text-2xl font-700 text-gtext mt-1">Registrar nuevo alquiler</h3><p className="text-sm text-muted mt-1">Selecciona un artículo disponible y configura la operación.</p></div></div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={19} /></button>
            </div>
            <form onSubmit={saveRental} className="p-7">
              <div className="grid sm:grid-cols-2 gap-5">
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 mb-2">Cliente</span><select required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">Seleccionar cliente registrado</option>{CLIENTS.filter(c=>c.status==='active').map(c=><option key={c.id}>{c.name}</option>)}</select></label>
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 mb-2">Producto del inventario</span><select required value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">Seleccionar producto disponible</option>{rentableProducts.map(p=><option key={p.id} value={p.id}>{p.name} · Stock {p.stock} · {fmtMoney(p.rentalPrice!)}/día</option>)}</select></label>
                {selectedProduct && <div className="sm:col-span-2 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4"><div><span className="block text-[10px] text-muted uppercase">Tipo</span><strong className="text-sm text-gtext">{selectedProduct.category === 'console' ? 'Consola' : selectedProduct.category === 'game' ? 'Juego' : 'Accesorio'}</strong></div><div><span className="block text-[10px] text-muted uppercase">Especificación</span><strong className="text-sm text-gtext">{selectedProduct.description.split('·')[0]}</strong></div><div><span className="block text-[10px] text-muted uppercase">Disponibles</span><strong className="text-sm text-success">{selectedProduct.stock} unidades</strong></div></div>}
                <label><span className="block text-xs font-600 text-slate-700 mb-2">Fecha de inicio</span><input type="date" required value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label>
                <label><span className="block text-xs font-600 text-slate-700 mb-2">Duración en días</span><input type="number" min="1" required value={form.days} onChange={e=>setForm({...form,days:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label>
                <label><span className="block text-xs font-600 text-slate-700 mb-2">Depósito de garantía</span><input type="number" min="0" value={form.deposit} onChange={e=>setForm({...form,deposit:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label>
                <div className="rounded-2xl bg-[#172033] text-white p-4"><span className="block text-xs text-white/60">Total estimado · vence {dueDate.toLocaleDateString('es-VE')}</span><strong className="font-display text-2xl">{fmtMoney(total)}</strong></div>
              </div>
              <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-600">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20">Confirmar alquiler</button></div>
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
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [error, setError] = useState('');
  const saleableProducts = inventory.filter(p => p.salePrice && p.stock > 0 && p.type !== 'rental');
  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => ({ product: inventory.find(p=>p.id===id)!, qty }));
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.salePrice ?? 0) * item.qty, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const filtered = sales.filter(s => !search || s.clientName.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);
  const setQuantity = (product: Product, quantity: number) => setCart(current => ({ ...current, [product.id]: Math.max(0, Math.min(product.stock, quantity)) }));
  const saveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !cartItems.length) { setError('Selecciona un cliente y agrega al menos un producto.'); return; }
    if (discount > subtotal) { setError('El descuento no puede superar el subtotal.'); return; }
    setSales(current => [{ id: `s${Date.now()}`, clientName, products: cartItems.map(({product,qty})=>`${product.name}${qty>1?` x${qty}`:''}`), date: today, subtotal, discount: Number(discount), total, paymentMethod }, ...current]);
    setInventory(current => current.map(p => cart[p.id] ? { ...p, stock: p.stock - cart[p.id] } : p));
    setClientName(''); setCart({}); setDiscount(0); setPaymentMethod('cash'); setError(''); setModalOpen(false);
  };

  return (
    <div>
      <SectionHeader title="Ventas" subtitle={`${sales.length} ventas · Total: ${fmtMoney(sales.reduce((s,x)=>s+x.total,0))}`} action={<AddBtn label="Nueva Venta" onClick={()=>setModalOpen(true)} />} />
      <div className="grid grid-cols-3 gap-4 mb-6">
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
                {['ID', 'Cliente', 'Productos', 'Fecha', 'Subtotal', 'Descuento', 'Total', 'Método'].map(h => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#2563eb]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShoppingBag size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-emerald-600 uppercase">Punto de venta</div><h3 className="font-display text-2xl font-700 text-gtext mt-1">Registrar nueva venta</h3><p className="text-sm text-muted mt-1">Agrega productos, valida existencias y confirma el pago.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
      <form onSubmit={saveSale} className="p-7"><div className="grid lg:grid-cols-[1.35fr_.75fr] gap-7"><div><label><span className="block text-xs font-600 text-slate-700 mb-2">Cliente</span><select required value={clientName} onChange={e=>setClientName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">Seleccionar cliente</option>{CLIENTS.filter(c=>c.status==='active').map(c=><option key={c.id}>{c.name}</option>)}</select></label><div className="mt-5 rounded-2xl border border-slate-200 overflow-hidden"><div className="px-4 py-3 bg-slate-50 border-b border-slate-200"><strong className="text-sm text-gtext">Productos disponibles</strong><span className="block text-xs text-muted">Define la cantidad de cada artículo</span></div><div className="max-h-[410px] overflow-y-auto divide-y divide-slate-100">{saleableProducts.map(p=><div key={p.id} className="flex items-center gap-4 px-4 py-3"><div className="flex-1 min-w-0"><span className="block text-sm font-600 text-gtext truncate">{p.name}</span><span className="text-xs text-muted">{p.brand} · Stock {p.stock}</span></div><strong className="text-sm text-blue">{fmtMoney(p.salePrice!)}</strong><div className="flex items-center rounded-lg border border-slate-200 overflow-hidden"><button type="button" onClick={()=>setQuantity(p,(cart[p.id]||0)-1)} className="w-8 h-8 text-slate-500 hover:bg-slate-100">−</button><span className="w-8 text-center text-sm font-600">{cart[p.id]||0}</span><button type="button" onClick={()=>setQuantity(p,(cart[p.id]||0)+1)} className="w-8 h-8 text-slate-500 hover:bg-slate-100">+</button></div></div>)}</div></div></div>
      <div><div className="sticky top-0 rounded-2xl bg-[#172033] text-white p-5"><div className="text-[11px] font-700 tracking-[.14em] text-white/50 uppercase">Resumen de venta</div><div className="mt-5 space-y-3 max-h-44 overflow-y-auto">{cartItems.length?cartItems.map(({product,qty})=><div key={product.id} className="flex justify-between gap-3 text-sm"><span className="text-white/70 truncate">{qty}× {product.name}</span><span>{fmtMoney((product.salePrice||0)*qty)}</span></div>):<p className="text-sm text-white/45">Aún no hay productos.</p>}</div><div className="mt-5 pt-4 border-t border-white/10 space-y-3"><div className="flex justify-between text-sm text-white/60"><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div><label className="flex items-center justify-between gap-3 text-sm text-white/60"><span>Descuento</span><input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(Number(e.target.value))} className="w-24 px-2 py-1.5 rounded-lg bg-white/10 border border-white/15 text-right text-white" /></label><div className="flex justify-between items-end pt-2"><span className="text-sm text-white/60">Total</span><strong className="font-display text-3xl">{fmtMoney(total)}</strong></div></div></div><label className="block mt-5"><span className="block text-xs font-600 text-slate-700 mb-2">Método de pago</span><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as Sale['paymentMethod'])} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option></select></label></div></div>
      {error && <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100"><p className="text-xs text-muted">El stock se descontará al confirmar la operación.</p><div className="flex gap-3"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-600">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20">Confirmar venta</button></div></div></form></div></div>}
    </div>
  );
}

// ─── Admin: Delivery Notes ────────────────────────────────────────────────────

function DeliveriesSection({ inventory }: { inventory: Product[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { clientName: '', itemIds: [] as string[], address: '', date: today, deliveredBy: '', status: 'pending' as DeliveryNote['status'], notes: '' };
  const [deliveries, setDeliveries] = useState<DeliveryNote[]>(DELIVERIES);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const filtered = deliveries.filter(d => !search || d.clientName.toLowerCase().includes(search.toLowerCase()) || d.address.toLowerCase().includes(search.toLowerCase()));
  const selectClient = (name: string) => {
    const client = CLIENTS.find(c => c.name === name);
    setForm(current => ({ ...current, clientName: name, address: client?.address ?? '' }));
  };
  const toggleItem = (id: string) => setForm(current => ({ ...current, itemIds: current.itemIds.includes(id) ? current.itemIds.filter(itemId => itemId !== id) : [...current.itemIds, id] }));
  const saveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.address.trim() || !form.deliveredBy || !form.itemIds.length) { setError('Selecciona cliente, al menos un artículo, dirección y responsable de entrega.'); return; }
    setDeliveries(current => [{ id: `nd${Date.now()}`, clientName: form.clientName, items: form.itemIds.map(id => inventory.find(p=>p.id===id)?.name).filter(Boolean) as string[], address: form.address.trim(), date: form.date, deliveredBy: form.deliveredBy, status: form.status, notes: form.notes.trim() }, ...current]);
    setForm(emptyForm); setError(''); setModalOpen(false);
  };

  return (
    <div>
      <SectionHeader title="Notas de Entrega" subtitle={`${deliveries.filter(d=>d.status==='pending').length} pendientes · ${deliveries.filter(d=>d.status==='delivered').length} entregadas`} action={<AddBtn label="Nueva Nota" onClick={()=>setModalOpen(true)} />} />
      <div className="flex items-center gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o dirección..." />
      </div>
      <div className="bg-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
                {['ID', 'Cliente', 'Artículos', 'Dirección', 'Fecha', 'Entregado por', 'Estado', 'Notas'].map(h => (
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
                  <td className="px-4 py-3 text-muted max-w-[160px] truncate">
                    <span className="flex items-center gap-1"><MapPin size={11} className="flex-shrink-0" />{d.address}</span>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(d.date)}</td>
                  <td className="px-4 py-3 text-gtext whitespace-nowrap">{d.deliveredBy}</td>
                  <td className="px-4 py-3"><Badge cls={d.status}>{d.status === 'pending' ? 'Pendiente' : d.status === 'delivered' ? 'Entregado' : 'Fallido'}</Badge></td>
                  <td className="px-4 py-3 text-muted text-xs max-w-[150px] truncate">{d.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#2563eb]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue flex items-center justify-center"><Truck size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-blue uppercase">Logística y despacho</div><h3 className="font-display text-2xl font-700 text-gtext mt-1">Crear nota de entrega</h3><p className="text-sm text-muted mt-1">Organiza los artículos, destino y responsable del despacho.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
      <form onSubmit={saveDelivery} className="p-7"><div className="grid lg:grid-cols-[1fr_.9fr] gap-7"><div className="space-y-5">
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Cliente destinatario</span><select required value={form.clientName} onChange={e=>selectClient(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">Seleccionar cliente</option>{CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Dirección de entrega</span><textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full min-h-24 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200" placeholder="Dirección completa y referencias" /></label>
        <div className="grid sm:grid-cols-2 gap-4"><label><span className="block text-xs font-600 text-slate-700 mb-2">Fecha programada</span><input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label><label><span className="block text-xs font-600 text-slate-700 mb-2">Responsable</span><select required value={form.deliveredBy} onChange={e=>setForm({...form,deliveredBy:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"><option value="">Asignar repartidor</option><option>Pedro Gómez</option><option>Juan Castro</option><option>Andrés Moreno</option></select></label></div>
        <div className="grid sm:grid-cols-2 gap-4"><label><span className="block text-xs font-600 text-slate-700 mb-2">Estado inicial</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as DeliveryNote['status']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"><option value="pending">Pendiente</option><option value="delivered">Entregado</option><option value="failed">Fallido</option></select></label><label><span className="block text-xs font-600 text-slate-700 mb-2">Tipo de despacho</span><select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"><option>Entrega estándar</option><option>Entrega prioritaria</option><option>Retiro en tienda</option></select></label></div>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Instrucciones y observaciones</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full min-h-20 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200" placeholder="Horario, persona autorizada, referencias o cuidados especiales" /></label>
      </div><div><div className="rounded-2xl border border-slate-200 overflow-hidden"><div className="px-4 py-3 bg-slate-50 border-b border-slate-200"><strong className="text-sm text-gtext">Artículos del inventario</strong><span className="block text-xs text-muted mt-0.5">Selecciona uno o varios productos</span></div><div className="max-h-[390px] overflow-y-auto divide-y divide-slate-100">{inventory.filter(p=>p.stock>0).map(p=><label key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"><input type="checkbox" checked={form.itemIds.includes(p.id)} onChange={()=>toggleItem(p.id)} className="w-4 h-4 accent-[#6153d6]"/><div className="flex-1 min-w-0"><span className="block text-sm font-500 text-gtext truncate">{p.name}</span><span className="text-xs text-muted">{p.brand} · Stock {p.stock}</span></div><Badge cls={p.category==='game'?'sale':p.brand.toLowerCase()}>{p.category==='console'?'Consola':p.category==='game'?'Juego':'Producto'}</Badge></label>)}</div><div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-muted">{form.itemIds.length} artículo{form.itemIds.length===1?'':'s'} seleccionado{form.itemIds.length===1?'':'s'}</div></div></div></div>
        {error && <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-600">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20">Generar nota</button></div></form></div></div>}
    </div>
  );
}

// ─── Admin: Technical Service ─────────────────────────────────────────────────

function TechnicalSection() {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { clientName: '', device: '', issue: '', receiveDate: today, estimatedDate: today, technician: '', cost: 0, status: 'received' as TechService['status'], notes: '' };
  const [services, setServices] = useState<TechService[]>(TECH_SERVICES);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const filtered = services.filter(t => !search || t.clientName.toLowerCase().includes(search.toLowerCase()) || t.device.toLowerCase().includes(search.toLowerCase()));

  const statusLabel: Record<string, string> = {
    received: 'Recibido', diagnosing: 'Diagnóstico', repairing: 'Reparando', ready: 'Listo', delivered: 'Entregado'
  };
  const saveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || form.device.trim().length < 3 || form.issue.trim().length < 5 || !form.technician) { setError('Completa cliente, dispositivo, falla y técnico responsable.'); return; }
    if (form.estimatedDate < form.receiveDate) { setError('La fecha estimada no puede ser anterior a la recepción.'); return; }
    setServices(current => [{ id: `ts${Date.now()}`, clientName: form.clientName, device: form.device.trim(), issue: form.issue.trim(), receiveDate: form.receiveDate, estimatedDate: form.estimatedDate, technician: form.technician, cost: Number(form.cost), status: form.status, notes: form.notes.trim() }, ...current]);
    setForm(emptyForm); setError(''); setModalOpen(false);
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

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#2563eb]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Wrench size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-amber-600 uppercase">Recepción técnica</div><h3 className="font-display text-2xl font-700 text-gtext mt-1">Crear orden de servicio</h3><p className="text-sm text-muted mt-1">Documenta el equipo, la falla reportada y la planificación inicial.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
      <form onSubmit={saveService} className="p-7"><div className="grid sm:grid-cols-2 gap-5">
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Cliente</span><select required value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">Seleccionar cliente</option>{CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Dispositivo recibido</span><input required value={form.device} onChange={e=>setForm({...form,device:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" placeholder="Ej. PlayStation 5 Slim" /></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 mb-2">Falla reportada por el cliente</span><textarea required value={form.issue} onChange={e=>setForm({...form,issue:e.target.value})} className="w-full min-h-24 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200" placeholder="Describe síntomas, errores, daños físicos y cuándo comenzó la falla" /></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Fecha de recepción</span><input type="date" required value={form.receiveDate} onChange={e=>setForm({...form,receiveDate:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Entrega estimada</span><input type="date" required value={form.estimatedDate} onChange={e=>setForm({...form,estimatedDate:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Técnico responsable</span><select required value={form.technician} onChange={e=>setForm({...form,technician:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"><option value="">Asignar técnico</option><option>Miguel Ángel</option><option>Roberto Silva</option><option>Daniel Rojas</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Costo estimado</span><div className="relative"><DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input type="number" min="0" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:Number(e.target.value)})} className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200" /></div></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Estado inicial</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as TechService['status']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"><option value="received">Recibido</option><option value="diagnosing">En diagnóstico</option><option value="repairing">En reparación</option><option value="ready">Listo para entrega</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Prioridad</span><select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"><option>Normal</option><option>Alta</option><option>Urgente</option></select></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 mb-2">Notas internas y condiciones de recepción</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full min-h-20 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200" placeholder="Accesorios recibidos, estado físico, observaciones o diagnóstico preliminar" /></label>
        {error && <div className="sm:col-span-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div><div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100"><p className="text-xs text-muted">Se generará un número de orden automáticamente.</p><div className="flex gap-3"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-600">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20">Crear orden técnica</button></div></div></form></div></div>}
    </div>
  );
}

// ─── Admin: Warranties ────────────────────────────────────────────────────────

function WarrantiesSection({ inventory }: { inventory: Product[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { clientName: '', productId: '', serial: '', purchaseDate: today, months: 12, type: 'store' as Warranty['type'] };
  const [warranties, setWarranties] = useState<Warranty[]>(WARRANTIES);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const selectedProduct = inventory.find(p => p.id === form.productId);
  const expiry = new Date(`${form.purchaseDate}T12:00:00`);
  expiry.setMonth(expiry.getMonth() + Number(form.months || 0));
  const filtered = warranties.filter(w => !search || w.clientName.toLowerCase().includes(search.toLowerCase()) || w.product.toLowerCase().includes(search.toLowerCase()) || w.serial.toLowerCase().includes(search.toLowerCase()));

  const saveWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !selectedProduct || form.serial.trim().length < 5) { setError('Completa el cliente, producto y un serial válido.'); return; }
    if (warranties.some(w => w.serial.toLowerCase() === form.serial.trim().toLowerCase())) { setError('Este número serial ya tiene una garantía registrada.'); return; }
    setWarranties(current => [{ id: `w${Date.now()}`, clientName: form.clientName, product: selectedProduct.name, serial: form.serial.trim().toUpperCase(), purchaseDate: form.purchaseDate, expiryDate: expiry.toISOString().slice(0, 10), status: 'active', type: form.type }, ...current]);
    setForm(emptyForm); setError(''); setModalOpen(false);
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

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#2563eb]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-[#f1efff] text-[#6153d6] flex items-center justify-center"><Shield size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] uppercase">Protección postventa</div><h3 className="font-display text-2xl font-700 text-gtext mt-1">Registrar nueva garantía</h3><p className="text-sm text-muted mt-1">Asocia un producto y define las condiciones de cobertura.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
      <form onSubmit={saveWarranty} className="p-7"><div className="grid sm:grid-cols-2 gap-5">
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Cliente titular</span><select required value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">Seleccionar cliente</option>{CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Producto cubierto</span><select required value={form.productId} onChange={e=>setForm({...form,productId:e.target.value})} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">Seleccionar del inventario</option>{inventory.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 mb-2">Número serial / identificador único</span><input required value={form.serial} onChange={e=>setForm({...form,serial:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase" placeholder="Ej. CFI-2015A-001928" /></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Fecha de compra</span><input type="date" required value={form.purchaseDate} onChange={e=>setForm({...form,purchaseDate:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Tipo de cobertura</span><select value={form.type} onChange={e=>setForm({...form,type:e.target.value as Warranty['type']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"><option value="store">Garantía de tienda</option><option value="manufacturer">Garantía del fabricante</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 mb-2">Duración de cobertura</span><select value={form.months} onChange={e=>setForm({...form,months:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"><option value={3}>3 meses</option><option value={6}>6 meses</option><option value={12}>12 meses</option><option value={24}>24 meses</option></select></label>
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4"><span className="block text-[10px] uppercase tracking-wider text-muted">Vencimiento calculado</span><strong className="block font-display text-lg text-gtext mt-1">{expiry.toLocaleDateString('es-VE',{day:'2-digit',month:'long',year:'numeric'})}</strong></div>
        {selectedProduct && <div className="sm:col-span-2 flex items-center gap-4 rounded-2xl bg-blue-50/60 border border-blue-100 p-4"><div className="w-10 h-10 rounded-xl bg-white text-blue flex items-center justify-center"><Package size={19}/></div><div><strong className="block text-sm text-gtext">{selectedProduct.name}</strong><span className="text-xs text-muted">{selectedProduct.brand} · {selectedProduct.description}</span></div></div>}
        {error && <div className="sm:col-span-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div><div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-600">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20">Activar garantía</button></div></form></div></div>}
    </div>
  );
}

// ─── Admin: Purchases ─────────────────────────────────────────────────────────

function PurchasesSection({ inventory, setInventory }: { inventory: Product[]; setInventory: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const emptyProduct = { name: '', category: 'console' as Product['category'], brand: 'PS5' as Product['brand'], stock: 1, specification: '', salePrice: 0, rentalPrice: 0, type: 'both' as Product['type'] };
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const filtered = inventory.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
  const totalStock = inventory.reduce((sum, p) => sum + p.stock, 0);
  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setInventory(current => [{ id: `p${Date.now()}`, name: form.name.trim(), category: form.category, brand: form.brand, stock: Number(form.stock), description: form.specification.trim(), salePrice: form.salePrice || undefined, rentalPrice: form.rentalPrice || undefined, type: form.type, image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=720&h=520&fit=crop&auto=format' }, ...current]);
    setForm(emptyProduct);
    setModalOpen(false);
  };

  return (
    <div>
      <SectionHeader title="Inventario" subtitle={`${inventory.length} productos · ${totalStock} unidades disponibles`} action={<AddBtn label="Nuevo Producto" onClick={()=>setModalOpen(true)} />} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Unidades en stock</div><div className="font-display font-700 text-2xl text-gtext mt-1">{totalStock}</div></div>
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Disponibles para alquiler</div><div className="font-display font-700 text-2xl text-blue mt-1">{inventory.filter(p=>p.rentalPrice && p.stock>0).length}</div></div>
        <div className="stat-card bg-card rounded-xl p-4"><div className="text-xs text-muted">Stock crítico</div><div className="font-display font-700 text-2xl text-warning mt-1">{inventory.filter(p=>p.stock<=2).length}</div></div>
      </div>
      <div className="flex items-center gap-3 mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Buscar por producto o marca..." /></div>
      <div className="bg-card rounded-xl overflow-hidden border border-slate-200"><div className="table-scroll"><table className="w-full text-sm"><thead><tr>{['Producto','Tipo','Marca','Capacidad / Especificación','Stock','Venta','Alquiler / día','Modalidad'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-600 text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{filtered.map(p=><tr key={p.id} className="table-row-hover border-b border-slate-100 last:border-0"><td className="px-4 py-3 font-600 text-gtext whitespace-nowrap">{p.name}</td><td className="px-4 py-3 text-muted capitalize">{p.category === 'console' ? 'Consola' : p.category === 'game' ? 'Juego' : p.category === 'accessory' ? 'Accesorio' : 'Digital'}</td><td className="px-4 py-3"><Badge cls={p.brand.toLowerCase()}>{p.brand}</Badge></td><td className="px-4 py-3 text-muted max-w-[260px] truncate">{p.description}</td><td className="px-4 py-3"><span className={`font-700 ${p.stock<=2?'text-danger':'text-success'}`}>{p.stock}</span></td><td className="px-4 py-3 text-muted">{p.salePrice?fmtMoney(p.salePrice):'—'}</td><td className="px-4 py-3 text-blue font-600">{p.rentalPrice?fmtMoney(p.rentalPrice):'—'}</td><td className="px-4 py-3"><Badge cls={p.type}>{p.type==='both'?'Venta / Alquiler':p.type==='sale'?'Venta':'Alquiler'}</Badge></td></tr>)}</tbody></table></div></div>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><button className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#2563eb]" /><div className="flex justify-between px-7 pt-7 pb-5 border-b border-slate-100"><div><div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] uppercase">Control de inventario</div><h3 className="font-display text-2xl font-700 text-gtext mt-1">Registrar producto</h3><p className="text-sm text-muted mt-1">Configura sus características comerciales y disponibilidad.</p></div><button onClick={()=>setModalOpen(false)} className="p-2 h-fit rounded-xl hover:bg-slate-100"><X size={19}/></button></div><form onSubmit={saveProduct} className="p-7 grid sm:grid-cols-2 gap-5">
        <label className="sm:col-span-2"><span className="block text-xs font-600 mb-2">Nombre comercial</span><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" placeholder="Ej. PlayStation 5 Slim 1TB" /></label>
        <label><span className="block text-xs font-600 mb-2">Tipo de producto</span><select value={form.category} onChange={e=>setForm({...form,category:e.target.value as Product['category']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"><option value="console">Consola</option><option value="game">Videojuego</option><option value="accessory">Accesorio</option><option value="card">Digital</option></select></label>
        <label><span className="block text-xs font-600 mb-2">Marca / Plataforma</span><select value={form.brand} onChange={e=>setForm({...form,brand:e.target.value as Product['brand']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"><option>PS5</option><option>PS4</option><option>Xbox</option><option>Multi</option></select></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 mb-2">Capacidad y especificaciones</span><input required value={form.specification} onChange={e=>setForm({...form,specification:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" placeholder="Consola: 1TB SSD · Juego: edición/plataforma · Accesorio: color/conectividad" /></label>
        <label><span className="block text-xs font-600 mb-2">Stock inicial</span><input type="number" min="0" required value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label>
        <label><span className="block text-xs font-600 mb-2">Modalidad</span><select value={form.type} onChange={e=>setForm({...form,type:e.target.value as Product['type']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"><option value="both">Venta y alquiler</option><option value="sale">Solo venta</option><option value="rental">Solo alquiler</option></select></label>
        <label><span className="block text-xs font-600 mb-2">Precio de venta</span><input type="number" min="0" value={form.salePrice} onChange={e=>setForm({...form,salePrice:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label>
        <label><span className="block text-xs font-600 mb-2">Tarifa de alquiler / día</span><input type="number" min="0" value={form.rentalPrice} onChange={e=>setForm({...form,rentalPrice:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200" /></label>
        <div className="sm:col-span-2 flex justify-end gap-3 pt-5 border-t border-slate-100"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-600">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600">Guardar producto</button></div>
      </form></div></div>}
    </div>
  );
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS: { key: AdminSection; label: string; icon: React.ReactNode; count?: number }[] = [
  { key: 'dashboard', label: 'Panel Principal', icon: <LayoutDashboard size={18} /> },
  { key: 'clients', label: 'Clientes', icon: <Users size={18} />, count: CLIENTS.length },
  { key: 'rentals', label: 'Alquileres', icon: <Gamepad2 size={18} />, count: RENTALS.filter(r=>r.status==='active').length },
  { key: 'sales', label: 'Ventas', icon: <ShoppingBag size={18} />, count: SALES.length },
  { key: 'deliveries', label: 'Notas de Entrega', icon: <Truck size={18} />, count: DELIVERIES.filter(d=>d.status==='pending').length },
  { key: 'technical', label: 'Servicio Técnico', icon: <Wrench size={18} />, count: TECH_SERVICES.filter(t=>t.status!=='delivered').length },
  { key: 'warranties', label: 'Garantías', icon: <Shield size={18} />, count: WARRANTIES.filter(w=>w.status==='active').length },
  { key: 'purchases', label: 'Inventario', icon: <Package size={18} />, count: PRODUCTS.filter(p=>p.stock<=2).length },
];

function AdminView() {
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventory, setInventory] = useState<Product[]>(PRODUCTS);
  const [rentals, setRentals] = useState<Rental[]>(RENTALS);

  const SectionContent = {
    dashboard: <Dashboard />,
    clients: <ClientsSection />,
    rentals: <RentalsSection rentals={rentals} setRentals={setRentals} inventory={inventory} setInventory={setInventory} />,
    sales: <SalesSection inventory={inventory} setInventory={setInventory} />,
    deliveries: <DeliveriesSection inventory={inventory} />,
    technical: <TechnicalSection />,
    warranties: <WarrantiesSection inventory={inventory} />,
    purchases: <PurchasesSection inventory={inventory} setInventory={setInventory} />,
  }[section];

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ overflow: 'hidden' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col flex-shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0', top: '64px', height: 'calc(100vh - 64px)' }}>
        <nav className="flex-1 py-4 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => {
            const active = section === item.key;
            return (
              <button key={item.key}
                onClick={() => { setSection(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all relative ${active ? 'sidebar-item-active text-gtext font-600' : 'text-muted hover:text-gtext hover:bg-[rgba(139,92,246,0.05)]'}`}>
                <span style={{ color: active ? '#a78bfa' : undefined }}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] font-700 px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.15)', color: active ? '#c4b5fd' : '#7c6fa8' }}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-[rgba(139,92,246,0.1)]">
          <div className="text-xs text-muted text-center">GameVault Pro v1.0</div>
          <div className="text-[10px] text-muted text-center opacity-50 mt-0.5">Sistema de Gestión</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-bg">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-[rgba(139,92,246,0.1)]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-muted hover:text-gtext" style={{ background: 'rgba(139,92,246,0.08)' }}>
            <Menu size={18} />
          </button>
          <span className="text-sm font-600 text-gtext">{SIDEBAR_ITEMS.find(i=>i.key===section)?.label}</span>
        </div>
        <div className="p-6 lg:p-8">
          {SectionContent}
        </div>
      </main>
    </div>
  );
}

// ─── Top Navbar ───────────────────────────────────────────────────────────────

function Navbar({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <header className="navbar-blur fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-6 gap-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: '#172033', boxShadow: '0 2px 6px rgba(15,23,42,0.14)' }}>
          <Gamepad2 size={19} className="text-white" />
        </div>
        <div>
          <div className="font-display font-700 text-gtext text-base leading-none">GameVault</div>
          <div className="text-[10px] text-muted leading-none mt-0.5">Pro</div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status indicators */}
      <div className="hidden md:flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {RENTALS.filter(r=>r.status==='active').length} alq. activos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RENTALS.some(r=>r.status==='overdue') ? '#ef4444' : '#6b7280' }} />
          {RENTALS.filter(r=>r.status==='overdue').length} en mora
        </span>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <button onClick={() => setView('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all ${view === 'catalog' ? 'nav-btn-active text-white' : 'text-muted hover:text-gtext'}`}>
          <Layers size={15} /> Catálogo
        </button>
        <button onClick={() => setView('admin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all ${view === 'admin' ? 'nav-btn-active text-white' : 'text-muted hover:text-gtext'}`}>
          <LayoutDashboard size={15} /> Administrador
        </button>
      </div>
    </header>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>('catalog');

  return (
    <div className="bg-bg min-h-screen">
      <Navbar view={view} setView={setView} />
      <div className="pt-16">
        {view === 'catalog' ? <CatalogView /> : <AdminView />}
      </div>
    </div>
  );
}
