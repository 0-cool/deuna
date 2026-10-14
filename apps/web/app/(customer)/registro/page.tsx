import { RegisterSplit } from "@/components/auth/RegisterSplit";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <RegisterSplit error={error} />;
}
