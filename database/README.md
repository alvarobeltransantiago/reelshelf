# Base de datos

Reelshelf usa PostgreSQL 18 con migraciones SQL manuales. Las migraciones deben aplicarse en orden.

## Migraciones

```text
001_create_users.sql
002_create_reviews.sql
003_create_refresh_tokens.sql
004_expand_reviews_for_personal_library.sql
005_category_top_and_wishlist.sql
```

La migracion `004` amplia la v1 inicial con libros, autor, valoraciones por aspecto, Top 10 y nuevos indices.
La migracion `005` separa el Top 10 por categoria y crea `wishlist_items` para la lista de deseos ordenable.

## Aplicar en PowerShell

Desde la raiz del proyecto:

```powershell
$env:PGPASSWORD='admin'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\migrations\001_create_users.sql
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\migrations\002_create_reviews.sql
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\migrations\003_create_refresh_tokens.sql
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\migrations\004_expand_reviews_for_personal_library.sql
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\migrations\005_category_top_and_wishlist.sql
```

## Seed

```powershell
$env:PGPASSWORD='admin'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d reelshelf -f .\database\seed.sql
```

El seed crea usuarios y resenas de ejemplo. La contrasena de los usuarios semilla es:

```text
Reelshelf123
```

El seed esta preparado para poder ejecutarse varias veces sin duplicar el contenido basico.
