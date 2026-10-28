"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Icone } from "@/components/icons";

const navegacao = [
  { nome: "Início", icone: "inicio", href: "/" },
  { nome: "Dashboard", icone: "grafico", href: "/dashboard" },
  { nome: "Contas", icone: "contas", href: "/contas" },
  { nome: "Cartões", icone: "cartoes", href: "/cartoes" },
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
    <Link href={item.href} title={item.nome} className={`group/item relative flex h-12 items-center gap-3 overflow-hidden rounded-xl px-3.5 text-sm font-semibold transition-colors duration-200 ${ativo ? "bg-white/[0.09] text-white" : "text-white/55 hover:bg-white/[0.055] hover:text-white"}`}>
      {ativo && <span className="absolute -left-4 h-6 w-0.5 rounded-r-full bg-[#dfb76e]" />}
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${ativo ? "bg-white/10 text-[#f0cf91]" : "group-hover/item:bg-white/5"}`}><Icone nome={item.icone} className="size-[1.18rem]" /></span>
      <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">{item.nome}</span>
    </Link>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, autenticado, carregando, sair } = useAuth();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const rotaPublica = pathname === "/entrar" || pathname === "/cadastro";
  const rotasPrincipaisMobile = new Set(["/", "/dashboard", "/contas", "/transacoes"]);
  const navegacaoPrincipalMobile = navegacao.filter((item) => rotasPrincipaisMobile.has(item.href));
  const navegacaoSecundariaMobile = navegacao.filter((item) => !rotasPrincipaisMobile.has(item.href));

  useEffect(() => {
    if (!rotaPublica && !carregando && !autenticado) router.replace("/entrar");
  }, [rotaPublica, carregando, autenticado, router]);

  if (rotaPublica) return children;
  if (carregando || !autenticado) return <CarregandoSessao />;

  const nomeUsuario = usuario?.nome || "Usuário";
  const inicial = nomeUsuario.trim().charAt(0).toUpperCase() || "U";

  async function encerrarSessao() {
    await sair();
    router.replace("/entrar");
  }

  return (
    <div className="app-frame min-h-screen lg:grid lg:grid-cols-[5.75rem_1fr]">
      <aside className="sidebar group/sidebar sticky top-0 z-40 hidden h-screen w-[5.75rem] flex-col overflow-hidden px-4 py-6 transition-[width] duration-300 ease-out hover:w-[15.5rem] focus-within:w-[15.5rem] lg:flex">
        <div className="relative h-11 shrink-0">
          <Image src="/logomarca/simbolo-bau-3d.png" alt="Cifra" width={500} height={499} priority className="absolute left-2 top-0 h-11 w-11 object-contain opacity-100 drop-shadow-[0_5px_10px_rgba(0,0,0,.16)] transition-opacity group-hover/sidebar:opacity-0 group-focus-within/sidebar:opacity-0" />
          <Image src="/logomarca/cifra-horizontal-branca.png" alt="Cifra" width={765} height={326} priority className="absolute -left-px -top-2 h-auto w-32 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100" />
        </div>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Navegação principal">
          {navegacao.map((item) => <ItemNavegacao key={item.nome} item={item} ativo={pathname === item.href} />)}
        </nav>
        <button type="button" onClick={encerrarSessao} title="Sair da conta" className="mt-auto flex items-center gap-3 border-t border-white/8 px-3 pt-5 text-left">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/12 text-xs font-extrabold text-white">{inicial}</span>
          <div className="max-w-[10.5rem] whitespace-nowrap opacity-0 transition-opacity group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100"><p className="truncate text-xs font-bold text-white/80">{nomeUsuario}</p><p className="mt-0.5 text-[.65rem] text-white/35">Clique para sair</p></div>
        </button>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-primary/7 bg-background/88 px-4 backdrop-blur-xl sm:px-5 lg:hidden">
          <Image src="/logomarca/cifra-horizontal-verde.png" alt="Cifra" width={765} height={326} priority className="h-auto w-24" />
          <button type="button" onClick={encerrarSessao} title="Sair da conta" className="grid size-8 place-items-center rounded-full border border-primary/10 bg-white/65 text-xs font-extrabold text-primary">{inicial}</button>
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

function CarregandoSessao() {
  return (
    <main className="grid min-h-screen place-items-center bg-app-surface px-4" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image src="/logomarca/simbolo-bau-3d.png" alt="" width={64} height={64} className="size-14 animate-pulse object-contain" />
        <p className="text-sm font-bold text-primary/65">Preparando seu Cifra…</p>
      </div>
    </main>
  );
}
