# SPEC.md - Especificación del producto

## Visión general

Reelshelf es una biblioteca personal de reseñas para videojuegos, películas, series y libros. No está pensada como red social: el objetivo es guardar memoria, criterio y contexto sobre obras que el usuario quiere recordar.

Cada usuario puede crear, editar y eliminar sus propias reseñas, organizarlas por categoría, filtrarlas, buscar dentro de su biblioteca y construir un Top 10 personal independiente de la nota asignada.

## Tipos de usuario

| Rol | Descripción |
| --- | --- |
| Visitante | Puede ver la landing, iniciar sesión, registrarse y consultar perfiles públicos mínimos. |
| Usuario | Puede gestionar su biblioteca, reseñas, Top 10, perfil, biografía y avatar. |

No existe rol admin en v1.

## Rutas frontend

| Ruta | Acceso | Descripción |
| --- | --- | --- |
| `/` | Todos | Landing pública con imagen hero, frase inspiradora y CTA contextual. |
| `/library` | Usuario | Biblioteca personal con pestañas, buscador reactivo, vista cards/lista, favoritos, paginación y Top 10 por categoría. |
| `/wishlist` | Usuario | Lista de deseos por categoría con CRUD y orden manual. |
| `/login` | Visitante | Inicio de sesión. |
| `/register` | Visitante | Registro. |
| `/review/new` | Usuario | Crear reseña. |
| `/review/:id` | Todos según visibilidad | Detalle de reseña con portada a la izquierda y contenido a la derecha. |
| `/review/:id/edit` | Propietario | Editar reseña. |
| `/u/:username` | Todos | Perfil minimalista con biografía y avatar; sin listado de reseñas. |
| `*` | Todos | Not found. |

El logo y el texto `Reelshelf` del navbar siempre redirigen a `/`.

## Autenticación

- Registro con username, email, contraseña y confirmación en frontend.
- Login con email y contraseña.
- Access token JWT en memoria Zustand.
- Refresh token en cookie httpOnly.
- Silent refresh al cargar la app para mantener sesión tras recargar.
- Logout invalida el refresh token en base de datos.
- La cookie de refresh usa path `/api/v1/auth`.

## Perfil

- El perfil público muestra avatar, username y campo de biografía.
- El usuario propietario puede editar biografía y avatar desde su perfil.
- El avatar se elige desde iconos predefinidos con estética de biblioteca digital.
- La biografía tiene máximo 280 caracteres.
- El perfil no muestra reseñas ni Top 10 en la v1 actual.

## Reseñas

Cada reseña pertenece a un usuario y contiene:

- `title`: obligatorio, máximo 200 caracteres.
- `author`: obligatorio, máximo 200 caracteres.
- `category`: `game`, `movie`, `series` o `book`.
- `cover_url`: opcional.
- `rating`: entero de 1 a 10.
- `aspect_ratings`: objeto JSON con valoraciones por aspecto.
- `body`: markdown, obligatorio.
- `tags`: hasta 5 tags.
- `status`: `published` o `draft`.
- `top_rank`: posición opcional en Top 10.
- `is_favorite`: marca opcional para destacar obras sin obligarlas a entrar en el Top 10.
- `created_at` y `updated_at`.

Las cards muestran portada cuadrada, categoría, nota, título, autor, extracto, fecha, enlace a detalle, acción para añadir al Top 10 si todavía no está incluido y acción para marcar favorito. Quitar elementos del Top 10 se hace desde el panel lateral.

## Biblioteca personal

La biblioteca de `/library` es el centro de la app:

- Pestañas por categoría: videojuegos, películas, series y libros.
- 9 reseñas por página con vista cards o lista compacta.
- Ordenación por más recientes, más antiguas, mejor nota, menor nota, título A-Z, autor A-Z, favoritas primero y Top 10 primero.
- Búsqueda por todo, título, autor o nota exacta.
- Filtro por nota mínima.
- Paginación.
- Favoritos independientes del Top 10.
- Panel lateral Top 10 con imagen, título y nota.
- Debajo del Top 10 se muestran hasta 5 favoritos aleatorios de la categoría activa como recordatorio no ordenable, excluyendo las obras que ya estén en el Top 10.
- Top 10 reordenable con drag and drop, botones accesibles y mensajes ARIA de posición.
- Estados vacíos con ilustración sencilla y CTA contextual.
- Tour/tutorial con spotlight la primera vez que se entra.
- Música ambiente original, tranquila y opcional, activable desde el navbar.

## Portadas

Al crear o editar una reseña, el formulario puede sugerir portadas a partir del título. Las imágenes se usan como URLs externas y siempre deben tener fallback visual en frontend.

## Tema visual

- Tema claro minimalista y serio.
- Tema oscuro sobrio, tipo biblioteca digital/gaming sin neones excesivos.
- Tipografía basada en stack Apple/system.
- Layout responsive en móvil, tablet y escritorio.
- Botones tipo píldora modernos, con hover claro y consistente.

## API REST

Base URL: `/api/v1`

### Auth

```text
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
```

### Users

```text
GET    /users/me/library
PATCH  /users/me/top-reviews
GET    /users/me/wishlist
POST   /users/me/wishlist
PATCH  /users/me/wishlist/reorder
PATCH  /users/me/wishlist/:id
DELETE /users/me/wishlist/:id
GET    /users/me/backup
GET    /users/:username
GET    /users/:username/reviews
PATCH  /users/me
DELETE /users/me
```

### Reviews

```text
GET    /reviews
POST   /reviews
GET    /reviews/:id
PATCH  /reviews/:id
DELETE /reviews/:id
```

## Modelo de datos

### `users`

- `id`
- `username`
- `email`
- `password_hash`
- `bio`
- `avatar_url`
- `created_at`
- `updated_at`

### `reviews`

- `id`
- `user_id`
- `title`
- `author`
- `category`
- `cover_url`
- `rating`
- `aspect_ratings`
- `top_rank`
- `is_favorite`
- `body`
- `tags`
- `status`
- `created_at`
- `updated_at`

### `refresh_tokens`

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `created_at`

## Reglas de negocio

- Un usuario solo puede editar o eliminar sus reseñas.
- Un usuario solo puede ordenar en Top 10 reseñas propias.
- `top_rank` es único por usuario cuando no es `NULL`.
- `is_favorite` no afecta al ranking ni ocupa posiciones del Top 10.
- La biblioteca propia puede mostrar borradores.
- El perfil público no lista reseñas en la v1 actual.
- La API nunca devuelve `password_hash`.

## Requisitos no funcionales

- SQL parametrizado.
- Validación Zod en backend y frontend.
- Responsive completo.
- Accesibilidad básica: labels, aria-labels, navegación por teclado y estados visibles.
- SEO básico con `react-helmet-async`.
- Sin almacenamiento local de access token.
