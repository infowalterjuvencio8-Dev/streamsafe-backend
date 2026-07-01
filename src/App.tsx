/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Tv,
  Search,
  Lock,
  Heart,
  Calendar,
  Star,
  Play,
  Info,
  ChevronRight,
  Shield,
  Clock,
  Check,
  AlertTriangle,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Bookmark,
  ListPlus
} from "lucide-react";
import { User, Payment, FavoriteItem, HistoryItem, TMDBMediaItem, TMDBDetails, TVEpisode, LiveChannel } from "./types";
import {
  hashPassword,
  exportToTXT,
  PLANOS
} from "./utils/db";
import {
  getTrending,
  getPopularMovies,
  getPopularTVShows,
  getTopRatedMovies,
  getMovieDetails,
  getTVShowDetails,
  getTVSeasonDetails,
  searchMulti,
  LIVE_CHANNELS
} from "./utils/movieApi";

// Modular React Components
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MediaCarousel from "./components/MediaCarousel";
import LiveChannels from "./components/LiveChannels";
import AdminPanel from "./components/AdminPanel";
import PlayerModal from "./components/PlayerModal";

function getRecommendations(
  allMedia: TMDBMediaItem[],
  history: HistoryItem[],
  favorites: FavoriteItem[],
  watchlist: FavoriteItem[]
): TMDBMediaItem[] {
  if (history.length === 0 && favorites.length === 0 && watchlist.length === 0) {
    return allMedia.slice(0, 8);
  }

  const simulatedActors: Record<number, string[]> = {
    1011989: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
    872585: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
    533535: ["Ryan Reynolds", "Hugh Jackman", "Morena Baccarin"],
    157336: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
    27205: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    634649: ["Tom Holland", "Zendaya", "Benedict Cumberbatch"],
    1396: ["Bryan Cranston", "Aaron Paul", "Bob Odenkirk"],
    1399: ["Emilia Clarke", "Kit Harington", "Peter Dinklage"],
    66732: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"],
    100088: ["Pedro Pascal", "Bella Ramsey", "Gabriel Luna"],
    70523: ["Louis Hofmann", "Lisa Vicari", "Maja Schöne"]
  };

  const userGenres = new Map<number, number>();
  const userActors = new Map<string, number>();

  favorites.forEach((f) => {
    const detailId = Number(f.id);
    const actors = simulatedActors[detailId] || [];
    actors.forEach((a) => userActors.set(a, (userActors.get(a) || 0) + 3));

    if (f.type === "movie") {
      userGenres.set(28, (userGenres.get(28) || 0) + 2);
      userGenres.set(878, (userGenres.get(878) || 0) + 2);
    } else {
      userGenres.set(18, (userGenres.get(18) || 0) + 2);
    }
  });

  watchlist.forEach((w) => {
    const detailId = Number(w.id);
    const actors = simulatedActors[detailId] || [];
    actors.forEach((a) => userActors.set(a, (userActors.get(a) || 0) + 2));

    if (w.type === "movie") {
      userGenres.set(12, (userGenres.get(12) || 0) + 1);
    } else {
      userGenres.set(18, (userGenres.get(18) || 0) + 1);
    }
  });

  history.forEach((h) => {
    const detailId = Number(h.id);
    const actors = simulatedActors[detailId] || [];
    actors.forEach((a) => userActors.set(a, (userActors.get(a) || 0) + 1));

    if (h.type === "movie") {
      userGenres.set(28, (userGenres.get(28) || 0) + 1);
    } else {
      userGenres.set(18, (userGenres.get(18) || 0) + 1);
    }
  });

  const scoredMedia = allMedia.map((item) => {
    let score = 0;
    const mediaId = Number(item.id);

    const itemGenres = item.genre_ids || [];
    if (itemGenres.length === 0) {
      if (item.media_type === "tv" || item.id > 1000) {
        itemGenres.push(18);
      } else {
        itemGenres.push(28, 878);
      }
    }

    itemGenres.forEach((gId) => {
      score += (userGenres.get(gId) || 0) * 2;
    });

    const itemActors = simulatedActors[mediaId] || [];
    itemActors.forEach((actor) => {
      score += (userActors.get(actor) || 0) * 4;
    });

    const inHistory = history.some((h) => Number(h.id) === mediaId);
    if (inHistory) {
      score -= 5;
    }

    score += (item.vote_average || 7.0) * 0.5;

    return { item, score };
  });

  scoredMedia.sort((a, b) => b.score - a.score);
  return scoredMedia.map((sm) => sm.item).slice(0, 8);
}

export default function App() {
  // Authentication & View states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "canais" | "admin" | "search">("home");
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbPayments, setDbPayments] = useState<Payment[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBMediaItem[]>([]);

  // Registration states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regNome, setRegNome] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regSenha, setRegSenha] = useState("");

  const [step, setStep] = useState<"register" | "plan" | "payment">("register");
  const [selectedPlan, setSelectedPlan] = useState<"mensal" | "anual">("mensal");
  const [transferName, setTransferName] = useState("");
  const [paymentMetodo, setPaymentMetodo] = useState<"emola" | "mpesa">("mpesa");
  const [tempRegisteredUser, setTempRegisteredUser] = useState<User | null>(null);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");

  // User Profile lists
  const [userFavorites, setUserFavorites] = useState<FavoriteItem[]>([]);
  const [userWatchlist, setUserWatchlist] = useState<FavoriteItem[]>([]);
  const [userHistoryList, setUserHistoryList] = useState<HistoryItem[]>([]);


  // Media loading hooks
  const [featuredMedia, setFeaturedMedia] = useState<TMDBMediaItem | null>(null);
  const [trendingList, setTrendingList] = useState<TMDBMediaItem[]>([]);
  const [moviesList, setMoviesList] = useState<TMDBMediaItem[]>([]);
  const [seriesList, setSeriesList] = useState<TMDBMediaItem[]>([]);
  const [topRatedList, setTopRatedList] = useState<TMDBMediaItem[]>([]);

  const computedRecommendations = React.useMemo(() => {
    // Combine all unique catalog items
    const allCatalog = Array.from(
      new Map(
        [...trendingList, ...moviesList, ...seriesList, ...topRatedList].map((x) => [x.id, x])
      ).values()
    );
    return getRecommendations(allCatalog, userHistoryList, userFavorites, userWatchlist);
  }, [trendingList, moviesList, seriesList, topRatedList, userHistoryList, userFavorites, userWatchlist]);

  const favsForCarousel = React.useMemo(() => {
    return userFavorites.map((f) => ({
      id: Number(f.id),
      title: f.type === "movie" ? f.title : undefined,
      name: f.type === "tv" ? f.title : undefined,
      poster_path: f.poster,
      backdrop_path: f.backdrop || null,
      media_type: f.type === "tv" ? "tv" as const : "movie" as const,
    }));
  }, [userFavorites]);

  const watchlistForCarousel = React.useMemo(() => {
    return userWatchlist.map((w) => ({
      id: Number(w.id),
      title: w.type === "movie" ? w.title : undefined,
      name: w.type === "tv" ? w.title : undefined,
      poster_path: w.poster,
      backdrop_path: w.backdrop || null,
      media_type: w.type === "tv" ? "tv" as const : "movie" as const,
    }));
  }, [userWatchlist]);

  // Detailed Modal states
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"movie" | "tv" | null>(null);
  const [mediaDetails, setMediaDetails] = useState<TMDBDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);



  // Series Season structures
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<TVEpisode[]>([]);

  // Player overlay states
  const [activePlayer, setActivePlayer] = useState<{
    isOpen: boolean;
    contentId: string | number;
    type: "movie" | "tv" | "channel";
    title: string;
    season?: number;
    episode?: number;
  }>({
    isOpen: false,
    contentId: "",
    type: "movie",
    title: "",
  });

  // User details overlay
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

  // Toast Alert state
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Show customized floating notification
  const triggerToast = (msg: string, isErr = false) => {
    setToast({ message: msg, isError: isErr });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Perform standard db and catalog load on mounting
  useEffect(() => {
    async function loadInitialData() {
      try {
        const resUsers = await fetch("/api/users");
        const loadedUsers = await resUsers.json();
        setDbUsers(loadedUsers);

        const resPayments = await fetch("/api/payments");
        const loadedPayments = await resPayments.json();
        setDbPayments(loadedPayments);

        // Verify session
        const sessionStr = localStorage.getItem("streamsafe_session_v2");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            const sRes = await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: session.userId })
            });

            if (sRes.ok) {
              const userObj = await sRes.json();
              if (userObj.plano_validade && new Date(userObj.plano_validade) < new Date()) {
                userObj.status = "expirado";
                // Update on server
                await fetch(`/api/users/${userObj.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "expirado" })
                });
                triggerToast("A validade da sua assinatura expirou! Por favor, renove.", true);
              } else if (userObj.status === "aprovado") {
                setCurrentUser(userObj);
                setCurrentView("home");
              }
            } else {
              localStorage.removeItem("streamsafe_session_v2");
            }
          } catch (e) {
            localStorage.removeItem("streamsafe_session_v2");
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do servidor:", err);
      }
    }

    loadInitialData();
    // Load home galleries
    loadCatalog();
  }, []);

  // Synchronize favorites, watchlist, and history state when active user changes
  useEffect(() => {
    async function loadUserLists() {
      if (currentUser) {
        try {
          const resFavs = await fetch(`/api/favorites/${currentUser.id}`);
          if (resFavs.ok) setUserFavorites(await resFavs.json());

          const resWatch = await fetch(`/api/watchlist/${currentUser.id}`);
          if (resWatch.ok) setUserWatchlist(await resWatch.json());

          const resHist = await fetch(`/api/history/${currentUser.id}`);
          if (resHist.ok) setUserHistoryList(await resHist.json());
        } catch (err) {
          console.error("Erro ao carregar listas do usuário:", err);
        }
      } else {
        setUserFavorites([]);
        setUserWatchlist([]);
        setUserHistoryList([]);
      }
    }
    loadUserLists();
  }, [currentUser]);

  // Fetch TMDB sections asynchronously
  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const trending = await getTrending();
      const movies = await getPopularMovies();
      const tvShows = await getPopularTVShows();
      const topRated = await getTopRatedMovies();

      setTrendingList(trending.results);
      setMoviesList(movies.results);
      setSeriesList(tvShows.results);
      setTopRatedList(topRated.results);

      if (trending.results && trending.results.length > 0) {
        setFeaturedMedia(trending.results[0]);
      }
    } catch (e) {
      console.error("Catalog load error", e);
    }
    setIsLoading(false);
  };

  // When selected media changes, load TMDB details
  useEffect(() => {
    if (selectedMediaId && selectedMediaType) {
      const fetchDetails = async () => {
        setIsLoading(true);
        try {
          let details: TMDBDetails | null = null;
          if (selectedMediaType === "movie") {
            details = await getMovieDetails(selectedMediaId);
          } else {
            details = await getTVShowDetails(selectedMediaId);
          }

          if (details) {
            setMediaDetails(details);
            setIsDetailsOpen(true);

            // If it is a show, automatically load Season 1 episodes list
            if (selectedMediaType === "tv") {
              setSelectedSeason(1);
              setSelectedEpisode(1);
              const seasonObj = await getTVSeasonDetails(selectedMediaId, 1);
              if (seasonObj && seasonObj.episodes) {
                setSeasonEpisodes(seasonObj.episodes);
              }
            }
          } else {
            triggerToast("Erro ao encontrar informações deste título.", true);
          }
        } catch (e) {
          triggerToast("Falha de conexão com a API.", true);
        }
        setIsLoading(false);
      };

      fetchDetails();
    }
  }, [selectedMediaId, selectedMediaType]);

  // Load selected season episode items
  const handleSeasonChange = async (seasonNum: number) => {
    if (!selectedMediaId) return;
    setSelectedSeason(seasonNum);
    setSelectedEpisode(1);
    setIsLoading(true);
    try {
      const seasonObj = await getTVSeasonDetails(selectedMediaId, seasonNum);
      if (seasonObj && seasonObj.episodes) {
        setSeasonEpisodes(seasonObj.episodes);
      }
    } catch (e) {
      triggerToast("Erro ao carregar episódios da temporada.", true);
    }
    setIsLoading(false);
  };

  // Query Search engine
  const handleSearchSubmit = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setCurrentView("home");
      return;
    }
    setCurrentView("search");
    setIsLoading(true);
    try {
      const results = await searchMulti(query);
      if (results && results.results) {
        setSearchResults(results.results.filter((r) => r.media_type === "movie" || r.media_type === "tv"));
      }
    } catch (e) {
      triggerToast("Falha ao buscar conteúdo.", true);
    }
    setIsLoading(false);
  };

  // Authenticate user
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginSenha) {
      triggerToast("Introduza as suas credenciais no formulário!", true);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, senha: loginSenha })
      });

      if (!response.ok) {
        const err = await response.json();
        triggerToast(err.error || "Endereço de email não localizado ou senha incorreta!", true);
        return;
      }

      const matched = await response.json();

      if (matched.status === "pendente_pagamento" || matched.status === "pendente_aprovacao") {
        triggerToast("⏳ Sua conta foi criada, mas está pendente de aprovação pelo Administrador. Por favor, tente novamente após a aprovação.", true);
        return;
      }

      if (matched.status === "expirado") {
        triggerToast("A sua assinatura StreamSafe expirou! Renove para usufruir.", true);
        return;
      }

      // Success login
      localStorage.setItem("streamsafe_session_v2", JSON.stringify({ userId: matched.id }));
      setCurrentUser(matched);
      setCurrentView("home");
      setLoginEmail("");
      setLoginSenha("");
      triggerToast(`Boas-vindas de volta, ${matched.nome}!`);
    } catch (err) {
      console.error(err);
      triggerToast("Erro de conexão com o servidor.", true);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("streamsafe_session_v2");
    setCurrentUser(null);
    setCurrentView("home");
    setIsProfileOpen(false);
    setIsChangePasswordOpen(false);
    triggerToast("Sessão encerrada com sucesso.");
  };

  // Register action sequence
  const startAccountRegister = () => {
    if (!regNome || !regEmail || !regSenha) {
      triggerToast("Insira o seu nome, email e senha de acesso!", true);
      return;
    }

    if (regSenha.length < 6) {
      triggerToast("A senha necessita ter no mínimo 6 caracteres!", true);
      return;
    }

    // Verify duplication
    if (dbUsers.find((u) => u.email === regEmail)) {
      triggerToast("Este endereço de email já se encontra registrado!", true);
      return;
    }

    // Cache user object temporarily as pending approval
    const cachedUser: User = {
      id: Date.now().toString(),
      nome: regNome,
      email: regEmail,
      senha: hashPassword(regSenha),
      status: "pendente_aprovacao",
      role: "user",
      avatar: regNome.charAt(0).toUpperCase(),
      data_cadastro: new Date().toISOString(),
    };

    setTempRegisteredUser(cachedUser);
    setStep("plan");
  };

  // Finalize payment request
  const handlePaymentCheckout = async () => {
    if (!transferName.trim()) {
      triggerToast("Introduza o nome da pessoa na transferência M-PESA/EMOLA!", true);
      return;
    }

    if (!tempRegisteredUser) return;

    // Create payment object
    const pendingTrans: Payment = {
      id: Date.now().toString(),
      usuarioId: tempRegisteredUser.id,
      usuarioNome: tempRegisteredUser.nome,
      usuarioEmail: tempRegisteredUser.email,
      plano: selectedPlan,
      metodo: paymentMetodo,
      nomeTransferencia: transferName,
      valor: PLANOS[selectedPlan].preco,
      status: "pendente",
      data_pagamento: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment: pendingTrans, tempUser: tempRegisteredUser })
      });

      if (!response.ok) {
        const err = await response.json();
        triggerToast(err.error || "Erro ao processar o registro.", true);
        return;
      }

      // Update local states
      setDbUsers([...dbUsers, tempRegisteredUser]);
      setDbPayments([...dbPayments, pendingTrans]);

      // Dynamic browser TXT receipt creation
      exportToTXT(pendingTrans, tempRegisteredUser);

      // Cleanup signup states
      setRegNome("");
      setRegEmail("");
      setRegSenha("");
      setTransferName("");
      setIsRegisterOpen(false);
      setStep("register");
      setTempRegisteredUser(null);

      triggerToast("✅ Comprovante emitido! Aguardando aprovação administrativa.", false);
    } catch (err) {
      console.error(err);
      triggerToast("Falha de rede ao tentar registrar inscrição.", true);
    }
  };

  // ADMIN ACTIONS IMPLEMENTATION
  const handleApprovePayment = async (paymentId: string) => {
    const payment = dbPayments.find((p) => p.id === paymentId);
    if (!payment) return;

    const days = PLANOS[payment.plano].dias;
    const plano_validade = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    try {
      const response = await fetch(`/api/payments/${paymentId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: payment.plano, plano_validade })
      });

      if (!response.ok) {
        triggerToast("Falha ao aprovar o pagamento no servidor.", true);
        return;
      }

      // Reload users and payments from server
      const resUsers = await fetch("/api/users");
      setDbUsers(await resUsers.json());

      const resPayments = await fetch("/api/payments");
      setDbPayments(await resPayments.json());

      triggerToast(`Inscrição do usuário ativada com sucesso!`);
    } catch (err) {
      console.error(err);
      triggerToast("Erro de conexão ao aprovar pagamento.", true);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/reject`, {
        method: "PUT"
      });

      if (!response.ok) {
        triggerToast("Falha ao rejeitar o pagamento no servidor.", true);
        return;
      }

      // Reload
      const resUsers = await fetch("/api/users");
      setDbUsers(await resUsers.json());

      const resPayments = await fetch("/api/payments");
      setDbPayments(await resPayments.json());

      triggerToast("Registros cancelados pela administração.", true);
    } catch (err) {
      console.error(err);
      triggerToast("Erro de conexão ao rejeitar pagamento.", true);
    }
  };

  const handleAddUserByAdmin = async (adminUserObj: Omit<User, "id" | "data_cadastro" | "avatar">) => {
    const key = adminUserObj.plano || "mensal";
    const days = PLANOS[key].dias;

    const brandNew: User = {
      ...adminUserObj,
      id: Date.now().toString(),
      senha: hashPassword(adminUserObj.senha || "123456"),
      avatar: adminUserObj.nome.charAt(0).toUpperCase(),
      data_cadastro: new Date().toISOString(),
      plano_validade: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandNew)
      });

      if (!response.ok) {
        const err = await response.json();
        triggerToast(err.error || "Falha ao adicionar usuário no servidor.", true);
        return;
      }

      setDbUsers([...dbUsers, brandNew]);
      triggerToast(`Membro ${brandNew.nome} adicionado diretamente pela mesa.`);
    } catch (err) {
      console.error(err);
      triggerToast("Erro de conexão ao adicionar usuário.", true);
    }
  };

  const handleEditUserByAdmin = async (userId: string, updatedParams: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedParams)
      });

      if (!response.ok) {
        triggerToast("Falha ao atualizar dados no servidor.", true);
        return;
      }

      const rawUsers = dbUsers.map((u) => u.id === userId ? { ...u, ...updatedParams } : u);
      setDbUsers(rawUsers);
      triggerToast("Informações atualizadas com sucesso.");
    } catch (err) {
      console.error(err);
      triggerToast("Erro de conexão ao editar usuário.", true);
    }
  };

  const handleDeleteUserByAdmin = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        triggerToast("Falha ao remover usuário do servidor.", true);
        return;
      }

      const nextUsers = dbUsers.filter((u) => u.id !== userId);
      setDbUsers(nextUsers);
      triggerToast("Cadastro removido permanentemente.", true);
    } catch (err) {
      console.error(err);
      triggerToast("Erro de conexão ao remover usuário.", true);
    }
  };

  const handleRenewUserSubscription = async (userId: string) => {
    const item = dbUsers.find((u) => u.id === userId);
    if (!item) return;

    const planKey = item.plano || "mensal";
    const duration = PLANOS[planKey].dias;
    const plano_validade = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "aprovado", plano_validade })
      });

      if (!response.ok) {
        triggerToast("Falha ao renovar assinatura no servidor.", true);
        return;
      }

      const rawUsers = dbUsers.map((u) => u.id === userId ? { ...u, status: "aprovado", plano_validade } : u);
      setDbUsers(rawUsers);
      triggerToast(`Validade de plano para ${item.nome} estendida.`);
    } catch (err) {
      console.error(err);
      triggerToast("Erro de conexão ao renovar assinatura.", true);
    }
  };

  // CHANGE PASSWORD IN APP PROFILE
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      triggerToast("Preencha todos os campos do formulário de segurança!", true);
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      triggerToast("A nova senha e a de confirmação diferem!", true);
      return;
    }

    try {
      const response = await fetch(`/api/users/${currentUser.id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput
        })
      });

      if (!response.ok) {
        const err = await response.json();
        triggerToast(err.error || "A senha atual digitada está incorreta!", true);
        return;
      }

      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      setIsChangePasswordOpen(false);
      triggerToast("Senha corporativa atualizada com sucesso.");
    } catch (err) {
      console.error(err);
      triggerToast("Erro de conexão ao atualizar senha.", true);
    }
  };

  // Play Content logic inside React
  const handlePlayContent = async (id: number | string, type: "movie" | "tv" | "channel", title: string) => {
    if (!currentUser) {
      triggerToast("🔒 Você precisa estar logado para assistir!", true);
      return;
    }

    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      type,
      title,
      poster: type === "channel" ? "" : mediaDetails?.poster_path || "",
      watchedAt: new Date().toISOString(),
      season: type === "tv" ? selectedSeason : undefined,
      episode: type === "tv" ? selectedEpisode : undefined,
    };

    try {
      // Save to backend history
      await fetch(`/api/history/${currentUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: historyItem.id,
          mediaId: id,
          type,
          title,
          poster: historyItem.poster,
          watchedAt: historyItem.watchedAt,
          season: historyItem.season,
          episode: historyItem.episode
        })
      });

      const resHist = await fetch(`/api/history/${currentUser.id}`);
      if (resHist.ok) setUserHistoryList(await resHist.json());
    } catch (err) {
      console.error("Erro ao registrar no histórico:", err);
    }

    // Active screen modal player state toggle
    setActivePlayer({
      isOpen: true,
      contentId: id,
      type,
      title: type === "tv" ? `${title} (S${selectedSeason}E${selectedEpisode})` : title,
      season: type === "tv" ? selectedSeason : undefined,
      episode: type === "tv" ? selectedEpisode : undefined,
    });
  };

  // Favorites trigger
  const handleToggleFavorite = async () => {
    if (!currentUser || !mediaDetails) return;

    const typeLabel = selectedMediaType || "movie";
    const exists = userFavorites.find((f) => f.id === mediaDetails.id && f.type === typeLabel);

    try {
      if (exists) {
        const response = await fetch(`/api/favorites/${currentUser.id}/${mediaDetails.id}`, {
          method: "DELETE"
        });
        if (response.ok) {
          setUserFavorites(userFavorites.filter((f) => !(f.id === mediaDetails.id && f.type === typeLabel)));
          triggerToast("Removido dos favoritos.", true);
        }
      } else {
        const poster = mediaDetails.poster_path
          ? `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
          : "https://via.placeholder.com/300x450?text=StreamSafe";

        const newItem: FavoriteItem = {
          id: mediaDetails.id,
          type: typeLabel,
          title: mediaDetails.title || mediaDetails.name || "Título",
          poster,
          backdrop: mediaDetails.backdrop_path,
        };

        const response = await fetch(`/api/favorites/${currentUser.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem)
        });

        if (response.ok) {
          setUserFavorites([...userFavorites, newItem]);
          triggerToast("Adicionado aos favoritos!");
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast("Erro ao atualizar favoritos.", true);
    }
  };

  // Watchlist trigger
  const handleToggleWatchlist = async () => {
    if (!currentUser || !mediaDetails) return;

    const typeLabel = selectedMediaType || "movie";
    const exists = userWatchlist.find((f) => f.id === mediaDetails.id && f.type === typeLabel);

    try {
      if (exists) {
        const response = await fetch(`/api/watchlist/${currentUser.id}/${mediaDetails.id}`, {
          method: "DELETE"
        });
        if (response.ok) {
          setUserWatchlist(userWatchlist.filter((f) => !(f.id === mediaDetails.id && f.type === typeLabel)));
          triggerToast("Removido da lista de observação.", true);
        }
      } else {
        const poster = mediaDetails.poster_path
          ? `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
          : "https://via.placeholder.com/300x450?text=StreamSafe";

        const newItem: FavoriteItem = {
          id: mediaDetails.id,
          type: typeLabel,
          title: mediaDetails.title || mediaDetails.name || "Título",
          poster,
          backdrop: mediaDetails.backdrop_path,
        };

        const response = await fetch(`/api/watchlist/${currentUser.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem)
        });

        if (response.ok) {
          setUserWatchlist([...userWatchlist, newItem]);
          triggerToast("Adicionado à lista de observação!");
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast("Erro ao atualizar lista de observação.", true);
    }
  };



  // Channel streaming helper
  const handlePlayLiveChannel = (channel: LiveChannel) => {
    handlePlayContent(channel.url, "channel", channel.nome);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col antialiased selection:translate-y-1 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-indigo-900/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Toast floating notifications */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-in duration-300 ${
          toast.isError
            ? "bg-red-950/90 text-red-100 border-red-500/20"
            : "bg-emerald-950/90 text-emerald-100 border-emerald-500/20"
        }`}>
          {toast.isError ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Loading bar spacer */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-brand-red/10 overflow-hidden z-50">
          <div className="h-full bg-brand-red animate-[shimmer_1.5s_infinite]" style={{ width: "35%" }} />
        </div>
      )}

      {/* Top Header navbar navigation */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as any)}
        onSearchChange={handleSearchSubmit}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container Stage wrapper */}
      <main className="flex-1 pb-16">
        {currentUser ? (
          /* LOGGED USER SCREENS */
          currentView === "admin" && currentUser.email === "admin@streamsafe.com" ? (
            <AdminPanel
              users={dbUsers}
              payments={dbPayments}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
              onAddUser={handleAddUserByAdmin}
              onEditUser={handleEditUserByAdmin}
              onDeleteUser={handleDeleteUserByAdmin}
              onRenewUser={handleRenewUserSubscription}
            />
          ) : currentView === "canais" ? (
            <LiveChannels onSelectChannel={handlePlayLiveChannel} />

          ) : currentView === "search" ? (
            /* Custom Search View */
            <div className="py-8 max-w-7xl mx-auto px-4 md:px-8">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <h2 className="font-display font-bold text-xl md:text-2xl text-white">
                  Resultados para "{searchQuery}"
                </h2>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setCurrentView("home");
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Voltar ao início
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-20 bg-brand-card rounded-2xl border border-white/5">
                  <span className="text-4xl">🔍</span>
                  <p className="text-gray-400 mt-2">Nenhum filme ou série correspondente localizado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {searchResults.map((item) => {
                    const titleStr = item.title || item.name || "Título";
                    const poster = item.poster_path
                      ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                      : "https://via.placeholder.com/300x450?text=Sem+Cartaz";

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedMediaId(item.id);
                          setSelectedMediaType(item.media_type || "movie");
                        }}
                        className="group cursor-pointer transform hover:scale-[1.02] duration-200"
                      >
                        <div className="aspect-[2/3] w-full bg-brand-card rounded-xl overflow-hidden border border-white/5 relative shadow-lg">
                          <img src={poster} alt={titleStr} className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-semibold text-white truncate text-sm mt-2 group-hover:text-brand-red transition-colors">
                          {titleStr}
                        </h4>
                        <span className="text-[10px] text-brand-red bg-brand-red/10 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider mt-1 inline-block">
                          {item.media_type === "tv" ? "SÉRIE" : "FILME"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Home main Screen content showcases */
            <>


              {featuredMedia && (
                <Hero
                  featured={featuredMedia}
                  onPlay={(id, style, nome) => {
                    setSelectedMediaId(id);
                    setSelectedMediaType(style);
                    handlePlayContent(id, style, nome);
                  }}
                  onOpenDetails={(id, style) => {
                    setSelectedMediaId(id);
                    setSelectedMediaType(style);
                  }}
                />
              )}

              <div className="space-y-4 -mt-10 relative z-30">
                {/* Personalized Recommendations with explanation */}
                {computedRecommendations.length > 0 && (
                  <MediaCarousel
                    title={`${currentUser?.nome}, Recomendados Especiais para Você`}
                    items={computedRecommendations}
                    type="mixed"
                    icon={<Sparkles className="w-5 h-5 text-amber-400 fill-current animate-pulse" />}
                    onSelect={(id, kind) => {
                      setSelectedMediaId(id);
                      setSelectedMediaType(kind);
                    }}
                  />
                )}

                {/* Favorites Slider Row */}
                {userFavorites.length > 0 && (
                  <MediaCarousel
                    title="Meus Favoritos"
                    items={favsForCarousel}
                    type="mixed"
                    icon={<Heart className="w-5 h-5 text-brand-red fill-current" />}
                    onSelect={(id, kind) => {
                      setSelectedMediaId(id);
                      setSelectedMediaType(kind);
                    }}
                  />
                )}

                {/* Watchlist Slider Row */}
                {userWatchlist.length > 0 && (
                  <MediaCarousel
                    title="Minha Lista de Observação"
                    items={watchlistForCarousel}
                    type="mixed"
                    icon={<Bookmark className="w-5 h-5 text-teal-400 fill-current" />}
                    onSelect={(id, kind) => {
                      setSelectedMediaId(id);
                      setSelectedMediaType(kind);
                    }}
                  />
                )}

                <MediaCarousel
                  title="Em Alta esta Semana"
                  items={trendingList}
                  type="mixed"
                  icon={<TrendingUp className="w-5 h-5" />}
                  onSelect={(id, kind) => {
                    setSelectedMediaId(id);
                    setSelectedMediaType(kind);
                  }}
                />

                <MediaCarousel
                  title="Filmes Populares"
                  items={moviesList}
                  type="movie"
                  icon={<Play className="w-5 h-5 fill-current" />}
                  onSelect={(id, kind) => {
                    setSelectedMediaId(id);
                    setSelectedMediaType(kind);
                  }}
                />

                <MediaCarousel
                  title="Séries Mais Assistidas"
                  items={seriesList}
                  type="tv"
                  icon={<Tv className="w-5 h-5" />}
                  onSelect={(id, kind) => {
                    setSelectedMediaId(id);
                    setSelectedMediaType(kind);
                  }}
                />

                <MediaCarousel
                  title="Mais Bem Avaliados pela Crítica"
                  items={topRatedList}
                  type="movie"
                  icon={<Award className="w-5 h-5" />}
                  onSelect={(id, kind) => {
                    setSelectedMediaId(id);
                    setSelectedMediaType(kind);
                  }}
                />
              </div>
            </>
          )
        ) : (
          /* OFFLINE LANDING / LOGIN SCREEN */
          <div className="relative min-h-[85vh] w-full flex items-center justify-center p-4 bg-cover bg-center select-none" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&q=80&w=1200')` }}>
            <div className="w-full max-w-[440px] bg-black/85 backdrop-blur-md sm:p-14 p-8 rounded border border-zinc-800 shadow-2xl relative overflow-hidden text-left">
              
              <div className="mb-8">
                <h1 className="font-sans font-black text-3xl tracking-tighter text-white uppercase leading-none">
                  STREAM<span className="text-brand-red">SAFE</span>
                </h1>
                <p className="text-gray-400 text-xs mt-1 font-sans">
                  Assista em qualquer lugar. Cancele quando quiser.
                </p>
              </div>

              {/* Central Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1.5 uppercase tracking-wider">Email ou número de telefone</label>
                  <input
                    type="email"
                    required
                    placeholder="email@streamsafe.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full h-12 px-4 bg-[#333333] hover:bg-[#3c3c3c] text-white rounded border-b-2 border-transparent focus:border-brand-red focus:outline-none focus:bg-[#454545] text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1.5 uppercase tracking-wider">Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Sua senha de acesso"
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    className="w-full h-12 px-4 bg-[#333333] hover:bg-[#3c3c3c] text-white rounded border-b-2 border-transparent focus:border-brand-red focus:outline-none focus:bg-[#454545] text-sm transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded bg-brand-red hover:bg-red-700 font-bold text-sm text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  Entrar
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-gray-400 mt-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-brand-red rounded" />
                  <span>Lembrar-me</span>
                </label>
                <a href="#" className="hover:underline">Precisa de ajuda?</a>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800">
                <p className="text-sm text-gray-400">
                  Novo por aqui?{" "}
                  <button
                    onClick={() => {
                      setIsRegisterOpen(true);
                      setStep("register");
                    }}
                    className="text-white hover:underline font-bold cursor-pointer"
                  >
                    Assine agora.
                  </button>
                </p>
                
                
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER METADATA BAR */}
      <footer className="w-full bg-brand-dark border-t border-white/5 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-red rounded-full" />
            <span className="font-display font-bold text-sm text-white tracking-wider">
              STREAM<span className="text-brand-red">SAFE</span>
            </span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300">FAQ</a>
            <a href="#" className="hover:text-gray-300">Privacidade</a>
            <a href="#" className="hover:text-gray-300">Moçambique</a>
          </div>
          <span>© 2026 StreamSafe Inc. Todos os direitos reservados.</span>
        </div>
      </footer>

      {/* MODAL 1: Account Register Flow (Multi-step popup) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/95 backdrop-blur-md">
          <div className="w-full max-w-lg bg-brand-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-white/10 bg-white/2 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-red" />
                {step === "register" && "Criar Conta StreamSafe"}
                {step === "plan" && "Escolha o seu Plano"}
                {step === "payment" && "Confirmar Pagamento"}
              </h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Step 1: Account Creation fields */}
            {step === "register" && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Seu Nome Completo</label>
                  <input
                    type="text"
                    placeholder="João da Silva"
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    className="w-full h-11 px-4 bg-brand-dark text-white rounded-lg border border-white/10 focus:outline-none focus:border-brand-red text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Seu Melhor Email</label>
                  <input
                    type="email"
                    placeholder="joao@exemplo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full h-11 px-4 bg-brand-dark text-white rounded-lg border border-white/10 focus:outline-none focus:border-brand-red text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Sua Senha Segura</label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={regSenha}
                    onChange={(e) => setRegSenha(e.target.value)}
                    className="w-full h-11 px-4 bg-brand-dark text-white rounded-lg border border-white/10 focus:outline-none focus:border-brand-red text-sm"
                  />
                </div>

                <button
                  onClick={startAccountRegister}
                  className="w-full h-12 rounded-lg bg-brand-red hover:bg-red-700 font-bold text-sm text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                >
                  Continuar Cadastro
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Plans Carousel */}
            {step === "plan" && (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Plan */}
                  <div
                    onClick={() => setSelectedPlan("mensal")}
                    className={`p-5 rounded-xl border cursor-pointer text-center relative transition-all duration-300 ${
                      selectedPlan === "mensal"
                        ? "bg-brand-red/10 border-brand-red shadow-lg"
                        : "bg-white/2 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xl">🎟️</span>
                    <h4 className="font-bold text-white text-base mt-2">Mensal</h4>
                    <span className="text-xl font-bold text-brand-red block mt-2">300 MZN</span>
                    <p className="text-xs text-gray-400 mt-1">30 dias de acesso completo</p>
                    <ul className="text-left text-[11px] text-gray-300 space-y-1.5 mt-4 border-t border-white/5 pt-3">
                      <li className="flex items-center gap-1"><span className="text-green-500">✓</span> Canal ao Vivo</li>
                      <li className="flex items-center gap-1"><span className="text-green-500">✓</span> Vídeo Alta Definição</li>
                      <li className="flex items-center gap-1"><span className="text-green-500">✓</span> 1 Tela Simultânea</li>
                    </ul>
                  </div>

                  {/* Annual Plan */}
                  <div
                    onClick={() => setSelectedPlan("anual")}
                    className={`p-5 rounded-xl border cursor-pointer text-center relative transition-all duration-300 ${
                      selectedPlan === "anual"
                        ? "bg-brand-red/10 border-brand-red shadow-lg"
                        : "bg-white/2 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="absolute top-2.5 right-2 px-1.5 py-0.5 bg-brand-red text-[8px] tracking-widest font-bold text-white uppercase rounded">
                      Mais Econômico
                    </div>
                    <span className="text-xl">🏆</span>
                    <h4 className="font-bold text-white text-base mt-2">Anual</h4>
                    <span className="text-xl font-bold text-brand-red block mt-2">1500 MZN</span>
                    <p className="text-xs text-gray-400 mt-1">360 dias • Economia de 58%</p>
                    <ul className="text-left text-[11px] text-gray-300 space-y-1.5 mt-4 border-t border-white/5 pt-3">
                      <li className="flex items-center gap-1"><span className="text-green-500">✓</span> Qualidade Ultra 4K</li>
                      <li className="flex items-center gap-1"><span className="text-green-500">✓</span> 4 Telas Simultâneas</li>
                      <li className="flex items-center gap-1"><span className="text-green-500">✓</span> Suporte Prioritário VIP</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep("register")}
                    className="flex-1 h-11 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setStep("payment")}
                    className="flex-1 h-11 rounded-lg bg-brand-red hover:bg-red-700 text-xs font-bold text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Prosseguir
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment instructions & Receipt */}
            {step === "payment" && tempRegisteredUser && (
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">Total devido</span>
                  <span className="text-3xl font-bold text-brand-red inline-block mt-1 font-mono">
                    {PLANOS[selectedPlan].preco} MZN
                  </span>
                  <p className="text-xs text-gray-300 mt-1">Referência do Plano: {PLANOS[selectedPlan].nome}</p>
                </div>

                {/* Account payment info */}
                <div className="p-4 bg-brand-dark/80 rounded-xl space-y-2 border border-white/5">
                  <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Canais Disponíveis para Envio</h5>
                  <div className="space-y-1 text-xs text-gray-200">
                    <p className="flex items-center justify-between">
                      <span className="font-semibold text-orange-400">📲 M-PESA Moçambique:</span>
                      <strong className="font-mono bg-white/5 px-2 py-0.5 rounded text-white">827654321</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="font-semibold text-green-400">📲 EMOLA Moçambique:</span>
                      <strong className="font-mono bg-white/5 px-2 py-0.5 rounded text-white">841234567</strong>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="font-semibold text-gray-400">🔑 Chave de Referência:</span>
                      <strong className="font-mono text-amber-500">{tempRegisteredUser.id.substring(0, 8)}</strong>
                    </p>
                  </div>
                </div>

                {/* Subsidized Transfer Entry */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs text-gray-300 block mb-1 font-semibold">Nome Utilizado na Transferência:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva Santos"
                      value={transferName}
                      onChange={(e) => setTransferName(e.target.value)}
                      className="w-full h-11 px-4 bg-brand-dark text-white rounded-lg border border-white/10 focus:outline-none focus:border-brand-red text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-300 block mb-1 font-semibold">Selecione o Canal de Pagamento:</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMetodo("mpesa")}
                        className={`flex-1 py-3 text-xs font-bold rounded-lg border uppercase transition-all cursor-pointer ${
                          paymentMetodo === "mpesa"
                            ? "bg-red-500/15 border-red-500 text-red-400"
                            : "bg-white/2 border-white/5 text-gray-400"
                        }`}
                      >
                        🔴 M-PESA
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMetodo("emola")}
                        className={`flex-1 py-3 text-xs font-bold rounded-lg border uppercase transition-all cursor-pointer ${
                          paymentMetodo === "emola"
                            ? "bg-orange-500/15 border-orange-500 text-orange-400"
                            : "bg-white/2 border-white/5 text-gray-400"
                        }`}
                      >
                        🟠 EMOLA
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => setStep("plan")}
                    className="flex-1 h-12 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handlePaymentCheckout}
                    className="flex-1 h-12 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-bold text-white flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-green-500/10"
                  >
                    <FileText className="w-4 h-4" />
                    Finalizar & Baixar Recibo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Dynamic Movie Details information overlay */}
      {isDetailsOpen && mediaDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#141414] rounded-md border border-zinc-800 overflow-hidden shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            
            {/* Cover art Backdrop with crossfade overlay */}
            <div className="relative h-48 sm:h-72">
              <img
                src={
                  mediaDetails.backdrop_path
                    ? `https://image.tmdb.org/t/p/original${mediaDetails.backdrop_path}`
                    : `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
                }
                alt="Backdrop"
                className="w-full h-full object-cover brightness-[0.5]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent" />
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/70 hover:bg-brand-red text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                &times;
              </button>
            </div>

            {/* Modal Body Info details */}
            <div className="p-6 sm:p-8 space-y-5 text-left">
              <h2 className="font-sans font-black text-2xl sm:text-3.5xl text-white tracking-tight">
                {mediaDetails.title || mediaDetails.name}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded">
                  ★ {mediaDetails.vote_average?.toFixed(1) || "N/A"}
                </span>
                <span className="text-gray-300 font-semibold text-emerald-400">
                  98% de Correspondência
                </span>
                <span className="text-gray-400">
                  {(mediaDetails.release_date || mediaDetails.first_air_date || "").split("-")[0] || "2024"}
                </span>
                {mediaDetails.number_of_seasons && (
                  <span className="border border-zinc-700 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {mediaDetails.number_of_seasons} {mediaDetails.number_of_seasons === 1 ? "Temporada" : "Temporadas"}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-brand-red/15 text-brand-red rounded font-bold uppercase tracking-wider text-[10px]">
                  {selectedMediaType === "tv" ? "SÉRIE" : "FILME"}
                </span>
              </div>

              {/* Genre tags display */}
              {mediaDetails.genres && mediaDetails.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {mediaDetails.genres.map((g) => (
                    <span key={g.id} className="text-[10px] font-bold bg-zinc-800 text-gray-300 py-0.5 px-2.5 rounded">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Sinopse text */}
              <p className="text-gray-200 text-xs sm:text-sm leading-relaxed border-t border-zinc-800 pt-4">
                {mediaDetails.overview || "Sinopse não disponível para esta mídia em português."}
              </p>

              {/* Dynamic Series Episode Selection Panel */}
              {selectedMediaType === "tv" && (
                <div className="p-4 bg-black border border-zinc-800 rounded space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-brand-red" />
                    Seletor de Episódio
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">Temporada</label>
                      <select
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(Number(e.target.value))}
                        className="w-full h-11 px-3 bg-zinc-900 text-white text-xs border border-zinc-700 rounded focus:outline-none focus:border-brand-red font-semibold cursor-pointer"
                      >
                        {Array.from({ length: mediaDetails.number_of_seasons || 1 }, (_, i) => i + 1).map((s) => (
                          <option key={s} value={s}>
                            Temporada {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">Episódio</label>
                      <select
                        value={selectedEpisode}
                        onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                        className="w-full h-11 px-3 bg-zinc-900 text-white text-xs border border-zinc-700 rounded focus:outline-none focus:border-brand-red font-semibold cursor-pointer"
                      >
                        {seasonEpisodes.map((ep) => (
                          <option key={ep.episode_number} value={ep.episode_number}>
                            Ep. {ep.episode_number}: {(ep.name || "").substring(0, 30)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-5 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handlePlayContent(
                      mediaDetails.id,
                      selectedMediaType || "movie",
                      mediaDetails.title || mediaDetails.name || "Título"
                    );
                  }}
                  className="flex-1 py-3.5 bg-white hover:bg-white/95 text-xs sm:text-sm font-black text-black rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer transform active:scale-95 shadow-lg shadow-white/5"
                >
                  <Play className="w-4.5 h-4.5 fill-current text-black" />
                  {selectedMediaType === "tv" ? "Assistir Série" : "Assistir Filme"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`flex-1 sm:flex-none px-4 py-3 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      userFavorites.some(f => f.id === mediaDetails.id)
                        ? "bg-brand-red/10 border-brand-red text-white"
                        : "bg-zinc-900 border-zinc-700 text-gray-300 hover:text-white"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${userFavorites.some(f => f.id === mediaDetails.id) ? "text-brand-red fill-current" : ""}`} />
                    {userFavorites.some(f => f.id === mediaDetails.id) ? "Favorito" : "Favoritar"}
                  </button>

                  <button
                    onClick={handleToggleWatchlist}
                    className={`flex-1 sm:flex-none px-4 py-3 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      userWatchlist.some(w => w.id === mediaDetails.id)
                        ? "bg-teal-500/10 border-teal-500 text-teal-400"
                        : "bg-zinc-900 border-zinc-700 text-gray-300 hover:text-white"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${userWatchlist.some(w => w.id === mediaDetails.id) ? "text-teal-400 fill-current" : ""}`} />
                    {userWatchlist.some(w => w.id === mediaDetails.id) ? "Na Lista" : "Ver Depois"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cinematic Playback overlay container Iframe */}
      <PlayerModal
        isOpen={activePlayer.isOpen}
        contentId={activePlayer.contentId}
        type={activePlayer.type}
        title={activePlayer.title}
        season={activePlayer.season}
        episode={activePlayer.episode}
        onClose={() => setActivePlayer({ isOpen: false, contentId: "", type: "movie", title: "" })}
        onNavigateEpisode={(s, ep) => {
          // Automatic advanced triggers inside target
          setSelectedSeason(s);
          setSelectedEpisode(ep);
          setActivePlayer((prev) => ({
            ...prev,
            title: `${activePlayer.title.split(" (S")[0]} (S${s}E${ep})`,
            season: s,
            episode: ep,
          }));
        }}
      />

      {/* MODAL 3: Profile view details info */}
      {isProfileOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/95 backdrop-blur-md">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-scale-up">
            <div className="relative p-6 pt-10 text-center">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                &times;
              </button>

              <div className="w-20 h-20 bg-brand-red rounded-full mx-auto flex items-center justify-center font-display font-medium text-3xl text-white shadow-xl shadow-brand-red/10 border-4 border-white/5 relative">
                {currentUser.avatar || currentUser.nome.charAt(0).toUpperCase()}
              </div>

              <h3 className="font-display font-bold text-xl text-white mt-4">{currentUser.nome}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{currentUser.email}</p>

              <div className="mt-6 p-4 bg-brand-dark/95 rounded-xl border border-white/5 text-left space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Plano Selecionado</span>
                  <span className="uppercase text-brand-red font-bold font-mono bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/25">
                    {currentUser.plano || "ADMIN"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Data de Validade</span>
                  <span className="font-semibold text-white">
                    {currentUser.plano_validade
                      ? new Date(currentUser.plano_validade).toLocaleDateString("pt-MZ")
                      : "Permanente"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-300 border-t border-white/5 pt-3">
                  <span>Inscrição Criada</span>
                  <span className="text-gray-400 font-mono text-[11px]">
                    {new Date(currentUser.data_cadastro).toLocaleDateString("pt-MZ")}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all cursor-pointer border border-white/5"
                >
                  Modificar Minha Senha
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-xs font-bold text-red-400 hover:text-white transition-all cursor-pointer"
                >
                  Encerrar Sessão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Change Account Password */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/95 backdrop-blur-md">
          <div className="w-full max-w-sm bg-brand-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4.5 border-b border-white/10 bg-white/2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Segurança: Alterar Senha</h3>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Senha Atual de Acesso</label>
                <input
                  type="password"
                  required
                  placeholder="Seu código atual"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  className="w-full h-11 px-4 bg-brand-dark text-white rounded-lg border border-white/10 text-sm focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nova Senha de Acesso</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 caracteres"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full h-11 px-4 bg-brand-dark text-white rounded-lg border border-white/10 text-sm focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Redigite a senha"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full h-11 px-4 bg-brand-dark text-white rounded-lg border border-white/10 text-sm focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                >
                  Salvar Nova Senha
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 py-3 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
