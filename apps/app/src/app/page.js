import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.isPlatformAdmin && !session.membership) redirect("/admin");
  if (session.membership?.role === "CLIENT") redirect("/portal");
  if (session.membership) redirect("/dashboard");
  redirect("/login");
}
