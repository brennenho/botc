import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import next from "next";

const hostname = "localhost";
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const app = next({ dev: false, hostname, port });
await app.prepare();

const directory = mkdtempSync(join(tmpdir(), "botc-playwright-"));
try {
  const keyPath = join(directory, "localhost.key");
  const cert = execFileSync("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    keyPath,
    "-days",
    "1",
    "-subj",
    "/CN=localhost",
    "-addext",
    "subjectAltName=DNS:localhost",
  ]);
  const key = readFileSync(keyPath);
  createServer({ key, cert }, app.getRequestHandler()).listen(port, hostname);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
