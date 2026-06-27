export type UserRole = "admin" | "kasir";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export type PaymentMethod = "cash" | "qris" | "debit";
export type TransactionStatus = "paid" | "cancelled";

export interface Transaction {
  id: string;
  cashier_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  cash_received: number | null;
  payment_proof_url: string | null;
  status: TransactionStatus;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
