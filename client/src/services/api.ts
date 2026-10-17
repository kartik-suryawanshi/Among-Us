import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface ApiErrorResponse {
  error: string;
  statusCode?: number;
  isRateLimit?: boolean;
  resetAt?: string;
}

export function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'The request timed out. Please verify your connection and try again.';
    }
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error) {
      return data.error;
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response?.status === 403 || error.response?.status === 429) {
      return 'GitHub API rate limit exceeded or access forbidden. Please try again shortly.';
    }
    return error.message || 'Unable to connect to the server.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
