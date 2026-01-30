import { pgTable, text, varchar, integer, serial } from 'drizzle-orm/pg-core';

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
    horas: integer().notNull(),
    descripcion: text().notNull(),
});
