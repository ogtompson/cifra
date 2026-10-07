"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icone } from "@/components/icons";

const navegacao = [
  { nome: "Início", icone: "inicio", href: "/" },
  { nome: "Dashboard", icone: "grafico", href: "/dashboard" },
  { nome: "Contas", icone: "contas", href: "/contas" },
  { nome: "Transações", icone: "transacoes", href: "/transacoes" },
  { nome: "Categorias", icone: "categorias", href: "/categorias" },
  { nome: "Recorrências", icone: "recorrencias", href: "/recorrencias" },
];

function ItemNavegacao({ item, ativo, mobile = false }) {
  if (mobile) {
    return (
      <Link href={item.href} className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[.58rem] font-semibold transition ${ativo ? "text-primary" : "text-foreground-soft"}`}>
        <span className={`grid size-8 place-items-center rounded-xl transition ${ativo ? "bg-primary text-white" : ""}`}><Icone nome={item.icone} className="size-4" /></span>
        <span className="max-w-full truncate">{item.nome}</span>
      </Link>
    );
  }

  return (
    <Link href={item.href} title={item.nome} className={`relative flex h-11 items-center gap-3 overflow-hidden rounded-xl px-[0.95rem] text-sm font-semibold transition-colors duration-200 ${ativo ? "bg-white/11 text-white" : "text-white/55 hover:bg-white/6 hover:text-white"}`}>
      {ativo && <span className="absolute -left-3 h-5 w-0.5 rounded-r-full bg-[#dfb76e] group-hover/sidebar:-left-4" />}
      <Icone nome={item.icone} className="size-[1.1rem] shrink-0" />
      <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">{item.nome}</span>
    </Link>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const navegacaoPrincipalMobile = navegacao.slice(0, 4);
  const navegacaoSecundariaMobile = navegacao.slice(4);

  return (
    <div className="app-frame min-h-screen lg:grid lg:grid-cols-[5.25rem_1fr]">
      <aside className="sidebar group/sidebar sticky top-0 z-40 hidden h-screen w-[5.25rem] flex-col overflow-hidden px-4 py-6 transition-[width] duration-300 ease-out hover:w-[14.5rem] focus-within:w-[14.5rem] lg:flex">
        <div className="relative h-10 shrink-0">
          <Image src="/logomarca/simbolo-bau-3d.png" alt="Cifra" width={500} height={499} priority className="absolute left-1 top-0 h-9 w-9 object-contain opacity-100 transition-opacity group-hover/sidebar:opacity-0 group-focus-within/sidebar:opacity-0" />
          <Image src="/logomarca/cifra-horizontal-branca.png" alt="Cifra" width={765} height={326} priority className="absolute left-1 top-1 h-auto w-24 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100" />
        </div>
        <p className="mb-3 mt-8 whitespace-nowrap px-3 text-[.62rem] font-bold uppercase tracking-[.18em] text-white/30 opacity-0 transition-opacity group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">Menu</p>
        <nav className="flex flex-col gap-1" aria-label="Navegação principal">
          {navegacao.map((item) => <ItemNavegacao key={item.nome} item={item} ativo={pathname === item.href} />)}
        </nav>
        <div className="mt-auto flex items-center gap-3 border-t border-white/8 px-2 pt-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/12 text-xs font-extrabold text-white">P</span>
          <div className="whitespace-nowrap opacity-0 transition-opacity group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100"><p className="text-xs font-bold text-white/80">Paulo</p><p className="mt-0.5 text-[.65rem] text-white/35">Perfil pessoal</p></div>
        </div>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-primary/7 bg-background/88 px-4 backdrop-blur-xl sm:px-5 lg:hidden">
          <Image src="/logomarca/cifra-horizontal-verde.png" alt="Cifra" width={765} height={326} priority className="h-auto w-24" />
          <span className="grid size-8 place-items-center rounded-full border border-primary/10 bg-white/65 text-xs font-extrabold text-primary">P</span>
        </header>
        <div key={pathname} className="page-transition">{children}</div>
      </div>

      {menuMobileAberto && <button type="button" className="fixed inset-0 z-40 bg-primary/25 backdrop-blur-[2px] lg:hidden" onClick={() => setMenuMobileAberto(false)} aria-label="Fechar menu" />}
      {menuMobileAberto && (
        <aside className="fixed inset-x-3 bottom-[4.85rem] z-50 rounded-2xl border border-primary/8 bg-white p-2 shadow-[0_18px_55px_rgba(0,58,48,.18)] lg:hidden" aria-label="Mais opções">
          {navegacaoSecundariaMobile.map((item) => <Link key={item.nome} href={item.href} onClick={() => setMenuMobileAberto(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${pathname === item.href ? "bg-primary text-white" : "text-primary hover:bg-primary/5"}`}><Icone nome={item.icone} className="size-4" />{item.nome}</Link>)}
        </aside>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[4.5rem] items-center border-t border-primary/8 bg-white/95 px-2 backdrop-blur-xl lg:hidden" aria-label="Navegação móvel">
        {navegacaoPrincipalMobile.map((item) => <ItemNavegacao key={item.nome} item={item} ativo={pathname === item.href} mobile />)}
        <button type="button" onClick={() => setMenuMobileAberto((aberto) => !aberto)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[.58rem] font-semibold ${menuMobileAberto || navegacaoSecundariaMobile.some((item) => item.href === pathname) ? "text-primary" : "text-foreground-soft"}`} aria-expanded={menuMobileAberto}><span className={`grid size-8 place-items-center rounded-xl ${menuMobileAberto || navegacaoSecundariaMobile.some((item) => item.href === pathname) ? "bg-primary text-white" : ""}`}><Icone nome="outros" className="size-4" /></span><span>Mais</span></button>
      </nav>
    </div>
  );
}
