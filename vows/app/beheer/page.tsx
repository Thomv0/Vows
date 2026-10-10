import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { redirect } from "next/navigation";
import Header from "../components/header";
import InviteForm from "./invite-form";

export default async function AdminPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) redirect("/");
  return <div className="min-h-screen"><Header active="Beheer" /><main className="mx-auto w-[96%] max-w-3xl py-10 text-[#2D3A47]"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#536577]">Beheer</p><h1 className="mt-2 text-3xl font-bold">Mensen uitnodigen</h1><p className="mt-2 text-[#536577]">Kies zelf de rol; genodigden kunnen hun rol niet aanpassen. Na het maken van de uitnodiging opent je eigen mailprogramma een nieuw bericht.</p><InviteForm /></main></div>;
}
