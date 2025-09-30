import { UserPermissions } from "@/app/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const defaultPermissions: Record<string, UserPermissions> = {
  admin: {
    canManageProducts: true,
    canViewReports: true,
    canManageUsers: true,
    canProcessRefunds: true,
    canManageInventory: true,
    canPrintInvoices: true,
  },
  manager: {
    canManageProducts: true,
    canViewReports: true,
    canManageUsers: false,
    canProcessRefunds: true,
    canManageInventory: true,
    canPrintInvoices: true,
  },
  cashier: {
    canManageProducts: false,
    canViewReports: false,
    canManageUsers: false,
    canProcessRefunds: false,
    canManageInventory: false,
    canPrintInvoices: true,
  },
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}${day}-${random}`;
};

export const calculateTax = (subtotal: number, taxRate: number = 0.08): number => {
  return subtotal * taxRate;
};

export const formatDateTime = (date: string): string => dayjs(date).tz('Asia/Ho_Chi_Minh').format("hh:mm DD/MM/YYYY");


export const toLowerCaseNonAccent = (str: string) => {
  let normalized = str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // xóa dấu

    // Thay thế các ký tự đặc biệt riêng của tiếng Việt
  normalized = normalized
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d");

    // Trả về dạng chữ thường
  return normalized.toLowerCase();
}