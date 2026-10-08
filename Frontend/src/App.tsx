import { useState, useMemo, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, Gamepad2, ShoppingBag, Truck, Wrench, Shield, Package,
  Search, Plus, TrendingUp, Clock, AlertTriangle, CheckCircle2, Star, Tag,
  Phone, Mail, MapPin, Hash, DollarSign, ArrowUpRight, CreditCard,
  Menu, X, ChevronRight, ChevronLeft, Layers, RotateCcw, Clipboard, Monitor, Headphones, Gift, Disc3,
  Sun, Moon, SlidersHorizontal, Send, Navigation, MessageSquare, Filter, Lock, LogOut
} from 'lucide-react';

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

const CONTACT_MESSAGES: ContactMessage[] = [
  { id: 'm1', name: 'Gabriel Torres', email: 'gabriel.t@gmail.com', phone: '0412-111-2233', subject: 'Consulta por PS5', message: 'Buenas tardes, quisiera saber si tienen disponible alquiler de PS5 por fin de semana completo.', date: '2024-09-24', status: 'unread' },
  { id: 'm2', name: 'Elena Rivas', email: 'elena.r@hotmail.com', phone: '0424-999-8877', subject: 'Servicio Técnico Xbox', message: 'Hola, mi Xbox Series S hace ruido excesivo en el ventilador. ¿Hacen mantenimiento preventivo?', date: '2024-09-23', status: 'read' },
  { id: 'm3', name: 'Marcos Silva', email: 'marcos.silva@yahoo.com', phone: '0414-333-4455', subject: 'Garantía de mando DualSense', message: 'Compré un mando hace 2 semanas y el botón R2 se siente flojo.', date: '2024-09-21', status: 'replied' },
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

function ProductArtwork({ product }: { product: Product }) {
  return (
    <div className="product-art relative h-56 overflow-hidden product-art-container flex items-center justify-center p-1.5">
      {/* Dark grid background pattern for contrast */}
      <div className="absolute inset-0 bg-slate-950/80 product-art-grid opacity-30 pointer-events-none" />
      <img
        src={product.image}
        alt={`Imagen referencial de ${product.name}`}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 rounded-xl relative z-0"
      />
      {/* Contrast vignette shadow overlay around image so white consoles pop cleanly */}
      <div className="absolute inset-0 product-art-shadow-overlay pointer-events-none z-10" />
      <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-white/20 text-[9px] font-700 tracking-[0.16em] text-slate-100 shadow-md">
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

const HERO_SHOWCASE: Record<string, { tag: string; title: string; subtitle: string; image: string; icon: React.ReactNode }> = {
  consoles: {
    tag: 'DESTACADO · CONSOLAS',
    title: 'PlayStation 5 & Xbox Series X',
    subtitle: 'Potencia de nueva generación a 4K@120fps',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1100&h=850&fit=crop&auto=format',
    icon: <Gamepad2 size={20} />
  },
  accessories: {
    tag: 'DESTACADO · ACCESORIOS',
    title: 'Controles DualSense & Headsets',
    subtitle: 'Vibración háptica, audio 3D y gatillos adaptativos',
    image: 'https://images.unsplash.com/photo-1754594207981-8b97210a6d3a?w=1100&h=850&fit=crop&auto=format',
    icon: <Headphones size={20} />
  },
  games: {
    tag: 'DESTACADO · JUEGOS',
    title: 'Títulos Estreno & Exclusivos',
    subtitle: 'Mundos abiertos, acción y aventuras inolvidables',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1100&h=850&fit=crop&auto=format',
    icon: <Disc3 size={20} />
  },
  cards: {
    tag: 'DESTACADO · DIGITAL',
    title: 'Tarjetas PSN & Game Pass',
    subtitle: 'Entrega digital instantánea y membresías',
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1100&h=850&fit=crop&auto=format',
    icon: <CreditCard size={20} />
  },
  all: {
    tag: 'DESTACADO · GAMING 2026',
    title: 'PlayStation 5 Disc Edition',
    subtitle: 'Potencia de nueva generación con soporte 4K',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1100&h=850&fit=crop&auto=format',
    icon: <Gamepad2 size={20} />
  }
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
      if (filter === 'sale' && p.type === 'rental') return false;
      if (filter === 'rental' && p.type === 'sale') return false;
      if (brand !== 'all' && p.brand !== brand) return false;

      const price = p.salePrice ?? p.rentalPrice ?? 0;
      if (minPrice !== '' && price < Number(minPrice)) return false;
      if (maxPrice !== '' && price > Number(maxPrice)) return false;

      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category, filter, brand, search, minPrice, maxPrice]);

  const hasActiveFilters = category !== 'all' || filter !== 'all' || brand !== 'all' || search !== '' || minPrice !== '' || maxPrice !== '';

  const clearFilters = () => {
    setCategory('all');
    setFilter('all');
    setBrand('all');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="min-h-screen bg-bg transition-colors duration-200">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-blue-50/80 dark:bg-slate-900 border-b border-blue-100 dark:border-slate-800 hero-banner">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 85% 20%, rgba(99,102,241,0.12), transparent 45%), radial-gradient(circle at 15% 85%, rgba(37,99,235,0.10), transparent 45%)'
        }} />
        <div className="relative max-w-7xl mx-auto px-6 py-10 md:py-14">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] items-center gap-10 lg:gap-14">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-5">
                <span className="badge badge-sale">Colección 2026</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Equipos seleccionados</span>
              </div>
              <h1 className="font-display font-700 text-4xl md:text-5xl lg:text-[56px] text-slate-900 dark:text-white leading-[1.04] mb-5 tracking-[-0.035em]">
                Tu próxima partida empieza <span className="text-[#5488D6]">aquí.</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed max-w-lg">
                Consolas, controles y videojuegos seleccionados para ofrecer rendimiento, garantía y una experiencia de compra especializada.
              </p>

              {/* Dynamic Hero Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-7">
                <button
                  onClick={() => setCategory(category === 'consoles' ? 'all' : 'consoles')}
                  className={`px-5 py-3 rounded-xl text-sm font-600 transition-all duration-300 flex items-center gap-2 ${
                    category === 'consoles' || category === 'all'
                      ? 'bg-[#5488D6] hover:bg-[#4677c4] text-white shadow-lg shadow-[#5488D6]/30 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#5488D6]'
                  }`}
                >
                  <Gamepad2 size={16} /> Explorar consolas
                </button>
                <button
                  onClick={() => setCategory(category === 'accessories' ? 'all' : 'accessories')}
                  className={`px-5 py-3 rounded-xl text-sm font-600 transition-all duration-300 flex items-center gap-2 ${
                    category === 'accessories'
                      ? 'bg-[#5488D6] hover:bg-[#4677c4] text-white shadow-lg shadow-[#5488D6]/30 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#5488D6]'
                  }`}
                >
                  <Headphones size={16} /> Ver accesorios
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-9 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div><strong className="block font-display text-xl text-slate-900 dark:text-white">22+</strong><span className="text-xs text-slate-500 dark:text-slate-400">Productos</span></div>
                <div><strong className="block font-display text-xl text-slate-900 dark:text-white">12 meses</strong><span className="text-xs text-slate-500 dark:text-slate-400">Garantía</span></div>
                <div><strong className="block font-display text-xl text-slate-900 dark:text-white">Soporte</strong><span className="text-xs text-slate-500 dark:text-slate-400">Especializado</span></div>
              </div>
            </div>

            {/* Dynamic Animated Hero Showcase Card */}
            <div className="relative lg:min-h-[430px]">
              <div key={category} className="hero-animate hero-photo relative h-[340px] sm:h-[420px] overflow-hidden rounded-[28px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl">
                <img
                  src={heroData.image}
                  alt={heroData.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute left-6 bottom-6 text-white max-w-md">
                  <span className="text-[10px] font-700 tracking-[0.18em] text-white bg-[#5488D6] border border-[#5488D6]/60 px-2.5 py-1 rounded-full inline-block mb-2 shadow-sm">
                    {heroData.tag}
                  </span>
                  <div className="font-display text-2xl md:text-3xl font-700 leading-tight text-white">{heroData.title}</div>
                  <div className="text-sm text-white/80 mt-1">{heroData.subtitle}</div>
                </div>
              </div>
              <div className="absolute -left-4 sm:-left-7 top-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue dark:text-blue-400 flex items-center justify-center">{heroData.icon}</div>
                <div><div className="text-xs text-slate-500 dark:text-slate-400">Disponible para</div><div className="text-sm font-600 text-slate-900 dark:text-white">Venta y alquiler</div></div>
              </div>
              <div className="absolute -right-2 sm:-right-5 bottom-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 px-4 py-3">
                <div className="flex items-center gap-1 text-amber-500 mb-1"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                <div className="text-xs font-600 text-slate-900 dark:text-white">Productos verificados</div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Sticky Bar Filters */}
      <div className="sticky top-[64px] z-30 border-b border-slate-200 dark:border-slate-800 sticky-filter-bar backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col gap-3 py-3">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              {/* Category tabs */}
              <div className="flex items-center gap-1 flex-wrap">
                {(Object.keys(CATEGORY_LABELS) as CatalogCategory[]).map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-500 transition-all ${category === cat ? 'bg-[#5488D6] text-white shadow-sm shadow-[#5488D6]/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Brand and Type Filters */}
              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
                {/* Brand selector */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {(['all', 'PS5', 'PS4', 'Xbox'] as BrandFilter[]).map(b => (
                    <button key={b} onClick={() => setBrand(b)}
                      className={`px-2.5 py-1 rounded-md text-xs font-500 transition-all ${brand === b ? 'bg-[#5488D6] text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                      {b === 'all' ? 'Marcas' : b}
                    </button>
                  ))}
                </div>

                {/* Modality filter */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#5488D6]/10 dark:bg-[#5488D6]/15 border border-[#5488D6]/25 dark:border-[#5488D6]/30">
                  {(['all', 'sale', 'rental'] as FilterType[]).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 rounded-md text-xs font-500 transition-all ${filter === f ? 'bg-[#5488D6] text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                      {f === 'all' ? 'Todos' : f === 'sale' ? 'Venta' : 'Alquiler'}
                    </button>
                  ))}
                </div>


                {/* Toggle Price Filter Panel */}
                <button
                  onClick={() => setShowPriceFilter(!showPriceFilter)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-600 transition-colors ${showPriceFilter || minPrice || maxPrice ? 'bg-blue/10 border-blue text-blue dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <SlidersHorizontal size={14} /> Precios
                </button>

                {/* Search input */}
                <div className="w-full sm:w-64">
                  <SearchBar value={search} onChange={setSearch} placeholder="Buscar producto..." />
                </div>
              </div>
            </div>

            {/* Price Filter Sub-panel */}
            {showPriceFilter && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-200">
                <span className="font-600 text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Tag size={13} className="text-blue dark:text-indigo-400" /> Rango de Precio ($):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mín $"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="number"
                    placeholder="Máx $"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-xs font-600 text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted">{filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
          {hasActiveFilters && !showPriceFilter && (
            <button onClick={clearFilters} className="text-xs text-red-600 font-600 hover:underline flex items-center gap-1">
              <RotateCcw size={12} /> Limpiar filtros
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-muted">
            <Gamepad2 size={48} className="mx-auto mb-4 opacity-20" />
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
          <button aria-label="Cerrar modal" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex items-start justify-between px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f1efff] dark:bg-indigo-950/60 text-[#6153d6] dark:text-indigo-400 flex items-center justify-center"><Users size={22} /></div>
                <div>
                  <div className="text-[11px] font-700 tracking-[0.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Gestión de clientes</div>
                  <h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nuevo cliente</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Completa la información para crear su perfil comercial.</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>

            <form onSubmit={saveClient} className="px-6 sm:px-8 py-6">
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
          <button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" />
            <div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-4"><div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue dark:text-blue-400 flex items-center justify-center"><Gamepad2 size={22} /></div><div><div className="text-[11px] font-700 tracking-[.14em] text-blue dark:text-blue-400 uppercase">Operación de inventario</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nuevo alquiler</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Selecciona un artículo disponible y configura la operación.</p></div></div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19} /></button>
            </div>
            <form onSubmit={saveRental} className="p-7">
              <div className="grid sm:grid-cols-2 gap-5">
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar cliente registrado</option>{CLIENTS.filter(c=>c.status==='active').map(c=><option key={c.id}>{c.name}</option>)}</select></label>
                <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Producto del inventario</span><select required value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar producto disponible</option>{rentableProducts.map(p=><option key={p.id} value={p.id}>{p.name} · Stock {p.stock} · {fmtMoney(p.rentalPrice!)}/día</option>)}</select></label>
                {selectedProduct && <div className="sm:col-span-2 grid grid-cols-3 gap-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4"><div><span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Tipo</span><strong className="text-sm text-slate-900 dark:text-white">{selectedProduct.category === 'console' ? 'Consola' : selectedProduct.category === 'game' ? 'Juego' : 'Accesorio'}</strong></div><div><span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Especificación</span><strong className="text-sm text-slate-900 dark:text-white">{selectedProduct.description.split('·')[0]}</strong></div><div><span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Disponibles</span><strong className="text-sm text-emerald-600 dark:text-emerald-400">{selectedProduct.stock} unidades</strong></div></div>}
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha de inicio</span><DatePicker value={form.startDate} onChange={val=>setForm({...form,startDate:val})} /></label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Duración en días</span><input type="number" min="1" required value={form.days} onChange={e=>setForm({...form,days:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
                <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Depósito de garantía</span><input type="number" min="0" value={form.deposit} onChange={e=>setForm({...form,deposit:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
                <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900 text-slate-900 dark:text-white p-4"><span className="block text-xs text-slate-600 dark:text-white/70">Total estimado · vence {dueDate.toLocaleDateString('es-VE')}</span><strong className="font-display text-2xl text-indigo-600 dark:text-white">{fmtMoney(total)}</strong></div>
              </div>
              <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Confirmar alquiler</button></div>
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

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><ShoppingBag size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-emerald-600 dark:text-emerald-400 uppercase">Punto de venta</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nueva venta</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Agrega productos, valida existencias y confirma el pago.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div>
      <form onSubmit={saveSale} className="p-7"><div className="grid lg:grid-cols-[1.35fr_.75fr] gap-7"><div><label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={clientName} onChange={e=>setClientName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm shadow-sm hover:border-[#86CCC0] transition-colors"><option value="">Seleccionar cliente</option>{CLIENTS.filter(c=>c.status==='active').map(c=><option key={c.id}>{c.name}</option>)}</select></label><div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm"><div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"><div><strong className="text-sm text-slate-900 dark:text-white">Productos disponibles</strong><span className="block text-xs text-slate-500 dark:text-slate-400">Define la cantidad de cada artículo</span></div></div><div className="max-h-[410px] overflow-y-auto p-2.5 space-y-2 bg-slate-50/70 dark:bg-slate-900">{saleableProducts.map(p=>{const qty=cart[p.id]||0; return (<div key={p.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${qty>0?'bg-[#86CCC0]/15 border-[#86CCC0] dark:bg-[#86CCC0]/25 dark:border-[#86CCC0]/50 shadow-sm':'bg-white border-slate-200/90 hover:border-[#86CCC0]/60 dark:bg-slate-900 dark:border-slate-800'}`}><div className="flex-1 min-w-0"><span className="block text-sm font-600 text-slate-900 dark:text-white truncate">{p.name}</span><span className="text-xs text-slate-500 dark:text-slate-400">{p.brand} · Stock {p.stock}</span></div><strong className="text-sm text-[#0d9488] dark:text-[#86CCC0]">{fmtMoney(p.salePrice!)}</strong><div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 shadow-inner"><button type="button" onClick={()=>setQuantity(p,(cart[p.id]||0)-1)} className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold">−</button><span className="w-9 text-center text-sm font-700 text-slate-900 dark:text-white bg-white dark:bg-slate-900 py-1 border-x border-slate-200 dark:border-slate-700">{cart[p.id]||0}</span><button type="button" onClick={()=>setQuantity(p,(cart[p.id]||0)+1)} className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold">+</button></div></div>);})}</div></div></div>
      <div><div className="sticky top-0 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-5 shadow-sm"><div className="text-[11px] font-700 tracking-[.14em] text-slate-500 dark:text-white/50 uppercase">Resumen de venta</div><div className="mt-5 space-y-3 max-h-44 overflow-y-auto">{cartItems.length?cartItems.map(({product,qty})=><div key={product.id} className="flex justify-between gap-3 text-sm"><span className="text-slate-600 dark:text-white/70 truncate">{qty}× {product.name}</span><span className="font-600 text-slate-900 dark:text-white">{fmtMoney((product.salePrice||0)*qty)}</span></div>):<p className="text-sm text-slate-400 dark:text-white/45">Aún no hay productos.</p>}</div><div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 space-y-3"><div className="flex justify-between text-sm text-slate-600 dark:text-white/60"><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div><label className="flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-white/60"><span>Descuento</span><input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(Number(e.target.value))} className="w-24 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-right text-slate-900 dark:text-white font-600" /></label><div className="flex justify-between items-end pt-2"><span className="text-sm text-slate-600 dark:text-white/60">Total</span><strong className="font-display text-3xl text-[#0d9488] dark:text-white">{fmtMoney(total)}</strong></div></div></div><label className="block mt-5"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Método de pago</span><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as Sale['paymentMethod'])} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-[#86CCC0] transition-colors"><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option></select></label></div></div>
      {error && <div className="mt-5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}<div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><p className="text-xs text-slate-500 dark:text-slate-400">El stock se descontará al confirmar la operación.</p><div className="flex gap-3"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Confirmar venta</button></div></div></form></div></div>}
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

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue dark:text-blue-400 flex items-center justify-center"><Truck size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-blue dark:text-blue-400 uppercase">Logística y despacho</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Crear nota de entrega</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Organiza los artículos, destino y responsable del despacho.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div>
      <form onSubmit={saveDelivery} className="p-7"><div className="grid lg:grid-cols-[1fr_.9fr] gap-7"><div className="space-y-5">
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente destinatario</span><select required value={form.clientName} onChange={e=>selectClient(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm shadow-sm hover:border-[#86CCC0] transition-colors"><option value="">Seleccionar cliente</option>{CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Dirección de entrega</span><textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full min-h-24 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-[#86CCC0] transition-colors" placeholder="Dirección completa y referencias" /></label>
        <div className="grid sm:grid-cols-2 gap-4"><label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Fecha programada</span><DatePicker value={form.date} onChange={val=>setForm({...form,date:val})} /></label><label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Responsable</span><select required value={form.deliveredBy} onChange={e=>setForm({...form,deliveredBy:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-[#86CCC0] transition-colors"><option value="">Asignar repartidor</option><option>Pedro Gómez</option><option>Juan Castro</option><option>Andrés Moreno</option></select></label></div>
        <div className="grid sm:grid-cols-2 gap-4"><label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Estado inicial</span><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as DeliveryNote['status']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-[#86CCC0] transition-colors"><option value="pending">Pendiente</option><option value="delivered">Entregado</option><option value="failed">Fallido</option></select></label><label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Tipo de despacho</span><select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-[#86CCC0] transition-colors"><option>Entrega estándar</option><option>Entrega prioritaria</option><option>Retiro en tienda</option></select></label></div>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Instrucciones y observaciones</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full min-h-20 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm hover:border-[#86CCC0] transition-colors" placeholder="Horario, persona autorizada, referencias o cuidados especiales" /></label>
      </div><div><div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm"><div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"><strong className="text-sm text-slate-900 dark:text-white">Artículos del inventario</strong><span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Selecciona uno o varios productos</span></div><div className="max-h-[390px] overflow-y-auto p-2.5 space-y-2 bg-slate-50/70 dark:bg-slate-900">{inventory.filter(p=>p.stock>0).map(p => { const isSelected = form.itemIds.includes(p.id); return (<label key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-[#86CCC0]/15 border-[#86CCC0] dark:bg-[#86CCC0]/25 dark:border-[#86CCC0]/50 shadow-sm' : 'bg-white border-slate-200/90 hover:border-[#86CCC0]/60 dark:bg-slate-900 dark:border-slate-800'}`}><input type="checkbox" checked={isSelected} onChange={()=>toggleItem(p.id)} className="w-4 h-4 accent-[#86CCC0] rounded cursor-pointer"/><div className="flex-1 min-w-0"><span className={`block text-sm truncate ${isSelected ? 'font-700 text-slate-900 dark:text-white' : 'font-500 text-slate-800 dark:text-slate-200'}`}>{p.name}</span><span className="text-xs text-slate-500 dark:text-slate-400">{p.brand} · Stock {p.stock}</span></div><Badge cls={p.category==='game'?'sale':p.brand.toLowerCase()}>{p.category==='console'?'Consola':p.category==='game'?'Juego':'Producto'}</Badge></label>);})}</div><div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-xs font-600 text-slate-600 dark:text-slate-300 flex justify-between items-center"><span>{form.itemIds.length} artículo{form.itemIds.length===1?'':'s'} seleccionado{form.itemIds.length===1?'':'s'}</span>{form.itemIds.length > 0 && <span className="inline-block px-2 py-0.5 rounded-full bg-[#86CCC0] text-slate-900 font-bold text-[10px]">Seleccionado</span>}</div></div></div></div>
        {error && <div className="mt-5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Generar nota</button></div></form></div></div>}
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

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Wrench size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-amber-600 dark:text-amber-400 uppercase">Recepción técnica</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Crear orden de servicio</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Documenta el equipo, la falla reportada y la planificación inicial.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div>
      <form onSubmit={saveService} className="p-7"><div className="grid sm:grid-cols-2 gap-5">
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente</span><select required value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar cliente</option>{CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
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

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"><button aria-label="Cerrar" className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-[#f1efff] dark:bg-indigo-950/60 text-[#6153d6] dark:text-indigo-400 flex items-center justify-center"><Shield size={22}/></div><div><div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Protección postventa</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar nueva garantía</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Asocia un producto y define las condiciones de cobertura.</p></div></div><button onClick={()=>setModalOpen(false)} className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div>
      <form onSubmit={saveWarranty} className="p-7"><div className="grid sm:grid-cols-2 gap-5">
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Cliente titular</span><select required value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"><option value="">Seleccionar cliente</option>{CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select></label>
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

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><button className="absolute inset-0 bg-slate-800/20 dark:bg-slate-950/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} /><div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl hero-banner dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="h-1.5 bg-gradient-to-r from-[#6153d6] to-[#86CCC0]" /><div className="flex justify-between items-start px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800"><div><div className="text-[11px] font-700 tracking-[.14em] text-[#6153d6] dark:text-indigo-400 uppercase">Control de inventario</div><h3 className="font-display text-2xl font-700 text-slate-900 dark:text-white mt-1">Registrar producto</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configura sus características comerciales y disponibilidad.</p></div><button onClick={()=>setModalOpen(false)} className="p-2 h-fit rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={19}/></button></div><form onSubmit={saveProduct} className="p-7 grid sm:grid-cols-2 gap-5">
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Nombre comercial</span><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Ej. PlayStation 5 Slim 1TB" /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Tipo de producto</span><select value={form.category} onChange={e=>setForm({...form,category:e.target.value as Product['category']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="console">Consola</option><option value="game">Videojuego</option><option value="accessory">Accesorio</option><option value="card">Digital</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Marca / Plataforma</span><select value={form.brand} onChange={e=>setForm({...form,brand:e.target.value as Product['brand']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option>PS5</option><option>PS4</option><option>Xbox</option><option>Multi</option></select></label>
        <label className="sm:col-span-2"><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Capacidad y especificaciones</span><input required value={form.specification} onChange={e=>setForm({...form,specification:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Consola: 1TB SSD · Juego: edición/plataforma · Accesorio: color/conectividad" /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Stock inicial</span><input type="number" min="0" required value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Modalidad</span><select value={form.type} onChange={e=>setForm({...form,type:e.target.value as Product['type']})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"><option value="both">Venta y alquiler</option><option value="sale">Solo venta</option><option value="rental">Solo alquiler</option></select></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Precio de venta</span><input type="number" min="0" value={form.salePrice} onChange={e=>setForm({...form,salePrice:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
        <label><span className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-2">Tarifa de alquiler / día</span><input type="number" min="0" value={form.rentalPrice} onChange={e=>setForm({...form,rentalPrice:Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" /></label>
        <div className="sm:col-span-2 flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800"><button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#6153d6] text-white text-sm font-600 shadow-lg shadow-[#6153d6]/20 hover:bg-[#5548c5] transition-colors">Guardar producto</button></div>
      </form></div></div>}
    </div>
  );
}

// ─── Admin: Contact & Location ───────────────────────────────────────────────

function ContactLocationSection() {
  const [messages] = useState<ContactMessage[]>(CONTACT_MESSAGES);
  const [info, setInfo] = useState({
    address: 'Av. Principal, Urb. Las Palmas, Quinta 5, Caracas 1050, Venezuela',
    phone: '+58 (412) 555-1234',
    whatsapp: '+58 (414) 999-0011',
    email: 'contacto@gamevaultpro.com',
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
                title="Mapa de Ubicación GameVault"
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

const SIDEBAR_ITEMS: { key: AdminSection; label: string; icon: React.ReactNode; count?: number }[] = [
  { key: 'dashboard', label: 'Panel Principal', icon: <LayoutDashboard size={18} /> },
  { key: 'clients', label: 'Clientes', icon: <Users size={18} />, count: CLIENTS.length },
  { key: 'rentals', label: 'Alquileres', icon: <Gamepad2 size={18} />, count: RENTALS.filter(r=>r.status==='active').length },
  { key: 'sales', label: 'Ventas', icon: <ShoppingBag size={18} />, count: SALES.length },
  { key: 'deliveries', label: 'Notas de Entrega', icon: <Truck size={18} />, count: DELIVERIES.filter(d=>d.status==='pending').length },
  { key: 'technical', label: 'Servicio Técnico', icon: <Wrench size={18} />, count: TECH_SERVICES.filter(t=>t.status!=='delivered').length },
  { key: 'warranties', label: 'Garantías', icon: <Shield size={18} />, count: WARRANTIES.filter(w=>w.status==='active').length },
  { key: 'purchases', label: 'Inventario', icon: <Package size={18} />, count: PRODUCTS.filter(p=>p.stock<=2).length },
  { key: 'contact', label: 'Ubicación y Contacto', icon: <MapPin size={18} /> },
];

function AdminLoginModal({ onLoginSuccess, navigateTo }: { onLoginSuccess: () => void; navigateTo: (v: View) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === 'admin' && (password === 'admin' || password === 'admin123')) {
      onLoginSuccess();
    } else {
      setError('Usuario o contraseña incorrectos. (Prueba admin / admin123)');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 hero-banner dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden animate-in fade-in duration-300">
        <div className="h-2 bg-gradient-to-r from-[#6153d6] via-indigo-500 to-[#86CCC0]" />
        
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-100/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-sm border border-blue-200/70 dark:border-indigo-900/50">
              <Shield size={32} />
            </div>
            <h2 className="font-display text-2xl font-700 text-slate-900 dark:text-white">Acceso Administrativo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ingresa tus credenciales para acceder al panel de control de GameVault Pro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">
                Usuario de Administrador
              </label>
              <div className="relative">
                <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-600 text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 font-500 animate-in fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#6153d6] hover:bg-[#5244be] text-white font-600 text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mt-2"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => navigateTo('catalog')}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-500 transition-colors inline-flex items-center gap-1.5"
            >
              <Layers size={13} /> Volver al catálogo público
            </button>
          </div>
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
  const [inventory, setInventory] = useState<Product[]>(PRODUCTS);
  const [rentals, setRentals] = useState<Rental[]>(RENTALS);

  const handleLoginSuccess = () => {
    sessionStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

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
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col flex-shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ borderRight: '1px solid #e2e8f0', top: '64px', height: 'calc(100vh - 64px)' }}>
        <nav className="flex-1 py-4 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => {
            const active = section === item.key;
            return (
              <button key={item.key}
                onClick={() => { setSection(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all relative ${active ? 'sidebar-item-active font-600' : 'text-muted hover:text-gtext hover:bg-[rgba(139,92,246,0.05)]'}`}>
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
        <div className="p-4 border-t border-[rgba(139,92,246,0.1)] flex flex-col gap-2">
          <button
            onClick={() => navigateTo('catalog')}
            className="w-full py-2.5 px-3 rounded-xl bg-[#172033] dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors text-xs font-600 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Layers size={14} className="text-white" /> Volver al Catálogo
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all text-xs font-600 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <LogOut size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" /> Cerrar Sesión
          </button>
          <div className="text-xs text-muted text-center mt-1">GameVault Pro v1.0</div>
          <div className="text-[10px] text-muted text-center opacity-50">Sistema de Gestión</div>
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

function Navbar({ navigateTo, darkMode, setDarkMode }: { navigateTo: (v: View) => void; darkMode: boolean; setDarkMode: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <header className="navbar-blur fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-6 gap-6 transition-colors duration-200">
      {/* Logo */}
      <div onClick={() => navigateTo('catalog')} className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#172033] dark:bg-indigo-600 shadow-md">
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

