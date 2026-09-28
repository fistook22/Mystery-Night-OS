export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH',
  url: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'שגיאה');
  return data as T;
}

// Guest tokens are kept on the device so QR-sticker links and reopened tabs find the player again.
const KEY = 'mn.guestToken';
export const guestToken = {
  get: (): string | null => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set: (t: string) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode: the token stays in the URL */
    }
  },
};
