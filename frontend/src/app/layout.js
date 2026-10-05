import "./globals.css";

export const metadata = {
  title: "Cifra | Gestão financeira pessoal",
  description: "Organize contas, receitas, despesas e recorrências com clareza.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
