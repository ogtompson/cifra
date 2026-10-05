"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "@/components/icons";

const navegacao = [
  { nome: "Início", icone: "inicio", href: "/" },
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
    <Link href={item.href} className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${ativo ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
      {ativo && <span className="absolute -left-5 h-5 w-0.5 rounded-r-full bg-[#dfb76e]" />}
      <Icone nome={item.icone} className="size-[1.1rem]" />
      <span>{item.nome}</span>
    </Link>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="app-frame min-h-screen lg:grid lg:grid-cols-[14.5rem_1fr]">
      <aside className="sidebar sticky top-0 hidden h-screen flex-col px-5 py-7 lg:flex">
        <Image src="/logomarca/cifra-horizontal-branca.png" alt="Cifra" width={765} height={326} priority className="ml-2 h-auto w-24" />
        <p className="mb-3 mt-12 px-3 text-[.62rem] font-bold uppercase tracking-[.18em] text-white/30">Menu</p>
        <nav className="flex flex-col gap-1" aria-label="Navegação principal">
          {navegacao.map((item) => <ItemNavegacao key={item.nome} item={item} ativo={pathname === item.href} />)}
        </nav>
        <div className="mt-auto border-t border-white/8 px-3 pt-5"><p className="text-xs font-semibold text-white/45">Cifra pessoal</p><p className="mt-1 text-[.65rem] text-white/25">Versão inicial</p></div>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-primary/8 bg-background/92 px-5 backdrop-blur-xl lg:hidden">
          <Image src="/logomarca/cifra-horizontal-verde.png" alt="Cifra" width={765} height={326} priority className="h-auto w-24" />
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">P</span>
        </header>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[4.5rem] items-center border-t border-primary/10 bg-white/95 px-1 backdrop-blur lg:hidden" aria-label="Navegação móvel">
        {navegacao.map((item) => <ItemNavegacao key={item.nome} item={item} ativo={pathname === item.href} mobile />)}
      </nav>
    </div>
  );
}
