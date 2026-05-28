@echo off
chcp 65001 >nul
echo.
echo =========================================
echo   XPulse Analytics - 一鍵部署到 Vercel
echo =========================================
echo.
echo 網站：https://x-analytics-dashboard-one.vercel.app
echo Repo：https://github.com/cocoooowang1230/x-analytics-dashboard
echo.

REM 加入所有改動
git add .

REM 顯示改動狀態
git status --short

echo.
set /p msg="輸入更新說明 (直接 Enter = 使用預設): "
if "%msg%"=="" set msg=update: dashboard improvements

REM Commit
git commit -m "%msg%"

echo.
echo 推送到 GitHub（Vercel 會自動部署）...
git push origin master

echo.
echo ✅ 完成！Vercel 正在自動部署中...
echo 🌐 約 30 秒後可在此查看：
echo    https://x-analytics-dashboard-one.vercel.app
echo.
echo 📊 Vercel 部署狀態：
echo    https://vercel.com/cocos-projects-676b27b0/x-analytics-dashboard
echo.
pause
