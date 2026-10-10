import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "../components/header";
import CostsClient from "./costs-client";

export default async function CostsPage() {
  const session = await auth();
  if (session?.user?.role !== "bruid" && session?.user?.role !== "bruidegom") redirect("/");
  return <div className="min-h-screen"><Header active="Kosten" /><CostsClient /></div>;
}
