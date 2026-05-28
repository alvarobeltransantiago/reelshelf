# Base de datos

Reelshelf usa PostgreSQL 18 con migraciones SQL manuales. Las migraciones deben aplicarse en orden.

## Migraciones

```text
001_create_users.sql
002_create_reviews.sql
003_create_refresh_tokens.sql
004_expand_reviews_for_personal_library.sql
```

La migración `004` amplía la v1 inicial con:

- categoría `book`;
- campo `author`;
- valoraciones por aspecto en `aspect_ratings`;
- ranking personal con `top_rank`;
- índices para biblioteca personal y Top 10.

## Aplicar en PowerShell

Desde la raíz del proyecto:

```powershell
$env:PGPASSWORD='admin'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\migrations\001_create_users.sql
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\migrations\002_create_reviews.sql
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\migrations\003_create_refresh_tokens.sql
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\migrations\004_expand_reviews_for_personal_library.sql
```

## Seed

```powershell
$env:PGPASSWORD='admin'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\seed.sql
```

El seed crea usuarios y reseñas de ejemplo. La contraseña de los usuarios semilla es:

```text
Reelshelf123
```

El seed está preparado para poder ejecutarse varias veces sin duplicar el contenido básico.
