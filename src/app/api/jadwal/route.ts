import { NextResponse } from 'next/server';
import { fetchJadwalList } from '@/server/services/jadwal.service';

export async function GET() {
  try {
    const data = await fetchJadwalList();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
