import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { env } from '@/env';
import { tokenStore, type TokenStore } from '@/shared/auth/token-store';
import { HTTP_TIMEOUT_MS } from '@/shared/lib/constants';

import { ApiError, type ApiErrorCode } from './api-error';

/**
 * Single axios instance shared by every TanStack Query hook.
 *
 * Responsibilities:
 *   1. Attach Authorization: Bearer <access> on every request (when present).
 *   2. On 401: attempt one refresh, retry the original request once.
 *   3. Unwrap the gateway's { data, meta? } success envelope into T (and (T, meta)
 *      for paginated calls).
 *   4. Map error responses to ApiError so call sites can branch on .code.
 *
 * The instance accepts a TokenStore via configureHttpClient — tests inject a fake.
 */

// Augment AxiosRequestConfig with our internal flags so we can pass them
// through interceptors without losing type safety.
declare module 'axios' {
  export interface AxiosRequestConfig {
    __skipAuth?: boolean;
    __isRetry?: boolean;
  }
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  __isRetry?: boolean;
  __skipAuth?: boolean;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

interface ConfigureOptions {
  tokenStore?: TokenStore;
  onAuthFailure?: () => void;
}

let httpClient: AxiosInstance | null = null;
let activeTokenStore: TokenStore = tokenStore;
let refreshPromise: Promise<string> | null = null;
let onAuthFailure: (() => void) | null = null;

export function configureHttpClient(options: ConfigureOptions = {}): AxiosInstance {
  if (options.tokenStore) activeTokenStore = options.tokenStore;
  if (options.onAuthFailure) onAuthFailure = options.onAuthFailure;

  const instance = axios.create({
    baseURL: env.VITE_API_BASE_URL,
    timeout: HTTP_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    const cfg = config as RetriableConfig;
    if (cfg.__skipAuth) return config;
    const access = activeTokenStore.getAccessToken();
    if (access) {
      config.headers.set('Authorization', `Bearer ${access}`);
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalConfig = error.config as RetriableConfig | undefined;

      // 401 -> try one refresh, then retry once
      if (
        error.response?.status === 401 &&
        originalConfig &&
        !originalConfig.__isRetry &&
        !originalConfig.__skipAuth &&
        activeTokenStore.getRefreshToken()
      ) {
        try {
          const newAccess = await ensureRefresh(instance);
          originalConfig.__isRetry = true;
          originalConfig.headers.set('Authorization', `Bearer ${newAccess}`);
          return instance.request(originalConfig);
        } catch {
          activeTokenStore.clear();
          onAuthFailure?.();
          throw mapToApiError(error);
        }
      }

      throw mapToApiError(error);
    },
  );

  httpClient = instance;
  return instance;
}

function ensureRefresh(instance: AxiosInstance): Promise<string> {
  // Coalesce parallel 401s into a single refresh round-trip.
  if (refreshPromise) return refreshPromise;

  const refreshToken = activeTokenStore.getRefreshToken();
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  refreshPromise = instance
    .post<{ data: { accessToken: string; refreshToken: string; expiresIn: number } }>(
      '/api/v1/auth/refresh',
      { refreshToken },
      { __skipAuth: true } as AxiosRequestConfig,
    )
    .then((res) => {
      const tokens = res.data.data;
      activeTokenStore.setAccessToken(tokens.accessToken);
      activeTokenStore.setRefreshToken(tokens.refreshToken);
      return tokens.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function mapToApiError(error: AxiosError): ApiError {
  // Network / no response
  if (!error.response) {
    return new ApiError(error.message || 'Network error', 0, 'NETWORK_ERROR');
  }

  const data = error.response.data as
    | { statusCode?: number; message?: string; code?: ApiErrorCode; error?: string }
    | undefined;

  const status = error.response.status;
  const message = data?.message ?? error.message ?? 'Request failed';
  const code: ApiErrorCode = data?.code ?? statusToCode(status);

  return new ApiError(message, status, code);
}

function statusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 422: return 'UNPROCESSABLE_ENTITY';
    case 429: return 'TOO_MANY_REQUESTS';
    default: return status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN';
  }
}

function getInstance(): AxiosInstance {
  if (!httpClient) httpClient = configureHttpClient();
  return httpClient;
}

// ── Typed helpers that unwrap the { data } / { data, meta } envelope ───────
// The gateway's TransformInterceptor wraps every successful response. These
// helpers strip the envelope so call sites work with the inner T directly.
//
// The `as T` casts on POST/PATCH are intentional: 204 No Content responses
// have no body. Callers that pass `<void>` get `undefined` (compatible) and
// callers that pass `<T>` are trusting the gateway to honour its contract.

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await getInstance().get<{ data: T }>(url, config);
  return res.data.data;
}

export async function apiGetPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<PaginatedResult<T>> {
  const res = await getInstance().get<{ data: T[]; meta: PaginationMeta }>(url, config);
  return { items: res.data.data, meta: res.data.meta };
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await getInstance().post<{ data: T }>(url, body, config);
  return res.data?.data as T;
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await getInstance().patch<{ data: T }>(url, body, config);
  return res.data?.data as T;
}

export async function apiDelete(url: string, config?: AxiosRequestConfig): Promise<void> {
  await getInstance().delete(url, config);
}
