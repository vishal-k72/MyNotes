import { useState } from "react";
import CopyButton from "./CopyButton.jsx";
import { openLink } from "../utils/helpers.js";

function Field({ label, value, secret }) {
  const [show, setShow] = useState(false);
  if (!value) return null;
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <span className="field-value">{secret && !show ? "••••••••••" : value}</span>
      {secret && (
        <button type="button" className="btn small" onClick={() => setShow((s) => !s)}>
          {show ? "Hide" : "Show"}
        </button>
      )}
      <CopyButton text={value} />
    </div>
  );
}

export default function NoteCard({
  note,
  onEdit,
  onDelete,
  onTagClick = () => {},
  activeTag = "",
  readOnly = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.note.length > 280 || note.note.split("\n").length > 6;
  const hasCreds = note.username || note.email || note.password;

  return (
    <article className="card">
      <header className="card-head">
        <h3>{note.heading}</h3>
        {!readOnly && (
          <div className="card-actions">
            <button type="button" className="btn small" onClick={() => onEdit(note)}>
              Edit
            </button>
            <button
              type="button"
              className="btn small danger"
              onClick={() => {
                if (window.confirm(`"${note.heading}" delete karna hai?`)) onDelete(note.id);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </header>

      <p className={`note-text ${isLong && !expanded ? "clamped" : ""}`}>{note.note}</p>
      {isLong && (
        <button type="button" className="link-btn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {note.links.length > 0 && (
        <section className="block">
          <h4>Links</h4>
          {note.links.map((l, i) => (
            <div className="field-row" key={i}>
              <span className="field-value link-text" title={l}>{l}</span>
              <CopyButton text={l} />
              <button type="button" className="btn small primary" onClick={() => openLink(l)}>
                Open ↗
              </button>
            </div>
          ))}
        </section>
      )}

      {hasCreds && (
        <section className="block">
          <h4>Credentials</h4>
          <Field label="Username" value={note.username} />
          <Field label="Email" value={note.email} />
          <Field label="Password" value={note.password} secret />
        </section>
      )}

      {note.tags.length > 0 && (
        <div className="tags">
          {note.tags.map((t) => (
            <button
              type="button"
              key={t}
              className={`chip ${activeTag === t ? "active" : ""}`}
              onClick={() => onTagClick(t)}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <footer className="card-foot">
        Updated: {new Date(note.updatedAt).toLocaleString()}
      </footer>
    </article>
  );
}
