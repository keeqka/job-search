import type { ResourceName } from '@/types';

const API_URL = '/api' + new URL(import.meta.env.VITE_API_URL).pathname;

export class ApiError extends Error {}

interface ApiSuccess<T> {
  success: true;
  data: T;
}
interface ApiFailure {
  success: false;
  error: string;
}
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

function assertConfigured() {
  if (!API_URL) {
    throw new ApiError(
      'VITE_API_URL is not configured. Copy .env.example to .env and set your Apps Script Web App URL — see README.md.',
    );
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  assertConfigured();
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError('Could not reach the Google Apps Script API. Check VITE_API_URL and your network connection.');
  }
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiError(json.error || 'Unknown API error');
  }
  return json.data;
}

// Writes are sent as POST with a text/plain body so the browser treats them
// as "simple requests" and never issues a CORS preflight (which Apps Script
// web apps cannot answer). The intended verb travels inside the JSON body.
function writeRequest<T>(resource: ResourceName, method: 'POST' | 'PUT' | 'DELETE', payload: Record<string, unknown>): Promise<T> {
  return request<T>(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ resource, method, ...payload }),
  });
}

export function apiList<T>(resource: ResourceName): Promise<T[]> {
  return request<T[]>(`${API_URL}?resource=${resource}`);
}

export function apiGet<T>(resource: ResourceName, id: string): Promise<T> {
  return request<T>(`${API_URL}?resource=${resource}&id=${encodeURIComponent(id)}`);
}

export function apiCreate<T>(resource: ResourceName, data: Partial<T>): Promise<T> {
  return writeRequest<T>(resource, 'POST', { data });
}

export function apiUpdate<T>(resource: ResourceName, id: string, data: Partial<T>): Promise<T> {
  return writeRequest<T>(resource, 'PUT', { id, data });
}

export function apiDelete(resource: ResourceName, id: string): Promise<{ id: string }> {
  return writeRequest<{ id: string }>(resource, 'DELETE', { id });
}

/** Wipes every row across every sheet. Requires Code.gs's clearAllData handler. */
export function apiClearAllData(): Promise<string> {
  return request<string>(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ resource: '__all__', method: 'CLEAR_ALL' }),
  });
}
