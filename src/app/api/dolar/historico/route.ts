import { NextResponse } from "next/server";

export const revalidate = 3600; // 1 hour

export async function GET() {
    try {
        const res = await fetch("https://api.argentinadatos.com/v1/cotizaciones/dolares/blue", {
            next: { revalidate: 3600 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data, {
            headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" },
        });
    } catch (e) {
        console.error("[/api/dolar/historico] Error:", e);
        return NextResponse.json([], { status: 200 });
    }
}
