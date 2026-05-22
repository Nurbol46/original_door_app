import { BASE_URL } from './config';

const getToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    localStorage.clear();
    window.location.href = '/';
    throw new Error('Сессия истекла');
  }

  const res = await fetch(`${BASE_URL}/auth/login/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    localStorage.clear();
    window.location.href = '/';
    throw new Error('Сессия истекла');
  }

  const data = await res.json();
  localStorage.setItem('access_token', data.access);
  return data.access;
};

// FIX: добавлена проверка на 204 No Content — res.json() на пустом теле бросал SyntaxError
export const request = async (url, options = {}, retry = true) => {
  let token = getToken();
  const isAuthEndpoint =
    url.startsWith('/auth/login/') ||
    url.startsWith('/auth/register/') ||
    url.startsWith('/auth/login/refresh/');

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  } catch (error) {
    throw new Error('Не удалось подключиться к серверу');
  }

  if (res.status === 401 && retry && !isAuthEndpoint) {
    const newToken = await refreshAccessToken();
    return request(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${newToken}` } }, false);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw errorData;
  }

  // FIX: 204 No Content — тела нет, json() бросил бы ошибку
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null;
  }

  if (options.responseType === 'blob') {
    return res.blob();
  }

  return res.json();
};

// ====================== AUTH ======================
export const login = async (email, password) => {
  const data = await request('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  localStorage.setItem('user_role', data.role);
  localStorage.setItem('user_id', data.user_id);
  localStorage.setItem('full_name', data.full_name || '');
  return data;
};

export const register = async (userData) => {
  const data = await request('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  localStorage.setItem('user_role', data.role || 'user');
  localStorage.setItem('user_id', data.user_id);
  localStorage.setItem('full_name', data.full_name || userData.full_name || '');
  return data;
};

// ====================== SERVICES ======================
export const getServices = async () => {
  return request('/orders/services/', { method: 'GET' });
};

export const downloadServicesPdf = async () => {
  return request('/orders/services/pdf/', { method: 'GET', responseType: 'blob' });
};

// ====================== USER ORDERS ======================
export const getMyOrders = async () => {
  return request('/orders/', { method: 'GET' });
};

export const createOrder = async (orderData) => {
  return request('/orders/', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};

export const getOrderDetail = async (id) => {
  return request(`/orders/${id}/`, { method: 'GET' });
};

// ====================== NOTIFICATIONS ======================
export const getNotifications = async () => {
  return request('/orders/notifications/', { method: 'GET' });
};

export const markNotificationRead = async (id) => {
  return request(`/orders/notification/${id}/read/`, { method: 'PATCH' });
};

export const hasNewNotifications = async () => {
  return request('/orders/has-new/', { method: 'GET' });
};

// ====================== PROFILE ======================
export const getProfile = async () => {
  return request('/auth/profile/', { method: 'GET' });
};

export const updateProfile = async (profileData) => {
  return request('/auth/profile/', {
    method: 'PATCH',
    body: profileData instanceof FormData ? profileData : JSON.stringify(profileData),
  });
};

// ====================== MANAGER SERVICES ======================
export const getManagerServices = async () => {
  return request('/manager/services/', { method: 'GET' });
};

export const createManagerService = async (serviceData) => {
  return request('/manager/services/', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
};

export const updateManagerService = async (id, serviceData) => {
  return request(`/manager/services/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(serviceData),
  });
};

export const deleteManagerService = async (id) => {
  return request(`/manager/services/${id}/`, { method: 'DELETE' });
};

// ====================== MANAGER ORDERS ======================
export const getAllOrders = async () => {
  return request('/manager/orders/', { method: 'GET' });
};

export const getManagerOrderDetail = async (id) => {
  return request(`/manager/orders/${id}/`, { method: 'GET' });
};

export const updateOrderManager = async (id, data) => {
  return request(`/manager/orders/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteManagerOrder = async (id) => {
  return request(`/manager/orders/${id}/`, { method: 'DELETE' });
};

export const uploadManagerFile = async (orderId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request(`/manager/orders/${orderId}/files/`, {
    method: 'POST',
    body: formData,
  });
};

// ====================== MANAGER USERS ======================
export const getManagerUsers = async () => {
  return request('/manager/users/', { method: 'GET' });
};

export const deleteManagerUser = async (id) => {
  return request(`/manager/users/${id}/`, { method: 'DELETE' });
};

// ====================== UTILS ======================
export const logout = () => {
  localStorage.clear();
  window.location.href = '/';
};

export const isManager = () => localStorage.getItem('user_role') === 'manager';
export const getCurrentRole = () => localStorage.getItem('user_role');
export const getFullName = () => localStorage.getItem('full_name');
