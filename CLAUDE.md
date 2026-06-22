# Mis Gastos — contexto del proyecto

## Qué es esto
Una PWA (Progressive Web App) de control de gastos personales para Alberto. Un único fichero `index.html` con HTML, CSS y JavaScript "vanilla" (sin frameworks ni librerías de build). Pensada para instalarse como app en el móvil y usarse también desde el ordenador.

- **URL en producción:** https://joruxo.github.io/gastos-Joruxo/
- **Repositorio GitHub:** https://github.com/Joruxo/gastos-Joruxo
- **Ficheros:** `index.html` (todo el código), `manifest.json`, `sw.js` (service worker), `icon-192.png`, `icon-512.png`

## Sobre Alberto (el usuario)
- Español de Valencia, vive en Aalsmeer (Países Bajos) desde el 20 de mayo de 2026.
- Trabaja en el sector floricultor/horticultura.
- Nivel técnico medio-bajo: entiende la lógica de la app pero no es desarrollador profesional.
- **Prefiere explicaciones en lenguaje sencillo, sin tecnicismos sin explicar.**
- Conversaciones siempre en español.
- Cambios de código: mostrar solo lo que cambia, no reescribir el fichero entero salvo que se pida explícitamente. Explicar el cambio después en una o dos frases simples.

## Decisiones técnicas — NO cambiar sin confirmar con Alberto
| Decisión | Por qué |
|---|---|
| Un solo fichero `index.html` | Despliegue trivial en GitHub Pages, sin build |
| Vanilla JS (sin React/Vue/jQuery) | Ligero, legible, sin dependencias |
| Supabase como base de datos en la nube | Sincroniza datos entre móvil y ordenador |
| IDs de categoría | Sagrados — están en datos reales guardados, nunca cambiarlos |
| Modelo de IA fijo `claude-sonnet-4-20250514` | No cambiar sin confirmar (aunque actualmente no se usa, ver abajo) |

## Estado actual de la arquitectura

### Backend: Supabase (NO localStorage)
La app migró de `localStorage` a Supabase para sincronizar datos en tiempo real entre dispositivos.

- **Proyecto Supabase:** ID `zlsuswrmzyecktkiwymi`, URL `https://zlsuswrmzyecktkiwymi.supabase.co`
- Las claves (`SUPABASE_URL` y `SUPABASE_KEY`, la publishable/anon key) están **ya puestas dentro del `index.html`**, cerca del principio del script. No son secretas (están pensadas para ir en el navegador).
- **Autenticación:** login con email/contraseña vía `sb.auth.signInWithPassword`. Hay botón de cuenta (👤 en el topbar) con opción de cerrar sesión (`sb.auth.signOut`).
- **Row Level Security (RLS):** cada usuario solo ve sus propias filas (`auth.uid() = user_id`).

### Tablas en Supabase

**`gastos`** — movimientos (gastos e ingresos):
```sql
id          text        primary key
user_id     uuid        not null default auth.uid()
amount      float8      not null
category_id text        not null
note        text        not null default ''
date        date        not null
kind        text        not null default 'gasto'   -- 'gasto' | 'ingreso'
created_at  timestamptz not null default now()
```

**`deudas`** — deudas con otras personas:
```sql
id          text        primary key
user_id     uuid        not null default auth.uid()
persona     text        not null
amount      float8      not null
direction   text        not null    -- 'te_deben' | 'debes'
note        text        not null default ''
date        date        not null
settled     boolean     not null default false
created_at  timestamptz not null default now()
```

Ambas tablas tienen RLS activado con 4 políticas (select/insert/update/delete) basadas en `auth.uid() = user_id`.

### Las 17 categorías — IDs SAGRADOS, nunca cambiar
`vivienda`, `suministros`, `super`, `comer`, `transporte`, `coche`, `viajes`, `salud`, `telefono`, `suscripciones`, `ropa`, `valencia`, `ocio`, `peluqueria`, `tramites`, `otros`, `sin_clasificar`

### Diseño visual: "Claro Índigo"
- Fondo blanco puro, tarjetas con borde gris suave (`#E5E7EB`).
- Color principal: índigo `#4F46E5`.
- Ingresos en verde (`#16A34A` / fondo `#DCFCE7`), gastos en rojo (`#DC2626` / fondo `#FEE2E2`).
- Fuentes: Fraunces (serif, títulos y números) + Hanken Grotesk (sans, resto).
- Versión de ordenador: media query `@media (min-width: 920px)` con layout de dos columnas. El móvil no cambia.

### Pestañas de la app
Resumen · Movimientos · Calendario · Evolución · Deudas

- **Resumen:** donut + desglose por categoría (solo gastos, no ingresos).
- **Movimientos:** lista cronológica, con botón de borrado rápido por fila.
- **Calendario:** cuadrícula del mes con gasto (rojo) e ingreso (verde) bajo cada día; tocar un día abre el detalle.
- **Evolución:** comparación mes a mes desde el 20 de mayo de 2026 (fecha de llegada a Holanda). Constante `ETAPA_INICIO = "2026-05-20"` en el código.
- **Deudas:** balance de lo que le deben y lo que debe, con botón de liquidar (✓) sin borrar el histórico.

### Escaneo de tickets/PDF — DECISIÓN IMPORTANTE
La función de escanear ticket/PDF con la API de Anthropic **existe en el código pero está inactiva a propósito**: Alberto decidió NO meter una API key de Anthropic en el navegador para evitar cualquier coste o riesgo de que alguien la copie del repositorio público.

**Flujo real que usa Alberto:** pega el PDF del extracto bancario en un chat (Claude o Gemini) con un prompt específico que devuelve el listado en formato `fecha;categoriaId;importe;concepto;tipo`, y luego pega ese texto en el botón **"Pegar movimientos"** de la app (que sí funciona, vía `parsePasted()`).

Pendiente en la lista de mejoras: ocultar o avisar en el botón "Ticket, captura o PDF" de que el escaneo automático no funciona.

### Otras funciones clave
- **Borrar mes completo:** botón con doble confirmación, borra solo los movimientos del mes que se está viendo.
- **Exportar CSV:** incluye columna de tipo (gasto/ingreso).
- **Botón físico de cerrar (✕):** fijo en la esquina superior derecha de la pantalla, visible en cualquier ventana modal (pegar movimientos, escanear, deudas, cuenta...). Se añadió porque en Safari/iPhone el teclado a veces tapa toda la zona de fondo que se usaba para cerrar tocando fuera.
- **Service worker:** `sw.js`, estrategia *network-first* (intenta red primero, cae a caché si falla). Hay que **subir cache version** (`mis-gastos-vN`) cada vez que se despliega un cambio relevante, para forzar que los navegadores descarten la caché vieja.

## Reglas de clasificación de movimientos bancarios
Cuando se procesan extractos del banco (Santander de Alberto, u otros bancos de sus amigos):

| Concepto | Categoría |
|---|---|
| Basic-Fit | `suscripciones` |
| Claude Pro (~22€, cargo de Google Play) | `suscripciones` |
| Netflix | `suscripciones` |
| Financiación del Banco Sabadell (reparación de su coche financiado) | `coche` |
| Tienda Action | `suministros` |
| TGSS / Seguridad Social | `tramites` |
| Endesa | normalmente se ignora (lo paga la familia en España), salvo que el extracto confirme que lo paga él |
| OVpay / códigos "Nlov..." | `transporte` (transporte público holandés) |
| Prefijos de pasarela antes de un asterisco (CCV\*, SUMUP\*, BCK\*, GOC\*, NYX\*, PAYPAL\*) | el comercio real va DESPUÉS del asterisco |

**Nota de privacidad:** existen una o dos reglas de clasificación adicionales que Alberto prefiere mantener discretas y que **nunca deben escribirse en ficheros del repositorio** (ni en este CLAUDE.md, ni en README, ni en el código). Si Alberto las menciona en una sesión, aplícalas solo de palabra para esa sesión, sin documentarlas por escrito en el proyecto.

## Copias para otros usuarios
Hay copias de la app para **Noel** (usa Safari/iPhone), **David** y **Verónica**, cada una en su propio repositorio de GitHub, pero **conectadas al mismo proyecto de Supabase** que Alberto (cada uno con su propio usuario de Supabase; RLS separa los datos de cada persona).

**Política de Alberto:** perfeccionar primero su propia copia, y solo cuando esté conforme, replicar los mismos archivos (`index.html` y `sw.js`) tal cual a los repos de sus amigos. No hay que adaptar nada específico por navegador — las correcciones (como el botón de cerrar) son universales, no hacen falta versiones distintas por navegador.

### Diferencias por repo que SÍ hay que conservar al sincronizar
Aunque la idea es que los 4 repos lleven los mismos archivos, **cada copia tiene una línea propia que NO debe sobrescribirse** al copiar el `index.html` desde el repo de Alberto. Como todos los repos están en el mismo dominio (`joruxo.github.io`), comparten "cajón" de navegador, así que cada uno guarda su sesión de login con una `storageKey` distinta dentro de `supabase.createClient(...)`:

| Repo | `storageKey` |
|---|---|
| gastos-Joruxo | `sb-gastos-joruxo-auth` |
| gastos-Noel | `sb-gastos-noel-auth` |
| gastos-david | `sb-gastos-david-auth` |
| gastos-veronica | `sb-gastos-veronica-auth` |

**Flujo correcto para replicar a un amigo:** copiar `index.html` y `sw.js` de gastos-Joruxo → en el `index.html` copiado, cambiar la `storageKey` a la del repo destino (la línea `auth: { storageKey: "..." }`) → subir versión de caché en `sw.js` → commit y push. El `sw.js` no necesita ajuste por repo (todos usan el mismo nombre de caché `mis-gastos-vN`).

## Cómo desplegar cambios
1. Editar `index.html` (y `sw.js` si se sube versión de caché).
2. Commit y push a la rama `main` de cada repositorio que se quiera actualizar.
3. GitHub Pages publica automáticamente en 1-2 minutos.
4. Si no se ven los cambios, hacer Ctrl+Shift+R (recarga forzada) — y si persiste, comprobar que se subió también el `sw.js` con la versión de caché incrementada.

## Cómo trabajar conmigo en este proyecto (reglas permanentes)
- **Antes de hacer `commit` o `push`, enséñame siempre el `git diff`** y espera mi confirmación. No subas nada a GitHub sin que yo lo haya visto y dicho que sí.
- **Nunca toques Supabase directamente** (no ejecutes SQL, no crees/borres usuarios, no cambies tablas) salvo que te lo pida explícitamente en ese momento.
- **Nunca cambies** los IDs de categoría, el `SUPABASE_URL`/`SUPABASE_KEY`, ni el modelo de IA fijo, sin confirmación explícita.
- Si te pido actualizar varios repositorios a la vez (mi copia + las de mis amigos Noel, David, Verónica), hazlo **uno por uno**, mostrándome el diff de cada uno antes de pasar al siguiente.
- Si algo te parece arriesgado o ambiguo, pregúntame antes de actuar, no asumas.

## Historial relevante de decisiones
- Se migró de `localStorage` a Supabase para sincronizar entre dispositivos.
- Se rediseñó la paleta de colores varias veces hasta llegar a "Claro Índigo" (fondo blanco, índigo, verde/rojo para ingresos/gastos).
- Se añadió Calendario, Evolución y Deudas como pestañas nuevas.
- Se añadió un botón físico de cerrar en los modales tras detectar un problema de navegación en Safari/iPhone.
- Se decidió explícitamente NO activar el escaneo automático de PDF/tickets vía API de Anthropic en el navegador, para evitar coste y riesgo de exposición de la clave en el repo público.
