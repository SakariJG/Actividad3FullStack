const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'clave_secreta';
const TAREAS_FILE = 'tareas.json';
const USERS_FILE = 'usuarios.json';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de autenticación
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ mensaje: 'Token requerido' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ mensaje: 'Token inválido' });
        req.usuario = decoded;
        next();
    });
};

// Leer y escribir tareas
const leerTareas = async () => {
    try {
        const data = await fs.readFile(TAREAS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const guardarTareas = async (tareas) => {
    await fs.writeFile(TAREAS_FILE, JSON.stringify(tareas, null, 2));
};

// Rutas API REST
app.get('/tareas', verificarToken, async (req, res) => {
    const tareas = await leerTareas();
    res.json(tareas);
});

app.post('/tareas', verificarToken, async (req, res) => {
    const { titulo, descripcion } = req.body;
    if (!titulo || !descripcion) {
        return res.status(400).json({ mensaje: 'Título y descripción requeridos' });
    }
    const tareas = await leerTareas();
    const nuevaTarea = { id: tareas.length + 1, titulo, descripcion };
    tareas.push(nuevaTarea);
    await guardarTareas(tareas);
    res.status(201).json(nuevaTarea);
});

app.put('/tareas/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;
    const tareas = await leerTareas();
    const tarea = tareas.find(t => t.id == id);
    if (!tarea) return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    tarea.titulo = titulo || tarea.titulo;
    tarea.descripcion = descripcion || tarea.descripcion;
    await guardarTareas(tareas);
    res.json(tarea);
});

app.delete('/tareas/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    let tareas = await leerTareas();
    tareas = tareas.filter(t => t.id != id);
    await guardarTareas(tareas);
    res.json({ mensaje: 'Tarea eliminada' });
});

// Servir el frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
