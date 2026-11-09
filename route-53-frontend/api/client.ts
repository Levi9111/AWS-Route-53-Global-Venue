const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export class ApiClientError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code = 'API_ERROR', status = 500) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path.startsWith('/api') ? path : `/api${path}`}`;

  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send & receive httpOnly JWT cookies
    cache: 'no-store',
  });

  let body: Record<string, unknown> | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errObj = body?.error as
      | { code?: string; message?: string }
      | undefined;
    const message =
      errObj?.message ||
      (typeof body?.message === 'string' ? body.message : null) ||
      `Request failed with status ${response.status}`;
    const code = errObj?.code || 'REQUEST_FAILED';
    throw new ApiClientError(message, code, response.status);
  }

  return body as T;
}

/**
 * Formats integer cents into USD currency string (e.g. 45000 -> "$450.00" or "$450")
 */
export function formatCents(
  cents: number,
  options: { includeDecimals?: boolean } = {},
): string {
  const dollars = (cents || 0) / 100;
  const hasCents = (cents || 0) % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits:
      options.includeDecimals || hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return Number(((cents || 0) / 100).toFixed(2));
}
