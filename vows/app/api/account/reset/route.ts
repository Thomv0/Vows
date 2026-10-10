import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (String(password ?? "").length < 8) return NextResponse.json({ error: "Gebruik minimaal 8 tekens." }, { status: 400 });
    const client = await clientPromise;
    const db = client.db("vows");
    const tokenHash = createHash("sha256").update(String(token ?? "")).digest("hex");
    const reset = await db.collection("passwordResets").findOne<{ email: string; expiresAt: Date }>({ tokenHash });
    if (!reset || reset.expiresAt < new Date()) return NextResponse.json({ error: "Deze resetlink is ongeldig of verlopen." }, { status: 400 });
    await db.collection("users").updateOne({ email: reset.email }, { $set: { passwordHash: await bcrypt.hash(password, 12), updatedAt: new Date() } });
    await db.collection("passwordResets").deleteOne({ tokenHash });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Wachtwoord wijzigen is mislukt." }, { status: 500 });
  }
}
