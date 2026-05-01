/**
 * Server-only Web Push helpers.
 * Pure JS implementation using Web Crypto API (works in Cloudflare Workers).
 * Implements VAPID (RFC 8292) and Web Push encryption using aes128gcm (RFC 8188).
 */

// ---------- base64url helpers ----------
function b64uToBytes(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64u(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function utf8(s: string) {
  return new TextEncoder().encode(s);
}
function concat(...arrs: Uint8Array[]): Uint8Array {
  const len = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}

// ---------- VAPID JWT (ES256) ----------
async function importVapidPrivateKey(privateKeyB64u: string, publicKeyB64u: string) {
  // public is uncompressed point: 0x04 || X(32) || Y(32)
  const pub = b64uToBytes(publicKeyB64u);
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error("Invalid VAPID public key");
  const x = bytesToB64u(pub.slice(1, 33));
  const y = bytesToB64u(pub.slice(33, 65));
  const d = privateKeyB64u; // already base64url
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d,
    ext: true,
  };
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function makeVapidJwt(audience: string, subject: string, pubKeyB64u: string, privKeyB64u: string) {
  const header = { typ: "JWT", alg: "ES256" };
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const payload = { aud: audience, exp, sub: subject };
  const enc = (o: any) => bytesToB64u(utf8(JSON.stringify(o)));
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const key = await importVapidPrivateKey(privKeyB64u, pubKeyB64u);
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, utf8(signingInput) as BufferSource)
  );
  // sig is r||s raw (64 bytes) — exactly what JWS ES256 expects
  return `${signingInput}.${bytesToB64u(sig)}`;
}

// ---------- HKDF ----------
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const baseKey = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource } as HkdfParams,
    baseKey,
    length * 8
  );
  return new Uint8Array(bits);
}

// ---------- aes128gcm Web Push body (RFC 8188 + RFC 8291) ----------
async function encryptAes128Gcm(payload: Uint8Array, p256dhB64u: string, authB64u: string) {
  const subscriberPubRaw = b64uToBytes(p256dhB64u); // 65 bytes uncompressed
  const authSecret = b64uToBytes(authB64u);

  // generate ephemeral keypair
  const eph = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const ephPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));

  // import subscriber public key
  const subPub = await crypto.subtle.importKey(
    "raw",
    subscriberPubRaw as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  // ECDH
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subPub },
    eph.privateKey,
    256
  );
  const ecdhSecret = new Uint8Array(sharedBits);

  // PRK_key = HKDF(salt=auth_secret, ikm=ecdh_secret, info="WebPush: info\0"||ua_public||as_public, len=32)
  const keyInfo = concat(
    utf8("WebPush: info\0"),
    subscriberPubRaw,
    ephPubRaw
  );
  const ikm2 = await hkdf(authSecret, ecdhSecret, keyInfo, 32);

  // salt: 16 random bytes
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // CEK = HKDF(salt, ikm2, "Content-Encoding: aes128gcm\0", 16)
  const cek = await hkdf(salt, ikm2, utf8("Content-Encoding: aes128gcm\0"), 16);
  // NONCE = HKDF(salt, ikm2, "Content-Encoding: nonce\0", 12)
  const nonce = await hkdf(salt, ikm2, utf8("Content-Encoding: nonce\0"), 12);

  // padded plaintext: payload || 0x02 (last record delimiter for aes128gcm)
  const padded = concat(payload, new Uint8Array([0x02]));

  // encrypt
  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, { name: "AES-GCM" }, false, ["encrypt"]);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce as BufferSource }, aesKey, padded as BufferSource)
  );

  // Build aes128gcm content-coding header (RFC 8188 §2.1):
  // salt(16) || rs(4 BE) || idlen(1) || keyid(idlen)
  // keyid = ephemeral public key (raw uncompressed, 65 bytes)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const header = concat(salt, rs, new Uint8Array([ephPubRaw.length]), ephPubRaw);

  return concat(header, cipher);
}

// ---------- Public API ----------
export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SendResult = {
  endpoint: string;
  ok: boolean;
  status: number;
  expired?: boolean;
  error?: string;
};

export async function sendWebPush(
  sub: PushSubscriptionRow,
  payload: { title: string; body?: string; url?: string; tag?: string },
  opts: { ttl?: number; urgency?: "very-low" | "low" | "normal" | "high" } = {}
): Promise<SendResult> {
  const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return { endpoint: sub.endpoint, ok: false, status: 0, error: "VAPID keys missing" };
  }

  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await makeVapidJwt(audience, VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const body = utf8(JSON.stringify(payload));
  const ciphertext = await encryptAes128Gcm(body, sub.p256dh, sub.auth);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "Content-Length": String(ciphertext.byteLength),
      TTL: String(opts.ttl ?? 60 * 60 * 24),
      Urgency: opts.urgency ?? "normal",
      Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC}`,
    },
    body: ciphertext as BodyInit,
  });

  const expired = res.status === 404 || res.status === 410;
  let errText = "";
  if (!res.ok) {
    try { errText = await res.text(); } catch {}
  }
  return {
    endpoint: sub.endpoint,
    ok: res.ok,
    status: res.status,
    expired,
    error: res.ok ? undefined : errText || res.statusText,
  };
}
