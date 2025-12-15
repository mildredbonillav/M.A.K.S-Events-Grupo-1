// =========================================
// GESTIÓN DE EVENTOS (Administración)
// =========================================

let eventosAdmin = [];
let artistasGlobal = [];
let organizadoresGlobal = [];
let categoriasGlobal = [];
let eventoEnEdicion = null;

async function initEventos() {
    await cargarArtistas();
    await cargarOrganizadores();
    await cargarCategoriasEventos();
    await cargarEventosAdmin();
    
    const searchInput = document.getElementById("search-evento");
    if (searchInput) {
        searchInput.addEventListener("input", filtrarEventosAdmin);
    }
}

async function cargarEventosAdmin() {
    try {
        const res = await fetch("/api/eventos");
        const data = await res.json();
        
        if (data.success) {
            eventosAdmin = data.eventos;
            renderEventosAdmin(eventosAdmin);
        }
    } catch (error) {
        console.error("Error cargando eventos:", error);
        alert("Error al cargar eventos");
    }
}

async function cargarArtistas() {
    try {
        const res = await fetch("/api/artistas");
        const data = await res.json();
        
        if (data.success) {
            artistasGlobal = data.artistas;
        }
    } catch (error) {
        console.error("Error cargando artistas:", error);
    }
}

async function cargarOrganizadores() {
    try {
        const res = await fetch("/api/organizadores");
        const data = await res.json();
        
        if (data.success) {
            organizadoresGlobal = data.organizadores;
        }
    } catch (error) {
        console.error("Error cargando organizadores:", error);
    }
}

async function cargarCategoriasEventos() {
    try {
        const res = await fetch("/api/categorias-eventos");
        const data = await res.json();
        
        if (data.success) {
            categoriasGlobal = data.categorias;
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

function renderEventosAdmin(eventos) {
    const tbody = document.querySelector(".eventos-table tbody");
    
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (eventos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay eventos registrados</td></tr>';
        return;
    }
    
    eventos.forEach(evento => {
        const tr = document.createElement("tr");
        
        const organizadorNombre = evento.organizador ? 
            `${evento.organizador.nombre || ""} ${evento.organizador.apellidos || ""}`.trim() : 
            "Sin organizador";
        
        const cantidadArtistas = evento.artistas ? evento.artistas.length : 0;
        const cantidadEntradas = evento.entradas ? evento.entradas.length : 0;
        
        tr.innerHTML = `
            <td>${evento.nombre}</td>
            <td>${organizadorNombre}</td>
            <td>${new Date(evento.fecha).toLocaleDateString()}</td>
            <td>${cantidadArtistas} artista(s)</td>
            <td>${cantidadEntradas} tipo(s)</td>
            <td>
                <button class="btn btn-edit" onclick="editarEvento('${evento._id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="eliminarEvento('${evento._id}')" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function filtrarEventosAdmin() {
    const searchInput = document.getElementById("search-evento");
    const texto = searchInput.value.toLowerCase();
    
    const eventosFiltrados = eventosAdmin.filter(evento => 
        evento.nombre.toLowerCase().includes(texto) ||
        (evento.organizador && 
         `${evento.organizador.nombre} ${evento.organizador.apellidos}`.toLowerCase().includes(texto))
    );
    
    renderEventosAdmin(eventosFiltrados);
}

function showModalEvento() {
    eventoEnEdicion = null;
    const formContainer = document.getElementById("form-evento-container");
    const form = document.getElementById("form-evento");
    
    if (!formContainer || !form) return;
    
    form.reset();
    document.querySelector("#form-evento h3").textContent = "Nuevo Evento";
    
    document.getElementById("lista-artistas").innerHTML = "";
    document.getElementById("lista-entradas").innerHTML = "";
    
    llenarSelectOrganizadores();
    llenarSelectCategorias();
    
    showModal(formContainer.innerHTML);
    
    setTimeout(() => {
        llenarSelectOrganizadores();
        llenarSelectCategorias();
        
        // Reconectar eventos de los botones
        const btnAgregarArtista = document.querySelector("#modal button[onclick*='agregarArtista']");
        if (btnAgregarArtista) {
            btnAgregarArtista.onclick = (e) => {
                e.preventDefault();
                agregarArtista();
            };
        }
        
        const btnAgregarEntrada = document.querySelector("#modal button[onclick*='agregarEntrada']");
        if (btnAgregarEntrada) {
            btnAgregarEntrada.onclick = (e) => {
                e.preventDefault();
                agregarEntrada();
            };
        }
        
        const btnCancelar = document.querySelector("#modal button[onclick*='closeModalEvento']");
        if (btnCancelar) {
            btnCancelar.onclick = (e) => {
                e.preventDefault();
                closeModalEvento();
            };
        }
        
        const modalForm = document.querySelector("#modal form");
        if (modalForm) {
            modalForm.onsubmit = guardarEvento;
        }
    }, 100);
}

function closeModalEvento() {
    closeModal();
}

function llenarSelectOrganizadores() {
    const select = document.querySelector("#modal #organizadorEvento");
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione organizador</option>';
    
    organizadoresGlobal.forEach(org => {
        const option = document.createElement("option");
        option.value = org._id;
        option.textContent = `${org.nombre} ${org.apellidos || ""}`.trim();
        select.appendChild(option);
    });
}

function llenarSelectCategorias() {
    const select = document.querySelector("#modal #categoriaEvento");
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione categoría</option>';
    
    categoriasGlobal.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat._id;
        option.textContent = cat.nombre;
        select.appendChild(option);
    });
}

window.agregarArtista = function() {
    const listaArtistas = document.querySelector("#modal #lista-artistas");
    if (!listaArtistas) return;
    
    const div = document.createElement("div");
    div.classList.add("artista-item");
    
    div.innerHTML = `
        <select class="artista-select">
            <option value="">Seleccione artista</option>
            ${artistasGlobal.map(art => 
                `<option value="${art._id}">${art.nombres} ${art.apellidos}</option>`
            ).join("")}
        </select>
        <button type="button" class="btn btn-remove">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Conectar evento del botón remove
    const btnRemove = div.querySelector('.btn-remove');
    btnRemove.onclick = () => div.remove();
    
    listaArtistas.appendChild(div);
};

function obtenerArtistasSeleccionados() {
    const selects = document.querySelectorAll(".artista-select");
    const artistas = [];
    
    selects.forEach(select => {
        if (select.value) {
            artistas.push(select.value);
        }
    });
    
    return artistas;
}

window.agregarEntrada = function() {
    const listaEntradas = document.querySelector("#modal #lista-entradas");
    if (!listaEntradas) return;
    
    const div = document.createElement("div");
    div.classList.add("entrada-item");
    
    div.innerHTML = `
        <input type="text" placeholder="Tipo (ej: General, VIP)" class="entrada-tipo" required>
        <input type="number" placeholder="Cantidad" class="entrada-cantidad" min="1" required>
        <input type="number" placeholder="Precio" class="entrada-precio" min="0" step="0.01" required>
        <button type="button" class="btn btn-remove">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Conectar evento del botón remove
    const btnRemove = div.querySelector('.btn-remove');
    btnRemove.onclick = () => div.remove();
    
    listaEntradas.appendChild(div);
};

function obtenerEntradasSeleccionadas() {
    const items = document.querySelectorAll(".entrada-item");
    const entradas = [];
    
    items.forEach(item => {
        const tipo = item.querySelector(".entrada-tipo").value;
        const cantidad = parseInt(item.querySelector(".entrada-cantidad").value);
        const precio = parseFloat(item.querySelector(".entrada-precio").value);
        
        if (tipo && cantidad && precio >= 0) {
            entradas.push({ tipo, cantidad_disponible: cantidad, precio });
        }
    });
    
    return entradas;
}

async function guardarEvento(e) {
    e.preventDefault();
    
    const nombreEvento = document.querySelector("#modal #nombreEvento").value;
    const fechaEvento = document.querySelector("#modal #fechaEvento").value;
    const categoriaEvento = document.querySelector("#modal #categoriaEvento")?.value || "";
    const descripcionEvento = document.querySelector("#modal #descripcionEvento")?.value || "";
    const lugarEvento = document.querySelector("#modal #lugarEvento")?.value || "";
    const organizadorEvento = document.querySelector("#modal #organizadorEvento").value;
    
    const artistas = obtenerArtistasSeleccionados();
    const entradas = obtenerEntradasSeleccionadas();
    
    if (!nombreEvento || !fechaEvento || !organizadorEvento) {
        alert("Por favor complete los campos requeridos");
        return;
    }
    
    const data = {
        nombre: nombreEvento,
        fecha: fechaEvento,
        categoria_id: categoriaEvento || null,
        descripcion: descripcionEvento,
        lugar: lugarEvento,
        organizador_id: organizadorEvento,
        artistas,
        entradas
    };
    
    try {
        let url = "/api/eventos";
        let method = "POST";
        
        if (eventoEnEdicion) {
            url = `/api/eventos/${eventoEnEdicion}`;
            method = "PUT";
        }
        
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (result.success) {
            alert(eventoEnEdicion ? "Evento actualizado exitosamente" : "Evento creado exitosamente");
            closeModalEvento();
            await cargarEventosAdmin();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Error guardando evento:", error);
        alert("Error al guardar el evento");
    }
}

async function editarEvento(id) {
    try {
        const res = await fetch(`/api/eventos/${id}`);
        const data = await res.json();
        
        if (!data.success) {
            alert("Error al cargar el evento");
            return;
        }
        
        eventoEnEdicion = id;
        const evento = data.evento;
        
        const formContainer = document.getElementById("form-evento-container");
        showModal(formContainer.innerHTML);
        
        setTimeout(() => {
            // Cambiar título
            const titulo = document.querySelector("#modal form h3");
            if (titulo) titulo.textContent = "Editar Evento";
            
            // Llenar campos básicos
            const nombreInput = document.querySelector("#modal #nombreEvento");
            const fechaInput = document.querySelector("#modal #fechaEvento");
            const descripcionInput = document.querySelector("#modal #descripcionEvento");
            const lugarInput = document.querySelector("#modal #lugarEvento");
            
            if (nombreInput) nombreInput.value = evento.nombre;
            if (fechaInput) fechaInput.value = evento.fecha.split("T")[0];
            if (descripcionInput) descripcionInput.value = evento.descripcion || "";
            if (lugarInput) lugarInput.value = evento.lugar || "";
            
            // Llenar selects
            llenarSelectOrganizadores();
            llenarSelectCategorias();
            
            const organizadorSelect = document.querySelector("#modal #organizadorEvento");
            const categoriaSelect = document.querySelector("#modal #categoriaEvento");
            
            if (evento.organizador && organizadorSelect) {
                organizadorSelect.value = evento.organizador._id;
            }
            
            if (evento.categoria && categoriaSelect) {
                categoriaSelect.value = evento.categoria._id;
            }
            
            // Agregar artistas
            if (evento.artistas && evento.artistas.length > 0) {
                evento.artistas.forEach(artista => {
                    agregarArtista();
                    const selects = document.querySelectorAll("#modal .artista-select");
                    const ultimoSelect = selects[selects.length - 1];
                    if (ultimoSelect) ultimoSelect.value = artista._id;
                });
            }
            
            // Agregar entradas
            if (evento.entradas && evento.entradas.length > 0) {
                evento.entradas.forEach(entrada => {
                    agregarEntrada();
                    const items = document.querySelectorAll("#modal .entrada-item");
                    const ultimoItem = items[items.length - 1];
                    
                    if (ultimoItem) {
                        const tipoInput = ultimoItem.querySelector(".entrada-tipo");
                        const cantidadInput = ultimoItem.querySelector(".entrada-cantidad");
                        const precioInput = ultimoItem.querySelector(".entrada-precio");
                        
                        if (tipoInput) tipoInput.value = entrada.tipo;
                        if (cantidadInput) cantidadInput.value = entrada.cantidad_disponible;
                        if (precioInput) precioInput.value = entrada.precio;
                    }
                });
            }
            
            // Reconectar eventos de los botones
            const btnAgregarArtista = document.querySelector("#modal button[onclick*='agregarArtista']");
            if (btnAgregarArtista) {
                btnAgregarArtista.onclick = (e) => {
                    e.preventDefault();
                    agregarArtista();
                };
            }
            
            const btnAgregarEntrada = document.querySelector("#modal button[onclick*='agregarEntrada']");
            if (btnAgregarEntrada) {
                btnAgregarEntrada.onclick = (e) => {
                    e.preventDefault();
                    agregarEntrada();
                };
            }
            
            const btnCancelar = document.querySelector("#modal button[onclick*='closeModalEvento']");
            if (btnCancelar) {
                btnCancelar.onclick = (e) => {
                    e.preventDefault();
                    closeModalEvento();
                };
            }
            
            // Reconfigurar submit
            const modalForm = document.querySelector("#modal form");
            if (modalForm) {
                modalForm.onsubmit = guardarEvento;
            }
        }, 100);
        
    } catch (error) {
        console.error("Error cargando evento:", error);
        alert("Error al cargar el evento");
    }
}

async function eliminarEvento(id) {
    if (!confirm("¿Estás seguro de eliminar este evento?")) {
        return;
    }
    
    try {
        const res = await fetch(`/api/eventos/${id}`, {
            method: "DELETE"
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert("Evento eliminado exitosamente");
            await cargarEventosAdmin();
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Error eliminando evento:", error);
        alert("Error al eliminar el evento");
    }
}

// Exponer funciones globalmente
window.initEventos = initEventos;
window.showModalEvento = showModalEvento;
window.closeModalEvento = closeModalEvento;
window.editarEvento = editarEvento;
window.eliminarEvento = eliminarEvento;