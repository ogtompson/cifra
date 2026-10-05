import "@fontsource-variable/manrope";
import AppShell from "@/components/app-shell";
import "./globals.css";

export const metadata = {
  title: "Cifra | Gestão financeira pessoal",
  description: "Organize contas, receitas, despesas e recorrências com clareza.",
  icons: {
    icon: "/logomarca/simbolo-bau-preenchido.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
