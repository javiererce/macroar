export const mockInflacion = [
    { mes: "Mar 25", valor: 3.7 }, { mes: "Abr 25", valor: 2.8 },
    { mes: "May 25", valor: 1.5 }, { mes: "Jun 25", valor: 1.6 },
    { mes: "Jul 25", valor: 1.9 }, { mes: "Ago 25", valor: 1.9 },
    { mes: "Sep 25", valor: 2.1 }, { mes: "Oct 25", valor: 2.3 },
    { mes: "Nov 25", valor: 2.5 }, { mes: "Dic 25", valor: 2.8 },
    { mes: "Ene 26", valor: 2.9 },
];

export const mockRiesgoPais = [
    { mes: "Abr 25", valor: 780 }, { mes: "May 25", valor: 720 },
    { mes: "Jun 25", valor: 680 }, { mes: "Jul 25", valor: 650 },
    { mes: "Ago 25", valor: 610 }, { mes: "Sep 25", valor: 580 },
    { mes: "Oct 25", valor: 560 }, { mes: "Nov 25", valor: 540 },
    { mes: "Dic 25", valor: 530 }, { mes: "Ene 26", valor: 520 },
    { mes: "Feb 26", valor: 524 },
];

export const mockDolar = [
    { mes: "Jun 25", oficial: 1140, blue: 1220 },
    { mes: "Jul 25", oficial: 1160, blue: 1250 },
    { mes: "Ago 25", oficial: 1180, blue: 1280 },
    { mes: "Sep 25", oficial: 1200, blue: 1300 },
    { mes: "Oct 25", oficial: 1250, blue: 1350 },
    { mes: "Nov 25", oficial: 1300, blue: 1400 },
    { mes: "Dic 25", oficial: 1350, blue: 1450 },
    { mes: "Ene 26", oficial: 1465, blue: 1490 },
    { mes: "Feb 26", oficial: 1395, blue: 1430 },
];

export const mockReservas = [
    { mes: "Jun 25", valor: 35.2, neta: 12.7 }, { mes: "Jul 25", valor: 36.5, neta: 14.0 },
    { mes: "Ago 25", valor: 37.8, neta: 15.3 }, { mes: "Sep 25", valor: 39.1, neta: 16.6 },
    { mes: "Oct 25", valor: 40.2, neta: 17.7 }, { mes: "Nov 25", valor: 41.5, neta: 19.0 },
    { mes: "Dic 25", valor: 42.3, neta: 19.8 }, { mes: "Ene 26", valor: 44.0, neta: 21.5 },
    { mes: "Feb 26", valor: 45.1, neta: 22.6 },
];

export const mockCammesa = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 29 + i);
    const dia = d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    const esFinSemana = [0, 6].includes(d.getDay());
    const base = esFinSemana ? 310 : 390;
    const tendencia = i * 0.4;
    const ruido = (Math.random() - 0.5) * 30;
    return { dia, valor: Math.round(base + tendencia + ruido), esFinSemana };
});

export const mockCammesaMensual = [
    { mes: "Feb 24", valor: 368, variacion: -2.1 }, { mes: "Mar 24", valor: 372, variacion: 1.1 },
    { mes: "Abr 24", valor: 365, variacion: -1.9 }, { mes: "May 24", valor: 371, variacion: 1.6 },
    { mes: "Jun 24", valor: 395, variacion: 6.5 }, { mes: "Jul 24", valor: 412, variacion: 4.3 },
    { mes: "Ago 24", valor: 405, variacion: -1.7 }, { mes: "Sep 24", valor: 378, variacion: -6.7 },
    { mes: "Oct 24", valor: 369, variacion: -2.4 }, { mes: "Nov 24", valor: 374, variacion: 1.4 },
    { mes: "Dic 24", valor: 388, variacion: 3.7 }, { mes: "Ene 25", valor: 401, variacion: 3.4 },
    { mes: "Feb 25", valor: 394, variacion: -1.7 },
];

export const mockSalarios = [
    { mes: "Feb 24", salario: 100, inflacion: 100, real: 100 },
    { mes: "Mar 24", salario: 106, inflacion: 108, real: 98.1 },
    { mes: "Abr 24", salario: 112, inflacion: 117, real: 95.7 },
    { mes: "May 24", salario: 119, inflacion: 121, real: 98.3 },
    { mes: "Jun 24", salario: 128, inflacion: 126, real: 101.6 },
    { mes: "Jul 24", salario: 138, inflacion: 131, real: 105.3 },
    { mes: "Ago 24", salario: 149, inflacion: 136, real: 109.6 },
    { mes: "Sep 24", salario: 160, inflacion: 141, real: 113.5 },
    { mes: "Oct 24", salario: 172, inflacion: 144, real: 119.4 },
    { mes: "Nov 24", salario: 185, inflacion: 148, real: 125.0 },
    { mes: "Dic 24", salario: 198, inflacion: 152, real: 130.3 },
    { mes: "Ene 25", salario: 211, inflacion: 155, real: 136.1 },
    { mes: "Feb 25", salario: 225, inflacion: 159, real: 141.5 },
];

export const mockSalariosSector = [
    { sector: "Privado registrado", variacion: 142, real: 89 },
    { sector: "Público nacional", variacion: 118, real: 74 },
    { sector: "Privado no registrado", variacion: 98, real: 62 },
];

export const noticiasDefault = [
    { fuente: "Ámbito", tiempo: "Hace 15 min", titulo: "El BCRA compró USD 85 millones en el mercado cambiario", tag: "BCRA", tagColor: "accent", link: "https://www.ambito.com" },
    { fuente: "Infobae", tiempo: "Hace 42 min", titulo: "Inflación de enero: 2.9% según INDEC", tag: "Precios", tagColor: "red", link: "https://www.infobae.com" },
    { fuente: "El Cronista", tiempo: "Hace 1h", titulo: "Bonos soberanos suben hasta 2% tras datos de reservas", tag: "Mercados", tagColor: "green", link: "https://www.cronista.com" },
    { fuente: "La Nación", tiempo: "Hace 2h", titulo: "FMI adelantó desembolso: Argentina recibirá USD 2.000M", tag: "FMI", tagColor: "purple", link: "https://www.lanacion.com.ar" },
    { fuente: "Bloomberg", tiempo: "Hace 3h", titulo: "Riesgo país en 524 puntos, el más bajo en 7 años", tag: "Global", tagColor: "yellow", link: "https://www.bloomberg.com" },
    { fuente: "Ámbito", tiempo: "Hace 4h", titulo: "Recaudación tributaria creció 8% real en febrero", tag: "Fiscal", tagColor: "green", link: "https://www.ambito.com" },
];

export const calendario = [
    { fecha: "21 Feb", dia: "Hoy", evento: "Licitación de Letras del Tesoro (LECAP)", tipo: "BCRA", importancia: "alta" },
    { fecha: "25 Feb", dia: "Mar", evento: "Publicación IPC Región GBA - INDEC", tipo: "INDEC", importancia: "alta" },
    { fecha: "27 Feb", dia: "Jue", evento: "Informe de Reservas semanales", tipo: "BCRA", importancia: "media" },
    { fecha: "4 Mar", dia: "Mar", evento: "IPC Nacional Febrero 2026 - INDEC", tipo: "INDEC", importancia: "alta" },
    { fecha: "7 Mar", dia: "Vie", evento: "Vencimiento BOPREAL Serie 3", tipo: "Deuda", importancia: "alta" },
    { fecha: "14 Mar", dia: "Vie", evento: "Reunión directorio BCRA — política monetaria", tipo: "BCRA", importancia: "alta" },
];

export const kpisInitial = [
    { title: "Inflación mensual", value: "2.9%", sub: "Ene 2026", trend: "+0.1pp", trendUp: true, color: "red", icon: "🔥", updated: "hace 2 días", tooltip: "Variación del IPC respecto al mes anterior. Fuente: INDEC." },
    { title: "Dólar Oficial", value: "$1.395", sub: "BNA venta", trend: null, color: "accent", icon: "💵", updated: "hace 1 hora", tooltip: "Tipo de cambio oficial publicado por el Banco Nación Argentina." },
    { title: "Dólar Blue", value: "$1.430", sub: "Brecha 2.5%", trend: null, color: "yellow", icon: "💰", updated: "hace 1 hora", tooltip: "Cotización del dólar en el mercado informal." },
    { title: "Reservas BCRA", value: "USD 45.1B", sub: "vs ene: +1.1B", trend: "+2.5%", trendUp: false, color: "green", icon: "🏦", updated: "hace 3 horas", tooltip: "Reservas internacionales brutas del BCRA en miles de millones de USD." },
    { title: "Riesgo País", value: "524 pb", sub: "EMBI+", trend: "-7.1%", trendUp: false, color: "purple", icon: "⚠️", updated: "hace 30 min", tooltip: "Spread de bonos soberanos vs Tesoro de EE.UU. Fuente: JPMorgan." },
    { title: "Demanda Eléctrica", value: "394 GWh", sub: "Promedio feb", trend: "-1.7%", trendUp: false, color: "orange", icon: "⚡", updated: "hace 2 horas", tooltip: "Demanda eléctrica diaria promedio. Proxy en tiempo real de la actividad económica. Fuente: CAMMESA." },
    { title: "Salario Real", value: "+41.5%", sub: "vs feb 2024", trend: "+5.8pp", trendUp: false, color: "green", icon: "💼", updated: "hace 1 día", tooltip: "Evolución del salario real (ajustado por inflación). Base 100 = feb 2024. Fuente: INDEC." },
    { title: "Tasa BADLAR", value: "29.0%", sub: "Bancos privados", trend: null, color: "yellow", icon: "📈", updated: "hace 1 día", tooltip: "Tasa de interés promedio para depósitos a plazo fijo. Fuente: BCRA." },
];
