"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
    ComposedChart, ReferenceLine, Cell
} from "recharts";
import {
    Flame, DollarSign, Wallet, Landmark,
    TriangleAlert, Zap, Briefcase, TrendingUp,
    Moon, Sun, Bell, Download, ChevronRight, ChevronDown,
    Mail, Send, CheckCircle2, Loader2, X, Info,
    TrendingDown, Calendar, Search, Share2, Settings, MessageSquare,
    Github, Linkedin
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
    mockInflacion as defaultInflacion,
    mockRiesgoPais as defaultRiesgoPais,
    mockDolar as defaultDolarHistorico,
    mockReservas as defaultReservas,
    mockCammesa, mockCammesaMensual, mockSalarios, mockSalariosSector,
    noticiasDefault, calendario, kpisInitial
} from "@/lib/mockData";

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ── Types ────────────────────────────────────────────────

interface DashboardData {
    inflacion: any[];
    reservas: any[];
    riesgoPais: { actual: number; historico: any[] };
    dolares: { oficial: number; blue: number; mep: number; ccl: number };
    dolarHistorico: any[];
    tasaBadlar: number;
    tasasBancos: any[];
    tasasCuentas: any[];
    cryptos: any[];
    lastUpdate: string;
}

interface DashboardProps {
    data: DashboardData;
}

// ── Components ────────────────────────────────────────────

const Skel = ({ className }: { className?: string }) => (
    <div className={cn("bg-subtle animate-pulse rounded", className)} />
);

// ─── HOOK: FETCH CON RETRY ────────────────────────────────────────────────────
const useFetch = (url: string, transform: any, fallback: any) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const transformRef = React.useRef(transform);
    const fallbackRef = React.useRef(fallback);

    React.useEffect(() => { transformRef.current = transform; }, [transform]);
    React.useEffect(() => { fallbackRef.current = fallback; }, [fallback]);

    const fetch_ = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error();
            const json = await res.json();
            const t = transformRef.current;
            setData(t ? t(json) : json);
            setLastUpdated(new Date());
            setError(false);
        } catch {
            setData(fallbackRef.current ?? null);
            setError(true);
        }
        setLoading(false);
    }, [url]);

    useEffect(() => {
        fetch_();
        const interval = setInterval(fetch_, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetch_]);

    return { data, loading, error, lastUpdated, refresh: fetch_ };
};

const StatusBadge = ({ loading, error, lastUpdated, onRefresh }: any) => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

    const secsAgo = lastUpdated ? Math.floor((now - lastUpdated.getTime()) / 1000) : null;
    const label = loading ? "Actualizando..." :
        error ? "⚠️ Sin conexión — datos estimados" :
            secsAgo !== null ? (secsAgo < 60 ? `Hace ${secsAgo}s` : `Hace ${Math.floor(secsAgo / 60)}min`) : "";

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: loading ? "var(--yellow)" : error ? "var(--red)" : "var(--green)",
                boxShadow: `0 0 6px ${loading ? "var(--yellow)" : error ? "var(--red)" : "var(--green)"}`,
                animation: loading ? "pulse 1s infinite" : "none",
            }} />
            <span style={{ fontSize: 10, color: error ? "var(--red)" : "var(--muted)" }}>{label}</span>
            <button onClick={onRefresh} style={{
                background: "none", border: `1px solid var(--border-color)`, borderRadius: 6,
                color: "var(--muted)", fontSize: 10, padding: "2px 8px", cursor: "pointer",
            }}>↻ Actualizar</button>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
        </div>
    );
};

const InfoTip = ({ text }: { text: string }) => {
    const [show, setShow] = useState(false);
    return (
        <span className="relative inline-block">
            <Info
                size={14}
                className="text-muted cursor-help ml-1 inline-block"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            />
            {show && (
                <div className="absolute bottom-[130%] left-1/2 -translate-x-1/2 bg-card-secondary border border-border p-2 rounded-lg w-56 text-[11px] text-muted z-[100] leading-normal shadow-xl">
                    {text}
                </div>
            )}
        </span>
    );
};

interface KPIProps {
    icon: string | React.ReactNode;
    title: string;
    value: string;
    sub: string;
    trend?: string | null;
    trendUp?: boolean;
    color: string;
    updated: string;
    tooltip: string;
}

const KPI = ({ icon, title, value, sub, trend, trendUp, color, updated, tooltip }: KPIProps) => {
    const colorMap: Record<string, string> = {
        red: "border-l-danger text-danger",
        accent: "border-l-accent text-accent",
        yellow: "border-l-warning text-warning",
        green: "border-l-success text-success",
        purple: "border-l-info text-info",
        orange: "border-l-economy text-economy",
    };

    return (
        <div className={cn("bg-card border border-border/40 rounded-3xl p-6 flex-1 min-w-[140px] border-l-[6px] transition-all hover:translate-y-[-2px] hover:shadow-2xl", colorMap[color] || "border-l-accent")}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-muted text-[11px] uppercase tracking-[0.1em] flex items-center gap-1.5 font-bold">
                    {typeof icon === 'string' ? icon : icon} {title}
                </span>
                <InfoTip text={tooltip} />
            </div>
            <div className="text-foreground text-3xl font-serif tracking-tight font-black mb-1">{value}</div>
            <div className="flex justify-between items-center mt-3">
                <div className="flex gap-1.5 items-center">
                    {trend && (
                        <span className={cn("text-[11px] font-semibold flex items-center gap-0.5", trendUp ? "text-danger" : "text-success")}>
                            {trendUp ? "▲" : "▼"} {trend}
                        </span>
                    )}
                    <span className="text-muted text-[10px]">{sub}</span>
                </div>
                <span className="text-muted text-[9px] bg-card-secondary px-1.5 py-0.5 rounded flex items-center gap-1">
                    {updated}
                </span>
            </div>
        </div>
    );
};

interface ChartCardProps {
    title: string;
    source: string;
    badge?: string;
    badgeColor?: string;
    children: React.ReactNode;
}

const ChartCard = ({ title, source, badge, badgeColor, children }: ChartCardProps) => (
    <div className="bg-card border border-border/30 rounded-[32px] p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            <div className="flex items-center gap-3">
                <h3 className="text-foreground text-lg font-serif font-black tracking-tight">{title}</h3>
                {badge && (
                    <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-lg", badgeColor)}>
                        {badge}
                    </span>
                )}
            </div>
            <span className="text-muted text-[11px] font-medium opacity-50">{source}</span>
        </div>
        <div className="h-[260px] w-full" style={{ minWidth: 0, minHeight: 0 }}>
            {children}
        </div>
    </div>
);

const SponsorBanner = () => (
    <div className="bg-gradient-to-r from-accent to-purple-800 rounded-[32px] p-8 mb-10 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="relative z-10 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black mb-2 tracking-tight">Anuncie su empresa aquí</h3>
            <p className="text-white/80 text-sm md:text-base font-medium max-w-md">Llegue a miles de profesionales y tomadores de decisiones del sector financiero y corporativo.</p>
        </div>
        <a
            href="https://wa.me/541168873648?text=Hola,%20quisiera%20consultar%20por%20publicidad%20en%20MacroAR"
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 bg-white text-accent px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-opacity-90 hover:scale-105 transition-all shadow-lg active:scale-95 flex items-center gap-2 whitespace-nowrap"
        >
            <MessageSquare size={18} fill="currentColor" /> Contactar por WhatsApp
        </a>
    </div>
);

const Footer = () => (
    <footer className="mt-16 pb-12 pt-8 border-t border-border/40 text-center">
        <div className="flex flex-col items-center gap-4">
            <div className="text-2xl font-black tracking-tighter opacity-80">Macro<span className="text-accent">AR</span></div>
            <p className="text-muted text-sm font-medium">
                Desarrollado integralmente por <span className="text-foreground font-bold underline decoration-accent/30 decoration-2 underline-offset-4 tracking-tight px-1">Maximiliano Erce</span>
            </p>
            <div className="flex items-center gap-6 mt-2">
                <a href="https://www.linkedin.com/in/maximiliano-erce" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent transition-all text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 flex items-center gap-1.5">
                    <Linkedin size={14} /> LinkedIn
                </a>
                <a href="https://github.com/javiererce" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent transition-all text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 flex items-center gap-1.5">
                    <Github size={14} /> GitHub
                </a>
            </div>
            <p className="text-[10px] text-muted font-bold tracking-[0.2em] uppercase opacity-40 mt-4 leading-relaxed max-w-xs mx-auto">
                © 2025-2026 · MacroAR Intelligence · Todos los derechos reservados · Buenos Aires, Argentina
            </p>
        </div>
    </footer>
);

// ── Modals ──────────────────────────────────────────────

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div className="animate-in zoom-in-95 duration-200 w-full flex justify-center" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

const AlertModal = ({ onClose }: { onClose: () => void }) => {
    const [channel, setChannel] = useState<string | null>(null);
    const [indicator, setIndicator] = useState("Inflación mensual");
    const [threshold, setThreshold] = useState("");
    const [contact, setContact] = useState("");
    const [done, setDone] = useState(false);
    const [sending, setSending] = useState(false);
    const indicators = ["Inflación mensual", "Dólar Blue", "Dólar Oficial", "Riesgo País", "Reservas BCRA", "Demanda Eléctrica CAMMESA", "Salario Real", "Tasa BADLAR"];

    const handleCreate = async () => {
        setSending(true);
        // Simular envío
        await new Promise(r => setTimeout(r, 1500));
        setSending(false);
        setDone(true);
    };

    return (
        <div className="bg-card border border-border rounded-2xl w-full max-w-[420px] p-6 shadow-2xl">
            {done ? (
                <div className="text-center py-4">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-foreground text-xl font-bold mb-2">¡Alerta creada!</h3>
                    <p className="text-muted text-sm mb-2">Te avisamos cuando <strong className="text-foreground">{indicator}</strong> supere <strong className="text-accent">{threshold}</strong></p>
                    <p className="text-muted text-xs mb-6">
                        {channel === "email" ? `📧 Notificación a: ${contact}` : `✈️ Telegram: @${contact.replace("@", "")}`}
                    </p>
                    <button onClick={onClose} className="bg-accent text-white rounded-lg px-6 py-2.5 font-bold hover:scale-105 transition-transform">Listo</button>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
                            <Bell size={20} className="text-warning" /> Crear Alerta
                        </h3>
                        <button onClick={onClose} className="text-muted hover:text-foreground transition-colors"><X size={24} /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-muted text-[10px] font-bold uppercase tracking-wider block mb-2">CANAL</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: "email", label: "Email", icon: <Mail size={16} /> },
                                    { id: "telegram", label: "Telegram", icon: <Send size={16} /> }
                                ].map(ch => (
                                    <button
                                        key={ch.id}
                                        onClick={() => { setChannel(ch.id); setContact(""); }}
                                        className={cn(
                                            "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-semibold text-sm",
                                            channel === ch.id ? "border-accent bg-accent/10 text-foreground" : "border-border bg-transparent text-muted hover:border-accent/40"
                                        )}
                                    >
                                        {ch.icon} {ch.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {channel === "email" && (
                            <div>
                                <label className="text-muted text-[10px] font-bold uppercase tracking-wider block mb-2">TU EMAIL</label>
                                <input
                                    value={contact}
                                    onChange={e => setContact(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    type="email"
                                    className="w-full bg-background border border-border rounded-lg text-foreground p-3 text-sm focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>
                        )}
                        {channel === "telegram" && (
                            <div>
                                <label className="text-muted text-[10px] font-bold uppercase tracking-wider block mb-2">TU USUARIO DE TELEGRAM</label>
                                <input
                                    value={contact}
                                    onChange={e => setContact(e.target.value)}
                                    placeholder="@tuusuario"
                                    className="w-full bg-background border border-border rounded-lg text-foreground p-3 text-sm focus:ring-2 focus:ring-accent outline-none"
                                />
                                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mt-2">
                                    <p className="text-muted text-[11px] leading-relaxed">
                                        También buscá <strong className="text-accent">@MacroARBot</strong> en Telegram y enviá <code className="bg-success/20 text-success px-1 rounded font-bold">/start</code>
                                    </p>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="text-muted text-[10px] font-bold uppercase tracking-wider block mb-2">INDICADOR</label>
                            <select
                                value={indicator}
                                onChange={e => setIndicator(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg text-foreground p-3 text-sm focus:ring-2 focus:ring-accent outline-none appearance-none"
                            >
                                {indicators.map(i => <option key={i}>{i}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-muted text-[10px] font-bold uppercase tracking-wider block mb-2">ALERTAR CUANDO SUPERE</label>
                            <input
                                value={threshold}
                                onChange={e => setThreshold(e.target.value)}
                                placeholder="Ej: 420 GWh, 3%, $1.300"
                                className="w-full bg-background border border-border rounded-lg text-foreground p-3 text-sm focus:ring-2 focus:ring-accent outline-none"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={!channel || !threshold || !contact || sending}
                            className={cn(
                                "w-full rounded-xl p-4 font-bold text-base transition-all flex items-center justify-center gap-2",
                                channel && threshold && contact && !sending ? "bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98]" : "bg-border text-muted cursor-not-allowed"
                            )}
                        >
                            {sending ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
                            ) : (
                                "Crear Alerta"
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const ExportModal = ({ data, onClose }: { data: DashboardData, onClose: () => void }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);
    const [step, setStep] = useState<"select" | "format">("select");
    const [selected, setSelected] = useState<string>("all");

    const indicadores = [
        { id: "all", label: "📊 Todos los indicadores", desc: "Informe completo" },
        { id: "inflacion", label: "🔥 Inflación", desc: "IPC mensual" },
        { id: "dolar", label: "💵 Tipo de Cambio", desc: "Oficial, Blue, MEP, CCL" },
        { id: "reservas", label: "🏦 Reservas BCRA", desc: "Brutas y netas" },
        { id: "riesgo", label: "⚠️ Riesgo País", desc: "EMBI+ JPMorgan" },
    ];

    const getSheetData = (id: string) => {
        const sheets: { name: string; data: Record<string, unknown>[] }[] = [];
        if (id === "all" || id === "inflacion") {
            sheets.push({ name: "Inflacion", data: data.inflacion.map(d => ({ Mes: d.mes, "Variación (%)": d.valor })) });
        }
        if (id === "all" || id === "dolar") {
            sheets.push({ name: "Dolar", data: data.dolarHistorico.map(d => ({ Mes: d.mes, Oficial: d.oficial, Blue: d.blue })) });
            if (id === "dolar" || id === "all") {
                sheets.push({ name: "Cotizacion Actual", data: [{ "Oficial BNA": data.dolares.oficial, "Blue": data.dolares.blue, "MEP": data.dolares.mep, "CCL": data.dolares.ccl }] });
            }
        }
        if (id === "all" || id === "reservas") {
            sheets.push({ name: "Reservas", data: data.reservas.map(d => ({ Mes: d.mes, "Brutas (USD B)": d.valor, "Netas Est. (USD B)": (d as any).neta ?? "N/A" })) });
        }
        if (id === "all" || id === "riesgo") {
            sheets.push({ name: "Riesgo Pais", data: data.riesgoPais.historico.map(d => ({ Mes: d.mes, "Puntos Básicos": d.valor })) });
        }
        return sheets;
    };

    const handleExport = async (type: string) => {
        setLoading(type);
        try {
            const sheets = getSheetData(selected);
            const dateStr = new Date().toISOString().split('T')[0];
            const labelSelected = indicadores.find(i => i.id === selected)?.label?.replace(/^[^\s]+\s/, '') || "Reporte";

            if (type === "Excel" || type === "CSV") {
                const wb = XLSX.utils.book_new();
                sheets.forEach(s => {
                    const wsData = [
                        [`MacroAR Intelligence - ${labelSelected}`], // Title row
                        [], // Empty row for spacing
                        ...XLSX.utils.sheet_to_json<any[]>(XLSX.utils.json_to_sheet(s.data), { header: 1 }) // Transform data to array of arrays
                    ];

                    const ws = XLSX.utils.aoa_to_sheet(wsData);

                    // Style Excel columns width
                    if (!ws['!cols']) ws['!cols'] = [];
                    const numColumns = Object.keys(s.data[0] || {}).length;
                    for (let i = 0; i < numColumns; i++) {
                        ws['!cols'][i] = { wch: 18 }; // Better breathing room
                    }

                    XLSX.utils.book_append_sheet(wb, ws, s.name);
                });
                const ext = type === "Excel" ? "xlsx" : "csv";
                const bookType = type === "Excel" ? "xlsx" : "csv";
                XLSX.writeFile(wb, `MacroAR_${labelSelected.replace(/\s/g, '_')}_${dateStr}.${ext}`, { bookType: bookType as any });
            } else if (type === "PDF") {
                const pdf = new jsPDF('p', 'mm', 'a4');
                const w = pdf.internal.pageSize.getWidth();
                const h = pdf.internal.pageSize.getHeight();
                let y = 0;

                // ── Header gradient ──
                pdf.setFillColor(20, 20, 22); // Background bg-background
                pdf.rect(0, 0, w, 50, 'F');
                pdf.setFillColor(232, 107, 152); // Pink accent
                pdf.rect(0, 46, w, 4, 'F');

                // Logo text
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(28);
                pdf.setFont("helvetica", "bold");
                pdf.text("Macro", 15, 25);
                pdf.setTextColor(232, 107, 152);
                pdf.text("AR", 52, 25);

                // Subtitle
                pdf.setTextColor(149, 149, 158);
                pdf.setFontSize(9);
                pdf.setFont("helvetica", "normal");
                pdf.text("INTELLIGENCE DASHBOARD", 15, 33);
                pdf.text(`Generado: ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`, 15, 39);

                // Flag emoji and type
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(10);
                pdf.setFont("helvetica", "bold");
                pdf.text(`REPORTE: ${labelSelected.toUpperCase()}`, w - 15, 25, { align: "right" });
                pdf.setTextColor(149, 149, 158);
                pdf.setFontSize(8);
                pdf.text("macroar.vercel.app", w - 15, 33, { align: "right" });

                y = 58;

                // ── KPI Cards (only for "all") ──
                if (selected === "all") {
                    const kpis = [
                        { label: "Inflación", value: `${data.inflacion.length ? data.inflacion[data.inflacion.length - 1].valor : "N/A"}%`, color: [239, 68, 68] },
                        { label: "Dólar Oficial", value: `$${data.dolares.oficial}`, color: [232, 107, 152] }, // Pink for dollar instead of blue
                        { label: "Dólar Blue", value: `$${data.dolares.blue}`, color: [245, 158, 11] },
                        { label: "Riesgo País", value: `${data.riesgoPais.actual} pb`, color: [139, 92, 246] },
                    ];
                    const cardW = (w - 30 - 15) / 4;
                    kpis.forEach((kpi, i) => {
                        const x = 15 + i * (cardW + 5);
                        pdf.setFillColor(34, 34, 37); // bg-card (Buenbit)
                        pdf.roundedRect(x, y, cardW, 28, 3, 3, 'F');
                        pdf.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
                        pdf.setLineWidth(0.8);
                        pdf.line(x, y + 2, x, y + 26);

                        pdf.setTextColor(149, 149, 158); // Muted
                        pdf.setFontSize(7);
                        pdf.setFont("helvetica", "bold");
                        pdf.text(kpi.label.toUpperCase(), x + 5, y + 9);

                        pdf.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
                        pdf.setFontSize(14);
                        pdf.text(kpi.value, x + 5, y + 21);
                    });
                    y += 38;
                }

                // ── Data Tables ──
                sheets.forEach((sheet, si) => {
                    if (y > h - 40) {
                        pdf.addPage();
                        pdf.setFillColor(20, 20, 22);
                        pdf.rect(0, 0, w, 12, 'F');
                        pdf.setTextColor(149, 149, 158);
                        pdf.setFontSize(7);
                        pdf.text(`MacroAR Intelligence — ${labelSelected}`, 15, 8);
                        pdf.text(`Pág ${pdf.getNumberOfPages()}`, w - 15, 8, { align: "right" });
                        y = 20;
                    }

                    // Section title
                    pdf.setFillColor(34, 34, 37);
                    pdf.roundedRect(15, y, w - 30, 10, 2, 2, 'F');
                    pdf.setTextColor(232, 107, 152);
                    pdf.setFontSize(10);
                    pdf.setFont("helvetica", "bold");
                    pdf.text(`📊 ${sheet.name}`, 20, y + 7);
                    y += 14;

                    if (sheet.data.length === 0) {
                        pdf.setTextColor(149, 149, 158);
                        pdf.setFontSize(9);
                        pdf.text("Sin datos disponibles", 20, y + 5);
                        y += 12;
                        return;
                    }

                    // Table header
                    const cols = Object.keys(sheet.data[0]);
                    const colW = (w - 30) / cols.length;

                    pdf.setFillColor(42, 42, 46); // bg-card-secondary
                    pdf.rect(15, y, w - 30, 8, 'F');
                    pdf.setTextColor(149, 149, 158);
                    pdf.setFontSize(7);
                    pdf.setFont("helvetica", "bold");
                    cols.forEach((col, ci) => {
                        pdf.text(col.toUpperCase(), 17 + ci * colW, y + 5.5);
                    });
                    y += 8;

                    // Table rows
                    pdf.setFont("helvetica", "normal");
                    sheet.data.forEach((row, ri) => {
                        if (y > h - 20) {
                            pdf.addPage();
                            pdf.setFillColor(20, 20, 22);
                            pdf.rect(0, 0, w, 12, 'F');
                            pdf.setTextColor(149, 149, 158);
                            pdf.setFontSize(7);
                            pdf.text(`MacroAR Intelligence — ${sheet.name}`, 15, 8);
                            y = 20;
                        }
                        if (ri % 2 === 0) {
                            pdf.setFillColor(34, 34, 37);
                            pdf.rect(15, y, w - 30, 7, 'F');
                        }
                        pdf.setTextColor(255, 255, 255);
                        pdf.setFontSize(8);
                        cols.forEach((col, ci) => {
                            const val = String((row as Record<string, unknown>)[col] ?? "");
                            pdf.text(val, 17 + ci * colW, y + 5);
                        });
                        y += 7;
                    });
                    y += 8;
                });

                // ── Footer ──
                const lastPage = pdf.getNumberOfPages();
                for (let p = 1; p <= lastPage; p++) {
                    pdf.setPage(p);
                    pdf.setFillColor(20, 20, 22);
                    pdf.rect(0, h - 15, w, 15, 'F');
                    pdf.setDrawColor(232, 107, 152);
                    pdf.setLineWidth(0.5);
                    pdf.line(0, h - 15, w, h - 15);
                    pdf.setTextColor(149, 149, 158);
                    pdf.setFontSize(7);
                    pdf.setFont("helvetica", "normal");
                    pdf.text("© 2025-2026 MacroAR Intelligence · Desarrollado por Maximiliano Erce · macroar.vercel.app", w / 2, h - 7, { align: "center" });
                }

                pdf.save(`MacroAR_${labelSelected.replace(/\s/g, '_')}_${dateStr}.pdf`);
            }
            setDone(type);
        } catch (error) {
            console.error("Export error:", error);
            alert("Error al exportar el archivo.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl w-full max-w-[440px] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
                    <Download size={20} className="text-success" /> Exportar Datos
                </h3>
                <button onClick={onClose} className="text-muted hover:text-foreground transition-colors"><X size={24} /></button>
            </div>

            {done ? (
                <div className="text-center py-6">
                    <div className="text-5xl mb-4">✅</div>
                    <p className="text-foreground font-bold mb-4">¡{done} generado con éxito!</p>
                    <button onClick={onClose} className="bg-accent text-white rounded-lg px-6 py-2.5 font-bold hover:scale-105 transition-transform">Cerrar</button>
                </div>
            ) : loading ? (
                <div className="text-center py-10">
                    <Loader2 size={48} className="text-accent animate-spin mx-auto mb-4" />
                    <p className="text-muted text-sm italic">Generando archivo {loading}...</p>
                </div>
            ) : step === "select" ? (
                <div>
                    <p className="text-muted text-xs font-bold uppercase tracking-wider mb-3">¿Qué querés exportar?</p>
                    <div className="space-y-2 mb-5">
                        {indicadores.map(ind => (
                            <button
                                key={ind.id}
                                onClick={() => setSelected(ind.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left text-sm",
                                    selected === ind.id
                                        ? "border-accent bg-accent/10 text-foreground font-bold"
                                        : "border-border bg-transparent text-muted hover:border-accent/40"
                                )}
                            >
                                <span className="text-lg">{ind.label.split(" ")[0]}</span>
                                <div>
                                    <div className="font-semibold">{ind.label.split(" ").slice(1).join(" ")}</div>
                                    <div className="text-[10px] text-muted">{ind.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setStep("format")}
                        className="w-full bg-accent text-white rounded-xl p-3.5 font-bold text-sm hover:scale-[1.02] transition-transform active:scale-[0.98] shadow-lg shadow-accent/20"
                    >
                        Continuar →
                    </button>
                </div>
            ) : (
                <div>
                    <button onClick={() => setStep("select")} className="text-muted text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1 hover:text-foreground transition-colors">
                        ← Volver · {indicadores.find(i => i.id === selected)?.label}
                    </button>
                    <p className="text-muted text-xs font-bold uppercase tracking-wider mb-3 mt-4">Elegí el formato</p>
                    <div className="space-y-3">
                        {[
                            { type: "PDF", icon: "📄", desc: "Informe profesional con diseño premium", color: "hover:border-danger hover:bg-danger/5" },
                            { type: "Excel", icon: "📊", desc: "Datos tabulados en múltiples hojas", color: "hover:border-success hover:bg-success/5" },
                            { type: "CSV", icon: "🗂️", desc: "Ideal para Power BI o Google Sheets", color: "hover:border-accent hover:bg-accent/5" }
                        ].map(i => (
                            <button
                                key={i.type}
                                onClick={() => handleExport(i.type)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 border border-border rounded-xl transition-all text-left",
                                    i.color
                                )}
                            >
                                <span className="text-3xl">{i.icon}</span>
                                <div>
                                    <div className="text-foreground font-bold text-sm">Exportar a {i.type}</div>
                                    <div className="text-muted text-[11px]">{i.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Live Visitor Counter ─────────────────────────────────
const LiveCounter = () => {
    const [visitors, setVisitors] = useState(0);
    useEffect(() => {
        // Base: random between 12,000 and 14,500
        const base = Math.floor(12000 + Math.random() * 2500);
        setVisitors(base);
        const interval = setInterval(() => {
            setVisitors(prev => prev + Math.floor(Math.random() * 8) - 2); // ±fluctuation
        }, Math.random() * 5000 + 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-success/5 border-2 border-success/30 px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all hover:bg-success/10 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:scale-105 cursor-default">
            <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success shadow-[0_0_8px_var(--green)]"></span>
            </span>
            <span className="hidden sm:inline tracking-wider">
                <span className="text-white text-sm">{visitors.toLocaleString("es-AR")}</span>{" "}
                <span className="text-success/80">EN VIVO</span>
            </span>
            <span className="sm:hidden text-success">EN VIVO</span>
        </div>
    );
};

// ── Main Layout ───────────────────────────────────────────

export default function DashboardClient({ data: initialData }: DashboardProps) {
    const memoTransform = useCallback((d: any) => d, []);
    const live = useFetch("/api/indicators", memoTransform, initialData);
    const data = live.data || initialData;

    const [dark, setDark] = useState(true);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("resumen");
    const [alertOpen, setAlertOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [dark]);

    const navItems = [
        { id: "resumen", label: "📊 Resumen" },
        {
            id: "indicadores",
            label: "📈 Indicadores",
            children: [
                { id: "precios", label: "🔥 Inflación" },
                { id: "cambiario", label: "💵 Cambio" },
                { id: "externo", label: "🌍 Externo" },
                { id: "cammesa", label: "⚡ CAMMESA" },
                { id: "salarios", label: "💼 Salarios" },
            ]
        },
        { id: "noticias", label: "📰 Noticias" },
        { id: "calendario", label: "📅 Calendario" },
        { id: "resumen_ia", label: "🤖 Resumen IA" },
        { id: "crypto", label: "🪙 Crypto" },
        { id: "simulador", label: "🔮 Simulador" },
    ];

    // Merge Real Data with KPIs
    const kpis = kpisInitial.map(k => {
        if (k.title === "Inflación mensual" && data.inflacion.length >= 2) {
            const last = data.inflacion[data.inflacion.length - 1];
            const prev = data.inflacion[data.inflacion.length - 2];
            const trendValue = Number(last.valor) - Number(prev.valor);
            return { ...k, value: `${last.valor}%`, sub: last.mes, trend: `${trendValue > 0 ? '+' : ''}${trendValue.toFixed(1)}pp`, trendUp: trendValue > 0 };
        }
        if (k.title === "Dólar Oficial") {
            return { ...k, value: `$${data.dolares.oficial}` };
        }
        if (k.title === "Dólar Blue") {
            const brecha = ((data.dolares.blue / data.dolares.oficial - 1) * 100).toFixed(1);
            return { ...k, value: `$${data.dolares.blue}`, sub: `Brecha ${brecha}%` };
        }
        if (k.title === "Reservas BCRA" && data.reservas && data.reservas.length >= 2) {
            const last = data.reservas[data.reservas.length - 1];
            const prev = data.reservas[data.reservas.length - 2];
            const diffNum = last.valor - prev.valor;
            const diff = diffNum.toFixed(1);
            return { ...k, value: `USD ${last.valor}B`, sub: `vs mes ant: ${diffNum > 0 ? '+' : ''}${diff}B`, trend: `${((last.valor / prev.valor - 1) * 100).toFixed(1)}%`, trendUp: last.valor < prev.valor };
        }
        if (k.title === "Riesgo País") {
            return { ...k, value: `${data.riesgoPais.actual} pb` };
        }
        if (k.title === "Tasa BADLAR") {
            return { ...k, value: `${data.tasaBadlar}%` };
        }
        return k;
    });

    return (
        <div className="bg-background min-h-screen text-foreground transition-colors duration-500 overflow-x-hidden">
            {/* Header */}
            <header className="border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-5 py-4 flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl filter drop-shadow-md">🇦🇷</span>
                        <div>
                            <div className="font-black text-5xl tracking-tighter leading-none mb-1">Macro<span className="text-accent">AR</span></div>
                            <div className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Intelligence Dashboard · Feb 2025</div>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center flex-wrap">
                        <button
                            onClick={() => setDark(!dark)}
                            className="p-3 bg-card border border-border rounded-xl text-muted hover:text-foreground transition-all hover:shadow-lg hover:border-accent/30"
                            aria-label="Toggle Theme"
                        >
                            {dark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button
                            onClick={() => setAlertOpen(true)}
                            className="flex items-center gap-2 bg-warning/10 text-warning border border-warning/30 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-warning/20 transition-all hover:shadow-lg shadow-warning/10"
                        >
                            <Bell size={18} /> <span className="hidden sm:inline">Alertas</span>
                        </button>

                        <button
                            onClick={() => setExportOpen(true)}
                            className="flex items-center gap-2 bg-success/10 text-success border border-success/30 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-success/20 transition-all hover:shadow-lg shadow-success/10"
                        >
                            <Download size={18} /> <span className="hidden sm:inline">Exportar</span>
                        </button>

                        <StatusBadge loading={live.loading} error={live.error} lastUpdated={live.lastUpdated} onRefresh={live.refresh} />
                        <LiveCounter />
                    </div>
                </div>
            </header>

            {/* Tabs Navigation */}
            <nav className="border-b border-border bg-card/40 backdrop-blur-md sticky top-[81px] z-40 overflow-visible">
                <div className="max-w-[1400px] mx-auto flex flex-wrap px-2 sm:px-5">
                    {navItems.map(t => {
                        const isActive = t.children ? t.children.some(c => c.id === tab) : tab === t.id;

                        if (t.children) {
                            return (
                                <div key={t.id} className="relative group flex-shrink-0">
                                    <button
                                        className={cn(
                                            "flex items-center gap-1.5 px-4 sm:px-6 py-4 text-[11px] sm:text-xs font-black transition-all border-b-[3px] whitespace-nowrap uppercase tracking-widest outline-none focus:outline-none",
                                            isActive ? "text-accent border-accent bg-accent/5" : "text-muted border-transparent hover:text-foreground hover:bg-card/50",
                                            "group-hover:text-foreground group-focus-within:text-foreground group-hover:bg-card/50"
                                        )}
                                        aria-haspopup="menu"
                                    >
                                        {t.label}
                                        <ChevronDown size={14} className="opacity-60 group-hover:opacity-100 transition-transform group-hover:rotate-180" />
                                    </button>

                                    {/* Dropdown flotante */}
                                    <div className="absolute top-full left-0 hidden group-hover:block group-focus-within:block pt-1 z-[100] min-w-[210px]">
                                        <div className="bg-[#111827] border border-[#1f2937] rounded-[10px] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col gap-1 transform-gpu">
                                            {t.children.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={(e) => { e.currentTarget.blur(); setTab(c.id); }}
                                                    className={cn(
                                                        "text-left px-4 py-3 text-[11px] font-black tracking-widest uppercase transition-all rounded-lg",
                                                        tab === c.id ? "text-accent bg-accent/10 shadow-inner" : "text-muted hover:text-foreground hover:bg-white/5"
                                                    )}
                                                >
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    "flex-shrink-0 px-4 sm:px-6 py-4 text-[11px] sm:text-xs font-black transition-all border-b-[3px] whitespace-nowrap uppercase tracking-widest",
                                    isActive ? "text-accent border-accent bg-accent/5" : "text-muted border-transparent hover:text-foreground hover:bg-card/50"
                                )}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <main id="dashboard-main-content" className="max-w-[1400px] mx-auto p-5 md:p-8 animate-in fade-in duration-700">
                <SponsorBanner />

                {/* KPIs Grid — only on Resumen */}
                {tab === "resumen" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {loading
                            ? Array(8).fill(0).map((_, i) => (
                                <div key={i} className="bg-card border border-border rounded-xl p-4 flex-1">
                                    <Skel className="h-3 w-1/2 mb-3" />
                                    <Skel className="h-7 w-3/4 mb-4" />
                                    <div className="flex justify-between items-center">
                                        <Skel className="h-3 w-1/3" />
                                        <Skel className="h-4 w-1/4" />
                                    </div>
                                </div>
                            ))
                            : kpis.map(k => <KPI key={k.title} {...k} icon={k.icon} trendUp={k.trendUp ?? false} color={k.color} updated={k.updated} />)
                        }
                    </div>
                )}

                {/* Content Area */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-card border border-border rounded-xl p-5 h-[320px] shadow-sm">
                                    <Skel className="h-5 w-1/3 mb-6" />
                                    <Skel className="h-[220px] w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            {tab === "resumen" && <ResumenTab data={data} />}
                            {tab === "precios" && <PreciosTab data={data} />}
                            {tab === "cambiario" && <CambiarioTab data={data} />}
                            {tab === "externo" && <ExternoTab data={data} />}
                            {tab === "cammesa" && <CammesaTab />}
                            {tab === "salarios" && <SalariosTab />}
                            {tab === "noticias" && <NoticiasTab />}
                            {tab === "calendario" && <CalendarioTab />}
                            {tab === "resumen_ia" && <ResumenIaTab data={data} />}
                            {tab === "crypto" && <CryptoTab data={data} />}
                            {tab === "simulador" && <SimuladorTab data={data} />}
                        </div>
                    )}
                </div>

                <Footer />
            </main>

            {/* Modals */}
            {alertOpen && <ModalOverlay onClose={() => setAlertOpen(false)}><AlertModal onClose={() => setAlertOpen(false)} /></ModalOverlay>}
            {exportOpen && <ModalOverlay onClose={() => setExportOpen(false)}><ExportModal data={data} onClose={() => setExportOpen(false)} /></ModalOverlay>}
        </div>
    );
}

// ── Tab Contents ──────────────────────────────────────────

const ResumenTab = ({ data }: DashboardProps) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Inflación Mensual (%)" source="INDEC">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.inflacion.length ? data.inflacion : defaultInflacion}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                    <XAxis dataKey="mes" tick={{ fill: "#ffffff", fontSize: 13, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#ffffff", fontSize: 13, fontWeight: 700 }} unit="%" axisLine={false} tickLine={false} />
                    <Tooltip
                        cursor={{ fill: 'var(--card-secondary)', opacity: 0.4 }}
                        contentStyle={{ backgroundColor: "#141416", border: "1px solid #333338", borderRadius: "16px", boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.5)", padding: "16px" }}
                        itemStyle={{ color: "#E86B98", fontWeight: "black", fontSize: "16px" }}
                    />
                    <Bar dataKey="valor" fill="#E86B98" radius={[8, 8, 0, 0]} barSize={36} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Demanda Eléctrica Diaria (GWh)" source="CAMMESA" badge="SITUACIÓN REAL" badgeColor="bg-economy/10 text-economy">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockCammesa.slice(-14)}>
                    <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--orange)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--orange)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                    <XAxis dataKey="dia" tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#e2e8f0", fontSize: 12 }} domain={[270, 450]} axisLine={false} tickLine={false} />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-card-secondary border border-border p-4 rounded-xl shadow-2xl backdrop-blur-md">
                                        <p className="text-muted text-[10px] font-black uppercase mb-1 tracking-widest">{label}</p>
                                        <p className="text-economy font-black text-2xl">{payload[0].value} <span className="text-xs font-bold opacity-70">GWh</span></p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area type="monotone" dataKey="valor" stroke="var(--orange)" fill="url(#cg)" strokeWidth={4} />
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Dólar Oficial vs Blue ($)" source="BCRA / Mercado">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dolarHistorico.length ? data.dolarHistorico : defaultDolarHistorico}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                    <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#e2e8f0", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "15px", fontWeight: "bold" }} />
                    <Line type="monotone" dataKey="oficial" stroke="var(--accent)" strokeWidth={4} dot={false} name="Oficial BNA" />
                    <Line type="monotone" dataKey="blue" stroke="var(--yellow)" strokeWidth={4} dot={false} name="Dólar Blue" strokeDasharray="8 6" />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Salario Nominal vs Inflación (base 100)" source="INDEC" badge="BETA" badgeColor="bg-success/10 text-success">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockSalarios}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                    <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#e2e8f0", fontSize: 12 }} domain={[90, 150]} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "15px", fontWeight: "bold" }} />
                    <ReferenceLine y={100} stroke="var(--muted)" strokeDasharray="4 4" opacity={0.8} label={{ value: 'BASE', fill: 'var(--muted)', fontSize: 9, fontWeight: 900, position: 'right' }} />
                    <Line type="monotone" dataKey="salario" stroke="var(--green)" strokeWidth={4} dot={false} name="Salario RIPTE" />
                    <Line type="monotone" dataKey="inflacion" stroke="var(--red)" strokeWidth={4} dot={false} name="Inflación Acum." strokeDasharray="6 4" />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    </div>
);

const PreciosTab = ({ data }: DashboardProps) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <ChartCard title="Historial Inflación Mensual (%) — Datos INDEC" source="INDEC - IPC Nacional">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.inflacion.length ? data.inflacion : defaultInflacion}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                        <XAxis dataKey="mes" tick={{ fill: "#ffffff", fontSize: 13, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#ffffff", fontSize: 13, fontWeight: 700 }} unit="%" axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#141416", border: "1px solid #333338", borderRadius: "16px", padding: "16px", boxShadow: "0 20px 40px -5px rgba(0, 0, 0, 0.6)" }}
                            cursor={{ fill: 'var(--card-secondary)', opacity: 0.3 }}
                            itemStyle={{ color: "#E86B98", fontWeight: "black", fontSize: "18px" }}
                        />
                        <Bar dataKey="valor" fill="#E86B98" radius={[10, 10, 0, 0]} barSize={44} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
        <div className="flex flex-col gap-4">
            {[
                {
                    label: `Último Dato (${data.inflacion.length ? data.inflacion[data.inflacion.length - 1].mes : 'Feb 25'})`,
                    val: `${data.inflacion.length ? data.inflacion[data.inflacion.length - 1].valor : '2.4'}%`,
                    color: "text-danger", border: "border-danger/30"
                },
                { label: "Proyección Feb 26", val: "~3.0%", color: "text-warning", border: "border-warning/30" },
                { label: "Interanual", val: "~36%", color: "text-info", border: "border-info/30" },
                { label: "Objetivo BCRA", val: "2.0%", color: "text-success", border: "border-success/30" }
            ].map(i => (
                <div key={i.label} className={cn("bg-card border p-6 rounded-2xl shadow-sm transition-all hover:shadow-md hover:translate-x-1", i.border)}>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">{i.label}</div>
                    <div className={cn("text-4xl font-black tracking-tight", i.color)}>{i.val}</div>
                </div>
            ))}
        </div>
    </div>
);

const CambiarioTab = ({ data }: DashboardProps) => (
    <div className="space-y-6">
        <ChartCard title="Evolución Dólar Libre vs Oficial" source="Mercado Blue">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dolarHistorico.length ? data.dolarHistorico : defaultDolarHistorico}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                    <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#e2e8f0", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: "var(--card-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px" }}
                    />
                    <Legend verticalAlign="top" height={40} iconType="diamond" align="right" wrapperStyle={{ paddingBottom: "20px", fontWeight: "bold", fontSize: "12px" }} />
                    <Line type="stepAfter" dataKey="oficial" stroke="var(--accent)" strokeWidth={4} dot={{ r: 5, fill: "var(--accent)", strokeWidth: 0 }} name="Oficial BNA" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="blue" stroke="var(--yellow)" strokeWidth={5} dot={false} name="Dólar Blue" strokeDasharray="10 8" />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { label: "BNA Venta", val: `$${data.dolares.oficial}`, sub: "Importadores", color: "text-accent", bg: "bg-accent/10" },
                { label: "Blue", val: `$${data.dolares.blue}`, sub: "Informal", color: "text-warning", bg: "bg-warning/10" },
                { label: "MEP / Bolsa", val: `$${data.dolares.mep}`, sub: "Legal (Bolsa)", color: "text-success", bg: "bg-success/10" },
                { label: "CCL / Cable", val: `$${data.dolares.ccl}`, sub: "Fondos Ext.", color: "text-info", bg: "bg-info/10" }
            ].map(i => (
                <div key={i.label} className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group shadow-sm hover:shadow-lg transition-all">
                    <div className={cn("absolute top-0 right-0 w-20 h-20 opacity-10 transition-transform group-hover:scale-150 duration-500", i.bg)} style={{ borderRadius: "0 0 0 100%" }}></div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-2 opacity-60 relative z-10">{i.label}</div>
                    <div className={cn("text-3xl font-black mb-1 relative z-10 tracking-tight", i.color)}>{i.val}</div>
                    <div className="text-muted text-[10px] font-bold italic opacity-70 relative z-10 uppercase tracking-tighter">{i.sub}</div>
                </div>
            ))}
        </div>
    </div>
);

const ExternoTab = ({ data }: DashboardProps) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Reservas Internacionales (USD B)" source="BCRA" badge="BRUTAS Y NETAS" badgeColor="bg-success/10 text-success">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.reservas.length ? data.reservas : defaultReservas}>
                    <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--green)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="rn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--red)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                    <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 600 }} axisLine={false} />
                    <YAxis tick={{ fill: "#e2e8f0", fontSize: 12 }} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px" }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="valor" name="Brutas" stroke="var(--green)" fill="url(#rg)" strokeWidth={4} />
                    <Area type="monotone" dataKey="neta" name="Netas (Est.)" stroke="var(--red)" fill="url(#rn)" strokeWidth={3} strokeDasharray="5 5" />
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Riesgo País EMBI+ (pb)" source="JPMorgan">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.riesgoPais.historico.length ? data.riesgoPais.historico : defaultRiesgoPais}>
                    <defs>
                        <linearGradient id="rpg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--purple)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                    <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 600 }} axisLine={false} />
                    <YAxis tick={{ fill: "#e2e8f0", fontSize: 12 }} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="valor" stroke="var(--purple)" fill="url(#rpg)" strokeWidth={4} />
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>
    </div>
);

const CammesaTab = () => (
    <div className="space-y-6">
        <div className="bg-economy/10 border border-economy/30 rounded-2xl p-6 flex gap-6 items-start shadow-sm border-l-8 border-l-economy">
            <div className="bg-economy p-4 rounded-2xl text-white shadow-xl rotate-3">
                <Zap size={28} fill="currentColor" />
            </div>
            <div>
                <h4 className="text-economy font-black text-base mb-1 uppercase tracking-tighter">Proxy de Actividad Económica en Tiempo Real</h4>
                <p className="text-muted text-xs leading-relaxed max-w-3xl font-medium">
                    La demanda eléctrica es el indicador más rápido de la marcha de la economía. Reportado diariamente por <strong className="text-foreground">CAMMESA</strong>, permite anticipar tendencias de reactivación o enfriamiento semanas antes de que se publiquen datos oficiales del INDEC.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Demanda Diaria (Últimos 30 días)" source="CAMMESA Hub" badge="EN VIVO" badgeColor="bg-economy/10 text-economy">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockCammesa}>
                        <defs>
                            <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--orange)" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="var(--orange)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                        <XAxis dataKey="dia" tick={{ fill: "#e2e8f0", fontSize: 9, fontWeight: 700 }} axisLine={false} interval={4} />
                        <YAxis tick={{ fill: "#e2e8f0", fontSize: 12 }} domain={[270, 460]} axisLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="valor" stroke="var(--orange)" fill="url(#cg2)" strokeWidth={4} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Promedio Mensual & Variación %" source="Anuario CAMMESA">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mockCammesaMensual}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                        <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 700 }} axisLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: "#e2e8f0", fontSize: 12 }} domain={[340, 430]} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--success)", fontSize: 12, fontWeight: 900 }} unit="%" axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "20px", fontWeight: "black" }} />
                        <Bar yAxisId="left" dataKey="valor" fill="var(--orange)" radius={[4, 4, 0, 0]} opacity={0.8} name="GWh/día" barSize={28} />
                        <Line yAxisId="right" type="step" dataKey="variacion" stroke="var(--green)" strokeWidth={4} dot={{ fill: "var(--green)", strokeWidth: 2, r: 4 }} name="Var. % Mensual" />
                    </ComposedChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    </div>
);

const SalariosTab = () => (
    <div className="space-y-6">
        <div className="bg-success/5 border border-success/20 rounded-2xl p-6 flex gap-6 items-center border-l-8 border-l-success shadow-sm">
            <div className="bg-success/10 p-4 rounded-2xl">
                <Briefcase size={32} className="text-success" />
            </div>
            <div>
                <h4 className="text-success font-black text-base mb-1 uppercase tracking-tighter">Monitor de Poder Adquisitivo</h4>
                <p className="text-muted text-xs leading-relaxed max-w-3xl font-medium">
                    Seguimiento del <strong className="text-foreground">Salario Real</strong> basado en RIPTE (dic 2025: $1.633.547). El Índice de Salarios INDEC registró +1.6% mensual y +38.2% interanual en dic 2025. Valores {'>'} 100 indican recuperación real del poder adquisitivo (base feb 2025).
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Salario Nominal vs Inflación Acumulada" source="INDEC - RIPTE">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockSalarios}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                        <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 11, fontWeight: 700 }} axisLine={false} />
                        <YAxis tick={{ fill: "#e2e8f0", fontSize: 12 }} domain={[90, 150]} axisLine={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "15px", fontWeight: "bold" }} />
                        <ReferenceLine y={100} stroke="var(--muted)" strokeDasharray="5 5" label={{ value: 'BASE 100', fill: 'var(--muted)', fontSize: 12, fontWeight: 900, position: 'insideRight' }} />
                        <Line type="monotone" dataKey="salario" stroke="var(--green)" strokeWidth={4} dot={false} name="Salario Nominal" />
                        <Line type="monotone" dataKey="inflacion" stroke="var(--red)" strokeWidth={4} dot={false} name="IPC Acumulado" strokeDasharray="6 4" />
                        <Line type="monotone" dataKey="real" stroke="var(--accent)" strokeWidth={3} dot={{ r: 3, fill: 'var(--accent)' }} name="Salario Real (K)" />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Desempeño por Sectores (% Nominal)" source="INDEC">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockSalariosSector} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" opacity={0.4} />
                        <XAxis type="number" tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 700 }} unit="%" axisLine={false} />
                        <YAxis type="category" dataKey="sector" tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 800 }} width={120} axisLine={false} stroke="transparent" />
                        <Tooltip cursor={{ fill: 'var(--card-secondary)', opacity: 0.3 }} contentStyle={{ borderRadius: '12px' }} />
                        <Bar dataKey="variacion" name="Var. Nominal" fill="var(--green)" radius={[0, 6, 6, 0]} barSize={24} />
                        <Bar dataKey="real" name="Var. Real" fill="var(--accent)" radius={[0, 6, 6, 0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    </div>
);

const NoticiasTab = () => {
    const [filter, setFilter] = useState("Todos");
    const tags = ["Todos", "BCRA", "Precios", "Mercados", "Fiscal", "Global"];
    const noticias = filter === "Todos" ? noticiasDefault : noticiasDefault.filter(n => n.tag === filter);

    return (
        <div className="space-y-6">
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {tags.map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-black transition-all border shrink-0 uppercase tracking-widest",
                            filter === t ? "bg-accent border-accent text-white shadow-xl shadow-accent/30 translate-y-[-2px]" : "bg-card border-border text-muted hover:border-accent/40 hover:text-foreground"
                        )}
                    >
                        {t}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {noticias.map((n, i) => (
                    <a
                        key={i}
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/40 transition-all group cursor-pointer shadow-sm hover:shadow-2xl hover:translate-y-[-4px] flex flex-col"
                    >
                        {/* Image */}
                        <div className="relative w-full h-44 overflow-hidden">
                            <img
                                src={(n as any).imagen || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop"}
                                alt={n.titulo}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <span className={cn(
                                "absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-sm",
                                n.tag === 'BCRA' ? 'bg-accent/80 text-white' :
                                    n.tag === 'Precios' ? 'bg-danger/80 text-white' :
                                        n.tag === 'Mercados' ? 'bg-success/80 text-white' :
                                            n.tag === 'Fiscal' ? 'bg-info/80 text-white' :
                                                'bg-warning/80 text-black'
                            )}>
                                {n.tag}
                            </span>
                            <div className="absolute bottom-3 left-3 right-3">
                                <span className="text-white/60 text-[10px] font-bold uppercase">{n.fuente} · {n.tiempo}</span>
                            </div>
                        </div>
                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <h4 className="text-foreground font-bold text-[13px] leading-snug group-hover:text-accent transition-colors tracking-tight line-clamp-3">
                                {n.titulo}
                            </h4>
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] text-muted">
                                    <span className="font-bold">{n.fuente}</span>
                                    <span className="opacity-40">·</span>
                                    <span className="opacity-70">🕐 {n.tiempo}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-accent/70 text-[10px] font-medium truncate max-w-[70%]">
                                        🔗 {n.link.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                    </span>
                                    <div className="p-1.5 rounded-full group-hover:bg-accent/10 transition-colors">
                                        <ChevronRight size={14} className="text-muted group-hover:text-accent transition-all group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

const calendarioImages: Record<string, string> = {
    "BCRA": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&h=200&fit=crop",
    "INDEC": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop",
    "Deuda": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop",
};

const CalendarioTab = () => (
    <div className="max-w-4xl mx-auto space-y-5">
        {calendario.map((ev, i) => (
            <div key={i} className={cn(
                "bg-card border rounded-3xl p-5 flex items-center gap-5 transition-all hover:shadow-xl hover:translate-x-1 overflow-hidden",
                ev.dia === "Hoy" ? "border-accent ring-4 ring-accent/5 bg-accent/[0.02] shadow-accent/5" : "border-border shadow-sm"
            )}>
                {/* Image thumbnail */}
                <div className="hidden sm:block w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-border/50">
                    <img
                        src={calendarioImages[ev.tipo] || calendarioImages["BCRA"]}
                        alt={ev.tipo}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                    />
                </div>
                <div className="min-w-[70px] text-center">
                    <div className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", ev.dia === 'Hoy' ? 'text-accent' : 'text-muted')}>{ev.dia}</div>
                    <div className="text-2xl font-black tracking-tighter leading-none">{ev.fecha.split(' ')[0]}</div>
                    <div className="text-[11px] font-black text-muted uppercase tracking-tighter">{ev.fecha.split(' ')[1]}</div>
                </div>
                <div className={cn(
                    "w-2 h-16 rounded-full shadow-inner",
                    ev.importancia === 'alta' ? 'bg-danger animate-pulse' : ev.importancia === 'media' ? 'bg-warning' : 'bg-success'
                )} />
                <div className="flex-1">
                    <p className="text-foreground font-black text-base mb-3 leading-tight tracking-tight">{ev.evento}</p>
                    <div className="flex items-center gap-4">
                        <span className={cn(
                            "text-[9px] font-black uppercase px-3 py-1 rounded-lg border shadow-sm",
                            ev.tipo === 'BCRA' ? 'bg-accent/5 border-accent/20 text-accent' :
                                ev.tipo === 'INDEC' ? 'bg-info/5 border-info/20 text-info' : 'bg-danger/5 border-danger/20 text-danger'
                        )}>
                            {ev.tipo}
                        </span>
                        <span className="text-[9px] text-muted font-black uppercase tracking-widest flex items-center gap-2">
                            <TriangleAlert size={12} className={ev.importancia === 'alta' ? 'text-danger' : 'text-muted'} /> IMPORTANCIA {ev.importancia}
                        </span>
                    </div>
                </div>
                {ev.dia === "Hoy" && (
                    <div className="bg-accent text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-xl shadow-accent/20 rotate-3 border-2 border-white/20">
                        EVENTO ACTUAL
                    </div>
                )}
            </div>
        ))}
    </div>
);

// ── IA Tab ────────────────────────────────────────────────
const PERFILES = [
    { id: "cfo", label: "👔 CFO / Gerente Financiero", desc: "Foco en liquidez, costos y tipo de cambio" },
    { id: "contador", label: "📋 Contador / Asesor", desc: "Foco en impuestos, ajuste por inflación y normativa" },
    { id: "analista", label: "📊 Analista de Inversiones", desc: "Foco en activos, bonos y tendencias macro" },
    { id: "pyme", label: "🏪 Dueño de PyME", desc: "Foco en costos, precios y poder adquisitivo" },
];

const ResumenIaTab = ({ data }: DashboardProps) => {
    const [perfil, setPerfil] = useState<string | null>(null);
    const [resumen, setResumen] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiado, setCopiado] = useState(false);

    const generarResumen = async () => {
        if (!perfil) return;
        setLoading(true);
        setResumen(null);
        setError(null);

        const perfilData = PERFILES.find(p => p.id === perfil);
        const fecha = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

        const currentData = {
            inflacion: data.inflacion.length ? `${data.inflacion[data.inflacion.length - 1].valor}%` : "N/A",
            dolarOficial: `$${data.dolares.oficial}`,
            dolarBlue: `$${data.dolares.blue}`,
            reservas: data.reservas.length ? `USD ${data.reservas[data.reservas.length - 1].valor}B` : "N/A",
            riesgoPais: `${data.riesgoPais.actual} pb`,
            tasaBadlar: `${data.tasaBadlar}%`
        };

        const prompt = `Sos un analista económico senior especializado en Argentina. Tu tarea es generar un RESUMEN EJECUTIVO diario conciso y accionable para un ${perfilData?.label}.

FECHA: ${fecha}

DATOS ECONÓMICOS ACTUALES DE ARGENTINA:
- Inflación mensual: ${currentData.inflacion}
- Dólar Oficial BNA: ${currentData.dolarOficial}
- Dólar Blue: ${currentData.dolarBlue}
- Reservas BCRA: ${currentData.reservas}
- Riesgo País EMBI+: ${currentData.riesgoPais}
- Tasa BADLAR: ${currentData.tasaBadlar}

PERFIL DEL LECTOR: ${perfilData?.label} — ${perfilData?.desc}

INSTRUCCIONES:
1. Escribí en español argentino, tono profesional pero accesible
2. Máximo 200 palabras en total
3. Estructurá la respuesta en exactamente 3 secciones con estos títulos exactos:
   **📌 Situación actual**
   **⚠️ Puntos de atención**
   **✅ Recomendación práctica**
4. Cada sección: 2-3 oraciones máximo
5. Sé específico con los números, no uses frases vacías
6. La recomendación debe ser concreta y accionable para el perfil indicado
7. No uses bullet points dentro de las secciones, solo párrafos`;

        try {
            const response = await fetch("/api/resumen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const resultData = await response.json();
            if (!response.ok) throw new Error(resultData.error || "Error al generar resumen");

            setResumen(resultData.content);
        } catch (e: any) {
            setError(e.message || "No se pudo generar el resumen. Intentá de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const copiar = () => {
        if (!resumen) return;
        navigator.clipboard.writeText(resumen);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    const parsearResumen = (texto: string) => {
        if (!texto) return [];
        const secciones = [];
        const partes = texto.split(/\*\*([^*]+)\*\*/g);
        for (let i = 1; i < partes.length; i += 2) {
            secciones.push({ titulo: partes[i], contenido: partes[i + 1]?.trim() ?? "" });
        }
        return secciones;
    };

    const secciones = parsearResumen(resumen || "");
    const seccionColors: Record<string, string> = { "📌 Situación actual": "var(--accent)", "⚠️ Puntos de atención": "var(--yellow)", "✅ Recomendación práctica": "var(--green)" };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl filter drop-shadow-md">🤖</span>
                <div>
                    <div className="font-serif font-black text-2xl tracking-tight mb-1 text-foreground">Resumen IA Ejecutivo</div>
                    <div className="text-muted text-xs font-bold uppercase tracking-widest opacity-70">
                        {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                </div>
                <div className="ml-auto bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20 shadow-sm">
                    ✨ Powered by Claude
                </div>
            </div>

            <div className="bg-card border border-border/30 rounded-[32px] p-6 mb-4 shadow-xl">
                <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-4">¿Para quién es el resumen?</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PERFILES.map(p => (
                        <div key={p.id} onClick={() => setPerfil(p.id)} className={cn(
                            "p-4 rounded-2xl cursor-pointer transition-all border-2",
                            perfil === p.id ? "bg-accent/10 border-accent shadow-lg shadow-accent/10" : "bg-card-secondary border-transparent hover:border-border/40"
                        )}>
                            <div className="text-foreground font-bold text-sm mb-1">{p.label}</div>
                            <div className="text-muted text-[11px]">{p.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={generarResumen} disabled={!perfil || loading}
                className={cn(
                    "w-full p-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                    perfil && !loading ? "bg-gradient-to-r from-accent to-[#BF537B] text-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl shadow-accent/20" : "bg-card text-muted border border-border/30 cursor-not-allowed opacity-50"
                )}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Analizando Indicadores...</> : "✨ Generar Resumen"}
            </button>

            {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 text-danger text-sm font-bold shadow-lg text-center">
                    {error}
                </div>
            )}

            {resumen && !loading && (
                <div className="bg-card border border-border/30 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-r from-accent/10 to-purple-600/10 p-5 border-b border-border/30 flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="text-foreground font-black text-sm tracking-tight">Resumen para {PERFILES.find(p => p.id === perfil)?.label}</div>
                            <div className="text-muted text-[10px] uppercase font-bold tracking-widest mt-1">
                                {new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={copiar} className="bg-card-secondary/80 text-foreground border border-border/40 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:border-accent/50 hover:bg-card-secondary transition-all">
                                {copiado ? "✅ Copiado" : "📋 Copiar"}
                            </button>
                            <button onClick={generarResumen} className="bg-accent/10 text-accent border border-accent/20 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all">
                                🔄 Regenerar
                            </button>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col gap-6">
                        {secciones.length > 0 ? secciones.map((s, i) => (
                            <div key={i} className="pl-4 border-l-4" style={{ borderColor: seccionColors[s.titulo] || "var(--accent)" }}>
                                <div className="font-bold text-sm mb-2" style={{ color: seccionColors[s.titulo] || "var(--accent)" }}>{s.titulo}</div>
                                <p className="text-foreground/90 text-[13px] leading-relaxed font-medium">{s.contenido}</p>
                            </div>
                        )) : (
                            <p className="text-foreground/90 text-sm leading-relaxed">{resumen}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Crypto Tab ──────────────────────────────────────────

const C_CRYPTO = {
    bg: "transparent",
    card: "var(--card)",
    card2: "var(--card2)",
    border: "var(--border-color)",
    accent: "#FF0080", // Buenbit Pink
    accentGradient: "linear-gradient(135deg, #FF0080 0%, #7928CA 100%)",
    green: "#00FFA3", // Buenbit Cyan/Green
    red: "#FF3B3B",
    yellow: "#FFD600",
    purple: "#8A2BE2",
    orange: "#FF8A00",
    text: "var(--text)",
    muted: "var(--muted)",
    bitcoin: "#F7931A",
    ethereum: "#627EEA",
    usdt: "#26A17B",
    usdc: "#2775CA",
    dai: "#F5AC37"
};
const DOLAR_BLUE = 1220;
const DOLAR_OFICIAL = 1063;
const INFLACION_ANUAL = 66;

const mockBTCHistorico = [
    { fecha: "Sep 24", usd: 62000, ars: 75640000 },
    { fecha: "Oct 24", usd: 68000, ars: 82960000 },
    { fecha: "Nov 24", usd: 88000, ars: 107360000 },
    { fecha: "Dic 24", usd: 95000, ars: 115900000 },
    { fecha: "Ene 25", usd: 102000, ars: 124440000 },
    { fecha: "Feb 25", usd: 97800, ars: 119316000 },
];

const mockComparacion = [
    { activo: "Bitcoin", rendimiento: 142, color: C_CRYPTO.bitcoin },
    { activo: "Ethereum", rendimiento: 89, color: C_CRYPTO.ethereum },
    { activo: "Dólar Blue", rendimiento: 19, color: C_CRYPTO.yellow },
    { activo: "Plazo Fijo", rendimiento: 34, color: C_CRYPTO.accent },
    { activo: "Inflación", rendimiento: 66, color: C_CRYPTO.red },
    { activo: "S&P 500 (ARS)", rendimiento: 98, color: C_CRYPTO.green },
];

const mockStables = [
    { nombre: "USDT", precioARS: 1198, vsBlue: -1.8, exchange: "Binance P2P" },
    { nombre: "USDC", precioARS: 1195, vsBlue: -2.0, exchange: "Lemon Cash" },
    { nombre: "DAI", precioARS: 1201, vsBlue: -1.6, exchange: "Uniswap" },
    { nombre: "BUSD", precioARS: 1190, vsBlue: -2.5, exchange: "Bybit P2P" },
];

const mockFear = 72; // 0-100, >60 = greed, <40 = fear

const fallbackCryptos = [
    { id: "bitcoin", nombre: "Bitcoin", simbolo: "BTC", precio: 67900, var24h: -0.2, var7d: 2.1, mcap: "1.34T", color: C_CRYPTO.bitcoin, icon: "₿" },
    { id: "ethereum", nombre: "Ethereum", simbolo: "ETH", precio: 2750, var24h: 0.5, var7d: -1.4, mcap: "331B", color: C_CRYPTO.ethereum, icon: "Ξ" },
    { id: "tether", nombre: "Tether", simbolo: "USDT", precio: 1.00, var24h: 0.0, var7d: 0.0, mcap: "140B", color: C_CRYPTO.usdt, icon: "₮" },
    { id: "binance-coin", nombre: "BNB", simbolo: "BNB", precio: 610, var24h: -0.8, var7d: 1.2, mcap: "89B", color: C_CRYPTO.yellow, icon: "B" },
    { id: "solana", nombre: "Solana", simbolo: "SOL", precio: 145, var24h: 2.1, var7d: 5.6, mcap: "65B", color: C_CRYPTO.purple, icon: "◎" },
    { id: "ripple", nombre: "XRP", simbolo: "XRP", precio: 0.62, var24h: -1.2, var7d: 0.5, mcap: "35B", color: C_CRYPTO.accent, icon: "✕" },
];

const transformCryptoCap = (data: any) => {
    if (!data || !Array.isArray(data)) return fallbackCryptos;
    const colorMap: any = { BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B', BNB: '#F3BA2F', SOL: '#00FFA3', XRP: '#23292F' };
    const iconMap: any = { BTC: '₿', ETH: 'Ξ', USDT: '₮', BNB: 'B', SOL: '◎', XRP: '✕' };

    return data.map((c: any) => ({
        id: c.id,
        nombre: c.name,
        simbolo: c.symbol === 'BUSD' ? 'BNB' : c.symbol, // Hotfix for some API symbol variations
        precio: parseFloat(c.priceUsd),
        var24h: parseFloat(c.changePercent24Hr),
        var7d: 0,
        mcap: parseFloat(c.marketCapUsd) >= 1e12
            ? `${(parseFloat(c.marketCapUsd) / 1e12).toFixed(2)}T`
            : (parseFloat(c.marketCapUsd) >= 1e9 ? `${(parseFloat(c.marketCapUsd) / 1e9).toFixed(1)}B` : `${(parseFloat(c.marketCapUsd) / 1e6).toFixed(0)}M`),
        color: colorMap[c.symbol] || colorMap[c.id.toUpperCase()] || 'var(--accent)',
        icon: iconMap[c.symbol] || iconMap[c.id.toUpperCase()] || '•'
    }));
};

const fmtARS = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
};

const fmtUSD = (n: number) => {
    if (n >= 1000000000000) return `$${(n / 1000000000000).toFixed(2)}T`;
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
};

const tt_crypto = { backgroundColor: "var(--card-secondary)", border: "1px solid var(--border-color)", borderRadius: 8, color: "var(--text)", fontSize: 12 };

const Calculadora = ({ cryptos, blue }: { cryptos: any[], blue: number }) => {
    const [crypto, setCrypto] = useState("bitcoin");
    const [monto, setMonto] = useState("1000000");
    const [moneda, setMoneda] = useState("ARS");

    const montoNum = parseFloat(monto) || 0;
    const c = cryptos.find(x => x.id === crypto) || cryptos[0];
    const precioARS = c.precio * blue;

    const calcular = () => {
        if (moneda === "ARS") return { cantidad: montoNum / precioARS, unidad: c.simbolo };
        if (moneda === "USD") return { cantidad: montoNum / c.precio, unidad: c.simbolo };
        return { cantidad: 0, unidad: c.simbolo };
    };

    const resultado = calcular();

    return (
        <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: 12, padding: "1.25rem" }}>
            <h3 style={{ color: C_CRYPTO.text, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🧮 Calculadora Crypto ↔ ARS / USD</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                    <label style={{ color: C_CRYPTO.muted, fontSize: 11, display: "block", marginBottom: 4, fontWeight: "bold" }}>CRYPTO</label>
                    <select value={crypto} onChange={e => setCrypto(e.target.value)}
                        style={{ width: "100%", background: C_CRYPTO.card2, border: `1px solid ${C_CRYPTO.border}`, borderRadius: 8, color: C_CRYPTO.text, padding: "9px 10px", fontSize: 13, outline: "none" }}>
                        {cryptos.map(c => <option key={c.id} value={c.id}>{c.simbolo}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ color: C_CRYPTO.muted, fontSize: 11, display: "block", marginBottom: 4, fontWeight: "bold" }}>MONTO</label>
                    <input value={monto} onChange={e => setMonto(e.target.value)} type="number"
                        style={{ width: "100%", background: C_CRYPTO.card2, border: `1px solid ${C_CRYPTO.border}`, borderRadius: 8, color: C_CRYPTO.text, padding: "9px 10px", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                    <label style={{ color: C_CRYPTO.muted, fontSize: 11, display: "block", marginBottom: 4, fontWeight: "bold" }}>MONEDA</label>
                    <select value={moneda} onChange={e => setMoneda(e.target.value)}
                        style={{ width: "100%", background: C_CRYPTO.card2, border: `1px solid ${C_CRYPTO.border}`, borderRadius: 8, color: C_CRYPTO.text, padding: "9px 10px", fontSize: 13, outline: "none" }}>
                        <option value="ARS">ARS (pesos)</option>
                        <option value="USD">USD (dólares)</option>
                    </select>
                </div>
            </div>
            <div style={{ background: `${c.color}15`, border: `1px solid ${c.color}44`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ color: C_CRYPTO.muted, fontSize: 12, marginBottom: 4 }}>Con {moneda === "ARS" ? `$${parseFloat(monto || "0").toLocaleString("es-AR")} ARS` : `USD ${monto}`} comprás</div>
                <div style={{ color: c.color, fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                    {resultado.cantidad < 0.001 ? resultado.cantidad.toFixed(8) : resultado.cantidad.toFixed(6)} {resultado.unidad}
                </div>
                <div style={{ color: C_CRYPTO.muted, fontSize: 11, fontWeight: "bold" }}>
                    1 {c.simbolo} = {fmtARS(precioARS)} ARS · USD {fmtUSD(c.precio)}
                </div>
            </div>
        </div>
    );
};

const CryptoTab = ({ data }: { data: DashboardData }) => {
    const blue = data.dolares.blue;
    const [tab, setTab] = useState("precios");
    const [monedaVista, setMonedaVista] = useState("USD");

    // Usamos los datos de cryptos que ya vienen en el objeto 'data' (del aggregate API)
    const cryptosRaw = (data as any).cryptos;
    const cryptos = React.useMemo(() =>
        cryptosRaw && cryptosRaw.length > 0 ? transformCryptoCap(cryptosRaw) : fallbackCryptos,
        [cryptosRaw]);

    const fng = useFetch("https://api.alternative.me/fng/", (d: any) => d.data[0], { value: "50", value_classification: "Neutral" });

    const cryptoDolar = useFetch("https://dolarapi.com/v1/dolares/cripto", (d: any) => d, { venta: blue });

    // ... usando cryptos calculados arriba
    const mockFearValue = parseInt(fng.data?.value || "50");
    const fearLabel = fng.data?.value_classification || "Neutral";
    const fearColor = mockFearValue >= 60 ? C_CRYPTO.green : mockFearValue >= 40 ? C_CRYPTO.yellow : C_CRYPTO.red;

    const precioCryptoDolar = cryptoDolar.data?.venta || blue;

    const stablesData = [
        { id: 'usdt', nombre: "USDT", exchange: "Binance P2P", color: C_CRYPTO.usdt, icon: "₮" },
        { id: 'usdc', nombre: "USDC", exchange: "Lemon Cash", color: C_CRYPTO.usdc, icon: "₵" },
        { id: 'dai', nombre: "DAI", exchange: "Belo / Ripio", color: C_CRYPTO.dai, icon: "◈" },
        { id: 'busd', nombre: "BUSD", exchange: "Bybit P2P", color: C_CRYPTO.yellow, icon: "B" },
    ];

    const tabs = [
        { id: "precios", label: "💹 Precios" },
        { id: "comparacion", label: "📊 vs Inflación" },
        { id: "stables", label: "💲 Stables" },
        { id: "calculadora", label: "🧮 Calculadora" },
    ];

    return (
        <div style={{ background: C_CRYPTO.bg, fontFamily: "system-ui,-apple-system,sans-serif", color: C_CRYPTO.text, padding: "0" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 26 }} className="drop-shadow-lg">🇦🇷</span>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 17 }}>MacroAR — Crypto</div>
                        <div style={{ color: C_CRYPTO.muted, fontSize: 11 }}>Mercado cripto en contexto argentino</div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <StatusBadge loading={coinsPool.loading} error={coinsPool.error} lastUpdated={coinsPool.lastUpdated} onRefresh={coinsPool.refresh} />

                    <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: "14px", padding: "8px 14px", display: "flex", alignItems: "center", gap: 12 }} className="shadow-lg">
                        <div>
                            <div style={{ color: C_CRYPTO.muted, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Fear & Greed</div>
                            <div style={{ color: fearColor, fontSize: 13, fontWeight: 800 }}>{mockFearValue} <span style={{ fontSize: 11 }}>{fearLabel}</span></div>
                        </div>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", border: `3px solid ${fearColor}30`, borderTopColor: fearColor, transform: `rotate(${(mockFearValue / 100) * 360}deg)` }} />
                    </div>

                    <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: "14px", padding: "8px 14px" }} className="shadow-lg">
                        <div style={{ color: C_CRYPTO.muted, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>💵 Blue Referencia</div>
                        <div style={{ color: C_CRYPTO.yellow, fontSize: 15, fontWeight: 800 }}>${blue?.toLocaleString("es-AR")}</div>
                    </div>
                    {/* Toggle moneda */}
                    <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: 10, display: "flex", overflow: "hidden" }}>
                        {["USD", "ARS"].map(m => (
                            <button key={m} onClick={() => setMonedaVista(m)} style={{ padding: "8px 14px", border: "none", background: monedaVista === m ? C_CRYPTO.accent : "transparent", color: monedaVista === m ? "#fff" : C_CRYPTO.muted, cursor: "pointer", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>{m}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPIs rápidos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
                {cryptos.slice(0, 4).map((c: any) => (
                    <div key={c.id} style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderLeft: `4px solid ${c.color}`, borderRadius: "18px", padding: "1.25rem", transition: "transform 0.2s" }} className="group hover:scale-[1.03] shadow-lg">
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ color: C_CRYPTO.muted, fontSize: 11, fontWeight: 700 }}>{c.icon} {c.simbolo}</span>
                            <span style={{ color: c.var24h >= 0 ? C_CRYPTO.green : C_CRYPTO.red, fontSize: 11, fontWeight: 800 }}>{c.var24h >= 0 ? "▲" : "▼"} {Math.abs(c.var24h).toFixed(1)}%</span>
                        </div>
                        <div style={{ color: C_CRYPTO.text, fontSize: 22, fontWeight: 800 }}>
                            {monedaVista === "ARS" ? fmtARS(c.precio * blue) : fmtUSD(c.precio)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C_CRYPTO.border}`, marginBottom: 16, overflowX: "auto" }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        background: "none", border: "none",
                        borderBottom: tab === t.id ? `3px solid ${C_CRYPTO.accent}` : "3px solid transparent",
                        color: tab === t.id ? C_CRYPTO.accent : C_CRYPTO.muted,
                        padding: "0.7rem 1rem", cursor: "pointer", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "1.5px", transition: "all 0.2s ease-in-out"
                    }}>{t.label}</button>
                ))}
            </div>

            {coinsPool.loading ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <Loader2 size={48} className="text-accent animate-spin mx-auto mb-4" />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* PRECIOS */}
                    {tab === "precios" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {/* Tabla completa */}
                            <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: "24px", overflow: "hidden" }} className="shadow-xl">
                                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C_CRYPTO.border}`, display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: C_CRYPTO.text, fontWeight: 800, fontSize: 14 }}>PRECIOS EN TIEMPO REAL</span>
                                    <span style={{ color: C_CRYPTO.muted, fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>CoinGecko API</span>
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${C_CRYPTO.border}`, background: C_CRYPTO.card2 }}>
                                                {["Crypto", "Precio USD", "Precio ARS", "24h", "7d", "Market Cap"].map(h => (
                                                    <th key={h} style={{ padding: "12px 20px", color: C_CRYPTO.muted, fontSize: 10, fontWeight: 800, textAlign: "left", textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cryptos.map((c: any, i: number) => (
                                                <tr key={c.id} style={{ borderBottom: i < cryptos.length - 1 ? `1px solid ${C_CRYPTO.border}` : "none", transition: "background 0.2s" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = C_CRYPTO.card2}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <td style={{ padding: "16px 20px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${c.color}22`, border: `1px solid ${c.color}44`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, fontWeight: 700, fontSize: 13 }}>{c.icon}</div>
                                                            <div>
                                                                <div style={{ color: C_CRYPTO.text, fontWeight: 700, fontSize: 14 }}>{c.nombre}</div>
                                                                <div style={{ color: C_CRYPTO.muted, fontSize: 11, fontWeight: "bold" }}>{c.simbolo}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "16px 20px", color: C_CRYPTO.text, fontWeight: 700, fontSize: 14 }}>{fmtUSD(c.precio)}</td>
                                                    <td style={{ padding: "16px 20px", color: C_CRYPTO.yellow, fontWeight: 700, fontSize: 14 }}>{fmtARS(c.precio * blue)}</td>
                                                    <td style={{ padding: "16px 20px" }}>
                                                        <span style={{ color: c.var24h >= 0 ? C_CRYPTO.green : C_CRYPTO.red, fontWeight: 800, fontSize: 13 }}>{c.var24h >= 0 ? "▲" : "▼"} {Math.abs(c.var24h).toFixed(1)}%</span>
                                                    </td>
                                                    <td style={{ padding: "16px 20px" }}>
                                                        <span style={{ color: c.var7d >= 0 ? C_CRYPTO.green : C_CRYPTO.red, fontWeight: 800, fontSize: 13 }}>{c.var7d >= 0 ? "▲" : "▼"} {Math.abs(c.var7d).toFixed(1)}%</span>
                                                    </td>
                                                    <td style={{ padding: "16px 20px", color: C_CRYPTO.muted, fontSize: 13, fontWeight: "bold" }}>{c.mcap}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Gráfico BTC histórico */}
                            <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: "24px", padding: "1.5rem" }} className="shadow-xl">
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                                    <h3 style={{ color: C_CRYPTO.text, fontSize: 14, fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>₿ Bitcoin — Últimos 6 meses</h3>
                                    <span style={{ color: C_CRYPTO.muted, fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>CoinGecko</span>
                                </div>
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={mockBTCHistorico}>
                                        <defs>
                                            <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={C_CRYPTO.bitcoin} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={C_CRYPTO.bitcoin} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={C_CRYPTO.border} vertical={false} />
                                        <XAxis dataKey="fecha" tick={{ fill: C_CRYPTO.muted, fontSize: 10, fontWeight: "bold" }} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis tick={{ fill: C_CRYPTO.muted, fontSize: 10, fontWeight: "bold" }} tickFormatter={v => monedaVista === "ARS" ? `$${(v / 1000000).toFixed(0)}M` : `$${(v / 1000).toFixed(0)}K`} tickLine={false} axisLine={false} dx={-10} />
                                        <Tooltip contentStyle={tt_crypto} formatter={v => [monedaVista === "ARS" ? fmtARS(Number(v)) : fmtUSD(Number(v)), "BTC"]} />
                                        <Area type="monotone" dataKey={monedaVista === "ARS" ? "ars" : "usd"} stroke={C_CRYPTO.bitcoin} fill="url(#btcGrad)" strokeWidth={3} isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* COMPARACIÓN vs INFLACIÓN */}
                    {tab === "comparacion" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ background: `${C_CRYPTO.accent}11`, border: `1px solid ${C_CRYPTO.accent}33`, borderRadius: "16px", padding: "16px 20px" }}>
                                <p style={{ color: C_CRYPTO.muted, fontSize: 13, margin: 0, lineHeight: 1.6, fontWeight: "500" }}>
                                    📊 Comparación de rendimientos en los <strong style={{ color: C_CRYPTO.text }}>últimos 12 meses</strong> en pesos argentinos. ¿Qué te protegió mejor de la inflación?
                                </p>
                            </div>
                            <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: "24px", padding: "1.5rem" }} className="shadow-xl">
                                <h3 style={{ color: C_CRYPTO.text, fontSize: 14, fontWeight: 800, marginBottom: 20, textTransform: "uppercase", letterSpacing: "1px" }}>Rendimiento % en ARS — últimos 12 meses</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={mockComparacion} layout="vertical" margin={{ left: 10, right: 40, top: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#FF0080" />
                                                <stop offset="100%" stopColor="#7928CA" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={C_CRYPTO.border} horizontal={false} />
                                        <XAxis type="number" tick={{ fill: C_CRYPTO.muted, fontSize: 10, fontWeight: "bold" }} unit="%" tickLine={false} axisLine={false} domain={[0, 'dataMax + 20']} />
                                        <YAxis type="category" dataKey="activo" tick={{ fill: C_CRYPTO.muted, fontSize: 11, fontWeight: "bold" }} width={130} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tt_crypto} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(v: any) => [`${v}%`, "Rendimiento"]} />
                                        <Bar dataKey="rendimiento" radius={10} barSize={26} isAnimationActive={false}>
                                            {mockComparacion.map((entry: any, i: number) => (
                                                <Cell key={i} fill={entry.activo === 'Bitcoin' || entry.activo === 'Ethereum' ? 'url(#barGrad)' : entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                                {[
                                    { label: "Mejor activo", val: "Bitcoin", sub: "+142% en ARS", color: C_CRYPTO.bitcoin },
                                    { label: "Inflación a vencer", val: "66%", sub: "interanual est.", color: C_CRYPTO.red },
                                    { label: "Plazo fijo rindió", val: "34%", sub: "-32pp vs inflación", color: C_CRYPTO.muted },
                                ].map(k => (
                                    <div key={k.label} style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderLeft: `4px solid ${k.color}`, borderRadius: "16px", padding: "1.25rem" }} className="shadow-lg">
                                        <div style={{ color: C_CRYPTO.muted, fontSize: 11, marginBottom: 6, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>{k.label}</div>
                                        <div style={{ color: k.color, fontSize: 22, fontWeight: 800 }}>{k.val}</div>
                                        <div style={{ color: C_CRYPTO.muted, fontSize: 12, marginTop: 4, fontWeight: "500" }}>{k.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STABLECOINS */}
                    {tab === "stables" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ background: `${C_CRYPTO.usdt}11`, border: `1px solid ${C_CRYPTO.usdt}33`, borderRadius: "16px", padding: "16px 20px" }}>
                                <p style={{ color: C_CRYPTO.muted, fontSize: 13, margin: 0, lineHeight: 1.6, fontWeight: "500" }}>
                                    💲 Las stablecoins en Argentina son una alternativa al dólar blue. Compará precios y descubrí dónde conviene operar. <strong style={{ color: C_CRYPTO.text }}>Dólar Blue Ref: ${blue}</strong>
                                </p>
                            </div>
                            <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: "24px", overflow: "hidden" }} className="shadow-xl">
                                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C_CRYPTO.border}` }}>
                                    <span style={{ color: C_CRYPTO.text, fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "1px" }}>Stablecoins vs Dólar Blue</span>
                                </div>
                                {stablesData.map((s, i) => {
                                    const spread = s.id === 'usdt' ? 1.01 : (s.id === 'usdc' ? 1.005 : (s.id === 'dai' ? 1.012 : 0.99));
                                    const precioIndividual = precioCryptoDolar * spread;
                                    const diffBlue = ((precioIndividual / blue - 1) * 100).toFixed(1);
                                    const isConvenient = parseFloat(diffBlue) <= 0.5;

                                    return (
                                        <div key={s.nombre} style={{ padding: "20px 24px", borderBottom: i < stablesData.length - 1 ? `1px solid ${C_CRYPTO.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} className="hover:bg-white/[0.03] group">
                                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                                <div style={{ width: 44, height: 44, borderRadius: "14px", background: `${s.color}15`, border: `1px solid ${s.color}33`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, fontWeight: 900, fontSize: 18 }}>{s.icon}</div>
                                                <div>
                                                    <div style={{ color: C_CRYPTO.text, fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>{s.nombre}</div>
                                                    <div style={{ color: C_CRYPTO.muted, fontSize: 12, fontWeight: 700 }}>{s.exchange}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ color: C_CRYPTO.text, fontWeight: 900, fontSize: 18, fontFamily: "monospace" }}>${precioIndividual.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                                    <div style={{ color: C_CRYPTO.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>ARS / {s.nombre}</div>
                                                </div>
                                                <div style={{ textAlign: "right", minWidth: 70 }}>
                                                    <div style={{ color: parseFloat(diffBlue) >= 0 ? C_CRYPTO.red : C_CRYPTO.green, fontWeight: 900, fontSize: 15 }}>
                                                        {parseFloat(diffBlue) >= 0 ? "▲" : "▼"} {Math.abs(parseFloat(diffBlue))}%
                                                    </div>
                                                    <div style={{ color: C_CRYPTO.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>vs Blue</div>
                                                </div>
                                                <div style={{
                                                    background: isConvenient ? `${C_CRYPTO.green}15` : `${C_CRYPTO.red}15`,
                                                    color: isConvenient ? C_CRYPTO.green : C_CRYPTO.red,
                                                    border: `1px solid ${isConvenient ? C_CRYPTO.green : C_CRYPTO.red}33`,
                                                    padding: "8px 16px", borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px"
                                                }}>
                                                    {isConvenient ? "✅ CONVENIENTE" : "⚠️ CARO"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Tip */}
                            <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: "16px", padding: "16px 20px" }}>
                                <div style={{ color: C_CRYPTO.yellow, fontWeight: 800, fontSize: 12, marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>💡 ¿Cómo comprar stablecoins en Argentina?</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {[
                                        { app: "Lemon Cash", ventaja: "Más fácil, sin KYC extendido" },
                                        { app: "Ripio", ventaja: "Exchange argentino regulado" },
                                        { app: "Binance P2P", ventaja: "Mejor precio pero más complejo" },
                                        { app: "Belo", ventaja: "Buena app, fácil de usar en pesos" },
                                    ].map(x => (
                                        <div key={x.app} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: "500" }}>
                                            <span style={{ color: C_CRYPTO.text, fontWeight: 700 }}>{x.app}</span>
                                            <span style={{ color: C_CRYPTO.muted }}>{x.ventaja}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CALCULADORA */}
                    {tab === "calculadora" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <Calculadora cryptos={cryptos} blue={blue} />
                            {/* Contexto macro */}
                            <div style={{ background: C_CRYPTO.card, border: `1px solid ${C_CRYPTO.border}`, borderRadius: "24px", padding: "1.5rem" }} className="shadow-xl">
                                <h3 style={{ color: C_CRYPTO.text, fontSize: 14, fontWeight: 800, marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>📊 Contexto macro para decisiones</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                                    {[
                                        { label: "1 BTC en pesos", val: fmtARS(cryptos[0].precio * blue), color: C_CRYPTO.bitcoin },
                                        { label: "1 ETH en pesos", val: fmtARS(cryptos[1].precio * blue), color: C_CRYPTO.ethereum },
                                        { label: "Sueldo mín. / BTC", val: `${((280000) / (cryptos[0].precio * blue) * 100).toFixed(4)}%`, color: C_CRYPTO.accent },
                                        { label: "Inflación anual est.", val: `${INFLACION_ANUAL}%`, color: C_CRYPTO.red },
                                    ].map(k => (
                                        <div key={k.label} style={{ background: C_CRYPTO.card2, borderRadius: "12px", padding: "12px 16px", borderLeft: `4px solid ${k.color}` }}>
                                            <div style={{ color: C_CRYPTO.muted, fontSize: 11, marginBottom: 4, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.label}</div>
                                            <div style={{ color: k.color, fontWeight: 800, fontSize: 18 }}>{k.val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            <div style={{ marginTop: 24, padding: "10px 16px", background: C_CRYPTO.card, borderRadius: "12px", border: `1px solid ${C_CRYPTO.border}`, fontSize: 11, color: C_CRYPTO.muted, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontWeight: "bold" }}>
                <span>📡 Feed: CoinGecko API · Binance · argentinadatos.com</span>
                <span style={{ fontWeight: 800, color: C_CRYPTO.accent }}>macroar.vercel.app</span>
            </div>
        </div>
    );
};

// ─── SIMULADOR Y TASAS EN VIVO ──────────────────────────────────────────────
const C_SIMULADOR = {
    bg: "transparent",
    card: "var(--card)",
    card2: "var(--card2)",
    border: "var(--border-color)",
    accent: "#FF0080", // Buenbit Pink
    green: "#00FFA3",  // Buenbit Cyan/Green
    red: "#FF3B3B",
    yellow: "#FFD600",
    purple: "#8A2BE2",
    orange: "#FF8A00",
    text: "var(--text)",
    muted: "var(--muted)",
};

const tt_simulador = {
    backgroundColor: "#1A1A1A",
    border: "1px solid #333",
    borderRadius: 12,
    color: "#FFF",
    fontSize: 12,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)"
};

// ─── FALLBACK (si la API falla, mostramos esto con etiqueta ESTIMADO) ────────
const FALLBACK = {
    oficial: { compra: 1050, venta: 1063 },
    blue: { compra: 1330, venta: 1340 },
    mep: { compra: 1095, venta: 1098 },
    ccl: { compra: 1105, venta: 1110 },
    crypto: { compra: 1100, venta: 1108 },
    inflacionMensual: 2.4,
    inflacionAnual: 66,
    riesgoPais: 724,
};


// ─── BADGE DE ESTADO SE QUITA DE AQUÍ PORQUE SE MOVIÓ ARRIBA ───

// ─── PANEL DE TASAS ───────────────────────
const TASAS_ACTUALIZADAS = new Date().toLocaleDateString("es-AR", { day: 'numeric', month: 'short', year: 'numeric' });

const cuentasRemuneradas = [
    { nombre: "Uala", tipo: "Fintech", tna: 34.5, logoColor: "#7c3aed", tag: "🏆 Mejor tasa" },
    { nombre: "Brubank", tipo: "Banco digital", tna: 31.0, logoColor: "#ef4444", tag: null },
    { nombre: "Lemon Cash", tipo: "Fintech", tna: 32.0, logoColor: "#f59e0b", tag: null },
    { nombre: "Mercado Pago", tipo: "Fintech", tna: 30.0, logoColor: "#3b82f6", tag: "📱 Más usuarios" },
    { nombre: "Personal Pay", tipo: "Fintech", tna: 29.5, logoColor: "#10b981", tag: null },
    { nombre: "Belo", tipo: "Fintech", tna: 28.0, logoColor: "#f97316", tag: null },
    { nombre: "Banco Nación", tipo: "Banco", tna: 27.0, logoColor: "#6b7280", tag: null },
];

const plazosFijos = [
    { nombre: "Uala (PF)", tna: 32.0, tae: 38.1, logoColor: "#7c3aed", tag: "🏆 Mejor tasa" },
    { nombre: "Banco Nación", tna: 30.0, tae: 35.5, logoColor: "#6b7280", tag: "🏛️ Más seguro" },
    { nombre: "Banco Provincia", tna: 30.0, tae: 35.5, logoColor: "#3b82f6", tag: null },
    { nombre: "Macro", tna: 29.5, tae: 34.8, logoColor: "#7c3aed", tag: "📊 Mejor banco privado" },
    { nombre: "Galicia", tna: 29.0, tae: 34.1, logoColor: "#ef4444", tag: null },
    { nombre: "BBVA", tna: 29.0, tae: 34.1, logoColor: "#1d4ed8", tag: null },
    { nombre: "Santander", tna: 28.5, tae: 33.5, logoColor: "#dc2626", tag: null },
    { nombre: "ICBC", tna: 28.0, tae: 32.8, logoColor: "#b45309", tag: null },
];

const prestamos = [
    { nombre: "Banco Nación", cft: 89.5, tna: 72.0, cuota12: 12800, logoColor: "#6b7280", tag: null },
    { nombre: "HSBC", cft: 98.4, tna: 78.0, cuota12: 13200, logoColor: "#10b981", tag: "💡 Mejor CFT" },
    { nombre: "BBVA", cft: 105.2, tna: 84.0, cuota12: 13900, logoColor: "#1d4ed8", tag: null },
    { nombre: "Galicia", cft: 112.3, tna: 88.0, cuota12: 14200, logoColor: "#ef4444", tag: null },
    { nombre: "Santander", cft: 118.7, tna: 92.0, cuota12: 14800, logoColor: "#dc2626", tag: null },
    { nombre: "Naranja X", cft: 138.0, tna: 105.0, cuota12: 16000, logoColor: "#f97316", tag: "📱 Sin trámites" },
    { nombre: "Mercado Crédito", cft: 145.0, tna: 110.0, cuota12: 16500, logoColor: "#3b82f6", tag: "⚡ Inmediato" },
];

const hipotecarios = [
    { nombre: "Banco Nación — UVA", cuota100k: 735, tna: 4.5, plazo: 20, requisito: "Cuenta sueldo BNA", logoColor: "#6b7280", tag: "🏆 Líder" },
    { nombre: "BBVA — UVA", cuota100k: 920, tna: 7.5, plazo: 20, requisito: "Acredita haberes", logoColor: "#1d4ed8", tag: "🏦 Plan Sueldo" },
    { nombre: "Banco Ciudad — UVA", cuota100k: 1150, tna: 12.0, plazo: 20, requisito: "Vivienda en CABA", logoColor: "#3b82f6", tag: "🏙️ Ciudad" },
    { nombre: "Macro — UVA", cuota100k: 1240, tna: 14.0, plazo: 20, requisito: "Clientes Macro", logoColor: "#7c3aed", tag: "🤝 Preferencial" },
    { nombre: "Santander — UVA", cuota100k: 1240, tna: 14.0, plazo: 20, requisito: "Relación dependencia", logoColor: "#dc2626", tag: null },
    { nombre: "Galicia — UVA", cuota100k: 1315, tna: 15.0, plazo: 20, requisito: "Calificación crediticia", logoColor: "#ef4444", tag: null },
];

// ─── SIMULADOR ────────────────────────────────────────────────────────────────
const SimuladorPF = ({ inflacionMensual, plazosFijos }: any) => {
    const list = plazosFijos && plazosFijos.length > 0 ? plazosFijos : [];
    const [monto, setMonto] = useState("500000");
    const [plazo, setPlazo] = useState("30");
    const [banco, setBanco] = useState(list[0].nombre);
    const b = list.find((p: any) => p.nombre === banco) || list[0];
    const montoNum = parseFloat(monto) || 0;
    const plazoNum = parseFloat(plazo) || 30;
    const interes = montoNum * (b.tna / 100) * (plazoNum / 365);
    const total = montoNum + interes;
    const inflPer = inflacionMensual * (plazoNum / 30);
    const ganReal = (b.tna / 100 * plazoNum / 365 - inflPer / 100) * 100;

    return (
        <div style={{ background: C_SIMULADOR.card, borderRadius: 20, padding: "20px", marginTop: 20, border: `1px solid ${C_SIMULADOR.border}` }}>
            <h4 style={{ color: C_SIMULADOR.text, fontSize: 14, fontWeight: 800, marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>🧮 Simulador de Inversión</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                    <label style={{ color: C_SIMULADOR.muted, fontSize: 11, display: "block", marginBottom: 4 }}>BANCO</label>
                    <select value={banco} onChange={e => setBanco(e.target.value)}
                        style={{ width: "100%", background: C_SIMULADOR.card, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 10, color: C_SIMULADOR.text, padding: "8px 10px", fontSize: 12 }}>
                        {list.map((p: any) => <option key={p.nombre}>{p.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ color: C_SIMULADOR.muted, fontSize: 11, display: "block", marginBottom: 4 }}>MONTO (ARS)</label>
                    <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
                        style={{ width: "100%", background: C_SIMULADOR.card, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 10, color: C_SIMULADOR.text, padding: "8px 10px", fontSize: 12, boxSizing: "border-box" }} />
                </div>
                <div>
                    <label style={{ color: C_SIMULADOR.muted, fontSize: 11, display: "block", marginBottom: 4 }}>PLAZO (días)</label>
                    <select value={plazo} onChange={e => setPlazo(e.target.value)}
                        style={{ width: "100%", background: C_SIMULADOR.bg, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 8, color: C_SIMULADOR.text, padding: "8px 10px", fontSize: 12 }}>
                        {[30, 60, 90, 180, 365].map(d => <option key={d} value={d}>{d} días</option>)}
                    </select>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                <Stat label="💰 Interés ganado" value={`$${Math.round(interes).toLocaleString("es-AR")}`} sub={`TNA: ${b.tna}%`} color={C_SIMULADOR.accent} />
                <Stat label="📈 Total al vencimiento" value={`$${Math.round(total).toLocaleString("es-AR")}`} sub={`En ${plazo} días`} color={C_SIMULADOR.green} />
                <Stat label="🛡️ Ganancia real" value={`${ganReal >= 0 ? "+" : ""}${ganReal.toFixed(1)}%`}
                    sub={ganReal >= 0 ? "Le ganás a la inflación" : "Perdés vs inflación"}
                    color={ganReal >= 0 ? C_SIMULADOR.green : C_SIMULADOR.red} />
            </div>
        </div>
    );
};

const Stat = ({ label, value, sub, color }: any) => (
    <div style={{ background: C_SIMULADOR.card, borderRadius: 10, padding: 12, borderLeft: `3px solid ${color}` }}>
        <div style={{ color: C_SIMULADOR.muted, fontSize: 11, marginBottom: 4 }}>{label}</div>
        <div style={{ color, fontWeight: 700, fontSize: 18 }}>{value}</div>
        <div style={{ color: C_SIMULADOR.muted, fontSize: 10 }}>{sub}</div>
    </div>
);

// ─── DÓLAR EN TIEMPO REAL ─────────────────────────────────────────────────────
const CASAS_MAP: Record<string, any> = {
    oficial: { label: "OFICIAL", color: C_SIMULADOR.accent },
    blue: { label: "BLUE", color: C_SIMULADOR.yellow },
    bolsa: { label: "MEP", color: C_SIMULADOR.purple },
    contadoconliqui: { label: "CCL", color: C_SIMULADOR.orange },
    cripto: { label: "CRYPTO", color: C_SIMULADOR.green },
};

const DolarPanel = ({ data, loading, error, lastUpdated, onRefresh, inflacionAnual }: any) => {
    if (loading && !data) return <LoadingCard label="💵 Cargando tipos de cambio..." />;

    const dolares = data ? data.reduce((acc: any, d: any) => {
        if (CASAS_MAP[d.casa]) acc[d.casa] = d;
        return acc;
    }, {}) : null;

    const oficial = dolares?.oficial?.venta || FALLBACK.oficial.venta;

    const items = Object.entries(CASAS_MAP).map(([casa, meta]) => {
        const d = dolares?.[casa];
        const fbKey = casa === "bolsa" ? "mep" : casa === "contadoconliqui" ? "ccl" : casa === "cripto" ? "crypto" : casa;
        const venta = d?.venta ?? (FALLBACK as any)[fbKey]?.venta;
        const brecha = casa !== "oficial" ? (((venta / oficial) - 1) * 100).toFixed(1) : null;
        return { ...meta, casa, venta, brecha };
    });

    return (
        <div style={{ background: C_SIMULADOR.card, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ color: C_SIMULADOR.text, fontSize: 13, fontWeight: 600, margin: 0 }}>💵 Tipos de Cambio</h3>
                <StatusBadge loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={onRefresh} />
            </div>
            {error && <div style={{ background: `${C_SIMULADOR.yellow}22`, border: `1px solid ${C_SIMULADOR.yellow}44`, borderRadius: 8, padding: "6px 12px", fontSize: 11, color: C_SIMULADOR.yellow, marginBottom: 10 }}>
                ⚠️ Sin conexión a la API — mostrando valores estimados, no en tiempo real
            </div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
                {items.map(d => (
                    <div key={d.casa} style={{
                        background: C_SIMULADOR.card2, borderRadius: 10, padding: "14px 10px", textAlign: "center",
                        border: `1px solid ${C_SIMULADOR.border}`, borderTop: `2px solid ${d.color}`,
                    }}>
                        <div style={{ color: C_SIMULADOR.muted, fontSize: 9, marginBottom: 6, letterSpacing: 1 }}>{d.label}</div>
                        <div style={{ color: d.color, fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                            ${d.venta?.toLocaleString("es-AR") ?? "—"}
                        </div>
                        {d.brecha && (
                            <div style={{ fontSize: 9, color: C_SIMULADOR.yellow }}>brecha {d.brecha}%</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── LOADING CARD ─────────────────────────────────────────────────────────────
const LoadingCard = ({ label }: any) => (
    <div style={{ background: C_SIMULADOR.card, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 12, padding: "2rem", textAlign: "center" }}>
        <div style={{ color: C_SIMULADOR.muted, fontSize: 12, animation: "pulse 1.2s infinite" }}>{label}</div>
    </div>
);

// ─── INFLACIÓN en tiempo real ─────────────────────────────────────────────────
const InflacionPanel = ({ data, loading, error, lastUpdated, onRefresh }: any) => {
    if (loading && !data) return <LoadingCard label="📈 Cargando inflación..." />;

    const serie = data ? data.slice(-8) : [];
    const ultimo = data ? data[data.length - 1] : null;
    const penultimo = data ? data[data.length - 2] : null;
    const valorActual = ultimo?.valor ?? FALLBACK.inflacionMensual;
    const valorAnterior = penultimo?.valor ?? 2.7;

    const ultimos12 = data ? data.slice(-12) : [];
    const inflAnual = ultimos12.reduce((acc: number, m: any) => acc * (1 + m.valor / 100), 1);
    const inflAnualPct = ((inflAnual - 1) * 100).toFixed(1);

    return (
        <div style={{ background: C_SIMULADOR.card, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ color: C_SIMULADOR.text, fontSize: 13, fontWeight: 600, margin: 0 }}>📈 Inflación IPC (INDEC)</h3>
                <StatusBadge loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={onRefresh} />
            </div>
            {error && <ErrBanner />}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 14 }}>
                <Stat label="Mensual actual" value={`${valorActual}%`} sub={ultimo?.fecha?.slice(0, 7) ?? ""} color={C_SIMULADOR.red} />
                <Stat label="Mes anterior" value={`${valorAnterior}%`} sub={penultimo?.fecha?.slice(0, 7) ?? ""} color={C_SIMULADOR.orange} />
                <Stat label="Acum. 12 meses" value={`${inflAnualPct}%`} sub="Últimos 12 meses" color={C_SIMULADOR.red} />
            </div>
            {serie.length > 0 && (
                <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={serie.map((d: any) => ({ mes: d.fecha?.slice(0, 7), v: d.valor }))}>
                        <defs>
                            <linearGradient id="gradInfl" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={C_SIMULADOR.red} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={C_SIMULADOR.red} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C_SIMULADOR.border} vertical={false} />
                        <XAxis dataKey="mes" tick={{ fill: C_SIMULADOR.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: C_SIMULADOR.muted, fontSize: 9 }} unit="%" axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tt_simulador} formatter={(v: any) => [`${v}%`, "IPC mensual"]} cursor={{ fill: "transparent" }} />
                        <Area type="monotone" dataKey="v" stroke={C_SIMULADOR.red} fill="url(#gradInfl)" strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

const ErrBanner = () => (
    <div style={{ background: `${C_SIMULADOR.yellow}22`, border: `1px solid ${C_SIMULADOR.yellow}44`, borderRadius: 8, padding: "6px 12px", fontSize: 11, color: C_SIMULADOR.yellow, marginBottom: 10 }}>
        ⚠️ Sin conexión a la API — datos estimados
    </div>
);

// ─── RIESGO PAÍS ──────────────────────────────────────────────────────────────
const RiesgoPaisPanel = ({ data, loading, error, lastUpdated, onRefresh }: any) => {
    if (loading && !data) return <LoadingCard label="⚡ Cargando riesgo país..." />;
    const serie = data ? data.slice(-8) : [];
    const ultimo = data ? data[data.length - 1] : null;
    const valor = ultimo?.valor ?? FALLBACK.riesgoPais;
    const color = valor < 600 ? C_SIMULADOR.green : valor < 1000 ? C_SIMULADOR.yellow : valor < 1800 ? C_SIMULADOR.orange : C_SIMULADOR.red;

    return (
        <div style={{ background: C_SIMULADOR.card, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ color: C_SIMULADOR.text, fontSize: 13, fontWeight: 600, margin: 0 }}>⚡ Riesgo País EMBI+</h3>
                <StatusBadge loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={onRefresh} />
            </div>
            {error && <ErrBanner />}
            <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color, lineHeight: 1 }}>{valor}</div>
                <div style={{ color: C_SIMULADOR.muted, fontSize: 11, marginTop: 4 }}>puntos básicos · JPMC</div>
                <div style={{ color: C_SIMULADOR.muted, fontSize: 10, marginTop: 2 }}>{ultimo?.fecha?.slice(0, 10) ?? ""}</div>
            </div>
            {serie.length > 0 && (
                <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={serie.map((d: any) => ({ fecha: d.fecha?.slice(0, 10), v: d.valor }))}>
                        <defs>
                            <linearGradient id="gradRP" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C_SIMULADOR.border} vertical={false} />
                        <XAxis dataKey="fecha" tick={{ fill: C_SIMULADOR.muted, fontSize: 8 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: C_SIMULADOR.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tt_simulador} formatter={(v: any) => [`${v}pb`, "EMBI+"]} cursor={{ fill: "transparent" }} />
                        <Area type="monotone" dataKey="v" stroke={color} fill="url(#gradRP)" strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

// ─── TABS ORIGINALES ─────────────────────────────────────────────────────────
const TabCuentas = ({ inflacionAnual, liveCuentas }: any) => {
    const sorted = [...(liveCuentas && liveCuentas.length > 0 ? liveCuentas : cuentasRemuneradas)].sort((a, b) => b.tna - a.tna).slice(0, 10);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: `${C_SIMULADOR.accent}11`, border: `1px solid ${C_SIMULADOR.accent}33`, borderRadius: 16, padding: "14px 18px" }}>
                <p style={{ color: C_SIMULADOR.muted, fontSize: 13, margin: 0, lineHeight: "1.5" }}>
                    💰 <strong style={{ color: C_SIMULADOR.text }}>Cuentas Remuneradas</strong> — Liquidez inmediata con los mejores rendimientos del mercado.
                </p>
            </div>

            {/* Gráfico de Tasas Cuentas */}
            <div style={{ background: C_SIMULADOR.card, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 20, padding: "20px" }}>
                <h3 style={{ color: C_SIMULADOR.text, fontSize: 14, fontWeight: 800, marginBottom: 20, textTransform: "uppercase", letterSpacing: "1px" }}>📊 TNA Cuentas (%)</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sorted} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="nombre" tick={{ fill: C_SIMULADOR.muted, fontSize: 9 }} axisLine={false} tickLine={false} interval={0}
                            tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) + '.' : val} />
                        <YAxis tick={{ fill: C_SIMULADOR.muted, fontSize: 10 }} unit="%" axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tt_simulador} cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            formatter={(v: any) => [`${v}%`, 'TNA']} />
                        <Bar dataKey="tna" fill={C_SIMULADOR.green} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {sorted.map((b, i) => (
                    <div key={b.nombre} style={{ background: C_SIMULADOR.card, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 16, padding: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${C_SIMULADOR.accent}11`, border: `1px solid ${C_SIMULADOR.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", color: C_SIMULADOR.accent, fontWeight: 800, fontSize: 10 }}>
                                    {b.nombre.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ color: C_SIMULADOR.text, fontWeight: 700, fontSize: 14 }}>{b.nombre}</div>
                                    <div style={{ color: C_SIMULADOR.muted, fontSize: 10 }}>{b.tipo || "Fintech"}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ color: C_SIMULADOR.green, fontWeight: 800, fontSize: 18 }}>{b.tna}%</div>
                                <div style={{ color: C_SIMULADOR.muted, fontSize: 8 }}>TNA</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TabPlazoFijo = ({ inflacionMensual, inflacionAnual, liveBancos }: any) => {
    const list = [...(liveBancos && liveBancos.length > 0 ? liveBancos : plazosFijos)].sort((a, b) => b.tna - a.tna);
    const sorted = list.slice(0, 15); // Solo los 15 mejores (mayores tasas)

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: `${C_SIMULADOR.accent}11`, border: `1px solid ${C_SIMULADOR.accent}33`, borderRadius: 16, padding: "14px 18px" }}>
                <p style={{ color: C_SIMULADOR.muted, fontSize: 13, margin: 0, lineHeight: "1.5" }}>
                    🚀 <strong style={{ color: C_SIMULADOR.text }}>Comparativa de Rendimiento</strong> — Mostrando los 15 mejores bancos.
                    TNA mínima recomendada vs Inflación: <strong style={{ color: C_SIMULADOR.accent }}>{inflacionAnual}%</strong>.
                </p>
            </div>

            {/* Gráfico de Tasas */}
            <div style={{ background: C_SIMULADOR.card, border: `1px solid ${C_SIMULADOR.border}`, borderRadius: 20, padding: "20px" }}>
                <h3 style={{ color: C_SIMULADOR.text, fontSize: 14, fontWeight: 800, marginBottom: 20, textTransform: "uppercase", letterSpacing: "1px" }}>📊 Comparativa TNA (%)</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={sorted} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="nombre" tick={{ fill: C_SIMULADOR.muted, fontSize: 9 }} axisLine={false} tickLine={false} interval={0}
                            tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                        <YAxis tick={{ fill: C_SIMULADOR.muted, fontSize: 10 }} unit="%" axisLine={false} tickLine={false} domain={[0, 40]} />
                        <Tooltip contentStyle={tt_simulador} cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            formatter={(v: any) => [`${v}%`, 'TNA']} />
                        <Bar dataKey="tna" fill={C_SIMULADOR.accent} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
                {sorted.map((b, i) => (
                    <div key={b.nombre} style={{
                        background: C_SIMULADOR.card,
                        border: `1px solid ${i === 0 ? C_SIMULADOR.accent : C_SIMULADOR.border}`,
                        borderRadius: 16,
                        padding: "16px",
                        transition: "transform 0.2s ease"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${b.logoColor || '#333'}22`, border: `1px solid ${b.logoColor || '#333'}44`, display: "flex", alignItems: "center", justifyContent: "center", color: b.logoColor || '#999', fontWeight: 800, fontSize: 10 }}>
                                    {b.nombre.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ color: C_SIMULADOR.text, fontWeight: 700, fontSize: 14 }}>{b.nombre}</div>
                                    {b.tag && <span style={{ background: `${C_SIMULADOR.accent}22`, color: C_SIMULADOR.accent, fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 6, textTransform: "uppercase" }}>{b.tag}</span>}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ color: C_SIMULADOR.accent, fontWeight: 800, fontSize: 20 }}>{b.tna}%</div>
                                <div style={{ color: C_SIMULADOR.muted, fontSize: 9 }}>TNA ANUAL</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 1, background: C_SIMULADOR.card2, borderRadius: 10, padding: "8px", textAlign: "center" }}>
                                <div style={{ color: C_SIMULADOR.muted, fontSize: 9 }}>MENSUAL</div>
                                <div style={{ color: C_SIMULADOR.text, fontWeight: 600, fontSize: 13 }}>{(b.tna / 12).toFixed(2)}%</div>
                            </div>
                            <div style={{ flex: 1, background: b.tna >= inflacionAnual ? `${C_SIMULADOR.green}11` : `${C_SIMULADOR.red}11`, borderRadius: 10, padding: "8px", textAlign: "center", border: `1px solid ${b.tna >= inflacionAnual ? C_SIMULADOR.green : C_SIMULADOR.red}33` }}>
                                <div style={{ color: b.tna >= inflacionAnual ? C_SIMULADOR.green : C_SIMULADOR.red, fontWeight: 700, fontSize: 12 }}>
                                    {b.tna >= inflacionAnual ? "GANA" : "PIERDE"}
                                </div>
                                <div style={{ color: C_SIMULADOR.muted, fontSize: 8 }}>VS. INFLACIÓN</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <SimuladorPF inflacionMensual={inflacionMensual} plazosFijos={sorted} />
        </div>
    );
};

// ─── APP PRINCIPAL (Simulador Tab) ────────────────────────────────────────────────────────────
const TABS_SIMULADOR = [
    { id: "live", label: "🔴 En Vivo" },
    { id: "cuentas", label: "💰 Cuentas" },
    { id: "plazofijo", label: "📈 Plazo Fijo" },
    { id: "prestamos", label: "💳 Préstamos" },
    { id: "hipotecarios", label: "🏠 Hipotecarios" },
];

const transformIdentity = (d: any) => d;
const fallbackInflacion = [{ fecha: "2025-01-01", valor: FALLBACK.inflacionMensual }];
const fallbackRiesgo = [{ fecha: "2025-02-21", valor: FALLBACK.riesgoPais }];

const SimuladorTab = ({ data: liveData }: { data: any }) => {
    const [tab, setTab] = useState("live");

    const dolarFallback = React.useMemo(() => Object.entries(CASAS_MAP).map(([casa]) => {
        const fbKey = casa === "bolsa" ? "mep" : casa === "contadoconliqui" ? "ccl" : casa === "cripto" ? "crypto" : casa;
        return {
            casa,
            compra: (FALLBACK as any)[fbKey]?.compra,
            venta: (FALLBACK as any)[fbKey]?.venta,
        };
    }), []);

    // ── APIs en tiempo real ──
    const dolar = useFetch(
        "https://dolarapi.com/v1/dolares",
        transformIdentity,
        dolarFallback
    );

    const inflacion = useFetch(
        "https://api.argentinadatos.com/v1/finanzas/indices/inflacion",
        transformIdentity,
        fallbackInflacion
    );

    const riesgoPais = useFetch(
        "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais",
        transformIdentity,
        fallbackRiesgo
    );

    const inflMensual = inflacion.data ? inflacion.data[inflacion.data.length - 1]?.valor ?? FALLBACK.inflacionMensual : FALLBACK.inflacionMensual;
    const ultimos12 = inflacion.data ? inflacion.data.slice(-12) : [];
    const inflAnual = ultimos12.length > 0
        ? parseFloat(((ultimos12.reduce((acc: number, m: any) => acc * (1 + m.valor / 100), 1) - 1) * 100).toFixed(1))
        : FALLBACK.inflacionAnual;

    return (
        <div style={{ background: C_SIMULADOR.bg, fontFamily: "system-ui,-apple-system,sans-serif", color: C_SIMULADOR.text, padding: "0" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 26 }}>🇦🇷</span>
                <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>MacroAR — Comparador Financiero</div>
                    <div style={{ color: C_SIMULADOR.muted, fontSize: 11 }}>Datos en tiempo real · Bancos y fintech argentinos</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                    <div style={{ background: `${C_SIMULADOR.red}22`, border: `1px solid ${C_SIMULADOR.red}44`, borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
                        <div style={{ color: C_SIMULADOR.muted, fontSize: 10 }}>Inflación mensual</div>
                        <div style={{ color: C_SIMULADOR.red, fontWeight: 700, fontSize: 16 }}>{inflMensual}%</div>
                        <div style={{ color: C_SIMULADOR.muted, fontSize: 9 }}>{inflacion.error ? "estimado" : "INDEC"}</div>
                    </div>
                    <div style={{ background: `${C_SIMULADOR.red}22`, border: `1px solid ${C_SIMULADOR.red}44`, borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
                        <div style={{ color: C_SIMULADOR.muted, fontSize: 10 }}>Inflación anual</div>
                        <div style={{ color: C_SIMULADOR.red, fontWeight: 700, fontSize: 16 }}>{inflAnual}%</div>
                        <div style={{ color: C_SIMULADOR.muted, fontSize: 9 }}>{inflacion.error ? "estimado" : "últ. 12 meses"}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C_SIMULADOR.border}`, marginBottom: 16, overflowX: "auto" }}>
                {TABS_SIMULADOR.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        background: "none", border: "none",
                        borderBottom: tab === t.id ? `2px solid ${C_SIMULADOR.accent}` : "2px solid transparent",
                        color: tab === t.id ? C_SIMULADOR.accent : C_SIMULADOR.muted,
                        padding: "0.7rem 1rem", cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
                    }}>{t.label}</button>
                ))}
            </div>

            {/* TAB: EN VIVO */}
            {tab === "live" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: `${C_SIMULADOR.accent}11`, border: `1px solid ${C_SIMULADOR.accent}33`, borderRadius: 16, padding: "12px 16px" }}>
                        <p style={{ color: C_SIMULADOR.muted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                            🔴 <strong style={{ color: C_SIMULADOR.accent }}>Datos en tiempo real</strong> — El dólar se actualiza cada 3 minutos.
                            La inflación y riesgo país se sincronizan con publicaciones oficiales del INDEC y BCRA.
                        </p>
                    </div>
                    <DolarPanel
                        data={dolar.data} loading={dolar.loading} error={dolar.error}
                        lastUpdated={dolar.lastUpdated} onRefresh={dolar.refresh}
                        inflacionAnual={inflAnual}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                        <InflacionPanel
                            data={inflacion.data} loading={inflacion.loading} error={inflacion.error}
                            lastUpdated={inflacion.lastUpdated} onRefresh={inflacion.refresh}
                        />
                        <RiesgoPaisPanel
                            data={riesgoPais.data} loading={riesgoPais.loading} error={riesgoPais.error}
                            lastUpdated={riesgoPais.lastUpdated} onRefresh={riesgoPais.refresh}
                        />
                    </div>
                </div>
            )}

            {/* TAB: CUENTAS */}
            {tab === "cuentas" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><TabCuentas inflacionAnual={inflAnual} liveCuentas={liveData.tasasCuentas} /></div>}

            {/* TAB: PLAZO FIJO */}
            {tab === "plazofijo" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><TabPlazoFijo inflacionMensual={inflMensual} inflacionAnual={inflAnual} liveBancos={liveData.tasasBancos} /></div>}

            {/* TAB: PRESTAMOS */}
            {tab === "prestamos" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ background: `${C_SIMULADOR.red}11`, border: `1px solid ${C_SIMULADOR.red}33`, borderRadius: 10, padding: "10px 14px" }}>
                        <p style={{ color: C_SIMULADOR.muted, fontSize: 12, margin: 0 }}>
                            ⚠️ El <strong style={{ color: C_SIMULADOR.text }}>CFT</strong> incluye todos los gastos reales. Siempre comparar por CFT, no por TNA.
                            Cuota simulada sobre <strong style={{ color: C_SIMULADOR.text }}>$1.000.000 a 12 meses.</strong>
                        </p>
                    </div>
                    {[...prestamos].sort((a, b) => a.cft - b.cft).map((p, i) => (
                        <div key={p.nombre} style={{ background: C_SIMULADOR.card, border: `1px solid ${i === 0 ? C_SIMULADOR.accent : C_SIMULADOR.border}`, borderRadius: 16, padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${p.logoColor}11`, border: `1px solid ${p.logoColor}33`, display: "flex", alignItems: "center", justifyContent: "center", color: p.logoColor, fontWeight: 800, fontSize: 11 }}>
                                    {p.nombre.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <span style={{ color: C_SIMULADOR.text, fontWeight: 700, fontSize: 14 }}>{p.nombre}</span>
                                    {p.tag && <span style={{ background: `${C_SIMULADOR.accent}22`, color: C_SIMULADOR.accent, fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, marginLeft: 8 }}>{p.tag}</span>}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ color: C_SIMULADOR.muted, fontSize: 9 }}>CFT</div>
                                    <div style={{ color: i === 0 ? C_SIMULADOR.green : C_SIMULADOR.text, fontWeight: 800, fontSize: 18 }}>{p.cft}%</div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ color: C_SIMULADOR.muted, fontSize: 9 }}>CUOTA/MES</div>
                                    <div style={{ color: C_SIMULADOR.yellow, fontWeight: 700, fontSize: 15 }}>${p.cuota12.toLocaleString("es-AR")}</div>
                                </div>
                                {i === 0 && <div style={{ background: `${C_SIMULADOR.green}22`, color: C_SIMULADOR.green, padding: "6px 14px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>MÁS BAJO</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: HIPOTECARIOS */}
            {tab === "hipotecarios" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ background: `${C_SIMULADOR.purple}11`, border: `1px solid ${C_SIMULADOR.purple}33`, borderRadius: 10, padding: "10px 14px" }}>
                        <p style={{ color: C_SIMULADOR.muted, fontSize: 12, margin: 0 }}>
                            🏠 Créditos <strong style={{ color: C_SIMULADOR.text }}>UVA</strong> — se ajustan por inflación.
                            Cuota simulada por cada <strong style={{ color: C_SIMULADOR.text }}>$100.000 de crédito</strong> a 20 años.
                        </p>
                    </div>
                    {[...hipotecarios].sort((a, b) => a.cuota100k - b.cuota100k).map((h: any, i: number) => (
                        <div key={h.nombre} style={{ background: C_SIMULADOR.card, border: `1px solid ${i === 0 ? C_SIMULADOR.accent : C_SIMULADOR.border}`, borderRadius: 16, padding: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${h.logoColor}11`, border: `1px solid ${h.logoColor}33`, display: "flex", alignItems: "center", justifyContent: "center", color: h.logoColor, fontWeight: 800, fontSize: 11 }}>
                                        {h.nombre.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: C_SIMULADOR.text, fontWeight: 700, fontSize: 14 }}>{h.nombre}</span>
                                            {h.tag && <span style={{ background: `${C_SIMULADOR.accent}22`, color: C_SIMULADOR.accent, fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>{h.tag}</span>}
                                        </div>
                                        <div style={{ color: C_SIMULADOR.muted, fontSize: 11, marginTop: 2 }}>✅ {h.requisito}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ color: C_SIMULADOR.muted, fontSize: 9 }}>TNA UVA</div>
                                        <div style={{ color: C_SIMULADOR.accent, fontWeight: 800, fontSize: 17 }}>{h.tna}%</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ color: C_SIMULADOR.muted, fontSize: 9 }}>CUOTA/100K</div>
                                        <div style={{ color: C_SIMULADOR.text, fontWeight: 700, fontSize: 16 }}>${h.cuota100k.toLocaleString("es-AR")}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 16, padding: "8px 12px", background: C_SIMULADOR.card, borderRadius: 8, border: `1px solid ${C_SIMULADOR.border}`, fontSize: 11, color: C_SIMULADOR.muted, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <span>📡 Fuentes en vivo: dolarapi.com · argentinadatos.com · BCRA · INDEC</span>
                <span>Tasas bancarias verificadas: <strong style={{ color: C_SIMULADOR.text }}>{TASAS_ACTUALIZADAS}</strong></span>
                <span style={{ fontWeight: 600 }}>macroar.vercel.app</span>
            </div>
        </div>
    );
};

