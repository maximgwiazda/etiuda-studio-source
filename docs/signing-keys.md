# Signing keys, the ring, and what to do when a key changes

For the lead who publishes catalogs and for the administrator who looks after the desks.
Board 605, ruled by Maxim on 2026-09-19 and 2026-09-20; the key kept by the operating system since
2026-10-07. Written for desks that join their lead's team. Nothing here is legal advice.

## The key

**Studio's signing key** signs every edition Studio publishes. Its private half is kept by the
operating system under your own sign-in: sealed for your Windows account, or on Linux in GNOME
Keyring or KDE Wallet. The file holding it, `signing-key.json`, sits in Studio's own settings
folder, which Show the file in Settings opens, or, for Studio run from a development tree,
wherever `STUDIO_SIGNING_KEY` points. Signing asks for no passphrase.

**Studio makes the key by itself** at the first publish, or at the first seal, when this computer
has none and can keep one, and nothing points to another key: the folder holds no team file, whole
or broken, this Studio kept no team for it, and the project remembers no seal. That edition is
the first one signed, and every desk offers your later editions as updates. Settings and the Desks
screen also make one at a press. Where the folder's team trusts a key this computer has not got,
Studio makes none: the publish cover and the Desks screen name that key and offer to restore it
first.

**Studio never writes over a key.** A key already there, or a file it cannot read, is left exactly
as it is, and there is no `--force`.

**The backup copy is the one thing to keep.** It is a file saved wherever you choose, a USB stick or
a drive someone you trust can reach, under a passphrase typed for it. **The passphrase is not
stored and cannot be recovered.** With the copy and its passphrase, Restore brings the key back on
a new computer, and every team key with it: each team file keeps a recovery copy of its team key
sealed under the signing key. After Studio makes the key by itself, the first publish that lands
suggests a backup copy, once; Settings offers one for as long as none exists, and once a desk is
admitted the backup disc stands in the corner until one is made.

## The ring

**The ring** is `etiuda-ring.json`, and it is public. It holds a list of entries, each one binding
**one public key to one catalog**:

```json
{ "format": 1,
  "kind": "etiuda-ring",
  "keys": [
    { "catalog": "your-catalog-id",
      "keyId": "studio-1e12cc46705dfc75",
      "alg": "Ed25519",
      "public": "51fb...b89a",
      "note": "free text; the desk never reads it" }
  ] }
```

**Studio writes it at every signed publish**, into the folder the catalog goes to: it adds this
key's entry for this catalog to the ring already there, or writes the ring where there is none. A
key that has never signed anything has no entry anywhere, and that is not a gap.

The command line writes an entry too, for a catalog published elsewhere or before a key's first
publish:

```
node tools/sign.mjs ring --out <key file> --catalog <catalog id> --ring <ring file>
```

It opens nothing and asks for no passphrase: an entry is a key id and a public half, both of which
sit in the clear.

**The binding is per catalog.** A key listed for one catalog says nothing about another, even on
the same desk and even in the same file.

## Which key a desk trusts

**A desk that has joined a team trusts its lead's key, pinned when it joined.** It learns that key
from the invitation, which carries the lead's whole public key, or from the team file at its first
admission, or from a ring beside the team file that lists the lead for one of the team's catalogs;
an administrator can also name the lead in machine policy. From then on the desk offers a new
edition only where a pinned lead's key verifies it, and the ring beside the catalogs adds nothing:
anybody who can write to the share can replace the ring, but not the pin. A pin stays until the
lead is forgotten (Forget this lead, in the desk's Settings), and joining another team adds that
team's lead beside it.

The badge that says Signed follows the same pin with the engine's change on its branch trust-pin
(e408e76), which is not merged yet. Until it is, a joined desk's badge still reads the ring, while
what it offers already follows the pin.

**A desk outside any team trusts the ring in its own catalog folder**, which is the folder Studio
publishes to. It reads that one file and looks nowhere else. That ring is as trustworthy as the
share: anybody who can write to the folder can write it. Joining the team is what takes the share's
writers out of the question.

**Nobody carries a ring by hand.** Studio writes it where the desks read it, and a desk in a team
does not need it.

## What a signature says, and what it does not

A `valid` signature says: **this file has not changed since it was signed by the key this desk
trusts for this catalog**, its pinned lead's in a team and its ring's outside one. It does not say
when the file was signed, or that the key has not been withdrawn since. There is no timestamp, no
certificate and no expiry.

**Withdrawn keys are not checked yet.** A list of them is planned, to come with the version note
from etiuda.dev (ruled 2026-10-06), and it is not built. Today nothing tells a desk that a key was
withdrawn.

**A catalog with an unknown key still opens when someone asks for it.** The four readings are
`none` (unsigned), `unknown` (signed by a key this desk does not trust for this catalog), `invalid`
(signed by a trusted key and changed since), and `valid`. Only `invalid` means something is wrong
with the file. What a reading changes is the offer: a desk offers an edition as an update only
where it is `valid` under the same key as the edition in use, and a desk in a team offers no edition
outside its leads' keys at all.

## Rotation: the three cases

Nothing below makes a desk unable to open a catalog it is asked to open. What changes is whether a
new edition arrives as an update.

### You simply want a new key

1. Move the old key file aside (Show the file in Settings opens its folder) and make a new one in
   Settings.
2. Where the folder has a team, hand it to the new key: on the Desks screen, Hand the team to the new signing key. Studio signs the handover with the old key, which it keeps set aside, and every desk follows it. This needs the old key, so it does not help when the key is lost (the next case), and it does not shut out a key someone else may hold (the case after): both start a new team.
3. Publish the next edition with the new key. The ring beside the catalog gains a **second** entry;
   the old one stays exactly where it was.

**Cost to the desks:** outside a team, nothing to do: each desk reads the new entry from the
folder and offers the first edition under the new key once as a new catalog, then the editions
after it as updates. Editions the old key signed go on reading `valid` while its entry is in the
ring, which is why the second entry is added rather than substituted. In a team, nothing to do either: each desk follows the handover on its own, and none joins again.

### The key is lost: the file is gone, or the computer is

**Restore it from its backup copy:** Settings, Restore a backup, or the publish cover and the Desks
screen, which name the key a team trusts and offer Restore first. The key comes back under this
computer's sign-in, every team key with it, and every desk carries on as before.

**With no backup copy, you cannot sign anything new with that key. Everything already published
goes on verifying.** There is no recovery: the private half existed in one place, and no part of
Studio can reconstruct it from the public half or from a signed catalog. Do what the previous case
says. On a folder with no team, the next publish makes the new key by itself; on a folder whose
team trusts the lost key, Studio makes none until you choose a new key yourself, since a new key
there costs every desk its place in the team.

### The key is leaked

This is the expensive one.

1. Move the leaked key file aside and make a new key in Settings. Where the folder has a team, start
   a new one under the new key (Start a new team here, on the Desks screen), and every desk joins it
   again.
2. Publish every edition still in use with the new key. Until an edition is republished it is
   signed by the leaked key, and step 3 turns it `unknown`.
3. **Edit the ring in the folder: delete the leaked key's entry.** Removal is by hand, in a text
   editor; Studio never deletes an entry, because a program that could take trust away by accident
   is worse than one that cannot take it away at all.

**Cost to the desks:** outside a team, nothing to carry: a desk reads the edited ring from the
folder, and from then on nothing the leaked key signs reads `valid` there. In a team, a desk trusts
the leaked key for as long as it keeps that lead pinned: joining the new team adds the new lead
beside it, and only Forget this lead, at the desk, takes the old one away. Until then whoever holds
the leaked key can sign what that desk accepts, editions and team files alike, and nothing tells
the desk, since withdrawn keys are not checked yet (above). This is the one job here with a
deadline.

**Before you delete the old entry,** be aware that every edition it signed becomes `unknown` on
the desks that read that ring. That is a badge, not a lockout, and it is the price of the leak.

## Taking a key out of a ring

Open `etiuda-ring.json` in a text editor, delete the entry, save. There is nothing else to it,
and no Studio command does it for you. Order does not matter, unknown fields are left alone, and
`note` is where to write why an old key is still listed. Studio merges into a file you have
edited: it adds its own entry and leaves every other line exactly as it found it. If Studio
cannot read the file at all, it refuses and does not touch it, so a mistyped ring costs you a
refusal rather than the file.

## What this deliberately does not do

No timestamping, no certificate authority, no chain, no key fetching, no expiry, and no Windows
certificate store. What a desk trusts instead is its lead's key once it has joined a team, and the
ring in its own folder until then. Revocation was left out with the rest on 2026-09-19 and ruled in
on 2026-10-06: the list of withdrawn keys, which is planned and not built.
