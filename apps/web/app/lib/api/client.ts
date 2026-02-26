import { getAccessToken } from "@auth0/nextjs-auth0";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken } = await getAccessToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    if (res.status === 422) {
      const body = await res.json();
      throw new ValidationError(body.message);
    }
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `API error: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export class ValidationError extends Error {
  constructor(public fields: { field: string; message: string }[]) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}
