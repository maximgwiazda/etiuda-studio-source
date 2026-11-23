/* The project the card-life legs share: four cards in two languages published fourteen times, alpha retired at 6 and
 * restored at 11, bravo retitled at 4 and its body changed at 9, charlie retired at 13, delta changed in every edition,
 * one day per edition on a fixed clock. */
import "./licensed-env.mjs";
import path from "node:path";
import * as S from "../src/studio.mjs";
import { publishFull, editionsIn } from "../src/publish.mjs";

export async function buildProject(root, name) {
  const made = await S.newProject(root, name || "Card life", [{ code: "en", name: "English" },
    { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = ((await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag).id;
  const ids = {};
  for (const [k, title] of [["alpha", "Alpha"], ["bravo", "Bravo"], ["charlie", "Charlie"],
    ["delta", "Delta"]]) {
    const r = await S.addCard(dir, shelf, title, "The " + k + " answer, in full.");
    ids[k] = r.card.id;
    await S.saveCard(dir, ids[k], { title: { pl: title + " PL" },
      body: { pl: "Odpowiedz " + k + ", w calosci." } });
  }
  const NOTES = {};
  const published = {};          /* rev -> edition name */
  for (let rev = 1; rev <= 14; rev++) {
    if (rev === 4) await S.saveCard(dir, ids.bravo, { title: { en: "Bravo, shorter", pl: "Bravo PL, krocej" } });
    if (rev === 9) await S.saveCard(dir, ids.bravo, { body: { en: "The bravo answer, now with a price." } });
    if (rev === 6) await S.retireCard(dir, ids.alpha);
    if (rev === 11) await S.restoreCard(dir, ids.alpha);
    if (rev === 13) await S.retireCard(dir, ids.charlie);
    /* delta changes in every edition, so that no edition equals the one before it */
    await S.saveCard(dir, ids.delta, { body: { en: "The delta answer, revision " + rev + "." } });
    NOTES[rev] = "Note for revision " + rev + ".\nA second line that is not shown.";
    const before = editionsIn(dir);
    await publishFull({ project: dir, notes: NOTES[rev], now: "2026-09-" + String(10 + rev) + "T10:00:00.000Z" });
    published[rev] = editionsIn(dir).filter(e => before.indexOf(e) < 0)[0];
  }
  return { dir, ids, published, NOTES };
}
