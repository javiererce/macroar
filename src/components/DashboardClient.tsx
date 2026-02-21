"use client";

import React, { useState, useEffect } from "react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
    ComposedChart, ReferenceLine
} from "recharts";
import {
    Flame, DollarSign, Wallet, Landmark,
    TriangleAlert, Zap, Briefcase, TrendingUp,
    Moon, Sun, Bell, Download, ChevronRight,
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
    lastUpdate: string;
}

interface DashboardProps {
    data: DashboardData;
}

// ── Components ────────────────────────────────────────────

const Skel = ({ className }: { className?: string }) => (
    <div className={cn("bg-subtle animate-pulse rounded", className)} />
);

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
        <div className={cn("bg-card border border-border rounded-xl p-4 flex-1 min-w-[140px] border-l-4 transition-all hover:translate-y-[-2px]", colorMap[color] || "border-l-accent")}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-muted text-[10px] uppercase tracking-wider flex items-center gap-1 font-semibold">
                    {typeof icon === 'string' ? icon : icon} {title}
                </span>
                <InfoTip text={tooltip} />
            </div>
            <div className="text-foreground text-xl font-bold mb-1">{value}</div>
            <div className="flex justify-between items-center">
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
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
                <h3 className="text-foreground text-sm font-semibold">{title}</h3>
                {badge && (
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", badgeColor)}>
                        {badge}
                    </span>
                )}
            </div>
            <span className="text-muted text-[10px] italic">{source}</span>
        </div>
        <div className="h-[200px] w-full">
            {children}
        </div>
    </div>
);

const SponsorBanner = () => (
    <div className="bg-gradient-to-r from-accent to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
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
    const [done, setDone] = useState(false);
    const indicators = ["Inflación mensual", "Dólar Blue", "Dólar Oficial", "Riesgo País", "Reservas BCRA", "Demanda Eléctrica CAMMESA", "Salario Real", "Tasa BADLAR"];

    return (
        <div className="bg-card border border-border rounded-2xl w-full max-w-[420px] p-6 shadow-2xl">
            {done ? (
                <div className="text-center py-4">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-foreground text-xl font-bold mb-2">¡Alerta creada!</h3>
                    <p className="text-muted text-sm mb-6">Te avisamos cuando <strong className="text-foreground">{indicator}</strong> supere <strong className="text-accent">{threshold}</strong></p>
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
                                        onClick={() => setChannel(ch.id)}
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
                        {channel === "telegram" && (
                            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                                <p className="text-muted text-[11px] leading-relaxed">
                                    Buscá <strong className="text-accent">@MacroARBot</strong> en Telegram y enviá <code className="bg-success/20 text-success px-1 rounded font-bold">/start</code>
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => setDone(true)}
                            disabled={!channel || !threshold}
                            className={cn(
                                "w-full rounded-xl p-4 font-bold text-base transition-all",
                                channel && threshold ? "bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98]" : "bg-border text-muted cursor-not-allowed"
                            )}
                        >
                            Crear Alerta
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
                    const ws = XLSX.utils.json_to_sheet(s.data);
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
                pdf.setFillColor(5, 10, 25);
                pdf.rect(0, 0, w, 50, 'F');
                pdf.setFillColor(37, 99, 235);
                pdf.rect(0, 46, w, 4, 'F');

                // Logo text
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(28);
                pdf.setFont("helvetica", "bold");
                pdf.text("Macro", 15, 25);
                pdf.setTextColor(59, 130, 246);
                pdf.text("AR", 52, 25);

                // Subtitle
                pdf.setTextColor(148, 163, 184);
                pdf.setFontSize(9);
                pdf.setFont("helvetica", "normal");
                pdf.text("INTELLIGENCE DASHBOARD", 15, 33);
                pdf.text(`Generado: ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`, 15, 39);

                // Flag emoji and type
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(10);
                pdf.setFont("helvetica", "bold");
                pdf.text(`REPORTE: ${labelSelected.toUpperCase()}`, w - 15, 25, { align: "right" });
                pdf.setTextColor(148, 163, 184);
                pdf.setFontSize(8);
                pdf.text("macroar.vercel.app", w - 15, 33, { align: "right" });

                y = 58;

                // ── KPI Cards (only for "all") ──
                if (selected === "all") {
                    const kpis = [
                        { label: "Inflación", value: `${data.inflacion.length ? data.inflacion[data.inflacion.length - 1].valor : "N/A"}%`, color: [239, 68, 68] },
                        { label: "Dólar Oficial", value: `$${data.dolares.oficial}`, color: [59, 130, 246] },
                        { label: "Dólar Blue", value: `$${data.dolares.blue}`, color: [245, 158, 11] },
                        { label: "Riesgo País", value: `${data.riesgoPais.actual} pb`, color: [139, 92, 246] },
                    ];
                    const cardW = (w - 30 - 15) / 4;
                    kpis.forEach((kpi, i) => {
                        const x = 15 + i * (cardW + 5);
                        pdf.setFillColor(15, 23, 42);
                        pdf.roundedRect(x, y, cardW, 28, 3, 3, 'F');
                        pdf.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
                        pdf.setLineWidth(0.8);
                        pdf.line(x, y + 2, x, y + 26);

                        pdf.setTextColor(148, 163, 184);
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
                        pdf.setFillColor(5, 10, 25);
                        pdf.rect(0, 0, w, 12, 'F');
                        pdf.setTextColor(148, 163, 184);
                        pdf.setFontSize(7);
                        pdf.text(`MacroAR Intelligence — ${labelSelected}`, 15, 8);
                        pdf.text(`Pág ${pdf.getNumberOfPages()}`, w - 15, 8, { align: "right" });
                        y = 20;
                    }

                    // Section title
                    pdf.setFillColor(15, 23, 42);
                    pdf.roundedRect(15, y, w - 30, 10, 2, 2, 'F');
                    pdf.setTextColor(59, 130, 246);
                    pdf.setFontSize(10);
                    pdf.setFont("helvetica", "bold");
                    pdf.text(`📊 ${sheet.name}`, 20, y + 7);
                    y += 14;

                    if (sheet.data.length === 0) {
                        pdf.setTextColor(148, 163, 184);
                        pdf.setFontSize(9);
                        pdf.text("Sin datos disponibles", 20, y + 5);
                        y += 12;
                        return;
                    }

                    // Table header
                    const cols = Object.keys(sheet.data[0]);
                    const colW = (w - 30) / cols.length;

                    pdf.setFillColor(30, 41, 59);
                    pdf.rect(15, y, w - 30, 8, 'F');
                    pdf.setTextColor(148, 163, 184);
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
                            pdf.setFillColor(5, 10, 25);
                            pdf.rect(0, 0, w, 12, 'F');
                            pdf.setTextColor(148, 163, 184);
                            pdf.setFontSize(7);
                            pdf.text(`MacroAR Intelligence — ${sheet.name}`, 15, 8);
                            y = 20;
                        }
                        if (ri % 2 === 0) {
                            pdf.setFillColor(15, 23, 42);
                            pdf.rect(15, y, w - 30, 7, 'F');
                        }
                        pdf.setTextColor(249, 250, 251);
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
                    pdf.setFillColor(5, 10, 25);
                    pdf.rect(0, h - 15, w, 15, 'F');
                    pdf.setDrawColor(59, 130, 246);
                    pdf.setLineWidth(0.5);
                    pdf.line(0, h - 15, w, h - 15);
                    pdf.setTextColor(100, 116, 139);
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

// ── Main Layout ───────────────────────────────────────────

export default function DashboardClient({ data }: DashboardProps) {
    const [dark, setDark] = useState(true);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("resumen");
    const [alertOpen, setAlertOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Safety timeout: never stay in loading state forever
    useEffect(() => {
        const safetyTimeout = setTimeout(() => {
            if (loading) setLoading(false);
        }, 8000);
        return () => clearTimeout(safetyTimeout);
    }, [loading]);

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [dark]);

    const tabs = [
        { id: "resumen", label: "📊 Resumen" },
        { id: "precios", label: "🔥 Inflación" },
        { id: "cambiario", label: "💵 Cambio" },
        { id: "externo", label: "🌍 Externo" },
        { id: "cammesa", label: "⚡ CAMMESA" },
        { id: "salarios", label: "💼 Salarios" },
        { id: "noticias", label: "📰 Noticias" },
        { id: "calendario", label: "📅 Calendario" },
    ];

    // Merge Real Data with KPIs
    const kpis = kpisInitial.map(k => {
        if (k.title === "Inflación mensual" && data.inflacion.length) {
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
        if (k.title === "Reservas BCRA" && data.reservas.length) {
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

                        <div className="bg-success/10 text-success border border-success/20 px-4 py-2 rounded-full text-[9px] font-black flex items-center gap-2 animate-pulse shadow-sm">
                            <span className="w-2 h-2 bg-success rounded-full"></span> EN VIVO
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs Navigation */}
            <nav className="border-b border-border bg-card/40 backdrop-blur-md sticky top-[81px] z-40 overflow-x-auto no-scrollbar">
                <div className="max-w-[1400px] mx-auto flex px-5">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                "px-6 py-4 text-xs font-black transition-all border-b-[3px] whitespace-nowrap uppercase tracking-widest",
                                tab === t.id ? "text-accent border-accent bg-accent/5" : "text-muted border-transparent hover:text-foreground hover:bg-card/50"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
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
                    <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#e2e8f0", fontSize: 10, fontWeight: 700 }} unit="%" axisLine={false} tickLine={false} />
                    <Tooltip
                        cursor={{ fill: 'var(--card-secondary)', opacity: 0.4 }}
                        contentStyle={{ backgroundColor: "var(--card-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                        itemStyle={{ color: "var(--red)", fontWeight: "black" }}
                    />
                    <Bar dataKey="valor" fill="var(--red)" radius={[6, 6, 0, 0]} barSize={32} />
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
                    <XAxis dataKey="dia" tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} domain={[270, 450]} axisLine={false} tickLine={false} />
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
                    <XAxis dataKey="mes" tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
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
                    <XAxis dataKey="mes" tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} domain={[90, 150]} axisLine={false} tickLine={false} />
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
                        <XAxis dataKey="mes" tick={{ fill: "#e2e8f0", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#e2e8f0", fontSize: 11, fontWeight: 700 }} unit="%" axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--card-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "12px" }} cursor={{ fill: 'var(--card-secondary)', opacity: 0.3 }} />
                        <Bar dataKey="valor" fill="var(--red)" radius={[8, 8, 0, 0]} barSize={40} />
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
                    <XAxis dataKey="mes" tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
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
                    <XAxis dataKey="mes" tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 600 }} axisLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} />
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
                    <XAxis dataKey="mes" tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 600 }} axisLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} />
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
                        <XAxis dataKey="dia" tick={{ fill: "var(--muted)", fontSize: 9, fontWeight: 700 }} axisLine={false} interval={4} />
                        <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} domain={[270, 460]} axisLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="valor" stroke="var(--orange)" fill="url(#cg2)" strokeWidth={4} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Promedio Mensual & Variación %" source="Anuario CAMMESA">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mockCammesaMensual}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.4} />
                        <XAxis dataKey="mes" tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 700 }} axisLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: "var(--muted)", fontSize: 10 }} domain={[340, 430]} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--success)", fontSize: 10, fontWeight: 900 }} unit="%" axisLine={false} />
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
                        <XAxis dataKey="mes" tick={{ fill: "var(--muted)", fontSize: 11, fontWeight: 700 }} axisLine={false} />
                        <YAxis tick={{ fill: "var(--muted)", fontSize: 10 }} domain={[90, 150]} axisLine={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "15px", fontWeight: "bold" }} />
                        <ReferenceLine y={100} stroke="var(--muted)" strokeDasharray="5 5" label={{ value: 'BASE 100', fill: 'var(--muted)', fontSize: 10, fontWeight: 900, position: 'insideRight' }} />
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
                        <XAxis type="number" tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 700 }} unit="%" axisLine={false} />
                        <YAxis type="category" dataKey="sector" tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 800 }} width={120} axisLine={false} stroke="transparent" />
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
