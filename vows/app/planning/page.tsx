"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "../components/header";
import LocationMap, { type MapLocation } from "../components/location-map";

type PlanningMoment = {
  id: string;
  time: string;
  title: string;
  location: string;
};

const quarterHours = Array.from({ length: 96 }, (_, index) => {
  const hour = String(Math.floor(index / 4)).padStart(2, "0");
  const minute = String((index % 4) * 15).padStart(2, "0");
  return `${hour}:${minute}`;
});

export default function PlanningPage() {
  const [moments, setMoments] = useState<PlanningMoment[]>([]);
  const [form, setForm] = useState({ time: "09:00", title: "", location: "" });
  const [formError, setFormError] = useState("");
  const [editingMomentId, setEditingMomentId] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/data/planning")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Planning ophalen is mislukt.")))
      .then((data: PlanningMoment[]) => setMoments(data))
      .catch((error: Error) => setFormError(error.message));
  }, []);

  const mapLocations: MapLocation[] = moments
    .filter((moment) => moment.location.trim())
    .map((moment) => ({ id: moment.id, title: moment.title, location: moment.location }));

  function startEditing(moment: PlanningMoment) {
    setEditingMomentId(moment.id);
    setForm({ time: moment.time, title: moment.title, location: moment.location });
    setFormError("");
  }

  function cancelEditing() {
    setEditingMomentId(null);
    setForm({ time: "09:00", title: "", location: "" });
    setFormError("");
  }

  async function saveMoment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      setFormError("Vul een titel in.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(form.time) || Number(form.time.slice(3)) % 15 !== 0) {
      setFormError("Kies een tijd op een kwartier, bijvoorbeeld 09:00, 09:15 of 09:30.");
      return;
    }
    if (moments.some((moment) => moment.id !== editingMomentId && moment.time === form.time)) {
      setFormError("Er bestaat al een moment op deze tijd.");
      return;
    }
    setFormError("");
    const moment = { ...form, title: form.title.trim(), location: form.location.trim(), id: editingMomentId ?? crypto.randomUUID() };
    const response = await fetch("/api/data/planning", {
      method: editingMomentId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(moment),
    });
    if (!response.ok) {
      setFormError(editingMomentId ? "Het moment kon niet worden gewijzigd." : "Het moment kon niet worden opgeslagen.");
      return;
    }
    setMoments((current) => (editingMomentId
      ? current.map((item) => item.id === editingMomentId ? moment : item)
      : [...current, moment]
    ).sort((a, b) => a.time.localeCompare(b.time)));
    cancelEditing();
  }

  async function removeMoment(id: string) {
    await fetch(`/api/data/planning?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setMoments((current) => current.filter((moment) => moment.id !== id));
  }

  return (
    <div className="min-h-screen">
      <Header active="Planning" />
      <main className="mx-auto w-[96%] max-w-7xl py-8 text-[#2D3A47]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#536577]">De grote dag</p>
          <h1 className="mt-1 text-3xl font-bold">Planning</h1>
          <p className="mt-2 text-[#536577]">Bekijk de momenten van jullie trouwdag en waar alles plaatsvindt.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <section className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-5 text-xl font-bold">Tijdlijn</h2>
            {moments.length === 0 ? (
              <p className="py-8 text-center text-[#718292]">Voeg het eerste moment van jullie dag toe.</p>
            ) : (
              <div className="relative ml-3 border-l-2 border-[#c8d6df]">
                {moments.map((moment) => (
                  <div key={moment.id} className="relative mb-6 pl-8 last:mb-0">
                    <span className="absolute -left-[16px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-[#2D3A47] text-xs font-bold text-white">{moments.indexOf(moment) + 1}</span>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-[#718292]">{moment.time}</p>
                        <h3 className="mt-1 text-lg font-bold">{moment.title}</h3>
                        {moment.location && <p className="mt-1 text-sm text-[#536577]">📍 {moment.location}</p>}
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => startEditing(moment)} className="text-xs font-semibold text-[#536577] hover:text-[#2D3A47]">Wijzigen</button>
                        <button type="button" onClick={() => removeMoment(moment.id)} className="text-xs font-semibold text-[#718292] hover:text-red-700">Verwijder</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold">{editingMomentId ? "Moment wijzigen" : "Moment toevoegen"}</h2>
              <form onSubmit={saveMoment} className="space-y-3">
                <label className="block text-sm font-semibold">Tijd
                  <select required value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="mt-1 w-full rounded-lg border border-[#cad4dc] bg-white px-3 py-2">
                    {quarterHours.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold">Titel
                  <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Bijvoorbeeld: Ceremonie" className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" />
                </label>
                <label className="block text-sm font-semibold">Locatie
                  <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Bijvoorbeeld: Kasteel de Haar" className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" />
                </label>
                {formError && <p className="text-sm text-red-700">{formError}</p>}
                <div className="flex gap-2">
                  {editingMomentId && <button type="button" onClick={cancelEditing} className="flex-1 rounded-lg bg-[#edf1f4] px-4 py-2 font-bold text-[#2D3A47] hover:bg-[#dce3e8]">Annuleren</button>}
                  <button type="submit" className="flex-1 rounded-lg bg-[#2D3A47] px-4 py-2 font-bold text-white hover:bg-[#425365]">{editingMomentId ? "Wijziging opslaan" : "Moment toevoegen"}</button>
                </div>
              </form>
            </section>
            <section className="rounded-2xl bg-white p-3 shadow-lg">
              <h2 className="px-3 pb-3 pt-2 text-xl font-bold">Locaties op de kaart</h2>
              <LocationMap locations={mapLocations} className="h-80" />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
