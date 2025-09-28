/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('supabase.auth.token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('supabase.auth.token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);


export const authAPI = {
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

export const usersAPI = {
  getUsers: (params: any) => api.get('/users', { params }),
  getUser: (id: string) => api.get(`/users/${id}`),
  createUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

export const storeAPI = {
  getStore: () => api.get(`/store`),
  updateStore: (data: any) => api.put(`/store`, data),
};

export const reportAPI = {
  getGeneral: () => api.get(`/report/general`),
};

export const productunitsAPI = {
  getProductUnits: (params: any) => api.get('/product-units', { params }),
  getProductUnit: (id: string) => api.get(`/product-units/${id}`),
  createProductUnit: (data: any) => api.post('/product-units', data),
  updateProductUnit: (id: string, data: any) => api.put(`/product-units/${id}`, data),
  deleteProductUnit: (id: string) => api.delete(`/product-units/${id}`),
};

export const productsAPI = {
  getProducts: (params: any) => api.get('/products', { params }),
  getProduct: (id: string) => api.get(`/products/${id}`),
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
};

export const categoriesAPI = {
  getCategories: (params?: any) => api.get('/categories', { params }),
  createCategory: (data: any) => api.post('/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}`),
};

export const invoicesAPI = {
  getInvoices: (params: any) => api.get('/invoices', { params }),
  getInvoice: (id: string) => api.get(`/invoices/${id}`),
  createInvoice: (data: any) => api.post('/invoices', data),
  updateInvoice: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  deleteInvoice: (id: string) => api.delete(`/invoices/${id}`),
};

export const shippingAPI = {
  getShippings: (params: any) => api.get('/shippings', { params }),
  getShipping: (id: string) => api.get(`/shippings/${id}`),
  createShipping: (data: any) => api.post('/shippings', data),
  updateShipping: (id: string, data: any) => api.put(`/shippings/${id}`, data),
  deleteShipping: (id: string) => api.delete(`/shippings/${id}`),
  getPrioritizedShippings: (params: any) => api.get('/shippings/prioritized', { params }),
};

export const customersAPI = {
  getCustomers: (params?: any) => api.get('/customers', { params }),
  getCustomer: (id: string) => api.get(`/customers/${id}`),
  createCustomer: (data: any) => api.post('/customers', data),
  updateCustomer: (id: string, data: any) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/customers/${id}`),
};

export const uploadAPI = {
  uploadImage: (data: FormData) => {
    return api.post('/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteImage: (id: string) => api.delete(`/upload`, { params: { publicId: id } }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentSales: () => api.get('/dashboard/recent-sales'),
  getLowStockProducts: () => api.get('/dashboard/low-stock'),
};

export default api;