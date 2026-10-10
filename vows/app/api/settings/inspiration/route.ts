import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import clientPromise from "@/lib/mongodb";

const defaultSettings = {
  pinterestBoardUrl: "",
  palette: [
    { name: "Zacht zand", value: "#E8DCCB" },
    { name: "Saliegroen", value: "#A8B5A2" },
    { name: "Leiblauw", value: "#A9B7C6" },
    { name: "Warm wit", value: "#FFFDF8" },
    { name: "Donker leisteen", value: "#2D3A47" },
  ],
};

async function getSettings() {
  const client = await clientPromise;
  const settings = await client.db("vows").collection<{ _id: string; pinterestBoardUrl?: string; palette?: { name: string; value: string }[]; updatedAt?: Date }>("settings").findOne({ _id: "inspiration" });
  return settings ? { pinterestBoardUrl: settings.pinterestBoardUrl ?? "", palette: settings.palette ?? defaultSettings.palette } : defaultSettings;
}

export async function GET() {
  try {
    return NextResponse.json(await getSettings());
  } catch {
    return NextResponse.json({ error: "Inspiratie-instellingen ophalen is mislukt." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Inloggen is verplicht." }, { status: 401 });
  try {
    const body = await request.json();
    if (!Array.isArray(body.palette) || (body.pinterestBoardUrl !== undefined && typeof body.pinterestBoardUrl !== "string")) {
      return NextResponse.json({ error: "Ongeldige inspiratie-instellingen." }, { status: 400 });
    }
    const palette = body.palette.filter((item: unknown): item is { name: string; value: string } => typeof item === "object" && item !== null && "name" in item && "value" in item && typeof item.name === "string" && typeof item.value === "string");
    if (palette.length > 10) return NextResponse.json({ error: "Het kleurenpalet mag maximaal 10 kleuren bevatten." }, { status: 400 });
    const current = await getSettings();
    const pinterestBoardUrl = isAdminEmail(session.user.email) && typeof body.pinterestBoardUrl === "string"
      ? body.pinterestBoardUrl.trim()
      : current.pinterestBoardUrl;
    const savedPalette = isAdminEmail(session.user.email) && palette.length === 0 ? current.palette : palette;
    const client = await clientPromise;
    const settings = client.db("vows").collection<{ _id: string; pinterestBoardUrl: string; palette: { name: string; value: string }[]; updatedAt: Date }>("settings");
    await settings.updateOne({ _id: "inspiration" }, { $set: { pinterestBoardUrl, palette: savedPalette, updatedAt: new Date() }, $setOnInsert: { _id: "inspiration" } }, { upsert: true });
    return NextResponse.json({ pinterestBoardUrl, palette: savedPalette });
  } catch {
    return NextResponse.json({ error: "Inspiratie-instellingen opslaan is mislukt." }, { status: 500 });
  }
}
