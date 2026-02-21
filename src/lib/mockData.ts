export const mockInflacion = [
    { mes: "Feb 24", valor: 13.2 }, { mes: "Mar 24", valor: 11.0 }, { mes: "Abr 24", valor: 8.8 },
    { mes: "May 24", valor: 4.2 }, { mes: "Jun 24", valor: 4.6 }, { mes: "Jul 24", valor: 4.0 },
    { mes: "Ago 24", valor: 4.2 }, { mes: "Sep 24", valor: 3.5 }, { mes: "Oct 24", valor: 2.4 },
    { mes: "Dic 24", valor: 2.7 }, { mes: "Ene 25", valor: 2.3 }, { mes: "Feb 25", valor: 2.4 },
    { mes: "Mar 25", valor: 2.1 }, { mes: "Abr 25", valor: 1.8 }, { mes: "May 25", valor: 1.5 },
    { mes: "Jun 25", valor: 1.2 }, { mes: "Jul 25", valor: 1.4 }, { mes: "Ago 25", valor: 1.3 },
    { mes: "Sep 25", valor: 1.1 }, { mes: "Oct 25", valor: 0.9 }, { mes: "Nov 25", valor: 0.8 },
    { mes: "Dic 25", valor: 1.2 }, { mes: "Ene 26", valor: 1.5 }, { mes: "Feb 26", valor: 1.8 }, // Proyección
];

export const mockRiesgoPais = [
    { mes: "Feb 24", valor: 1820 }, { mes: "Mar 24", valor: 1650 }, { mes: "Abr 24", valor: 1510 },
    { mes: "May 24", valor: 1320 }, { mes: "Jun 24", valor: 1480 }, { mes: "Jul 24", valor: 1560 },
    { mes: "Ago 24", valor: 1490 }, { mes: "Sep 24", valor: 1300 }, { mes: "Oct 24", valor: 1050 },
    { mes: "Nov 24", valor: 780 }, { mes: "Dic 24", valor: 630 }, { mes: "Ene 25", valor: 580 },
    { mes: "Feb 25", valor: 620 },
];

export const mockDolar = [
    { mes: "Feb 24", oficial: 832, blue: 1025 }, { mes: "Mar 24", oficial: 857, blue: 1010 },
    { mes: "Abr 24", oficial: 875, blue: 1020 }, { mes: "May 24", oficial: 895, blue: 1230 },
    { mes: "Jun 24", oficial: 907, blue: 1420 }, { mes: "Jul 24", oficial: 926, blue: 1390 },
    { mes: "Ago 24", oficial: 942, blue: 1330 }, { mes: "Sep 24", oficial: 951, blue: 1220 },
    { mes: "Oct 24", oficial: 977, blue: 1170 }, { mes: "Nov 24", oficial: 1000, blue: 1060 },
    { mes: "Dic 24", oficial: 1030, blue: 1095 }, { mes: "Ene 25", oficial: 1055, blue: 1190 },
    { mes: "Feb 25", oficial: 1063, blue: 1220 },
];

export const mockReservas = [
    { mes: "Feb 24", valor: 27.5, neta: -9.2 }, { mes: "Mar 24", valor: 28.1, neta: -8.8 }, { mes: "Abr 24", valor: 29.4, neta: -7.5 },
    { mes: "May 24", valor: 31.2, neta: -6.1 }, { mes: "Jun 24", valor: 29.8, neta: -7.2 }, { mes: "Jul 24", valor: 27.3, neta: -8.9 },
    { mes: "Ago 24", valor: 26.9, neta: -9.5 }, { mes: "Sep 24", valor: 28.7, neta: -8.1 }, { mes: "Oct 24", valor: 30.1, neta: -6.8 },
    { mes: "Nov 24", valor: 32.4, neta: -5.4 }, { mes: "Dic 24", valor: 30.8, neta: -4.2 }, { mes: "Ene 25", valor: 29.5, neta: -5.1 },
    { mes: "Feb 25", valor: 28.9, neta: -6.4 },
];

export const mockCammesa = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 29 + i);
    const dia = d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    const esFinSemana = [0, 6].includes(d.getDay());
    const base = esFinSemana ? 310 : 390;
    const tendencia = i * 0.4; // leve crecimiento
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
    { fuente: "Infobae", tiempo: "Hace 42 min", titulo: "Inflación de febrero sorprendió al alza: 2.4% según INDEC", tag: "Precios", tagColor: "red", link: "https://www.infobae.com" },
    { fuente: "El Cronista", tiempo: "Hace 1h", titulo: "Bonos soberanos suben hasta 2% tras datos de reservas", tag: "Mercados", tagColor: "green", link: "https://www.cronista.com" },
    { fuente: "La Nación", tiempo: "Hace 2h", titulo: "FMI adelantó desembolso: Argentina recibirá USD 2.000M", tag: "FMI", tagColor: "purple", link: "https://www.lanacion.com.ar" },
    { fuente: "Bloomberg", tiempo: "Hace 3h", titulo: "Riesgo país sube 40 puntos por tensión en mercados globales", tag: "Global", tagColor: "yellow", link: "https://www.bloomberg.com" },
    { fuente: "Ámbito", tiempo: "Hace 4h", titulo: "Recaudación tributaria creció 8% real en febrero", tag: "Fiscal", tagColor: "green", link: "https://www.ambito.com" },
];

export const calendario = [
    { fecha: "21 Feb", dia: "Hoy", evento: "Licitación de Letras del Tesoro (LECAP)", tipo: "BCRA", importancia: "alta" },
    { fecha: "25 Feb", dia: "Mar", evento: "Publicación IPC Región GBA - INDEC", tipo: "INDEC", importancia: "alta" },
    { fecha: "27 Feb", dia: "Jue", evento: "Informe de Reservas semanales", tipo: "BCRA", importancia: "media" },
    { fecha: "4 Mar", dia: "Mar", evento: "IPC Nacional Febrero 2025 - INDEC", tipo: "INDEC", importancia: "alta" },
    { fecha: "7 Mar", dia: "Vie", evento: "Vencimiento BOPREAL Serie 3", tipo: "Deuda", importancia: "alta" },
    { fecha: "14 Mar", dia: "Vie", evento: "Reunión directorio BCRA — política monetaria", tipo: "BCRA", importancia: "alta" },
];

export const kpisInitial = [
    { title: "Inflación mensual", value: "2.4%", sub: "Feb 2025", trend: "+0.1pp", trendUp: true, color: "red", icon: "🔥", updated: "hace 2 días", tooltip: "Variación del IPC respecto al mes anterior. Fuente: INDEC." },
    { title: "Dólar Oficial", value: "$1.063", sub: "BNA compra", trend: null, color: "accent", icon: "💵", updated: "hace 1 hora", tooltip: "Tipo de cambio oficial publicado por el Banco Nación Argentina." },
    { title: "Dólar Blue", value: "$1.220", sub: "Brecha 14.8%", trend: null, color: "yellow", icon: "💰", updated: "hace 1 hora", tooltip: "Cotización del dólar en el mercado informal." },
    { title: "Reservas BCRA", value: "USD 28.9B", sub: "vs ene: -0.6B", trend: "-2.0%", trendUp: false, color: "green", icon: "🏦", updated: "hace 3 horas", tooltip: "Reservas internacionales brutas del BCRA en miles de millones de USD." },
    { title: "Riesgo País", value: "620 pb", sub: "EMBI+", trend: "+6.9%", trendUp: true, color: "purple", icon: "⚠️", updated: "hace 30 min", tooltip: "Spread de bonos soberanos vs Tesoro de EE.UU. Fuente: JPMorgan." },
    { title: "Demanda Eléctrica", value: "394 GWh", sub: "Promedio feb", trend: "-1.7%", trendUp: false, color: "orange", icon: "⚡", updated: "hace 2 horas", tooltip: "Demanda eléctrica diaria promedio. Proxy en tiempo real de la actividad económica. Fuente: CAMMESA." },
    { title: "Salario Real", value: "+41.5%", sub: "vs feb 2024", trend: "+5.8pp", trendUp: false, color: "green", icon: "💼", updated: "hace 1 día", tooltip: "Evolución del salario real (ajustado por inflación). Base 100 = feb 2024. Fuente: INDEC." },
    { title: "Tasa BADLAR", value: "34.5%", sub: "Bancos privados", trend: null, color: "yellow", icon: "📈", updated: "hace 1 día", tooltip: "Tasa de interés para depósitos a plazo fijo de más de $1M en bancos privados." },
];
