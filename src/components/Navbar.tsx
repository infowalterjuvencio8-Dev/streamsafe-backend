/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, User as UserIcon, Key, LogOut, Shield, Tv, Home } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  currentUser: User | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onSearchChange: (query: string) => void;
  onOpenProfile: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export default function Navbar({
  currentUser,
  currentView,
  onNavigate,
  onSearchChange,
  onOpenProfile,
  onOpenChangePassword,
  onLogout,
}: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.email === "admin@streamsafe.com";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchVal);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-dark/90 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div 
          onClick={() => { if (currentUser) onNavigate("home"); }}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <Tv className="w-6 h-6 text-brand-red" />
          <span className="font-sans font-black text-xl md:text-2xl tracking-tighter text-white">
            STREAM<span className="text-brand-red">SAFE</span>
          </span>
        </div>

        {/* Navigation Items */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onNavigate("home")}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === "home" ? "text-brand-red" : "text-gray-300 hover:text-white"
              }`}
            >
              <Home className="w-4 h-4" />
              Início
            </button>
            <button
              onClick={() => onNavigate("canais")}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === "canais" ? "text-brand-red" : "text-gray-300 hover:text-white"
              }`}
            >
              <Tv className="w-4 h-4" />
              Canais ao Vivo
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigate("admin")}
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === "admin" ? "text-brand-red" : "text-gray-300 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4" />
                Painel Admin
              </button>
            )}
          </nav>
        )}

        {/* Search Bar and Member controls */}
        {currentUser && (
          <div className="flex items-center gap-2 sm:gap-4 flex-1 md:flex-initial justify-end">
            <form onSubmit={handleSearchSubmit} className="relative w-36 sm:w-56 md:w-64 max-w-xs">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  onSearchChange(e.target.value);
                }}
                className="w-full h-10 bg-black/40 text-xs sm:text-sm text-white pl-9 pr-3 rounded border border-zinc-700 focus:outline-none focus:border-brand-red focus:bg-black/80 transition-all font-medium"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
            </form>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-sm font-semibold text-white">
                  {currentUser.avatar || currentUser.nome.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 mr-1 hidden sm:block" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-brand-card rounded-xl shadow-2xl border border-white/10 overflow-hidden py-1 z-50 animate-fade-in">
                  <div className="px-4 py-3 bg-white/5 border-b border-white/5">
                    <p className="text-sm font-semibold text-white truncate">{currentUser.nome}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{currentUser.email}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-brand-red/20 text-brand-red tracking-wider mt-2 uppercase">
                      Plano {currentUser.plano || "S/N"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    Meu Perfil
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenChangePassword();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Alterar Senha
                  </button>

                  <hr className="border-white/5 my-1" />

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Nav Header Sub-bar */}
      {currentUser && (
        <div className="md:hidden flex items-center justify-around border-t border-white/5 py-3 bg-black/95 backdrop-blur-md">
          <button
            onClick={() => onNavigate("home")}
            className={`flex-1 py-1 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
              currentView === "home" ? "text-brand-red scale-105" : "text-gray-400 hover:text-white"
            }`}
          >
            <Home className="w-5 h-5" />
            Início
          </button>
          <button
            onClick={() => onNavigate("canais")}
            className={`flex-1 py-1 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
              currentView === "canais" ? "text-brand-red scale-105" : "text-gray-400 hover:text-white"
            }`}
          >
            <Tv className="w-5 h-5" />
            Canais
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate("admin")}
              className={`flex-1 py-1 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                currentView === "admin" ? "text-brand-red scale-105" : "text-gray-400 hover:text-white"
              }`}
            >
              <Shield className="w-5 h-5" />
              Painel
            </button>
          )}
        </div>
      )}
    </header>
  );
}
