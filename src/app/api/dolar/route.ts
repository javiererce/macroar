import { NextResponse } from "next/server";

export async function GET() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const [oficial, blue, mep, ccl] = await Promise.all([
            fetch("https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial", { signal: controller.signal }).then(r => r.json()).catch(() => []),
            fetch("https://api.argentinadatos.com/v1/cotizaciones/dolares/blue", { signal: controller.signal }).then(r => r.json()).catch(() => []),
            fetch("https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa", { signal: controller.signal }).then(r => r.json()).catch(() => []),
            fetch("https://api.argentinadatos.com/v1/cotizaciones/dolares/contadoconliqui", { signal: controller.signal }).then(r => r.json()).catch(() => []),
        ]);
        clearTimeout(timeout);

        return NextResponse.json({
            oficial: oficial.length ? oficial[oficial.length - 1] : null,
            blue: blue.length ? blue[blue.length - 1] : null,
            mep: mep.length ? mep[mep.length - 1] : null,
            ccl: ccl.length ? ccl[ccl.length - 1] : null,
        });
    } catch {
        return NextResponse.json({
            oficial: { venta: 1395 },
            blue: { venta: 1430 },
            mep: { venta: 1390 },
            ccl: { venta: 1400 },
        });
    }
}
