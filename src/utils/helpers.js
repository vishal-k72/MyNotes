export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback purane browsers / http ke liye
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
}

export function normalizeUrl(url) {
  const u = url.trim();
  if (!u) return "";
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(u) ? u : `https://${u}`;
}

export function openLink(url) {
  window.open(normalizeUrl(url), "_blank", "noopener,noreferrer");
}

export function parseTags(str) {
  return [
    ...new Set(
      str
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}
