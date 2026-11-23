@echo off
rem SIGN IN AGAINST STAGING OR THE LAB, FROM THIS DEVELOPMENT TREE: starts this tree's Studio (electron ., never the installed app,
rem which ignores the file) with ETIUDA_SIGNIN_LAB set to the file named by the argument, for that one start (src/signin-lab.cjs:
rem the client ids, the licence service, the lab's provider and root it may name). Google's client secret, where wanted, comes in
rem the same start's environment as ETIUDA_GOOGLE_CLIENT_SECRET, handed to it by the office's google-signin-keep.py, never a file
rem here. Never packaged: the files list in electron-builder.js holds no tools/. It waits until this Studio is closed.
rem     tools\signin-staging.cmd <lab file>
setlocal
set "TREE=%~dp0.."
if "%~1"=="" echo Name the lab file: tools\signin-staging.cmd ^<file^>
if "%~1"=="" exit /b 1
if not exist "%~f1" echo No file at %~f1.
if not exist "%~f1" exit /b 1
if not exist "%TREE%\node_modules\.bin\electron.cmd" echo This tree has no node_modules\.bin\electron.cmd; run npm install here first.
if not exist "%TREE%\node_modules\.bin\electron.cmd" exit /b 1
if not exist "%TREE%\engine\pinned" echo This tree has no pinned engine; run node tools\engine-fetch.mjs here first.
if not exist "%TREE%\engine\pinned" exit /b 1
set "OPEN="
tasklist /fi "imagename eq Etiuda Studio.exe" /nh 2>nul | find /i "Etiuda Studio.exe" >nul && set "OPEN=1"
if defined OPEN echo The installed Etiuda Studio is open, and this start would only bring it forward. Close it, then run this again.
if defined OPEN exit /b 1
set "ETIUDA_SIGNIN_LAB=%~f1"
cd /d "%TREE%"
call "%TREE%\node_modules\.bin\electron.cmd" .
endlocal
