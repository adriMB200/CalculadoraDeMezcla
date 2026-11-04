-- ENDURO_NALON_AUTORIA_V15
-- ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
-- Fundador y responsable del proyecto: Adrian Martis Blanco
-- GitHub: https://github.com/adriMB200
-- Web: https://enduronalon.netlify.app/
-- Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
-- Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.

CREATE TABLE "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"content" text DEFAULT '' NOT NULL
);
