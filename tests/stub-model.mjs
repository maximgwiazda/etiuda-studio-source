/* A PROGRAM THAT IS NOT A MODEL, FOR THE GATES. Board 602.
 *
 *     node tests/stub-model.mjs <fixture file>
 *
 * tests/import-model.mjs runs it with a request on standard input and takes what it prints as the
 * model's answer, so the text importer is proved end to end with no key, no account and no
 * network anywhere in the run, on a canned answer a gate built from a flatten key it already
 * holds. Nothing in Studio's package runs it; it is a test's own tool.
 *
 * IT READS STANDARD INPUT TO THE END before it answers. A child that never drains its input
 * leaves the parent's write to break on a pipe that filled, and the parent would then report a
 * fault that is really this stub's.
 */
import fs from "node:fs";

let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", d => { stdin += d; });
process.stdin.on("end", () => {
  const at = process.argv[2];
  if (!at || !fs.existsSync(at)) {
    process.stderr.write("stub-model: no fixture at " + String(at) + "\n");
    process.exit(3);
  }
  process.stdout.write(fs.readFileSync(at, "utf8"));
});
