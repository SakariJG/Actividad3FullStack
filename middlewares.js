const jwt = require('jsonwebtoken');
const SECRET_KEY = 'clave_secreta';

function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ mensaje: 'Token requerido' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ mensaje: 'Token inválido' });
        req.usuario = decoded;
        next();
    });
}

module.exports = { verificarToken };
