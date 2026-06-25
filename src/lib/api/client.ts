import { createClient } from '@/lib/supabase/client';

export async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request(url: string, options: RequestOptions = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const headers: Record<string, string> = {
    ...authHeaders,
    ...(options.headers || {}),
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
}

export const api = {
  get: (url: string, options?: RequestOptions) =>
    request(url, { ...options, method: 'GET' }),

  post: (url: string, body?: unknown, options?: RequestOptions) =>
    request(url, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: (url: string, body?: unknown, options?: RequestOptions) =>
    request(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  del: (url: string, options?: RequestOptions) =>
    request(url, { ...options, method: 'DELETE' }),
};
