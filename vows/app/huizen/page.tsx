"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "../components/header";
import LocationMap from "../components/location-map";

type Home = { id: string; title: string; address: string; price: string; notes: string; searchText?: string; status: string; livingArea: string; lotArea: string; bedrooms: string; energyLabel: string; municipality: string; url: string; rank: number };
type HomeForm = Omit<Home, "id" | "rank"> & { rank: string };
type BudgetParts = { mortgage: number | string; starterLoan: number | string; savings: number | string };
type SearchSettings = { id: string; mustHave: string; mustNotHave: string; niceToHave: string; bonus: string; dimensions: string; budgets: Record<string, BudgetParts | number | string> };

const emptyHome: HomeForm = { url: "", title: "", address: "", price: "", notes: "", searchText: "", status: "Potentieel", livingArea: "", lotArea: "", bedrooms: "", energyLabel: "", municipality: "", rank: "1" };
const emptySettings: SearchSettings = {
  id: "preferences",
  mustHave: "Tuin en bereikbaar met motor\nWoonhuis\nMinimaal 3 slaapkamers\nPlaats met voorzieningen (winkel, school)",
  mustNotHave: "Korte akker\nKort Haarlem\nSportlaan\nAmmerstol\nHaastrecht",
  niceToHave: "Garage / grote schuur\nGrote tuin\nHuis in Bergambacht",
  bonus: "Nette keuken en badkamer",
  dimensions: "Woonkamer: 720 x 360 cm\nSlaapkamer: 360 x 300 cm\nKleine kamer: 200 x 300 cm\nBadkamer: 200 x 160 cm\nZolder hoogste punt: 260 cm\nZolderkamer: 360 x 530 cm\nSchuur: 650 x 235 cm, hoogte 220 cm\nDeuropening schuur: 95 cm",
  budgets: { Gouda: { mortgage: 0, starterLoan: 0, savings: 0 }, Krimpenerwaard: { mortgage: 0, starterLoan: 0, savings: 0 } },
};

function budgetParts(value: BudgetParts | number | string | undefined): BudgetParts {
  if (typeof value === "object" && value !== null) return value;
  return { mortgage: value ?? 0, starterLoan: 0, savings: 0 };
}

function budgetTotal(value: BudgetParts | number | string | undefined) {
  const parts = budgetParts(value);
  return Number(parts.mortgage) + Number(parts.starterLoan) + Number(parts.savings);
}

function BudgetInputs({ municipality, value, onChange }: { municipality: string; value: BudgetParts | number | string | undefined; onChange: (key: keyof BudgetParts, value: string) => void }) {
  const parts = budgetParts(value);
  return <div className="rounded-xl border border-[#dce3e8] p-3"><p className="text-sm font-bold">{municipality}</p><div className="mt-2 grid gap-2"><label className="text-xs font-semibold">Kale hypotheek<input type="number" min="0" step="1" value={parts.mortgage} onChange={(event) => onChange("mortgage", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2 text-sm" /></label><label className="text-xs font-semibold">Starterslening<input type="number" min="0" step="1" value={parts.starterLoan} onChange={(event) => onChange("starterLoan", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2 text-sm" /></label><label className="text-xs font-semibold">Spaargeld<input type="number" min="0" step="1" value={parts.savings} onChange={(event) => onChange("savings", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2 text-sm" /></label><p className="text-xs text-[#718292]">Totaal: € {budgetTotal(parts).toLocaleString("nl-NL")}</p></div></div>;
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseSavedFundaHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const text = cleanText(document.body.textContent ?? "");
  const title = cleanText(document.querySelector("title")?.textContent?.replace(/\s*\|\s*Funda.*$/i, "") ?? "");
  const address = title.replace(/^Huis te koop:\s*/i, "");
  const price = text.match(/(?:€|€)\s*[\d.]+(?:,\d{2})?\s*k\.k\./i)?.[0]?.replace("€", "€") ?? "";
  const livingArea = text.match(/(\d+)\s*m(?:\u00c2)?\u00b2\s*wonen/i)?.[1] ?? "";
  const lotArea = text.match(/(\d+)\s*m(?:\u00c2)?\u00b2\s*perceel/i)?.[1] ?? "";
  const bedrooms = text.match(/(\d+)\s*slaapkamers/i)?.[1] ?? "";
  const energyLabel = text.match(/energielabel\s*([A-G])/i)?.[1]?.toUpperCase() ?? "";
  const municipality = /gouda/i.test(`${address} ${text}`) ? "Gouda" : /krimpen|bergambacht|schoonhoven|lekkerkerk|ouderkerk|amstel/i.test(`${address} ${text}`) ? "Krimpenerwaard" : "";
  return { title, address, price, livingArea, lotArea, bedrooms, energyLabel, municipality, searchText: text };
}

function wishMatches(wish: string, home: Home) {
  const normalized = wish.toLowerCase();
  const combined = `${home.title} ${home.address} ${home.notes} ${home.searchText ?? ""} ${home.livingArea} m2 ${home.lotArea} m2 ${home.bedrooms} slaapkamers energielabel ${home.energyLabel}`.toLowerCase();
  const number = normalized.match(/\d+/)?.[0];
  if (number && /(slaapkamer|m2|m²|wonen|perceel)/.test(normalized)) {
    if (/slaapkamer/.test(normalized)) return Number(home.bedrooms) >= Number(number);
    if (/perceel/.test(normalized)) return Number(home.lotArea) >= Number(number);
    return Number(home.livingArea) >= Number(number);
  }
  if (/\btuin\b|achtertuin|voortuin|bostuin|patio/.test(normalized)) {
    return /tuin|achtertuin|voortuin|bostuin|patio/.test(combined) || Number(home.lotArea) > 0;
  }
  if (/woonhuis|woning|huis/.test(normalized)) {
    return /woonhuis|woning|huis te koop|vrijstaande woning|tussenwoning|hoekwoning/.test(combined);
  }
  return combined.includes(normalized);
}

function energyLabelClass(label: string) {
  const normalized = label.toUpperCase();
  if (normalized.startsWith("A")) return "bg-[#2f9e44] text-white";
  if (normalized === "B") return "bg-[#74b816] text-white";
  if (normalized === "C") return "bg-[#c0ca33] text-[#2D3A47]";
  if (normalized === "D") return "bg-[#f08c00] text-white";
  if (normalized === "E") return "bg-[#e8590c] text-white";
  if (normalized === "F") return "bg-[#d94841] text-white";
  if (normalized === "G") return "bg-[#a61e4d] text-white";
  return "bg-[#edf1f4] text-[#536577]";
}

function FloorPlan({ dimensions }: { dimensions: string }) {
  const rooms = dimensions.split("\n").map((line) => line.trim()).filter(Boolean);
  return (
    <div className="rounded-xl border border-[#dce3e8] bg-[#f7f9fa] p-2">
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#718292]">Plattegrond</p>
      <div className="grid grid-cols-2 gap-1">
        {rooms.slice(0, 8).map((room) => {
          const [name, ...size] = room.split(":");
          return <div key={room} className="flex min-h-12 flex-col justify-center border border-[#8fa1ad] bg-white p-1 text-center text-[9px] leading-tight text-[#536577]"><span className="font-semibold">{name}</span><span>{size.join(":").trim()}</span></div>;
        })}
      </div>
    </div>
  );
}

export default function HuizenPage() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [form, setForm] = useState<HomeForm>(emptyHome);
  const [settings, setSettings] = useState<SearchSettings>(emptySettings);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<SearchSettings>(emptySettings);
  const [appointmentHome, setAppointmentHome] = useState<Home | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("10:00");
  const [draggedHomeId, setDraggedHomeId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/data/homes"), fetch("/api/data/house-search-settings")]).then(async ([homesResponse, settingsResponse]) => {
      if (!homesResponse.ok || !settingsResponse.ok) throw new Error("Huizenzoektocht ophalen is mislukt.");
      const [savedHomes, savedSettings] = await Promise.all([homesResponse.json() as Promise<Home[]>, settingsResponse.json() as Promise<SearchSettings[]>]);
      setHomes(savedHomes);
      if (savedSettings[0]) setSettings({ ...emptySettings, ...savedSettings[0], mustNotHave: savedSettings[0].mustNotHave || emptySettings.mustNotHave, dimensions: savedSettings[0].dimensions || emptySettings.dimensions, budgets: { ...emptySettings.budgets, ...savedSettings[0].budgets } });
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Gegevens ophalen is mislukt."));
  }, []);

  function updateForm(key: keyof typeof emptyHome, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function importDetails(file: File) {
    const parsed = parseSavedFundaHtml(await file.text());
    setForm((current) => ({ ...current, ...parsed }));
    setMessage("Eigenschappen uit het opgeslagen HTML-bestand zijn ingevuld. Controleer ze voor het opslaan.");
  }

  async function saveHome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.url.trim()) return;
    const rank = Number(form.rank);
    if (!Number.isInteger(rank) || rank < 1) { setMessage("Rangorde moet een positief geheel getal zijn, bijvoorbeeld 1, 2 of 3."); return; }
    if (homes.some((item) => item.id !== editingId && Number(item.rank) === rank)) { setMessage(`Rangorde ${rank} is al gebruikt. Kies een ander nummer.`); return; }
    const home: Home = { ...form, rank, id: editingId ?? crypto.randomUUID() };
    const response = await fetch("/api/data/homes", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(home) });
    if (!response.ok) { setMessage("Huis opslaan is mislukt."); return; }
    setHomes((current) => editingId ? current.map((item) => item.id === editingId ? home : item) : [home, ...current]);
    closeDialog();
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...settingsDraft,
      id: settings.id || "preferences",
      budgets: Object.fromEntries(Object.entries(settingsDraft.budgets).map(([municipality, value]) => {
        const parts = budgetParts(value);
        return [municipality, { mortgage: Number(parts.mortgage) || 0, starterLoan: Number(parts.starterLoan) || 0, savings: Number(parts.savings) || 0 }];
      })),
    };
    const response = await fetch("/api/data/house-search-settings", { method: settings.id === "preferences" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) { setMessage("Woonwensen opslaan is mislukt."); return; }
    setSettings(payload);
    setSettingsDialogOpen(false);
    setMessage("Woonwensen opgeslagen.");
  }

  function openAdd() { setEditingId(null); setForm(emptyHome); setMessage(""); setDialogOpen(true); }
  function openSettings() { setSettingsDraft({ ...settings, budgets: { ...settings.budgets } }); setSettingsDialogOpen(true); setMessage(""); }
  function openEdit(home: Home) { setEditingId(home.id); setForm({ ...home, rank: String(home.rank || 1) }); setMessage(""); setDialogOpen(true); }
  function closeDialog() { setDialogOpen(false); setEditingId(null); setForm(emptyHome); }
  function openAppointment(home: Home) {
    setAppointmentHome(home);
    setAppointmentDate(new Date().toISOString().slice(0, 10));
    setAppointmentTime("10:00");
  }

  async function saveAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appointmentHome || !appointmentDate || !appointmentTime) return;
    const response = await fetch("/api/data/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        title: `Bezichtiging: ${appointmentHome.title || appointmentHome.address || "huis"}`,
        date: appointmentDate,
        time: appointmentTime,
        location: appointmentHome.address,
        privateCoupleOnly: true,
        sharedWithCouple: true,
        visibleToCeremoniemeester: false,
      }),
    });
    if (!response.ok) {
      setMessage("Afspraak toevoegen aan de agenda is mislukt.");
      return;
    }
    setAppointmentHome(null);
    setMessage("PrivÃƒÂ©-afspraak toegevoegd aan de agenda.");
  }

  async function removeHome(id: string) {
    const response = await fetch(`/api/data/homes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) { setMessage("Huis verwijderen is mislukt."); return; }
    setHomes((current) => current.filter((home) => home.id !== id));
  }

  async function reorderHomes(targetId: string) {
    if (!draggedHomeId || draggedHomeId === targetId) return;
    const ordered = [...homes].sort((a, b) => (a.rank || 999) - (b.rank || 999));
    const fromIndex = ordered.findIndex((home) => home.id === draggedHomeId);
    const toIndex = ordered.findIndex((home) => home.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
    const updated = ordered.map((home, index) => ({ ...home, rank: index + 1 }));
    setDraggedHomeId(null);
    setHomes(updated);
    const responses = await Promise.all(updated.map((home) => fetch("/api/data/homes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(home),
    })));
    if (responses.some((response) => !response.ok)) {
      setMessage("De nieuwe huisvolgorde kon niet volledig worden opgeslagen.");
      return;
    }
    setMessage("Huisvolgorde opgeslagen.");
  }

  const wishes = (category: keyof Pick<SearchSettings, "mustHave" | "mustNotHave" | "niceToHave" | "bonus" | "dimensions">) => settings[category].split("\n").map((wish) => wish.trim()).filter(Boolean);
  const municipalities = ["Gouda", "Krimpenerwaard"];
  const orderedHomes = [...homes].sort((a, b) => (a.rank || 999) - (b.rank || 999));
  return <div className="min-h-screen"><Header active="Huis zoeken" /><main className="mx-auto w-[96%] max-w-6xl py-8 text-[#2D3A47]">
    <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#536577]">Samen zoeken</p><h1 className="mt-1 text-3xl font-bold">Ons volgende huis</h1><p className="mt-2 text-[#536577]">Bewaar Funda-links, vergelijk mogelijkheden en houd jullie woonwensen bij. Deze omgeving is alleen zichtbaar voor bruid en bruidegom.</p></div>
    <section className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <section className="h-fit space-y-4"><div className="rounded-2xl bg-white p-4 shadow-lg"><div className="flex flex-col gap-3"><div><h2 className="font-bold">Woonwensen</h2><p className="mt-1 text-xs text-[#718292]">Wensen en budgetten beheren</p></div><button type="button" onClick={openSettings} className="rounded-lg bg-[#edf1f4] px-3 py-2 text-sm font-bold text-[#536577] hover:bg-[#dce3e8]">Instellen</button></div></div><FloorPlan dimensions={settings.dimensions} />
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-lg"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Mogelijke huizen</h2><p className="mt-1 text-sm text-[#718292]">{homes.length} opgeslagen {homes.length === 1 ? "huis" : "huizen"}. Sleep een kaart om de volgorde te wijzigen.</p></div><button type="button" onClick={openAdd} className="rounded-lg bg-[#2D3A47] px-4 py-2 text-sm font-bold text-white hover:bg-[#425365]">+ Huis toevoegen</button></div>
        <div className="mt-5 space-y-3">{homes.length === 0 ? <p className="py-8 text-center text-[#718292]">Nog geen huizen opgeslagen.</p> : orderedHomes.map((home) => {         const budget = budgetTotal(settings.budgets[home.municipality]); const total = Number(home.price.replace(/[^\d]/g, "")) || 0; const difference = budget - total; const used = budget > 0 ? total / budget * 100 : 0; const chartPercentage = budget > 0 ? Math.min(Math.max(used, 0), 100) : 0; const isOverBudget = difference < 0; return <article key={home.id} draggable onDragStart={() => setDraggedHomeId(home.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => void reorderHomes(home.id)} className="cursor-grab rounded-xl border border-[#dce3e8] p-4 active:cursor-grabbing"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="rounded-full bg-[#2D3A47] px-2 py-1 text-xs font-bold text-white">#{home.rank || "-"}</span><h3 className="break-words text-lg font-bold">{home.title || "Onbenoemd huis"}</h3></div><p className="break-words text-sm text-[#536577]">{home.address || "Adres nog onbekend"}</p><a href={home.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-[#536577] underline">Bekijk op Funda</a></div><span className="rounded-full bg-[#edf1f4] px-3 py-1 text-xs font-semibold">{home.status}</span></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f7f9fa] p-3 text-sm sm:grid-cols-3 lg:grid-cols-6"><div><p className="text-xs text-[#718292]">Prijs</p><p className="font-bold">{home.price || "Onbekend"}</p></div><div><p className="text-xs text-[#718292]">Wonen</p><p className="font-bold">{home.livingArea ? `${home.livingArea} m²` : "Onbekend"}</p></div><div><p className="text-xs text-[#718292]">Perceel</p><p className="font-bold">{home.lotArea ? `${home.lotArea} m²` : "Onbekend"}</p></div><div><p className="text-xs text-[#718292]">Slaapkamers</p><p className="font-bold">{home.bedrooms || "Onbekend"}</p></div><div><p className="text-xs text-[#718292]">Energielabel</p><span className={`mt-1 inline-flex min-w-7 justify-center rounded px-2 py-0.5 text-xs font-bold ${energyLabelClass(home.energyLabel)}`}>{home.energyLabel || "?"}</span></div><div><p className="text-xs text-[#718292]">Gemeente</p><p className="font-bold">{home.municipality || "Onbekend"}</p></div></div>{home.address && <div className="mt-4"><LocationMap locations={[{ id: home.id, title: home.title || "Woning", location: home.address }]} className="h-48" /></div>}{budget > 0 ? <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-[#f7faf8] p-3"><div className="relative h-24 w-24 shrink-0 rounded-full" style={{ background: `conic-gradient(${isOverBudget ? "#b45309" : "#4f8f68"} ${chartPercentage}%, #dce3e8 ${chartPercentage}% 100%)` }} role="img" aria-label={`Woning gebruikt ${used.toFixed(0)} procent van het budget voor ${home.municipality}`}><div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white text-center"><strong className="text-sm">{used.toFixed(0)}%</strong><span className="text-[10px] text-[#536577]">gebruikt</span></div></div><div className="text-sm"><p className="font-semibold">Budget {home.municipality}</p><p className={isOverBudget ? "font-bold text-[#b45309]" : "font-bold text-[#4f8f68]"}>{isOverBudget ? `€ ${Math.abs(difference).toLocaleString("nl-NL")} boven budget` : `€ ${difference.toLocaleString("nl-NL")} over van budget`}</p><p className="text-xs text-[#718292]">Woning: € {total.toLocaleString("nl-NL")} · Budget: € {budget.toLocaleString("nl-NL")}</p></div></div> : <p className="mt-3 rounded-lg bg-[#fff8e8] p-3 text-sm text-[#8a5a00]">Geen budget ingesteld voor {home.municipality || "deze gemeente"}.</p>}                <div className="mt-3 space-y-1 text-sm">{(["mustHave", "niceToHave", "bonus"] as const).flatMap((category) => wishes(category).map((wish) => <p key={`${category}-${wish}`} className={wishMatches(wish, home) ? "text-[#4f8f68]" : "text-red-700"}>{wishMatches(wish, home) ? "✓" : "×"} {wish}</p>))}</div>{home.notes && <p className="mt-3 break-words text-sm text-[#536577]">{home.notes}</p>}<div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold"><button type="button" onClick={() => openAppointment(home)} className="rounded-lg bg-[#e6d8f0] px-3 py-2 text-[#5b3672]">Afspraak plannen</button><button type="button" onClick={() => openEdit(home)} className="text-[#536577] underline">Wijzigen</button><button type="button" onClick={() => void removeHome(home.id)} className="text-red-700 underline">Verwijderen</button></div></article> })}</div>
      </section>
    </section>
    {message && <p className="mt-4 text-sm text-[#536577]">{message}</p>}
    {appointmentHome && <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#2D3A47]/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setAppointmentHome(null); }}><form onSubmit={saveAppointment} className="w-full max-w-md rounded-2xl bg-white p-6 text-[#2D3A47] shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5b3672]">PrivÃ¯Â¿Â½ voor jullie</p><h2 className="mt-1 text-2xl font-bold">Bezichtiging plannen</h2></div><button type="button" aria-label="Venster sluiten" onClick={() => setAppointmentHome(null)} className="text-2xl text-[#718292]">Ã¯Â¿Â½</button></div><p className="mt-3 text-sm text-[#536577]">{appointmentHome.title || appointmentHome.address}</p><label className="mt-5 block text-sm font-semibold">Datum<input required type="date" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="mt-4 block text-sm font-semibold">Tijd<input required type="time" value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setAppointmentHome(null)} className="rounded-lg bg-[#edf1f4] px-4 py-2 font-semibold">Annuleren</button><button type="submit" className="rounded-lg bg-[#5b3672] px-4 py-2 font-bold text-white hover:bg-[#70458a]">Aan agenda toevoegen</button></div></form></div>}    {settingsDialogOpen && <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#2D3A47]/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsDialogOpen(false); }}><form onSubmit={saveSettings} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-[#2D3A47] shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#718292]">Huis zoeken</p><h2 className="mt-1 text-2xl font-bold">Woonwensen instellen</h2></div><button type="button" onClick={() => setSettingsDialogOpen(false)} aria-label="Venster sluiten" className="text-2xl text-[#718292]">×</button></div><p className="mt-2 text-sm text-[#718292]">EÃƒÂ©n wens per regel. Deze instellingen worden gebruikt om elk huis automatisch te beoordelen.</p>{(["mustHave", "mustNotHave", "niceToHave", "bonus"] as const).map((key) => <label key={key} className="mt-4 block text-sm font-semibold">{key === "mustHave" ? "Harde eisen" : key === "mustNotHave" ? "Harde eisen die niet mogen" : key === "niceToHave" ? "Leuk om te hebben" : "Bonus"}<textarea value={settingsDraft[key]} onChange={(event) => setSettingsDraft({ ...settingsDraft, [key]: event.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" placeholder="Bijvoorbeeld: tuin&#10;minimaal 3 slaapkamers" /></label>)}<div className="mt-4"><label className="block text-sm font-semibold">Huidige afmetingen<textarea value={settingsDraft.dimensions} onChange={(event) => setSettingsDraft({ ...settingsDraft, dimensions: event.target.value })} rows={7} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" placeholder="Een afmeting per regel" /></label></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{municipalities.map((municipality) => <BudgetInputs key={municipality} municipality={municipality} value={settingsDraft.budgets[municipality]} onChange={(key, value) => setSettingsDraft({ ...settingsDraft, budgets: { ...settingsDraft.budgets, [municipality]: { ...budgetParts(settingsDraft.budgets[municipality]), [key]: value } } })} />)}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setSettingsDialogOpen(false)} className="rounded-lg bg-[#edf1f4] px-4 py-2 font-semibold">Annuleren</button><button type="submit" className="rounded-lg bg-[#2D3A47] px-4 py-2 font-bold text-white hover:bg-[#425365]">Opslaan</button></div></form></div>}
    {dialogOpen && <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#2D3A47]/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}><form onSubmit={saveHome} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between gap-4"><h2 className="text-2xl font-bold">{editingId ? "Huis wijzigen" : "Huis toevoegen"}</h2><button type="button" onClick={closeDialog} aria-label="Venster sluiten" className="text-2xl text-[#718292]">×</button></div><label className="mt-5 block text-sm font-semibold">Funda-link<input required type="url" value={form.url} onChange={(event) => updateForm("url", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" placeholder="https://www.funda.nl/..." /></label><label className="mt-3 block text-sm font-semibold">Opgeslagen Funda HTML<input type="file" accept=".html,.htm,text/html" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importDetails(file); }} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2 text-sm" /></label><p className="mt-1 text-xs text-[#718292]">Funda blokkeert automatisch ophalen; kies daarom het lokaal opgeslagen HTML-bestand.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Titel<input value={form.title} onChange={(event) => updateForm("title", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="text-sm font-semibold">Adres<input value={form.address} onChange={(event) => updateForm("address", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="text-sm font-semibold">Prijs<input value={form.price} onChange={(event) => updateForm("price", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="text-sm font-semibold">Status<select value={form.status} onChange={(event) => updateForm("status", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] bg-white px-3 py-2"><option>Potentieel</option><option>Te bekijken</option><option>Favoriet</option><option>Bezichtigd</option><option>Afgevallen</option></select></label><label className="text-sm font-semibold">Woonoppervlak (m²)<input value={form.livingArea} onChange={(event) => updateForm("livingArea", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="text-sm font-semibold">Perceel (m²)<input value={form.lotArea} onChange={(event) => updateForm("lotArea", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="text-sm font-semibold">Slaapkamers<input value={form.bedrooms} onChange={(event) => updateForm("bedrooms", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="text-sm font-semibold">Energielabel<input value={form.energyLabel} onChange={(event) => updateForm("energyLabel", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="text-sm font-semibold sm:col-span-2">Gemeente<select value={form.municipality} onChange={(event) => updateForm("municipality", event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] bg-white px-3 py-2"><option value="">Onbekend</option>{municipalities.map((municipality) => <option key={municipality}>{municipality}</option>)}</select></label></div><label className="mt-4 block text-sm font-semibold">Rangorde<input required min="1" type="number" value={form.rank} onChange={(event) => setForm({ ...form, rank: event.target.value.replace(/[^0-9]/g, "") })} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label><label className="mt-4 block text-sm font-semibold">Notities<textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" /></label>{message && <p className="mt-3 text-sm text-[#536577]">{message}</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={closeDialog} className="rounded-lg bg-[#edf1f4] px-4 py-2 font-semibold">Annuleren</button><button className="rounded-lg bg-[#2D3A47] px-4 py-2 font-bold text-white">Opslaan</button></div></form></div>}
  </main></div>;
}
