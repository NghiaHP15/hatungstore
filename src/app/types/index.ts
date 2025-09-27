export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'cashier';
  permissions?: Record<string, boolean>;
  created_at?: string;
  updated_at?: string;
  password?: string;
}

export interface UnitProduct {
  id: string;
  name: string;
  unit_name: string;
  price: number;
  product_id: string;
  product?: Product;
}

export interface Product {
  id: string
  image_url?: string
  name: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
  category_id?: string;
  category?: Category;
  units?: ProductUnit[];
}

export interface Category {
  id?: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at?: string;
  invoice?: Invoice[];
}

export interface Invoice {
  id: string;
  invoice_code?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  amount?: number;
  cashier_id?: string;
  status: boolean;
  discount_amount?: number;
  total_amount?: number;
  created_at?: string;
  items?: InvoiceItem[];
  customer?: Customer;
  cashier?: User;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_unit_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_unit?: ProductUnit;
}

export interface ProductUnit {
  id: string
  name: string;
  price: number
  product_id: string
  unit_name: string
  created_at?: number
  image_url?: string
  product?: Product
}

export interface Shipping {
  id: string
  shipping_code?: string
  status: boolean
  note: string
  items?: ShippingItem[]
  created_at?: string
}

export interface ShippingItem {
  id?: string
  shipping_id?: string
  invoice_id?: string
  priority?: number
  invoice: Invoice | null
}

export interface UserPermissions {
  canManageProducts: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canProcessRefunds: boolean;
  canManageInventory: boolean;
  canPrintInvoices: boolean;
}



