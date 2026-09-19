'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-zinc-200/80 py-3.5 shadow-sm shadow-zinc-200/40'
          : 'bg-white/70 backdrop-blur-sm border-b border-zinc-200/50 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* LOGOTIPO SÓBRIO COM DETALHE EM ÂMBAR */}
        <a
          href="#"
          className="flex items-center gap-2.5 focus:outline-none group"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 group-hover:border-zinc-700 transition">
            <svg
              className="w-4 h-4 text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-900">
            LogiFlow
          </span>
        </a>

        {/* NAVEGAÇÃO CENTRAL */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-normal text-zinc-600">
          <a href="#como-funciona" className="hover:text-zinc-900 transition duration-150">
            Como funciona
          </a>
          <a href="#inteligencia" className="hover:text-zinc-900 transition duration-150">
            Inteligência logística
          </a>
          <a href="#para-sua-operacao" className="hover:text-zinc-900 transition duration-150">
            Para sua operação
          </a>
        </nav>

        {/* LADO DIREITO */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="/login"
            className="text-sm text-zinc-600 hover:text-zinc-900 px-3 py-2 transition duration-150 cursor-pointer"
          >
            Acessar sistema
          </a>

          <a
            href="/register"
            className="inline-flex items-center justify-center text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg transition-all duration-150 shadow-sm cursor-pointer"
          >
            Cadastrar empresa
          </a>
        </div>

        {/* MOBILE MENU TRIGGER */}
        <div className="flex items-center md:hidden gap-2">
          <a
            href="/login"
            className="text-xs text-zinc-700 hover:text-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200"
          >
            Entrar
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 border border-zinc-200"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-5 py-5 space-y-4 shadow-lg shadow-zinc-200/50">
          <div className="flex flex-col space-y-3 text-sm text-zinc-600">
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-1 hover:text-zinc-900"
            >
              Como funciona
            </a>
            <a
              href="#inteligencia"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-1 hover:text-zinc-900"
            >
              Inteligência logística
            </a>
            <a
              href="#para-sua-operacao"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left py-1 hover:text-zinc-900"
            >
              Para sua operação
            </a>
          </div>

          <div className="pt-3 border-t border-zinc-200 flex flex-col gap-2.5">
            <a
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-sm text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              Acessar sistema
            </a>
            <a
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
            >
              Cadastrar empresa
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
