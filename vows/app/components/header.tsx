"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ADMIN_EMAIL } from "@/lib/admin";
import { logoutAction } from "../actions";

type SessionData = {
    user?: {
        email?: string | null;
        role?: "bruid" | "bruidegom" | "ceremoniemeester";
    };
} | null;

const SESSION_CACHE_KEY = "vows-header-session";

const basePages = [
    { name: "Agenda", href: "/agenda" },
    { name: "Taken", href: "/taken" },
    { name: "Inspiratie", href: "/inspiratie" },
    { name: "Planning", href: "/planning" },
];

export default function Header(props: { active?: string }) {
    const [session, setSession] = useState<SessionData>(() => {
        if (typeof window === "undefined") return null;
        const cached = window.sessionStorage.getItem(SESSION_CACHE_KEY);
        if (!cached) return null;
        try {
            return JSON.parse(cached) as SessionData;
        } catch {
            window.sessionStorage.removeItem(SESSION_CACHE_KEY);
            return null;
        }
    });
    const [sessionLoaded, setSessionLoaded] = useState(() => typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_CACHE_KEY) !== null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        void fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
            .then((response) => response.ok ? response.json() as Promise<SessionData> : Promise.reject(new Error("Sessie ophalen is mislukt.")))
            .then((data) => {
                setSession(data);
                if (data) {
                    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
                } else {
                    window.sessionStorage.removeItem(SESSION_CACHE_KEY);
                }
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return;
                setSession(null);
                window.sessionStorage.removeItem(SESSION_CACHE_KEY);
            })
            .finally(() => {
                if (!controller.signal.aborted) setSessionLoaded(true);
            });
        return () => controller.abort();
    }, []);

    const isCouple = session?.user?.role === "bruid" || session?.user?.role === "bruidegom";
    const isAdmin = session?.user?.email?.trim().toLowerCase() === ADMIN_EMAIL;
    const optionalPages = [
        { name: "Kosten", href: "/kosten", visible: isCouple },
        { name: "Huis zoeken", href: "/huizen", visible: isCouple },
        { name: "Beheer", href: "/beheer", visible: isAdmin },
    ];
    const pages: Array<{ name: string; href: string; visible?: boolean }> = [...basePages, ...optionalPages];
    const itemWidth = (name: string) => {
        if (name === "Inspiratie") return "sm:w-28";
        if (name === "Planning") return "sm:w-24";
        if (name === "Kosten" || name === "Beheer") return "sm:w-20";
        if (name === "Huis zoeken") return "sm:w-28";
        return "sm:w-16";
    };

    return (
        <header className="min-h-[76px] bg-[#2D3A47] shadow">
            <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                {sessionLoaded && session ? <Link href="/" className="shrink-0 text-3xl font-bold tracking-tight text-white">Vows</Link> : <h1 className="shrink-0 text-3xl font-bold tracking-tight text-white">Vows</h1>}
                <button type="button" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)} className="rounded-lg border border-[#718292] px-3 py-2 text-sm font-bold text-white sm:hidden">
                    {menuOpen ? "Sluiten" : "Menu"}
                </button>
                <div id="main-navigation" className={`${menuOpen ? "flex" : "hidden"} absolute left-0 right-0 top-[76px] z-50 flex-col gap-3 bg-[#2D3A47] px-4 py-4 shadow-lg sm:static sm:flex sm:min-w-0 sm:flex-1 sm:flex-row sm:items-center sm:justify-end sm:gap-5 sm:bg-transparent sm:p-0 sm:shadow-none`}>
                    <nav aria-label="Hoofdnavigatie" className="min-w-0 max-w-full overflow-x-auto">
                        <ul className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-5">
                            {pages.map((page) => (
                                <li key={page.name} className={`${itemWidth(page.name)} whitespace-nowrap ${page.visible === false ? "invisible" : ""}`}>
                                    <Link href={page.href} onClick={() => setMenuOpen(false)} aria-current={props.active === page.name ? "page" : undefined} className={`block text-center text-white hover:text-[#c8d6df] ${props.active === page.name ? "underline decoration-2 underline-offset-4" : ""}`}>
                                        {page.name}
                                    </Link>
                                </li>
                            ))}
                            <li className="sm:w-20 whitespace-nowrap">
                                <form id="header-logout-form" action={logoutAction}>
                                    <button type="submit" className="block w-full text-center text-white hover:text-[#c8d6df]">Uitloggen</button>
                                </form>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
}
