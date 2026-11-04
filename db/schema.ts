/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

import { pgTable, text, varchar, integer, serial, doublePrecision } from 'drizzle-orm/pg-core';

export const motos = pgTable('motos', {
    matricula: varchar({ length: 20 }).primaryKey(),
    marca: varchar({ length: 50 }).notNull(),
    modelo: varchar({ length: 50 }).notNull(),
    anio: integer().notNull(),
});

export const mantenimientos = pgTable('mantenimientos', {
    id: serial('id').primaryKey(),
    matricula: varchar({ length: 20 }).notNull(),
    fecha: text().notNull(),
    horas: integer(),
    kilometros: integer(),
    unidad: varchar({ length: 2 }).notNull().default('h'),
    descripcion: text().notNull(),
});

export const playingWithNeon = pgTable('playing_with_neon', {
    id: serial('id').primaryKey(),
    name: text().notNull(),
    plate: varchar({ length: 7 }).notNull(),
    hours: doublePrecision().notNull(),
    model: varchar({ length: 50 }).notNull(),
});
