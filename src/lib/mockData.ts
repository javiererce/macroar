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

// Salarios basados en datos RIPTE INDEC
// RIPTE dic 2025: $1.633.547 | Índice de salarios +1.6% mensual +38.2% interanual (dic 2025)
export const mockSalarios = [
    { mes: "Feb 25", salario: 100, inflacion: 100, real: 100 },
    { mes: "Mar 25", salario: 103.2, inflacion: 103.7, real: 99.5 },
    { mes: "Abr 25", salario: 106.5, inflacion: 106.6, real: 99.9 },
    { mes: "May 25", salario: 109.8, inflacion: 108.2, real: 101.5 },
    { mes: "Jun 25", salario: 113.4, inflacion: 109.9, real: 103.2 },
    { mes: "Jul 25", salario: 117.1, inflacion: 112.0, real: 104.6 },
    { mes: "Ago 25", salario: 120.5, inflacion: 114.1, real: 105.6 },
    { mes: "Sep 25", salario: 124.0, inflacion: 116.5, real: 106.4 },
    { mes: "Oct 25", salario: 127.8, inflacion: 119.2, real: 107.2 },
    { mes: "Nov 25", salario: 131.5, inflacion: 122.2, real: 107.6 },
    { mes: "Dic 25", salario: 135.6, inflacion: 125.6, real: 108.0 },
    { mes: "Ene 26", salario: 138.2, inflacion: 129.2, real: 107.0 },
];

export const mockSalariosSector = [
    { sector: "Privado registrado", variacion: 138, real: 107 },
    { sector: "Público nacional", variacion: 125, real: 97 },
    { sector: "Privado no registrado", variacion: 110, real: 85 },
];

// ── Noticias con imágenes reales (Feb 2026) ─────────────────
export const noticiasDefault = [
    // BCRA
    { fuente: "Ámbito", tiempo: "Hace 30 min", titulo: "El BCRA acumuló más de USD 2.400 millones en compras y superó los USD 46.000M en reservas", tag: "BCRA", tagColor: "accent", link: "https://www.ambito.com", imagen: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop" },
    { fuente: "TN", tiempo: "Hace 1h", titulo: "El BCRA lleva 33 ruedas consecutivas comprando dólares y aprovecha la baja del tipo de cambio", tag: "BCRA", tagColor: "accent", link: "https://tn.com.ar", imagen: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop" },
    { fuente: "Ámbito", tiempo: "Hace 2h", titulo: "BCRA flexibilizó norma de encajes: bancos podrán trasladar 5% de exigencia al mes siguiente", tag: "BCRA", tagColor: "accent", link: "https://www.ambito.com", imagen: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=600&h=400&fit=crop" },
    { fuente: "El Destape", tiempo: "Hace 3h", titulo: "Depósitos en dólares de hasta 40 SMVM no requerirán justificación de fondos", tag: "BCRA", tagColor: "accent", link: "https://www.eldestapeweb.com", imagen: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&h=400&fit=crop" },
    // Precios / INDEC
    { fuente: "Infobae", tiempo: "Hace 45 min", titulo: "Inflación de enero fue 2.9%: los alimentos y la carne siguen presionando los precios", tag: "Precios", tagColor: "red", link: "https://www.infobae.com", imagen: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop" },
    { fuente: "Perfil", tiempo: "Hace 2h", titulo: "Alimentos suben 3.4% en promedio de las últimas 4 semanas según relevamiento privado", tag: "Precios", tagColor: "red", link: "https://www.perfil.com", imagen: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop" },
    { fuente: "iProfesional", tiempo: "Hace 3h", titulo: "Consultoras estiman inflación de febrero en 3.0%, por encima del 2.9% de enero", tag: "Precios", tagColor: "red", link: "https://www.iprofesional.com", imagen: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop" },
    { fuente: "Clarín", tiempo: "Hace 4h", titulo: "La carne subió hasta 3% en la segunda semana de febrero: el gobierno en alerta", tag: "Precios", tagColor: "red", link: "https://www.clarin.com", imagen: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop" },
    // Mercados
    { fuente: "Infobae", tiempo: "Hace 20 min", titulo: "El Merval ganó 1.2% impulsado por la aprobación de la reforma laboral en Diputados", tag: "Mercados", tagColor: "green", link: "https://www.infobae.com", imagen: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop" },
    { fuente: "El Cronista", tiempo: "Hace 1h", titulo: "Bonos soberanos en dólares subieron 0.7% en promedio y el riesgo país perforó los 520 pb", tag: "Mercados", tagColor: "green", link: "https://www.cronista.com", imagen: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop" },
    { fuente: "Ámbito", tiempo: "Hace 3h", titulo: "Dólar oficial cayó por debajo de $1.400 por primera vez en 4 meses por afluencia récord de divisas", tag: "Mercados", tagColor: "green", link: "https://www.ambito.com", imagen: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=600&h=400&fit=crop" },
    { fuente: "Infobae", tiempo: "Hace 5h", titulo: "El dólar mayorista retrocedió a $1.376, su valor más bajo desde octubre: perdió 5.4% en 2026", tag: "Mercados", tagColor: "green", link: "https://www.infobae.com", imagen: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&h=400&fit=crop" },
    // Fiscal
    { fuente: "Ámbito", tiempo: "Hace 1h", titulo: "Recaudación tributaria creció 8% real en febrero impulsada por Ganancias y retenciones", tag: "Fiscal", tagColor: "green", link: "https://www.ambito.com", imagen: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop" },
    { fuente: "La Nación", tiempo: "Hace 2h", titulo: "FMI aprobó nuevo desembolso de USD 2.000M tras cumplir metas fiscales del primer trimestre", tag: "Fiscal", tagColor: "green", link: "https://www.lanacion.com.ar", imagen: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop" },
    { fuente: "Infobae", tiempo: "Hace 4h", titulo: "El Tesoro colocó LECAP por $2.8 billones y cubrió todos los vencimientos de la semana", tag: "Fiscal", tagColor: "green", link: "https://www.infobae.com", imagen: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop" },
    { fuente: "iProup", tiempo: "Hace 6h", titulo: "Superávit fiscal primario de enero fue 0.4% del PBI: el gobierno mantiene el ajuste", tag: "Fiscal", tagColor: "green", link: "https://www.iproup.com", imagen: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop" },
    // Global
    { fuente: "Bloomberg", tiempo: "Hace 1h", titulo: "Riesgo país perforó los 520 puntos básicos, nivel más bajo en 7 años para Argentina", tag: "Global", tagColor: "yellow", link: "https://www.bloomberg.com", imagen: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop" },
    { fuente: "Reuters", tiempo: "Hace 3h", titulo: "Wall Street cerró mixto: el S&P 500 retrocedió 0.3% tras datos de empleo de EE.UU.", tag: "Global", tagColor: "yellow", link: "https://www.reuters.com", imagen: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop" },
    { fuente: "Infobae", tiempo: "Hace 4h", titulo: "La Fed mantendría las tasas en 4.25%-4.50% hasta junio según expectativas del mercado", tag: "Global", tagColor: "yellow", link: "https://www.infobae.com", imagen: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=600&h=400&fit=crop" },
    { fuente: "El Cronista", tiempo: "Hace 5h", titulo: "Brasil devaluó el real 1.2% y pone presión sobre la competitividad argentina", tag: "Global", tagColor: "yellow", link: "https://www.cronista.com", imagen: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&h=400&fit=crop" },
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
    { title: "Salario Real", value: "+7.0%", sub: "vs feb 2025", trend: "+1.2pp", trendUp: false, color: "green", icon: "💼", updated: "hace 1 día", tooltip: "Evolución del salario real (ajustado por inflación). RIPTE dic 2025: $1.633.547. Fuente: INDEC/MTEySS." },
    { title: "Tasa BADLAR", value: "29.0%", sub: "Bancos privados", trend: null, color: "yellow", icon: "📈", updated: "hace 1 día", tooltip: "Tasa de interés promedio para depósitos a plazo fijo. Fuente: BCRA." },
];
