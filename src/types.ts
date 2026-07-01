/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "admin" | "user";
export type UserStatus = "aprovado" | "pendente_pagamento" | "expirado" | "pendente_aprovacao";

export interface User {
  id: string;
  nome: string;
  email: string;
  senha?: string; // stored hashed, optional when rendering
  status: UserStatus;
  role: UserRole;
  plano?: "mensal" | "anual";
  plano_validade?: string; // ISO date string
  avatar: string;
  data_cadastro: string; // ISO date string
}

export interface Payment {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  plano: "mensal" | "anual";
  metodo: "emola" | "mpesa";
  nomeTransferencia: string;
  valor: number;
  status: "pendente" | "aprovado";
  data_pagamento: string;
}

export interface FavoriteItem {
  id: number;
  type: "movie" | "tv" | "channel";
  title: string;
  poster: string;
  backdrop?: string;
}

export interface HistoryItem {
  id: string | number;
  type: "movie" | "tv" | "channel";
  title: string;
  poster: string;
  watchedAt: string;
  season?: number;
  episode?: number;
}

export interface PlanDetails {
  nome: string;
  preco: number;
  dias: number;
  emola: string;
  mpesa: string;
  features: string[];
}

export interface LiveChannel {
  nome: string;
  url: string;
  icon: string;
  categoria: "entretenimento" | "infantil" | "noticias";
}

export interface TMDBMediaItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  vote_average?: number;
  media_type?: "movie" | "tv";
  genre_ids?: number[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBDetails {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  vote_average: number;
  number_of_seasons?: number;
  genres?: TMDBGenre[];
}

export interface TVEpisode {
  episode_number: number;
  name: string;
  overview?: string;
  still_path?: string;
}
