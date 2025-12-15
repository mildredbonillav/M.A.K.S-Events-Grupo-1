let resenas = [];
let eventos = [];

// =========================
// INIT
// =========================
async function initResenas() {
    await cargarEventosResena();
    await cargarResenas();
}

// =========================
// EVENTOS
// =========================
async function cargarEventosResena() {
    try {
        const res = await fetch("/api/eventos");
        const data = await res.json();

        if (data.success) {
            eventos = data.eventos;
        }
    } catch (error) {
        console.error("Error cargando eventos:", error);
    }
}

// =========================
// RESEÑAS
// =========================
async function cargarResenas() {
    try {
        const res = await fetch("/api/comentarios");
        const data = await res.json();

        if (data.success) {
            resenas = data.comentarios;
            renderResenas();
        }
    } catch (error) {
        console.error("Error cargando reseñas:", error);
    }
}

// =========================
// RENDER
// =========================
function renderResenas() {
    const tbody = document.getElementById("tabla-comentarios");

    if (!tbody) {
        console.error("No existe #tabla-comentarios");
        return;
    }

    tbody.innerHTML = "";

    if (resenas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No hay reseñas
                </td>
            </tr>`;
        return;
    }

    resenas.forEach(r => {
        const estrellas = "⭐".repeat(r.calificacion);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.usuario?.nombre || ""} ${r.usuario?.apellidos || ""}</td>

            <td>${r.evento}</td>
            <td>${r.comentario}</td>
            <td>${estrellas}</td>
            <td>${new Date(r.createdAt).toLocaleDateString()}</td>
          
        `;

        tbody.appendChild(tr);
    });
}

// =========================
// MODAL
// =========================
function showModalResena() {
    const container = document.getElementById("form-comentario-container");

    if (!container) {
        console.error("No existe form-comentario-container");
        return;
    }

    showModal(container.innerHTML);

    setTimeout(() => {
        const select = document.querySelector("#modal #eventoCom");

        if (!select) {
            console.error("No existe el select eventoCom");
            return;
        }

        select.innerHTML = `<option value="">Seleccione un evento</option>`;

        eventos.forEach(e => {
            const opt = document.createElement("option");
            opt.value = e._id;
            opt.textContent = e.nombre || e.titulo || "Evento";
            select.appendChild(opt);
        });

        document.querySelector("#modal form").onsubmit = guardarResena;
    }, 50);
}

function closeModalResena() {
    closeModal();
}

// =========================
// GUARDAR
// =========================
async function guardarResena(e) {
    e.preventDefault();

    const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));

    if (!usuarioActual) {
        alert("Debes iniciar sesión para dejar una reseña");
        loadView("login");
        return;
    }

    const eventoSelect = document.querySelector("#modal #eventoCom");
    const comentarioInput = document.querySelector("#modal #textoCom");
    const calificacionSelect = document.querySelector("#modal #calificacionCom");

    if (!eventoSelect.value) {
        alert("Debe seleccionar un evento");
        return;
    }

    const eventoNombre =
        eventoSelect.options[eventoSelect.selectedIndex].text;

    const data = {
        usuario: usuarioActual._id,
        evento_id: eventoSelect.value,
        evento: eventoNombre,
        comentario: comentarioInput.value,
        calificacion: Number(calificacionSelect.value)
    };

    try {
        const res = await fetch("/api/comentarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            alert("Reseña guardada");
            closeModalResena();
            await cargarResenas();
        } else {
            alert(result.message || "Error al guardar reseña");
        }
    } catch (error) {
        console.error("Error guardando reseña:", error);
    }
}

// =========================
// ELIMINAR
// =========================
async function eliminarResena(id) {
    if (!confirm("¿Eliminar esta reseña?")) return;

    try {
        const res = await fetch(`/api/comentarios/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            await cargarResenas();
        }
    } catch (error) {
        console.error("Error eliminando reseña:", error);
    }
}

// =========================
// EXPONER
// =========================
window.initResenas = initResenas;
window.showModalResena = showModalResena;
window.closeModalResena = closeModalResena;
window.eliminarResena = eliminarResena;
