@echo off
echo =======================================
echo    PARDOS CHICKEN - Setup Inicial
echo =======================================
echo.

REM Verificar si Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker no esta instalado
    echo Por favor instala Docker desde: https://www.docker.com/get-started
    pause
    exit /b 1
)

REM Verificar si Docker Compose está instalado
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker Compose no esta instalado
    echo Por favor instala Docker Compose
    pause
    exit /b 1
)

echo [OK] Docker esta instalado
echo [OK] Docker Compose esta instalado
echo.

echo Construyendo contenedor Docker...
docker-compose build

if %errorlevel% equ 0 (
    echo.
    echo [OK] Contenedor construido exitosamente!
    echo.
    echo Levantando la aplicacion...
    docker-compose up -d
    
    if %errorlevel% equ 0 (
        echo.
        echo [OK] Aplicacion iniciada exitosamente!
        echo.
        echo La aplicacion esta corriendo en:
        echo    http://localhost:5173
        echo.
        echo Comandos utiles:
        echo    - Ver logs: docker-compose logs -f
        echo    - Detener: docker-compose down
        echo    - Reiniciar: docker-compose restart
        echo.
        echo Para personalizar tu logo e imagenes:
        echo    Lee el archivo PERSONALIZACION.md
        echo.
        echo Para mas comandos:
        echo    Lee el archivo COMANDOS.md
        echo.
        echo A BRASA LO NUESTRO!
        echo.
        pause
    ) else (
        echo.
        echo [ERROR] Error al levantar la aplicacion
        echo Revisa los logs con: docker-compose logs
        pause
        exit /b 1
    )
) else (
    echo.
    echo [ERROR] Error al construir el contenedor
    echo Verifica que todos los archivos esten presentes
    pause
    exit /b 1
)
