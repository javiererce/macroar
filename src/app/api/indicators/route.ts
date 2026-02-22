import { NextResponse } from 'next/server';
import { getInflacion, getReservas, getRiesgoPais, getDolares, getDolarHistorico, getTasaBadlar, getTasasBancos, getTasasCuentas } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [inflacion, reservas, riesgoPais, dolares, dolarHistorico, tasaBadlar, tasasBancos, tasasCuentas] = await Promise.all([
            getInflacion(),
            getReservas(),
            getRiesgoPais(),
            getDolares(),
            getDolarHistorico(),
            getTasaBadlar(),
            getTasasBancos(),
            getTasasCuentas(),
        ]);

        return NextResponse.json({
            inflacion,
            reservas,
            riesgoPais,
            dolares,
            dolarHistorico,
            tasaBadlar,
            tasasBancos,
            tasasCuentas,
            lastUpdate: new Date().toISOString(),
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
