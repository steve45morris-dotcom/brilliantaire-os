export class DatabaseError extends Error {
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}
