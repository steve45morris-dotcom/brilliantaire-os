import { ApiResponseEnvelope } from '@icyos/shared';

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponseEnvelope<T>> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  const data: ApiResponseEnvelope<T> = await response.json();
  return data;
}
