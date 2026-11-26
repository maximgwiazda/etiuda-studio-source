# Studio's installer script. electron-builder includes this file from packaging/.
# It includes the installer hooks and swap helpers cut from the pinned engine script, then
# Studio's welcome page and the turning sidebar and header. The pin is not edited, and the
# desk's shell/installer.nsh is not included: that file defines the desk's customInit and
# welcome page. When the cut already defines customWelcomePage, the cut owns the pages
# and the block below is skipped.

!ifndef PROJECT_DIR
  !error "PROJECT_DIR is not set, so the pinned installer script cannot be found"
!endif
# THIS FILE CARRIES ITS OWN COPY of the desk's two install checks, the recognition of an existing installation and
# the removal of a shortcut left in the other scope, while the pin predates them; the define keeps the pinned hooks
# from emitting a second copy once they carry them. tests/install-plan-selftest.mjs 7 holds one of each.
!define INSTALL_CHECKS_OWN_COPY
# AND ITS OWN REMOVE MY DATA STEP (un.RemoveUserData below, with Studio's keep list), so the desk's data step in the
# pinned customUnInstall, which stands under this define from engine e522d921, is not emitted here.
# tests/installer-writes.mjs 1e holds it.
!define OWN_UNINSTALL_DATA_STEP
!searchreplace PROJECT_DIR_BS "${PROJECT_DIR}" "/" "\"
!include /CHARSET=UTF8 "${PROJECT_DIR_BS}\engine\pinned\.installer-hooks.nsh"

!ifmacrodef customWelcomePage
!else
  # The five-hook cut does not define MUI_CUSTOMFUNCTION_GUIINIT: that define sits above the
  # hooks in the desk's script and the cut skips it. The uninstaller compile has not defined it
  # either, and makensis runs with warnings as errors, so a bare !undef is warning 6155.
  !ifdef MUI_CUSTOMFUNCTION_GUIINIT
    !undef MUI_CUSTOMFUNCTION_GUIINIT
  !endif
  !define MUI_CUSTOMFUNCTION_GUIINIT TurnGuiInit
  !ifdef BUILD_UNINSTALLER
    !define MUI_CUSTOMFUNCTION_UNGUIINIT un.TurnGuiInit
  !endif

# THE TURNING SIDEBAR AND HEADER. Looping frames, one every ${TURN_INTERVAL} ms. Frame 0 is the still
# electron-builder shows from installerSidebar.bmp and installerHeader.bmp. The frames are
# extracted into $PLUGINSDIR\turn from turning.7z at .onInit and un.onInit. One nsDialogs timer,
# NSIS's own, swaps whichever image is on the page: the sidebar on Welcome and Finish, the header
# on an inner page. Leaving a page changes that key, so the count returns to frame 0 and the
# previous page's sequence stops. A page with no image is left on the still. .onGUIEnd removes the timer.
!ifndef BUILD_RESOURCES_DIR
  !define BUILD_RESOURCES_DIR "${PROJECT_DIR_BS}\packaging"
!endif
!include "${BUILD_RESOURCES_DIR}\installer\turning.nsh"

# ONE SETUP AT A TIME, the desk's etiudaOneSetup (its shell/installer.nsh) as it stands; the cut stops before it. electron-builder's
# guard (installer.nsi) refuses a second copy only on ERROR_ALREADY_EXISTS, and a mutex an elevated copy holds answers an unelevated
# one ERROR_ACCESS_DENIED; this refuses on either, the running copy brought forward, exit 1618. The inner, elevated half is that run.
!ifmacrondef etiudaOneSetup
!macro etiudaOneSetup
  ${IfNot} ${UAC_IsInnerInstance}
    Push $0
    Push $1
    Push $2
    System::Call 'kernel32::CreateMutex(p 0, i 0, t "${APP_GUID}.etiuda-setup") p .r1 ?e'
    Pop $0
    ${If} $0 = 183
    ${OrIf} $0 = 5 # plant:one-setup-denied
      StrLen $0 "$(^SetupCaption)"
      IntOp $0 $0 + 1
      StrCpy $1 ""
      ${Do}
        FindWindow $1 "#32770" "" "" $1
        ${If} $1 == 0
          ${ExitDo}
        ${EndIf}
        System::Call 'user32::GetWindowText(p r1, t .r2, i r0)'
        ${If} $2 == "$(^SetupCaption)"
          System::Call 'user32::SetForegroundWindow(p r1)'
          ${ExitDo}
        ${EndIf}
      ${Loop}
      SetErrorLevel 1618
      Quit # plant:one-setup-quits
    ${EndIf}
    Pop $2
    Pop $1
    Pop $0
  ${EndIf}
!macroend
!endif

!macro customInit
  StrCpy $etiudaFinishText "$(MUI_TEXT_FINISH_INFO_TEXT)"
  !insertmacro etiudaOneSetup
  !insertmacro etiudaTrimSlashes $INSTDIR
  ${IfNot} ${Silent}
    ${IfNot} ${UAC_IsInnerInstance}
      Call RecogniseExistingInstallation
    ${EndIf}
    InitPluginsDir
    CreateDirectory "$PLUGINSDIR\turn"
    Push $0
    StrCpy $0 $OUTDIR
    SetOutPath "$PLUGINSDIR\turn"
    File "${BUILD_RESOURCES_DIR}\installer\turning.7z"
    # Nsis7z::Extract answers nothing and sets no error flag; what guards a failed or partial
    # extraction is the FileExists before the timer and before every frame, so the still stays.
    Nsis7z::Extract "$PLUGINSDIR\turn\turning.7z"
    Delete "$PLUGINSDIR\turn\turning.7z"
    SetOutPath "$0"
    Pop $0
  ${EndIf}
!macroend

!macro customUnInit
  StrCpy $UnRemoveData "0"
  ${IfNot} ${Silent}
    InitPluginsDir
    CreateDirectory "$PLUGINSDIR\turn"
    Push $0
    StrCpy $0 $OUTDIR
    SetOutPath "$PLUGINSDIR\turn"
    File "${BUILD_RESOURCES_DIR}\installer\turning.7z"
    # Nsis7z::Extract answers nothing and sets no error flag; what guards a failed or partial
    # extraction is the FileExists before the timer and before every frame, so the still stays.
    Nsis7z::Extract "$PLUGINSDIR\turn\turning.7z"
    Delete "$PLUGINSDIR\turn\turning.7z"
    SetOutPath "$0"
    Pop $0
  ${EndIf}
!macroend

# THE RECOGNITION, the desk's (its shell/installer.nsh customHeader) as it stands: customInit calls it in the outer
# copy of an interactive install, before any file is written. Inserted by customWelcomePage, where LogicLib and
# electron-builder's install-mode variables already exist.
!macro studioRecognition
  Function CompareSemver
    # Compares $0 (v1, installed) with $1 (v2, installer).
    # Returns $0: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2, 2 if unreadable.
    Push $1
    Push $2
    Push $3
    Push $4
    Push $5
    Push $6
    Push $7
    Push $8
    Push $9
    Push $R0
    Push $R1
    Push $R2
    Push $R3
    Push $R4

    StrCmp $0 $1 CmpEqual 0
    StrCmp $0 "" CmpUnreadable 0
    StrCmp $1 "" CmpUnreadable 0

    # Strip build metadata (+...) from $0 into $R0
    StrCpy $R0 $0
    StrCpy $2 0
    LoopStripBuild0:
      StrCpy $3 $R0 1 $2
      StrCmp $3 "" DoneStripBuild0
      StrCmp $3 "+" 0 NextStripBuild0
      StrCpy $R0 $R0 $2
      Goto DoneStripBuild0
      NextStripBuild0:
      IntOp $2 $2 + 1
      Goto LoopStripBuild0
    DoneStripBuild0:

    # Strip build metadata (+...) from $1 into $R1
    StrCpy $R1 $1
    StrCpy $2 0
    LoopStripBuild1:
      StrCpy $3 $R1 1 $2
      StrCmp $3 "" DoneStripBuild1
      StrCmp $3 "+" 0 NextStripBuild1
      StrCpy $R1 $R1 $2
      Goto DoneStripBuild1
      NextStripBuild1:
      IntOp $2 $2 + 1
      Goto LoopStripBuild1
    DoneStripBuild1:

    # Split prerelease (-...) from $R0 -> Core0 ($R0), Pre0 ($R2)
    StrCpy $R2 ""
    StrCpy $2 0
    LoopSplitPre0:
      StrCpy $3 $R0 1 $2
      StrCmp $3 "" DoneSplitPre0
      StrCmp $3 "-" 0 NextSplitPre0
      IntOp $4 $2 + 1
      StrCpy $R2 $R0 "" $4
      StrCpy $R0 $R0 $2
      Goto DoneSplitPre0
      NextSplitPre0:
      IntOp $2 $2 + 1
      Goto LoopSplitPre0
    DoneSplitPre0:

    # Split prerelease (-...) from $R1 -> Core1 ($R1), Pre1 ($R3)
    StrCpy $R3 ""
    StrCpy $2 0
    LoopSplitPre1:
      StrCpy $3 $R1 1 $2
      StrCmp $3 "" DoneSplitPre1
      StrCmp $3 "-" 0 NextSplitPre1
      IntOp $4 $2 + 1
      StrCpy $R3 $R1 "" $4
      StrCpy $R1 $R1 $2
      Goto DoneSplitPre1
      NextSplitPre1:
      IntOp $2 $2 + 1
      Goto LoopSplitPre1
    DoneSplitPre1:

    # Parse Core0 ($R0) into Major0 ($4), Minor0 ($5), Patch0 ($6)
    StrCpy $2 0
    LoopCore0Dot1:
      StrCpy $3 $R0 1 $2
      StrCmp $3 "" CmpUnreadable
      StrCmp $3 "." FoundCore0Dot1 NextCore0Dot1
      NextCore0Dot1:
      IntOp $2 $2 + 1
      Goto LoopCore0Dot1
    FoundCore0Dot1:
      StrCpy $4 $R0 $2
      IntOp $2 $2 + 1
      StrCpy $R4 $R0 "" $2

    StrCpy $2 0
    LoopCore0Dot2:
      StrCpy $3 $R4 1 $2
      StrCmp $3 "" CmpUnreadable
      StrCmp $3 "." FoundCore0Dot2 NextCore0Dot2
      NextCore0Dot2:
      IntOp $2 $2 + 1
      Goto LoopCore0Dot2
    FoundCore0Dot2:
      StrCpy $5 $R4 $2
      IntOp $2 $2 + 1
      StrCpy $6 $R4 "" $2

    # Parse Core1 ($R1) into Major1 ($7), Minor1 ($8), Patch1 ($9)
    StrCpy $2 0
    LoopCore1Dot1:
      StrCpy $3 $R1 1 $2
      StrCmp $3 "" CmpUnreadable
      StrCmp $3 "." FoundCore1Dot1 NextCore1Dot1
      NextCore1Dot1:
      IntOp $2 $2 + 1
      Goto LoopCore1Dot1
    FoundCore1Dot1:
      StrCpy $7 $R1 $2
      IntOp $2 $2 + 1
      StrCpy $R4 $R1 "" $2

    StrCpy $2 0
    LoopCore1Dot2:
      StrCpy $3 $R4 1 $2
      StrCmp $3 "" CmpUnreadable
      StrCmp $3 "." FoundCore1Dot2 NextCore1Dot2
      NextCore1Dot2:
      IntOp $2 $2 + 1
      Goto LoopCore1Dot2
    FoundCore1Dot2:
      StrCpy $8 $R4 $2
      IntOp $2 $2 + 1
      StrCpy $9 $R4 "" $2

    # Validate that numeric parts are non-empty
    StrCmp $4 "" CmpUnreadable 0
    StrCmp $5 "" CmpUnreadable 0
    StrCmp $6 "" CmpUnreadable 0
    StrCmp $7 "" CmpUnreadable 0
    StrCmp $8 "" CmpUnreadable 0
    StrCmp $9 "" CmpUnreadable 0

    IntCmp $4 $7 0 CmpLess CmpGreater
    IntCmp $5 $8 0 CmpLess CmpGreater
    IntCmp $6 $9 0 CmpLess CmpGreater

    # Major, minor and patch are equal. Compare pre-releases
    StrCmp $R2 $R3 CmpEqual 0
    StrCmp $R2 "" CmpGreater 0 # no prerelease is newer than prerelease
    StrCmp $R3 "" CmpLess 0    # prerelease is older than no prerelease

    LoopCmpPre:
      StrCpy $2 0
      LoopId0:
        StrCpy $3 $R2 1 $2
        StrCmp $3 "" FoundEndId0
        StrCmp $3 "." FoundDotId0
        IntOp $2 $2 + 1
        Goto LoopId0
      FoundDotId0:
        StrCpy $4 $R2 $2
        IntOp $2 $2 + 1
        StrCpy $R2 $R2 "" $2
        Goto DoneId0
      FoundEndId0:
        StrCpy $4 $R2
        StrCpy $R2 ""
      DoneId0:

      StrCpy $2 0
      LoopId1:
        StrCpy $3 $R3 1 $2
        StrCmp $3 "" FoundEndId1
        StrCmp $3 "." FoundDotId1
        IntOp $2 $2 + 1
        Goto LoopId1
      FoundDotId1:
        StrCpy $7 $R3 $2
        IntOp $2 $2 + 1
        StrCpy $R3 $R3 "" $2
        Goto DoneId1
      FoundEndId1:
        StrCpy $7 $R3
        StrCpy $R3 ""
      DoneId1:

      StrCmp $4 "" CmpLess 0
      StrCmp $7 "" CmpGreater 0

      # Check if $4 is numeric
      StrCpy $2 0
      StrCpy $5 1
      LoopNum4:
        StrCpy $3 $4 1 $2
        StrCmp $3 "" DoneNum4
        ${If} $3 S< "0"
        ${OrIf} $3 S> "9"
          StrCpy $5 0
          Goto DoneNum4
        ${EndIf}
        IntOp $2 $2 + 1
        Goto LoopNum4
      DoneNum4:

      # Check if $7 is numeric
      StrCpy $2 0
      StrCpy $8 1
      LoopNum7:
        StrCpy $3 $7 1 $2
        StrCmp $3 "" DoneNum7
        ${If} $3 S< "0"
        ${OrIf} $3 S> "9"
          StrCpy $8 0
          Goto DoneNum7
        ${EndIf}
        IntOp $2 $2 + 1
        Goto LoopNum7
      DoneNum7:

      ${If} $5 == 1
      ${AndIf} $8 == 1
        IntCmp $4 $7 0 CmpLess CmpGreater
      ${ElseIf} $5 == 1
      ${AndIf} $8 == 0
        Goto CmpLess
      ${ElseIf} $5 == 0
      ${AndIf} $8 == 1
        Goto CmpGreater
      ${Else}
        StrCmp $4 $7 +3 0
        ${If} "$4" S< "$7"
          Goto CmpLess
        ${Else}
          Goto CmpGreater
        ${EndIf}
      ${EndIf}

      StrCmp $R2 "" 0 LoopCmpPre
      StrCmp $R3 "" 0 LoopCmpPre
      Goto CmpEqual

    CmpLess:
      StrCpy $0 -1
      Goto DoneCmp
    CmpEqual:
      StrCpy $0 0
      Goto DoneCmp
    CmpGreater:
      StrCpy $0 1
      Goto DoneCmp
    CmpUnreadable:
      StrCpy $0 2
      Goto DoneCmp

    DoneCmp:
    Pop $R4
    Pop $R3
    Pop $R2
    Pop $R1
    Pop $R0
    Pop $9
    Pop $8
    Pop $7
    Pop $6
    Pop $5
    Pop $4
    Pop $3
    Pop $2
    Pop $1
  FunctionEnd

  Function RecogniseExistingInstallation
    # ONE QUESTION PER RUN, whatever calls this.
    ${If} $RecogniseAsked == "1"
      Return # plant:recognise-once
    ${EndIf}
    StrCpy $RecogniseAsked "1"
    Push $0
    Push $1
    Push $R1
    Push $R2

    StrCpy $InstalledVersion ""
    StrCpy $R2 "0"

    # Check HKLM
    ReadRegStr $0 HKLM "${UNINSTALL_REGISTRY_KEY}" "DisplayVersion"
    ${If} $0 != ""
      StrCpy $InstalledVersion $0
      StrCpy $R2 "1"
    ${Else}
      ReadRegStr $0 HKLM "${INSTALL_REGISTRY_KEY}" "InstallLocation"
      ${If} $0 != ""
        StrCpy $R2 "1"
      ${EndIf}
    ${EndIf}

    # Check HKCU
    ${If} $R2 == "0"
    ${OrIf} $installMode == "CurrentUser"
      ReadRegStr $1 HKCU "${UNINSTALL_REGISTRY_KEY}" "DisplayVersion"
      ${If} $1 != ""
        StrCpy $InstalledVersion $1
        StrCpy $R2 "1"
      ${Else}
        ReadRegStr $1 HKCU "${INSTALL_REGISTRY_KEY}" "InstallLocation"
        ${If} $1 != ""
          StrCpy $R2 "1"
        ${EndIf}
      ${EndIf}
    ${EndIf}

    ${If} $hasPerMachineInstallation == "1"
    ${OrIf} $hasPerUserInstallation == "1"
      StrCpy $R2 "1"
    ${EndIf}

    ${If} $R2 == "0"
      Goto DoneRecognise
    ${EndIf}

    ${If} $InstalledVersion == ""
      StrCpy $RecogniseMsg "$(RecogniseUnreadableText)"
    ${Else}
      StrCpy $0 $InstalledVersion
      StrCpy $1 "${VERSION}"
      Call CompareSemver
      ${If} $0 == -1
        StrCpy $RecogniseMsg "$(RecogniseOlderText)"
      ${ElseIf} $0 == 0
        StrCpy $RecogniseMsg "$(RecogniseSameText)"
      ${ElseIf} $0 == 1
        StrCpy $RecogniseMsg "$(RecogniseNewerText)"
      ${Else}
        StrCpy $RecogniseMsg "$(RecogniseUnreadableText)"
      ${EndIf}
    ${EndIf}

    MessageBox MB_OKCANCEL|MB_ICONQUESTION "$RecogniseMsg" /SD IDOK IDOK Proceed IDCANCEL Cancel
    Cancel:
      Quit
    Proceed:

    DoneRecognise:
    Pop $R2
    Pop $R1
    Pop $1
    Pop $0
  FunctionEnd
!macroend

# THE SHORTCUT LEFT IN THE OTHER SCOPE, the desk's un.RemoveStaleLinks as it stands, run by a section of its own
# ahead of electron-builder's uninstall section, unless --keep-shortcuts. Inserted by customUnWelcomePage.
!macro studioStaleLinks
  Function un.RemoveStaleLinks
    Push $0
    ${If} $installMode == "all"
      ReadRegStr $0 HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
      ${If} $0 == ""
        SetShellVarContext current
        Delete "$SMPROGRAMS\${SHORTCUT_NAME}.lnk"
        Delete "$DESKTOP\${SHORTCUT_NAME}.lnk"
        SetShellVarContext all
      ${EndIf}
    ${Else}
      ReadRegStr $0 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
      ${If} $0 == ""
        SetShellVarContext all
        Delete "$SMPROGRAMS\${SHORTCUT_NAME}.lnk"
        Delete "$DESKTOP\${SHORTCUT_NAME}.lnk"
        SetShellVarContext current
      ${EndIf}
    ${EndIf}
    Pop $0
  FunctionEnd
  Section "un.StaleLinks"
    ${IfNot} ${isKeepShortcuts}
      Call un.RemoveStaleLinks
    ${EndIf}
  SectionEnd
!macroend

!ifndef BUILD_UNINSTALLER
Var InstalledVersion
Var RecogniseMsg
Var RecogniseAsked
# THE FINISH PAGE'S TEXT, Modern UI's own unless etiudaOldUserCopy met a per-user copy. With the Run box on the page
# the label is 195 by 40 dialog units, about five lines, so the case's text replaces the whole of it rather than adding.
Var etiudaFinishText
!define MUI_FINISHPAGE_TEXT "$etiudaFinishText"
!endif

Var TurnFrame
Var TurnKey
Var TurnNext
Var TurnHwnd
Var TurnKind
Var TurnBmp
Var TurnReady
# The uninstaller's own: the installer pass never reads them, and makensis's warning 6001 for an unused variable
# is an error in this build.
!ifdef BUILD_UNINSTALLER
Var UnRemoveData
Var UnRemoveCheckbox
Var UnRemoveLabel
!endif

# THE PER-USER COPY'S UNINSTALLER RUN AS ITS OWN ACCOUNT (board 995), the desk's three macros from the pin's
# shell/installer.nsh as they stand: the five-hook cut stops before them, so this file carries its own copy, skipped once
# the cut defines them. tools/patch-nsis.cjs (fix 6) inserts etiudaOldUserCopy where the template ran that uninstaller
# elevated; tests/install-plan-selftest.mjs 14a holds it.
!ifmacrondef etiudaOldUserCopy
# RUN AS THE PERSON, from an elevated instance: the macro named by RUN runs in the unelevated instance that started this
# one, and only the registers cross, both ways. $R9 reads "unreached" after unless RUN set it, so a caller can tell that
# nothing ran: no such instance (an installer started elevated has none), or it could not be reached.
!define ETIUDA_AS_USER_N 0
!macro etiudaAsUser RUN
  !define /redef /math ETIUDA_AS_USER_N ${ETIUDA_AS_USER_N} + 1
  StrCpy $R9 "unreached"
  ${If} ${UAC_IsInnerInstance}
    Goto etiudaAsUserCall${ETIUDA_AS_USER_N}
  etiudaAsUserRun${ETIUDA_AS_USER_N}:
    !insertmacro ${RUN}
    Return
  etiudaAsUserCall${ETIUDA_AS_USER_N}:
    !insertmacro UAC_AsUser_Call Label etiudaAsUserRun${ETIUDA_AS_USER_N} ${UAC_SYNCREGISTERS}
  ${EndIf}
!macroend

# A COPY INSTALLED FOR ONE ACCOUNT, met by an all-users install, is removed by its own uninstaller run as that account
# (etiudaAsUser): the file, and the HKCU key naming it, are that account's to write. The error flag rides back in $R9;
# $appExe goes over in $R8.
!macro etiudaOldUserCopyRun
  StrCpy $appExe $R8
  InitPluginsDir
  !insertmacro uninstallOldVersion HKEY_CURRENT_USER
  StrCpy $R9 "ran"
  ${If} ${Errors}
    StrCpy $R9 "failed"
  ${EndIf}
!macroend
!macro etiudaOldUserCopy
  ${If} ${UAC_IsInnerInstance}
    Push $R8
    Push $R9
    StrCpy $R8 $appExe
    !insertmacro etiudaAsUser etiudaOldUserCopyRun
    ${If} $R9 == "unreached"
      Pop $R9
      Pop $R8
    ${Else}
      ClearErrors
      ${If} $R9 == "failed"
        SetErrors
      ${EndIf}
      Pop $R9
      Pop $R8
      !insertmacro handleUninstallResult HKEY_CURRENT_USER
    ${EndIf}
  ${Else}
    # An installer started elevated has no unelevated instance, and this one never runs that file: wherever HKCU names an
    # uninstaller, as uninstallOldVersion would read it, it is left to run as that account at its next sign-in (RunOnce, HKCU's
    # own), with that account's ordinary rights: /currentuser keeps it per-user, so it never elevates; /KEEP_APP_DATA keeps the
    # data the two copies share. The finish page says so. The engine's mend of 22d3af9c, as the cut carries it from that pin.
    Push $R9
    ReadRegStr $R9 HKCU "${UNINSTALL_REGISTRY_KEY}" UninstallString
    !ifdef UNINSTALL_REGISTRY_KEY_2
      ${If} $R9 == ""
        ReadRegStr $R9 HKCU "${UNINSTALL_REGISTRY_KEY_2}" UninstallString
      ${EndIf}
    !endif
    ${If} $R9 != ""
      WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\RunOnce" "${APP_ID}.per-user-copy" "$R9 /currentuser /S /KEEP_APP_DATA"
      StrCpy $etiudaFinishText "$(etiudaOldCopyGoes)"
    ${EndIf}
    Pop $R9
  ${EndIf}
!macroend
!endif

!macro TurnEmit UN
  !ifdef TURN_PFX
    !undef TURN_PFX
  !endif
  !searchreplace TURN_PFX "${UN}" "x" ""

  Function ${TURN_PFX}TurnPrepare
    ${If} $TurnReady == "1"
      Return
    ${EndIf}
    StrCpy $TurnReady "1"
    StrCpy $TurnFrame 0
    StrCpy $TurnKey ""
    StrCpy $TurnNext ""
    StrCpy $TurnHwnd 0
    StrCpy $TurnKind ""
    StrCpy $TurnBmp 0
    ${If} ${FileExists} "$PLUGINSDIR\turn\sidebar-000.bmp"
      Push $0
      GetFunctionAddress $0 ${TURN_PFX}TurnTick
      nsDialogs::CreateTimer $0 ${TURN_INTERVAL}
      Pop $0
    ${EndIf}
  FunctionEnd

  # NO TICK WHILE A SECTION RUNS: NSIS runs the sections on a second thread, and its script engine is not safe on two threads at
  # once (one stack, one set of registers, one plug-in state). The files page stops the timer and shows the still before that
  # thread starts, and the timer starts again only once the work is done (customPageAfterChangeDir, customUninstallPage, below).
  Function ${TURN_PFX}TurnStill
    Push $0
    StrCpy $TurnReady "0"
    GetFunctionAddress $0 ${TURN_PFX}TurnTick
    nsDialogs::KillTimer $0 # plant:turn-still-kills
    Pop $0
    Call ${TURN_PFX}TurnPage
    ${If} $TurnKind != ""
      StrCpy $TurnKey $TurnNext
      StrCpy $TurnFrame 0
      Call ${TURN_PFX}TurnPaint
    ${EndIf}
  FunctionEnd

  Function ${TURN_PFX}TurnResume
    ${If} $TurnReady != "1"
    ${AndIf} ${FileExists} "$PLUGINSDIR\turn\sidebar-000.bmp"
      StrCpy $TurnReady "1"
      Push $0
      GetFunctionAddress $0 ${TURN_PFX}TurnTick
      nsDialogs::CreateTimer $0 ${TURN_INTERVAL}
      Pop $0
    ${EndIf}
  FunctionEnd

  Function ${TURN_PFX}TurnPage
    Push $0
    Push $1
    Push $2
    Push $3
    Push $4
    StrCpy $TurnKind ""
    StrCpy $TurnHwnd 0
    StrCpy $TurnNext ""
    GetDlgItem $0 $HWNDPARENT 1046
    System::Call 'user32::IsWindowVisible(p r0) i.r1'
    ${If} $1 != 0
      StrCpy $TurnKind "h"
      StrCpy $TurnHwnd $0
      GetDlgItem $0 $HWNDPARENT 1037
      System::Call 'user32::GetWindowText(p r0, t.r2, i 220)'
      StrCpy $TurnNext "h:$2"
    ${Else}
      StrCpy $4 $HWNDPARENT
      StrCpy $0 0
      ${Do}
        System::Call 'user32::FindWindowEx(p r4, p r0, t "#32770", p 0) p.r0'
        ${If} $0 == 0
          ${ExitDo}
        ${EndIf}
        StrCpy $1 0
        ${Do}
          System::Call 'user32::FindWindowEx(p r0, p r1, t "Static", p 0) p.r1'
          ${If} $1 == 0
            ${ExitDo}
          ${EndIf}
          System::Call 'user32::GetWindowLong(p r1, i -16) i.r3'
          IntOp $3 $3 & 31
          ${If} $3 == 14
            System::Call 'user32::IsWindowVisible(p r1) i.r3'
            ${If} $3 != 0
              StrCpy $TurnKind "s"
              StrCpy $TurnHwnd $1
              System::Call 'user32::FindWindowEx(p r0, p r1, t "Static", p 0) p.r3'
              System::Call 'user32::GetWindowText(p r3, t.r2, i 220)'
              StrCpy $TurnNext "s:$2"
              ${ExitDo}
            ${EndIf}
          ${EndIf}
        ${Loop}
        ${If} $TurnKind != ""
          ${ExitDo}
        ${EndIf}
      ${Loop}
    ${EndIf}
    Pop $4
    Pop $3
    Pop $2
    Pop $1
    Pop $0
  FunctionEnd

  Function ${TURN_PFX}TurnPaint
    Push $0
    Push $1
    Push $2
    Push $3
    Push $4
    Push $5
    Push $6
    Push $R0
    StrCpy $R0 $TurnHwnd
    System::Call 'user32::GetClientRect(pR0,@r0)'
    System::Call '*$0(i,i,i.r1,i.r2)'
    ${If} $1 != 0
    ${AndIf} $2 != 0
      IntFmt $3 "%03d" $TurnFrame
      ${If} $TurnKind == "h"
        StrCpy $4 "$PLUGINSDIR\turn\header-$3.bmp"
      ${Else}
        StrCpy $4 "$PLUGINSDIR\turn\sidebar-$3.bmp"
      ${EndIf}
      ${If} ${FileExists} $4
        System::Call 'user32::LoadImage(p 0, t r4, i 0, i r1, i r2, i 0x10) p.r5'
        ${If} $5 != 0
          SendMessage $TurnHwnd 0x172 0 $5 $6
          ${If} $TurnBmp != 0
          ${AndIf} $6 == $TurnBmp
            StrCpy $1 $TurnBmp
            System::Call 'gdi32::DeleteObject(p r1)'
          ${EndIf}
          StrCpy $TurnBmp $5
        ${EndIf}
      ${EndIf}
    ${EndIf}
    Pop $R0
    Pop $6
    Pop $5
    Pop $4
    Pop $3
    Pop $2
    Pop $1
    Pop $0
  FunctionEnd

  Function ${TURN_PFX}TurnTick
    # A tick already queued when TurnStill ran does nothing.
    ${If} $TurnReady != "1"
      Return # plant:turn-tick-stopped
    ${EndIf}
    Push $0
    Push $1
    Call ${TURN_PFX}TurnPage
    ${If} $TurnKind != ""
      ${If} $TurnNext != $TurnKey
        ${If} $TurnBmp != 0
          StrCpy $1 $TurnBmp
          System::Call 'gdi32::DeleteObject(p r1)'
          StrCpy $TurnBmp 0
        ${EndIf}
        StrCpy $TurnKey $TurnNext
        StrCpy $TurnFrame 0
      ${Else}
        IntOp $TurnFrame $TurnFrame + 1
        ${If} $TurnFrame >= ${TURN_FRAMES}
          StrCpy $TurnFrame 0
        ${EndIf}
      ${EndIf}
      Call ${TURN_PFX}TurnPaint
    ${EndIf}
    Pop $1
    Pop $0
  FunctionEnd

  !if "${TURN_PFX}" == "un."
    Function un.onGUIEnd
  !else
    Function .onGUIEnd
  !endif
    Push $0
    Push $1
    GetFunctionAddress $0 ${TURN_PFX}TurnTick
    nsDialogs::KillTimer $0
    ${If} $TurnBmp != 0
      StrCpy $1 $TurnBmp
      System::Call 'gdi32::DeleteObject(p r1)'
      StrCpy $TurnBmp 0
    ${EndIf}
    Pop $1
    Pop $0
  FunctionEnd
  !undef TURN_PFX
!macroend

# One LangString per language the installer loads, app-builder-lib's bundledLanguages.
# 1045 is Polish. Every other language gets the English, as the licence page does.
# THE PINNED HOOKS' OWN SENTENCES, in Studio's words: etiudaOldCopyLeft for a pin before engine 22d3af9c, whose etiudaOldUserCopy
# leaves the per-user copy registered; etiudaOldCopyGoes and etiudaFolderNotOurs for a pin from it on, whose etiudaOldUserCopy
# leaves that copy to its own uninstaller at the next sign-in and whose etiudaStageBegin refuses a folder holding other files with
# exit 2. A string no compiled line names costs nothing, so all three stand until the pin is past 22d3af9c; makensis stops on a
# named one that is missing. tests/studio-installer-mends.mjs sm3 holds every etiuda* string the cut names.
# A language added upstream and missing here is warning 6030, and -WX fails the build.
!macro TurnLang ID
  !if ${ID} == 1045
    !ifndef BUILD_UNINSTALLER
    LangString RecogniseOlderText ${ID} "Na tym komputerze jest już program ${PRODUCT_NAME} w wersji $InstalledVersion, a ten instalator zawiera nowszą wersję ${VERSION}. Zaktualizować do wersji ${VERSION}?$\r$\n$\r$\nDane na tym komputerze i licencja zostają bez zmian."
    LangString RecogniseSameText ${ID} "Na tym komputerze jest już program ${PRODUCT_NAME} w wersji $InstalledVersion, tej samej co w instalatorze. Zainstalować go ponownie?$\r$\n$\r$\nDane na tym komputerze i licencja zostają bez zmian."
    LangString RecogniseNewerText ${ID} "Na tym komputerze jest już program ${PRODUCT_NAME} w wersji $InstalledVersion, nowszej niż wersja ${VERSION} z tego instalatora. Zainstalować w jej miejsce wersję ${VERSION}?$\r$\n$\r$\nDane na tym komputerze i licencja zostają bez zmian."
    LangString RecogniseUnreadableText ${ID} "Na tym komputerze jest już program ${PRODUCT_NAME}, ale nie da się odczytać jego wersji. Zainstalować w jego miejsce wersję ${VERSION}?$\r$\n$\r$\nDane na tym komputerze i licencja zostają bez zmian."
    LangString etiudaOldCopyLeft ${ID} "Etiuda Studio jest zainstalowana. Na tym komputerze jest też inna kopia, zainstalowana tylko dla jednego konta. Wszystko jest w porządku: można ją usunąć na tym koncie, z listy zainstalowanych aplikacji w Windows."
    LangString etiudaOldCopyGoes ${ID} "Program Etiuda Studio jest zainstalowany dla wszystkich użytkowników. Wcześniejsza kopia tylko dla tego konta zostanie usunięta przy jego następnym logowaniu do Windows; dane konta zostają." ; the copywriter's words
    LangString etiudaFolderNotOurs ${ID} "Nie zainstalowano programu Etiuda Studio: w folderze $etiudaBase są już inne pliki. Program instaluje się tylko w pustym folderze albo w miejsce swojej wcześniejszej kopii, więc wystarczy uruchomić instalator ponownie i wybrać inny folder." ; the copywriter's words
    !endif
    LangString etiudaSetupNotFinished ${ID} "Instalacja programu ${PRODUCT_NAME} nie została ukończona. Pomóc może ponowne uruchomienie instalatora; jeśli znów się zatrzyma, ten kod pomoże ustalić przyczynę: $2."
    LangString TurnWelcomeTitle ${ID} "Witamy w Etiuda Studio"
    LangString TurnWelcomeText ${ID} "W Etiuda Studio katalog zespołu powstaje, jest sprawdzany i trafia do stanowisk.$\r$\n$\r$\nEtiudę Studio można zainstalować dla tego konta Windows, bez uprawnień administratora w folderze proponowanym przez instalator, albo dla wszystkich użytkowników tego komputera, co ich wymaga. Jeśli Etiuda Studio jest otwarta, instalator najpierw poprosi o jej zamknięcie.$\r$\n$\r$\nAby kontynuować, wystarczy nacisnąć Dalej."
    LangString TurnUnWelcomeTitle ${ID} "Usuwanie: Etiuda Studio"
    LangString TurnUnWelcomeText ${ID} "Program Etiuda Studio zostanie usunięty z tego komputera. Jego katalogi i ustawienia zostają na miejscu, więc po ponownej instalacji będą takie jak wcześniej.$\r$\n$\r$\nAby kontynuować, wystarczy nacisnąć Dalej."
    LangString etiudaUninstallLeft ${ID} "Część plików programu ${PRODUCT_NAME} jest wciąż w użyciu, więc folder $INSTDIR na razie zostaje. Po ponownym uruchomieniu komputera wystarczy jeszcze raz usunąć program ${PRODUCT_NAME} w Ustawieniach systemu Windows." ; placeholder: Claudette
    LangString RemoveDataCheckbox ${ID} "Usuń także dane z tego komputera"
    LangString RemoveDataSubtext ${ID} "Usuwa również pamięć podręczną Etiudy Studio z tego komputera. Zostają: licencja i okres próbny, klucz podpisu, zespoły, miejsce biblioteki, język i motyw oraz foldery katalogów."
  !else
    !ifndef BUILD_UNINSTALLER
    LangString RecogniseOlderText ${ID} "${PRODUCT_NAME} $InstalledVersion is installed on this computer, and this installer holds ${VERSION}, which is newer. Update to ${VERSION}?$\r$\n$\r$\nData on this computer and the licence stay as they are."
    LangString RecogniseSameText ${ID} "${PRODUCT_NAME} $InstalledVersion is already installed on this computer, the same version as this installer. Reinstall it?$\r$\n$\r$\nData on this computer and the licence stay as they are."
    LangString RecogniseNewerText ${ID} "${PRODUCT_NAME} $InstalledVersion is installed on this computer, which is newer than this installer's ${VERSION}. Reinstall ${VERSION} in its place?$\r$\n$\r$\nData on this computer and the licence stay as they are."
    LangString RecogniseUnreadableText ${ID} "${PRODUCT_NAME} is already installed on this computer, but its version cannot be read. Reinstall ${VERSION} in its place?$\r$\n$\r$\nData on this computer and the licence stay as they are."
    LangString etiudaOldCopyLeft ${ID} "Etiuda Studio is installed. Another copy, installed for one account only, is also on this computer. Nothing is wrong: it can be removed in that account, from the list of installed apps in Windows."
    LangString etiudaOldCopyGoes ${ID} "Etiuda Studio is installed for all users. The copy installed earlier for this account alone is removed at its next Windows sign-in; the account's data stays." ; the copywriter's words
    LangString etiudaFolderNotOurs ${ID} "Etiuda Studio was not installed: $etiudaBase already holds other files. It installs only into an empty folder or over an earlier copy of itself, so run the installer again and choose another folder." ; the copywriter's words
    !endif
    LangString etiudaSetupNotFinished ${ID} "The installation of ${PRODUCT_NAME} did not finish. Running the installer again may help; if it stops again, this code helps find the cause: $2."
    LangString TurnWelcomeTitle ${ID} "Welcome to Etiuda Studio"
    LangString TurnWelcomeText ${ID} "Etiuda Studio is where a team's catalog is written, checked and published to its desks.$\r$\n$\r$\nEtiuda Studio can be installed for this Windows account, with no administrator rights in the folder Setup suggests, or for everyone on this computer, which needs them. If Etiuda Studio is open, Setup asks for it to be closed first.$\r$\n$\r$\nPress Next to go on."
    LangString TurnUnWelcomeTitle ${ID} "Removing Etiuda Studio"
    LangString TurnUnWelcomeText ${ID} "This removes Etiuda Studio from this computer. Its catalogs and settings stay where they are, so installing it again finds them as they were.$\r$\n$\r$\nPress Next to go on."
    LangString etiudaUninstallLeft ${ID} "Some of ${PRODUCT_NAME}'s files are still in use, so the folder $INSTDIR stays for now. Once the computer has restarted, removing ${PRODUCT_NAME} again in Windows Settings finishes the job." ; placeholder: Claudette
    LangString RemoveDataCheckbox ${ID} "Remove my data"
    LangString RemoveDataSubtext ${ID} "Also removes Etiuda Studio's caches on this computer. What stays: the licence and the trial, the signing key, the teams, the library's place, the language and theme, and the catalogs' own folders."
  !endif
!macroend
!insertmacro TurnLang 1033
!insertmacro TurnLang 1031
!insertmacro TurnLang 1036
!insertmacro TurnLang 3082
!insertmacro TurnLang 2052
!insertmacro TurnLang 1028
!insertmacro TurnLang 1041
!insertmacro TurnLang 1042
!insertmacro TurnLang 1040
!insertmacro TurnLang 1043
!insertmacro TurnLang 1030
!insertmacro TurnLang 1053
!insertmacro TurnLang 1044
!insertmacro TurnLang 1035
!insertmacro TurnLang 1049
!insertmacro TurnLang 2070
!insertmacro TurnLang 1046
!insertmacro TurnLang 1045
!insertmacro TurnLang 1058
!insertmacro TurnLang 1029
!insertmacro TurnLang 1051
!insertmacro TurnLang 1038
!insertmacro TurnLang 1025
!insertmacro TurnLang 1055
!insertmacro TurnLang 1054
!insertmacro TurnLang 1066

!macro customWelcomePage
  !insertmacro studioRecognition
  Function TurnGuiInit
    # skipLicenseIfInner, in the pin's customHeader, presses Next twice under UAC_IsInnerInstance
    # (this welcome page, then the licence) and calls TurnPrepare. A press here would also skip
    # the install-mode page. TurnPrepare returns at once when the pin has already started it.
    ${If} ${UAC_IsInnerInstance}
      BringToFront
    ${EndIf}
    Call skipLicenseIfInner
    Call TurnPrepare
  FunctionEnd
  !insertmacro TurnEmit "x"
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW TurnWelcomeShow
  !insertmacro MUI_PAGE_WELCOME
  Function TurnWelcomeShow
    SendMessage $mui.WelcomePage.Title ${WM_SETTEXT} 0 "STR:$(TurnWelcomeTitle)"
    SendMessage $mui.WelcomePage.Text ${WM_SETTEXT} 0 "STR:$(TurnWelcomeText)"
  FunctionEnd
!macroend

!macro customUnWelcomePage
  !insertmacro studioStaleLinks
  Function TurnGuiInit
    # The uninstaller compile still inserts the pin's customHeader, which defines
    # skipLicenseIfInner. Nothing on this pass calls it: the welcome page is shown.
    # Taking the address keeps the function referenced, so makensis does not warn 6010,
    # which electron-builder treats as an error. The function is not called.
    Push $0
    GetFunctionAddress $0 skipLicenseIfInner
    Pop $0
  FunctionEnd
  Function un.TurnGuiInit
    Call un.TurnPrepare
  FunctionEnd
  !insertmacro TurnEmit "un."
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW un.TurnUnWelcomeShow
  !define MUI_PAGE_CUSTOMFUNCTION_LEAVE un.TurnUnWelcomeLeave
  !insertmacro MUI_UNPAGE_WELCOME
  Function un.TurnUnWelcomeShow
    SendMessage $mui.WelcomePage.Title ${WM_SETTEXT} 0 "STR:$(TurnUnWelcomeTitle)"
    SendMessage $mui.WelcomePage.Text ${WM_SETTEXT} 0 "STR:$(TurnUnWelcomeText)"
    # THE BOX AND ITS NOTE STAND IN THE TEXT COLUMN, made the way MUI2's own finish page makes its checkboxes: nsDialogs controls on
    # the welcome dialog, in DIALOG UNITS, on the page's own colours. They were raw CreateWindowEx windows in PIXELS (120, 155,
    # 320 wide) on whichever "#32770" FindWindow met first, and the box took no click at all: 120 px is 80u, inside the side picture (0u to 109u), while the column starts at 120u; the
    # note had no width set against it and no colours, so it showed grey and cut. tests/uninstaller-page.mjs holds the rectangles.
    # The welcome text label is 195u by 130u from 45u and would run under them, so it is shortened to 60u (its six lines at most),
    # the rectangle given in units to MapDialogRect and moved with MoveWindow. The box then stands at 108u, its note at 124u to 184u,
    # inside the page's 193u.
    Push $0
    Push $1
    Push $2
    Push $3
    Push $4
    System::Call '*(i 120, i 45, i 315, i 105) p .r1'
    System::Call 'user32::MapDialogRect(p $mui.WelcomePage, p r1)'
    System::Call '*$1(i .r2, i .r3, i .r4, i .r0)'
    System::Free $1
    IntOp $4 $4 - $2
    IntOp $0 $0 - $3
    System::Call 'user32::MoveWindow(p $mui.WelcomePage.Text, i r2, i r3, i r4, i r0, i 1)'
    ${NSD_CreateCheckbox} 120u 108u 195u 12u "$(RemoveDataCheckbox)"
    Pop $UnRemoveCheckbox
    SetCtlColors $UnRemoveCheckbox "${MUI_TEXTCOLOR}" "${MUI_BGCOLOR}"
    ${NSD_CreateLabel} 120u 124u 195u 60u "$(RemoveDataSubtext)"
    Pop $UnRemoveLabel
    SetCtlColors $UnRemoveLabel "${MUI_TEXTCOLOR}" "${MUI_BGCOLOR}"
    Pop $4
    Pop $3
    Pop $2
    Pop $1
    Pop $0
  FunctionEnd
  Function un.TurnUnWelcomeLeave
    ${If} $UnRemoveCheckbox != 0
      SendMessage $UnRemoveCheckbox 0x00F0 0 0 $0 # BM_GETCHECK
      ${If} $0 == 1
        StrCpy $UnRemoveData "1"
      ${Else}
        StrCpy $UnRemoveData "0"
      ${EndIf}
    ${EndIf}
    # The last page before the uninstall's files page, which the template's install-mode page (a custom page, no section) alone
    # stands between: the turning stops here, as the installer's does on its files page.
    Call un.TurnStill # plant:turn-unfiles-still
  FunctionEnd
  !ifdef BUILD_UNINSTALLER
    !insertmacro studioRemoveUserDataSection
  !endif
!macroend

# THE FILES PAGE RUNS WITH THE TURNING STILL (TurnStill, in TurnEmit). electron-builder inserts the first macro straight before
# MUI_PAGE_INSTFILES and the second between MUI_UNPAGE_INSTFILES and MUI_UNPAGE_FINISH, so each define is that page's own.
!macro customPageAfterChangeDir
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW TurnStill # plant:turn-files-still
  !define MUI_PAGE_CUSTOMFUNCTION_LEAVE TurnResume # plant:turn-files-resume
!macroend
!macro customUninstallPage
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW un.TurnResume # plant:turn-unfinish-resume
!macroend

# THE REMOVE MY DATA SECTION is declared from customUnWelcomePage, not here: this file is included at the very top of
# the script, before the templates bring LogicLib and declare $installMode, so a section written here does not
# compile (makensis: Invalid command ${IfNot}). customUnWelcomePage expands after them, at the top level, and still
# ahead of the templates' own uninstall section, so this section runs first, as before.
# THE BUILD'S OWN FOLDER AND NO OTHER: ${APP_PACKAGE_NAME} is the package name electron-builder was given (etiuda-studio; etiuda-studio-qa for the
# test build, tools/test-identity.cjs), as the desk's data step names it, so a test build's uninstaller cannot remove a shipped Studio's data
# tests/uninstaller-page.mjs uw5 holds it; tests/reset-studio.mjs rs9 holds that it is the package name.
!macro studioRemoveUserDataSection
Section "un.RemoveUserData"
  ${IfNot} ${isUpdated} /* plant:uninstaller-update-guard */
    ${If} $UnRemoveData == "1"
      ${If} $installMode == "all"
        SetShellVarContext current
      ${EndIf}
      FindFirst $R1 $R2 "$APPDATA\${APP_PACKAGE_NAME}\*.*"
      ${Do}
        StrCmp $R2 "" 0 +2
        ${ExitDo}
        ${If} $R2 != "."
        ${AndIf} $R2 != ".."
          StrCpy $R3 $R2 11
          StrCpy $R4 $R2 17
          # Kept with the signing key: the licence files, the teams and their keys, the revision floor,
          # Local State, relay, folder-mirror, and studio.json (the same set Reset Studio keeps, shell/main.js RESET_KEEP_NAMES).
          ${If} $R3 != "signing-key" /* plant:uninstaller-keep-key */
          ${AndIf} $R4 != "etiuda-studio-key"
          ${AndIf} $R2 != "etiuda-studio-license.js" /* plant:uninstaller-one-list */
          ${AndIf} $R2 != "licence-service.json"
          ${AndIf} $R2 != "etiuda-studio-revoked.json"
          ${AndIf} $R2 != "etiuda-studio-revoked-kept.json"
          ${AndIf} $R2 != "relay-grant.json"
          ${AndIf} $R2 != "teams.json"
          ${AndIf} $R2 != "team-revs.json"
          ${AndIf} $R2 != "member-key.json"
          ${AndIf} $R2 != "Local State"
          ${AndIf} $R2 != "relay"
          ${AndIf} $R2 != "folder-mirror"
          ${AndIf} $R2 != "studio.json"
            ${If} ${FileExists} "$APPDATA\${APP_PACKAGE_NAME}\$R2\*.*"
              # The walk, not RMDir /r, which follows a junction into its target: the pin's un.etiudaRemoveTree.
              Push "$APPDATA\${APP_PACKAGE_NAME}\$R2"
              Call un.etiudaRemoveTree
            ${Else}
              Delete "$APPDATA\${APP_PACKAGE_NAME}\$R2"
            ${EndIf}
          ${EndIf}
        ${EndIf}
        FindNext $R1 $R2
      ${Loop}
      FindClose $R1
      # The data step switched an all-users uninstall to the current user. Put that
      # context back before electron-builder's uninstall section writes the registry
      # and the shortcuts, or the machine registration and the all-users shortcuts stay.
      ${If} $installMode == "all"
        SetShellVarContext all
      ${EndIf}
    ${EndIf}
  ${EndIf}
SectionEnd
!macroend
!endif

# The folder page's warning for an all-users install into a folder ordinary users can change: the desk's
# shell/installer/allusers-folder.nsh byte for byte, its macros only, which tools/patch-nsis.cjs (fix 5b) inserts before the
# page. The cut does not carry it, so the copy is Studio's, held to the pin's by tests/allusers-folder.mjs af8; the guard keeps one
# should the pinned hooks bring one.
!ifmacrondef etiudaFolderCheck
  !include /CHARSET=UTF8 "${PROJECT_DIR_BS}\packaging\installer\allusers-folder.nsh"
!endif
