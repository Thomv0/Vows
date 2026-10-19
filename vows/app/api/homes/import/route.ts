import { NextResponse } from "next/server";
import { auth } from "@/auth";

function textFromHtml(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "bruid" && session.user.role !== "bruidegom")) {
    return NextResponse.json({ error: "Alleen bruid en bruidegom hebben toegang." }, { status: 403 });
  }
  try {
    const { url } = await request.json();
    const parsed = new URL(String(url ?? ""));
    if (parsed.protocol !== "https:" || !["funda.nl", "www.funda.nl"].includes(parsed.hostname)) {
      return NextResponse.json({ error: "Gebruik een geldige Funda-link." }, { status: 400 });
    }
    const response = await fetch(parsed.toString(), { headers: { "User-Agent": "Vows huiszoeker" }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return NextResponse.json({ error: "De Funda-pagina kon niet worden opgehaald." }, { status: 502 });
    const html = await response.text();
    const jsonLd = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
    let structured: Record<string, unknown> = {};
    if (jsonLd) {
      try {
        const parsedJson = JSON.parse(jsonLd) as Record<string, unknown> | Array<Record<string, unknown>>;
        structured = Array.isArray(parsedJson) ? parsedJson.find((item) => item["@type"] === "SingleFamilyResidence") ?? parsedJson[0] ?? {} : parsedJson;
      } catch { /* Funda may provide invalid or unavailable structured data. */ }
    }
    return NextResponse.json({
      title: typeof structured.name === "string" ? structured.name : textFromHtml(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) || textFromHtml(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      address: typeof structured.address === "object" && structured.address && "streetAddress" in structured.address ? String((structured.address as Record<string, unknown>).streetAddress) : "",
      description: typeof structured.description === "string" ? structured.description : textFromHtml(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i),
    });
  } catch {
    return NextResponse.json({ error: "Eigenschappen konden niet automatisch worden ingelezen. Je kunt ze handmatig invullen." }, { status: 502 });
  }
}
