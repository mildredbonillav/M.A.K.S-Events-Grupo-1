// =========================================
// GESTIÓN DE USUARIOS
// =========================================

let usuariosAdmin = [];
let usuarioEnEdicion = null;

async function initUsuarios() {
    await cargarUsuariosAdmin();

    const searchInput = document.getElementById("search-usuario");
    if (searchInput) {
        searchInput.addEventListener("input", filtrarUsuariosAdmin);
    }
}

async function cargarUsuariosAdmin() {
    try {
        const res = await fetch("/api/usuarios");
        const data = await res.json();

        if (data.success) {
            usuariosAdmin = data.usuarios; // ✅ AQUÍ está el arreglo
            renderUsuariosAdmin(usuariosAdmin);
        } else {
            alert("Error al cargar usuarios");
        }

    } catch (error) {
        console.error("Error cargando usuarios:", error);
        alert("Error al cargar usuarios");
    }
}


function renderUsuariosAdmin(usuarios) {
    const tbody = document.querySelector(".usuarios-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (usuarios.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="5" style="text-align:center;">No hay usuarios registrados</td></tr>';
        return;
    }

    usuarios.forEach(usuario => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${usuario.nombre}</td>
            <td>${usuario.apellidos}</td>
            <td>${usuario.correo}</td>
            <td>${usuario.rol}</td>
            <td>
                <button class="btn btn-edit" onclick="editarUsuario('${usuario._id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="eliminarUsuario('${usuario._id}')" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function filtrarUsuariosAdmin() {
    const texto = document
        .getElementById("search-usuario")
        .value.toLowerCase();

    const filtrados = usuariosAdmin.filter(usuario =>
        usuario.nombre.toLowerCase().includes(texto) ||
        usuario.apellidos.toLowerCase().includes(texto) ||
        usuario.correo.toLowerCase().includes(texto) ||
        usuario.rol.toLowerCase().includes(texto)
    );

    renderUsuariosAdmin(filtrados);
}

function showModalUsuario() {
    usuarioEnEdicion = null;

    const formContainer = document.getElementById("form-usuario-container");
    if (!formContainer) return;

    showModal(formContainer.innerHTML);

    setTimeout(() => {
        const modalForm = document.querySelector("#modal form");
        if (modalForm) modalForm.onsubmit = guardarUsuario;

        const titulo = document.querySelector("#modal form h3");
        if (titulo) titulo.textContent = "Nuevo Usuario";

        const btnCancelar = document.querySelector(
            "#modal button[onclick*='closeModalUsuario']"
        );
        if (btnCancelar) {
            btnCancelar.onclick = e => {
                e.preventDefault();
                closeModalUsuario();
            };
        }
    }, 100);
}

function closeModalUsuario() {
    closeModal();
}

async function guardarUsuario(e) {
    e.preventDefault();

    const nombre = document.querySelector("#modal #nombreUsuario").value.trim();
    const apellidos = document.querySelector("#modal #apellidosUsuario").value.trim();
    const correo = document.querySelector("#modal #correoUsuario").value.trim();
    const rol = document.querySelector("#modal #rolUsuario").value;
    const password = document.querySelector("#modal #passwordUsuario")?.value;

    if (!nombre || !apellidos || !correo) {
        alert("Nombre, apellidos y correo son obligatorios");
        return;
    }

    const data = { nombre, apellidos, correo, rol };

    // Solo enviar contraseña si se escribió
    if (password) {
        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        data.password = password;
    }

    try {
        let url = "/api/usuarios";
        let method = "POST";

        if (usuarioEnEdicion) {
            url = `/api/usuarios/${usuarioEnEdicion}`;
            method = "PUT";
        }

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            alert(usuarioEnEdicion
                ? "Usuario actualizado exitosamente"
                : "Usuario creado exitosamente"
            );
            closeModalUsuario();
            await cargarUsuariosAdmin();
        } else {
            alert(result.mensaje || "Error al guardar usuario");
        }

    } catch (error) {
        console.error("Error guardando usuario:", error);
        alert("Error al guardar usuario");
    }
}

async function editarUsuario(id) {
    try {
        const res = await fetch(`/api/usuarios/${id}`);
        const data = await res.json();

        if (!data.success) {
            alert("Error al cargar el usuario");
            return;
        }

        const usuario = data.usuario; // ✅ AQUÍ está el usuario real
        usuarioEnEdicion = id;

        const formContainer = document.getElementById("form-usuario-container");
        showModal(formContainer.innerHTML);

        setTimeout(() => {
            document.querySelector("#modal form h3").textContent = "Editar Usuario";

            document.querySelector("#modal #nombreUsuario").value = usuario.nombre || "";
            document.querySelector("#modal #apellidosUsuario").value = usuario.apellidos || "";
            document.querySelector("#modal #correoUsuario").value = usuario.correo || "";
            document.querySelector("#modal #rolUsuario").value = usuario.rol || "";

            const passwordInput = document.querySelector("#modal #passwordUsuario");
            if (passwordInput) passwordInput.value = "";

            document.querySelector("#modal form").onsubmit = guardarUsuario;

            const btnCancelar = document.querySelector(
                "#modal button[onclick*='closeModalUsuario']"
            );
            if (btnCancelar) {
                btnCancelar.onclick = e => {
                    e.preventDefault();
                    closeModalUsuario();
                };
            }
        }, 100);

    } catch (error) {
        console.error("Error cargando usuario:", error);
        alert("Error al cargar usuario");
    }
}


async function eliminarUsuario(id) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
        const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
        const result = await res.json();

        if (res.ok) {
            alert("Usuario eliminado exitosamente");
            await cargarUsuariosAdmin();
        } else {
            alert(result.mensaje || "Error al eliminar usuario");
        }

    } catch (error) {
        console.error("Error eliminando usuario:", error);
        alert("Error al eliminar usuario");
    }
}

// Exponer funciones globales
window.initUsuarios = initUsuarios;
window.showModalUsuario = showModalUsuario;
window.closeModalUsuario = closeModalUsuario;
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
