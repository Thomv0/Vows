"use client";
import { FormEvent, useState } from "react";
import { roles } from "@/lib/roles";

export default function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("bruid");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
    const data = await response.json() as { error?: string; mailto?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Uitnodiging maken is mislukt.");
      return;
    }
    setMessage("Je mailprogramma wordt geopend met de uitnodiging.");
    setEmail("");
    if (data.mailto) window.location.href = data.mailto;
  }
  return <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-lg"><label className="block text-sm font-semibold">E-mailadres<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="block text-sm font-semibold">Rol<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] bg-white px-3 py-2">{roles.map((item) => <option key={item} value={item}>{item === "bruid" ? "Bruid" : item === "bruidegom" ? "Bruidegom" : "Ceremoniemeester"}</option>)}</select></label>{message && <p className="text-sm text-[#536577]">{message}</p>}<button type="submit" className="rounded-lg bg-[#2D3A47] px-5 py-3 font-bold text-white hover:bg-[#425365]">Uitnodiging versturen</button></form>;
}
