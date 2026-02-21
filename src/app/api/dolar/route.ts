import { NextResponse } from "next/server";

export const revalidate = 1800; // 30 min

export async function GET() {
    try {
        const res = await fetch("https://api.argentinadatos.com/v1/cotizaciones/dolares", {
            next: { revalidate: 1800 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data, {
            headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600" },
        });
    } catch (e) {
        console.error("[/api/dolar] Error:", e);
        return NextResponse.json(
            [
                { nombre: "Oficial", venta: 1063 },
                { nombre: "Blue", venta: 1220 },
                { nombre: "Bolsa", venta: 1198 },
                { nombre: "Contado con liquidación", venta: 1205 },
            ],
            { status: 200 }
        );
    }
}
