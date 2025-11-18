#!/bin/bash

echo "🍗 =================================="
echo "   PARDOS CHICKEN - Setup Inicial"
echo "================================== 🍗"
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    echo "Por favor instala Docker desde: https://www.docker.com/get-started"
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    echo "Por favor instala Docker Compose"
    exit 1
fi

echo "✅ Docker está instalado"
echo "✅ Docker Compose está instalado"
echo ""

echo "📦 Construyendo contenedor Docker..."
docker-compose build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Contenedor construido exitosamente!"
    echo ""
    echo "🚀 Levantando la aplicación..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ ¡Aplicación iniciada exitosamente!"
        echo ""
        echo "🌐 La aplicación está corriendo en:"
        echo "   👉 http://localhost:5173"
        echo ""
        echo "📝 Comandos útiles:"
        echo "   - Ver logs: docker-compose logs -f"
        echo "   - Detener: docker-compose down"
        echo "   - Reiniciar: docker-compose restart"
        echo ""
        echo "🎨 Para personalizar tu logo e imágenes:"
        echo "   Lee el archivo PERSONALIZACION.md"
        echo ""
        echo "🛠️  Para más comandos:"
        echo "   Lee el archivo COMANDOS.md"
        echo ""
        echo "¡A BRASA LO NUESTRO! 🔥"
    else
        echo ""
        echo "❌ Error al levantar la aplicación"
        echo "Revisa los logs con: docker-compose logs"
    fi
else
    echo ""
    echo "❌ Error al construir el contenedor"
    echo "Verifica que todos los archivos estén presentes"
fi
