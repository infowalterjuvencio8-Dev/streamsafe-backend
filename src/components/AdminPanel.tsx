/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Clock,
  CheckCircle,
  Users,
  DollarSign,
  UserPlus,
  RefreshCw,
  Search,
  Trash2,
  Calendar,
  Edit2,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { User, Payment } from "../types";
import { PLANOS } from "../utils/db";

interface AdminPanelProps {
  users: User[];
  payments: Payment[];
  onApprovePayment: (id: string) => void;
  onRejectPayment: (id: string) => void;
  onAddUser: (user: Omit<User, "id" | "data_cadastro" | "avatar">) => void;
  onEditUser: (id: string, updated: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onRenewUser: (id: string) => void;
}

export default function AdminPanel({
  users,
  payments,
  onApprovePayment,
  onRejectPayment,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onRenewUser,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "users" | "pending_users">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals inside Admin view
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState<User | null>(null);

  // Add User State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserPlan, setNewUserPlan] = useState<"mensal" | "anual">("mensal");
  const [newUserStatus, setNewUserStatus] = useState<"aprovado" | "pendente_aprovacao">("aprovado");

  // Edit User State
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPlano, setEditUserPlano] = useState<"mensal" | "anual">("mensal");

  // Filter calculations
  const pendingPayments = payments.filter((p) => p.status === "pendente");
  const approvedPayments = payments.filter((p) => p.status === "aprovado");
  const activeUsers = users.filter((u) => u.status === "aprovado" && u.role !== "admin");
  const pendingApprovalUsers = users.filter((u) => (u.status === "pendente_aprovacao" || u.status === "pendente_pagamento") && u.role !== "admin");

  const totalRevenue = approvedPayments.reduce((acc, curr) => acc + curr.valor, 0);

  // Submit new user
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      alert("Preencha todos os campos do usuário!");
      return;
    }
    onAddUser({
      nome: newUserName,
      email: newUserEmail,
      senha: newUserPassword,
      status: newUserStatus,
      role: "user",
      plano: newUserPlan,
    });
    // Reset state
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserPlan("mensal");
    setNewUserStatus("aprovado");
    setShowAddUserModal(false);
  };

  // Submit edit user
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditUserModal || !editUserName || !editUserEmail) return;

    onEditUser(showEditUserModal.id, {
      nome: editUserName,
      email: editUserEmail,
      plano: editUserPlano,
    });

    setShowEditUserModal(null);
  };

  // Open edit setup
  const triggerEditUser = (user: User) => {
    setShowEditUserModal(user);
    setEditUserName(user.nome);
    setEditUserEmail(user.email);
    setEditUserPlano(user.plano || "mensal");
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 md:px-8">
      
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight flex items-center gap-2">
            Administração StreamSafe
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Painel de validação de comprovantes EMOLA/M-PESA e renovações de planos de Moçambique.
          </p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2.5 rounded-lg bg-brand-red hover:bg-red-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Novo Usuário
        </button>
      </div>

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Metric 1 */}
        <div className="bg-brand-card/70 border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Aguardando Aprovação</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{pendingPayments.length}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-brand-card/70 border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Aprovados</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{approvedPayments.length}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-brand-card/70 border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Usuários Ativos</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{activeUsers.length}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-brand-card/70 border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Arrecadação</span>
            <span className="text-2xl font-bold text-emerald-400 block mt-0.5">{totalRevenue.toLocaleString()} MZN</span>
          </div>
        </div>
      </div>

      {/* Tabs list wrapper and action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "pending"
                ? "bg-brand-red text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            📋 Pagamentos Pendentes ({pendingPayments.length})
          </button>
          <button
            onClick={() => setActiveTab("pending_users")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "pending_users"
                ? "bg-brand-red text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            ⚙️ Contas Pendentes ({pendingApprovalUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "approved"
                ? "bg-brand-red text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            ✅ Pagamentos Aprovados ({approvedPayments.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-brand-red text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            👥 Usuários Ativos ({activeUsers.length})
          </button>
        </div>


      </div>

      {/* SEARCH / FILTER UTILITY FOR APPROVED OTHERS */}
      {activeTab !== "pending" && (
        <div className="relative mb-4 max-w-sm">
          <input
            type="text"
            placeholder="Filtrar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-brand-card/90 text-sm text-white pl-10 pr-4 rounded-lg border border-white/10 focus:outline-none focus:border-brand-red"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
        </div>
      )}

      {/* Tab 1: Pending Confirmations */}
      {activeTab === "pending" && (
        <div>
          {pendingPayments.length === 0 ? (
            <div className="text-center py-16 bg-brand-card rounded-2xl border border-white/5">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white">Excelente Trabalho!</h3>
              <p className="text-gray-400 text-sm mt-1">Nenhuma solicitação de pagamento aguardando validação.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-brand-card/50">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-mono text-xs uppercase tracking-wider">
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Transferência Nome</th>
                    <th className="p-4">Plano</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Canal Método</th>
                    <th className="p-4 text-center">Decisão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/2">
                      <td className="p-4 font-semibold text-white">{p.usuarioNome}</td>
                      <td className="p-4 text-gray-300">{p.usuarioEmail}</td>
                      <td className="p-4 font-mono text-xs text-yellow-400 bg-yellow-500/5 rounded px-2 select-all h-fit self-center">
                        {p.nomeTransferencia}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.plano === "anual" ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {p.plano === "anual" ? "Anual (360d)" : "Mensal (30d)"}
                        </span>
                      </td>
                      <td className="p-4 text-brand-red font-bold font-mono">{p.valor} MZN</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          p.metodo === "mpesa" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        }`}>
                          {p.metodo}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onApprovePayment(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-bold text-white transition-colors cursor-pointer"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            onClick={() => onRejectPayment(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-xs font-bold text-white transition-colors cursor-pointer"
                          >
                            ✗ Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Pending Accounts Approval */}
      {activeTab === "pending_users" && (
        <div id="pending-users-section">
          {pendingApprovalUsers.length === 0 ? (
            <div className="text-center py-16 bg-brand-card rounded-2xl border border-white/5">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white">Prontinho!</h3>
              <p className="text-gray-400 text-sm mt-1">Nenhuma conta aguardando aprovação administrativa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-brand-card/50">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-mono text-xs uppercase tracking-wider">
                    <th className="p-4">Avatar</th>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Data de Cadastro</th>
                    <th className="p-4">Plano Escolhido</th>
                    <th className="p-4">Status Da Conta</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingApprovalUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/2">
                      <td className="p-4">
                        <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white font-bold font-display">
                          {u.avatar || u.nome.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-white">{u.nome}</td>
                      <td className="p-4 text-gray-300">{u.email}</td>
                      <td className="p-4 text-xs font-mono text-gray-400">
                        {new Date(u.data_cadastro).toLocaleDateString("pt-MZ")}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.plano === "anual" ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {u.plano === "anual" ? "Anual (360d)" : "Mensal (30d)"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-xs font-bold tracking-wide">
                          {u.status === "pendente_aprovacao" ? "Pendente de Aprovação" : "Pendente de Pagamento"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              const planKey = u.plano || "mensal";
                              const days = planKey === "anual" ? 360 : 30;
                              onEditUser(u.id, {
                                status: "aprovado",
                                plano_validade: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-bold text-white transition-colors cursor-pointer"
                          >
                            ✓ Aprovar Conta
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Recusar e remover cadastro de ${u.nome}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-xs font-bold text-white transition-colors cursor-pointer"
                          >
                            ✗ Recusar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Approved payment history */}
      {activeTab === "approved" && (
        <div>
          {approvedPayments.length === 0 ? (
            <div className="text-center py-16 bg-brand-card rounded-2xl border border-white/5">
              <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Nenhum histórico aprovado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-brand-card/50">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-mono text-xs uppercase tracking-wider">
                    <th className="p-4">Data Aprovação</th>
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Plano</th>
                    <th className="p-4">Canal</th>
                    <th className="p-4">Valor Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {approvedPayments
                    .filter(
                      (p) =>
                        p.usuarioNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.usuarioEmail.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-white/2">
                        <td className="p-4 text-xs font-mono text-gray-400">
                          {new Date(p.data_pagamento).toLocaleString("pt-MZ")}
                        </td>
                        <td className="p-4 font-semibold text-white">{p.usuarioNome}</td>
                        <td className="p-4 text-gray-300">{p.usuarioEmail}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.plano === "anual" ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {p.plano === "anual" ? "Anual" : "Mensal"}
                          </span>
                        </td>
                        <td className="p-4 uppercase font-bold text-xs font-mono tracking-wider">{p.metodo}</td>
                        <td className="p-4 text-green-400 font-bold font-mono">{p.valor} MZN</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Users listing, edit, deletion, and renewals */}
      {activeTab === "users" && (
        <div>
          {activeUsers.length === 0 ? (
            <div className="text-center py-16 bg-brand-card rounded-2xl border border-white/5">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Nenhum membro ativo localizado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-brand-card/50">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-mono text-xs uppercase tracking-wider">
                    <th className="p-4">Membro</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Plano Vigente</th>
                    <th className="p-4">Data Conclusão</th>
                    <th className="p-4">Data Expiração</th>
                    <th className="p-4 text-center">Gestão Direta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeUsers
                    .filter(
                      (u) =>
                        u.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((u) => {
                      const expiration = u.plano_validade ? new Date(u.plano_validade) : null;
                      const hasExpired = expiration ? expiration < new Date() : false;

                      return (
                        <tr key={u.id} className="hover:bg-white/2">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-brand-red flex items-center justify-center font-bold text-xs text-white">
                                {u.avatar || u.nome.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-white">{u.nome}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-300">{u.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              u.plano === "anual" ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-400"
                            }`}>
                              {u.plano === "anual" ? "Anual (360d)" : "Mensal (30d)"}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-gray-400">
                            {new Date(u.data_cadastro).toLocaleDateString("pt-MZ")}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-xs font-semibold ${hasExpired ? "text-red-500 font-bold" : "text-gray-200"}`}>
                                {expiration ? expiration.toLocaleDateString("pt-MZ") : "Indeterminado"}
                              </span>
                              {hasExpired && (
                                <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" /> expirado
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit key */}
                              <button
                                onClick={() => triggerEditUser(u)}
                                className="p-1 px-2 text-xs rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                                title="Editar membro"
                              >
                                <Edit2 className="w-3 h-3" /> Editar
                              </button>

                              {/* Renew Key */}
                              <button
                                onClick={() => {
                                  if (confirm(`Renovar assinatura de ${u.nome} por mais 1 ciclo do plano vigente?`)) {
                                    onRenewUser(u.id);
                                  }
                                }}
                                className="p-1 px-2 text-xs rounded bg-brand-red/10 hover:bg-brand-red text-brand-red hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                                title="Renovar +30/+360 dias"
                              >
                                <RefreshCw className="w-3 h-3" /> Renovar
                              </button>

                              {/* Remove Key */}
                              <button
                                onClick={() => {
                                  if (confirm(`Excluir conta de ${u.nome}? Esta ação é irreversível!`)) {
                                    onDeleteUser(u.id);
                                  }
                                }}
                                className="p-1 px-2 text-xs rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                                title="Excluir usuário"
                              >
                                <Trash2 className="w-3 h-3" /> Remover
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL Overlay: Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/95 backdrop-blur-md">
          <div className="w-full max-w-md bg-brand-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-white/5 bg-white/3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-red" />
                Criar Novo Membro
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do integrante"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-dark text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Endereço de Email</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@streamsafe.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-dark text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Definir Senha de Acesso</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 caracteres"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-dark text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Selecionar Plano</label>
                <select
                  value={newUserPlan}
                  onChange={(e) => setNewUserPlan(e.target.value as "mensal" | "anual")}
                  className="w-full px-4 py-2.5 bg-brand-dark text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:border-brand-red capitalize"
                >
                  <option value="mensal">Plano Mensal (300 MZN)</option>
                  <option value="anual">Plano Anual (1500 MZN)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Status de Cadastro</label>
                <select
                  value={newUserStatus}
                  onChange={(e) => setNewUserStatus(e.target.value as "aprovado" | "pendente_aprovacao")}
                  className="w-full px-4 py-2.5 bg-brand-dark text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:border-brand-red"
                >
                  <option value="aprovado">Ativo / Aprovado Imediatamente</option>
                  <option value="pendente_aprovacao">Pendente de Aprovação Administrativa</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all cursor-pointer"
                >
                  Salvar Usuário
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-3 text-sm font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL Overlay: Edit User */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/95 backdrop-blur-md">
          <div className="w-full max-w-md bg-brand-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-white/5 bg-white/3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-red" />
                Editar Informações de Membro
              </h3>
              <button
                onClick={() => setShowEditUserModal(null)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-dark text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Endereço de Email</label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brand-dark text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1">Mudar Plano Base</label>
                <select
                  value={editUserPlano}
                  onChange={(e) => setEditUserPlano(e.target.value as "mensal" | "anual")}
                  className="w-full px-4 py-2.5 bg-brand-dark text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:border-brand-red"
                >
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold rounded-lg bg-brand-red hover:bg-red-700 text-white transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(null)}
                  className="flex-1 py-3 text-sm font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all cursor-pointer"
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
