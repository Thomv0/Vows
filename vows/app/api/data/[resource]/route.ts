import { NextResponse } from "next/server";
import { ObjectId, type Collection } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

const allowedResources = new Set(["appointments", "planning", "tasks", "costs"]);

function collectionName(resource: string) {
  if (!allowedResources.has(resource)) {
    throw new Error("Ongeldige gegevensverzameling.");
  }
  return resource;
}

type StoredDocument = Record<string, unknown> & { _id: string };

async function getCollection(resource: string): Promise<Collection<StoredDocument>> {
  const client = await clientPromise;
  return client.db("vows").collection(collectionName(resource));
}

async function getUserId() {
  const session = await auth();
  return session;
}

function appointmentFilter(userId: string, role: string) {
  if (role === "bruid" || role === "bruidegom") return { $or: [{ userId }, { sharedWithCouple: true }] };
  if (role === "ceremoniemeester") return { $or: [{ userId }, { visibleToCeremoniemeester: true }] };
  return { userId };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource } = await params;
    const session = await getUserId();
    if (!session?.user?.id) return NextResponse.json({ error: "Inloggen is verplicht." }, { status: 401 });
    if (resource === "costs" && session.user.role !== "bruid" && session.user.role !== "bruidegom") return NextResponse.json({ error: "Je hebt geen toegang tot kosten." }, { status: 403 });
    const collection = await getCollection(resource);
    const filter = resource === "appointments" ? appointmentFilter(session.user.id, session.user.role) : { userId: session.user.id };
    const documents = await collection.find(filter).sort({ date: 1, time: 1, createdAt: 1 }).toArray();
    return NextResponse.json(documents.map((document) => {
      const { _id, ...result } = document;
      void _id;
      return result;
    }));
  } catch {
    return NextResponse.json({ error: "Gegevens ophalen is mislukt." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource } = await params;
    const session = await getUserId();
    if (!session?.user?.id) return NextResponse.json({ error: "Inloggen is verplicht." }, { status: 401 });
    if (resource === "costs" && session.user.role !== "bruid" && session.user.role !== "bruidegom") return NextResponse.json({ error: "Je hebt geen toegang tot kosten." }, { status: 403 });
    const body = await request.json();
    const document = { ...body, userId: session.user.id, ...(resource === "appointments" ? { sharedWithCouple: true, visibleToCeremoniemeester: Boolean(body.visibleToCeremoniemeester) } : {}), _id: body.id ?? new ObjectId().toHexString(), createdAt: new Date() };
    const collection = await getCollection(resource);
    const existing = await collection.findOne({ _id: document._id });
    if (existing) {
      return NextResponse.json({ error: "Dit id bestaat al." }, { status: 409 });
    }
    await collection.insertOne(document);
    const { _id, ...result } = document;
    void _id;
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gegevens opslaan is mislukt." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource } = await params;
    const session = await getUserId();
    if (!session?.user?.id) return NextResponse.json({ error: "Inloggen is verplicht." }, { status: 401 });
    if (resource === "costs" && session.user.role !== "bruid" && session.user.role !== "bruidegom") return NextResponse.json({ error: "Je hebt geen toegang tot kosten." }, { status: 403 });
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Een id is verplicht." }, { status: 400 });
    const { id, ...changes } = body;
    const collection = await getCollection(resource);
    const result = await collection.findOneAndUpdate(
      resource === "appointments" ? { _id: id, ...appointmentFilter(session.user.id, session.user.role) } : { _id: id, userId: session.user.id },
      { $set: { ...changes, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!result) return NextResponse.json({ error: "Gegevens niet gevonden." }, { status: 404 });
    const { _id, ...document } = result;
    void _id;
    return NextResponse.json(document);
  } catch {
    return NextResponse.json({ error: "Gegevens bijwerken is mislukt." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource } = await params;
    const session = await getUserId();
    if (!session?.user?.id) return NextResponse.json({ error: "Inloggen is verplicht." }, { status: 401 });
    if (resource === "costs" && session.user.role !== "bruid" && session.user.role !== "bruidegom") return NextResponse.json({ error: "Je hebt geen toegang tot kosten." }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Een id is verplicht." }, { status: 400 });
    const collection = await getCollection(resource);
    const result = await collection.deleteOne(resource === "appointments" ? { _id: id, ...appointmentFilter(session.user.id, session.user.role) } : { _id: id, userId: session.user.id });
    if (!result.deletedCount) return NextResponse.json({ error: "Gegevens niet gevonden." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gegevens verwijderen is mislukt." }, { status: 500 });
  }
}
