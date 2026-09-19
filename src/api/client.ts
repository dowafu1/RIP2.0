const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ClothingItem {
  id: number;
  name: string;
  category: string;
  price: number;
  size: string;
  color: string;
  is_bought: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  token: string;
}

export interface ChatMessage {
  id: number;
  username: string;
  message: string;
  timestamp: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка запроса' }));
    throw new Error(error.detail || 'Ошибка запроса');
  }

  return response.json();
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string) =>
    request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// Clothing Items CRUD
export const clothingApi = {
  getAll: () => request<ClothingItem[]>('/items'),
  getById: (id: number) => request<ClothingItem>(`/items/${id}`),
  create: (item: Partial<ClothingItem>) =>
    request<ClothingItem>('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  update: (id: number, item: Partial<ClothingItem>) =>
    request<ClothingItem>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),
  delete: (id: number) =>
    request<void>(`/items/${id}`, { method: 'DELETE' }),
};

// Chat
export const chatApi = {
  getMessages: () => request<ChatMessage[]>('/chat/messages'),
};
