import { loginAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#A9B7C6] p-4 text-[#2D3A47]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#536577]">Welkom bij Vows</p>
        <h1 className="mt-2 text-3xl font-bold">Inloggen</h1>
        <p className="mt-2 text-sm text-[#536577]">Log in om jullie trouwplanning te bekijken.</p>
        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">E-mailadres
            <input required name="email" type="email" className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" />
          </label>
          <label className="block text-sm font-semibold">Wachtwoord
            <input required name="password" type="password" className="mt-1 w-full rounded-lg border border-[#cad4dc] px-3 py-2" />
          </label>
          {error === "credentials" && <p className="text-sm text-red-700">E-mailadres of wachtwoord is niet juist.</p>}
          <button type="submit" className="w-full rounded-lg bg-[#2D3A47] px-4 py-3 font-bold text-white hover:bg-[#425365]">Inloggen</button>
        </form>
        <p className="mt-6 text-center text-sm text-[#536577]"><a href="/wachtwoord-vergeten" className="font-bold underline">Wachtwoord vergeten?</a></p>
      </div>
    </main>
  );
}
