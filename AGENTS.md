# AGENTS.md - Instrucciones para agentes de IA

Este documento define cómo debe trabajar cualquier agente en Reelshelf. La funcionalidad vive en `SPEC.md` y la arquitectura en `CONTEXT.md`.

## Lectura obligatoria

Antes de generar o modificar código, leer en este orden:

1. `SPEC.md`
2. `CONTEXT.md`
3. `AGENTS.md`
4. `README.md`, si el cambio afecta instalación, rutas, scripts o experiencia inicial.

Si hay contradicciones, prevalece `SPEC.md` para comportamiento de producto y `CONTEXT.md` para implementación técnica.

## Estado actual del proyecto

El proyecto ya tiene implementada una v1 funcional:

- Backend Express con auth JWT, refresh token httpOnly, CRUD de reseñas, biblioteca personal y Top 10.
- Frontend React con landing pública, biblioteca protegida en `/library`, formularios, detalle de reseña, perfil minimalista y ajustes.
- PostgreSQL con migraciones manuales `001` a `006` y seed de ejemplo.
- Stack fijado por decisión del desarrollador: Node.js 24 y PostgreSQL 18.

Para nuevas tareas, no volver a ejecutar el plan inicial desde cero. Trabajar incrementalmente sobre esta base.

## Flujo de trabajo recomendado

1. Revisar los ficheros implicados antes de editar.
2. Hacer cambios pequeños y coherentes con la estructura actual.
3. Mantener CSS puro con variables y ficheros separados.
4. Validar con build/checks antes de cerrar.
5. Actualizar documentación cuando cambien rutas, requisitos, modelo de datos, scripts o decisiones de producto.

## Reglas generales

- No dejar funciones vacías, pseudocódigo ni comentarios tipo `TODO`.
- No hardcodear credenciales, URLs privadas o secrets. Usar variables de entorno.
- No usar TypeScript. El proyecto es JavaScript puro.
- No introducir ORMs. Usar SQL parametrizado con `pg`.
- No usar Tailwind, CSS-in-JS ni frameworks de utilidades CSS.
- No guardar access tokens en `localStorage` ni `sessionStorage`; solo en memoria Zustand.
- No devolver `password_hash` en respuestas JSON.
- No crear tests en v1 salvo petición explícita.
- No tocar cambios ajenos ni revertir trabajo del usuario sin permiso.

## Backend

- Todas las queries deben ser parametrizadas.
- Las ordenaciones dinámicas deben salir de mapas cerrados, nunca de texto del usuario interpolado.
- Controladores async con `(req, res, next)` y `next(error)` en errores.
- Usar `pool.query()` para queries simples y `pool.connect()` para transacciones.
- Validar body, params y query con Zod desde `schemas/`.
- Mantener respuesta uniforme con `sendSuccess` y `sendError`.

## Frontend

- Componentes React como funciones nombradas.
- No llamar a `fetch` desde componentes; usar siempre `src/api/`.
- Formularios con `react-hook-form` y `zodResolver`.
- Estado de auth solo mediante `authStore`.
- Cada componente/página con estilos propios en `.css` cuando tenga estilos específicos.
- Colores mediante variables CSS; no usar hexadecimales en componentes.
- Imágenes con `loading="lazy"` y fallback visual si fallan.
- Botones async con estado de carga y deshabilitados durante la petición.

## Diseño y UX

- Reelshelf no es una red social: es una biblioteca personal de reseñas.
- Mantener una estética minimalista, compacta y elegante.
- Modo claro: serio, limpio, inspirado en interfaces Apple.
- Modo oscuro: más gamer/biblioteca digital, sobrio, sin neones excesivos.
- La landing `/` debe conservar el texto inspirador y la imagen hero.
- La biblioteca protegida vive en `/library`.
- El logo del navbar siempre vuelve a `/`.

## Validación antes de cerrar

Ejecutar como mínimo:

```powershell
cd frontend
npm run build
```

Para backend, comprobar sintaxis de ficheros tocados:

```powershell
cd backend
node --check src\controllers\users.controller.js
```

Si se cambian rutas o auth, probar al menos login + refresh + una llamada protegida.
