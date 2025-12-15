const usuarioId = "ID_DEL_USUARIO"; // Reemplaza con el id real del usuario

// Cargar notificaciones
async function cargarNotificaciones() {
  const res = await fetch(`/notificaciones/usuario/${usuarioId}`);
  const notis = await res.json();

  const lista = document.getElementById('lista-notificaciones');
  lista.innerHTML = '';

  notis.forEach(n => {
    const li = document.createElement('li');
    li.textContent = `[${n.tipo}] ${n.mensaje} - ${n.leida ? 'Leída' : 'No leída'}`;
    
    const btnLeer = document.createElement('button');
    btnLeer.textContent = 'Marcar como leída';
    btnLeer.onclick = async () => {
      await fetch(`/notificaciones/leer/${n._id}`, { method: 'PATCH' });
      cargarNotificaciones();
    };

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.onclick = async () => {
      await fetch(`/notificaciones/${n._id}`, { method: 'DELETE' });
      cargarNotificaciones();
    };

    li.appendChild(btnLeer);
    li.appendChild(btnEliminar);
    lista.appendChild(li);
  });
}

// Inicializar
cargarNotificaciones();
