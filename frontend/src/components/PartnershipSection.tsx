import { BarChart3, Building2, Check } from 'lucide-react';

export function PartnershipSection() {
  return (
    <section id="para-sua-operacao" className="scroll-mt-20 border-b border-zinc-200 bg-zinc-50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <p className="text-sm font-semibold tracking-[0.14em] text-amber-700 uppercase">Do chão de operação à gestão</p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-[-0.035em] text-zinc-950">
            Uma plataforma para quem expede e para quem decide.
          </h2>
          <p className="text-zinc-600 text-base sm:text-lg mt-4 leading-relaxed">
            A LogiFlow organiza a rotina interna da sua empresa: parceiros homologados, cotações, decisões e histórico no mesmo ambiente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-zinc-200 p-8 sm:p-10 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md hover:shadow-zinc-200/60 transition-all duration-200">
            <div>
              <div className="w-11 h-11 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-800 mb-6">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>

              <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                Para a operação de expedição
              </h3>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed mb-6">
                Para indústria, varejo e e-commerce: elimine a dependência de cotações manuais por e-mail e planilhas paralelas. Compare os parceiros já negociados pela sua empresa em um único fluxo.
              </p>

              <ul className="space-y-3 text-sm text-zinc-600 mb-8">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                  <span>Automação da escolha com cubagem, CEP, distância e seguro considerados no cálculo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                  <span>Decisões rápidas a partir de preço, prazo estimado e composição da cobrança.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                  <span>Histórico de simulações e exportação de relatórios consolidados da própria empresa.</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-zinc-100">
              <a
                href="/register"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition cursor-pointer"
              >
                <span>Criar ambiente da empresa</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-8 sm:p-10 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md hover:shadow-zinc-200/60 transition-all duration-200">
            <div>
              <div className="w-11 h-11 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-800 mb-6">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>

              <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                Para a gestão logística
              </h3>
              
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed mb-6">
                Para gestores, analistas e operadores internos: tenha uma visão organizada das regras de cobrança, dos parceiros ativos e das decisões tomadas em cada simulação.
              </p>

              <ul className="space-y-3 text-sm text-zinc-600 mb-8">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                  <span>Cadastro centralizado de preço base, valor por kg, prazo médio e status de cada parceiro.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                  <span>Conferência do peso real, cubado e cobrado antes da escolha da transportadora.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                  <span>Relatórios e trilha de auditoria para acompanhar a evolução da operação.</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-zinc-100">
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition cursor-pointer"
              >
                <span>Conhecer a plataforma</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
