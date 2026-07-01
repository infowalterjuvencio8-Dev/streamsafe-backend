/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, ExternalLink, Play, ArrowLeft, ArrowRight, Tv, Shield, Layers, HelpCircle, Wifi } from "lucide-react";
import { ShieldMode } from "../utils/adShield";

interface PlayerModalProps {
  isOpen: boolean;
  contentId: string | number;
  type: "movie" | "tv" | "channel";
  title: string;
  season?: number;
  episode?: number;
  totalSeasons?: number;
  onClose: () => void;
  onNavigateEpisode?: (nextSeason: number, nextEpisode: number) => void;
}

export default function PlayerModal({
  isOpen,
  contentId,
  type,
  title,
  season = 1,
  episode = 1,
  totalSeasons = 1,
  onClose,
  onNavigateEpisode,
}: PlayerModalProps) {
  if (!isOpen) return null;

  const [shieldMode, setShieldMode] = useState<ShieldMode>("strong");
  const [selectedPlayer, setSelectedPlayer] = useState(1);

  // Define player servers
  const players = type === "channel" 
    ? [
        {
          id: 1,
          name: "Servidor Principal HD",
          description: "Sinal direto de Moçambique com máxima resolução digital.",
          getUrl: () => String(contentId)
        },
        {
          id: 2,
          name: "Servidor Otimizado Mobile",
          description: "Baixo consumo de dados e carregamento instantâneo.",
          getUrl: () => String(contentId)
        }
      ]
    : [
        {
          id: 1,
          name: "Player 1 (Ultra VIP - Recomendado)",
          description: "Velocidade máxima, sem travamentos e resolução Full HD.",
          getUrl: () => type === "movie" 
            ? `https://myembed.biz/filme/${contentId}` 
            : `https://myembed.biz/serie/${contentId}/${season}/${episode}`
        },
        {
          id: 2,
          name: "Player 2 (Premium - Dublado/Legendado)",
          description: "Servidor alternativo de alto desempenho com múltiplos áudios.",
          getUrl: () => type === "movie" 
            ? `https://superembed.org/filme/${contentId}` 
            : `https://superembed.org/serie/${contentId}/${season}/${episode}`
        },
        {
          id: 3,
          name: "Player 3 (Fast Stream - Mobile)",
          description: "Otimizado para conexões de dados móveis limitadas.",
          getUrl: () => type === "movie" 
            ? `https://multiembed.to/get.php?tmdb=1&id=${contentId}` 
            : `https://multiembed.to/get.php?tmdb=1&id=${contentId}&s=${season}&e=${episode}`
        },
        {
          id: 4,
          name: "Player 4 (VidSrc - Backup)",
          description: "Legendas completas em português e áudio original de cinema.",
          getUrl: () => type === "movie" 
            ? `https://vidsrc.to/embed/movie/${contentId}` 
            : `https://vidsrc.to/embed/tv/${contentId}/${season}/${episode}`
        }
      ];

  // Determine iframe playing source url
  const activePlayer = players.find(p => p.id === selectedPlayer) || players[0];
  const embedUrl = activePlayer.getUrl();

  const handleNextEpisode = () => {
    if (onNavigateEpisode) {
      onNavigateEpisode(season, episode + 1);
    }
  };

  const handlePrevEpisode = () => {
    if (onNavigateEpisode && episode > 1) {
      onNavigateEpisode(season, episode - 1);
    }
  };

  // Determine proper sandbox parameters
  const sandboxValue = 
    shieldMode === "strong"
      ? "allow-scripts allow-same-origin allow-fullscreen allow-forms allow-presentation"
      : shieldMode === "balanced"
      ? "allow-scripts allow-same-origin allow-fullscreen allow-forms allow-presentation allow-popups-to-escape-sandbox"
      : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/98 overflow-y-auto px-2 sm:px-4 py-4 md:py-10 flex flex-col items-center justify-start font-sans">
      <div className="w-full max-w-5xl flex flex-col gap-4">
        
        {/* Top Floating bar */}
        <div className="flex items-center justify-between p-4 w-full text-white bg-zinc-950 rounded border border-zinc-850 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-brand-red flex items-center justify-center font-bold text-white shadow-md shadow-brand-red/30">
              {type === "channel" ? <Tv className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-current" />}
            </div>
            <div>
              <h3 className="font-black text-sm md:text-lg leading-tight uppercase tracking-tight truncate max-w-[160px] sm:max-w-md">
                {title}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5 font-semibold">
                {type === "movie" && "🍿 FILME VIP"}
                {type === "tv" && `📺 TEMPORADA ${season} • EPISÓDIO ${episode}`}
                {type === "channel" && "📡 CANAL AO VIVO"}
              </p>
            </div>
          </div>

          {/* Header Action Keys */}
          <div className="flex items-center gap-2">
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-brand-red hover:bg-red-700 text-xs font-bold text-white rounded flex items-center gap-1 transition-all shadow-md active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Aba</span>
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Video stage */}
        <div className="relative w-full flex-1 md:flex-initial aspect-video bg-black rounded overflow-hidden border border-zinc-850 shadow-2xl group/player">
          {type === "channel" ? (
            /* Live Channel display redirect option panel - beautiful container */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#141414]/95">
              <div className="w-16 h-16 rounded-full bg-brand-red/15 text-brand-red flex items-center justify-center text-3xl mb-4 animate-pulse">
                📺
              </div>
              <h2 className="text-xl font-bold text-white">Canal {title} ao Vivo</h2>
              <p className="text-gray-400 text-sm max-w-md mt-2 mb-6 leading-relaxed">
                Para assistir a este canal sem bloqueios de anúncios do navegador, clique no botão de redirecionamento abaixo. O canal será transmitido em alta fidelidade.
              </p>
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-brand-red hover:bg-red-700 hover:scale-105 duration-200 text-sm font-bold text-white rounded flex items-center gap-1.5 transition-all no-underline shadow-lg shadow-brand-red/20"
              >
                <ExternalLink className="w-4 h-4" />
                Transmitir em Nova Aba
              </a>
            </div>
          ) : (
            /* Normal movie/series embed iframe - sandbox setup to eliminate ad popups and automatic redirects completely! */
            <div className="w-full h-full relative">
              <iframe
                id="stream-player"
                src={embedUrl}
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen
                referrerPolicy="no-referrer"
                sandbox={sandboxValue}
                allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
              />
            </div>
          )}
        </div>

        {/* Embedded Next Episode Bar for SÉRIES */}
        {type === "tv" && onNavigateEpisode && (
          <div className="w-full p-3 bg-zinc-950 rounded border border-zinc-850 flex items-center justify-between text-white shadow-xl">
            <button
              onClick={handlePrevEpisode}
              disabled={episode <= 1}
              className="px-4 py-2 text-xs font-bold rounded bg-zinc-900 hover:bg-zinc-800 text-gray-300 disabled:opacity-40 flex items-center gap-1 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>
            
            <span className="text-xs font-bold text-gray-400 font-mono hidden sm:inline">
              TEMPORADA {season} • EPISÓDIO {episode}
            </span>

            <button
              onClick={handleNextEpisode}
              className="px-4 py-2 text-xs font-bold rounded bg-brand-red hover:bg-red-700 text-white flex items-center gap-1 transition-all cursor-pointer"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}



      </div>
    </div>
  );
}
