/* THE FORMAT REVISION'S ONE LIST STUDIO'S OWN CODE READS (board 834, step 5). The engine's named
 * card and header keys are read off the pin itself (src/engine.mjs namedFields), so no copy of
 * them is kept here to fall behind it.
 */

/* The header fields that describe a desk's own file and never a catalog's content: where it
   grew from, who it is, and its flags. A review never offers them as a change (src/review.mjs NEVER). */
const DESK_FILE_HEADER = ["grew", "desk", "flags"]; /* plant:flag-header-known */

export { DESK_FILE_HEADER };
