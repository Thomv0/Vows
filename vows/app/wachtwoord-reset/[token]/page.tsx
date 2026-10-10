"use client";
import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/account/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    if (!response.ok) { const data = await response.json() as { error?: string }; setError(data.error ?? "Wachtwoord wijzigen is mislukt."); return; }
    router.push("/login");
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#A9B7C6] p-4 text-[#2D3A47]"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-xl"><h1 className="text-3xl font-bold">Nieuw wachtwoord</h1><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="Nieuw wachtwoord" />{error && <p className="text-sm text-red-700">{error}</p>}<button className="w-full rounded-lg bg-[#2D3A47] px-4 py-3 font-bold text-white">Wachtwoord opslaan</button></form></main>;
}
