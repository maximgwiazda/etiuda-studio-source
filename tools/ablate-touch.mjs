/* Liveness floor for Studio's ablation: record every src/*.mjs this process evaluates.
   Registered with --import so it costs the subject nothing and changes no product file. */
import { register } from "node:module";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

if (process.env.ABLATE_TOUCH) {
  try {
    register("./ablate-touch-hook.mjs", pathToFileURL(import.meta.filename), {
      data: { log: process.env.ABLATE_TOUCH },
    });
  } catch (e) {
    appendFileSync(process.env.ABLATE_TOUCH, "REGISTER-FAILED " + e.message + "\n");
  }
}
