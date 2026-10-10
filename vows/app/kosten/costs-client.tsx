"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Cost = { id: string; title: string; category: string; amount: number; paid: boolean };
const categories = ["Locatie", "Catering", "Kleding", "Fotografie", "Bloemen", "Muziek", "Vervoer", "Overig"];

export default function CostsClient() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/data/costs").then(async (response) => {
      if (!response.ok) throw new Error("Kosten ophalen is mislukt.");
      setCosts(await response.json() as Cost[]);
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Kosten ophalen is mislukt."));
  }, []);

  const total = useMemo(() => costs.reduce((sum, cost) => sum + cost.amount, 0), [costs]);
  const outstanding = useMemo(() => costs.filter((cost) => !cost.paid).reduce((sum, cost) => sum + cost.amount, 0), [costs]);

  async function addCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!title.trim() || !Number.isFinite(numericAmount) || numericAmount < 0) {
      setMessage("Vul een omschrijving en geldig bedrag in.");
      return;
    }
    const cost = { id: editingId ?? crypto.randomUUID(), title: title.trim(), category, amount: numericAmount, paid };
    const response = await fetch("/api/data/costs", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cost) });
    if (!response.ok) {
      setMessage("Kosten opslaan is mislukt.");
      return;
    }
    setCosts((current) => editingId ? current.map((item) => item.id === editingId ? cost : item) : [...current, cost]);
    setTitle("");
    setAmount("");
    setPaid(false);
    setEditingId(null);
    setMessage("");
  }

  function editCost(cost: Cost) {
    setEditingId(cost.id);
    setTitle(cost.title);
    setCategory(cost.category);
    setAmount(String(cost.amount));
    setPaid(cost.paid);
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setPaid(false);
  }

  async function removeCost(id: string) {
    const response = await fetch(`/api/data/costs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Kosten verwijderen is mislukt.");
      return;
    }
    setCosts((current) => current.filter((cost) => cost.id !== id));
  }

  return <main className="mx-auto w-[96%] max-w-5xl py-10 text-[#2D3A47]">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#536577]">Financiën</p>
    <h1 className="mt-2 text-4xl font-bold">Kosten</h1>
    <p className="mt-3 text-[#536577]">Houd alle trouwkosten overzichtelijk bij per categorie.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-white p-5 shadow"><p className="text-sm text-[#536577]">Totaal</p><p className="mt-1 text-2xl font-bold">€ {total.toFixed(2)}</p></div><div className="rounded-2xl bg-white p-5 shadow"><p className="text-sm text-[#536577]">Nog te betalen</p><p className="mt-1 text-2xl font-bold">€ {outstanding.toFixed(2)}</p></div></div>
    <form onSubmit={addCost} className="mt-8 grid gap-4 rounded-2xl bg-white p-6 shadow md:grid-cols-2">
      <label className="text-sm font-semibold">Omschrijving<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" placeholder="Bijvoorbeeld: trouwlocatie" /></label>
      <label className="text-sm font-semibold">Categorie<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] bg-white px-3 py-2">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="text-sm font-semibold">Bedrag (€)<input required min="0" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label>
      <label className="flex items-center gap-2 self-end text-sm font-semibold"><input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} /> Betaald</label>
      <div className="flex gap-2 md:col-span-2"><button className="flex-1 rounded-lg bg-[#2D3A47] px-5 py-3 font-bold text-white hover:bg-[#425365]">{editingId ? "Wijziging opslaan" : "Kosten toevoegen"}</button>{editingId && <button type="button" onClick={cancelEdit} className="rounded-lg bg-[#edf1f4] px-5 py-3 font-bold">Annuleren</button>}</div>
      {message && <p className="text-sm text-red-700 md:col-span-2">{message}</p>}
    </form>
    <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow"><div className="divide-y divide-[#e5eaee]">{costs.length === 0 ? <p className="p-6 text-[#536577]">Nog geen kosten toegevoegd.</p> : costs.map((cost) => <div key={cost.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-bold">{cost.title}</p><p className="text-sm text-[#536577]">{cost.category} · {cost.paid ? "Betaald" : "Nog te betalen"}</p></div><div className="flex items-center gap-4">    <strong>€ {cost.amount.toFixed(2)}</strong><button type="button" onClick={() => editCost(cost)} className="text-sm font-bold underline">Wijzigen</button><button type="button" onClick={() => removeCost(cost.id)} className="text-sm font-bold text-red-700 underline">Verwijderen</button></div></div>)}</div></section>
  </main>;
}
