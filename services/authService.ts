import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5064/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserData {
  token: string;
  [key: string]: unknown;
}

export async function loginUser(credentials: LoginCredentials): Promise<UserData> {
  const response = await axios.post<UserData>(`${API_BASE_URL}/user/login`, credentials);
  return response.data;
}

export function saveUser(userData: UserData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
  }
}

export function getUser(): UserData | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? (JSON.parse(user) as UserData) : null;
}

export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}
