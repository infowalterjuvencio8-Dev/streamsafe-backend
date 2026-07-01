/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, Info, Star, Calendar } from "lucide-react";
import { TMDBMediaItem } from "../types";

interface HeroProps {
  featured: TMDBMediaItem | null;
  onPlay: (id: number, type: "movie" | "tv", title: string) => void;
  onOpenDetails: (id: number, type: "movie" | "tv") => void;
}

export default function Hero({ featured, onPlay, onOpenDetails }: HeroProps) {
  if (!featured) return null;

  const title = featured.title || featured.name || "Filme em Destaque";
  const year = (featured.release_date || featured.first_air_date || "").split("-")[0] || "2024";
  const rating = featured.vote_average ? featured.vote_average.toFixed(1) : "N/A";
  const backdropUrl = featured.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${featured.backdrop_path}`
    : "https://via.placeholder.com/1920x1080?text=StreamSafe+Cinema";

  const isMovie = featured.media_type === "movie";

  return (
    <div className="relative w-full h-[65vh] min-h-[460px] md:h-[85vh] flex items-end md:items-center pb-12 md:pb-0 overflow-hidden bg-black">
      {/* Background Image / Cinema Canvas */}
      <div className="absolute inset-0">
        <img
          src={backdropUrl}
          alt={title}
          className="w-full h-full object-cover transform scale-100 brightness-[0.5] md:brightness-[0.7] transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute left-0 top-0 h-full w-2/3 bg-gradient-to-r from-black/90 via-black/30 to-transparent hidden md:block" />
      </div>

      {/* Content wrapper */}
      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 z-10 select-none text-left">
        <div className="max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-red/10 text-brand-red border border-brand-red/20 mb-3 text-[9px] font-bold tracking-widest uppercase">
            🔥 ORIGINAL STREAMSAFE
          </div>

          {/* Title */}
          <h1 className="font-display font-black text-3xl md:text-5xl lg:text-6xl text-white tracking-tight leading-none mb-3 drop-shadow-lg">
            {title}
          </h1>

          {/* Metadata */}
          <div className="flex items-center flex-wrap gap-3 text-xs text-gray-300 mb-3 font-medium">
            <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
              98% de Correspondência
            </span>
            <span className="text-gray-400 font-normal">
              {year}
            </span>
            <span className="px-1.5 py-0.2 border border-white/40 rounded text-[9px] font-bold tracking-wide text-white">
              {isMovie ? "FILME" : "SÉRIE"}
            </span>
            <span className="flex items-center gap-0.5 text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded text-[10px]">
              ★ {rating}
            </span>
          </div>

          {/* Sinopse */}
          <p className="text-gray-200 text-xs md:text-sm leading-relaxed mb-6 line-clamp-3 text-ellipsis drop-shadow-sm max-w-md">
            {featured.overview || "Fascinante obra disponível exclusivamente no StreamSafe com total segurança e comodidade."}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onPlay(featured.id, isMovie ? "movie" : "tv", title)}
              className="flex-1 sm:flex-none px-6 py-3 rounded bg-white hover:bg-white/90 text-black font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer transform active:scale-95"
            >
              <Play className="w-4.5 h-4.5 fill-current text-black" />
              Assistir
            </button>
            <button
              onClick={() => onOpenDetails(featured.id, isMovie ? "movie" : "tv")}
              className="flex-1 sm:flex-none px-6 py-3 rounded bg-white/20 hover:bg-white/30 font-bold text-white text-xs md:text-sm backdrop-blur-sm transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-95 border-0"
            >
              <Info className="w-4.5 h-4.5 text-white" />
              Mais Informações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
