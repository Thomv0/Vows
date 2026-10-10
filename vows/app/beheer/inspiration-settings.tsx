"use client";

import { useState } from "react";

export default function InspirationSettings({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [message, setMessage] = useState("");
  async function save() {
    const response = await fetch("/api/settings/inspiration", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinterestBoardUrl: url, palette: [] }) });
    setMessage(response.ok ? "Inspiratie-instellingen opgeslagen." : "Opslaan is mislukt.");
  }
  return <section className="mt-8 rounded-2xl bg-white p-6 shadow-lg"><h2 className="text-xl font-bold">Pinterest-bord beheren</h2><label className="mt-4 block text-sm font-semibold">Pinterest-bordlink<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" placeholder="https://www.pinterest.com/jouw-bord/" /></label>{message && <p className="mt-3 text-sm text-[#536577]">{message}</p>}<button type="button" onClick={save} className="mt-5 rounded-lg bg-[#2D3A47] px-5 py-3 font-bold text-white hover:bg-[#425365]">Opslaan</button></section>;
}
