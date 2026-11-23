import { appendFileSync } from "node:fs";

let LOG = null;

export async function initialize(data) {
  LOG = data && data.log;
}

export async function load(url, context, nextLoad) {
  const r = await nextLoad(url, context);
  if (LOG && url.includes("/src/") && url.endsWith(".mjs")) {
    try {
      appendFileSync(LOG, url.slice(url.lastIndexOf("/src/") + 5) + "\n");
    } catch {}
  }
  return r;
}
