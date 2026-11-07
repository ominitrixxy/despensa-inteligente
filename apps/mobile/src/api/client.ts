import { Session, useAuth } from '../store/auth';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function rawRequest<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('\n') : (data?.message ?? 'Erro inesperado');
    throw new ApiError(res.status, message);
  }
  return data as T;
}

let refreshing: Promise<Session | null> | null = null;

async function refreshSession(): Promise<Session | null> {
  const current = useAuth.getState().session;
  if (!current) return null;
  try {
    const next = await rawRequest<Session>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    await useAuth.getState().setSession(next);
    return next;
  } catch {
    await useAuth.getState().logout();
    return null;
  }
}

/** Requisição autenticada com refresh automático (single-flight) em caso de 401. */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const doCall = (token?: string) =>
    rawRequest<T>(path, {
      method: init.method ?? 'GET',
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      token,
    });

  const session = useAuth.getState().session;
  try {
    return await doCall(session?.accessToken);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && session) {
      refreshing = refreshing ?? refreshSession().finally(() => (refreshing = null));
      const next = await refreshing;
      if (next) return doCall(next.accessToken);
    }
    throw e;
  }
}

export const authApi = {
  login: (email: string, password: string) =>
    rawRequest<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    rawRequest<Session>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    }),
  logout: (refreshToken: string) =>
    rawRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => null),
};
