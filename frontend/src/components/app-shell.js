"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "@/components/icons";

const navegacao = [
  { nome: "Visão geral", icone: "inicio", disponivel: false },
  { nome: "Contas", icone: "contas", href: "/contas", disponivel: true },
  { nome: "Transações", icone: "transacoes", disponivel: false },
  { nome: "Categorias", icone: "categorias", disponivel: false },
  { nome: "Recorrências", icone: "recorrencias", disponivel: false },
];

function ItemNavegacao({ item, ativo, mobile = false }) {
  const conteudo = (
    <>
      <Icone nome={item.icone} className={mobile ? "size-5" : "size-[1.15rem]"} />
      <span>{item.nome}</span>
    </>
  );
  const classes = mobile
    ? `flex min-w-16 flex-col items-center gap-1 text-[0.65rem] font-semibold ${ativo ? "text-primary" : "text-foreground-soft"}`
    : `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${ativo ? "bg-white text-primary shadow-[0_6px_24px_rgba(0,58,48,0.08)]" : "text-white/65 hover:bg-white/5 hover:text-white"}`;

  if (!item.disponivel) {
    return <span className={`${classes} cursor-not-allowed opacity-50`} title="Em breve">{conteudo}</span>;
  }

  return <Link className={classes} href={item.href}>{conteudo}</Link>;
}

export default function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-app-surface lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden min-h-screen flex-col bg-primary px-5 py-7 lg:flex">
        <Image src="/logomarca/cifra-horizontal-branca.png" alt="Cifra" width={765} height={326} priority className="h-auto w-32" />
        <nav className="mt-12 flex flex-col gap-1.5" aria-label="Navegação principal">
          {navegacao.map((item) => <ItemNavegacao key={item.nome} item={item} ativo={pathname === item.href} />)}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/7 p-4 text-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">Cifra</p>
          <p className="mt-2 text-sm leading-6">Seu núcleo financeiro pessoal.</p>
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="flex h-20 items-center justify-between border-b border-primary/10 bg-background px-5 lg:hidden">
          <Image src="/logomarca/cifra-horizontal-verde.png" alt="Cifra" width={765} height={326} priority className="h-auto w-28" />
          <span className="rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">Olá, Paulo</span>
        </header>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-20 items-center justify-around border-t border-primary/10 bg-white/95 px-2 backdrop-blur lg:hidden" aria-label="Navegação móvel">
        {navegacao.slice(0, 4).map((item) => <ItemNavegacao key={item.nome} item={item} ativo={pathname === item.href} mobile />)}
      </nav>
    </div>
  );
}
