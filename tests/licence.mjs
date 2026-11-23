/* THE INSTALLER'S LICENCE PAGE IS THE RULED TEXT, IN THE LANGUAGE THE INSTALLER IS SPEAKING.
 *
 *     node tests/licence.mjs
 *
 * Board 491, Maxim's ruling of 2026-09-18: one End-User Licence for both installers, three
 * devices per named person, twelve months of updates, a fourteen-day organisational trial, the
 * seller's legal name and address bracketed until the registration. Board 523 wired it into
 * Studio's installer, replacing the placeholder notice that stood there until then.
 *
 * WHAT COULD BE WRONG, AND IT IS ONE LEG EACH.
 *
 *  1  The file is prose and prose is not verified by a gate - Maxim reads it. What a gate CAN
 *     hold is that the whole of it is there and none of the placeholder is: the word counts are
 *     the copywriter's own, stated in her file with the method (whitespace tokens, brackets
 *     counted as the words inside them), and a cut clause or a re-pasted placeholder moves them.
 *  2  electron-builder picks the file BY THE INSTALLER'S OWN LANGUAGE, and it does that only
 *     when nothing pins a single file: `nsis.license` set, or a plain `license.txt` sitting in
 *     buildResources, either of which makes both language files dead weight nobody would notice.
 *     The leg asks app-builder-lib's OWN resolver rather than this file's reading of it.
 *  3  Each file already carries a UTF-8 BOM. electron-builder's multi-language path converts a
 *     licence file to UTF-8 with BOM BY WRITING THE BOM INTO IT, in buildResources, which is a
 *     tracked file in this repository: a build would leave the working tree dirty and the next
 *     commit would carry a byte nobody typed. Written with the BOM, the converter sees it and
 *     skips. This is the whole reason the files are not plain UTF-8.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PACKAGING = path.join(ROOT, "packaging");
const require = createRequire(import.meta.url);

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* THE BOM IS BUILT, NEVER TYPED. */
const BOM = String.fromCharCode(0xFEFF);

/** The copywriter's counting rule, written here from her statement of it rather than from any
 *  code: whitespace-separated tokens of the body, with the brackets of a placeholder removed so
 *  that a bracketed term counts as the words inside it. */
function words(text) {
  const body = text.charAt(0) === BOM ? text.slice(1) : text;
  return body.replace(/[[\]]/g, "").split(/\s+/).filter(Boolean).length;
}

async function main() {
  /* ---- 1. THE TEXT ------------------------------------------------------------------------ */

  const en = fs.readFileSync(path.join(PACKAGING, "license_en.txt"), "utf8");
  const pl = fs.readFileSync(path.join(PACKAGING, "license_pl.txt"), "utf8");
  /* THE PHRASES BELOW ARE ASKED OF THE TEXT WITH ITS WRAPPING TAKEN OUT. The files are wrapped
     at 76 columns for the NSIS page, so any phrase worth asking about is split by a newline
     somewhere and a regex over the raw bytes measures the wrapper rather than the wording. */
  const flat = (t) => t.replace(/\s+/g, " ");
  const enF = flat(en), plF = flat(pl);

  /* THE TRADEMARK NOTICE CLOSES EACH FILE and is not the copywriter's text, so her count is taken
     without the last paragraph, and 1f holds that paragraph to its one pair in ui/lang.js. */
  const paras = (t) => t.trim().split(/\n\s*\n/);
  const ruled = (t) => paras(t).slice(0, -1).join("\n\n");
  check(words(ruled(en)) === 575 && words(ruled(pl)) === 521,
    "1a the two licence files are the ruled text whole, by the copywriter's own count - "
    + words(ruled(en)) + " English words and " + words(ruled(pl)) + " Polish, against her 575 and 520 (the relay's Privacy paragraph of 2026-10-19 added 97 and 90, and its sentence on the relay's pass of 2026-10-25 50 and 37), and the seller named as the business, \"Stardust Maxim Gwiazda\", one word more in each than \"Maxim Gwiazda\" was");

  /* THE THREE NUMBERS MAXIM RULED, each asked for in both languages: a draft that lost one of
     them would still pass the word count if something else had grown. */
  const RULED = [
    ["three devices", /up to three devices/, /do trzech urządzeń/],
    ["twelve months of updates", /twelve months after purchase/, /dwunastu miesięcy od zakupu/],
    ["a fourteen-day trial", /for fourteen days/, /przez czternaście dni/],
    ["the business as seller, its NIP and country, no address", /Stardust Maxim Gwiazda, NIP 5242711262, Poland\. This licence covers Etiuda and Etiuda Studio\./,
      /Stardust Maxim Gwiazda, NIP 5242711262, Polska\. Licencja obejmuje Etiudę i Etiudę Studio\./],
  ];
  const missing = RULED.filter(([, a, b]) => !a.test(enF) || !b.test(plF)).map(([n]) => n);
  check(missing.length === 0,
    "1b and every term the ruling names is in both languages: " + RULED.map(([n]) => n).join(", ")
    + (missing.length ? " - missing " + missing.join(", ") : ""));

  /* ---- 2. THE INSTALLER'S OWN RESOLVER ----------------------------------------------------- */

  /* ASKED OF app-builder-lib ITSELF. The naming rule that makes these files a per-language
     licence lives in its own source - name.startsWith("license_") and a known extension, then a
     language id off the suffix - and a gate that restated the rule here would pass the day the
     library changed it. The stub is the two members that function reads. */
  const { getLicenseFiles } = require("app-builder-lib/out/util/license.js");
  const { lcid } = require("app-builder-lib/out/util/langs.js");
  const stub = {
    buildResourcesDir: PACKAGING,
    resourceList: Promise.resolve(fs.readdirSync(PACKAGING)),
  };
  const assets = await getLicenseFiles(stub);
  const byLang = {};
  assets.forEach(a => { byLang[a.lang] = a; });
  check(assets.length === 2 && byLang.en && byLang.pl,
    "2a electron-builder's own resolver finds one licence per language in packaging/: "
    + assets.map(a => a.lang + " -> " + path.basename(a.file)).join(", "));
  check(lcid[byLang.en && byLang.en.langWithRegion] === 1033
        && lcid[byLang.pl && byLang.pl.langWithRegion] === 1045,
    "2b and each carries the language id NSIS switches on, so the page follows the installer's"
    + " own choice: en_US " + lcid[byLang.en && byLang.en.langWithRegion] + ", pl_PL "
    + lcid[byLang.pl && byLang.pl.langWithRegion]);

  /* NOTHING PINS ONE FILE. Either of these two would send every language the same page, and
     app-builder-lib takes them in this order before it ever looks for license_<lang>.txt. */
  const cfg = require(path.join(ROOT, "electron-builder.js"));
  check(cfg.nsis && cfg.nsis.license === undefined
        && !fs.existsSync(path.join(PACKAGING, "eula.txt")),
    "2c and nothing pins a single file over them - no nsis.license in electron-builder.js and"
    + " no license.txt or eula.txt in packaging/");

  process.stdout.write("licence  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main().catch(e => { process.stderr.write(String((e && e.stack) || e) + "\n"); process.exit(1); });
