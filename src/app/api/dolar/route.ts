import { NextResponse } from "next/server";

export const revalidate = 1800; // 30 min

const ARGDATA = "https://api.argentinadatos.com/v1";

async function fetchLastDolar(tipo: string): Promise<{ compra: number; venta: number; fecha: string } | null> {
    try {
        const res = await fetch(`${ARGDATA}/cotizaciones/dolares/${tipo}`, {
            next: { revalidate: 1800 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) return null;
        const json = await res.json() as { compra: number; venta: number; fecha: string }[];
        if (!Array.isArray(json) || json.length === 0) return null;
        return json[json.length - 1];
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const [oficial, blue, bolsa, ccl] = await Promise.all([
            fetchLastDolar("oficial"),
            fetchLastDolar("blue"),
            fetchLastDolar("bolsa"),
            fetchLastDolar("contadoconliqui"),
        ]);

        return NextResponse.json({
            oficial: oficial?.venta ?? 1395,
            blue: blue?.venta ?? 1430,
            mep: bolsa?.venta ?? 1380,
            ccl: ccl?.venta ?? 1390,
            fecha: oficial?.fecha ?? new Date().toISOString().split("T")[0],
        }, {
            headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600" },
        });
    } catch (e) {
        console.error("[/api/dolar] Error:", e);
        return NextResponse.json(
            { oficial: 1395, blue: 1430, mep: 1380, ccl: 1390 },
            { status: 200 }
        );
    }
}
