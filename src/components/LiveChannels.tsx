/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Tv, Film, Baby, Radio, Play, Gift } from "lucide-react";
import { LiveChannel } from "../types";
import { LIVE_CHANNELS } from "../utils/movieApi";

interface LiveChannelsProps {
  onSelectChannel: (channel: LiveChannel) => void;
}

export default function LiveChannels({ onSelectChannel }: LiveChannelsProps) {
  const [activeTab, setActiveTab] = useState<"todos" | "entretenimento" | "infantil" | "noticias">("todos");

  const filteredChannels = LIVE_CHANNELS.filter((ch) => {
    if (activeTab === "todos") return true;
    return ch.categoria === activeTab;
  });

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case "entretenimento": return "Filmes e Séries";
      case "infantil": return "Cariocas e Desenhos";
      case "noticias": return "Informação e Noticiários";
      default: return "Canais Disponíveis";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "entretenimento": return <Film className="w-4 h-4 text-brand-red" />;
      case "infantil": return <Baby className="w-4 h-4 text-cyan-400" />;
      case "noticias": return <Radio className="w-4 h-4 text-amber-500" />;
      default: return <Tv className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 md:px-8 min-h-[60vh]">
      {/* Header section */}
      <div className="text-center md:text-left mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-brand-red font-bold text-xs font-mono uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              SAÚDE DA TRANSMISSÃO • 100% ONLINE
            </span>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight mt-1">
              Televisão ao Vivo Moçambique
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Canais nacionais e internacionais premium com áudio sincronizado e alta taxa de quadros.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex flex-wrapアイテムs-center justify-center gap-2 p-1 bg-brand-card rounded-xl border border-white/5">
            {(["todos", "entretenimento", "infantil", "noticias"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                  activeTab === tab
                    ? "bg-brand-red text-white font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab === "todos" ? "Todos os canais" : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Channels directory view */}
      {filteredChannels.length === 0 ? (
        <div className="text-center py-16 bg-brand-card rounded-2xl border border-white/5">
          <Tv className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum canal ativo nesta categoria no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChannels.map((channel) => (
            <div
              key={channel.nome}
              onClick={() => onSelectChannel(channel)}
              className="group bg-brand-card/70 hover:bg-brand-card p-4 rounded-xl border border-white/5 hover:border-brand-red/30 cursor-pointer flex items-center justify-between gap-4 transition-all duration-300 transform hover:translate-x-1 hover:shadow-lg hover:shadow-brand-red/5"
            >
              <div className="flex items-center gap-4">
                {/* Channel visual logo placeholder */}
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/5 group-hover:bg-brand-red/10 group-hover:border-brand-red/20 transition-all flex items-center justify-center text-2xl shadow-inner">
                  {channel.icon}
                </div>

                <div>
                  <h4 className="font-semibold text-white group-hover:text-brand-red transition-colors text-sm md:text-base">
                    {channel.nome}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-500">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      LIVE
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase font-mono tracking-wider ml-1">
                      {getCategoryIcon(channel.categoria)}
                      {channel.categoria}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action play button circle indicator */}
              <div className="w-8 h-8 rounded-full bg-white/5 text-gray-400 group-hover:bg-brand-red group-hover:text-white flex items-center justify-center transition-all">
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info notice block */}
      <div className="mt-12 p-4 bg-brand-red/10 border border-brand-red/20 rounded-xl max-w-2xl mx-auto text-center">
        <p className="text-xs text-brand-red font-medium leading-relaxed">
          💡 <strong>RECOMENDAÇÃO DE ESTABILIDADE:</strong> Caso ocorra carregamento infinito ou tela cinza ao abrir canais ao vivo, clique na opção <strong>"Assistir em Nova Aba"</strong> para carregar o player em um ambiente sem bloqueador de popups.
        </p>
      </div>
    </div>
  );
}
