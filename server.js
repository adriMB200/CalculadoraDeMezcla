import express from "express";
import pkg from "pg";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});


// ========== USUARIOS ==========

// Crear usuario
app.post("/api/usuarios", async (req, res) => {
    const { nombre } = req.body;
    const result = await pool.query(
        "INSERT INTO users (nombre) VALUES ($1) RETURNING *",
        [nombre]
    );
    res.json(result.rows[0]);
});

// Obtener todos los usuarios
app.get("/api/usuarios", async (req, res) => {
    const result = await pool.query("SELECT * FROM users ORDER BY id");
    res.json(result.rows);
});


// ========== MOTOS ==========

// Crear moto asociada a usuario
app.post("/api/motos", async (req, res) => {
    const { usuario_id, marca, modelo, anio } = req.body;
    const result = await pool.query(
        "INSERT INTO motos (usuario_id, marca, modelo, anio) VALUES ($1, $2, $3, $4) RETURNING *",
        [usuario_id, marca, modelo, anio]
    );
    res.json(result.rows[0]);
});

// Obtener motos de un usuario
app.get("/api/motos/:usuario_id", async (req, res) => {
    const { usuario_id } = req.params;
    const result = await pool.query(
        "SELECT * FROM motos WHERE usuario_id = $1 ORDER BY id",
        [usuario_id]
    );
    res.json(result.rows);
});


// ========== MANTENIMIENTOS ==========

// Añadir mantenimiento a una moto
app.post("/api/mantenimientos", async (req, res) => {
    const { moto_id, fecha, horas, descripcion } = req.body;
    const result = await pool.query(
        "INSERT INTO mantenimientos (moto_id, fecha, horas, descripcion) VALUES ($1, $2, $3, $4) RETURNING *",
        [moto_id, fecha, horas, descripcion]
    );
    res.json(result.rows[0]);
});

// Obtener mantenimientos de una moto
app.get("/api/mantenimientos/:moto_id", async (req, res) => {
    const { moto_id } = req.params;
    const result = await pool.query(
        "SELECT * FROM mantenimientos WHERE moto_id = $1 ORDER BY fecha DESC",
        [moto_id]
    );
    res.json(result.rows);
});


// ========== INICIAR SERVIDOR ==========
app.listen(3000, () => {
    console.log("✅ Servidor corriendo en http://localhost:3000");
});
