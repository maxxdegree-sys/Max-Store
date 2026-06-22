@echo off
cd /d "%~dp0"
echo ==================================================
echo   Uploading Al Rafiq Shopping Centre to GitHub
echo ==================================================
echo.
git config user.name "Maaz19998"
git config user.email "Maaz19998@users.noreply.github.com"
git init
git add -A
git commit -m "Al Rafiq Shopping Centre"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/Maaz19998/al-rafiq.git
git push -u origin main
echo.
echo ==================================================
echo   If there are NO red errors above, your code is
echo   now on GitHub. Tell Claude it is done.
echo   (If a GitHub login window popped up, click to
echo    authorize, then this will finish.)
echo ==================================================
pause
