import { LoginSplit } from "@/components/auth/LoginSplit";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return <LoginSplit error={error} next={next ?? "/perfil"} />;
}
