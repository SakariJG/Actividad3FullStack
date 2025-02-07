const token = "TU_TOKEN_AQUI"; // Reemplázalo con un token válido

const cargarTareas = async () => {
    const response = await fetch('/tareas', {
        headers: { "Authorization": token }
    });
    const tareas = await response.json();
    mostrarTareas(tareas);
};

const mostrarTareas = (tareas) => {
    const lista = document.getElementById('listaTareas');
    lista.innerHTML = '';
    tareas.forEach(tarea => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${tarea.titulo}:</strong> ${tarea.descripcion}
            <button onclick="editarTarea(${tarea.id})">Editar</button>
            <button onclick="eliminarTarea(${tarea.id})">Eliminar</button>
        `;
        lista.appendChild(li);
    });
};

const agregarTarea = async () => {
    const titulo = document.getElementById('titulo').value;
    const descripcion = document.getElementById('descripcion').value;

    if (!titulo || !descripcion) {
        alert("Todos los campos son obligatorios");
        return;
    }

    const response = await fetch('/tareas', {
        method: 'POST',
        headers: {
            "Authorization": token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ titulo, descripcion })
    });

    if (response.ok) {
        cargarTareas();
    }
};

const editarTarea = async (id) => {
    const nuevoTitulo = prompt("Nuevo título:");
    const nuevaDescripcion = prompt("Nueva descripción:");

    if (!nuevoTitulo || !nuevaDescripcion) return;

    await fetch(`/tareas/${id}`, {
        method: 'PUT',
        headers: {
            "Authorization": token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ titulo: nuevoTitulo, descripcion: nuevaDescripcion })
    });

    cargarTareas();
};

const eliminarTarea = async (id) => {
    await fetch(`/tareas/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": token }
    });

    cargarTareas();
};

window.onload = cargarTareas;
