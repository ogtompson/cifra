export default function DashboardView() {
  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
      <p className="text-xs font-bold text-secondary">Análise financeira</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] text-primary sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-xs text-foreground-soft sm:text-sm">Indicadores, evolução e composição da sua vida financeira.</p>
      <section className="paper-card mt-5 min-h-96 rounded-2xl" aria-label="Dashboard financeiro em construção" />
    </main>
  );
}
