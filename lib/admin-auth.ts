import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "shilajitdb_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 6; // 6 hours

function isAuthDisabled() {
  const v = (process.env.ADMIN_DISABLE_AUTH ?? "").toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes";
}

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function unbase64url(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const s = input.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(s, "base64");
}

function getSecretOrThrow() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("Missing ADMIN_PASSWORD env var");
  return secret;
}

function sign(payloadB64: string) {
  const h = crypto.createHmac("sha256", getSecretOrThrow()).update(payloadB64).digest();
  return base64url(h);
}

type SessionPayload = { exp: number; nonce: string };

function encode(payload: SessionPayload) {
  const payloadB64 = base64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

function decode(token: string): SessionPayload | null {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(unbase64url(payloadB64).toString("utf8")) as SessionPayload;
    if (!parsed?.exp || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function isAdminAuthed() {
  if (isAuthDisabled()) return true;
  const jar = await cookies();
  const c = jar.get(COOKIE_NAME)?.value;
  if (!c) return false;
  return Boolean(decode(c));
}

export async function setAdminSessionCookie() {
  if (isAuthDisabled()) return;
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const token = encode(payload);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSessionCookie() {
  if (isAuthDisabled()) return;
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 0,
  });
}

export function checkAdminPassword(password: string) {
  if (isAuthDisabled()) return true;
  const expected = getSecretOrThrow();
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

