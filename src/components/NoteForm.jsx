import { useEffect, useState } from "react";
import { parseTags } from "../utils/helpers.js";

const empty = {
  heading: "",
  note: "",
  links: [""],
  username: "",
  email: "",
  password: "",
  tagsText: "",
};

function fromNote(n) {
  return {
    heading: n.heading,
    note: n.note,
    links: n.links.length ? n.links : [""],
    username: n.username,
    email: n.email,
    password: n.password,
    tagsText: n.tags.join(", "),
  };
}

export default function NoteForm({ editing, onSave, onCancel, saving }) {
  const [form, setForm] = useState(empty);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(editing ? fromNote(editing) : empty);
    setError("");
  }, [editing]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const setLink = (i, v) =>
    setForm((f) => ({ ...f, links: f.links.map((l, idx) => (idx === i ? v : l)) }));
  const addLink = () => setForm((f) => ({ ...f, links: [...f.links, ""] }));
  const removeLink = (i) =>
    setForm((f) => {
      const links = f.links.filter((_, idx) => idx !== i);
      return { ...f, links: links.length ? links : [""] };
    });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.heading.trim() || !form.note.trim()) {
      setError("Heading aur Long Note dono zaroori hain.");
      return;
    }
    const ok = await onSave({
      heading: form.heading.trim(),
      note: form.note.trim(),
      links: form.links.map((l) => l.trim()).filter(Boolean),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      tags: parseTags(form.tagsText),
    });
    if (ok !== false) {
      setForm(empty);
      setError("");
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <h2>{editing ? "Note edit karo" : "Naya note"}</h2>

      <label>
        Heading <span className="req">*</span>
        <input value={form.heading} onChange={set("heading")} placeholder="Note ka title" />
      </label>

      <label>
        Long Note <span className="req">*</span>
        <textarea
          rows={6}
          value={form.note}
          onChange={set("note")}
          placeholder="Yaha poora note likho..."
        />
      </label>

      <div className="label-block">
        Links
        {form.links.map((l, i) => (
          <div className="link-input" key={i}>
            <input
              value={l}
              onChange={(e) => setLink(i, e.target.value)}
              placeholder="https://example.com"
            />
            <button type="button" className="btn small danger" onClick={() => removeLink(i)}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn small" onClick={addLink}>
          + Link add karo
        </button>
      </div>

      <div className="grid-3">
        <label>
          Username
          <input value={form.username} onChange={set("username")} autoComplete="off" />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={set("email")} autoComplete="off" />
        </label>
        <label>
          Password
          <div className="link-input">
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
            />
            <button type="button" className="btn small" onClick={() => setShowPass((s) => !s)}>
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </label>
      </div>

      <label>
        Tags (comma se alag karo)
        <input
          value={form.tagsText}
          onChange={set("tagsText")}
          placeholder="work, personal, banking"
        />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? "Saving..." : editing ? "Update note" : "Save note"}
        </button>
        {editing && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
