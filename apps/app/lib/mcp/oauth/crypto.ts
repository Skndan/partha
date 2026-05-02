import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const AES_KEY_LENGTH = 32;
const IV_LENGTH = 12;

function toBase64Url(input: Buffer) {
  return input.toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url");
}

function encryptionKey() {
  const seed = process.env.BETTER_AUTH_SECRET || "dev-mcp-oauth-secret";
  return createHash("sha256").update(seed, "utf8").digest().subarray(0, AES_KEY_LENGTH);
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function encryptText(plainText: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${toBase64Url(iv)}.${toBase64Url(ciphertext)}.${toBase64Url(tag)}`;
}

export function decryptText(payload: string) {
  const [ivPart, ciphertextPart, tagPart] = payload.split(".");
  if (!ivPart || !ciphertextPart || !tagPart) {
    throw new Error("Invalid encrypted payload");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    fromBase64Url(ivPart),
  );
  decipher.setAuthTag(fromBase64Url(tagPart));

  const plainText = Buffer.concat([
    decipher.update(fromBase64Url(ciphertextPart)),
    decipher.final(),
  ]);

  return plainText.toString("utf8");
}

export function createOpaqueToken(prefix = "mcp") {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}
