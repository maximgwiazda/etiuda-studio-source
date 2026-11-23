/* A WINDOWS RUN KEY AS ELECTRON READS AND WRITES IT, for the shell labs that stand in for Electron's app.
 *
 * Electron on Windows (shell/browser/browser_win.cc): setLoginItemSettings writes the Run value named settings.name, or the
 * app's AppUserModelId when no name is given, as the executable and the arguments, and deletes it when openAtLogin is
 * false. getLoginItemSettings's openAtLogin compares the value under the AppUserModelId with the executable and the
 * arguments asked for (none by default), and launchItems lists every value whose executable is this one, by name.
 *
 * Before 2026-11-12 the labs' stand-in ignored the name and the arguments, so Studio wrote under the desk's name
 * (app.etiuda.desktop, the pinned tray.cjs's default) and read the state through openAtLogin, which never matches the
 * --hidden it writes, and every leg stayed green. This model is what made that red. */

export const STUDIO_EXE = "C:\\Users\\lab\\AppData\\Local\\Programs\\etiuda-studio\\Etiuda Studio.exe";
export const DESK_EXE = "C:\\Users\\lab\\AppData\\Local\\Programs\\etiuda\\Etiuda.exe";
export const STUDIO_AUMID = "electron.app.Etiuda Studio";

const quoted = (exe, args) => "\"" + exe + "\"" + (args && args.length ? " " + args.join(" ") : "");

/* Puts the model on a stand-in app. app._login.run maps a value's name to { path, args }; app._login.calls counts writes. */
export function useRunKey(app, opts = {}) {
  const exe = opts.exe || STUDIO_EXE;
  const aumid = opts.aumid || STUDIO_AUMID;
  app._login = { run: {}, calls: 0 };
  app.getLoginItemSettings = function (o) {
    const want = (o && o.path) || exe;
    const args = (o && o.args) || [];
    const run = this._login.run;
    const mine = run[aumid];
    const launchItems = Object.keys(run)
      .filter((name) => run[name].path.toLowerCase() === want.toLowerCase())
      .map((name) => ({ name, path: run[name].path, args: run[name].args.slice(), scope: "user", enabled: true }));
    return { openAtLogin: !!mine && quoted(mine.path, mine.args) === quoted(want, args), launchItems };
  };
  app.setLoginItemSettings = function (st) {
    this._login.calls++;
    const name = (st && st.name) || aumid;
    if (st && st.openAtLogin) this._login.run[name] = { path: (st && st.path) || exe, args: ((st && st.args) || []).slice() };
    else delete this._login.run[name];
  };
  return app;
}

/* Whether any value starts this executable at sign-in, which is what the person sees at the next sign-in. */
export function startsAtSignIn(app, exe = STUDIO_EXE) {
  const run = app._login.run;
  return Object.keys(run).some((name) => run[name].path.toLowerCase() === exe.toLowerCase());
}

/* Studio switched on under its own name, as a fixed Studio writes it. */
export function studioOn(app) {
  app._login.run["app.etiuda.studio"] = { path: STUDIO_EXE, args: ["--hidden"] };
}
