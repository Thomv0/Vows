import Header from "./components/header";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <Header active="Home" />
      <main className="mx-auto w-[96%] max-w-7xl py-10 text-[#2D3A47]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#536577]">Welkom terug</p>
        <h1 className="mt-2 text-4xl font-bold">Jullie trouwdag in één overzicht</h1>
        <p className="mt-3 max-w-2xl text-[#536577]">Plan afspraken, verdeel taken en houd alle belangrijke momenten en locaties bij.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { title: "Agenda", text: "Bekijk en beheer afspraken.", href: "/agenda" },
            { title: "Grote dag", text: "Bouw de tijdlijn van jullie dag.", href: "/planning" },
            { title: "Taken", text: "Werk samen aan hoofd- en subtaken.", href: "/taken" },
          ].map((item) => (
            <a key={item.href} href={item.href} className="rounded-2xl bg-white p-6 shadow-lg transition hover:-translate-y-1">
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="mt-2 text-sm text-[#536577]">{item.text}</p>
              <span className="mt-5 block text-sm font-bold">Openen →</span>
            </a>
          ))}
        </div>
        <p className="mt-8 text-sm text-[#718292]">Ingelogd als {session.user.name ?? session.user.email} ({session.user.role}).</p>
      </main>
    </div>
  );
}
