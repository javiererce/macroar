import { NextResponse } from "next/server";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ variable: string }> }
) {
    try {
        const { variable } = await params;
        const hoy = new Date().toISOString().split("T")[0];
        const hace400 = new Date(Date.now() - 400 * 86400000).toISOString().split("T")[0];
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(
            `https://api.bcra.gob.ar/estadisticas/v2.0/datosvariable/${variable}/${hace400}/${hoy}`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ results: [] });
    }
}
