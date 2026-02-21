// lib/api.ts
// MacroAR — Conexiones a APIs públicas argentinas
// Fuente principal: argentinadatos.com (no requiere API key)
// Fuente secundaria: datos.gob.ar (INDEC)

const ARGDATA = "https://api.argentinadatos.com/v1";

// ── Inflación mensual (argentinadatos.com) ─────────────────
// Devuelve directamente variación % mensual (no el índice)
export async function getInflacion() {
    try {
        const res = await fetch(`${ARGDATA}/finanzas/indices/inflacion`, {
            next: { revalidate: 86400 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`Inflacion API error: ${res.status}`);
        const json = await res.json() as { fecha: string; valor: number }[];
        if (!Array.isArray(json) || json.length === 0) return FALLBACK.inflacion;

        // Últimos 13 meses
        const recent = json.slice(-13);
        return recent.map(d => ({
            fecha: d.fecha,
            valor: d.valor,
            mes: new Date(d.fecha).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
        }));
    } catch (e) {
        console.error("[getInflacion] Error:", e);
        return FALLBACK.inflacion;
    }
}

// ── Dólar (argentinadatos.com) ──────────────────────────────
// Cada endpoint devuelve historial completo, último = más reciente
async function fetchLastDolar(tipo: string): Promise<number | null> {
    try {
        const res = await fetch(`${ARGDATA}/cotizaciones/dolares/${tipo}`, {
            next: { revalidate: 1800 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) return null;
        const json = await res.json() as { venta: number; fecha: string }[];
        if (!Array.isArray(json) || json.length === 0) return null;
        return json[json.length - 1]?.venta ?? null;
    } catch {
        return null;
    }
}

export async function getDolares() {
    try {
        const [oficial, blue, mep, ccl] = await Promise.all([
            fetchLastDolar("oficial"),
            fetchLastDolar("blue"),
            fetchLastDolar("bolsa"),
            fetchLastDolar("contadoconliqui"),
        ]);
        return {
            oficial: oficial ?? FALLBACK_DOLARES.oficial,
            blue: blue ?? FALLBACK_DOLARES.blue,
            mep: mep ?? FALLBACK_DOLARES.mep,
            ccl: ccl ?? FALLBACK_DOLARES.ccl,
        };
    } catch (e) {
        console.error("[getDolares] Error:", e);
        return FALLBACK_DOLARES;
    }
}

const FALLBACK_DOLARES = { oficial: 1395, blue: 1430, mep: 1380, ccl: 1390 };

// ── Dólar Histórico (Oficial + Blue) ────────────────────────
export async function getDolarHistorico() {
    try {
        const [oficialRes, blueRes] = await Promise.all([
            fetch(`${ARGDATA}/cotizaciones/dolares/oficial`, {
                next: { revalidate: 3600 },
                headers: { "Accept": "application/json" },
            }).then(r => r.json()).catch(() => []),
            fetch(`${ARGDATA}/cotizaciones/dolares/blue`, {
                next: { revalidate: 3600 },
                headers: { "Accept": "application/json" },
            }).then(r => r.json()).catch(() => []),
        ]);

        // Agrupar por mes (último valor del mes)
        const oficialMap: Record<string, number> = {};
        const blueMap: Record<string, number> = {};

        (oficialRes as { venta: number; fecha: string }[]).forEach(d => {
            if (d.fecha && d.venta) {
                const key = d.fecha.slice(0, 7);
                oficialMap[key] = Math.round(d.venta);
            }
        });
        (blueRes as { venta: number; fecha: string }[]).forEach(d => {
            if (d.fecha && d.venta) {
                const key = d.fecha.slice(0, 7);
                blueMap[key] = Math.round(d.venta);
            }
        });

        // Combinar últimos 13 meses
        const months = Object.keys(oficialMap).sort().slice(-13);
        const combined = months
            .map(key => ({
                mes: new Date(key + "-15").toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
                oficial: oficialMap[key],
                blue: blueMap[key] ?? null,
            }))
            .filter(d => d.blue !== null);

        return combined.length > 0 ? combined : FALLBACK.dolar;
    } catch (e) {
        console.error("[getDolarHistorico] Error:", e);
        return FALLBACK.dolar;
    }
}

// ── Tipo de Cambio Oficial (para uso interno) ───────────────
export async function getTipoCambio() {
    try {
        const res = await fetch(`${ARGDATA}/cotizaciones/dolares/oficial`, {
            next: { revalidate: 3600 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`Oficial API error: ${res.status}`);
        const json = await res.json() as { venta: number; fecha: string }[];
        const byMonth: Record<string, { mes: string; oficial: number }> = {};
        json.forEach(d => {
            if (d.fecha && d.venta) {
                const key = d.fecha.slice(0, 7);
                byMonth[key] = {
                    mes: new Date(d.fecha).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
                    oficial: Math.round(d.venta),
                };
            }
        });
        const result = Object.values(byMonth).slice(-13);
        return result.length > 0 ? result : FALLBACK.dolar.map(d => ({ mes: d.mes, oficial: d.oficial }));
    } catch (e) {
        console.error("[getTipoCambio] Error:", e);
        return FALLBACK.dolar.map(d => ({ mes: d.mes, oficial: d.oficial }));
    }
}

// ── Riesgo País (argentinadatos.com) ───────────────────────
export async function getRiesgoPais() {
    try {
        const res = await fetch(`${ARGDATA}/finanzas/indices/riesgo-pais`, {
            next: { revalidate: 1800 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`Riesgo pais API error: ${res.status}`);
        const json = await res.json() as { fecha: string; valor: number }[];
        if (!Array.isArray(json) || json.length === 0) {
            return { actual: 524, historico: FALLBACK.riesgoPais };
        }
        const last = json[json.length - 1];
        const byMonth: Record<string, { mes: string; valor: number }> = {};
        json.forEach(d => {
            const key = d.fecha.slice(0, 7);
            byMonth[key] = {
                mes: new Date(d.fecha).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
                valor: Math.round(d.valor),
            };
        });
        return {
            actual: last?.valor ?? 524,
            historico: Object.values(byMonth).slice(-13),
        };
    } catch (e) {
        console.error("[getRiesgoPais] Error:", e);
        return { actual: 524, historico: FALLBACK.riesgoPais };
    }
}

// ── Reservas BCRA (via argentinadatos.com) ──────────────────
// BCRA API v2 fue deprecada. Usamos datos.gob.ar como alternativa
export async function getReservas() {
    try {
        // Serie de reservas internacionales BCRA desde datos.gob.ar
        const url = "https://apis.datos.gob.ar/series/api/series/?ids=116.4_TCRZE_0_A_23_0&limit=400&sort=desc&format=json";
        const res = await fetch(url, {
            next: { revalidate: 3600 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`Reservas API error: ${res.status}`);
        const json = await res.json();
        const rows = (json.data ?? []) as [string, number | null][];
        if (rows.length === 0) return FALLBACK.reservas;

        // Agrupar por mes
        const byMonth: Record<string, { mes: string; valor: number; neta: number }> = {};
        rows.reverse().forEach(([fecha, valor]) => {
            if (fecha && valor !== null) {
                const key = fecha.slice(0, 7);
                const bruta = Math.round(valor / 100) / 10; // Convert millones to billions
                const neta = Math.round((bruta - 22.5) * 10) / 10;
                byMonth[key] = {
                    mes: new Date(fecha).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
                    valor: bruta,
                    neta,
                };
            }
        });
        const result = Object.values(byMonth).slice(-13);
        return result.length > 0 ? result : FALLBACK.reservas;
    } catch (e) {
        console.error("[getReservas] Error, using fallback:", e);
        return FALLBACK.reservas;
    }
}

// ── Tasa BADLAR (argentinadatos.com) ────────────────────────
// Usamos las tasas de plazo fijo como proxy
export async function getTasaBadlar() {
    try {
        const res = await fetch(`${ARGDATA}/finanzas/tasas/plazoFijo`, {
            next: { revalidate: 3600 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`Tasas API error: ${res.status}`);
        const json = await res.json() as { entidad: string; tnaClientes: number | null }[];
        if (!Array.isArray(json) || json.length === 0) return 29.0;

        // Calcular promedio de TNA de bancos que tienen dato
        const tasas = json
            .map(b => b.tnaClientes)
            .filter((t): t is number => t !== null && t > 0)
            .map(t => t * 100); // Convertir de decimal a porcentaje

        if (tasas.length === 0) return 29.0;
        const promedio = tasas.reduce((a, b) => a + b, 0) / tasas.length;
        return Math.round(promedio * 10) / 10;
    } catch (e) {
        console.error("[getTasaBadlar] Error:", e);
        return 29.0;
    }
}

// ── Noticias ────────────────────────────────────────────────
export async function getNoticias() {
    return FALLBACK.noticias;
}

// ── Fallback data ───────────────────────────────────────────
const FALLBACK = {
    inflacion: [
        { mes: "Mar 25", valor: 3.7, fecha: "2025-03-31" },
        { mes: "Abr 25", valor: 2.8, fecha: "2025-04-30" },
        { mes: "May 25", valor: 1.5, fecha: "2025-05-31" },
        { mes: "Jun 25", valor: 1.6, fecha: "2025-06-30" },
        { mes: "Jul 25", valor: 1.9, fecha: "2025-07-31" },
        { mes: "Ago 25", valor: 1.9, fecha: "2025-08-31" },
        { mes: "Sep 25", valor: 2.1, fecha: "2025-09-30" },
        { mes: "Oct 25", valor: 2.3, fecha: "2025-10-31" },
        { mes: "Nov 25", valor: 2.5, fecha: "2025-11-30" },
        { mes: "Dic 25", valor: 2.8, fecha: "2025-12-31" },
        { mes: "Ene 26", valor: 2.9, fecha: "2026-01-31" },
    ],
    riesgoPais: [
        { mes: "Abr 25", valor: 780 }, { mes: "May 25", valor: 720 },
        { mes: "Jun 25", valor: 680 }, { mes: "Jul 25", valor: 650 },
        { mes: "Ago 25", valor: 610 }, { mes: "Sep 25", valor: 580 },
        { mes: "Oct 25", valor: 560 }, { mes: "Nov 25", valor: 540 },
        { mes: "Dic 25", valor: 530 }, { mes: "Ene 26", valor: 520 },
        { mes: "Feb 26", valor: 524 },
    ],
    dolar: [
        { mes: "Jun 25", oficial: 1140, blue: 1220 },
        { mes: "Jul 25", oficial: 1160, blue: 1250 },
        { mes: "Ago 25", oficial: 1180, blue: 1280 },
        { mes: "Sep 25", oficial: 1200, blue: 1300 },
        { mes: "Oct 25", oficial: 1250, blue: 1350 },
        { mes: "Nov 25", oficial: 1300, blue: 1400 },
        { mes: "Dic 25", oficial: 1350, blue: 1450 },
        { mes: "Ene 26", oficial: 1465, blue: 1490 },
        { mes: "Feb 26", oficial: 1395, blue: 1430 },
    ],
    reservas: [
        { mes: "Jun 25", valor: 35.2, neta: 12.7 }, { mes: "Jul 25", valor: 36.5, neta: 14.0 },
        { mes: "Ago 25", valor: 37.8, neta: 15.3 }, { mes: "Sep 25", valor: 39.1, neta: 16.6 },
        { mes: "Oct 25", valor: 40.2, neta: 17.7 }, { mes: "Nov 25", valor: 41.5, neta: 19.0 },
        { mes: "Dic 25", valor: 42.3, neta: 19.8 }, { mes: "Ene 26", valor: 44.0, neta: 21.5 },
        { mes: "Feb 26", valor: 45.1, neta: 22.6 },
    ],
    noticias: [
        { fuente: "Ámbito", tiempo: "Hace 15 min", titulo: "El BCRA compró USD 85 millones en el mercado cambiario", tag: "BCRA", tagColor: "accent", link: "https://www.ambito.com" },
        { fuente: "Infobae", tiempo: "Hace 42 min", titulo: "Inflación de enero: 2.9% según INDEC", tag: "Precios", tagColor: "red", link: "https://www.infobae.com" },
        { fuente: "El Cronista", tiempo: "Hace 1h", titulo: "Bonos soberanos suben hasta 2% tras datos de reservas", tag: "Mercados", tagColor: "green", link: "https://www.cronista.com" },
        { fuente: "La Nación", tiempo: "Hace 2h", titulo: "FMI adelantó desembolso: Argentina recibirá USD 2.000M", tag: "FMI", tagColor: "purple", link: "https://www.lanacion.com.ar" },
        { fuente: "Bloomberg", tiempo: "Hace 3h", titulo: "Riesgo país en 524 puntos, el más bajo en 7 años", tag: "Global", tagColor: "yellow", link: "https://www.bloomberg.com" },
        { fuente: "Ámbito", tiempo: "Hace 4h", titulo: "Recaudación tributaria creció 8% real en febrero", tag: "Fiscal", tagColor: "green", link: "https://www.ambito.com" },
    ],
};
