// =========================================
// GESTIÓN DE ARTISTAS
// =========================================

let artistasAdmin = [];
let artistaEnEdicion = null;

async function initArtistas() {
    await cargarArtistasAdmin();

    const searchInput = document.getElementById("search-artista");
    if (searchInput) {
        searchInput.addEventListener("input", filtrarArtistasAdmin);
    }
}

// =========================
// CARGAR ARTISTAS
// =========================
async function cargarArtistasAdmin() {
    try {
        const res = await fetch("/api/artistas");
        const data = await res.json();

        if (data.success) {
            artistasAdmin = data.artistas; // ✅ arreglo correcto
            renderArtistasAdmin(artistasAdmin);
        } else {
            alert("Error al cargar artistas");
        }

    } catch (error) {
        console.error("Error cargando artistas:", error);
        alert("Error al cargar artistas");
    }
}

// =========================
// RENDER TABLA
// =========================
function renderArtistasAdmin(artistas) {
    const tbody = document.querySelector(".artistas-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (artistas.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="3" style="text-align:center;">No hay artistas registrados</td></tr>';
        return;
    }

    artistas.forEach(artista => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${artista.nombres}</td>
            <td>${artista.apellidos}</td>
            <td>
                <button class="btn btn-edit" onclick="editarArtista('${artista._id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="eliminarArtista('${artista._id}')" title="Eliminar">
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
function filtrarArtistasAdmin() {
    const texto = document
        .getElementById("search-artista")
        .value.toLowerCase();

    const filtrados = artistasAdmin.filter(artista =>
        artista.nombres.toLowerCase().includes(texto) ||
        artista.apellidos.toLowerCase().includes(texto)
    );

    renderArtistasAdmin(filtrados);
}

// =========================
// MODAL NUEVO
// =========================
function showModalArtista() {
    artistaEnEdicion = null;

    const formContainer = document.getElementById("form-artista-container");
    if (!formContainer) return;

    showModal(formContainer.innerHTML);

    setTimeout(() => {
        const modalForm = document.querySelector("#modal form");
        if (modalForm) modalForm.onsubmit = guardarArtista;

        const titulo = document.querySelector("#modal form h3");
        if (titulo) titulo.textContent = "Nuevo Artista";

        const btnCancelar = document.querySelector(
            "#modal button[onclick*='closeModalArtista']"
        );
        if (btnCancelar) {
            btnCancelar.onclick = e => {
                e.preventDefault();
                closeModalArtista();
            };
        }
    }, 100);
}

function closeModalArtista() {
    closeModal();
}

// =========================
// GUARDAR (CREATE / UPDATE)
// =========================
async function guardarArtista(e) {
    e.preventDefault();

    const nombres = document.querySelector("#modal #nombresArtista").value.trim();
    const apellidos = document.querySelector("#modal #apellidosArtista").value.trim();

    if (!nombres || !apellidos) {
        alert("Nombres y apellidos son obligatorios");
        return;
    }

    const data = { nombres, apellidos };

    try {
        let url = "/api/artistas";
        let method = "POST";

        if (artistaEnEdicion) {
            url = `/api/artistas/${artistaEnEdicion}`;
            method = "PUT";
        }

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            alert(artistaEnEdicion
                ? "Artista actualizado exitosamente"
                : "Artista creado exitosamente"
            );
            closeModalArtista();
            await cargarArtistasAdmin();
        } else {
            alert(result.message || "Error al guardar artista");
        }

    } catch (error) {
        console.error("Error guardando artista:", error);
        alert("Error al guardar artista");
    }
}

// =========================
// EDITAR
// =========================
async function editarArtista(id) {
    try {
        const res = await fetch(`/api/artistas/${id}`);
        const data = await res.json();

        if (!data.success) {
            alert("Error al cargar el artista");
            return;
        }

        const artista = data.artista; // ✅ correcto
        artistaEnEdicion = id;

        const formContainer = document.getElementById("form-artista-container");
        showModal(formContainer.innerHTML);

        setTimeout(() => {
            document.querySelector("#modal form h3").textContent = "Editar Artista";

            document.querySelector("#modal #nombresArtista").value = artista.nombres || "";
            document.querySelector("#modal #apellidosArtista").value = artista.apellidos || "";

            document.querySelector("#modal form").onsubmit = guardarArtista;

            const btnCancelar = document.querySelector(
                "#modal button[onclick*='closeModalArtista']"
            );
            if (btnCancelar) {
                btnCancelar.onclick = e => {
                    e.preventDefault();
                    closeModalArtista();
                };
            }
        }, 100);

    } catch (error) {
        console.error("Error cargando artista:", error);
        alert("Error al cargar artista");
    }
}

// =========================
// ELIMINAR
// =========================
async function eliminarArtista(id) {
    if (!confirm("¿Estás seguro de eliminar este artista?")) return;

    try {
        const res = await fetch(`/api/artistas/${id}`, { method: "DELETE" });
        const result = await res.json();

        if (res.ok) {
            alert("Artista eliminado exitosamente");
            await cargarArtistasAdmin();
        } else {
            alert(result.message || "Error al eliminar artista");
        }

    } catch (error) {
        console.error("Error eliminando artista:", error);
        alert("Error al eliminar artista");
    }
}

// =========================
// EXPONER FUNCIONES
// =========================
window.initArtistas = initArtistas;
window.showModalArtista = showModalArtista;
window.closeModalArtista = closeModalArtista;
window.editarArtista = editarArtista;
window.eliminarArtista = eliminarArtista;
