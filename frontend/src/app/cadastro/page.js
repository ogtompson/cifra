import AuthView from "@/components/auth/auth-view";

export const metadata = { title: "Criar conta | Cifra" };

export default function CadastroPage() {
  return <AuthView modo="cadastro" />;
}
