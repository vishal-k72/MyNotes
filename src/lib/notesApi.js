import { supabase } from "./supabase.js";

const TABLE = "notes";
const PAGE = 1000;
const BATCH = 500;

// DB row (snake_case) -> app note
export function fromRow(r) {
  return {
    id: r.id,
    heading: r.heading,
    note: r.note,
    links: r.links || [],
    username: r.username || "",
    email: r.email || "",
    password: r.password || "",
    tags: r.tags || [],
    createdAt: Date.parse(r.created_at),
    updatedAt: Date.parse(r.updated_at),
  };
}

// app note -> DB row
function toRow(n) {
  return {
    heading: n.heading,
    note: n.note,
    links: n.links,
    username: n.username,
    email: n.email,
    password: n.password,
    tags: n.tags,
  };
}

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchNotes() {
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const data = check(
      await supabase
        .from(TABLE)
        .select("*")
        .order("updated_at", { ascending: false })
        .range(from, from + PAGE - 1)
    );
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all.map(fromRow);
}

export async function createNote(note) {
  const data = check(await supabase.from(TABLE).insert(toRow(note)).select().single());
  return fromRow(data);
}

export async function updateNote(id, note) {
  const data = check(
    await supabase
      .from(TABLE)
      .update({ ...toRow(note), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
  );
  return fromRow(data);
}

export async function removeNote(id) {
  check(await supabase.from(TABLE).delete().eq("id", id));
}

// Delete ke liye filter zaroori hota hai, isliye "id is not null"
export async function removeAllNotes() {
  check(await supabase.from(TABLE).delete().not("id", "is", null));
}

// Same id wale notes update ho jate hain, naye insert hote hain (duplicate nahi banta)
export async function upsertNotes(notes) {
  for (let i = 0; i < notes.length; i += BATCH) {
    const chunk = notes.slice(i, i + BATCH).map((n) => ({
      id: n.id,
      ...toRow(n),
      created_at: new Date(n.createdAt).toISOString(),
      updated_at: new Date(n.updatedAt).toISOString(),
    }));
    check(await supabase.from(TABLE).upsert(chunk, { onConflict: "id" }));
  }
}
