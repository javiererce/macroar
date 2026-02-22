import { NextResponse } from 'next/server';
import { getInflacion, getReservas, getRiesgoPais, getDolares, getDolarHistorico, getTasaBadlar } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [inflacion, reservas, riesgoPais, dolares, dolarHistorico, tasaBadlar] = await Promise.all([
            getInflacion(),
            getReservas(),
            getRiesgoPais(),
            getDolares(),
            getDolarHistorico(),
            getTasaBadlar(),
        ]);

        return NextResponse.json({
            inflacion,
            reservas,
            riesgoPais,
            dolares,
            dolarHistorico,
            tasaBadlar,
            lastUpdate: new Date().toISOString(),
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
