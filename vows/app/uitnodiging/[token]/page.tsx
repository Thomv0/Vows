"use client";
import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [form, setForm] = useState({ name: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/account/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, token }) });
    if (!response.ok) { const data = await response.json() as { error?: string }; setError(data.error ?? "Account aanmaken is mislukt."); return; }
    router.push("/login");
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#A9B7C6] p-4 text-[#2D3A47]"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-xl"><h1 className="text-3xl font-bold">Vows-account activeren</h1><label className="block text-sm font-semibold">Naam<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label><label className="block text-sm font-semibold">Nieuw wachtwoord<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>{error && <p className="text-sm text-red-700">{error}</p>}<button className="w-full rounded-lg bg-[#2D3A47] px-4 py-3 font-bold text-white">Account activeren</button></form></main>;
}
