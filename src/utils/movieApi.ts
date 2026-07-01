/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TMDBMediaItem, TMDBDetails, LiveChannel, TVEpisode } from "../types";

const CONFIG = {
  TMDB_API_KEY: "8b984a3678f4dee1723f21e7fe285715",
  TMDB_BASE_URL: "https://api.themoviedb.org/3",
};

// Original Live Channels with a few premium additions as value-added improvement
export const LIVE_CHANNELS: LiveChannel[] = [
  // Entretenimento
  { nome: "AXN", url: "https://superflixapi.rest/canal/axn", icon: "🎬", categoria: "entretenimento" },
  { nome: "Cinemax", url: "https://superflixapi.rest/canal/cinemax", icon: "🎥", categoria: "entretenimento" },
  { nome: "Disney Channel", url: "https://superflixapi.rest/canal/disney", icon: "🏰", categoria: "entretenimento" },
  { nome: "Disney Channel 2", url: "https://superflixapi.rest/canal/disney-2", icon: "🏰", categoria: "entretenimento" },
  { nome: "Disney Channel 3", url: "https://superflixapi.rest/canal/disney-3", icon: "🏰", categoria: "entretenimento" },
  { nome: "HBO Max TV", url: "https://superflixapi.rest/canal/hbo", icon: "💎", categoria: "entretenimento" },
  { nome: "Telecine Premium", url: "https://superflixapi.rest/canal/telecinepremium", icon: "🍿", categoria: "entretenimento" },

  // Infantil
  { nome: "Cartoon Network", url: "https://superflixapi.rest/canal/cartoon-network", icon: "🎯", categoria: "infantil" },
  { nome: "Cartoonito", url: "https://superflixapi.rest/canal/cartoonito", icon: "🧸", categoria: "infantil" },
  { nome: "Discovery Kids", url: "https://superflixapi.rest/canal/discoverykids", icon: "🦕", categoria: "infantil" },
  { nome: "Anime TV", url: "https://superflixapi.rest/canal/animetv", icon: "🇯🇵", categoria: "infantil" },
  { nome: "As Meninas Superpoderosas 24h", url: "https://superflixapi.rest/canal/24h-as-meninas-superpoderosas", icon: "💪", categoria: "infantil" },
  { nome: "Nickelodeon", url: "https://superflixapi.rest/canal/nickelodeon", icon: "🍍", categoria: "infantil" },

  // Notícias
  { nome: "BandNews", url: "https://superflixapi.rest/canal/bandnews", icon: "📰", categoria: "noticias" },
  { nome: "CNN Brasil", url: "https://superflixapi.rest/canal/cnnbrasil", icon: "📡", categoria: "noticias" },
  { nome: "GloboNews", url: "https://superflixapi.rest/canal/globonews", icon: "🎙️", categoria: "noticias" },
  { nome: "Jovem Pan News", url: "https://superflixapi.rest/canal/jovempannews", icon: "📻", categoria: "noticias" },
  { nome: "Record News", url: "https://superflixapi.rest/canal/recordnews", icon: "📺", categoria: "noticias" },
  { nome: "SBT News", url: "https://superflixapi.rest/canal/sbtnews", icon: "⚡", categoria: "noticias" }
];

// High quality fallback list of movies
const MOCK_MOVIES: TMDBMediaItem[] = [
  {
    id: 1011989,
    title: "Duna: Parte Dois",
    release_date: "2024-02-27",
    poster_path: "https://image.tmdb.org/t/p/w500/op79ZfSscOqgZ4N79fE3vJ5mPcl.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/xOMo8v6m9uH96v436766i67YnZ0.jpg",
    overview: "Paul Atreides se une a Chani e aos Fremen em busca de vingança contra os conspiradores que destruíram sua família. Enfrentando uma escolha entre o amor de sua vida e o destino do universo, ele se esforça para evitar um futuro terrível que só ele pode prever.",
    vote_average: 8.4,
    media_type: "movie"
  },
  {
    id: 872585,
    title: "Oppenheimer",
    release_date: "2023-07-19",
    poster_path: "https://image.tmdb.org/t/p/w500/8Gxv2gSjdh16XvG7ubZz7g60Y3V.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/fm6a0zo2oYIIXOA4CH9gSIgdX2j.jpg",
    overview: "O físico J. Robert Oppenheimer trabalha com uma equipe de cientistas durante o Projeto Manhattan, levando ao desenvolvimento da bomba atômica.",
    vote_average: 8.1,
    media_type: "movie"
  },
  {
    id: 533535,
    title: "Deadpool & Wolverine",
    release_date: "2024-07-24",
    poster_path: "https://image.tmdb.org/t/p/w500/ooatZfSscOqgZ4N79fE3vJ5mPcl.jpg", // placeholder if broken
    backdrop_path: "https://image.tmdb.org/t/p/original/yD1byEq6Zfve77v0Y7gSIHpxSAn.jpg",
    overview: "Um apático Wade Wilson trabalha na vida civil. Seus dias como o mercenário moralmente flexível, Deadpool, ficaram para trás. Quando seu planeta natal enfrenta uma ameaça existencial, Wade relutantemente deve vestir o traje novamente com um Wolverine ainda mais relutante.",
    vote_average: 7.9,
    media_type: "movie"
  },
  {
    id: 157336,
    title: "Interestelar",
    release_date: "2014-11-05",
    poster_path: "https://image.tmdb.org/t/p/w500/gEU2v646vU6J6g6g6vUNs3p50Pcl.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/xJHokZBljv6Z186M7gS769ecb65.jpg",
    overview: "As reservas naturais da Terra estão se esgotando e um grupo de astronautas recebe a missão de verificar possíveis planetas habitáveis para salvar a humanidade.",
    vote_average: 8.4,
    media_type: "movie"
  },
  {
    id: 27205,
    title: "A Origem",
    release_date: "2010-07-14",
    poster_path: "https://image.tmdb.org/t/p/w500/9gk7adHYeHCptX09S6iEw6Ygo9t.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/s3TBrRGB197gTHGgN3676k67yNS.jpg",
    overview: "Dom Cobb é um ladrão habilidoso, o melhor na arte perigosa da extração: roubar segredos valiosos do fundo do subconsciente durante o estado de sonho.",
    vote_average: 8.3,
    media_type: "movie"
  },
  {
    id: 634649,
    title: "Homem-Aranha: Sem Volta para Casa",
    release_date: "2021-12-15",
    poster_path: "https://image.tmdb.org/t/p/w500/f89U7Sg7u2YCs3p50pCLm6nNSsc.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/149gSjdh16XvG7ubZz7g60Y3VL.jpg",
    overview: "Peter Parker tem sua identidade secreta revelada e pede ajuda ao Doutor Estranho. No entanto, o feitiço dá errado e traz vilões de outros universos para o dele.",
    vote_average: 8.0,
    media_type: "movie"
  }
];

// High quality fallback list of shows
const MOCK_SERIES: TMDBMediaItem[] = [
  {
    id: 1396,
    name: "Breaking Bad",
    first_air_date: "2008-01-20",
    poster_path: "https://image.tmdb.org/t/p/w500/gg9pW6V4367v0Y7gSIHpxSAssn.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/9faAnmLLvQIsNqA676mS769gcl.jpg",
    overview: "Um professor de química do ensino médio com câncer terminal se associa a um ex-aluno para fabricar e vender metanfetamina, a fim de garantir o futuro financeiro de sua família.",
    vote_average: 8.9,
    media_type: "tv"
  },
  {
    id: 1399,
    name: "Game of Thrones",
    first_air_date: "2011-04-17",
    poster_path: "https://image.tmdb.org/t/p/w500/1XSqvY6v4367v0Y7gSIHpxSAtv.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/u3b9Wv6m9uH96v436766i67YnZ0.jpg",
    overview: "Em uma terra onde os verões duram décadas e os invernos uma eternidade, várias famílias nobres travam uma guerra mortal pelo controle do Trono de Ferro.",
    vote_average: 8.4,
    media_type: "tv"
  },
  {
    id: 66732,
    name: "Stranger Things",
    first_air_date: "2016-07-15",
    poster_path: "https://image.tmdb.org/t/p/w500/49Wp6V4367v0Y7gSIHpxSAz9p.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/56v2gSjdh16XvG7ubZz7g60Y3Vd.jpg",
    overview: "Quando um jovem garoto desaparece no nada, uma pequena cidade descobre um mistério envolvendo experimentos secretos, forças sobrenaturais aterrorizantes e uma estranha garota.",
    vote_average: 8.6,
    media_type: "tv"
  },
  {
    id: 100088,
    name: "The Last of Us",
    first_air_date: "2023-01-15",
    poster_path: "https://image.tmdb.org/t/p/w500/u3b9Wv6m9uH96v436766i67YnZ.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/2vgSjdh16XvG7ubZz7g60Y3V77.jpg",
    overview: "Vinte anos após a destruição da civilização moderna, Joel é contratado para contrabandear Ellie, uma jovem de 14 anos, de uma zona de quarentena opressiva.",
    vote_average: 8.7,
    media_type: "tv"
  },
  {
    id: 70523,
    name: "Dark",
    first_air_date: "2017-12-01",
    poster_path: "https://image.tmdb.org/t/p/w500/apb9Wv6m9uH96v436766i67YnZa.jpg",
    backdrop_path: "https://image.tmdb.org/t/p/original/3TBrRGB197gTHGgN3676k67yNSu.jpg",
    overview: "O desaparecimento de duas crianças em uma pequena cidade alemã expõe as relações duplas e fraturadas entre quatro famílias, revelando um mistério que abrange três gerações.",
    vote_average: 8.4,
    media_type: "tv"
  }
];

// Helper to translate mock layout items to standard format
export function mapItemToDetails(item: TMDBMediaItem): TMDBDetails {
  return {
    id: item.id,
    title: item.title,
    name: item.name,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview,
    vote_average: item.vote_average || 7.0,
    number_of_seasons: item.media_type === "tv" ? 5 : undefined,
    genres: [{ id: 18, name: item.media_type === "tv" ? "Drama" : "Ficção Científica" }, { id: 28, name: "Ação" }]
  };
}

async function fetchTMDB(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${CONFIG.TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", CONFIG.TMDB_API_KEY);
  url.searchParams.append("language", "pt-BR");
  Object.keys(params).forEach(key => url.searchParams.append(key, String(params[key])));
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Failed to fetch from TMDB, using fallback", error);
    return null;
  }
}

export async function getTrending(page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
  const data = await fetchTMDB("/trending/all/week", { page });
  if (data && data.results && data.results.length > 0) {
    return { results: data.results, total_pages: data.total_pages || 10 };
  }
  // Fallback
  return { results: [...MOCK_MOVIES, ...MOCK_SERIES], total_pages: 1 };
}

export async function getPopularMovies(page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
  const data = await fetchTMDB("/movie/popular", { page });
  if (data && data.results && data.results.length > 0) {
    return { results: data.results, total_pages: data.total_pages || 10 };
  }
  return { results: MOCK_MOVIES, total_pages: 1 };
}

export async function getPopularTVShows(page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
  const data = await fetchTMDB("/tv/popular", { page });
  if (data && data.results && data.results.length > 0) {
    return { results: data.results, total_pages: data.total_pages || 10 };
  }
  return { results: MOCK_SERIES, total_pages: 1 };
}

export async function getTopRatedMovies(page = 1): Promise<{ results: TMDBMediaItem[]; total_pages: number }> {
  const data = await fetchTMDB("/movie/top_rated", { page });
  if (data && data.results && data.results.length > 0) {
    return { results: data.results, total_pages: data.total_pages || 10 };
  }
  return { results: MOCK_MOVIES.sort((a,b) => (b.vote_average || 0) - (a.vote_average || 0)), total_pages: 1 };
}

export async function getMovieDetails(id: number): Promise<TMDBDetails | null> {
  const data = await fetchTMDB(`/movie/${id}`);
  if (data) return data;
  
  const local = MOCK_MOVIES.find(m => m.id === id);
  return local ? mapItemToDetails(local) : null;
}

export async function getTVShowDetails(id: number): Promise<TMDBDetails | null> {
  const data = await fetchTMDB(`/tv/${id}`);
  if (data) return data;
  
  const local = MOCK_SERIES.find(s => s.id === id);
  return local ? mapItemToDetails(local) : null;
}

export async function getTVSeasonDetails(id: number, season: number): Promise<{ episodes: TVEpisode[] } | null> {
  const data = await fetchTMDB(`/tv/${id}/season/${season}`);
  if (data && data.episodes) return data;
  
  // Custom fallback episode generator for fluid mock interface
  const mockEpisodes: TVEpisode[] = Array.from({ length: 10 }, (_, i) => ({
    episode_number: i + 1,
    name: `Episódio ${i + 1}: Mistérios Descobertos`,
    overview: `Um desenrolar fascinante dos acontecimentos na temporada ${season}. Os personagens enfrentam novas reviravoltas e revelações impactantes que mudarão seus caminhos para sempre.`
  }));
  return { episodes: mockEpisodes };
}

export async function searchMulti(query: string, page = 1): Promise<{ results: TMDBMediaItem[] } | null> {
  const data = await fetchTMDB("/search/multi", { query, page });
  if (data && data.results) return data;
  
  // Local filtered search fallback
  const normalizedQuery = query.toLowerCase();
  const filteredMovies = MOCK_MOVIES.filter(m => (m.title || "").toLowerCase().includes(normalizedQuery));
  const filteredSeries = MOCK_SERIES.filter(s => (s.name || "").toLowerCase().includes(normalizedQuery));
  return { results: [...filteredMovies, ...filteredSeries] };
}
