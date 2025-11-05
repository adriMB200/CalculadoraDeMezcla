import express from "express";
import pkg from "pg";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json()); // Para leer JSON del body

// Configurar conexión a Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// 🟢 Endpoint de prueba
app.get("/api/test", async (req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
});

// 🟢 Ejemplo: obtener usuarios
app.get("/api/users", async (req, res) => {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
});

// 🟢 Ejemplo: insertar usuario
app.post("/api/users", async (req, res) => {
    const { name, age } = req.body;
    const result = await pool.query(
        "INSERT INTO users (name, age) VALUES ($1, $2) RETURNING *",
        [name, age]
    );
    res.json(result.rows[0]);
});

app.listen(3000, () => {
    console.log("✅ Servidor corriendo en http://localhost:3000");
});
