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
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetMessage, setBudgetMessage] = useState("");
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/data/costs"), fetch("/api/data/budget")]).then(async ([costsResponse, budgetResponse]) => {
      if (!costsResponse.ok || !budgetResponse.ok) throw new Error("Kosten ophalen is mislukt.");
      const [savedCosts, savedBudgets] = await Promise.all([costsResponse.json() as Promise<Cost[]>, budgetResponse.json() as Promise<Array<{ amount: number }>>]);
      setCosts(savedCosts);
      const savedBudget = savedBudgets[0]?.amount ?? 0;
      setBudget(savedBudget);
      setBudgetInput(savedBudget ? String(savedBudget) : "");
      setBudgetSaved(savedBudgets.length > 0);
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Kosten ophalen is mislukt."));
  }, []);

  const total = useMemo(() => costs.reduce((sum, cost) => sum + cost.amount, 0), [costs]);
  const outstanding = useMemo(() => costs.filter((cost) => !cost.paid).reduce((sum, cost) => sum + cost.amount, 0), [costs]);
  const remainingBudget = Math.max(budget - total, 0);
  const usedPercentage = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
  const remainingPercentage = budget > 0 ? Math.max(100 - usedPercentage, 0) : 0;
  const overBudget = Math.max(total - budget, 0);

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericBudget = Number(budgetInput);
    if (!Number.isFinite(numericBudget) || numericBudget < 0) {
      setBudgetMessage("Vul een geldig budget in.");
      return;
    }
    const method = budgetSaved ? "PUT" : "POST";
    const response = await fetch("/api/data/budget", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "budget", amount: numericBudget }),
    });
    if (!response.ok) {
      setBudgetMessage("Budget opslaan is mislukt.");
      return;
    }
    setBudget(numericBudget);
    setBudgetInput(String(numericBudget));
    setBudgetSaved(true);
    setBudgetMessage("Budget opgeslagen.");
  }

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
    setIsCostDialogOpen(false);
    setMessage("");
  }

  function editCost(cost: Cost) {
    setEditingId(cost.id);
    setTitle(cost.title);
    setCategory(cost.category);
    setAmount(String(cost.amount));
    setPaid(cost.paid);
    setMessage("");
    setIsCostDialogOpen(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setPaid(false);
    setMessage("");
  }

  function openAddCost() {
    cancelEdit();
    setIsCostDialogOpen(true);
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
    <section className="mt-8 grid gap-6 rounded-2xl bg-white p-6 shadow md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#536577]">Budget</p>
        <h2 className="mt-1 text-2xl font-bold">Plan je trouwbudget</h2>
        <form onSubmit={saveBudget} className="mt-4 flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="budget">Totaal budget</label>
          <div className="flex min-w-[200px] flex-1 items-center rounded-lg border border-[#cad4dc] px-3">
            <span className="text-[#718292]">€</span>
            <input id="budget" required min="0" step="0.01" type="number" value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} className="min-w-0 flex-1 px-2 py-2 outline-none" placeholder="Bijvoorbeeld 15000" />
          </div>
          <button type="submit" className="rounded-lg bg-[#2D3A47] px-4 py-2 font-bold text-white hover:bg-[#425365]">Budget opslaan</button>
        </form>
        {budgetMessage && <p className="mt-2 text-sm text-[#536577]">{budgetMessage}</p>}
        {budget > 0 ? <p className="mt-4 text-[#536577]"><strong>€ {remainingBudget.toFixed(2)}</strong> resterend van € {budget.toFixed(2)} ({remainingPercentage.toFixed(0)}% resterend).</p> : <p className="mt-4 text-[#536577]">Stel een budget in om je voortgang te zien.</p>}
        {overBudget > 0 && <p className="mt-1 text-sm font-semibold text-red-700">Je zit € {overBudget.toFixed(2)} boven budget.</p>}
      </div>
      <div className="mx-auto flex flex-col items-center gap-3">
        <div className="relative h-44 w-44 rounded-full" style={{ background: budget > 0 ? `conic-gradient(#4f8f68 ${remainingPercentage}%, #dce3e8 ${remainingPercentage}% 100%)` : "#dce3e8" }} aria-label={budget > 0 ? `${remainingPercentage.toFixed(0)} procent van het budget resterend` : "Nog geen budget ingesteld"} role="img">
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center"><strong className="text-2xl">{budget > 0 ? `${remainingPercentage.toFixed(0)}%` : "—"}</strong><span className="text-xs text-[#536577]">resterend</span></div>
        </div>
        <div className="flex gap-4 text-xs text-[#536577]"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#4f8f68]" />Resterend</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#dce3e8]" />Uitgegeven</span></div>
      </div>
    </section>
    <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-white p-5 shadow"><p className="text-sm text-[#536577]">Totaal kosten</p><p className="mt-1 text-2xl font-bold">€ {total.toFixed(2)}</p></div><div className="rounded-2xl bg-white p-5 shadow"><p className="text-sm text-[#536577]">Nog te betalen</p><p className="mt-1 text-2xl font-bold">€ {outstanding.toFixed(2)}</p></div></div>
    <button type="button" onClick={openAddCost} className="mt-8 w-full rounded-2xl bg-[#2D3A47] px-5 py-4 font-bold text-white shadow hover:bg-[#425365]">+ Kosten toevoegen</button>
    <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow"><div className="divide-y divide-[#e5eaee]">{costs.length === 0 ? <p className="p-6 text-[#536577]">Nog geen kosten toegevoegd.</p> : costs.map((cost) => <div key={cost.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-bold">{cost.title}</p><p className="text-sm text-[#536577]">{cost.category} · {cost.paid ? "Betaald" : "Nog te betalen"}</p></div><div className="flex items-center gap-4">    <strong>€ {cost.amount.toFixed(2)}</strong><button type="button" onClick={() => editCost(cost)} className="text-sm font-bold underline">Wijzigen</button><button type="button" onClick={() => removeCost(cost.id)} className="text-sm font-bold text-red-700 underline">Verwijderen</button></div></div>)}</div></section>
    {isCostDialogOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D3A47]/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { cancelEdit(); setIsCostDialogOpen(false); } }}>
      <form onSubmit={addCost} className="w-full max-w-lg rounded-2xl bg-white p-6 text-[#2D3A47] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#718292]">Financiën</p><h2 className="mt-1 text-2xl font-bold">{editingId ? "Kosten wijzigen" : "Kosten toevoegen"}</h2></div>
          <button type="button" aria-label="Venster sluiten" onClick={() => { cancelEdit(); setIsCostDialogOpen(false); }} className="rounded-lg p-2 text-xl leading-none text-[#718292] hover:bg-[#edf1f4]">×</button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">Omschrijving<input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" placeholder="Bijvoorbeeld: trouwlocatie" /></label>
          <label className="text-sm font-semibold">Categorie<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] bg-white px-3 py-2">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-semibold">Bedrag (€)<input required min="0" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label>
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} /> Betaald</label>
        </div>
        {message && <p className="mt-4 text-sm text-red-700">{message}</p>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => { cancelEdit(); setIsCostDialogOpen(false); }} className="rounded-lg bg-[#edf1f4] px-5 py-3 font-bold">Annuleren</button><button type="submit" className="rounded-lg bg-[#2D3A47] px-5 py-3 font-bold text-white hover:bg-[#425365]">{editingId ? "Wijziging opslaan" : "Kosten toevoegen"}</button></div>
      </form>
    </div>}
  </main>;
}
