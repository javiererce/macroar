// lib/api.ts
// MacroAR — Conexiones a APIs públicas argentinas
// Server-side: llama directamente a las APIs externas (sin CORS)
// Las API Routes (/api/*) sirven como proxy para cualquier llamada client-side

const BCRA = "https://api.bcra.gob.ar/estadisticas/v2.0";
const ARGDATA = "https://api.argentinadatos.com/v1";
const INDEC = "https://apis.datos.gob.ar/series/api/series";

// Fecha helpers
const fmtDate = (d: Date) => d.toISOString().split("T")[0];
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return fmtDate(d); };
const today = () => fmtDate(new Date());

// ── BCRA Variables ──────────────────────────────────────────
// ID 1  = Reservas internacionales (USD millones)
// ID 4  = Tipo de cambio oficial (ARS/USD)
// ID 9  = Tasa BADLAR bancos privados (% anual)

async function fetchBCRA(varId: number, dias = 365) {
    const desde = daysAgo(dias);
    const hasta = today();
    const url = `${BCRA}/datosvariable/${varId}/${desde}/${hasta}`;
    const res = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error(`BCRA API error: ${res.status}`);
    const json = await res.json();
    return (json.results as { fecha: string; valor: number }[]).map(d => ({
        fecha: d.fecha,
        valor: d.valor,
        mes: new Date(d.fecha).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
    }));
}

export async function getReservas() {
    try {
        const data = await fetchBCRA(1, 400);
        const byMonth: Record<string, { mes: string; valor: number; neta: number }> = {};
        data.forEach(d => {
            const key = d.fecha.slice(0, 7);
            const bruta = Math.round(d.valor / 1000) / 1000;
            const neta = Math.round((bruta - 22.5) * 10) / 10;
            byMonth[key] = { mes: d.mes, valor: bruta, neta };
        });
        const result = Object.values(byMonth).slice(-13);
        return result.length > 0 ? result : FALLBACK.reservas;
    } catch (e) {
        console.error("[getReservas] Error:", e);
        return FALLBACK.reservas;
    }
}

export async function getTipoCambio() {
    try {
        const data = await fetchBCRA(4, 400);
        const byMonth: Record<string, { mes: string; oficial: number }> = {};
        data.forEach(d => {
            const key = d.fecha.slice(0, 7);
            byMonth[key] = { mes: d.mes, oficial: Math.round(d.valor) };
        });
        const result = Object.values(byMonth).slice(-13);
        return result.length > 0 ? result : FALLBACK.dolar.map(d => ({ mes: d.mes, oficial: d.oficial }));
    } catch (e) {
        console.error("[getTipoCambio] Error:", e);
        return FALLBACK.dolar.map(d => ({ mes: d.mes, oficial: d.oficial }));
    }
}

export async function getTasaBadlar() {
    try {
        const data = await fetchBCRA(9, 30);
        const last = data[data.length - 1];
        return last?.valor ?? 34.5;
    } catch (e) {
        console.error("[getTasaBadlar] Error:", e);
        return 34.5;
    }
}

// ── Inflación (INDEC vía datos.gob.ar) ─────────────────────
export async function getInflacion() {
    try {
        const url = `${INDEC}/?ids=148.3_INIVELNAL_DICI_M_26&limit=13&sort=desc&format=json`;
        const res = await fetch(url, {
            next: { revalidate: 86400 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`INDEC API error: ${res.status}`);
        const json = await res.json();
        const rows = (json.data ?? []) as [string, number][];
        if (rows.length === 0) return FALLBACK.inflacion;
        return rows
            .reverse()
            .map(([fecha, valor]) => ({
                fecha,
                valor: Math.round(valor * 10) / 10,
                mes: new Date(fecha).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
            }));
    } catch (e) {
        console.error("[getInflacion] Error:", e);
        return FALLBACK.inflacion;
    }
}

// ── Dólar (argentinadatos.com) ──────────────────────────────
export async function getDolares() {
    try {
        const res = await fetch(`${ARGDATA}/cotizaciones/dolares`, {
            next: { revalidate: 1800 },
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`Dolar API error: ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json) || json.length === 0) {
            return { oficial: 1063, blue: 1220, mep: 1198, ccl: 1205 };
        }
        const find = (nombre: string) =>
            json.find((d: { nombre: string; venta: number }) =>
                d.nombre?.toLowerCase().includes(nombre.toLowerCase())
            )?.venta ?? null;
        return {
            oficial: find("oficial") ?? 1063,
            blue: find("blue") ?? 1220,
            mep: find("bolsa") ?? find("mep") ?? 1198,
            ccl: find("contado con liquidacion") ?? find("ccl") ?? 1205,
        };
    } catch (e) {
        console.error("[getDolares] Error:", e);
        return { oficial: 1063, blue: 1220, mep: 1198, ccl: 1205 };
    }
}

export async function getDolarHistorico() {
    try {
        const [oficial, blueRes] = await Promise.all([
            getTipoCambio(),
            fetch(`${ARGDATA}/cotizaciones/dolares/blue`, {
                next: { revalidate: 3600 },
                headers: { "Accept": "application/json" },
            })
                .then(r => r.json())
                .catch(() => []),
        ]);
        const blueMap: Record<string, number> = {};
        (blueRes as { fecha: string; venta: number }[]).forEach(d => {
            if (d.fecha && d.venta) {
                const key = d.fecha.slice(0, 7);
                blueMap[key] = Math.round(d.venta);
            }
        });
        const combined = oficial.map(d => ({
            mes: d.mes,
            oficial: d.oficial,
            blue: blueMap[d.mes] ?? null,
        })).filter(d => d.blue !== null);
        return combined.length > 0 ? combined : FALLBACK.dolar;
    } catch (e) {
        console.error("[getDolarHistorico] Error:", e);
        return FALLBACK.dolar;
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
            return { actual: 620, historico: FALLBACK.riesgoPais };
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
            actual: last?.valor ?? 620,
            historico: Object.values(byMonth).slice(-13),
        };
    } catch (e) {
        console.error("[getRiesgoPais] Error:", e);
        return { actual: 620, historico: FALLBACK.riesgoPais };
    }
}

// ── Noticias ────────────────────────────────────────────────
export async function getNoticias() {
    return FALLBACK.noticias;
}

// ── Fallback data (si falla cualquier API) ──────────────────
const FALLBACK = {
    inflacion: [
        { mes: "Feb 24", valor: 13.2, fecha: "2024-02-01" },
        { mes: "Mar 24", valor: 11.0, fecha: "2024-03-01" },
        { mes: "Abr 24", valor: 8.8, fecha: "2024-04-01" },
        { mes: "May 24", valor: 4.2, fecha: "2024-05-01" },
        { mes: "Jun 24", valor: 4.6, fecha: "2024-06-01" },
        { mes: "Jul 24", valor: 4.0, fecha: "2024-07-01" },
        { mes: "Ago 24", valor: 4.2, fecha: "2024-08-01" },
        { mes: "Sep 24", valor: 3.5, fecha: "2024-09-01" },
        { mes: "Oct 24", valor: 2.4, fecha: "2024-10-01" },
        { mes: "Nov 24", valor: 2.4, fecha: "2024-11-01" },
        { mes: "Dic 24", valor: 2.7, fecha: "2024-12-01" },
        { mes: "Ene 25", valor: 2.3, fecha: "2025-01-01" },
        { mes: "Feb 25", valor: 2.4, fecha: "2025-02-01" },
    ],
    riesgoPais: [
        { mes: "Feb 24", valor: 1820 }, { mes: "Mar 24", valor: 1650 },
        { mes: "Abr 24", valor: 1510 }, { mes: "May 24", valor: 1320 },
        { mes: "Jun 24", valor: 1480 }, { mes: "Jul 24", valor: 1560 },
        { mes: "Ago 24", valor: 1490 }, { mes: "Sep 24", valor: 1300 },
        { mes: "Oct 24", valor: 1050 }, { mes: "Nov 24", valor: 780 },
        { mes: "Dic 24", valor: 630 }, { mes: "Ene 25", valor: 580 },
        { mes: "Feb 25", valor: 620 },
    ],
    dolar: [
        { mes: "Feb 24", oficial: 832, blue: 1025 },
        { mes: "Mar 24", oficial: 857, blue: 1010 },
        { mes: "Abr 24", oficial: 875, blue: 1020 },
        { mes: "May 24", oficial: 895, blue: 1230 },
        { mes: "Jun 24", oficial: 907, blue: 1420 },
        { mes: "Jul 24", oficial: 926, blue: 1390 },
        { mes: "Ago 24", oficial: 942, blue: 1330 },
        { mes: "Sep 24", oficial: 951, blue: 1220 },
        { mes: "Oct 24", oficial: 977, blue: 1170 },
        { mes: "Nov 24", oficial: 1000, blue: 1060 },
        { mes: "Dic 24", oficial: 1030, blue: 1095 },
        { mes: "Ene 25", oficial: 1055, blue: 1190 },
        { mes: "Feb 25", oficial: 1063, blue: 1220 },
    ],
    reservas: [
        { mes: "Feb 24", valor: 27.5, neta: 5.0 }, { mes: "Mar 24", valor: 28.1, neta: 5.6 },
        { mes: "Abr 24", valor: 29.4, neta: 6.9 }, { mes: "May 24", valor: 31.2, neta: 8.7 },
        { mes: "Jun 24", valor: 29.8, neta: 7.3 }, { mes: "Jul 24", valor: 27.3, neta: 4.8 },
        { mes: "Ago 24", valor: 26.9, neta: 4.4 }, { mes: "Sep 24", valor: 28.7, neta: 6.2 },
        { mes: "Oct 24", valor: 30.1, neta: 7.6 }, { mes: "Nov 24", valor: 32.4, neta: 9.9 },
        { mes: "Dic 24", valor: 30.8, neta: 8.3 }, { mes: "Ene 25", valor: 29.5, neta: 7.0 },
        { mes: "Feb 25", valor: 28.9, neta: 6.4 },
    ],
    noticias: [
        { fuente: "Ámbito", tiempo: "Hace 15 min", titulo: "El BCRA compró USD 85 millones en el mercado cambiario", tag: "BCRA", tagColor: "accent", link: "https://www.ambito.com" },
        { fuente: "Infobae", tiempo: "Hace 42 min", titulo: "Inflación de febrero: 2.4% según INDEC", tag: "Precios", tagColor: "red", link: "https://www.infobae.com" },
        { fuente: "El Cronista", tiempo: "Hace 1h", titulo: "Bonos soberanos suben hasta 2% tras datos de reservas", tag: "Mercados", tagColor: "green", link: "https://www.cronista.com" },
        { fuente: "La Nación", tiempo: "Hace 2h", titulo: "FMI adelantó desembolso: Argentina recibirá USD 2.000M", tag: "FMI", tagColor: "purple", link: "https://www.lanacion.com.ar" },
        { fuente: "Bloomberg", tiempo: "Hace 3h", titulo: "Riesgo país sube 40 puntos por tensión en mercados globales", tag: "Global", tagColor: "yellow", link: "https://www.bloomberg.com" },
        { fuente: "Ámbito", tiempo: "Hace 4h", titulo: "Recaudación tributaria creció 8% real en febrero", tag: "Fiscal", tagColor: "green", link: "https://www.ambito.com" },
    ],
};
