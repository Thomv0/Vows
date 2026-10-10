 import { logoutAction } from "../actions";

 export default function Header(props: { active?: string }) {
    return (
        <header className="bg-[#2D3A47] shadow">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-5 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-white">Vows</h1>
                <div className="flex flex-col items-end gap-2">
                <nav aria-label="Hoofdnavigatie">
                    <ul className="flex flex-wrap justify-end gap-x-5 gap-y-2">
                        {[
                            { name: "Home", href: "/" },
                            { name: "Agenda", href: "/agenda" },
                            { name: "Taken", href: "/taken" },
                            { name: "Planning", href: "/planning" },
                            { name: "Beheer", href: "/beheer" },
                        ].map((page) => (
                            <li key={page.name}>
                                <a href={page.href} className={`text-white hover:text-[#c8d6df] ${props.active === page.name ? "font-bold underline underline-offset-4" : ""}`}>
                                    {page.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                <form action={logoutAction}>
                    <button type="submit" className="text-xs text-[#c8d6df] hover:text-white">Uitloggen</button>
                </form>
                </div>
            </div>
        </header>
    );
}