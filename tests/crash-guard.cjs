// tests/crash-guard.cjs
// Uncaught exception guard loaded into Electron's main process before the
// application code by the harness launcher.
//
// Electron shows its native crash dialog only while it has the sole
// uncaughtException listener. Registering this listener prevents the dialog:
// it writes the error stack to stderr with a recognisable prefix, then exits
// with a non-zero code.
//
// Handled for uncaughtException only; unhandledRejection is untouched.

const UNCAUGHT_PREFIX = "uncaught-guard: ";

if (!globalThis.__ETIUDA_CRASH_GUARD__) {
  globalThis.__ETIUDA_CRASH_GUARD__ = true;
  process.on("uncaughtException", (err) => {
    const stack = (err && err.stack) ? err.stack : String(err);
    process.stderr.write(UNCAUGHT_PREFIX + stack + "\n");
    process.exit(1);
  });
}

module.exports = { UNCAUGHT_PREFIX };
