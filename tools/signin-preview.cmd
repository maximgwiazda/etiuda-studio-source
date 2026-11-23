@echo off
rem THE SIGN-IN PREVIEW IN ONE DOUBLE-CLICK: starts the installed Etiuda Studio with ETIUDA_SIGNIN_PREVIEW=1 set for that one start
rem (shell/main.js signInOffer), from its default per-user place, else its default all-users place. Never packaged: the files list
rem in electron-builder.js holds no tools/ (tests/sign-in.mjs si52). With --where it prints the program it would start, and starts nothing.
setlocal
set "EXE=%LOCALAPPDATA%\Programs\Etiuda Studio\Etiuda Studio.exe"
if not exist "%EXE%" set "EXE=%ProgramFiles%\Etiuda Studio\Etiuda Studio.exe"
if not exist "%EXE%" echo Etiuda Studio was not found in %LOCALAPPDATA%\Programs\Etiuda Studio or in %ProgramFiles%\Etiuda Studio.
if not exist "%EXE%" if /i not "%~1"=="--where" pause
if not exist "%EXE%" exit /b 1
if /i "%~1"=="--where" echo %EXE%
if /i "%~1"=="--where" exit /b 0
set "OPEN="
tasklist /fi "imagename eq Etiuda Studio.exe" /nh 2>nul | find /i "Etiuda Studio.exe" >nul && set "OPEN=1"
if defined OPEN echo Etiuda Studio is open already, and a second start only brings it forward without the preview. Close it, then run this again.
if defined OPEN pause
if defined OPEN exit /b 1
set "ETIUDA_SIGNIN_PREVIEW=1"
start "" "%EXE%"
endlocal
