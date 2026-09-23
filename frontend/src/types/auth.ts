export type Role = "INSPECTOR" | "OFFICER" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
}

export interface LoginResponse {
  success: true;
  token: string;
  user: AuthUser;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  details?: unknown;
}
