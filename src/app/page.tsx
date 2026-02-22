// app/page.tsx
// MacroAR — Dashboard Macroeconómico Argentina
// Next.js 14 App Router + Recharts + Tailwind

import { Suspense } from "react";
import { getInflacion, getReservas, getRiesgoPais, getDolares, getDolarHistorico, getTasaBadlar, getTasasBancos, getTasasCuentas, getCryptoPrices } from "@/lib/api";
import DashboardClient from "@/components/DashboardClient";
import { Loader2 } from "lucide-react";

// Render dynamically on each request (no pre-rendering during build)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "MacroAR — Dashboard Económico Argentina",
  description: "Indicadores macroeconómicos de Argentina en tiempo real: inflación, tipo de cambio, reservas BCRA, riesgo país.",
  openGraph: {
    title: "MacroAR — Dashboard Económico Argentina",
    description: "Datos macro en tiempo real para profesionales y empresas.",
    url: "https://macroar.com.ar",
    siteName: "MacroAR",
  },
};

// Componente servidor: fetcha todos los datos antes de renderizar
export default async function HomePage() {
  // Fetch paralelo de todas las APIs con manejo de errores ultra-seguro
  const results = await Promise.allSettled([
    getInflacion(),
    getReservas(),
    getRiesgoPais(),
    getDolares(),
    getDolarHistorico(),
    getTasaBadlar(),
    getTasasBancos(),
    getTasasCuentas(),
    getCryptoPrices(),
  ]);

  const [inflacion, reservas, riesgoPais, dolares, dolarHistorico, tasaBadlar, tasasBancos, tasasCuentas, cryptos] = results.map(r =>
    r.status === "fulfilled" ? r.value : null
  );

  // Extraer valores con fallbacks seguros
  const data: any = {
    inflacion: inflacion ?? [],
    reservas: reservas ?? [],
    riesgoPais: riesgoPais ?? { actual: 620, historico: [] },
    dolares: dolares ?? { oficial: 1063, blue: 1220, mep: 1198, ccl: 1205 },
    dolarHistorico: dolarHistorico ?? [],
    tasaBadlar: tasaBadlar ?? 34.5,
    tasasBancos: tasasBancos ?? [],
    tasasCuentas: tasasCuentas ?? [],
    cryptos: cryptos ?? [],
    lastUpdate: new Date().toISOString(),
  };

  console.log("DATA FETCHED:", JSON.stringify(data).slice(0, 200));

  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardClient data={data} />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center flex-col gap-4">
      <Loader2 className="w-10 h-10 text-accent animate-spin" />
      <p className="text-gray-400 text-sm">Cargando indicadores…</p>
    </div>
  );
}
