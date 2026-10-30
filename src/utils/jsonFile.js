const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toTime = (v) => {
  const t = typeof v === "number" ? v : Date.parse(v);
  return Number.isFinite(t) ? t : Date.now();
};

const toList = (v) =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];

export function notesToJson(notes) {
  return JSON.stringify(
    {
      app: "notes-supabase-app",
      exportedAt: new Date().toISOString(),
      count: notes.length,
      notes: notes.map((n) => ({
        id: n.id,
        heading: n.heading,
        note: n.note,
        links: n.links,
        username: n.username,
        email: n.email,
        password: n.password,
        tags: n.tags,
        createdAt: new Date(n.createdAt).toISOString(),
        updatedAt: new Date(n.updatedAt).toISOString(),
      })),
    },
    null,
    2
  );
}

export function downloadJson(notes) {
  const blob = new Blob([notesToJson(notes)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// JSON text -> { notes, skipped }
// Array [..] ya { notes: [..] } dono format chalte hain.
export function parseNotesJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Ye valid JSON file nahi hai");
  }
  const list = Array.isArray(data) ? data : Array.isArray(data?.notes) ? data.notes : null;
  if (!list) throw new Error("JSON me notes ki array nahi mili");

  const byId = new Map();
  let skipped = 0;

  for (const raw of list) {
    if (!raw || typeof raw !== "object") {
      skipped++;
      continue;
    }
    const heading = String(raw.heading ?? "").trim();
    const note = String(raw.note ?? "").trim();
    if (!heading || !note) {
      skipped++;
      continue;
    }
    const id = UUID.test(String(raw.id)) ? String(raw.id).toLowerCase() : crypto.randomUUID();
    byId.set(id, {
      id,
      heading,
      note,
      links: toList(raw.links),
      username: String(raw.username ?? ""),
      email: String(raw.email ?? ""),
      password: String(raw.password ?? ""),
      tags: [...new Set(toList(raw.tags).map((t) => t.toLowerCase()))],
      createdAt: toTime(raw.createdAt),
      updatedAt: toTime(raw.updatedAt),
    });
  }

  return { notes: [...byId.values()], skipped };
}
