// AES-GCM + PBKDF2 加密工具

const ENC_ALGO = 'AES-GCM';
const KEY_ALGO = 'PBKDF2';
const SALT_LEN = 16;
const IV_LEN = 12;
const ITERATIONS = 200000;
const KEY_LEN = 256;

function encodeBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function decodeBase64(str: string): ArrayBuffer {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0)).buffer;
}

function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const saltBuf: BufferSource = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  return crypto.subtle.importKey('raw', enc.encode(password), KEY_ALGO, false, ['deriveKey'])
    .then((baseKey) =>
      crypto.subtle.deriveKey(
        { name: KEY_ALGO, salt: saltBuf, iterations: ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: ENC_ALGO, length: KEY_LEN },
        false,
        ['encrypt', 'decrypt']
      )
    );
}

/** 将密码哈希为 SHA-256 hex */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 加密字符串，返回 base64(salt + iv + ciphertext) */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await getKey(password, salt);
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt({ name: ENC_ALGO, iv }, key, enc.encode(plaintext));
  const combined = new Uint8Array(salt.length + iv.length + ct.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ct), salt.length + iv.length);
  return encodeBase64(combined.buffer);
}

/** 解密 */
export async function decrypt(ciphertext: string, password: string): Promise<string> {
  const buf = decodeBase64(ciphertext);
  const salt = buf.slice(0, SALT_LEN);
  const iv = buf.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const ct = buf.slice(SALT_LEN + IV_LEN);
  const key = await getKey(password, new Uint8Array(salt));
  const pt = await crypto.subtle.decrypt({ name: ENC_ALGO, iv: new Uint8Array(iv) }, key, ct);
  return new TextDecoder().decode(pt);
}
