// Scripts are shared in the link itself: deflate-compressed, then base64url-encoded
// so the result can go in a URL without escaping.

async function pipe(bytes: Uint8Array<ArrayBuffer>, transform: CompressionStream | DecompressionStream) {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string) {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function encodeScript(script: string): Promise<string> {
  const compressed = await pipe(new TextEncoder().encode(script), new CompressionStream("deflate-raw"));
  return toBase64Url(compressed);
}

// null when the text isn't a script encoded by encodeScript, e.g. a mangled link
export async function decodeScript(encoded: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]*$/.test(encoded)) return null;
  try {
    const bytes = await pipe(fromBase64Url(encoded), new DecompressionStream("deflate-raw"));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
