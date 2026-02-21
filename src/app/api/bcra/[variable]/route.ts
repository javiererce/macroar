import { NextResponse } from "next/server";

export const revalidate = 3600;

const fmtDate = (d: Date) => d.toISOString().split("T")[0];
const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return fmtDate(d);
};

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ variable: string }> }
) {
    const { variable } = await params;
    try {
        const desde = daysAgo(400);
        const hasta = fmtDate(new Date());
        const url = `https://api.bcra.gob.ar/estadisticas/v2.0/datosvariable/${variable}/${desde}/${hasta}`;
        const res = await fetch(url, {
            next: { revalidate: 3600 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`BCRA API error: ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data, {
            headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" },
        });
    } catch (e) {
        console.error(`[/api/bcra/${variable}] Error:`, e);
        return NextResponse.json({ results: [] }, { status: 200 });
    }
}
