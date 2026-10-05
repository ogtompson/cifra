"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "@/components/icons";

const navegacao = [
  { nome: "Visão geral", icone: "inicio", href: "/", disponivel: true },
  { nome: "Contas", icone: "contas", href: "/contas", disponivel: true },
  { nome: "Transações", icone: "transacoes", disponivel: false },
  { nome: "Categorias", icone: "categorias", href: "/categorias", disponivel: true },
  { nome: "Recorrências", icone: "recorrencias", disponivel: false },
];

function ItemNavegacao({ item, ativo, mobile = false }) {
  const conteudo = <><Icone nome={item.icone} className={mobile ? "size-5" : "size-[1.15rem]"} /><span>{item.nome}</span></>;
  const classes = mobile
    ? `flex min-w-16 flex-col items-center gap-1 text-[0.65rem] font-semibold ${ativo ? "text-primary" : "text-foreground-soft"}`
    : `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${ativo ? "bg-white text-primary shadow-[0_8px_25px_rgba(0,0,0,.1)]" : "text-white/60 hover:bg-white/7 hover:text-white"}`;
  if (!item.disponivel) return <span className={`${classes} cursor-not-allowed opacity-45`} title="Em breve">{conteudo}</span>;
  return <Link className={classes} href={item.href}>{conteudo}</Link>;
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  return (
    <div className="app-frame min-h-screen lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sidebar hidden min-h-screen flex-col px-5 py-7 lg:flex">
        <div className="flex h-12 items-center px-2"><Image src="/logomarca/cifra-horizontal-branca.png" alt="Cifra" width={765} height={326} priority className="h-auto w-28" /></div>
        <nav className="mt-10 flex flex-col gap-1.5" aria-label="Navegação principal">
          {navegacao.map((item) => <ItemNavegacao key={item.nome} item={item} ativo={pathname === item.href} />)}
        </nav>
        <div className="sidebar-message relative mt-auto overflow-hidden rounded-[1.4rem] border border-white/10 p-5 text-white">
          <span className="text-lg">✦</span>
          <p className="mt-3 text-lg font-extrabold leading-tight">Mais que números,<br />mais conquistas.</p>
          <p className="mt-2 text-xs leading-5 text-white/55">Organize hoje o futuro que você quer.</p>
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-primary/8 bg-background/90 px-5 backdrop-blur-xl lg:h-[5.5rem] lg:px-10">
          <Image src="/logomarca/cifra-horizontal-verde.png" alt="Cifra" width={765} height={326} priority className="h-auto w-28 lg:hidden" />
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2.5">
            <button className="hidden h-10 items-center gap-2 rounded-xl border border-primary/10 bg-white px-3.5 text-xs font-bold text-primary shadow-sm sm:flex" type="button"><Icone nome="calendario" className="size-4" /> Este mês</button>
            <button className="grid size-10 place-items-center rounded-full border border-primary/10 bg-white text-primary shadow-sm" type="button" aria-label="Notificações"><Icone nome="sino" className="size-4" /></button>
            <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(0,58,48,.18)]">P</span>
          </div>
        </header>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-20 items-center justify-around border-t border-primary/10 bg-white/95 px-2 backdrop-blur lg:hidden" aria-label="Navegação móvel">
        {navegacao.slice(0, 4).map((item) => <ItemNavegacao key={item.nome} item={item} ativo={pathname === item.href} mobile />)}
      </nav>
    </div>
  );
}
