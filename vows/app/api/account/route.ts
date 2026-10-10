import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Openbare registratie is uitgeschakeld. Gebruik een uitnodigingslink." },
    { status: 410 },
  );
}
