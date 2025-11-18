import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
};

const getKey = (salt: Buffer) => {
  const secret = process.env.ENCRYPTION_KEY ?? "26975b25afe5046e974b97eac8b28ede11fa3a35088c0525080dfcb610240a31"; //Do not actually commit encryption keys. This is just here for the interview.
  if (!secret) {
    throw new Error("ENCRYPTION_KEY environment variable not set");
  }
  return crypto.scryptSync(secret, salt, KEY_LENGTH, SCRYPT_PARAMS);
};

export const encrypt = (text: string) => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString("hex");
};

export const decrypt = (encryptedText: string) => {
  const data = Buffer.from(encryptedText, "hex");
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = getKey(salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted, "binary", "utf8") + decipher.final("utf8");
};
