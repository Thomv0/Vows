import { NextResponse } from "next/server";
import { ObjectId, type Collection } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

const allowedResources = new Set(["appointments", "planning", "tasks", "costs", "budget", "homes", "house-search-settings"]);

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

async function coupleUserIds(userId: string) {
  const client = await clientPromise;
  const users = await client.db("vows").collection<{ id: string; role: string }>("users")
    .find({ role: { $in: ["bruid", "bruidegom"] } }, { projection: { id: 1 } })
    .toArray();
  const userIds = users.map((user) => user.id);
  if (!userIds.includes(userId)) userIds.push(userId);
  return userIds;
}

async function coupleUserFilter(userId: string) {
  return { userId: { $in: await coupleUserIds(userId) } };
}

function appointmentFilter(userId: string, role: string) {
  if (role === "bruid" || role === "bruidegom") return { $or: [{ userId }, { sharedWithCouple: true }] };
  if (role === "ceremoniemeester") return { $or: [{ userId }, { visibleToCeremoniemeester: true }], privateCoupleOnly: { $ne: true } };
  return { userId };
}

function taskFilter(userId: string, role: string) {
  if (role === "bruid" || role === "bruidegom") return { $or: [{ userId }, { sharedWithCouple: { $ne: false } }] };
  if (role === "ceremoniemeester") return { $or: [{ userId }, { visibleToCeremoniemeester: true }] };
  return { userId };
}

async function readableFilter(resource: string, userId: string, role: string) {
  if (resource === "appointments") return appointmentFilter(userId, role);
  if (resource === "tasks") return taskFilter(userId, role);
  if ((resource === "homes" || resource === "house-search-settings") && (role === "bruid" || role === "bruidegom")) return coupleUserFilter(userId);
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
    if (["costs", "budget", "homes", "house-search-settings"].includes(resource) && session.user.role !== "bruid" && session.user.role !== "bruidegom") return NextResponse.json({ error: "Deze gegevens zijn alleen voor bruid en bruidegom." }, { status: 403 });
    const collection = await getCollection(resource);
    const filter = await readableFilter(resource, session.user.id, session.user.role);
    const documents = resource === "house-search-settings"
      ? await collection.find(filter).sort({ updatedAt: -1, createdAt: -1 }).limit(1).toArray()
      : await collection.find(filter).sort({ date: 1, time: 1, createdAt: 1 }).toArray();
    return NextResponse.json(documents.map((document) => {
      const { _id, ...result } = document;
      void _id;
      return resource === "tasks" ? { ...result, canEdit: document.userId === session.user.id } : result;
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
    if (["costs", "budget", "homes", "house-search-settings"].includes(resource) && session.user.role !== "bruid" && session.user.role !== "bruidegom") return NextResponse.json({ error: "Deze gegevens zijn alleen voor bruid en bruidegom." }, { status: 403 });
    const body = await request.json();
    const { canEdit: _canEdit, userId: _userId, _id: _documentId, ...submittedBody } = body;
    void _canEdit;
    void _userId;
    void _documentId;
    const document = {
      ...submittedBody,
      userId: session.user.id,
      ...(resource === "appointments" || resource === "tasks"
        ? {
            sharedWithCouple: body.sharedWithCouple !== false,
            visibleToCeremoniemeester: Boolean(body.visibleToCeremoniemeester),
            ...(resource === "appointments" ? { privateCoupleOnly: Boolean(body.privateCoupleOnly) } : {}),
          }
        : {}),
      _id: body.id ?? new ObjectId().toHexString(),
      createdAt: new Date(),
    };
    const collection = await getCollection(resource);
    if (resource === "house-search-settings") {
      const settingsFilter = {
        _id: document._id,
        userId: { $in: await coupleUserIds(session.user.id) },
      };
      await collection.updateOne(
        settingsFilter,
        { $set: document },
        { upsert: true },
      );
      const { _id, ...result } = document;
      void _id;
      return NextResponse.json(result, { status: 200 });
    }
    const existing = await collection.findOne({ _id: document._id });
    if (existing) {
      return NextResponse.json({ error: "Dit id bestaat al." }, { status: 409 });
    }
    await collection.insertOne(document);
    const { _id, canEdit: _savedCanEdit, ...result } = document;
    void _id;
    void _savedCanEdit;
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
    if (["costs", "budget", "homes", "house-search-settings"].includes(resource) && session.user.role !== "bruid" && session.user.role !== "bruidegom") return NextResponse.json({ error: "Deze gegevens zijn alleen voor bruid en bruidegom." }, { status: 403 });
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Een id is verplicht." }, { status: 400 });
    const { id, userId: _userId, _id: _documentId, ...submittedChanges } = body;
    void _userId;
    void _documentId;
    const changes = resource === "tasks"
      ? {
          ...submittedChanges,
          sharedWithCouple: submittedChanges.sharedWithCouple !== false,
          visibleToCeremoniemeester: Boolean(submittedChanges.visibleToCeremoniemeester),
        }
      : submittedChanges;
    const collection = await getCollection(resource);
    const result = await collection.findOneAndUpdate(
      resource === "appointments"
        ? { _id: id, ...appointmentFilter(session.user.id, session.user.role) }
        : resource === "house-search-settings" && (session.user.role === "bruid" || session.user.role === "bruidegom")
          ? { _id: id, ...(await coupleUserFilter(session.user.id)) }
        : resource === "homes" && (session.user.role === "bruid" || session.user.role === "bruidegom")
          ? { _id: id, ...(await coupleUserFilter(session.user.id)) }
          : { _id: id, userId: session.user.id },
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
    if (["costs", "budget", "homes", "house-search-settings"].includes(resource) && session.user.role !== "bruid" && session.user.role !== "bruidegom") return NextResponse.json({ error: "Deze gegevens zijn alleen voor bruid en bruidegom." }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Een id is verplicht." }, { status: 400 });
    const collection = await getCollection(resource);
    const result = await collection.deleteOne(
      resource === "appointments"
        ? { _id: id, ...appointmentFilter(session.user.id, session.user.role) }
        : resource === "homes" && (session.user.role === "bruid" || session.user.role === "bruidegom")
          ? { _id: id, ...(await coupleUserFilter(session.user.id)) }
          : { _id: id, userId: session.user.id },
    );
    if (!result.deletedCount) return NextResponse.json({ error: "Gegevens niet gevonden." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gegevens verwijderen is mislukt." }, { status: 500 });
  }
}
