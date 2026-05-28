# CONTEXT.md - Contexto técnico y arquitectura

## Stack

### Frontend

- React 18 con Vite.
- React Router v6.
- TanStack Query para estado servidor.
- Zustand para auth y tema.
- react-hook-form + Zod para formularios.
- react-markdown para renderizar reseñas.
- react-helmet-async para títulos/meta.
- CSS puro con variables, sin Tailwind ni CSS-in-JS.

### Backend

- Node.js 24.
- Express 5.
- PostgreSQL 18 con `pg`.
- SQL manual, sin ORM.
- jsonwebtoken para access/refresh tokens.
- bcrypt para contraseñas.
- Zod para validación.
- Helmet, CORS, express-rate-limit y dotenv.

### Base de datos

- PostgreSQL 18.
- Migraciones SQL manuales numeradas.
- Seed idempotente para datos de ejemplo.

## Estructura

```text
reelshelf/
|-- backend/
|   |-- src/
|   |   |-- controllers/
|   |   |-- db/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- schemas/
|   |   `-- utils/
|   |-- .env.example
|   |-- package.json
|   `-- server.js
|-- database/
|   |-- migrations/
|   |-- seed.sql
|   `-- README.md
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |-- assets/
|   |   |-- components/
|   |   |   |-- common/
|   |   |   |-- layout/
|   |   |   `-- review/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- store/
|   |   |-- styles/
|   |   `-- utils/
|   |-- .env.example
|   |-- index.html
|   `-- package.json
|-- AGENTS.md
|-- CONTEXT.md
|-- SPEC.md
|-- LICENSE
`-- README.md
```

## Patrones backend

Flujo:

```text
Request -> Route -> Middleware -> Controller -> pool/query -> Response
```

- Los controladores contienen las queries SQL.
- Las queries usan parámetros `$1`, `$2`, etc.
- Las transacciones usan `pool.connect()`.
- Los schemas Zod viven en `src/schemas`.
- Los errores se envían a `error.middleware.js`.
- `sendSuccess` y `sendError` mantienen formato uniforme.

## Patrones frontend

Flujo:

```text
Page -> TanStack Query/useMutation -> api/* -> fetch wrapper
```

- Los componentes no llaman a `fetch` directamente.
- `src/api/client.js` centraliza `credentials: 'include'`, Authorization y refresh automático.
- `authStore` mantiene access token y usuario.
- `themeStore` aplica `theme-dark` o `theme-light` sobre `<html>`.
- Cada página/componente con estilos propios importa su CSS.

## Autenticación

- Access token en memoria.
- Refresh token httpOnly en cookie.
- Silent refresh en `main.jsx` mediante `AuthBootstrap`.
- `VITE_API_URL` debe coincidir con el host usado en navegador. En local se usa `http://127.0.0.1:3001/api/v1`.
- Backend acepta `http://localhost:5173` y `http://127.0.0.1:5173` en CORS.

## Diseño

- Variables globales en `frontend/src/styles/variables.css`.
- Temas en `frontend/src/styles/themes.css`.
- Reset en `frontend/src/styles/reset.css`.
- Tipografía en `frontend/src/styles/typography.css`.
- Colores siempre vía `var(--color-...)`.
- Botones modernos tipo píldora desde `components/common/Button.css`.
- Cards de reseña con portada cuadrada.
- Landing usa `frontend/src/assets/hero-library-table.png`.
- Logo y favicon tienen estética de estantería pixelada.

## Variables de entorno

### Backend

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:admin@localhost:5432/reelshelf
JWT_ACCESS_SECRET=cambia_esto_por_un_secreto_largo
JWT_REFRESH_SECRET=cambia_esto_por_otro_secreto_largo
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend

```env
VITE_API_URL=http://127.0.0.1:3001/api/v1
```

## Scripts

Backend:

```json
"dev": "nodemon server.js",
"start": "node server.js"
```

Frontend:

```json
"dev": "vite",
"build": "vite build",
"preview": "vite preview"
```

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| SQL puro con `pg` | Control total y menos abstracción. |
| Zustand | Estado global mínimo. |
| TanStack Query | Cache, loading y errores sin boilerplate. |
| Cookie httpOnly refresh + access en memoria | Mejor seguridad que localStorage. |
| CSS puro | Mantener diseño propio y portable. |
| Node 24 + PostgreSQL 18 | Versiones instaladas y aceptadas por el desarrollador. |

## Validación local

Frontend:

```powershell
cd frontend
npm run build
```

Backend:

```powershell
cd backend
node --check server.js
node --check src\controllers\auth.controller.js
node --check src\controllers\users.controller.js
node --check src\controllers\reviews.controller.js
```
