/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Payment, FavoriteItem, HistoryItem, PlanDetails } from "../types";

export const CONFIG = {
  STORAGE_USERS: "streamsafe_users_v2",
  STORAGE_PENDING: "streamsafe_pending_v2",
  STORAGE_SESSION: "streamsafe_session_v2",
  STORAGE_FAVORITES: "streamsafe_favorites",
  STORAGE_HISTORY: "streamsafe_history"
};

export const PLANOS: Record<"mensal" | "anual", PlanDetails> = {
  mensal: {
    nome: "Plano Mensal",
    preco: 300,
    dias: 30,
    emola: "EMOLA: 841234567",
    mpesa: "M-PESA: 827654321",
    features: ["30 dias de acesso", "Catálogo completo em HD", "1 tela simultânea", "Suporte Padrão Moçambique"]
  },
  anual: {
    nome: "Plano Anual",
    preco: 1500,
    dias: 360,
    emola: "EMOLA: 841234567",
    mpesa: "M-PESA: 827654321",
    features: [
      "360 dias de acesso (Economize 40%)",
      "Qualidade Ultra HD 4K",
      "4 telas simultâneas simultâneas",
      "Suporte Prioritário VIP 24/7",
      "Acesso antecipado a lançamentos"
    ]
  }
};

export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(CONFIG.STORAGE_USERS) || "[]");
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(CONFIG.STORAGE_USERS, JSON.stringify(users));
}

export function getPendingPayments(): Payment[] {
  return JSON.parse(localStorage.getItem(CONFIG.STORAGE_PENDING) || "[]");
}

export function savePendingPayments(pending: Payment[]): void {
  localStorage.setItem(CONFIG.STORAGE_PENDING, JSON.stringify(pending));
}

export function getFavorites(userId?: string): FavoriteItem[] {
  const key = userId ? `${CONFIG.STORAGE_FAVORITES}_${userId}` : CONFIG.STORAGE_FAVORITES;
  return JSON.parse(localStorage.getItem(key) || "[]");
}

export function saveFavorites(favs: FavoriteItem[], userId?: string): void {
  const key = userId ? `${CONFIG.STORAGE_FAVORITES}_${userId}` : CONFIG.STORAGE_FAVORITES;
  localStorage.setItem(key, JSON.stringify(favs));
}

export function getHistory(userId?: string): HistoryItem[] {
  const key = userId ? `${CONFIG.STORAGE_HISTORY}_${userId}` : CONFIG.STORAGE_HISTORY;
  return JSON.parse(localStorage.getItem(key) || "[]");
}

export function saveHistory(history: HistoryItem[], userId?: string): void {
  const key = userId ? `${CONFIG.STORAGE_HISTORY}_${userId}` : CONFIG.STORAGE_HISTORY;
  localStorage.setItem(key, JSON.stringify(history.slice(0, 50)));
}

export function getWatchlist(userId?: string): FavoriteItem[] {
  const key = userId ? `streamsafe_watchlist_${userId}` : "streamsafe_watchlist";
  return JSON.parse(localStorage.getItem(key) || "[]");
}

export function saveWatchlist(items: FavoriteItem[], userId?: string): void {
  const key = userId ? `streamsafe_watchlist_${userId}` : "streamsafe_watchlist";
  localStorage.setItem(key, JSON.stringify(items));
}

export function initDefaultUsers(): void {
  const users = getUsers();
  if (users.length === 0) {
    saveUsers([
      {
        id: "1",
        nome: "Administrador StreamSafe",
        email: "admin@streamsafe.com",
        senha: hashPassword("admin123"),
        status: "aprovado",
        role: "admin",
        plano: "anual",
        plano_validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        avatar: "A",
        data_cadastro: new Date().toISOString()
      }
    ]);
  }
}

export function exportToTXT(pagamento: Payment, usuario: Partial<User>): void {
  const data = new Date();
  const conteudo = `
========================================
STREAMSAFE - SOLICITAÇÃO DE PAGAMENTO
========================================
Data da solicitação: ${data.toLocaleString("pt-MZ")}
ID da solicitação: ${pagamento.id}

--- DADOS DO USUÁRIO ---
Nome: ${usuario.nome}
Email: ${usuario.email}
Data de cadastro: ${usuario.data_cadastro ? new Date(usuario.data_cadastro).toLocaleString("pt-MZ") : "N/A"}

--- DETALHES DO PLANO ---
Plano: ${pagamento.plano === "mensal" ? "Plano Mensal" : "Plano Anual"}
Valor: ${pagamento.valor} MZN
Método: ${pagamento.metodo.toUpperCase()}

--- DADOS DA TRANSFERÊNCIA ---
Nome na transferência: ${pagamento.nomeTransferencia}
Referência de ID: ${pagamento.usuarioId.substring(0, 8)}

--- STATUS M-PESA / EMOLA ---
Status: ${pagamento.status === "pendente" ? "AGUARDANDO APROVAÇÃO" : "APROVADO"}
========================================
  `;

  try {
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `comprovante_${(usuario.nome || "usuario").replace(/\s/g, "_")}_${data.getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Txt download issue, probably inside restricted iframe boundary", e);
  }
}
