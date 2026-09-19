export function Footer() {
  return (
    <footer className="bg-zinc-50 border-t border-zinc-200 pt-16 pb-12 text-zinc-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Barra superior do footer com status sóbrio */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-10 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
              <svg
                className="w-3.5 h-3.5 text-amber-400"
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
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">LogiFlow</span>
            <span className="text-zinc-300">|</span>
            <span className="text-xs text-zinc-500">Gestão e simulação inteligente de fretes B2B</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-zinc-200 text-xs text-zinc-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ambiente corporativo</span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500 font-mono">multi-tenant</span>
          </div>
        </div>

        {/* Links organizados por categorias */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
          
          {/* Categoria 1: Produto */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 mb-3.5">
              Produto
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/simular-frete" className="hover:text-zinc-900 transition">
                  Simulação de frete
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="hover:text-zinc-900 transition">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="#inteligencia" className="hover:text-zinc-900 transition">Inteligência e relatórios</a>
              </li>
            </ul>
          </div>

          {/* Categoria 2: Acesso */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 mb-3.5">
              Acesso
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="/login"
                  className="hover:text-zinc-900 transition cursor-pointer"
                >
                  Acessar sistema
                </a>
              </li>
              <li>
                <a
                  href="/register"
                  className="hover:text-zinc-900 transition cursor-pointer"
                >
                  Cadastrar empresa
                </a>
              </li>
              <li>
                <a href="#para-sua-operacao" className="hover:text-zinc-900 transition">Para sua operação</a>
              </li>
            </ul>
          </div>

          {/* Categoria 3: Operacional */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 mb-3.5">
              Operacional
            </h4>
            <ul className="space-y-2.5 text-zinc-500">
              <li>Cubagem automática</li>
              <li>Histórico de cotações</li>
              <li>Relatórios em CSV</li>
            </ul>
          </div>

          {/* Categoria 4: Institucional */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 mb-3.5">
              Institucional
            </h4>
            <ul className="space-y-2.5 text-zinc-500">
              <li>Termos de uso</li>
              <li>Política de privacidade</li>
              <li>Segurança de dados</li>
            </ul>
          </div>

        </div>

        {/* Copyright institucional */}
        <div className="pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500">
          <p>
            © {new Date().getFullYear()} LogiFlow. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
            <span>Ambiente multi-tenant</span>
            <span>•</span>
            <span>v2.5</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
