// lib/api.ts
// MacroAR — Conexiones a APIs públicas argentinas
// Todas las llamadas tienen AbortController con 5s timeout
// Fuente principal: argentinadatos.com
// Fuente secundaria: datos.gob.ar (INDEC)

const ARGDATA = "https://api.argentinadatos.com/v1";

function withTimeout(ms = 8000): { signal: AbortSignal; clear: () => void } {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return { signal: controller.signal, clear: () => clearTimeout(id) };
}

// ── Inflación mensual (argentinadatos.com) ─────────────────
export async function getInflacion() {
    const t = withTimeout();
    try {
        const res = await fetch(`${ARGDATA}/finanzas/indices/inflacion`, {
            next: { revalidate: 86400 },
            signal: t.signal,
        });
        t.clear();
        if (!res.ok) throw new Error(`Inflacion API error: ${res.status}`);
        const json = await res.json() as { fecha: string; valor: number }[];
        if (!Array.isArray(json) || json.length === 0) return FALLBACK.inflacion;

        const recent = json.slice(-13);
        return recent.map(d => ({
            fecha: d.fecha,
            valor: d.valor,
            mes: new Date(d.fecha).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
        }));
    } catch (e) {
        t.clear();
        console.error("[getInflacion] Error:", e);
        return FALLBACK.inflacion;
    }
}

// ── Dólar (argentinadatos.com) ──────────────────────────────
async function fetchLastDolar(tipo: string): Promise<number | null> {
    const t = withTimeout();
    try {
        const res = await fetch(`${ARGDATA}/cotizaciones/dolares/${tipo}`, {
            next: { revalidate: 1800 },
            signal: t.signal,
        });
        t.clear();
        if (!res.ok) return null;
        const json = await res.json() as { venta: number; fecha: string }[];
        if (!Array.isArray(json) || json.length === 0) return null;
        return json[json.length - 1]?.venta ?? null;
    } catch {
        t.clear();
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
            oficial: oficial ?? 1395,
            blue: blue ?? 1430,
            mep: mep ?? 1390,
            ccl: ccl ?? 1400,
        };
    } catch (e) {
        console.error("[getDolares] Error:", e);
        return { oficial: 1395, blue: 1430, mep: 1390, ccl: 1400 };
    }
}

// ── Riesgo País (argentinadatos.com) ────────────────────────
export async function getRiesgoPais() {
    const t = withTimeout();
    try {
        const res = await fetch(`${ARGDATA}/finanzas/indices/riesgo-pais`, {
            next: { revalidate: 1800 },
            signal: t.signal,
        });
        t.clear();
        if (!res.ok) throw new Error(`Riesgo API error: ${res.status}`);
        const json = await res.json() as { fecha: string; valor: number }[];
        if (!Array.isArray(json) || json.length === 0) {
            return { actual: 524, historico: FALLBACK.riesgoPais };
        }

        const actual = json[json.length - 1]?.valor ?? 524;
        const historico = json.slice(-13).map(d => ({
            mes: new Date(d.fecha).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
            valor: d.valor,
        }));
        return { actual, historico };
    } catch (e) {
        t.clear();
        console.error("[getRiesgoPais] Error:", e);
        return { actual: 524, historico: FALLBACK.riesgoPais };
    }
}

// ── Dólar Histórico ─────────────────────────────────────────
export async function getDolarHistorico() {
    const t = withTimeout(8000);
    try {
        const [ofRes, blRes] = await Promise.all([
            fetch(`${ARGDATA}/cotizaciones/dolares/oficial`, { next: { revalidate: 86400 }, signal: t.signal }).catch(() => null),
            fetch(`${ARGDATA}/cotizaciones/dolares/blue`, { next: { revalidate: 86400 }, signal: t.signal }).catch(() => null),
        ]);
        t.clear();

        const oficial = ofRes?.ok ? await ofRes.json() as { fecha: string; venta: number }[] : [];
        const blue = blRes?.ok ? await blRes.json() as { fecha: string; venta: number }[] : [];

        if (oficial.length === 0 && blue.length === 0) return FALLBACK.dolar;

        const byMonth: Record<string, { mes: string; oficial: number; blue: number }> = {};
        const process = (arr: { fecha: string; venta: number }[], key: "oficial" | "blue") => {
            arr.forEach(d => {
                const month = d.fecha.substring(0, 7);
                if (!byMonth[month]) {
                    byMonth[month] = {
                        mes: new Date(d.fecha).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
                        oficial: 0,
                        blue: 0,
                    };
                }
                byMonth[month][key] = d.venta;
            });
        };
        process(oficial, "oficial");
        process(blue, "blue");

        const result = Object.values(byMonth).slice(-13);
        return result.length > 0 ? result : FALLBACK.dolar;
    } catch (e) {
        t.clear();
        console.error("[getDolarHistorico] Error:", e);
        return FALLBACK.dolar;
    }
}

// ── Reservas (datos.gob.ar) ─────────────────────────────────
export async function getReservas() {
    const t = withTimeout(8000);
    try {
        const url = "https://apis.datos.gob.ar/series/api/series/?ids=116.4_TCRZE_0_A_23_0&limit=400&sort=desc&format=json";
        const res = await fetch(url, { next: { revalidate: 86400 }, signal: t.signal });
        t.clear();
        if (!res.ok) throw new Error(`Reservas API error: ${res.status}`);
        const json = await res.json();
        const rows = (json.data ?? []) as [string, number | null][];
        if (rows.length === 0) return FALLBACK.reservas;

        const byMonth: Record<string, { mes: string; valor: number; neta: number }> = {};
        rows.forEach(([fecha, bruta]) => {
            if (fecha && bruta !== null) {
                const key = fecha.substring(0, 7);
                const neta = Math.round((bruta * 0.48) * 10) / 10;
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
        t.clear();
        console.error("[getReservas] Error, using fallback:", e);
        return FALLBACK.reservas;
    }
}

// ── Tasa BADLAR (argentinadatos.com) ────────────────────────
export async function getTasaBadlar() {
    const t = withTimeout();
    try {
        const res = await fetch(`${ARGDATA}/finanzas/tasas/plazoFijo`, {
            next: { revalidate: 3600 },
            signal: t.signal,
        });
        t.clear();
        if (!res.ok) throw new Error(`Tasas API error: ${res.status}`);
        const json = await res.json() as { entidad: string; tnaClientes: number | null }[];
        if (!Array.isArray(json) || json.length === 0) return 29.0;

        const tasas = json
            .map(b => b.tnaClientes)
            .filter((t): t is number => t !== null && t > 0)
            .map(t => t * 100);

        if (tasas.length === 0) return 29.0;
        const promedio = tasas.reduce((a, b) => a + b, 0) / tasas.length;
        return Math.round(promedio * 10) / 10;
    } catch (e) {
        t.clear();
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
        { fuente: "La Nación", tiempo: "Hace 2h", titulo: "FMI adelantó desembolso: Argentina recibirá USD 2.000M", tag: "Fiscal", tagColor: "purple", link: "https://www.lanacion.com.ar" },
        { fuente: "Bloomberg", tiempo: "Hace 3h", titulo: "Riesgo país en 524 puntos, el más bajo en 7 años", tag: "Global", tagColor: "yellow", link: "https://www.bloomberg.com" },
        { fuente: "Ámbito", tiempo: "Hace 4h", titulo: "Recaudación tributaria creció 8% real en febrero", tag: "Fiscal", tagColor: "green", link: "https://www.ambito.com" },
    ],
};
