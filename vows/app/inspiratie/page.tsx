"use client";

import { useEffect, useState } from "react";
import Header from "../components/header";

type PaletteItem = { name: string; value: string };
type Settings = { pinterestBoardUrl: string; palette: PaletteItem[] };

export default function InspirationPage() {
  const [settings, setSettings] = useState<Settings>({ pinterestBoardUrl: "", palette: [] });
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void fetch("/api/settings/inspiration").then(async (response) => {
      if (!response.ok) throw new Error("Inspiratie ophalen is mislukt.");
      const data = await response.json() as Settings;
      setSettings(data);
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Inspiratie ophalen is mislukt."));
  }, []);

  function updateColor(index: number, changes: Partial<PaletteItem>) {
    setSettings((current) => ({ ...current, palette: current.palette.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) }));
  }

  async function savePalette() {
    const response = await fetch("/api/settings/inspiration", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ palette: settings.palette }) });
    setMessage(response.ok ? "Kleurenpalet opgeslagen." : "Kleurenpalet opslaan is mislukt.");
    if (response.ok) setEditing(false);
  }

  return <div className="min-h-screen"><Header active="Inspiratie" /><main className="mx-auto w-[96%] max-w-5xl py-10 text-[#2D3A47]">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#536577]">Ideeën verzamelen</p>
    <h1 className="mt-2 text-4xl font-bold">Inspiratie</h1>
    <p className="mt-3 text-[#536577]">Bekijk het gedeelde Pinterest-bord en jullie kleurenpalet.</p>
    <section className="mt-8 rounded-2xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Pinterest-bord</h2>{settings.pinterestBoardUrl && <a href={settings.pinterestBoardUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-[#2D3A47] px-4 py-2 text-sm font-bold text-white hover:bg-[#425365]">Bord openen</a>}</div>
      {!settings.pinterestBoardUrl && <p className="mt-4 text-sm text-[#718292]">De beheerder heeft nog geen Pinterest-bord ingesteld.</p>}
    </section>
    <section className="mt-8 rounded-2xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Kleurenpalet</h2><button type="button" onClick={() => setEditing((value) => !value)} className="rounded-lg bg-[#edf1f4] px-4 py-2 text-sm font-bold">{editing ? "Annuleren" : "Aanpassen"}</button></div>
      <div className="mt-5 space-y-2">{settings.palette.map((color, index) => editing ? <div key={index} className="grid items-center gap-2 rounded-lg border border-[#e1e7eb] p-2 sm:grid-cols-[48px_1fr_110px_auto]"><span className="h-10 w-12 rounded border" style={{ backgroundColor: color.value }} /><input value={color.name} onChange={(event) => updateColor(index, { name: event.target.value })} className="rounded-lg border px-3 py-2" /><input type="color" value={color.value} onChange={(event) => updateColor(index, { value: event.target.value })} className="h-10 w-full rounded-lg border p-1" /><button type="button" onClick={() => setSettings((current) => ({ ...current, palette: current.palette.filter((_, itemIndex) => itemIndex !== index) }))} className="text-sm font-bold text-red-700 underline">Verwijderen</button></div> : <div key={`${color.name}-${color.value}`} className="flex items-center gap-3 rounded-lg border border-[#e1e7eb] p-2"><span className="h-10 w-12 rounded border" style={{ backgroundColor: color.value }} /><span className="text-sm font-semibold">{color.name}</span><span className="text-xs text-[#536577]">{color.value}</span></div>)}</div>
      {editing && <div className="mt-4 flex gap-2"><button type="button" disabled={settings.palette.length >= 10} onClick={() => setSettings((current) => ({ ...current, palette: [...current.palette, { name: "Nieuwe kleur", value: "#FFFFFF" }] }))} className="rounded-lg bg-[#edf1f4] px-4 py-2 text-sm font-bold">+ Kleur toevoegen</button><button type="button" onClick={savePalette} className="rounded-lg bg-[#2D3A47] px-4 py-2 text-sm font-bold text-white">Opslaan</button></div>}
    </section>
    {message && <p className="mt-4 text-sm text-red-700">{message}</p>}
  </main></div>;
}
