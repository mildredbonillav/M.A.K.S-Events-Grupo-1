// =========================================
// GESTIÓN DE CATEGORÍAS DE EVENTOS
// =========================================

let categoriasAdmin = [];
let categoriaEnEdicion = null;

async function initCategorias() {
    await cargarCategoriasAdmin();
    
    const searchInput = document.getElementById("search-categoria");
    if (searchInput) {
        searchInput.addEventListener("input", filtrarCategoriasAdmin);
    }
}

async function cargarCategoriasAdmin() {
    try {
        const res = await fetch("/api/categorias-eventos");
        const data = await res.json();
        
        if (data.success) {
            categoriasAdmin = data.categorias;
            renderCategoriasAdmin(categoriasAdmin);
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
        alert("Error al cargar categorías");
    }
}

function renderCategoriasAdmin(categorias) {
    const tbody = document.querySelector(".categorias-table tbody");
    
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (categorias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay categorías registradas</td></tr>';
        return;
    }
    
    categorias.forEach(categoria => {
        const tr = document.createElement("tr");
        
        tr.innerHTML = `
            <td>${categoria.nombre}</td>
            <td>${categoria.descripcion || 'Sin descripción'}</td>
            <td>
                <button class="btn btn-edit" onclick="editarCategoria('${categoria._id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="eliminarCategoria('${categoria._id}')" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function filtrarCategoriasAdmin() {
    const searchInput = document.getElementById("search-categoria");
    const texto = searchInput.value.toLowerCase();
    
    const categoriasFiltradas = categoriasAdmin.filter(categoria => 
        categoria.nombre.toLowerCase().includes(texto) ||
        (categoria.descripcion && categoria.descripcion.toLowerCase().includes(texto))
    );
    
    renderCategoriasAdmin(categoriasFiltradas);
}

function showModalCategoria() {
    categoriaEnEdicion = null;
    const formContainer = document.getElementById("form-categoria-container");
    const form = document.getElementById("form-categoria");
    
    if (!formContainer || !form) return;
    
    form.reset();
    document.querySelector("#form-categoria h3").textContent = "Nueva Categoría";
    
    showModal(formContainer.innerHTML);
    
    setTimeout(() => {
        const modalForm = document.querySelector("#modal form");
        if (modalForm) {
            modalForm.onsubmit = guardarCategoria;
        }
        
        const btnCancelar = document.querySelector("#modal button[onclick*='closeModalCategoria']");
        if (btnCancelar) {
            btnCancelar.onclick = (e) => {
                e.preventDefault();
                closeModalCategoria();
            };
        }
    }, 100);
}

function closeModalCategoria() {
    closeModal();
}

async function guardarCategoria(e) {
    e.preventDefault();
    
    const nombreCategoria = document.querySelector("#modal #nombreCategoria").value;
    const descripcionCategoria = document.querySelector("#modal #descripcionCategoria")?.value || "";
    
    if (!nombreCategoria) {
        alert("Por favor complete el nombre de la categoría");
        return;
    }
    
    const data = {
        nombre: nombreCategoria,
        descripcion: descripcionCategoria
    };
    
    try {
        let url = "/api/categorias-eventos";
        let method = "POST";
        
        if (categoriaEnEdicion) {
            url = `/api/categorias-eventos/${categoriaEnEdicion}`;
            method = "PUT";
        }
        
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        
        if (result.success) {
            alert(categoriaEnEdicion ? "Categoría actualizada exitosamente" : "Categoría creada exitosamente");
            closeModalCategoria();
            await cargarCategoriasAdmin();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Error guardando categoría:", error);
        alert("Error al guardar la categoría");
    }
}

async function editarCategoria(id) {
    try {
        const res = await fetch(`/api/categorias-eventos/${id}`);
        const data = await res.json();
        
        if (!data.success) {
            alert("Error al cargar la categoría");
            return;
        }
        
        categoriaEnEdicion = id;
        const categoria = data.categoria;
        
        const formContainer = document.getElementById("form-categoria-container");
        showModal(formContainer.innerHTML);
        
        setTimeout(() => {
            const titulo = document.querySelector("#modal form h3");
            if (titulo) titulo.textContent = "Editar Categoría";
            
            const nombreInput = document.querySelector("#modal #nombreCategoria");
            const descripcionInput = document.querySelector("#modal #descripcionCategoria");
            
            if (nombreInput) nombreInput.value = categoria.nombre;
            if (descripcionInput) descripcionInput.value = categoria.descripcion || "";
            
            const modalForm = document.querySelector("#modal form");
            if (modalForm) {
                modalForm.onsubmit = guardarCategoria;
            }
            
            const btnCancelar = document.querySelector("#modal button[onclick*='closeModalCategoria']");
            if (btnCancelar) {
                btnCancelar.onclick = (e) => {
                    e.preventDefault();
                    closeModalCategoria();
                };
            }
        }, 100);
        
    } catch (error) {
        console.error("Error cargando categoría:", error);
        alert("Error al cargar la categoría");
    }
}

async function eliminarCategoria(id) {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) {
        return;
    }
    
    try {
        const res = await fetch(`/api/categorias-eventos/${id}`, {
            method: "DELETE"
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert("Categoría eliminada exitosamente");
            await cargarCategoriasAdmin();
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Error eliminando categoría:", error);
        alert("Error al eliminar la categoría");
    }
}

// Exponer funciones globalmente
window.initCategorias = initCategorias;
window.showModalCategoria = showModalCategoria;
window.closeModalCategoria = closeModalCategoria;
window.editarCategoria = editarCategoria;
window.eliminarCategoria = eliminarCategoria;