/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, Info, Check, HelpCircle } from "lucide-react";
import { adShield, ShieldStats, ShieldMode } from "../utils/adShield";

interface AdShieldControllerProps {
  mode: ShieldMode;
  onModeChange: (mode: ShieldMode) => void;
}

export default function AdShieldController({ mode, onModeChange }: AdShieldControllerProps) {
  const [stats, setStats] = useState<ShieldStats>({
    popupsBlocked: 0,
    redirectsPrevented: 0,
    adsRemoved: 0,
    suspectLinksCleaned: 0,
  });
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    // Register to changes in AdShield blocker counters
    adShield.init();
    const unsubscribe = adShield.subscribe((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualScan = () => {
    setIsCleaning(true);
    adShield.cleanDOM();
    setTimeout(() => {
      setIsCleaning(false);
    }, 800);
  };

  const getStatusColor = () => {
    if (mode === "strong") return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (mode === "balanced") return "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const currentSandboxExplain = () => {
    if (mode === "strong") {
      return "Bloqueio Total: Impede abertura de qualquer nova aba, downloads e redirecionamentos externos indesejados. Máxima segurança.";
    }
    if (mode === "balanced") {
      return "Bloqueio Inteligente: Permite que reprodutores de vídeo de terceiros funcionem com sandbox flexível, mitigando anúncios invasivos.";
    }
    return "Sem Proteção (Modo Livre): Remove restrições de sandbox. Use apenas se o player falhar em iniciar.";
  };

  return (
    <div className="w-full bg-[#11121a]/95 rounded-xl border border-white/10 p-4 shadow-xl mt-4 text-white font-sans animate-fade-in relative overflow-hidden backdrop-blur-md">
      {/* Ambient glass glows inside the block */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header section with Shield status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
              🛡️ AdShield Inteligente Moçambique
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest font-black">
                v2.1 Pro
              </span>
            </h4>
            <p className="text-gray-400 text-xs mt-0.5">
              Proteção proativa contra anúncios agressivos, cliques invisíveis e redirecionamentos.
            </p>
          </div>
        </div>

        {/* Level Controls */}
        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5 self-start sm:self-center">
          <button
            onClick={() => onModeChange("strong")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              mode === "strong"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Forte
          </button>
          <button
            onClick={() => onModeChange("balanced")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              mode === "balanced"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Inteligente
          </button>
          <button
            onClick={() => onModeChange("disabled")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              mode === "disabled"
                ? "bg-rose-600/25 text-rose-300 border border-rose-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Desligado
          </button>
        </div>
      </div>

      {/* Telemetry blocked counter badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Metric 1 */}
        <div className="bg-black/20 rounded-lg p-3 border border-white/[0.04] transition-all hover:bg-black/35 flex flex-col justify-between">
          <span className="text-gray-400 text-xs font-semibold">Abas / Popups Bloqueados</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-indigo-400 font-mono leading-none">
              {stats.popupsBlocked}
            </span>
            <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-1 py-0.2 rounded font-mono">
              Nativo
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-black/20 rounded-lg p-3 border border-white/[0.04] transition-all hover:bg-black/35 flex flex-col justify-between">
          <span className="text-gray-400 text-xs font-semibold">Redirecionamentos Impedidos</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-purple-400 font-mono leading-none">
              {stats.redirectsPrevented}
            </span>
            <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-1 py-0.2 rounded font-mono">
              Anti-Hijack
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-black/20 rounded-lg p-3 border border-white/[0.04] transition-all hover:bg-black/35 flex flex-col justify-between">
          <span className="text-gray-400 text-xs font-semibold">Superfícies Invisíveis Removidas</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-400 font-mono leading-none">
              {stats.adsRemoved}
            </span>
            <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-1 py-0.2 rounded font-mono">
              DOM Clean
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-black/20 rounded-lg p-3 border border-white/[0.04] transition-all hover:bg-black/35 flex flex-col justify-between">
          <span className="text-gray-400 text-xs font-semibold">Links Suspeitos Higienizados</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-400 font-mono leading-none">
              {stats.suspectLinksCleaned}
            </span>
            <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-1 py-0.2 rounded font-mono">
              Check
            </span>
          </div>
        </div>
      </div>

      {/* Control bar / explanation details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
        <div className="flex items-start gap-2 max-w-xl">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white/90">Nível do Escudo: <span className="text-indigo-300 capitalize">{mode === "strong" ? "Total" : mode === "balanced" ? "Inteligente" : "Desligado"}</span></p>
            <p className="mt-0.5 leading-relaxed text-gray-400">{currentSandboxExplain()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex items-center gap-1 transition-colors text-gray-300 font-semibold cursor-pointer"
          >
            Como Funciona?
          </button>
          
          <button
            onClick={handleManualScan}
            disabled={isCleaning}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCleaning ? "animate-spin" : ""}`} />
            {isCleaning ? "Higienizando..." : "Limpar Ads Agora"}
          </button>
        </div>
      </div>

      {/* Animated Explanation Drawer */}
      {showExplanation && (
        <div className="mt-4 p-4 bg-black/40 border border-white/10 rounded-lg text-xs leading-relaxed text-gray-300 space-y-2 animate-fade-in">
          <p className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Mecanismo Duplo de Defesa Ativa Antivirus / Anti-Adware
          </p>
          <p>
            Este portal implementa um ecossistema blindado para garantir que você assista a qualquer filme ou série sem ser interrompido por popups de apostas esportivas, redirecionamentos nocivos do navegador ou anúncios intrusivos:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
            <li>
              <strong className="text-white">Isolamento em Sandbox do Link do Vídeo:</strong> Ao carregar o player dentro do nosso modal com o <span className="text-indigo-300 font-semibold">Escudo Total</span>, o navegador bloqueia de forma absoluta as APIs nativas que permitem ao player remoto redirecionar a aba atual ou disparar novas abas de propaganda.
            </li>
            <li>
              <strong className="text-white">Proxiador de window.open:</strong> Redefine a biblioteca global do navegador para interceptar chamadas JavaScript clandestinas antes que consigam abrir interfaces não-autorizadas ou links suspeitos fora da whitelist comercial.
            </li>
            <li>
              <strong className="text-white">Varredor MutationObserver:</strong> Um monitor em threads paralelas que realiza varreduras constantes no código de exibição para detectar e pulverizar overlays invisíveis maliciosos e propagandas flutuantes.
            </li>
            <li>
              <strong className="text-white">Garante de Estabilidade:</strong> Caso um player necessite estritamente abrir as suas permissões para rodar, basta alternar para <span className="text-purple-300 font-semibold">Inteligente</span> ou <span className="text-rose-300 font-semibold">Desativado</span> no menu rápido de proteção acima.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
