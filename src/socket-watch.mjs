/* WHETHER THE RELAY'S SOCKET GETS THROUGH ON THIS NETWORK (board 989). The pinned channel layer keeps a socket to the relay,
 * which announces new uploads at once, and asks the relay on a timer where it has none. A network whose gateway inspects
 * encrypted traffic can refuse the socket while it lets the asking through; the layer then still brings every update, only
 * later, and said nothing of it. This watch sits between the layer and the shell's one door (src/wire.cjs), sees each
 * socket open or close and each ask answered or not, and says when the updates come by asking alone, so the team's row
 * can say so (Claude alpha's criterion: "where the push socket cannot connect, the person is told and the desk falls back
 * to asking, never silently stale").
 *
 * NOT LIVE is two sockets in a row that closed without having opened, while the last ask was answered. A socket the door
 * would not make is not one of them: that refusal is Studio's, not the network's. One failure is not enough, since a relay
 * that restarts drops a socket once; where the asking fails too, the relay is out of reach, which is another thing to say.
 * A socket that opens ends it at once.
 *
 * AND THE ASKING STAYS AT THE LAYER'S PACE. The layer at the pin tries a closed socket again two seconds later and asks the
 * relay each time (measured 2026-11-11: six attempts in twelve seconds), which a refused socket turns into an ask every two
 * seconds for as long as Studio runs. Once the socket is judged not to get through, the watch makes none for HOLD_MS, so the
 * layer asks on its own timer, once a minute, and tries the socket again after that. */
export const HOLD_MS = 60 * 1000;
const FAILS_TO_TELL = 2;

/** A watch over one channel's socket and asks. `clock` is for the legs. */
export function socketWatch(o) {
  const x = o || {};
  const clock = typeof x.clock === "function" ? x.clock : Date.now;
  let fails = 0, heldUntil = 0, askAnswered = false;
  /* The door's connect, watched: the layer's own handlers pass through, with the opening and the close seen first. */
  function connect(inner) {
    if (typeof inner !== "function") return inner;
    return (url, headers, on) => {
      if (clock() < heldUntil) return null; /* plant:989-hold */
      let opened = false;
      const failed = () => { fails++; if (fails >= FAILS_TO_TELL) heldUntil = clock() + HOLD_MS; };
      const handlers = {
        message: (text) => on.message(text),
        open: () => { opened = true; fails = 0; heldUntil = 0; if (typeof on.open === "function") on.open(); },
        close: () => { if (!opened) failed(); on.close(); },
      };
      let s = null;
      try { s = inner(url, headers, handlers); } catch (e) { s = null; }
      /* No socket made is the door's own refusal (an address it does not admit, a runtime without WebSocket), not the
         server's: it neither counts nor clears, so "not live" means the server closed sockets unopened (the test architect's
         note on 989). */
      if (!s) return null; /* plant:989-door */
      return s;
    };
  }
  /* The door's ask, watched: an answer of any status is the relay reached; a throw is the relay not answering. */
  function request(inner) {
    if (typeof inner !== "function") return inner;
    return async (...args) => {
      try { const r = await inner(...args); askAnswered = true; return r; }
      catch (e) { askAnswered = false; throw e; }
    };
  }
  return { connect, request, notLive: () => fails >= FAILS_TO_TELL && askAnswered }; /* plant:989-not-live */
}
