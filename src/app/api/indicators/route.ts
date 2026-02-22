import { NextResponse } from 'next/server';
import { getInflacion, getReservas, getRiesgoPais, getDolares, getDolarHistorico, getTasaBadlar, getTasasBancos, getTasasCuentas, getCryptoPrices } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const results = await Promise.allSettled([
            getInflacion(),
            getReservas(),
            getRiesgoPais(),
            getDolares(),
            getDolarHistorico(),
            getTasaBadlar(),
            getTasasBancos(),
            getTasasCuentas(),
            getCryptoPrices(),
        ]);

        const [inflacion, reservas, riesgoPais, dolares, dolarHistorico, tasaBadlar, tasasBancos, tasasCuentas, cryptos] = results.map(r =>
            r.status === 'fulfilled' ? r.value : null
        );

        return NextResponse.json({
            inflacion: inflacion ?? [],
            reservas: reservas ?? [],
            riesgoPais: riesgoPais ?? { actual: 620, historico: [] },
            dolares: dolares ?? { oficial: 1063, blue: 1220, mep: 1198, ccl: 1205 },
            dolarHistorico: dolarHistorico ?? [],
            tasaBadlar: tasaBadlar ?? 34.5,
            tasasBancos: tasasBancos ?? [],
            tasasCuentas: tasasCuentas ?? [],
            cryptos: cryptos ?? [],
            lastUpdate: new Date().toISOString(),
        });
    } catch (e) {
        return NextResponse.json({ error: 'Critical failure' }, { status: 500 });
    }
}
