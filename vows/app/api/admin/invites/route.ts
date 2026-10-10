import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { roles, type UserRole } from "@/lib/roles";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) return NextResponse.json({ error: "Alleen de beheerder mag uitnodigen." }, { status: 403 });

  try {
    const requestBody = await request.json();
    const email = String(requestBody.email ?? "").trim().toLowerCase();
    const role = String(requestBody.role ?? "") as UserRole;
    if (!email || !roles.includes(role)) return NextResponse.json({ error: "Vul een geldig e-mailadres en rol in." }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("vows");
    if (await db.collection("users").findOne({ email })) return NextResponse.json({ error: "Voor dit e-mailadres bestaat al een account." }, { status: 409 });

    const token = randomUUID();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await db.collection("invitations").insertOne({ tokenHash, email, role, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), createdAt: new Date(), createdBy: session!.user.email });

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const invitationUrl = `${origin}/uitnodiging/${token}`;
    const subject = "Uitnodiging voor Vows";
    const emailBody = `Je bent uitgenodigd voor Vows.\n\nMaak je account aan via:\n${invitationUrl}\n\nDeze link is 7 dagen geldig.`;
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    return NextResponse.json({ success: true, mailto });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Uitnodiging versturen is mislukt." }, { status: 500 });
  }
}
