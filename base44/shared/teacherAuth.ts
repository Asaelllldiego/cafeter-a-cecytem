// Server-only helpers for the Teachers Area password (PBKDF2 via Web Crypto).
// Nothing here ever touches the client bundle.

export function buf2hex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hex2bytes(hex) {
  const a = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16);
  return a;
}

export function ctEqual(aHex, bHex) {
  const a = hex2bytes(aHex);
  const b = hex2bytes(bHex);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = saltHex ? hex2bytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: buf2hex(bits), salt: buf2hex(salt) };
}

export async function verifyPassword(password, hashHex, saltHex) {
  if (!hashHex || !saltHex) return false;
  const { hash } = await hashPassword(password, saltHex);
  return ctEqual(hash, hashHex);
}

export async function getSettings(base44) {
  const res = await base44.asServiceRole.entities.TeacherAreaSettings.filter({}, { limit: 1 });
  const items = (res && res.items) || [];
  return items[0] || null;
}

export function freshToken() {
  return buf2hex(crypto.getRandomValues(new Uint8Array(24)));
}