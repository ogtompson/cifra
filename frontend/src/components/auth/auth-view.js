"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export default function AuthView({ modo }) {
  const cadastro = modo === "cadastro";
  const router = useRouter();
  const { autenticado, carregando, entrar, cadastrar } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!carregando && autenticado) router.replace("/");
  }, [autenticado, carregando, router]);

  async function enviar(evento) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    const dados = new FormData(evento.currentTarget);
    try {
      if (cadastro) {
        await cadastrar({
          nome: dados.get("nome"),
          email: dados.get("email"),
          senha: dados.get("senha"),
        });
      } else {
        await entrar({ email: dados.get("email"), senha: dados.get("senha") });
      }
      router.replace("/");
    } catch (error) {
      setErro(error.message || "Não foi possível continuar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f5ef] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(0,58,48,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(0,58,48,.055)_1px,transparent_1px)] [background-size:72px_72px]" />
      <section className="relative w-full max-w-[28rem] rounded-[2rem] border border-primary/10 bg-white/95 p-6 shadow-[0_30px_90px_rgba(0,58,48,.12)] backdrop-blur sm:p-9">
        <Image src="/logomarca/cifra-horizontal-verde.png" alt="Cifra" width={765} height={326} priority className="mb-9 h-auto w-28" />
        <p className="text-[.68rem] font-extrabold uppercase tracking-[.18em] text-primary/60">
          {cadastro ? "Sua vida financeira em um só lugar" : "Bem-vindo de volta"}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-.045em] text-primary">
          {cadastro ? "Crie seu espaço no Cifra" : "Entre na sua conta"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground-soft">
          {cadastro
            ? "Comece com o essencial. Suas contas e movimentações ficam separadas e protegidas."
            : "Continue de onde parou e acompanhe sua organização financeira."}
        </p>

        <form className="mt-8 space-y-4" onSubmit={enviar}>
          {cadastro && (
            <Campo nome="nome" tipo="text" rotulo="Nome" autoComplete="name" placeholder="Como podemos chamar você?" />
          )}
          <Campo nome="email" tipo="email" rotulo="E-mail" autoComplete="email" placeholder="voce@exemplo.com" />
          <Campo
            nome="senha"
            tipo="password"
            rotulo="Senha"
            autoComplete={cadastro ? "new-password" : "current-password"}
            placeholder={cadastro ? "Mínimo de 8 caracteres" : "Sua senha"}
            minLength={8}
          />

          {erro && (
            <div role="alert" className="rounded-2xl border border-error/15 bg-error/5 px-4 py-3 text-sm font-semibold text-error">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || carregando}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(0,58,48,.18)] transition hover:-translate-y-0.5 hover:bg-primary/95 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60"
          >
            {enviando ? "Aguarde…" : cadastro ? "Criar minha conta" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground-soft">
          {cadastro ? "Já possui uma conta?" : "Ainda não possui uma conta?"}{" "}
          <Link href={cadastro ? "/entrar" : "/cadastro"} className="font-extrabold text-primary underline-offset-4 hover:underline">
            {cadastro ? "Entrar" : "Criar conta"}
          </Link>
        </p>
      </section>
    </main>
  );
}

function Campo({ nome, tipo, rotulo, ...props }) {
  return (
    <label className="block text-sm font-bold text-primary">
      <span className="mb-2 block">{rotulo}</span>
      <input
        name={nome}
        type={tipo}
        required
        {...props}
        className="h-12 w-full rounded-2xl border border-primary/12 bg-[#fbfaf6] px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-foreground-soft/55 hover:border-primary/25 focus:border-primary/45 focus:bg-white focus:ring-4 focus:ring-primary/8"
      />
    </label>
  );
}
