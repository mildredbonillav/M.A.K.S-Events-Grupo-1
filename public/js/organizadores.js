// =========================================
// GESTIÓN DE ORGANIZADORES
// =========================================

let organizadoresAdmin = [];
let organizadorEnEdicion = null;

// =========================
// INIT
// =========================
async function initOrganizadores() {
    await cargarOrganizadoresAdmin();

    const searchInput = document.getElementById("search-organizador");
    if (searchInput) {
        searchInput.addEventListener("input", filtrarOrganizadoresAdmin);
    }
}

// =========================
// CARGAR
// =========================
async function cargarOrganizadoresAdmin() {
    try {
        const res = await fetch("/api/organizadores");
        const data = await res.json();

        if (data.success) {
            organizadoresAdmin = data.organizadores;
            renderOrganizadoresAdmin(organizadoresAdmin);
        } else {
            alert("Error al cargar organizadores");
        }
    } catch (error) {
        console.error("Error cargando organizadores:", error);
        alert("Error al cargar organizadores");
    }
}

// =========================
// RENDER
// =========================
function renderOrganizadoresAdmin(organizadores) {
    const tbody = document.querySelector(".organizadores-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (organizadores.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="5" style="text-align:center;">No hay organizadores registrados</td></tr>';
        return;
    }

    organizadores.forEach(org => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${org.nombre}</td>
            <td>${org.apellidos || "-"}</td>
            <td>${org.correo}</td>
            <td>${org.telefono || "-"}</td>
            <td>
                <button class="btn btn-edit" onclick="editarOrganizador('${org._id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="eliminarOrganizador('${org._id}')" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// =========================
// FILTRAR
// =========================
function filtrarOrganizadoresAdmin() {
    const texto = document
        .getElementById("search-organizador")
        .value.toLowerCase();

    const filtrados = organizadoresAdmin.filter(org =>
        org.nombre.toLowerCase().includes(texto) ||
        (org.apellidos && org.apellidos.toLowerCase().includes(texto)) ||
        org.correo.toLowerCase().includes(texto) ||
        (org.telefono && org.telefono.includes(texto))
    );

    renderOrganizadoresAdmin(filtrados);
}

// =========================
// MODAL NUEVO
// =========================
function showModalOrganizador() {
    organizadorEnEdicion = null;

    const formContainer = document.getElementById("form-organizador-container");
    if (!formContainer) return;

    showModal(formContainer.innerHTML);

    setTimeout(() => {
        document.querySelector("#modal form h3").textContent = "Nuevo Organizador";
        document.querySelector("#modal form").onsubmit = guardarOrganizador;

        const btnCancelar = document.querySelector(
            "#modal button[onclick*='closeModalOrganizador']"
        );
        if (btnCancelar) {
            btnCancelar.onclick = e => {
                e.preventDefault();
                closeModalOrganizador();
            };
        }
    }, 100);
}

function closeModalOrganizador() {
    closeModal();
}

// =========================
// GUARDAR
// =========================
async function guardarOrganizador(e) {
    e.preventDefault();

    const nombre = document.querySelector("#modal #nombreOrganizador").value.trim();
    const apellidos = document.querySelector("#modal #apellidosOrganizador").value.trim();
    const correo = document.querySelector("#modal #correoOrganizador").value.trim();
    const telefono = document.querySelector("#modal #telefonoOrganizador").value.trim();

    if (!nombre || !correo) {
        alert("Nombre y correo son obligatorios");
        return;
    }

    const data = { nombre, apellidos, correo, telefono };

    try {
        let url = "/api/organizadores";
        let method = "POST";

        if (organizadorEnEdicion) {
            url = `/api/organizadores/${organizadorEnEdicion}`;
            method = "PUT";
        }

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            alert(
                organizadorEnEdicion
                    ? "Organizador actualizado exitosamente"
                    : "Organizador creado exitosamente"
            );
            closeModalOrganizador();
            await cargarOrganizadoresAdmin();
        } else {
            alert(result.message || "Error al guardar organizador");
        }

    } catch (error) {
        console.error("Error guardando organizador:", error);
        alert("Error al guardar organizador");
    }
}

// =========================
// EDITAR
// =========================
async function editarOrganizador(id) {
    try {
        const res = await fetch(`/api/organizadores/${id}`);
        const data = await res.json();

        if (!data.success) {
            alert("Error al cargar organizador");
            return;
        }

        const org = data.organizador;
        organizadorEnEdicion = id;

        const formContainer = document.getElementById("form-organizador-container");
        showModal(formContainer.innerHTML);

        setTimeout(() => {
            document.querySelector("#modal form h3").textContent = "Editar Organizador";

            document.querySelector("#modal #nombreOrganizador").value = org.nombre || "";
            document.querySelector("#modal #apellidosOrganizador").value = org.apellidos || "";
            document.querySelector("#modal #correoOrganizador").value = org.correo || "";
            document.querySelector("#modal #telefonoOrganizador").value = org.telefono || "";

            document.querySelector("#modal form").onsubmit = guardarOrganizador;

            const btnCancelar = document.querySelector(
                "#modal button[onclick*='closeModalOrganizador']"
            );
            if (btnCancelar) {
                btnCancelar.onclick = e => {
                    e.preventDefault();
                    closeModalOrganizador();
                };
            }
        }, 100);

    } catch (error) {
        console.error("Error cargando organizador:", error);
        alert("Error al cargar organizador");
    }
}

// =========================
// ELIMINAR
// =========================
async function eliminarOrganizador(id) {
    if (!confirm("¿Estás seguro de eliminar este organizador?")) return;

    try {
        const res = await fetch(`/api/organizadores/${id}`, { method: "DELETE" });
        const result = await res.json();

        if (res.ok) {
            alert("Organizador eliminado exitosamente");
            await cargarOrganizadoresAdmin();
        } else {
            alert(result.message || "Error al eliminar organizador");
        }
    } catch (error) {
        console.error("Error eliminando organizador:", error);
        alert("Error al eliminar organizador");
    }
}

// =========================
// EXPONER
// =========================
window.initOrganizadores = initOrganizadores;
window.showModalOrganizador = showModalOrganizador;
window.closeModalOrganizador = closeModalOrganizador;
window.editarOrganizador = editarOrganizador;
window.eliminarOrganizador = eliminarOrganizador;
