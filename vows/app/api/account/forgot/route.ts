import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import clientPromise from "@/lib/mongodb";
import { sendVowsEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const email = String((await request.json()).email ?? "").trim().toLowerCase();
    const client = await clientPromise;
    const user = await client.db("vows").collection("users").findOne({ email });
    if (user) {
      const token = randomUUID();
      await client.db("vows").collection("passwordResets").insertOne({ tokenHash: createHash("sha256").update(token).digest("hex"), email, expiresAt: new Date(Date.now() + 60 * 60 * 1000), createdAt: new Date() });
      await sendVowsEmail(email, "Wachtwoord opnieuw instellen", `Stel je Vows-wachtwoord opnieuw in via:\n${new URL(request.url).origin}/wachtwoord-reset/${token}\n\nDeze link is 1 uur geldig.`);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "De resetmail kon niet worden verstuurd." }, { status: 500 });
  }
}
