import Image from "next/image";

const recursos = [
  {
    numero: "01",
    titulo: "Contas em ordem",
    texto: "Saldos e movimentações reunidos em uma visão simples.",
  },
  {
    numero: "02",
    titulo: "Rotina automatizada",
    texto: "Receitas e despesas recorrentes sem lançamentos repetidos.",
  },
  {
    numero: "03",
    titulo: "Decisões com contexto",
    texto: "Resumo por período e categorias para entender seus hábitos.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex h-24 items-center justify-between border-b border-primary/10">
          <Image
            src="/logomarca/cifra-horizontal-verde.png"
            alt="Cifra"
            width={765}
            height={326}
            priority
            className="h-auto w-32 sm:w-36"
          />

          <span className="rounded-full border border-primary/15 bg-white/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Em construção
          </span>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-5 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.18em] text-secondary">
              <span className="h-px w-9 bg-secondary" aria-hidden="true" />
              Clareza para o seu dinheiro
            </p>

            <h1 className="text-balance text-5xl font-extrabold leading-[0.98] tracking-[-0.045em] text-primary sm:text-6xl lg:text-7xl">
              Organize hoje.
              <span className="block text-secondary">Conquiste amanhã.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-foreground-soft">
              O Cifra reúne contas, transações e compromissos recorrentes para
              transformar sua vida financeira em decisões mais conscientes.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <span className="rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(0,58,48,0.18)]">
                Primeira versão em andamento
              </span>
              <span className="text-sm font-semibold text-accent">
                Núcleo financeiro pronto
              </span>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-xl items-center justify-center lg:justify-end">
            <div
              className="absolute size-[75%] rounded-full bg-secondary/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative rounded-[2.5rem] border border-white/70 bg-white/45 p-6 shadow-[0_30px_80px_rgba(0,58,48,0.12)] backdrop-blur-sm sm:p-10">
              <Image
                src="/logomarca/simbolo-bau-3d.png"
                alt="Baú do Cifra"
                width={500}
                height={499}
                priority
                className="relative h-auto w-full max-w-sm drop-shadow-[0_24px_24px_rgba(0,58,48,0.14)]"
              />
            </div>
          </div>
        </section>

        <section className="grid border-t border-primary/10 md:grid-cols-3">
          {recursos.map((recurso) => (
            <article
              key={recurso.numero}
              className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-primary/10 py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <span className="pt-1 text-xs font-bold text-secondary">
                {recurso.numero}
              </span>
              <div>
                <h2 className="font-bold text-primary">{recurso.titulo}</h2>
                <p className="mt-2 text-sm leading-6 text-foreground-soft">
                  {recurso.texto}
                </p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
