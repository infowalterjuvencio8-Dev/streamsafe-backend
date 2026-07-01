/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { TMDBMediaItem } from "../types";

interface MediaCarouselProps {
  title: string;
  items: TMDBMediaItem[];
  type: "movie" | "tv" | "mixed";
  icon?: React.ReactNode;
  onSelect: (id: number, type: "movie" | "tv") => void;
  onViewAll?: () => void;
}

export default function MediaCarousel({
  title,
  items,
  type,
  icon,
  onSelect,
  onViewAll,
}: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative py-6 max-w-7xl mx-auto px-4 md:px-8 group">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-medium text-lg md:text-xl text-white flex items-center gap-2">
          {icon && <span className="text-brand-red flex items-center">{icon}</span>}
          {title}
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-brand-red hover:underline uppercase tracking-wider"
          >
            Ver tudo &rarr;
          </button>
        )}
      </div>

      {/* Carousel container */}
      <div className="relative">
        {/* Scroll Left Button */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-20 bg-black/80 hover:bg-brand-red hover:text-white border border-white/5 rounded-r flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl cursor-pointer hidden md:flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable grid track */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto overflow-y-hidden no-scrollbar pb-3 select-none scroll-smooth"
        >
          {items.map((item) => {
            const itemTitle = item.title || item.name || "Sem Título";
            const year = (item.release_date || item.first_air_date || "").split("-")[0];
            const poster = item.poster_path
              ? (item.poster_path.startsWith("http") ? item.poster_path : `https://image.tmdb.org/t/p/w300${item.poster_path}`)
              : "https://via.placeholder.com/300x450?text=Sem+Cartaz";

            const mediaType = item.media_type || (type === "mixed" ? "movie" : type);

            return (
              <div
                key={`${item.id}-${mediaType}`}
                onClick={() => onSelect(item.id, mediaType as "movie" | "tv")}
                className="flex-shrink-0 w-28 sm:w-40 lg:w-44 group/item cursor-pointer transform hover:scale-[1.03] duration-300"
              >
                {/* Visual card */}
                <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-brand-card shadow-lg border border-white/5">
                  <img
                    src={poster}
                    alt={itemTitle}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {/* Backdrop Gradient & Rating */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col justify-between p-3" />
                  
                  {/* Steady Top Right Rating badge */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] text-yellow-500 font-bold border border-white/5 shadow-md">
                    <Star className="w-2.5 h-2.5 fill-current text-yellow-500" />
                    {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}
                  </div>
                </div>

                {/* Meta details */}
                <div className="mt-2 px-1 text-left">
                  <h3 className="text-xs sm:text-sm font-semibold text-white truncate group-hover/item:text-brand-red transition-colors">
                    {itemTitle}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] sm:text-xs text-gray-400 font-mono">{year || "Lançamento"}</span>
                    <span className="text-[9px] text-brand-red bg-brand-red/10 px-1 py-0.2 rounded uppercase font-bold tracking-wider scale-90">
                      {mediaType === "movie" ? "FILME" : "SÉRIE"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-20 bg-black/80 hover:bg-brand-red hover:text-white border border-white/5 rounded-l flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl cursor-pointer hidden md:flex"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
