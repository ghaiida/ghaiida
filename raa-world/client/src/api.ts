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

export const assetUrl = (id: string | null | undefined) => (id ? `/api/assets/${id}` : '');
