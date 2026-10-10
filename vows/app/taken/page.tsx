"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "../components/header";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  parentId?: string;
};


export default function TakenPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [childFor, setChildFor] = useState<string | null>(null);
  const [newChild, setNewChild] = useState("");

  useEffect(() => {
    void fetch("/api/data/tasks")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Taken ophalen is mislukt.")))
      .then((data: Task[]) => setTasks(data))
      .catch(() => undefined);
  }, []);

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTask.trim()) return;
    const task = { id: crypto.randomUUID(), title: newTask.trim(), completed: false };
    const response = await fetch("/api/data/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
    if (!response.ok) return;
    setTasks((current) => [...current, task]);
    setNewTask("");
  }

  async function addChild(event: FormEvent<HTMLFormElement>, parentId: string) {
    event.preventDefault();
    if (!newChild.trim()) return;
    const child = { id: crypto.randomUUID(), title: newChild.trim(), completed: false, parentId };
    const response = await fetch("/api/data/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(child) });
    if (!response.ok) return;
    setTasks((current) => [...current, child]);
    setNewChild("");
    setChildFor(null);
  }

  async function toggleTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const updated = { ...task, completed: !task.completed };
    const response = await fetch("/api/data/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    if (!response.ok) return;
    setTasks((current) => current.map((item) => item.id === id ? updated : item));
  }

  async function removeTask(id: string) {
    const ids = tasks.filter((task) => task.id === id || task.parentId === id).map((task) => task.id);
    await Promise.all(ids.map((taskId) => fetch(`/api/data/tasks?id=${encodeURIComponent(taskId)}`, { method: "DELETE" })));
    setTasks((current) => current.filter((task) => task.id !== id && task.parentId !== id));
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
          <form onSubmit={addTask} className="mb-6 flex gap-3">
            <input required value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Nieuwe hoofdtaak..." className="min-w-0 flex-1 rounded-lg border border-[#cad4dc] px-3 py-2" />
            <button type="submit" className="rounded-lg bg-[#2D3A47] px-4 py-2 font-bold text-white hover:bg-[#425365]">Toevoegen</button>
          </form>
          <div className="space-y-3">
            {parentTasks.map((task) => {
              const children = tasks.filter((child) => child.parentId === task.id);
              return (
                <div key={task.id} className="rounded-xl border border-[#dce3e8] p-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="h-4 w-4 accent-[#2D3A47]" />
                    <span className={`flex-1 font-semibold ${task.completed ? "text-[#9aa7b1] line-through" : ""}`}>{task.title}</span>
                    <button type="button" onClick={() => setChildFor(childFor === task.id ? null : task.id)} className="text-sm font-semibold text-[#536577] hover:text-[#2D3A47]">+ Subtaak</button>
                    <button type="button" onClick={() => removeTask(task.id)} className="text-sm text-[#718292] hover:text-red-700">Verwijder</button>
                  </div>
                  {childFor === task.id && (
                    <form onSubmit={(event) => addChild(event, task.id)} className="mt-3 flex gap-2 pl-7">
                      <input required autoFocus value={newChild} onChange={(event) => setNewChild(event.target.value)} placeholder="Naam van de subtaak..." className="min-w-0 flex-1 rounded-lg border border-[#cad4dc] px-3 py-2 text-sm" />
                      <button type="submit" className="rounded-lg bg-[#edf1f4] px-3 py-2 text-sm font-semibold">Opslaan</button>
                    </form>
                  )}
                  {children.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-[#dce3e8] pl-7">
                      {children.map((child) => (
                        <div key={child.id} className="flex items-center gap-3 text-sm">
                          <input type="checkbox" checked={child.completed} onChange={() => toggleTask(child.id)} className="h-4 w-4 accent-[#2D3A47]" />
                          <span className={`flex-1 ${child.completed ? "text-[#9aa7b1] line-through" : ""}`}>{child.title}</span>
                          <button type="button" onClick={() => removeTask(child.id)} className="text-[#718292] hover:text-red-700">Verwijder</button>
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
      </main>
    </div>
  );
}
