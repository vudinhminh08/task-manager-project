export interface AuthRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName?: string;
  phone?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
}

export interface ProfilePayload {
  fullName: string;
}
