import { NextResponse } from "next/server";

export const revalidate = 86400; // 24 hours

export async function GET() {
    try {
        const url =
            "https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&limit=13&sort=desc&format=json";
        const res = await fetch(url, {
            next: { revalidate: 86400 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`INDEC API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data, {
            headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=172800" },
        });
    } catch (e) {
        console.error("[/api/inflacion] Error:", e);
        return NextResponse.json({ data: [] }, { status: 200 });
    }
}
