import { scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";

const users = JSON.parse(readFileSync(new URL("../data/users.json", import.meta.url), "utf8"));
const guide = readFileSync(new URL("../docs/demo-accounts.md", import.meta.url), "utf8");
const accounts = [...guide.matchAll(/^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm)];

const usernames = accounts.map(([, username]) => username);
if (accounts.length !== users.length || new Set(usernames).size !== users.length) {
  throw new Error("The demo account guide and user data list different numbers of accounts.");
}

for (const [, username, password] of accounts) {
  const user = users.find((item) => item.username === username);
  if (!user) throw new Error(`The guide lists an unknown demo account: ${username}`);

  const [salt, hex] = user.passwordHash.split(":");
  const expected = Buffer.from(hex, "hex");
  const actual = scryptSync(password, salt, 64);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error(`The documented password does not work for ${username}.`);
  }
}

console.log(`Verified ${accounts.length} documented demo accounts.`);
