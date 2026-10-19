"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "../components/header";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  parentId?: string;
  sharedWithCouple: boolean;
  visibleToCeremoniemeester: boolean;
  canEdit?: boolean;
};


export default function TakenPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [childFor, setChildFor] = useState<string | null>(null);
  const [newChild, setNewChild] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingSharedWithCouple, setEditingSharedWithCouple] = useState(true);
  const [editingVisibleToCeremoniemeester, setEditingVisibleToCeremoniemeester] = useState(false);

  useEffect(() => {
    void fetch("/api/data/tasks")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Taken ophalen is mislukt.")))
      .then((data: Task[]) => setTasks(data))
      .catch(() => undefined);
  }, []);

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTask.trim()) return;
    const task = {
      id: crypto.randomUUID(),
      title: newTask.trim(),
      completed: false,
      sharedWithCouple: true,
      visibleToCeremoniemeester: false,
      canEdit: true,
    };
    const response = await fetch("/api/data/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
    if (!response.ok) return;
    setTasks((current) => [...current, task]);
    setNewTask("");
  }

  async function addChild(event: FormEvent<HTMLFormElement>, parentId: string) {
    event.preventDefault();
    if (!newChild.trim()) return;
    const child = {
      id: crypto.randomUUID(),
      title: newChild.trim(),
      completed: false,
      parentId,
      sharedWithCouple: true,
      visibleToCeremoniemeester: false,
      canEdit: true,
    };
    const response = await fetch("/api/data/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(child) });
    if (!response.ok) return;
    setTasks((current) => [...current, child]);
    setNewChild("");
    setChildFor(null);
  }

  async function toggleTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    if (task.canEdit === false) return;
    const updated = { ...task, completed: !task.completed };
    const response = await fetch("/api/data/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    if (!response.ok) return;
    setTasks((current) => current.map((item) => item.id === id ? updated : item));
  }

  async function removeTask(id: string) {
    const ids = tasks.filter((task) => (task.id === id || task.parentId === id) && task.canEdit !== false).map((task) => task.id);
    await Promise.all(ids.map((taskId) => fetch(`/api/data/tasks?id=${encodeURIComponent(taskId)}`, { method: "DELETE" })));
    setTasks((current) => current.filter((task) => task.id !== id && task.parentId !== id));
  }

  function startEditing(task: Task) {
    if (task.canEdit === false) return;
    setEditingId(task.id);
    setEditingTitle(task.title);
    setEditingSharedWithCouple(task.sharedWithCouple !== false);
    setEditingVisibleToCeremoniemeester(Boolean(task.visibleToCeremoniemeester));
  }

  async function saveTaskTitle() {
    const task = tasks.find((item) => item.id === editingId);
    if (!task || !editingTitle.trim()) return;
    const updated = {
      ...task,
      title: editingTitle.trim(),
      sharedWithCouple: editingSharedWithCouple,
      visibleToCeremoniemeester: editingVisibleToCeremoniemeester,
    };
    const response = await fetch("/api/data/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    if (!response.ok) return;
    setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
    setEditingId(null);
    setEditingTitle("");
  }

  function closeEditor() {
    setEditingId(null);
    setEditingTitle("");
  }

  function EditIcon() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 16 9.5-9.5a2.1 2.1 0 0 1 3 3L7 19H4v-3Z" /><path d="m13.5 6.5 3 3" /></svg>;
  }

  function TrashIcon() {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
  }

  const parentTasks = tasks.filter((task) => !task.parentId);

  return (
    <div className="min-h-screen">
      <Header active="Taken" />
      <main className="mx-auto w-[96%] max-w-4xl py-8 text-[#2D3A47]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#536577]">Overzicht</p>
          <h1 className="mt-1 text-3xl font-bold">Taken</h1>
          <p className="mt-2 text-[#536577]">Maak hoofdtaken en voeg per hoofdtaak subtaken toe. Subtaken gaan maximaal één niveau diep.</p>
        </div>
        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <form onSubmit={addTask} className="mb-6 space-y-3">
            <input required value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Nieuwe hoofdtaak..." className="min-w-0 flex-1 rounded-lg border border-[#cad4dc] px-3 py-2" />
            <button type="submit" className="rounded-lg bg-[#2D3A47] px-4 py-2 font-bold text-white hover:bg-[#425365]">Toevoegen</button>
          </form>
          <div className="space-y-3">
            {parentTasks.map((task) => {
              const children = tasks.filter((child) => child.parentId === task.id);
              return (
                <div key={task.id} className="rounded-xl border border-[#dce3e8] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="h-4 w-4 accent-[#2D3A47]" />
                    <span className={`min-w-0 flex-1 break-words [overflow-wrap:anywhere] font-semibold ${task.completed ? "text-[#9aa7b1] line-through" : ""}`}>{task.title}</span>
                    {task.canEdit !== false && <button type="button" aria-label={`Wijzig taak ${task.title}`} title="Taak wijzigen" onClick={() => startEditing(task)} className="rounded-lg p-2 text-[#536577] hover:bg-[#edf1f4] hover:text-[#2D3A47]"><EditIcon /></button>}
                    {task.canEdit !== false && <button type="button" aria-label={`Voeg subtaak toe aan ${task.title}`} title="Subtaak toevoegen" onClick={() => setChildFor(childFor === task.id ? null : task.id)} className="rounded-lg px-2 py-1 text-lg font-semibold text-[#536577] hover:bg-[#edf1f4] hover:text-[#2D3A47]">+</button>}
                    {task.canEdit !== false && <button type="button" aria-label={`Verwijder taak ${task.title}`} title="Taak verwijderen" onClick={() => removeTask(task.id)} className="rounded-lg p-2 text-[#718292] hover:bg-red-50 hover:text-red-700"><TrashIcon /></button>}
                  </div>
                  {childFor === task.id && (
                    <form onSubmit={(event) => addChild(event, task.id)} className="mt-3 space-y-2 pl-7">
                      <input required autoFocus value={newChild} onChange={(event) => setNewChild(event.target.value)} placeholder="Naam van de subtaak..." className="min-w-0 flex-1 rounded-lg border border-[#cad4dc] px-3 py-2 text-sm" />
                      <button type="submit" className="rounded-lg bg-[#edf1f4] px-3 py-2 text-sm font-semibold">Opslaan</button>
                    </form>
                  )}
                  {children.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-[#dce3e8] pl-7">
                      {children.map((child) => (
                        <div key={child.id} className="flex flex-wrap items-center gap-3 text-sm">
                          <input type="checkbox" checked={child.completed} onChange={() => toggleTask(child.id)} className="h-4 w-4 accent-[#2D3A47]" />
                          <span className={`min-w-0 flex-1 break-words [overflow-wrap:anywhere] ${child.completed ? "text-[#9aa7b1] line-through" : ""}`}>{child.title}</span>
                          {child.canEdit !== false && <button type="button" aria-label={`Wijzig taak ${child.title}`} title="Taak wijzigen" onClick={() => startEditing(child)} className="rounded-lg p-2 text-[#536577] hover:bg-[#edf1f4] hover:text-[#2D3A47]"><EditIcon /></button>}
                          {child.canEdit !== false && <button type="button" aria-label={`Verwijder taak ${child.title}`} title="Taak verwijderen" onClick={() => removeTask(child.id)} className="rounded-lg p-2 text-[#718292] hover:bg-red-50 hover:text-red-700"><TrashIcon /></button>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {parentTasks.length === 0 && <p className="py-8 text-center text-[#718292]">Nog geen taken.</p>}
          </div>
        </section>
        {editingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D3A47]/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
            <form onSubmit={(event) => { event.preventDefault(); void saveTaskTitle(); }} className="w-full max-w-md rounded-2xl bg-white p-6 text-[#2D3A47] shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#718292]">Taak aanpassen</p>
                  <h2 className="mt-1 text-xl font-bold">Wijzig taak</h2>
                </div>
                <button type="button" aria-label="Venster sluiten" onClick={closeEditor} className="rounded-lg p-2 text-xl leading-none text-[#718292] hover:bg-[#edf1f4] hover:text-[#2D3A47]">×</button>
              </div>
              <label className="mt-5 block text-sm font-semibold">
                Taak
                <input autoFocus required value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2 outline-none focus:border-[#536577] focus:ring-2 focus:ring-[#A9B7C6]" />
              </label>
              <fieldset className="mt-5 space-y-3">
                <legend className="text-sm font-semibold">Zichtbaarheid</legend>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dce3e8] p-3 text-sm transition hover:border-[#A9B7C6]">
                  <input type="checkbox" checked={editingSharedWithCouple} onChange={(event) => setEditingSharedWithCouple(event.target.checked)} className="peer sr-only" />
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[#A9B7C6] text-transparent peer-checked:border-[#2D3A47] peer-checked:bg-[#2D3A47] peer-checked:text-white">✓</span>
                  <span><strong className="block">Bruid en bruidegom</strong><span className="text-[#718292]">De taak is zichtbaar voor het paar.</span></span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dce3e8] p-3 text-sm transition hover:border-[#A9B7C6]">
                  <input type="checkbox" checked={editingVisibleToCeremoniemeester} onChange={(event) => setEditingVisibleToCeremoniemeester(event.target.checked)} className="peer sr-only" />
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[#A9B7C6] text-transparent peer-checked:border-[#2D3A47] peer-checked:bg-[#2D3A47] peer-checked:text-white">✓</span>
                  <span><strong className="block">Ceremoniemeester</strong><span className="text-[#718292]">De taak wordt gedeeld met de ceremoniemeester.</span></span>
                </label>
              </fieldset>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={closeEditor} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#536577] hover:bg-[#edf1f4]">Annuleren</button>
                <button type="submit" className="rounded-lg bg-[#2D3A47] px-4 py-2 text-sm font-bold text-white hover:bg-[#425365]">Opslaan</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
