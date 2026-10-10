import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { token, name, password } = await request.json();
    const tokenHash = createHash("sha256").update(String(token ?? "")).digest("hex");
    const client = await clientPromise;
    const db = client.db("vows");
    const invitation = await db.collection("invitations").findOne<{ email: string; role: string; expiresAt: Date }>({ tokenHash });
    if (!invitation || invitation.expiresAt < new Date()) return NextResponse.json({ error: "Deze uitnodiging is ongeldig of verlopen." }, { status: 400 });
    if (!String(name ?? "").trim() || String(password ?? "").length < 8) return NextResponse.json({ error: "Vul je naam in en gebruik minimaal 8 tekens voor je wachtwoord." }, { status: 400 });
    await db.collection("users").insertOne({ id: randomUUID(), name: String(name).trim(), email: invitation.email, role: invitation.role, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date() });
    await db.collection("invitations").deleteOne({ tokenHash });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Account aanmaken is mislukt." }, { status: 500 });
  }
}
