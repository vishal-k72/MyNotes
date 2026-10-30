import { useState } from "react";
import { copyText } from "../utils/helpers.js";

export default function CopyButton({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);

  const handle = async () => {
    const ok = await copyText(text);
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }
  };

  return (
    <button type="button" className="btn small" onClick={handle} title={label}>
      {done ? "Copied ✓" : label}
    </button>
  );
}
