# Íconos PWA

Esta carpeta debe contener los íconos necesarios para la PWA.

## Íconos requeridos:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Cómo generar los íconos:

### Opción 1: Usando herramientas online
1. Ve a https://realfavicongenerator.net/ o https://www.pwabuilder.com/imageGenerator
2. Sube tu logo/ícono en alta resolución (mínimo 512x512px)
3. Genera y descarga todos los tamaños
4. Coloca los archivos en esta carpeta

### Opción 2: Usando ImageMagick (desde línea de comandos)
```bash
# Desde un archivo PNG de alta resolución
convert icon-original.png -resize 72x72 icon-72x72.png
convert icon-original.png -resize 96x96 icon-96x96.png
convert icon-original.png -resize 128x128 icon-128x128.png
convert icon-original.png -resize 144x144 icon-144x144.png
convert icon-original.png -resize 152x152 icon-152x152.png
convert icon-original.png -resize 192x192 icon-192x192.png
convert icon-original.png -resize 384x384 icon-384x384.png
convert icon-original.png -resize 512x512 icon-512x512.png
```

### Opción 3: Usar un ícono temporal
Por el momento, puedes crear un ícono simple usando cualquier imagen PNG de 512x512 y duplicarla con diferentes nombres hasta que tengas los íconos definitivos.

## Nota importante:
Los íconos deben ser:
- Formato PNG
- Fondo transparente o sólido (según el diseño)
- Resolución exacta al nombre del archivo
- Optimizados para web (no demasiado pesados)
