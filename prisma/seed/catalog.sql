BEGIN;

TRUNCATE TABLE
    "sessions",
    "users",
    "comic_genres",
    "comic_creators",
    "comic_translations",
    "series_translations",
    "genre_translations",
    "comics",
    "creators",
    "genres",
    "series"
RESTART IDENTITY;

INSERT INTO "users" (
    "public_id",
    "email",
    "password_hash",
    "display_name",
    "role",
    "enabled",
    "updated_at"
)
VALUES
    (
        'usr_demo_user',
        'user@qacomics.local',
        '$argon2id$v=19$m=19456,t=2,p=1$cWNnX3VzZXJfc2VlZF91c2Vy$26EK5qJtWDuSdeFbkxsheZAULJxDkPBH3fsgwAIpDLY',
        'Demo User',
        'USER',
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        'usr_demo_admin',
        'admin@qacomics.local',
        '$argon2id$v=19$m=19456,t=2,p=1$cWNnX2FkbWluX3NlZWRfYWRtaW4$SO2qXp3eUbNjn69DHKsX8mtYIRw/xQRlhYL9xVvFAIc',
        'Demo Admin',
        'ADMIN',
        TRUE,
        CURRENT_TIMESTAMP
    );

INSERT INTO "series" ("slug", "updated_at")
VALUES
    ('neon-harbor', CURRENT_TIMESTAMP),
    ('clockwork-frontier', CURRENT_TIMESTAMP),
    ('ember-archive', CURRENT_TIMESTAMP);

INSERT INTO "series_translations" ("series_id", "locale", "title")
SELECT "series"."id", "seed"."locale"::"locale", "seed"."title"
FROM (
    VALUES
        ('neon-harbor', 'en', 'Neon Harbor'),
        ('neon-harbor', 'ru', 'Неоновая гавань'),
        ('clockwork-frontier', 'en', 'Clockwork Frontier'),
        ('clockwork-frontier', 'ru', 'Заводной рубеж'),
        ('ember-archive', 'en', 'Ember Archive'),
        ('ember-archive', 'ru', 'Архив искр')
) AS "seed" ("series_slug", "locale", "title")
JOIN "series" ON "series"."slug" = "seed"."series_slug";

INSERT INTO "creators" ("slug", "display_name", "updated_at")
VALUES
    ('nora-vale', 'Nora Vale', CURRENT_TIMESTAMP),
    ('alina-sever', 'Алина Север', CURRENT_TIMESTAMP),
    ('mika-tanaka', 'Mika Tanaka', CURRENT_TIMESTAMP),
    ('jonas-reed', 'Jonas Reed', CURRENT_TIMESTAMP),
    ('elias-voss', 'Elias Voss', CURRENT_TIMESTAMP),
    ('priya-nadir', 'Priya Nadir', CURRENT_TIMESTAMP),
    ('teo-markovic', 'Teo Markovic', CURRENT_TIMESTAMP),
    ('sofia-chen', 'Sofia Chen', CURRENT_TIMESTAMP);

INSERT INTO "genres" ("slug", "updated_at")
VALUES
    ('science-fiction', CURRENT_TIMESTAMP),
    ('mystery', CURRENT_TIMESTAMP),
    ('adventure', CURRENT_TIMESTAMP),
    ('fantasy', CURRENT_TIMESTAMP),
    ('drama', CURRENT_TIMESTAMP),
    ('retro-futurism', CURRENT_TIMESTAMP);

INSERT INTO "genre_translations" ("genre_id", "locale", "name")
SELECT "genres"."id", "seed"."locale"::"locale", "seed"."name"
FROM (
    VALUES
        ('science-fiction', 'en', 'Science Fiction'),
        ('science-fiction', 'ru', 'Научная фантастика'),
        ('mystery', 'en', 'Mystery'),
        ('mystery', 'ru', 'Детектив'),
        ('adventure', 'en', 'Adventure'),
        ('adventure', 'ru', 'Приключения'),
        ('fantasy', 'en', 'Fantasy'),
        ('fantasy', 'ru', 'Фэнтези'),
        ('drama', 'en', 'Drama'),
        ('drama', 'ru', 'Драма'),
        ('retro-futurism', 'en', 'Retro-futurism'),
        ('retro-futurism', 'ru', 'Ретрофутуризм')
) AS "seed" ("genre_slug", "locale", "name")
JOIN "genres" ON "genres"."slug" = "seed"."genre_slug";

INSERT INTO "comics" (
    "slug",
    "sku",
    "series_id",
    "issue_number",
    "price_minor",
    "compare_at_price_minor",
    "currency_code",
    "stock_quantity",
    "publication_state",
    "cover_path",
    "sort_order",
    "updated_at"
)
SELECT
    "seed"."slug",
    "seed"."sku",
    "series"."id",
    "seed"."issue_number",
    "seed"."price_minor",
    "seed"."compare_at_price_minor",
    'USD',
    "seed"."stock_quantity",
    "seed"."publication_state"::"publication_state",
    "seed"."cover_path",
    "seed"."sort_order",
    CURRENT_TIMESTAMP
FROM (
    VALUES
        (
            'neon-harbor-1',
            'QCG-NH-001',
            'neon-harbor',
            1,
            1299,
            NULL::INTEGER,
            24,
            'PUBLISHED',
            'media/comics/neon-harbor-1.png',
            10
        ),
        (
            'neon-harbor-2',
            'QCG-NH-002',
            'neon-harbor',
            2,
            1499,
            1999,
            2,
            'PUBLISHED',
            'media/comics/neon-harbor-2.png',
            20
        ),
        (
            'neon-harbor-3',
            'QCG-NH-003',
            'neon-harbor',
            3,
            1599,
            NULL::INTEGER,
            10,
            'DRAFT',
            NULL,
            30
        ),
        (
            'clockwork-frontier-1',
            'QCG-CF-001',
            'clockwork-frontier',
            1,
            999,
            NULL::INTEGER,
            0,
            'PUBLISHED',
            'media/comics/clockwork-frontier-1.png',
            40
        ),
        (
            'clockwork-frontier-2',
            'QCG-CF-002',
            'clockwork-frontier',
            2,
            4999,
            NULL::INTEGER,
            5,
            'PUBLISHED',
            'media/comics/clockwork-frontier-2.png',
            50
        ),
        (
            'ember-archive-1',
            'QCG-EA-001',
            'ember-archive',
            1,
            1899,
            NULL::INTEGER,
            0,
            'ARCHIVED',
            'media/comics/ember-archive-1.png',
            60
        ),
        (
            'last-tram-to-orbit',
            'QCG-LTO-001',
            NULL,
            NULL::INTEGER,
            1799,
            NULL::INTEGER,
            12,
            'PUBLISHED',
            NULL,
            70
        ),
        (
            'paper-moon-protocol',
            'QCG-PMP-001',
            NULL,
            NULL::INTEGER,
            199,
            NULL::INTEGER,
            50,
            'PUBLISHED',
            'media/comics/paper-moon-protocol.png',
            80
        ),
        (
            'glass-signal',
            'QCG-GS-001',
            NULL,
            NULL::INTEGER,
            2199,
            NULL::INTEGER,
            7,
            'PUBLISHED',
            'media/comics/glass-signal.png',
            90
        ),
        (
            'iron-orchard',
            'QCG-IO-001',
            NULL,
            NULL::INTEGER,
            2499,
            NULL::INTEGER,
            15,
            'PUBLISHED',
            'media/comics/iron-orchard.png',
            100
        )
) AS "seed" (
    "slug",
    "sku",
    "series_slug",
    "issue_number",
    "price_minor",
    "compare_at_price_minor",
    "stock_quantity",
    "publication_state",
    "cover_path",
    "sort_order"
)
LEFT JOIN "series" ON "series"."slug" = "seed"."series_slug";

INSERT INTO "comic_translations" (
    "comic_id",
    "locale",
    "title",
    "description"
)
SELECT
    "comics"."id",
    "seed"."locale"::"locale",
    "seed"."title",
    "seed"."description"
FROM (
    VALUES
        (
            'neon-harbor-1',
            'en',
            'Neon Harbor: The Vanishing Beacon',
            'Courier Mara Venn follows a silent lighthouse signal beneath a rain-soaked floating city.'
        ),
        (
            'neon-harbor-1',
            'ru',
            'Неоновая гавань: Исчезнувший маяк',
            'Курьер Мара Венн идёт по следу замолчавшего маяка под дождливыми улицами плавучего города.'
        ),
        (
            'neon-harbor-2',
            'en',
            'Neon Harbor: Tides of Static',
            'A storm of radio ghosts forces Mara to choose between a lost crew and the city power grid.'
        ),
        (
            'neon-harbor-2',
            'ru',
            'Неоновая гавань: Волны помех',
            'Буря радио-призраков заставляет Мару выбирать между пропавшим экипажем и энергосетью города.'
        ),
        (
            'neon-harbor-3',
            'en',
            'Neon Harbor: The Drowned Frequency',
            'An unfinished clean draft follows a forbidden broadcast into the oldest district of the harbor.'
        ),
        (
            'neon-harbor-3',
            'ru',
            'Неоновая гавань: Утонувшая частота',
            'Чистовой черновик ведёт героев за запрещённым сигналом в самый старый район гавани.'
        ),
        (
            'clockwork-frontier-1',
            'en',
            'Clockwork Frontier: Brass Horizon',
            'A mechanic and a runaway survey automaton cross a desert where abandoned machines still keep time.'
        ),
        (
            'clockwork-frontier-1',
            'ru',
            'Заводной рубеж: Латунный горизонт',
            'Механик и сбежавший автомат-геодезист пересекают пустыню, где брошенные машины всё ещё считают время.'
        ),
        (
            'clockwork-frontier-2',
            'en',
            'Clockwork Frontier: The Meridian Engine',
            'Four rivals descend into a colossal engine whose final turn could redraw every border on the frontier.'
        ),
        (
            'clockwork-frontier-2',
            'ru',
            'Заводной рубеж: Двигатель меридиана',
            'Четверо соперников спускаются в колоссальный механизм, способный одним оборотом изменить все границы.'
        ),
        (
            'ember-archive-1',
            'en',
            'Ember Archive: Ashes That Remember',
            'An archivist discovers that memories stored in warm glass are quietly rewriting their owners.'
        ),
        (
            'ember-archive-1',
            'ru',
            'Архив искр: Пепел, который помнит',
            'Архивист узнаёт, что воспоминания в тёплом стекле незаметно переписывают своих владельцев.'
        ),
        (
            'last-tram-to-orbit',
            'en',
            'The Last Tram to Orbit: A Farewell at the Edge of the Quiet Sky',
            'On the final night of service, a conductor carries seven passengers toward an orbital station that denies their arrival.'
        ),
        (
            'last-tram-to-orbit',
            'ru',
            'Последний трамвай на орбиту: Прощание у края безмолвного неба',
            'В последнюю ночь маршрута кондуктор везёт семерых пассажиров к орбитальной станции, отрицающей их прибытие.'
        ),
        (
            'paper-moon-protocol',
            'en',
            'Paper Moon Protocol',
            'A junior detective learns that every folded moon in the city marks a mystery that has not happened yet.'
        ),
        (
            'paper-moon-protocol',
            'ru',
            'Протокол бумажной луны',
            'Молодой детектив узнаёт, что каждая сложенная луна отмечает загадку, которая ещё не произошла.'
        ),
        (
            'glass-signal',
            'en',
            'Glass Signal',
            'Engineer Lira Sever sends a message through a crystal radio and hears a reply from the city one day in the future.'
        ),
        (
            'glass-signal',
            'ru',
            'Стеклянный сигнал',
            'Инженер Лира Север отправляет сообщение через кристальный приёмник и слышит ответ города из завтрашнего дня.'
        ),
        (
            'iron-orchard',
            'en',
            'Iron Orchard',
            'Gardeners defend a mechanical orchard whose fruit contains maps to places erased from history.'
        ),
        (
            'iron-orchard',
            'ru',
            'Железный сад',
            'Садовники защищают механический сад, в плодах которого спрятаны карты стёртых из истории мест.'
        )
) AS "seed" ("comic_slug", "locale", "title", "description")
JOIN "comics" ON "comics"."slug" = "seed"."comic_slug";

INSERT INTO "comic_creators" (
    "comic_id",
    "creator_id",
    "role",
    "sort_order"
)
SELECT
    "comics"."id",
    "creators"."id",
    "seed"."role"::"creator_role",
    "seed"."sort_order"
FROM (
    VALUES
        ('neon-harbor-1', 'nora-vale', 'WRITER', 0),
        ('neon-harbor-1', 'mika-tanaka', 'ARTIST', 0),
        ('neon-harbor-2', 'nora-vale', 'WRITER', 0),
        ('neon-harbor-2', 'alina-sever', 'ARTIST', 0),
        ('neon-harbor-3', 'nora-vale', 'WRITER', 0),
        ('neon-harbor-3', 'mika-tanaka', 'ARTIST', 0),
        ('clockwork-frontier-1', 'jonas-reed', 'WRITER', 0),
        ('clockwork-frontier-1', 'elias-voss', 'ARTIST', 0),
        ('clockwork-frontier-2', 'jonas-reed', 'WRITER', 0),
        ('clockwork-frontier-2', 'priya-nadir', 'WRITER', 1),
        ('clockwork-frontier-2', 'elias-voss', 'ARTIST', 0),
        ('clockwork-frontier-2', 'teo-markovic', 'ARTIST', 1),
        ('ember-archive-1', 'priya-nadir', 'WRITER', 0),
        ('ember-archive-1', 'teo-markovic', 'ARTIST', 0),
        ('last-tram-to-orbit', 'alina-sever', 'WRITER', 0),
        ('last-tram-to-orbit', 'alina-sever', 'ARTIST', 0),
        ('paper-moon-protocol', 'sofia-chen', 'WRITER', 0),
        ('paper-moon-protocol', 'mika-tanaka', 'ARTIST', 0),
        ('glass-signal', 'alina-sever', 'WRITER', 0),
        ('glass-signal', 'priya-nadir', 'ARTIST', 0),
        ('iron-orchard', 'priya-nadir', 'WRITER', 0),
        ('iron-orchard', 'nora-vale', 'WRITER', 1),
        ('iron-orchard', 'teo-markovic', 'ARTIST', 0)
) AS "seed" ("comic_slug", "creator_slug", "role", "sort_order")
JOIN "comics" ON "comics"."slug" = "seed"."comic_slug"
JOIN "creators" ON "creators"."slug" = "seed"."creator_slug";

INSERT INTO "comic_genres" ("comic_id", "genre_id")
SELECT "comics"."id", "genres"."id"
FROM (
    VALUES
        ('neon-harbor-1', 'science-fiction'),
        ('neon-harbor-1', 'mystery'),
        ('neon-harbor-1', 'retro-futurism'),
        ('neon-harbor-2', 'science-fiction'),
        ('neon-harbor-2', 'adventure'),
        ('neon-harbor-2', 'retro-futurism'),
        ('neon-harbor-3', 'science-fiction'),
        ('neon-harbor-3', 'mystery'),
        ('clockwork-frontier-1', 'adventure'),
        ('clockwork-frontier-1', 'fantasy'),
        ('clockwork-frontier-1', 'retro-futurism'),
        ('clockwork-frontier-2', 'adventure'),
        ('clockwork-frontier-2', 'drama'),
        ('clockwork-frontier-2', 'retro-futurism'),
        ('ember-archive-1', 'fantasy'),
        ('ember-archive-1', 'mystery'),
        ('ember-archive-1', 'drama'),
        ('last-tram-to-orbit', 'science-fiction'),
        ('last-tram-to-orbit', 'drama'),
        ('paper-moon-protocol', 'mystery'),
        ('paper-moon-protocol', 'fantasy'),
        ('glass-signal', 'science-fiction'),
        ('glass-signal', 'mystery'),
        ('iron-orchard', 'fantasy'),
        ('iron-orchard', 'drama'),
        ('iron-orchard', 'adventure')
) AS "seed" ("comic_slug", "genre_slug")
JOIN "comics" ON "comics"."slug" = "seed"."comic_slug"
JOIN "genres" ON "genres"."slug" = "seed"."genre_slug";

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM "users") <> 2 THEN
        RAISE EXCEPTION 'Auth seed must contain exactly 2 users';
    END IF;

    IF (SELECT COUNT(*) FROM "sessions") <> 0 THEN
        RAISE EXCEPTION 'Auth seed must not create sessions';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "users"
        WHERE "public_id" = 'usr_demo_user'
          AND "email" = 'user@qacomics.local'
          AND "display_name" = 'Demo User'
          AND "role" = 'USER'
          AND "enabled" = TRUE
    ) THEN
        RAISE EXCEPTION 'Demo user account is invalid';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "users"
        WHERE "public_id" = 'usr_demo_admin'
          AND "email" = 'admin@qacomics.local'
          AND "display_name" = 'Demo Admin'
          AND "role" = 'ADMIN'
          AND "enabled" = TRUE
    ) THEN
        RAISE EXCEPTION 'Demo admin account is invalid';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "users"
        WHERE "password_hash" IN (
            'DemoUserPassphrase2026!',
            'DemoAdminPassphrase2026!'
        )
    ) THEN
        RAISE EXCEPTION 'Demo account plaintext passwords must not be stored';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "users"
        WHERE "password_hash" !~ '^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
    ) THEN
        RAISE EXCEPTION 'Demo account password hashes must use the approved Argon2id PHC parameters';
    END IF;

    IF (SELECT COUNT(*) FROM "comics") <> 10 THEN
        RAISE EXCEPTION 'Catalog seed must contain exactly 10 comics';
    END IF;

    IF (SELECT COUNT(*) FROM "series") <> 3 THEN
        RAISE EXCEPTION 'Catalog seed must contain exactly 3 series';
    END IF;

    IF (SELECT COUNT(*) FROM "genres") <> 6 THEN
        RAISE EXCEPTION 'Catalog seed must contain exactly 6 genres';
    END IF;

    IF (SELECT COUNT(*) FROM "creators") <> 8 THEN
        RAISE EXCEPTION 'Catalog seed must contain exactly 8 creators';
    END IF;

    IF (SELECT COUNT(*) FROM "comics" WHERE "publication_state" = 'PUBLISHED') <> 8
        OR (SELECT COUNT(*) FROM "comics" WHERE "publication_state" = 'DRAFT') <> 1
        OR (SELECT COUNT(*) FROM "comics" WHERE "publication_state" = 'ARCHIVED') <> 1
    THEN
        RAISE EXCEPTION 'Catalog publication-state counts are invalid';
    END IF;

    IF (SELECT COUNT(*) FROM "comics" WHERE "series_id" IS NOT NULL) <> 6
        OR (SELECT COUNT(*) FROM "comics" WHERE "series_id" IS NULL) <> 4
    THEN
        RAISE EXCEPTION 'Catalog series and standalone counts are invalid';
    END IF;

    IF (SELECT COUNT(*) FROM "comic_translations") <> 20
        OR EXISTS (
            SELECT "comics"."id"
            FROM "comics"
            LEFT JOIN "comic_translations"
                ON "comic_translations"."comic_id" = "comics"."id"
            GROUP BY "comics"."id"
            HAVING COUNT(DISTINCT "comic_translations"."locale") <> 2
        )
    THEN
        RAISE EXCEPTION 'Every comic must have en and ru translations';
    END IF;

    IF EXISTS (
        SELECT "series"."id"
        FROM "series"
        LEFT JOIN "series_translations"
            ON "series_translations"."series_id" = "series"."id"
        GROUP BY "series"."id"
        HAVING COUNT(DISTINCT "series_translations"."locale") <> 2
    ) THEN
        RAISE EXCEPTION 'Every series must have en and ru translations';
    END IF;

    IF EXISTS (
        SELECT "genres"."id"
        FROM "genres"
        LEFT JOIN "genre_translations"
            ON "genre_translations"."genre_id" = "genres"."id"
        GROUP BY "genres"."id"
        HAVING COUNT(DISTINCT "genre_translations"."locale") <> 2
    ) THEN
        RAISE EXCEPTION 'Every genre must have en and ru translations';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "comics"
        WHERE "publication_state" = 'PUBLISHED'
          AND "stock_quantity" = 0
    ) THEN
        RAISE EXCEPTION 'A published out-of-stock scenario is required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "comics"
        WHERE "publication_state" = 'PUBLISHED'
          AND "stock_quantity" BETWEEN 1 AND 2
    ) THEN
        RAISE EXCEPTION 'A published limited-stock scenario is required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "comics"
        WHERE "compare_at_price_minor" IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'A comparison-price scenario is required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "comics"
        WHERE "publication_state" = 'PUBLISHED'
          AND "cover_path" IS NULL
    ) THEN
        RAISE EXCEPTION 'A published null-cover scenario is required';
    END IF;

    IF (SELECT COUNT(*) FROM "comics" WHERE "cover_path" IS NOT NULL) <> 8
        OR EXISTS (
            SELECT 1
            FROM "comics"
            WHERE "cover_path" IS NOT NULL
              AND "cover_path" NOT LIKE 'media/comics/%.png'
        )
    THEN
        RAISE EXCEPTION 'Catalog cover-path set is invalid';
    END IF;

    IF NOT EXISTS (
        SELECT "comic_id"
        FROM "comic_creators"
        GROUP BY "comic_id"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'A multi-creator comic is required';
    END IF;

    IF NOT EXISTS (
        SELECT "comic_id"
        FROM "comic_genres"
        GROUP BY "comic_id"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'A multi-genre comic is required';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "comics"
        WHERE "currency_code" <> 'USD'
    ) THEN
        RAISE EXCEPTION 'The initial catalog seed must use only USD';
    END IF;
END
$$;

COMMIT;
