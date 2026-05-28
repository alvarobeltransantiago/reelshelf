-- Insertamos usuarios de ejemplo con contraseñas bcrypt generadas por
-- PostgreSQL para que el seed sea reproducible sin scripts extra.
INSERT INTO users (username, email, password_hash, bio, avatar_url)
VALUES
  (
    'cinemara',
    'clara@reelshelf.dev',
    crypt('Reelshelf123', gen_salt('bf', 12)),
    'Reseño cine, series de autor y algún juego narrativo cuando me obsesiona lo suficiente.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
  ),
  (
    'savepointleo',
    'leo@reelshelf.dev',
    crypt('Reelshelf123', gen_salt('bf', 12)),
    'Colecciono campañas largas, thrillers compactos y temporadas que merecen maratón.',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  )
ON CONFLICT (username) DO NOTHING;

-- Cubrimos las tres categorías con dos reseñas por categoría y mezclamos
-- publicaciones y borradores para poder probar permisos y filtros.
INSERT INTO reviews (user_id, title, category, cover_url, rating, body, tags, status)
SELECT
  u.id,
  r.title,
  r.category,
  r.cover_url,
  r.rating,
  r.body,
  r.tags,
  r.status
FROM (
  VALUES
    (
      'cinemara',
      'Citizen Sleeper 2 y el arte de sobrevivir despacio',
      'game',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
      9,
      'Citizen Sleeper 2 entiende que la tensión no siempre nace del combate. Cada tirada, cada deuda y cada vínculo construyen una sensación de vulnerabilidad constante que convierte la gestión del tiempo en el verdadero enemigo. Es rol íntimo, político y tremendamente humano.',
      ARRAY['rpg-narrativo', 'sci-fi', 'indie'],
      'published'
    ),
    (
      'savepointleo',
      'Helldivers 2 funciona mejor cuando abraza el caos',
      'game',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      8,
      'La sátira militar y el diseño cooperativo hacen que cada misión genere anécdotas propias. No todo está equilibrado y a veces el progreso se siente irregular, pero el gunplay y la coordinación improvisada compensan con creces cuando el escuadrón entra en ritmo.',
      ARRAY['coop', 'accion', 'online'],
      'published'
    ),
    (
      'cinemara',
      'Anatomía de una caída deja preguntas mejores que respuestas',
      'movie',
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
      10,
      'Más que un juicio, la película plantea una autopsia de la convivencia y del modo en que narramos la intimidad ante otros. Su inteligencia está en no simplificar ninguna versión y en dejar que la ambigüedad pese más que el veredicto.',
      ARRAY['drama', 'juicio', 'europeo'],
      'published'
    ),
    (
      'savepointleo',
      'Misión imposible para una secuela que aún no termina de cerrar',
      'movie',
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
      7,
      'Tiene set pieces enormes, una estrella que sigue sosteniendo el espectáculo y oficio visual de sobra. Aun así, el relato se percibe interrumpido y el peso dramático depende demasiado de la promesa de una continuación que todavía no termina de justificar su estructura.',
      ARRAY['accion', 'blockbuster', 'espias'],
      'draft'
    ),
    (
      'cinemara',
      'Shogun convierte cada silencio en una batalla',
      'series',
      'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=600&q=80',
      9,
      'La serie trabaja la puesta en escena con una precisión poco común en televisión mainstream. Sus mejores momentos no están en el conflicto explícito, sino en cómo el protocolo, la traducción y la mirada de los personajes reordenan el poder dentro de cada escena.',
      ARRAY['historica', 'drama', 'politica'],
      'published'
    ),
    (
      'savepointleo',
      'Blue Eye Samurai entra como venganza y se queda por su pulso emocional',
      'series',
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
      9,
      'La serie presume de acción coreografiada con muchísima personalidad, pero lo que la eleva es la tensión entre identidad, rabia y pertenencia. El resultado no se limita a un escaparate visual: hay una voz propia clara y capítulos que saben respirar.',
      ARRAY['animacion', 'venganza', 'samurai'],
      'published'
    )
) AS r(username, title, category, cover_url, rating, body, tags, status)
JOIN users u ON u.username = r.username
WHERE NOT EXISTS (
  SELECT 1
  FROM reviews existing
  WHERE existing.user_id = u.id
    AND existing.title = r.title
);
