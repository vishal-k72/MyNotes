import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NoteForm from "./components/NoteForm.jsx";
import NoteCard from "./components/NoteCard.jsx";
import { isConfigured } from "./lib/supabase.js";
import {
  createNote,
  fetchNotes,
  removeAllNotes,
  removeNote,
  updateNote,
  upsertNotes,
} from "./lib/notesApi.js";
import { downloadJson, parseNotesJson } from "./utils/jsonFile.js";

function SetupScreen() {
  return (
    <div className="setup">
      <h1>⚙️ Supabase setup baaki hai</h1>
      <p>Project folder me <code>.env</code> file banao (<code>.env.example</code> copy karke):</p>
      <pre>{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
      <p>
        Phir <code>supabase/schema.sql</code> ko Supabase SQL Editor me run karo, aur dev server
        restart karo (<code>npm run dev</code>).
      </p>
    </div>
  );
}

export default function App() {
  if (!isConfigured) return <SetupScreen />;
  return <Notes />;
}

function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { text, error }
  const [editing, setEditing] = useState(null);
  const [activeTag, setActiveTag] = useState("");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null); // { fileName, notes, skipped }
  const fileInput = useRef(null);
  const formRef = useRef(null);
  const timer = useRef(null);

  const flash = useCallback((text, error = false) => {
    setStatus({ text, error });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(null), error ? 6000 : 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await fetchNotes());
    } catch (err) {
      flash("Notes load nahi hue: " + err.message, true);
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => {
    const count = {};
    notes.forEach((n) => n.tags.forEach((t) => (count[t] = (count[t] || 0) + 1)));
    return Object.entries(count).sort((a, b) => a[0].localeCompare(b[0]));
  }, [notes]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((n) => !activeTag || n.tags.includes(activeTag))
      .filter(
        (n) =>
          !q ||
          n.heading.toLowerCase().includes(q) ||
          n.note.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q))
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, activeTag, search]);

  // false return karne par form data clear nahi hota
  const saveNote = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        const saved = await updateNote(editing.id, data);
        setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
        setEditing(null);
        flash("Note update ho gaya ✓");
      } else {
        const saved = await createNote(data);
        setNotes((prev) => [saved, ...prev]);
        flash("Note Supabase me save ho gaya ✓");
      }
      return true;
    } catch (err) {
      flash("Save fail: " + err.message, true);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id) => {
    try {
      await removeNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (err) {
      flash("Delete fail: " + err.message, true);
    }
  };

  const startEdit = (note) => {
    setEditing(note);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleTag = (t) => setActiveTag((cur) => (cur === t ? "" : t));

  // ---------- Button 1: Delete all notes ----------
  const deleteAll = async () => {
    if (notes.length === 0) return flash("Delete karne ke liye koi note nahi hai");
    const answer = window.prompt(
      `Supabase se saare ${notes.length} notes hamesha ke liye delete ho jayenge.\n` +
        `Pehle "Create JSON file" se backup le lo.\n\nConfirm karne ke liye DELETE likho:`
    );
    if (answer !== "DELETE") return;
    setBusy(true);
    try {
      await removeAllNotes();
      setNotes([]);
      setEditing(null);
      setActiveTag("");
      flash("Saare notes delete ho gaye");
    } catch (err) {
      flash("Delete all fail: " + err.message, true);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Button 2: Create JSON file ----------
  const exportJson = () => {
    if (notes.length === 0) return flash("Export karne ke liye koi note nahi hai");
    downloadJson(notes);
    flash(`${notes.length} notes ki JSON file ban gayi ✓`);
  };

  // ---------- Button 3: Pick JSON file -> preview -> save all ----------
  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { notes: parsed, skipped } = parseNotesJson(await file.text());
      if (parsed.length === 0) return flash("File me koi valid note nahi mila", true);
      setPreview({ fileName: file.name, notes: parsed, skipped });
    } catch (err) {
      flash(err.message, true);
    }
  };

  const savePreview = async () => {
    setBusy(true);
    try {
      await upsertNotes(preview.notes);
      const count = preview.notes.length;
      setPreview(null);
      await load();
      flash(`${count} notes Supabase me save ho gaye ✓`);
    } catch (err) {
      flash("Save all fail: " + err.message, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>📝 My Notes</h1>
        <div className="topbar-actions">
          <button type="button" className="btn danger" onClick={deleteAll} disabled={busy || loading}>
            🗑 Delete all notes
          </button>
          <button type="button" className="btn" onClick={exportJson} disabled={busy || loading}>
            ⬇ Create JSON file
          </button>
          <button type="button" className="btn primary" onClick={() => fileInput.current?.click()} disabled={busy}>
            ⬆ Pick JSON file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={onPickFile}
          />
        </div>
      </header>

      {status && <div className={`status ${status.error ? "error" : ""}`}>{status.text}</div>}

      <main className="layout">
        <aside ref={formRef} className="side">
          <NoteForm
            editing={editing}
            onSave={saveNote}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        </aside>

        <section className="content">
          {preview ? (
            <div className="preview">
              <div className="preview-bar">
                <div>
                  <strong>{preview.fileName}</strong> — {preview.notes.length} notes mile
                  <small>
                    {preview.skipped > 0 &&
                      `${preview.skipped} skip hue (heading/note missing). `}
                    Same id wale notes update honge, baaki naye add honge.
                  </small>
                </div>
                <div className="row">
                  <button type="button" className="btn primary" onClick={savePreview} disabled={busy}>
                    {busy ? "Saving..." : `Save all ${preview.notes.length} to Supabase`}
                  </button>
                  <button type="button" className="btn" onClick={() => setPreview(null)} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
              <div className="cards">
                {preview.notes.map((n) => (
                  <NoteCard key={n.id} note={n} readOnly />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="toolbar">
                <input
                  className="search"
                  placeholder="Search heading, note ya tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="count">
                  {visible.length} / {notes.length} notes
                </span>
              </div>

              <div className="tag-bar">
                <button
                  type="button"
                  className={`chip ${activeTag === "" ? "active" : ""}`}
                  onClick={() => setActiveTag("")}
                >
                  All
                </button>
                {allTags.map(([t, c]) => (
                  <button
                    type="button"
                    key={t}
                    className={`chip ${activeTag === t ? "active" : ""}`}
                    onClick={() => toggleTag(t)}
                  >
                    #{t} <small>{c}</small>
                  </button>
                ))}
              </div>

              {loading ? (
                <p className="empty">Loading...</p>
              ) : visible.length === 0 ? (
                <p className="empty">Koi note nahi mila.</p>
              ) : (
                <div className="cards">
                  {visible.map((n) => (
                    <NoteCard
                      key={n.id}
                      note={n}
                      onEdit={startEdit}
                      onDelete={deleteNote}
                      onTagClick={toggleTag}
                      activeTag={activeTag}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
