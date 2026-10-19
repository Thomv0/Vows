"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import LocationMap from "../components/location-map";

type CalendarView = "day" | "week" | "month";

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  visibleToCeremoniemeester?: boolean;
  privateCoupleOnly?: boolean;
};

const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const monthFormatter = new Intl.DateTimeFormat("nl-NL", {
  month: "long",
  year: "numeric",
});

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + mondayOffset);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function AgendaPage() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<CalendarView>("month");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inspectedAppointment, setInspectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [planningDialog, setPlanningDialog] = useState<{ appointment: Appointment; title: string; time: string; location: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: dateKey(today),
    time: "09:00",
    location: "",
    visibleToCeremoniemeester: false,
    privateCoupleOnly: false,
  });

  useEffect(() => {
    void fetch("/api/data/appointments")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Agenda ophalen is mislukt.")))
      .then((data: Appointment[]) => setAppointments(data))
      .catch((error: Error) => setFormError(error.message));
  }, []);

  const monthDays = useMemo(() => {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const start = startOfWeek(firstDay);
    const days: Date[] = [];
    for (let index = 0; index < 42; index += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      days.push(day);
    }
    return days;
  }, [selectedDate]);

  const weekDaysWithDates = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return weekDays.map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [selectedDate]);

  const selectedAppointments = appointments
    .filter((appointment) => appointment.date === dateKey(selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time));

  function moveCalendar(direction: number) {
    const next = new Date(selectedDate);
    if (view === "day") next.setDate(next.getDate() + direction);
    if (view === "week") next.setDate(next.getDate() + direction * 7);
    if (view === "month") next.setMonth(next.getMonth() + direction);
    setSelectedDate(next);
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  function openDialog(date = selectedDate, appointment?: Appointment) {
    setEditingAppointmentId(appointment?.id ?? null);
    setFormError("");
    setForm(appointment
      ? { title: appointment.title, date: appointment.date, time: appointment.time, location: appointment.location, visibleToCeremoniemeester: Boolean(appointment.visibleToCeremoniemeester), privateCoupleOnly: Boolean(appointment.privateCoupleOnly) }
      : { title: "", date: dateKey(date), time: "09:00", location: "", visibleToCeremoniemeester: false, privateCoupleOnly: false });
    setIsDialogOpen(true);
  }

  async function saveAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) {
      setFormError("Vul titel, datum en tijd in.");
      return;
    }
    if (Number(form.time.slice(3)) % 15 !== 0) {
      setFormError("Kies een tijd op een kwartier, bijvoorbeeld 09:00, 09:15 of 09:30.");
      return;
    }
    if (appointments.some((appointment) => appointment.id !== editingAppointmentId && appointment.date === form.date && appointment.time === form.time)) {
      setFormError("Er staat al een afspraak op dit tijdstip.");
      return;
    }
    const savedAppointment = { ...form, title: form.title.trim(), location: form.location.trim(), id: editingAppointmentId ?? crypto.randomUUID() };
    const response = await fetch("/api/data/appointments", {
      method: editingAppointmentId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(savedAppointment),
    });
    if (!response.ok) {
      setFormError("De afspraak kon niet worden opgeslagen.");
      return;
    }

    setAppointments((current) => editingAppointmentId
      ? current.map((appointment) => appointment.id === editingAppointmentId ? savedAppointment : appointment)
      : [...current, savedAppointment]);
    setSelectedDate(new Date(`${form.date}T12:00:00`));
    setIsDialogOpen(false);
    setEditingAppointmentId(null);
  }

  async function addToPlanning() {
    if (!planningDialog) return;
    const response = await fetch("/api/data/planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: crypto.randomUUID(), time: planningDialog.time, title: planningDialog.title.trim(), location: planningDialog.location.trim() }),
    });
    if (!response.ok) {
      setFormError("De afspraak kon niet aan de planning worden toegevoegd.");
      return;
    }
    setInspectedAppointment(null);
    setPlanningDialog(null);
    setFormError("Afspraak toegevoegd aan de planning.");
  }

  async function deleteAppointment(id: string) {
    const response = await fetch(`/api/data/appointments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      setFormError("De afspraak kon niet worden verwijderd.");
      return;
    }
    setAppointments((current) => current.filter((appointment) => appointment.id !== id));
    setInspectedAppointment(null);
  }

  function downloadIcs(appointment: Appointment) {
    const start = `${appointment.date.replace(/-/g, "")}T${appointment.time.replace(":", "")}00`;
    const endDate = new Date(`${appointment.date}T${appointment.time}:00`);
    endDate.setMinutes(endDate.getMinutes() + 60);
    const end = `${dateKey(endDate).replace(/-/g, "")}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;
    const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const contents = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Vows//Agenda//NL",
      "BEGIN:VEVENT",
      `UID:${appointment.id}@vows`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcs(appointment.title)}`,
      appointment.location ? `LOCATION:${escapeIcs(appointment.location)}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
    const url = URL.createObjectURL(new Blob([contents], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${appointment.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "afspraak"}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function appointmentsFor(date: Date) {
    return appointments
      .filter((appointment) => appointment.date === dateKey(date))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  const rangeLabel =
    view === "day"
      ? formatDate(selectedDate)
      : view === "week"
        ? `${formatDate(weekDaysWithDates[0])} - ${formatDate(weekDaysWithDates[6])}`
        : monthFormatter.format(selectedDate);

  return (
    <div className="min-h-screen">
      <Header active="Agenda" />
      <div className="mx-auto w-[96%] max-w-7xl py-8 text-[#2D3A47]">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#536577]">Jouw planning</p>
            <h2 className="mt-1 text-3xl font-bold">Agenda</h2>
          </div>
          <button
            type="button"
            onClick={() => openDialog()}
            className="rounded-lg bg-[#2D3A47] px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-[#425365]"
          >
            + Nieuwe afspraak
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col gap-4 border-b border-[#dce3e8] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button type="button" onClick={goToToday} className="rounded-lg border border-[#cad4dc] px-3 py-2 text-sm font-semibold hover:bg-[#f2f5f7]">
                Vandaag
              </button>
              <button type="button" aria-label="Vorige periode" onClick={() => moveCalendar(-1)} className="rounded-lg border border-[#cad4dc] px-3 py-2 text-lg leading-none hover:bg-[#f2f5f7]">
                ‹
              </button>
              <button type="button" aria-label="Volgende periode" onClick={() => moveCalendar(1)} className="rounded-lg border border-[#cad4dc] px-3 py-2 text-lg leading-none hover:bg-[#f2f5f7]">
                ›
              </button>
              <h3 className="ml-2 min-w-0 truncate text-lg font-bold">{rangeLabel}</h3>
            </div>
            <div className="flex w-full rounded-lg bg-[#edf1f4] p-1 sm:w-auto">
              {(["day", "week", "month"] as CalendarView[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold capitalize sm:px-4 ${view === option ? "bg-white shadow-sm" : "text-[#536577]"}`}
                >
                  {option === "day" ? "Dag" : option === "week" ? "Week" : "Maand"}
                </button>
              ))}
            </div>
          </div>

          {view === "month" && (
            <div className="overflow-x-auto">
            <div className="grid min-w-[560px] grid-cols-7">
              {weekDays.map((day) => (
                <div key={day} className="border-b border-[#dce3e8] p-3 text-center text-xs font-bold uppercase tracking-wide text-[#718292]">{day}</div>
              ))}
              {monthDays.map((date) => {
                const dayAppointments = appointmentsFor(date);
                const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                const isToday = dateKey(date) === dateKey(today);
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => openDialog(date)}
                    className={`min-h-28 border-b border-r border-[#dce3e8] p-2 text-left align-top transition hover:bg-[#f5f8fa] ${!isCurrentMonth ? "bg-[#fafbfc] text-[#aab4bd]" : ""}`}
                  >
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-[#2D3A47] text-white" : ""}`}>{date.getDate()}</span>
                    <span className="mt-1 block space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => (
                        <span key={appointment.id} onClick={(event) => { event.stopPropagation(); setInspectedAppointment(appointment); }} className={`block cursor-pointer truncate rounded px-2 py-1 text-xs font-semibold ${appointment.privateCoupleOnly ? "bg-[#e6d8f0] text-[#5b3672]" : "bg-[#dce8ef] text-[#2D3A47]"}`}>
                          {formatTime(appointment.time)} {appointment.title}
                        </span>
                      ))}
                      {dayAppointments.length > 3 && <span className="text-xs text-[#718292]">+{dayAppointments.length - 3} more</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            </div>
          )}

          {view === "week" && (
            <div className="overflow-x-auto">
            <div className="grid min-w-[700px] grid-cols-7 divide-x divide-[#dce3e8]">
              {weekDaysWithDates.map((date, index) => (
                <div key={date.toISOString()} className="min-h-80 min-w-28">
                  <button type="button" onClick={() => openDialog(date)} className={`w-full border-b border-[#dce3e8] p-3 text-center hover:bg-[#f5f8fa] ${dateKey(date) === dateKey(today) ? "text-[#2D3A47]" : "text-[#718292]"}`}>
                    <span className="block text-xs font-bold uppercase">{weekDays[index]}</span>
                    <span className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold ${dateKey(date) === dateKey(today) ? "bg-[#2D3A47] text-white" : ""}`}>{date.getDate()}</span>
                  </button>
                  <div className="space-y-2 p-2">
                    {appointmentsFor(date).map((appointment) => (
                      <div key={appointment.id} className={`rounded-lg p-2 text-xs ${appointment.privateCoupleOnly ? "bg-[#e6d8f0] text-[#5b3672]" : "bg-[#dce8ef]"}`}>
                        <button type="button" onClick={() => setInspectedAppointment(appointment)} className="w-full text-left">
                          <p className="font-bold">{formatTime(appointment.time)}</p>
                          <p className="mt-1 font-semibold">{appointment.title}</p>
                          {appointment.location && <p className="mt-1 truncate text-[#536577]">{appointment.location}</p>}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}

          {view === "day" && (
            <div className="min-h-80 p-5">
              <div className="mb-4 flex items-center justify-between border-b border-[#dce3e8] pb-4">
                <div>
                  <p className="text-sm text-[#718292]">{formatDate(selectedDate)}</p>
                    <p className="text-2xl font-bold">{selectedAppointments.length} afspraak{selectedAppointments.length === 1 ? "" : "ken"}</p>
                </div>
                <button type="button" onClick={() => openDialog(selectedDate)} className="rounded-lg bg-[#edf1f4] px-4 py-2 text-sm font-semibold hover:bg-[#dce3e8]">                Afspraak toevoegen</button>
              </div>
              {selectedAppointments.length === 0 ? (
                <p className="py-10 text-center text-[#718292]">Nog niets gepland.</p>
              ) : (
                <div className="space-y-3">
                  {selectedAppointments.map((appointment) => {
                    return (
                      <div key={appointment.id} className="flex w-full gap-4 rounded-xl border border-[#dce3e8] p-4">
                        <span className="w-20 shrink-0 font-bold">{formatTime(appointment.time)}</span>
                        <button type="button" onClick={() => setInspectedAppointment(appointment)} className="border-l-2 border-[#9db3c2] pl-4 text-left">
                          <p className="font-bold">{appointment.title}</p>
                          {appointment.location && <p className="mt-1 text-sm text-[#536577]">{appointment.location}</p>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#2D3A47]/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="appointment-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-[#2D3A47] shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#718292]">Afspraak plannen</p>
                <h2 id="appointment-title" className="text-2xl font-bold">{editingAppointmentId ? "Afspraak wijzigen" : "Nieuwe afspraak"}</h2>
              </div>
              <button type="button" aria-label="Dialoog sluiten" onClick={() => setIsDialogOpen(false)} className="text-2xl text-[#718292] hover:text-[#2D3A47]">×</button>
            </div>
            <form onSubmit={saveAppointment} className="space-y-4">
              <label className="block text-sm font-semibold">Titel / naam
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2 outline-none focus:border-[#2D3A47]" placeholder="Bijvoorbeeld: locatie bekijken" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold">Datum
                  <input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2 outline-none focus:border-[#2D3A47]" />
                </label>
                <label className="block text-sm font-semibold">Tijd
                  <select required value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="mt-1 w-full rounded-lg border border-[#cad4dc] bg-white px-3 py-2 outline-none focus:border-[#2D3A47]">
                    {Array.from({ length: 96 }, (_, index) => {
                      const hour = String(Math.floor(index / 4)).padStart(2, "0");
                      const minute = String((index % 4) * 15).padStart(2, "0");
                      const value = `${hour}:${minute}`;
                      return <option key={value} value={value}>{value}</option>;
                    })}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold">Locatie
                <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2 outline-none focus:border-[#2D3A47]" placeholder="Bijvoorbeeld: stadhuis" />
                {form.location && <LocationMap key={form.location} locations={[{ id: "new", title: form.title || "Nieuwe afspraak", location: form.location }]} className="mt-2 h-36" />}
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.visibleToCeremoniemeester} onChange={(event) => setForm({ ...form, visibleToCeremoniemeester: event.target.checked })} /> Ook zichtbaar voor de ceremoniemeester</label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.privateCoupleOnly} onChange={(event) => setForm({ ...form, privateCoupleOnly: event.target.checked, visibleToCeremoniemeester: event.target.checked ? false : form.visibleToCeremoniemeester })} /> Privé voor bruid en bruidegom</label>
              {formError && <p className="text-sm text-red-700">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#536577] hover:bg-[#edf1f4]">Annuleren</button>
                <button type="submit" className="rounded-lg bg-[#2D3A47] px-5 py-2 text-sm font-bold text-white hover:bg-[#425365]">{editingAppointmentId ? "Wijziging opslaan" : "Afspraak opslaan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inspectedAppointment && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#2D3A47]/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="appointment-details-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-[#2D3A47] shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#718292]">Afspraak bekijken</p>
                <h2 id="appointment-details-title" className="text-2xl font-bold">{inspectedAppointment.title}</h2>
              </div>
              <button type="button" aria-label="Sluiten" onClick={() => setInspectedAppointment(null)} className="text-2xl text-[#718292] hover:text-[#2D3A47]">×</button>
            </div>
            <dl className="space-y-3 text-sm">
              <div><dt className="font-semibold text-[#718292]">Datum</dt><dd>{formatDate(new Date(`${inspectedAppointment.date}T12:00:00`))}</dd></div>
              <div><dt className="font-semibold text-[#718292]">Tijd</dt><dd>{formatTime(inspectedAppointment.time)}</dd></div>
              {inspectedAppointment.location && (
                <div>
                  <dt className="font-semibold text-[#718292]">Locatie</dt>
                  <dd>{inspectedAppointment.location}</dd>
                  <LocationMap key={`${inspectedAppointment.id}-${inspectedAppointment.location}`} locations={[{ id: inspectedAppointment.id, title: inspectedAppointment.title, location: inspectedAppointment.location }]} className="mt-2 h-36" />
                </div>
              )}
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setInspectedAppointment(null); openDialog(new Date(`${inspectedAppointment.date}T12:00:00`), inspectedAppointment); }} className="rounded-lg bg-[#edf1f4] px-3 py-3 text-sm font-semibold hover:bg-[#dce3e8]">Wijzigen</button>
                <button type="button" onClick={() => deleteAppointment(inspectedAppointment.id)} className="rounded-lg bg-red-50 px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-100">Verwijderen</button>
                <button type="button" onClick={() => downloadIcs(inspectedAppointment)} className="rounded-lg bg-[#edf1f4] px-3 py-3 text-sm font-semibold hover:bg-[#dce3e8]">Aan eigen agenda toevoegen</button>
                <button type="button" onClick={() => setPlanningDialog({ appointment: inspectedAppointment, title: `Afspraak: ${inspectedAppointment.title}`, time: inspectedAppointment.time, location: inspectedAppointment.location })} className="rounded-lg bg-[#edf1f4] px-3 py-3 text-sm font-semibold hover:bg-[#dce3e8]">Naar planning</button>
                <button type="button" onClick={() => setInspectedAppointment(null)} className="col-span-2 rounded-lg bg-[#2D3A47] px-5 py-3 text-sm font-bold text-white hover:bg-[#425365]">Sluiten</button>
            </div>
          </div>
        </div>
      )}
      {planningDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#2D3A47]/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-[#2D3A47] shadow-2xl">
            <h2 className="text-2xl font-bold">Aan planning toevoegen</h2>
            <p className="mt-2 text-sm text-[#536577]">Controleer wat er als nieuw moment wordt overgenomen.</p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold">Titel<input value={planningDialog.title} onChange={(event) => setPlanningDialog({ ...planningDialog, title: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
              <label className="block text-sm font-semibold">Tijd<select value={planningDialog.time} onChange={(event) => setPlanningDialog({ ...planningDialog, time: event.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2">{Array.from({ length: 96 }, (_, index) => { const value = `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`; return <option key={value}>{value}</option>; })}</select></label>
              <label className="block text-sm font-semibold">Locatie<input value={planningDialog.location} onChange={(event) => setPlanningDialog({ ...planningDialog, location: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setPlanningDialog(null)} className="rounded-lg bg-[#edf1f4] px-4 py-2 font-semibold">Annuleren</button><button type="button" onClick={addToPlanning} disabled={!planningDialog.title.trim()} className="rounded-lg bg-[#2D3A47] px-4 py-2 font-bold text-white disabled:opacity-50">Toevoegen</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
