# Installing Etiuda Studio silently

For the administrator whose deployment tool installs Studio. Board 980.

Which command to use depends on the account the deployment tool runs as:

- **From the system account, or elevated with nobody signed in:** `etiuda-studio-<version>-setup.exe /S /allusers`
  installs once for every account on the machine, into `C:\Program Files\Etiuda Studio`. Bare `/S` does the same here:
  a silent run with neither switch, by the system account or by an administrator's elevated process in session 0,
  where no person's desktop is, installs for all users. Tested on GitHub's Windows runner, under a test identity (this
  installer under another app id): pushed silently as the system account into Program Files, a standard account's
  first start, and the removal as the system account (run 43396100420, 2026-11-13).
- **In the person's own account:** `etiuda-studio-<version>-setup.exe /S /currentuser` installs for that account alone
  and opens no window. Tested the same way, over an older version (run 43435170418, 2026-11-13).
- **Bare `/S` anywhere else follows the account that runs it**, as it always has: for that account alone, unless an
  all-users copy is already registered. Pass `/currentuser` or `/allusers` rather than leaving the choice to the account.

`/D=<folder>` installs somewhere else; it goes last, unquoted. An all-users install gives every account the shortcuts,
and its uninstall takes them away. Studio registers no file type and no link.

Install for all users into Program Files, or into a folder that neither Users, Authenticated Users, Everyone, INTERACTIVE
nor Domain Users (S-1-5-32-545, S-1-5-11, S-1-1-0, S-1-5-4, and the domain's own SID ending -513) can write to, and whose
parent folder they cannot write to either. A silent install gives no warning when this is not so.

The uninstaller takes `/S` the same way, as the `QuietUninstallString` the installer registers, and keeps each
person's data. For an all-users install that is
`"C:\Program Files\Etiuda Studio\Uninstall Etiuda Studio.exe" /allusers /S`, written out in full for a tool that does
not expand variables. The exit code says what to do next:

| Code | Meaning | What to do |
|---|---|---|
| 0 | Installed, or uninstalled. A Windows older than 7, or a 32-bit Windows, is refused and can also end with 0 | Nothing, on a supported machine |
| 1618 | Etiuda Studio was still open in the installing account after being asked to close for about 20 seconds, or open in another person's session (an all-users run never closes it), or could not be moved aside during the swap, or another Etiuda Studio installer was running | Retry later |
| 740 | An all-users run could not get administrator rights | Run it elevated, or install per account with `/currentuser` |
| 2 | The folder already holds other files and no earlier Etiuda Studio, or another failure the installer caught | Look at that machine |

An update writes the new files to `<folder>.setup-staging` beside the install first and checks locked files there; only once every file the package lists (`etiuda-files.ini`) is there, at its size, does it ask the open copy to close and swap the folders by two renames (`<folder>.setup-previous`), so a failed upgrade leaves the old version as it was until the deployment tool retries. Anything in the folder that the old version's own list does not name goes straight back into it. The old version waits in `<folder>.setup-previous` until the new one has started; an account that cannot write there, as with an all-users install, leaves it for the next update or the uninstall. A deployment tool that names a folder inside or above the registered one keeps the old copy there, no longer registered, to be removed by hand.

An all-users install looks for an open copy in every session, and asks only the installing account's own copy to
close: another person's is never closed, so the run ends with 1618 and the deployment tool tries again later. A
per-user install looks in its own account alone, since another account's copy runs from that account's own folder.
An all-users install started already elevated, with no person's own instance to act through, leaves that account's
per-user copy to its own uninstaller, run silently as that account the next time it signs in, keeping its data.

1618 and 740 are the codes Windows itself uses for these cases; the deployment tool still needs them mapped, 1618 to a
retry and 740 and 2 to a failure.

## Detecting it, and packaging it

- **Detection** is a registry rule in the 64-bit view: the value `DisplayVersion` under
  `HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Uninstall\69f2428c-ec33-5124-b853-13e5f8a63aec` for an
  all-users install, or the same path under `HKEY_CURRENT_USER` for a per-user one. The key comes from the app's id
  and stays the same from version to version; `InstallLocation` beside it is the folder.
- **`DisplayVersion` is the version the build carries.** Every build so far carries the same version, so detect that
  the value exists rather than compare it, until releases carry numbers of their own.
- **The package is the one setup file**, with nothing beside it, and the install reaches no host on the network.
- **The installer is unsigned until a certificate is in place**, so a machine that allows only signed publishers needs
  each build allowed by its hash.
- **There is no installer log.** The NSIS build that electron-builder bundles is compiled without logging, so the exit
  code is the record, with the deployment tool's own log beside it.

## Machine policy

Studio reads its AI service from string values under `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Etiuda`: `AiProvider`
(`openai`, `anthropic`, `google`, `azure` or `compatible`), `AiEndpoint`, `AiModel` and `AiKey`. A value set there
stands over the person's own setting, which shows it and cannot change it.

A key set by machine policy is readable by every user of that machine, so prefer a gateway address that needs no key,
or a key limited to this use.

The DWORD `StudioNoUpdateCheck` set to 1 in the same key switches off Studio's hourly look for a new version: Studio then
asks for no version note and offers none. The switch is read on Windows only. It reads the value and never writes it, and a per-user value does nothing.
