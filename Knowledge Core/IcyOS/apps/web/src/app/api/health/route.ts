
import { NextResponse } from 'next/server';
import { jsonResponse } from '../../../lib/api/response';

export async function GET() {
  return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
}
