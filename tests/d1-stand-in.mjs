/* A STAND-IN D1, for running service/licence/ in node as Cloudflare runs it (board 936, S4; the test architect's condition
 * (8): the queries run on real SQLite). It executes the service's SQL unchanged on node's own SQLite (node:sqlite, in
 * memory), as the engine's relay/test/do-ctx.cjs does for the relay's objects, through the part of D1's API the service
 * uses and no more:
 *
 *   db.prepare(sql).bind(...values)   positional values, for ? and ?NNN alike
 *   stmt.first()                      the first row as a plain object, or null
 *   stmt.all()                        { results, success, meta: { changes, last_row_id } }
 *   stmt.run()                        the same
 *   db.batch([stmt, ...])             every statement in one transaction, rolled back whole on a throw, as D1's batch is
 *
 * EVERY CALL YIELDS TO THE EVENT LOOP BEFORE IT RUNS, as a call to D1 crosses the network, so two requests in flight
 * interleave at each statement exactly as two Worker requests may: a decision taken by reading and then writing races
 * here as it would there, and one taken inside a statement or a batch does not, since a statement and a batch run whole.
 *
 * A LEG THAT RACES makes the worst interleaving certain rather than likely: `db.pair(n)` holds each call until n are
 * waiting (or 50 ms pass with fewer), then lets them run in the order they came, so n requests making the same calls
 * meet the database together at every statement, each one's read before any one's write. `db.pair(0)` ends it.
 */
import { DatabaseSync } from "node:sqlite";

const tick = () => new Promise(resolve => setImmediate(resolve));

/* D1 binds ?NNN by position, as SQLite does; node:sqlite reads ?NNN as a named parameter and binds it from no array. So each
   ?NNN is written as ? with the NNNth value at that place, which binds the same value to the same place. The service writes
   no ? inside a string literal, so nothing else is touched. */
function numbered(sql, values) {
  if (!/\?\d/.test(sql)) return [sql, values];
  const out = [];
  return [sql.replace(/\?(\d+)/g, (_, n) => { out.push(values[Number(n) - 1]); return "?"; }), out];
}

function standInD1(schemaSql) {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  if (schemaSql) db.exec(schemaSql);
  let calls = 0, pairing = 0, waiting = [];
  function gate() {
    if (!pairing) return tick();
    return new Promise(resolve => {
      waiting.push(resolve);
      if (waiting.length >= pairing) { const all = waiting; waiting = []; for (const r of all) setImmediate(r); }
      else setTimeout(() => { const i = waiting.indexOf(resolve); if (i >= 0) { waiting.splice(i, 1); resolve(); } }, 50);
    });
  }

  function exec(text, given) {
    const [sql, values] = numbered(text, given);
    const st = db.prepare(sql);
    const rows = st.columns().length ? st.all(...values) : null;
    if (rows) return { results: rows.map(r => Object.assign({}, r)), success: true,
      meta: { changes: /^\s*SELECT\b/i.test(sql) ? 0 : db.prepare("SELECT changes() AS c").get().c, last_row_id: 0 } };
    const r = st.run(...values);
    return { results: [], success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }

  function statement(sql, values) {
    return {
      sql, values,
      bind(...vs) { return statement(sql, vs.map(v => (v === undefined ? null : v))); },
      async first() { calls++; await gate(); const r = exec(sql, values); return r.results.length ? r.results[0] : null; },
      async all() { calls++; await gate(); return exec(sql, values); },
      async run() { calls++; await gate(); return exec(sql, values); },
    };
  }

  return {
    prepare(sql) { return statement(sql, []); },
    async batch(stmts) {
      calls++;
      await gate();
      db.exec("BEGIN");
      try {
        const out = stmts.map(s => exec(s.sql, s.values));
        db.exec("COMMIT");
        return out;
      } catch (e) { db.exec("ROLLBACK"); throw e; }
    },
    /* For legs only: SQL straight at the database, synchronously, and how many calls the service made. */
    raw: db,
    get calls() { return calls; },
    pair(n) { pairing = n; },
  };
}

export { standInD1 };
