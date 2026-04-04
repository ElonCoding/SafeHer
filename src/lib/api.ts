import { supabase } from "@/integrations/supabase/client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Centarlized API client for Safe-Her Backend
 */
export const api = {
  /**
   * Helper to get common headers including Supabase Auth Token
   */
  getHeaders: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    return headers;
  },

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `GET ${endpoint} failed: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, body: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `POST ${endpoint} failed: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Generic PUT/PATCH request
   */
  async patch<T>(endpoint: string, body: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `PATCH ${endpoint} failed: ${response.status}`);
    }

    return response.json();
  },
};
