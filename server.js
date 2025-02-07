const express = require('express');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

app.use(express.json()); // Middleware para parsear JSON en las solicitudes

const tareasFile = 'tareas.json';
const usersFile = 'usuarios.json';
const SECRET_KEY = 'clave_secreta';

// Funciones para manejar archivos JSON
async function obtenerTareas() {
  try {
    const data = await fs.readFile(tareasFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function guardarTareas(tareas) {
  await fs.writeFile(tareasFile, JSON.stringify(tareas, null, 2));
}

async function obtenerUsuarios() {
  try {
    const data = await fs.readFile(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function guardarUsuarios(usuarios) {
  await fs.writeFile(usersFile, JSON.stringify(usuarios, null, 2));
}

// Middleware para manejar errores
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ocurrió un error en el servidor' });
};

// Middleware de autenticación
function autenticarToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Acceso denegado' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Registro de usuario
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validación de datos
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    const usuarios = await obtenerUsuarios();
    const usuarioExistente = usuarios.find(u => u.username === username);

    if (usuarioExistente) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    usuarios.push({ username, password: hashedPassword });
    await guardarUsuarios(usuarios);

    res.status(201).json({ message: 'Usuario registrado' });
  } catch (error) {
    console.error('Error en /register:', error);
    res.status(500).json({ message: 'Error interno al registrar usuario' });
  }
});

// Inicio de sesión
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validación de datos
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    const usuarios = await obtenerUsuarios();
    const usuario = usuarios.find(u => u.username === username);

    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Generación del token
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ message: 'Error interno al iniciar sesión' });
  }
});

// Obtener todas las tareas (Protegida)
app.get('/tareas', autenticarToken, async (req, res) => {
  const tareas = await obtenerTareas();
  res.json(tareas);
});

// Agregar una nueva tarea (Protegida)
app.post('/tareas', autenticarToken, async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;

    if (!titulo || !descripcion) {
      return res.status(400).json({ message: 'Título y descripción son requeridos' });
    }

    const tareas = await obtenerTareas();
    const nuevaTarea = {
      id: tareas.length ? tareas[tareas.length - 1].id + 1 : 1,
      titulo,
      descripcion
    };

    tareas.push(nuevaTarea);
    await guardarTareas(tareas);

    res.status(201).json({ message: 'Tarea creada', tarea: nuevaTarea });
  } catch (error) {
    console.error('Error en /tareas (POST):', error);
    res.status(500).json({ message: 'Error al agregar la tarea' });
  }
});

// Actualizar una tarea (Protegida)
app.put('/tareas/:id', autenticarToken, async (req, res) => {
  try {
    const tareaId = parseInt(req.params.id);
    const { titulo, descripcion } = req.body;

    let tareas = await obtenerTareas();
    const index = tareas.findIndex(t => t.id === tareaId);

    if (index === -1) return res.status(404).json({ message: 'Tarea no encontrada' });

    tareas[index] = { ...tareas[index], titulo, descripcion };
    await guardarTareas(tareas);

    res.json({ message: 'Tarea actualizada', tarea: tareas[index] });
  } catch (error) {
    console.error('Error en /tareas/:id (PUT):', error);
    res.status(500).json({ message: 'Error al actualizar la tarea' });
  }
});

// Eliminar una tarea (Protegida)
app.delete('/tareas/:id', autenticarToken, async (req, res) => {
  try {
    const tareaId = parseInt(req.params.id);
    let tareas = await obtenerTareas();
    const newTareas = tareas.filter(t => t.id !== tareaId);

    if (tareas.length === newTareas.length) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    await guardarTareas(newTareas);
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    console.error('Error en /tareas/:id (DELETE):', error);
    res.status(500).json({ message: 'Error al eliminar la tarea' });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Servidor en funcionamiento!');
});

// Ruta que genera un error para pruebas
app.get('/error', (req, res, next) => {
  next(new Error('Este es un error simulado'));
});

// Middleware de manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
