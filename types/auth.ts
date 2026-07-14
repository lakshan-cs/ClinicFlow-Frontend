export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserData {
  token: string;
  [key: string]: unknown;
}
