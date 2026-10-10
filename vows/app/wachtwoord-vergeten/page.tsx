"use client";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/account/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setMessage(response.ok ? "Als dit account bestaat, is een resetlink verstuurd." : "De resetmail kon niet worden verstuurd.");
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#A9B7C6] p-4 text-[#2D3A47]"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-xl"><h1 className="text-3xl font-bold">Wachtwoord vergeten</h1><label className="block text-sm font-semibold">E-mailadres<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>{message && <p className="text-sm text-[#536577]">{message}</p>}<button className="w-full rounded-lg bg-[#2D3A47] px-4 py-3 font-bold text-white">Resetlink aanvragen</button></form></main>;
}
