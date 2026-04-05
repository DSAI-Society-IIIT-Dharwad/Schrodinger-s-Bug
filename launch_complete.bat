@echo off
setlocal

:: 1. Detect SCRIPT_DIR
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo ==========================================
:: 🚀 DEFINITIVE TERMINAL LAUNCHER
:: ==========================================

:: 2. Launch Backend & ROS2 in WSL (in a separate window)
echo [SYS] Dispatching ROS2 + PPO Node [WSL Engine]...
start "WSL Engine [DRL + ROS2]" wsl -u sree bash -c "source /opt/ros/humble/setup.bash && export TURTLEBOT3_MODEL=burger && export DISPLAY=$(grep nameserver /etc/resolv.conf | awk '{print $2}'):0 && export LIBGL_ALWAYS_SOFTWARE=1 && export GALLIUM_DRIVER=llvmpipe && export QT_X11_NO_MITSHM=1 && export mesa_GL_VERSION_OVERRIDE=3.3 && bash launch_system_wsl.sh"

:: Wait for WSL Backend to start
timeout /t 5 /nobreak > nul

:: 3. Launch Frontend on Windows (using confirmed Node installation)
echo [HWI] Dispatching Premium Dashboard [Windows Native]...
if exist "frontend" (
    cd frontend
    if not exist "node_modules" (
        echo [HWI] First-time setup: Installing React dependencies...
        npm install
    )
    start "Neural Pathfinder [HWI DASHBOARD]" npm run dev
) else (
    echo [ERROR] Frontend directory NOT found!
)

echo ==========================================
:: ✅ SYSTEM IGNITION COMPLETE
:: ==========================================
pause
