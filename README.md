# Mis Gastos

Aplicación web progresiva (PWA) para llevar el control de gastos personales desde el móvil o el ordenador. Se instala como una app y los datos se sincronizan en la nube, así que se ven igual en el teléfono y en el ordenador.

## Características

- Registro rápido de gastos e ingresos repartidos en 17 categorías.
- Resumen mensual con gráfico de tarta y desglose por categoría.
- Calendario del mes, evolución mes a mes y control de deudas (lo que te deben y lo que debes).
- Pegado de movimientos desde el chat del banco, con pantalla de revisión antes de guardar y aviso de posibles duplicados.
- Exportación de copia de seguridad en CSV.
- Diseño adaptado tanto al móvil como a la pantalla de ordenador.

## Tecnología

- Un único archivo `index.html` con todo el HTML, CSS y JavaScript, sin frameworks ni dependencias de compilación.
- Base de datos en la nube con Supabase: login por email y contraseña, y sincronización entre dispositivos.
- Cada usuario solo ve sus propios datos (seguridad por filas, RLS).
- Service worker (`sw.js`) para que la app cargue rápido y siga abriéndose aunque la conexión falle.

## Archivos del proyecto

- `index.html` — toda la aplicación.
- `manifest.json` — configuración de la PWA (nombre, iconos, colores).
- `sw.js` — service worker para la caché.
- `icon-192.png`, `icon-512.png` — iconos de la app.

## Cómo desplegar

El proyecto se publica con GitHub Pages. Para actualizarlo:

1. Edita los archivos y haz commit a la rama `main`.
2. Si cambiaste algo importante, sube el número de versión de la caché en `sw.js`.
3. GitHub Pages publica los cambios automáticamente en uno o dos minutos.

## Privacidad

Los datos se guardan en Supabase (en la nube), protegidos por usuario: cada persona entra con su cuenta y solo ve sus propios movimientos. Aun así, conviene exportar de vez en cuando una copia en CSV como respaldo.
