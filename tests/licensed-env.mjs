/* THE LICENCE A PAYING LEAD HOLDS, PUT ON THE WHOLE PROCESS (tests/licensed.mjs, which makes it): a leg that publishes through the node
 * modules and names no licence of its own imports this file, and every publish in it finds one. A leg that sets STUDIO_LICENSE_FILE,
 * STUDIO_LICENCE_FILE or STUDIO_VENDOR_KEY itself keeps what it set.
 */
import { licensedOpts } from "./licensed.mjs";

if (!process.env.STUDIO_LICENSE_FILE && !process.env.STUDIO_LICENCE_FILE && !process.env.STUDIO_VENDOR_KEY) {
  const o = await licensedOpts();
  process.env.STUDIO_LICENSE_FILE = o.licenceFile;
  process.env.STUDIO_VENDOR_KEY = o.trustedKey;
}
