export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <span className="text-xl font-semibold tracking-tight">Cifra</span>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
            Núcleo financeiro
          </span>
        </header>

        <section className="flex flex-1 items-center py-16">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted">
              Frontend inicializado
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Suas finanças, organizadas com clareza.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
              A base da interface está pronta para receber a identidade visual e
              os primeiros fluxos integrados ao backend do Cifra.
            </p>
          </div>
        </section>

        <footer className="border-t border-border pt-5 text-sm text-muted">
          Contas, transações, categorias e recorrências em um só lugar.
        </footer>
      </div>
    </main>
  );
}
