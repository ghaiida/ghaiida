import { localAssetUrl, localRequest, LocalError } from './localApi.ts';

// The single-file trial build runs without a server and keeps data in the browser.
export const LOCAL = import.meta.env.VITE_LOCAL_DEMO === '1';

// Thin fetch wrapper: JSON in/out, cookies for the teacher session, Arabic error messages.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; raw?: Blob } = {}): Promise<T> {
  if (LOCAL) {
    try {
      return (await localRequest(init.method ?? (init.body !== undefined || init.raw ? 'POST' : 'GET'), path, init.body, init.raw)) as T;
    } catch (e) {
      if (e instanceof LocalError) throw new ApiError(e.status, e.message, e.data);
      throw new ApiError(0, 'حدث خطأ غير متوقع. حاولي مرة أخرى.');
    }
  }
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? (init.body !== undefined || init.raw ? 'POST' : 'GET'),
      credentials: 'same-origin',
      headers: init.raw ? { 'content-type': init.raw.type || 'application/octet-stream' } : init.body !== undefined ? { 'content-type': 'application/json' } : {},
      body: init.raw ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'تعذّر الاتصال بالخادم. تحققي من اتصال الإنترنت ثم حاولي مجددًا.');
  }
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) throw new ApiError(res.status, typeof data.error === 'string' ? data.error : 'حدث خطأ غير متوقع. حاولي مرة أخرى.', data);
  return data as T;
}

export const assetUrl = (id: string | null | undefined) => (!id ? '' : LOCAL ? localAssetUrl(id) : `/api/assets/${id}`);
