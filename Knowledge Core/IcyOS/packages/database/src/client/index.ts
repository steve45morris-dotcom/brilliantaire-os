// Simple mock Supabase client connection
export class SupabaseMockClient {
  constructor(private url: string, private key: string) {}
  async query<T>(table: string, payload?: any): Promise<T[]> {
    return [];
  }
}
export const dbClient = new SupabaseMockClient('http://localhost:54321', 'mock-anon-key');
