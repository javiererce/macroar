import { NextResponse } from "next/server";

export async function GET() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch("https://api.argentinadatos.com/v1/finanzas/indices/inflacion", {
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json([]);
    }
}
