// ========================================
// NAVEGACIÓN Y CAMBIO DE VISTAS
// ========================================
document.querySelectorAll(".sidebar .menu a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    document
      .querySelectorAll(".sidebar .menu a")
      .forEach((l) => l.classList.remove("active"));
    link.classList.add("active");

    const view = link.getAttribute("data-view");
    loadView(view);

    aplicarPermisosMenu();
  });
});

window.addEventListener("load", () => {
    aplicarPermisosMenu();
    renderDashboard()
});

function loadView(view) {
  const content = document.getElementById("content-area");


    fetch(`/views/${view}.html`)
      .then((res) => res.text())
      .then((html) => {
        content.innerHTML = html;

        // Inicializar funciones específicas según la vista
        if (view === "comprarEntradas") {
          initComprarEntradas();
        } else if (view === "login") {
          initLogin();
        } else if (view === "eventos") {
          if (typeof initEventos === "function") {
            initEventos();
          }
        }else if (view === "categorias") {
          if (typeof initCategorias === "function") {
            initCategorias();
          }
        }else if (view === "misEntradas") {
          initMisEntradas();
        } else if (view === "registroCliente") {
          initRegistro();
        } else if (view === "registroAsitencia") {
          initAsistencia();
        } else if (view === "usuarios") {
          if (typeof initUsuarios === "function") {
              initUsuarios();
          }
        } else if (view === "artistas") {
          if (typeof initArtistas === "function") {
            initArtistas();
          }
        } else if (view === "organizadores") {
          if (typeof initOrganizadores === "function") {
            initOrganizadores();
          }
        } else if (view === "comentarios") {
          if (typeof initResenas === "function") {
            initResenas();
          }
        }


      })
      .catch(
        (err) => (content.innerHTML = `<p>Error cargando la vista: ${view}</p>`)
      );
  }


// ========================================
// MODAL GENERAL
// ========================================
function showModal(html) {
  document.getElementById("modal-body").innerHTML = html;
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// ========================================
// COMPRAR ENTRADAS (Vista de Cliente)
// ========================================
let eventosCargados = [];

async function cargarEventosGeneral() {
  try {
    const res = await fetch("/api/eventos/disponibles");
    const data = await res.json();
    eventosCargados = data;
    renderEventos(data);
  } catch (err) {
    console.error(err);
  }
}

function renderEventos(lista) {
  const contenedor = document.querySelector(".eventos-list");
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = "<p>No hay eventos disponibles.</p>";
    return;
  }

  lista.forEach((ev) => {
    const card = document.createElement("div");
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    const usuario_id = usuario ? usuario._id : null;

    card.classList.add("evento-card");
    card.innerHTML = `
            <h3>${ev.nombre}</h3>
            <p><strong>Fecha:</strong> ${new Date(
              ev.fecha
            ).toLocaleDateString()}</p>
            <p><strong>Lugar:</strong> ${ev.lugar}</p>
            <p>${ev.descripcion}</p>
            <h4>Tipos de entrada</h4>
            <table class="entradas-table">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Precio</th>
                        <th>Disponibles</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${ev.entradas
                      .map(
                        (e) => `
                        <tr>
                            <td>${e.tipo}</td>
                            <td>$${e.precio}</td>
                            <td>${e.cantidad_disponible}</td>
                            <td>
                                <button class="btn btn-primary"
                                    onclick="window.openCompraModal('${ev._id}','${e.tipo}',${e.precio},${e.cantidad_disponible},'${usuario_id}')">
                                    Comprar
                                </button>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        `;
    contenedor.appendChild(card);
  });
}

function initComprarEntradas() {
  const searchInput = document.getElementById("search-evento");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const texto = e.target.value.toLowerCase();
      const filtrados = eventosCargados.filter((ev) =>
        ev.nombre.toLowerCase().includes(texto)
      );
      renderEventos(filtrados);
    });
  }

  cargarEventosGeneral();
}

// Abrir modal de compra.

function openCompraModal(evento_id, tipo, precio, cantidad_disponible) {
  const usuario = JSON.parse(localStorage.getItem("usuarioActual"));

  if (!usuario) {
    alert("Debes iniciar sesión para comprar entradas");
    loadView("login"); // opcional, llevar al login
    return;
  }

  const usuario_id = usuario._id;

  const html = `
        <h3>Comprar entrada: ${tipo}</h3>
        <p>Precio: $${precio}</p>
        <p>Disponibles: ${cantidad_disponible}</p>
        <label for="cantidad">Cantidad:</label>
        <input type="number" id="compra-cantidad" min="1" max="${cantidad_disponible}" value="1">
        <button class="btn btn-primary"
            onclick="window.confirmarCompra('${evento_id}','${tipo}',${precio},${cantidad_disponible},'${usuario_id}')">
            Confirmar compra
        </button>
    `;
  showModal(html);
}

// Confirmar compra y llamar a la API
window.confirmarCompra = async function (
  evento_id,
  tipo,
  precio,
  cantidad_disponible,
  usuario_id
) {
  // 🔹 Verificar de nuevo por seguridad
  if (!usuario_id) {
    alert("Debes iniciar sesión para comprar entradas.");
    closeModal();
    return;
  }

  const cantidad = parseInt(document.getElementById("compra-cantidad").value);

  if (cantidad <= 0 || cantidad > cantidad_disponible) {
    alert("Cantidad inválida");
    return;
  }

  try {
    const res = await fetch("/api/compras/comprar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento_id, tipo, cantidad, usuario_id }),
    });

    const data = await res.json();

    if (data.success) {
      alert(
        `¡Compra realizada! ${cantidad} entradas de tipo ${tipo} por $${
          cantidad * precio
        }`
      );
      closeModal();
      cargarEventosGeneral(); // actualizar stock
    } else {
      alert("Error al comprar: " + data.message);
    }
  } catch (err) {
    console.error("Error al llamar API:", err);
    alert("Error interno al comprar");
  }
};

// Exponer globalmente
window.openCompraModal = openCompraModal;
window.confirmarCompra = confirmarCompra;

// ========================================
// LOGIN
// ========================================
function initLogin() {
  const form = document.getElementById("form-login");
  const btn = document.getElementById("btn-login");
  const msg = document.getElementById("login-message");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;

    // Limpiar mensaje anterior
    msg.textContent = "";

    if (!correo || !password) {
      msg.textContent = "Por favor, completa todos los campos";
      return;
    }

    // Deshabilitar botón durante el login
    btn.disabled = true;
    btn.textContent = "Iniciando sesión...";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const data = await res.json();

      if (data.success) {
        msg.style.color = "#2ecc71";
        msg.textContent = `¡Bienvenido ${data.usuario.nombre} ${data.usuario.apellidos}!`;

        // Guardar solo el _id como string y la info necesaria
        const usuarioParaStorage = {
          _id: data.usuario._id.$oid || data.usuario._id, // si viene con $oid toma ese string
          nombre: data.usuario.nombre,
          apellidos: data.usuario.apellidos,
          correo: data.usuario.correo,
          rol: data.usuario.rol,
        };

        localStorage.setItem(
          "usuarioActual",
          JSON.stringify(usuarioParaStorage)
        );

        // Redirigir después de un breve delay
        setTimeout(() => {
           window.location.reload();

        }, 1000);
      } else {
        msg.textContent = data.message || "Correo o contraseña incorrectos";
        btn.disabled = false;
        btn.textContent = "Iniciar sesión";
      }
    } catch (err) {
      console.error("Error login:", err);
      
      // Mensaje más específico según el tipo de error
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        msg.textContent = "Error de conexión. Verifica que el servidor esté corriendo en http://localhost:3000";
      } else if (err.message.includes("404")) {
        msg.textContent = "Ruta no encontrada. Verifica que la API esté configurada correctamente.";
      } else {
        msg.textContent = `Error: ${err.message || "Error de conexión. Por favor, intenta nuevamente."}`;
      }
      
      btn.disabled = false;
      btn.textContent = "Iniciar sesión";
    }
  });
}

// ========================================
// MIS EVENTOS (Mis Entradas)
// ========================================
let misEventosCargados = [];

async function cargarMisEventos() {
  const usuarioStr = localStorage.getItem("usuarioActual");
  
  if (!usuarioStr) {
    const contenedor = document.getElementById("mis-eventos-list");
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #e74c3c; font-size: 16px;">Debes iniciar sesión para ver tus eventos</p>
        <button class="btn btn-primary" onclick="loadView('login')" style="margin-top: 15px;">
          Iniciar Sesión
        </button>
      </div>
    `;
    return;
  }

  let usuario;
  try {
    usuario = JSON.parse(usuarioStr);
  } catch (e) {
    console.error("Error parseando usuario:", e);
    const contenedor = document.getElementById("mis-eventos-list");
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #e74c3c; font-size: 16px;">Error al leer información de usuario. Por favor, inicia sesión nuevamente.</p>
        <button class="btn btn-primary" onclick="loadView('login')" style="margin-top: 15px;">
          Iniciar Sesión
        </button>
      </div>
    `;
    return;
  }

  // Obtener el ID del usuario (puede venir como string o objeto)
  let usuario_id = usuario._id;
  if (typeof usuario_id === 'object' && usuario_id !== null) {
    usuario_id = usuario_id.$oid || usuario_id.toString();
  }
  usuario_id = String(usuario_id);

  if (!usuario_id || usuario_id === 'null' || usuario_id === 'undefined') {
    const contenedor = document.getElementById("mis-eventos-list");
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #e74c3c; font-size: 16px;">No se encontró ID de usuario. Por favor, inicia sesión nuevamente.</p>
        <button class="btn btn-primary" onclick="loadView('login')" style="margin-top: 15px;">
          Iniciar Sesión
        </button>
      </div>
    `;
    return;
  }

  try {
    const res = await fetch(`/api/compras/mis-eventos/${usuario_id}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    if (data.success) {
      misEventosCargados = data.eventos;
      renderMisEventos(data.eventos);
    } else {
      const contenedor = document.getElementById("mis-eventos-list");
      contenedor.innerHTML = `<p style="text-align: center; padding: 20px; color: #e74c3c;">Error: ${data.message || 'Error desconocido'}</p>`;
    }
  } catch (err) {
    console.error("Error cargando mis eventos:", err);
    const contenedor = document.getElementById("mis-eventos-list");
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #e74c3c;">
        <p>Error al cargar tus eventos</p>
        <p style="font-size: 12px; color: #95a5a6; margin-top: 10px;">${err.message || 'Error de conexión'}</p>
        <button class="btn btn-primary" onclick="cargarMisEventos()" style="margin-top: 15px;">
          Reintentar
        </button>
      </div>
    `;
  }
}

function renderMisEventos(eventos) {
  const contenedor = document.getElementById("mis-eventos-list");
  
  if (!eventos || eventos.length === 0) {
    contenedor.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #7f8c8d; font-size: 16px;">No has comprado entradas para ningún evento aún</p>
        <button class="btn btn-primary" onclick="loadView('comprarEntradas')" style="margin-top: 15px;">
          Ver Eventos Disponibles
        </button>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = eventos.map(evento => {
    if (!evento.evento) {
      return ""; // Si no hay evento, no mostrar nada
    }

    const fechaEventoObj = new Date(evento.evento.fecha);
    const fechaFormateada = fechaEventoObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const lugarEvento = evento.evento.lugar || '';

    const comprasHTML = evento.compras.map(compra => {
      const precio = compra.precio || 0;
      const total = compra.total || (precio * compra.cantidad);
      
      // Escapar comillas para evitar errores en el onclick
      const nombreEventoEscapado = evento.evento.nombre.replace(/'/g, "\\'");
      const tipoEscapado = compra.tipo.replace(/'/g, "\\'");
      
      return `
        <tr>
          <td>${compra.tipo}</td>
          <td>${compra.cantidad}</td>
          <td>$${precio.toFixed(2)}</td>
          <td>$${total.toFixed(2)}</td>
          <td>
            <button class="btn btn-primary" 
              onclick="openDetalleEntradasModal('${nombreEventoEscapado}', '${tipoEscapado}', ${compra.cantidad}, ${precio}, ${total}, '${fechaFormateada}', '${lugarEvento.replace(/'/g, "\\'")}')">
              Ver
            </button>
          </td>
        </tr>
      `;
    }).join("");

    const totalEvento = evento.total_evento || 0;

    return `
      <div class="mis-evento-card">
        <h3>${evento.evento.nombre}</h3>
        <p><strong>Fecha:</strong> ${fechaFormateada}</p>
        <p><strong>Lugar:</strong> ${evento.evento.lugar || 'No especificado'}</p>
        ${evento.evento.descripcion ? `<p style="margin-top: 10px; color: #555;">${evento.evento.descripcion}</p>` : ''}
        
        <h4 style="margin-top: 20px; margin-bottom: 10px;">Entradas compradas</h4>
        <table class="entradas-usuario-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Precio c/u</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${comprasHTML}
          </tbody>
          <tfoot>
            <tr style="background-color: #ecf0f1; font-weight: bold;">
              <td colspan="3" style="text-align: right; padding-right: 15px;">Total del evento:</td>
              <td>$${totalEvento.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }).join("");
}

function initMisEntradas() {
  const searchInput = document.getElementById("buscar-mis-eventos");
  
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const texto = e.target.value.toLowerCase();
      const filtrados = misEventosCargados.filter(ev => {
        if (!ev.evento) return false;
        return ev.evento.nombre.toLowerCase().includes(texto) ||
               (ev.evento.lugar && ev.evento.lugar.toLowerCase().includes(texto));
      });
      renderMisEventos(filtrados);
    });
  }

  cargarMisEventos();
}

// Variables globales para el ticket
let ticketData = {
  nombreEvento: '',
  tipo: '',
  cantidad: 0,
  precio: 0,
  total: 0,
  fechaEvento: '',
  lugar: '',
  usuario: null
};

// Función para abrir el modal de detalles de entradas
function openDetalleEntradasModal(nombreEvento, tipo, cantidad, precio, total, fechaEvento = '', lugar = '') {
  // Guardar datos del ticket
  ticketData = {
    nombreEvento: nombreEvento,
    tipo: tipo,
    cantidad: cantidad,
    precio: precio,
    total: total,
    fechaEvento: fechaEvento,
    lugar: lugar,
    usuario: JSON.parse(localStorage.getItem("usuarioActual") || 'null')
  };

  document.getElementById("detalle-evento").value = nombreEvento;
  document.getElementById("detalle-tipo").value = tipo;
  document.getElementById("detalle-cantidad").value = cantidad;
  document.getElementById("detalle-precio").value = `$${precio.toFixed(2)}`;
  document.getElementById("detalle-total").value = `$${total.toFixed(2)}`;
  
  // Conectar botón de descarga
  const btnDescargar = document.querySelector("#detalle-entradas-modal .btn-primary");
  if (btnDescargar) {
    btnDescargar.onclick = descargarTicket;
  }
  
  const modal = document.getElementById("detalle-entradas-modal");
  modal.style.display = "flex";
}

// Función para cerrar el modal de detalles
function closeDetalleEntradasModal() {
  const modal = document.getElementById("detalle-entradas-modal");
  modal.style.display = "none";
}

// Función para manejar clics fuera del modal
function handleModalClick(event) {
  if (event.target.id === "detalle-entradas-modal") {
    closeDetalleEntradasModal();
  }
}

// Función para descargar el ticket
function descargarTicket() {
  if (!ticketData.nombreEvento) {
    alert("No hay información de ticket para descargar");
    return;
  }

  // Generar ID único para el ticket
  const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const fechaDescarga = new Date().toLocaleString('es-ES');
  
  // Obtener información del usuario
  const usuario = ticketData.usuario || { nombre: 'Usuario', apellidos: '', correo: '' };
  const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim() || 'Cliente';

  // Crear contenido HTML del ticket
  const ticketHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket - ${ticketData.nombreEvento}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .ticket-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 30px;
        }
        .ticket-header {
            text-align: center;
            border-bottom: 3px solid #3498db;
            padding-bottom: 20px;
            margin-bottom: 25px;
        }
        .ticket-header h1 {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .ticket-header .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
            margin-bottom: 5px;
        }
        .ticket-id {
            background: #ecf0f1;
            padding: 8px 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #555;
            margin-top: 10px;
            display: inline-block;
        }
        .ticket-section {
            margin-bottom: 25px;
        }
        .ticket-section h2 {
            color: #2c3e50;
            font-size: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #3498db;
            padding-left: 10px;
        }
        .ticket-info {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        .ticket-info:last-child {
            border-bottom: none;
        }
        .ticket-info-label {
            font-weight: 600;
            color: #555;
        }
        .ticket-info-value {
            color: #2c3e50;
            text-align: right;
        }
        .ticket-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .ticket-total {
            background: #3498db;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-top: 25px;
        }
        .ticket-total .label {
            font-size: 16px;
            margin-bottom: 5px;
        }
        .ticket-total .amount {
            font-size: 32px;
            font-weight: bold;
        }
        .ticket-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px dashed #bdc3c7;
            color: #7f8c8d;
            font-size: 12px;
        }
        .ticket-qr-placeholder {
            text-align: center;
            padding: 20px;
            background: #ecf0f1;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            color: #7f8c8d;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .ticket-container {
                box-shadow: none;
                border: 1px solid #ddd;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="ticket-header">
            <div class="logo">M.A.K.S Events</div>
            <h1>ENTRADA</h1>
            <div class="ticket-id">ID: ${ticketId}</div>
        </div>

        <div class="ticket-section">
            <h2>Información del Evento</h2>
            <div class="ticket-info">
                <span class="ticket-info-label">Evento:</span>
                <span class="ticket-info-value">${ticketData.nombreEvento}</span>
            </div>
            ${ticketData.fechaEvento ? `
            <div class="ticket-info">
                <span class="ticket-info-label">Fecha:</span>
                <span class="ticket-info-value">${ticketData.fechaEvento}</span>
            </div>
            ` : ''}
            ${ticketData.lugar ? `
            <div class="ticket-info">
                <span class="ticket-info-label">Lugar:</span>
                <span class="ticket-info-value">${ticketData.lugar}</span>
            </div>
            ` : ''}
        </div>

        <div class="ticket-section">
            <h2>Detalles de la Entrada</h2>
            <div class="ticket-details">
                <div class="ticket-info">
                    <span class="ticket-info-label">Tipo:</span>
                    <span class="ticket-info-value">${ticketData.tipo}</span>
                </div>
                <div class="ticket-info">
                    <span class="ticket-info-label">Cantidad:</span>
                    <span class="ticket-info-value">${ticketData.cantidad}</span>
                </div>
                <div class="ticket-info">
                    <span class="ticket-info-label">Precio unitario:</span>
                    <span class="ticket-info-value">$${ticketData.precio.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div class="ticket-section">
            <h2>Información del Comprador</h2>
            <div class="ticket-info">
                <span class="ticket-info-label">Nombre:</span>
                <span class="ticket-info-value">${nombreCompleto}</span>
            </div>
            ${usuario.correo ? `
            <div class="ticket-info">
                <span class="ticket-info-label">Correo:</span>
                <span class="ticket-info-value">${usuario.correo}</span>
            </div>
            ` : ''}
        </div>

        <div class="ticket-qr-placeholder">
            [Código QR para validación]<br>
            <small>ID: ${ticketId}</small>
        </div>

        <div class="ticket-total">
            <div class="label">Total Pagado</div>
            <div class="amount">$${ticketData.total.toFixed(2)}</div>
        </div>

        <div class="ticket-footer">
            <p><strong>M.A.K.S Events</strong></p>
            <p>Este ticket es válido para el evento indicado</p>
            <p>Fecha de emisión: ${fechaDescarga}</p>
            <p style="margin-top: 10px; font-size: 10px;">
                Presente este ticket en la entrada del evento.<br>
                Guarde este documento para su referencia.
            </p>
        </div>
    </div>
</body>
</html>
  `;

  // Crear blob y descargar
  const blob = new Blob([ticketHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ticket_${ticketData.nombreEvento.replace(/[^a-z0-9]/gi, '_')}_${ticketId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // También abrir en nueva ventana para imprimir
  const printWindow = window.open('', '_blank');
  printWindow.document.write(ticketHTML);
  printWindow.document.close();
  
  // Opcional: auto-imprimir después de un breve delay
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// Exponer funciones globalmente
window.openDetalleEntradasModal = openDetalleEntradasModal;
window.closeDetalleEntradasModal = closeDetalleEntradasModal;
window.handleModalClick = handleModalClick;
window.descargarTicket = descargarTicket;

// ========================================
// REGISTRO DE CLIENTE
// ========================================
function initRegistro() {
  const form = document.getElementById("form-registro");
  const btn = document.getElementById("btn-registro");
  const msg = document.getElementById("registro-message");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const correo = document.getElementById("correo-registro").value.trim();
    const password = document.getElementById("password-registro").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    // Limpiar mensaje anterior
    msg.textContent = "";
    msg.style.color = "red";

    // Validaciones del lado del cliente
    if (!nombre || !apellidos || !correo || !password || !passwordConfirm) {
      msg.textContent = "Todos los campos son requeridos";
      return;
    }

    if (password.length < 6) {
      msg.textContent = "La contraseña debe tener al menos 6 caracteres";
      return;
    }

    if (password !== passwordConfirm) {
      msg.textContent = "Las contraseñas no coinciden";
      return;
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      msg.textContent = "El formato del correo electrónico no es válido";
      return;
    }

    // Deshabilitar botón durante el registro
    btn.disabled = true;
    btn.textContent = "Registrando...";

    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellidos, correo, password }),
      });

      // Verificar si la respuesta es OK antes de parsear JSON
      if (!res.ok) {
        // Si la respuesta no es JSON, intentar leer como texto
        const text = await res.text();
        console.error("Error del servidor:", res.status, text);
        throw new Error(`Error ${res.status}: ${res.status === 404 ? 'Ruta no encontrada. Verifica que el servidor esté corriendo y la ruta sea correcta.' : text}`);
      }

      const data = await res.json();

      if (data.success) {
        msg.style.color = "#2ecc71";
        msg.textContent = `¡Registro exitoso! Bienvenido ${data.usuario.nombre} ${data.usuario.apellidos}`;
        
        // Guardar usuario en localStorage y redirigir al login
        setTimeout(() => {
          alert(`¡Cuenta creada exitosamente! Por favor, inicia sesión con tus credenciales.`);
          loadView("login");
        }, 1500);
      } else {
        msg.textContent = data.message || "Error al registrar usuario";
        btn.disabled = false;
        btn.textContent = "Registrarse";
      }
    } catch (err) {
      console.error("Error en registro:", err);
      
      // Mensaje más específico según el tipo de error
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        msg.textContent = "Error de conexión. Verifica que el servidor esté corriendo en http://localhost:3000";
      } else if (err.message.includes("404")) {
        msg.textContent = "Ruta no encontrada. Verifica que la API esté configurada correctamente.";
      } else {
        msg.textContent = `Error: ${err.message || "Error de conexión. Por favor, intenta nuevamente."}`;
      }
      
      btn.disabled = false;
      btn.textContent = "Registrarse";
    }
  });
}

// ========================================
// REGISTRO DE ASISTENCIA
// ========================================
let eventosDisponibles = [];
let participantesCargados = [];
let eventoSeleccionado = null;

async function cargarEventos() {
  try {
    const res = await fetch("/api/asistencia/eventos");
    
    // Verificar si la respuesta es OK antes de parsear JSON
    if (!res.ok) {
      const text = await res.text();
      console.error("Error del servidor:", res.status, text);
      
      if (res.status === 404) {
        mostrarMensaje("Ruta no encontrada. Por favor, reinicia el servidor (node app.js) para cargar las nuevas rutas.", "error");
      } else {
        mostrarMensaje(`Error ${res.status} al cargar eventos. Verifica que el servidor esté corriendo.`, "error");
      }
      return;
    }
    
    const data = await res.json();

    if (data.success) {
      eventosDisponibles = data.eventos;
      const select = document.getElementById("select-evento");
      
      // Limpiar opciones excepto la primera
      select.innerHTML = '<option value="">Seleccione un evento</option>';
      
      // Agregar eventos al select
      if (data.eventos && data.eventos.length > 0) {
        data.eventos.forEach(evento => {
          const option = document.createElement("option");
          option.value = evento._id;
          const fecha = new Date(evento.fecha).toLocaleDateString('es-ES');
          option.textContent = `${evento.nombre} - ${fecha}`;
          select.appendChild(option);
        });
      } else {
        mostrarMensaje("No hay eventos disponibles", "error");
      }
    } else {
      mostrarMensaje("Error al cargar eventos: " + (data.message || "Error desconocido"), "error");
    }
  } catch (err) {
    console.error("Error cargando eventos:", err);
    
    if (err.message.includes("Unexpected token") || err.message.includes("<!DOCTYPE")) {
      mostrarMensaje("Error: El servidor devolvió HTML en lugar de JSON. Por favor, reinicia el servidor (node app.js).", "error");
    } else if (err.message.includes("Failed to fetch")) {
      mostrarMensaje("Error de conexión. Verifica que el servidor esté corriendo en http://localhost:3000", "error");
    } else {
      mostrarMensaje("Error de conexión al cargar eventos: " + err.message, "error");
    }
  }
}

async function cargarParticipantes(eventoId) {
  if (!eventoId) {
    const tbody = document.getElementById("participantes-body");
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #7f8c8d;">
          Seleccione un evento para ver los participantes
        </td>
      </tr>
    `;
    document.getElementById("btn-guardar-asistencia").disabled = true;
    return;
  }

  try {
    const res = await fetch(`/api/asistencia/participantes/${eventoId}`);
    
    // Verificar si la respuesta está OK antes de parsear JSON
    if (!res.ok) {
      const text = await res.text();
      console.error("Error del servidor:", res.status, text);
      
      if (res.status === 404) {
        mostrarMensaje("Ruta no encontrada. Por favor, reinicia el servidor.", "error");
      } else {
        mostrarMensaje(`Error ${res.status} al cargar participantes.`, "error");
      }
      
      const tbody = document.getElementById("participantes-body");
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 20px; color: #e74c3c;">
            Error al cargar participantes
          </td>
        </tr>
      `;
      return;
    }
    
    const data = await res.json();

    if (data.success) {
      participantesCargados = data.participantes;
      renderParticipantes(data.participantes);
      document.getElementById("btn-guardar-asistencia").disabled = false;
    } else {
      mostrarMensaje("Error al cargar participantes: " + (data.message || "Error desconocido"), "error");
      const tbody = document.getElementById("participantes-body");
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 20px; color: #e74c3c;">
            ${data.message || "No se pudieron cargar los participantes"}
          </td>
        </tr>
      `;
    }
  } catch (err) {
    console.error("Error cargando participantes:", err);
    
    if (err.message.includes("Unexpected token") || err.message.includes("<!DOCTYPE")) {
      mostrarMensaje("Error: El servidor devolvió HTML. Por favor, reinicia el servidor.", "error");
    } else {
      mostrarMensaje("Error de conexión al cargar participantes: " + err.message, "error");
    }
  }
}

function renderParticipantes(participantes) {
  const tbody = document.getElementById("participantes-body");

  if (!participantes || participantes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #7f8c8d;">
          No hay participantes registrados para este evento
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = participantes.map(p => `
    <tr>
      <td>${p.nombre}</td>
      <td>${p.apellidos}</td>
      <td>${p.correo}</td>
      <td>
        <input 
          type="checkbox" 
          class="asistencia-checkbox" 
          data-usuario-id="${p._id}"
          ${p.asistio ? 'checked' : ''}
        >
      </td>
    </tr>
  `).join("");
}

function filtrarParticipantes() {
  const busqueda = document.getElementById("buscar-participante").value.toLowerCase();
  
  if (!busqueda) {
    renderParticipantes(participantesCargados);
    return;
  }

  const filtrados = participantesCargados.filter(p => 
    p.nombre.toLowerCase().includes(busqueda) ||
    p.apellidos.toLowerCase().includes(busqueda) ||
    p.correo.toLowerCase().includes(busqueda)
  );

  renderParticipantes(filtrados);
}

async function guardarAsistencia() {
  const eventoId = document.getElementById("select-evento").value;
  
  if (!eventoId) {
    mostrarMensaje("Por favor, seleccione un evento", "error");
    return;
  }

  const checkboxes = document.querySelectorAll('.asistencia-checkbox');
  const asistencias = [];

  checkboxes.forEach(checkbox => {
    asistencias.push({
      usuario_id: checkbox.getAttribute('data-usuario-id'),
      asistio: checkbox.checked
    });
  });

  if (asistencias.length === 0) {
    mostrarMensaje("No hay participantes para guardar", "error");
    return;
  }

  const btn = document.getElementById("btn-guardar-asistencia");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    const res = await fetch("/api/asistencia/registrar-multiple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evento_id: eventoId,
        asistencias: asistencias
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }

    const data = await res.json();

    if (data.success) {
      mostrarMensaje(
        `✅ ${data.message}${data.errores && data.errores.length > 0 ? `. ${data.errores.length} errores` : ''}`,
        "success"
      );
      
      // Recargar participantes para actualizar el estado
      setTimeout(() => {
        cargarParticipantes(eventoId);
      }, 1000);
    } else {
      mostrarMensaje("Error: " + (data.message || "Error desconocido"), "error");
    }
  } catch (err) {
    console.error("Error guardando asistencia:", err);
    mostrarMensaje("Error de conexión al guardar asistencia", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar Asistencia";
  }
}

function mostrarMensaje(mensaje, tipo) {
  const msgDiv = document.getElementById("asistencia-message");
  msgDiv.textContent = mensaje;
  msgDiv.style.display = "block";
  
  if (tipo === "success") {
    msgDiv.style.backgroundColor = "#d4edda";
    msgDiv.style.color = "#155724";
    msgDiv.style.border = "1px solid #c3e6cb";
  } else {
    msgDiv.style.backgroundColor = "#f8d7da";
    msgDiv.style.color = "#721c24";
    msgDiv.style.border = "1px solid #f5c6cb";
  }

  // Ocultar mensaje después de 5 segundos
  setTimeout(() => {
    msgDiv.style.display = "none";
  }, 5000);
}

function initAsistencia() {
  const selectEvento = document.getElementById("select-evento");
  const buscarInput = document.getElementById("buscar-participante");
  const btnGuardar = document.getElementById("btn-guardar-asistencia");

  // Cargar eventos al inicializar
  cargarEventos();

  // Event listener para cambio de evento
  if (selectEvento) {
    selectEvento.addEventListener("change", (e) => {
      eventoSeleccionado = e.target.value;
      cargarParticipantes(e.target.value);
      buscarInput.value = ""; // Limpiar búsqueda
    });
  }

  // Event listener para búsqueda
  if (buscarInput) {
    buscarInput.addEventListener("input", filtrarParticipantes);
  }

  // Event listener para botón guardar
  if (btnGuardar) {
    btnGuardar.addEventListener("click", guardarAsistencia);
  }
}

// Exponer funciones globalmente (por si se usan en el HTML)
window.cargarParticipantes = cargarParticipantes;
window.filtrarParticipantes = filtrarParticipantes;
window.guardarAsistencia = guardarAsistencia;

function cerrarSesion() {
    if (!confirm("¿Deseas cerrar sesión?")) return;

    // Eliminar usuario del localStorage
    localStorage.removeItem("usuarioActual");

    alert("Sesión cerrada correctamente");
    aplicarPermisosMenu();


}
function aplicarPermisosMenu() {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    const rol = usuario?.rol || "publico";

    document.querySelectorAll(".menu a").forEach(link => {
        const rolesPermitidos = link.dataset.roles;

        if (!rolesPermitidos) {
            link.style.display = "none";
            return;
        }

        const rolesArray = rolesPermitidos.split(",");

        if (rolesArray.includes(rol) || rolesArray.includes("publico")) {
            link.style.display = "flex";
        } else {
            link.style.display = "none";
        }
    });
}
function renderDashboard() {
    const container = document.getElementById("dashboard-cards");
    const user = JSON.parse(localStorage.getItem("usuarioActual"));

    container.innerHTML = "";

    if (!user) {
        container.innerHTML = `
            <div class="info-box">
                <i class="fas fa-info-circle"></i>
                <p>Inicia sesión para acceder a todas las funciones.</p>
            </div>
        `;
        return;
    }

    const accionesPorRol = {
        admin: [
            { icon: "fa-users", text: "Usuarios", view: "usuarios" },
            { icon: "fa-calendar-alt", text: "Eventos", view: "eventos" },
            { icon: "fa-microphone", text: "Artistas", view: "artistas" }
        ],
        asistente: [
            { icon: "fa-calendar-check", text: "Registrar asistencia", view: "registroAsitencia" }
        ],
        cliente: [
            { icon: "fa-ticket-alt", text: "Mis eventos", view: "misEntradas" },
            { icon: "fa-star", text: "Reseñar eventos", view: "comentarios" }
        ]
    };

    const acciones = accionesPorRol[user.rol] || [];

    if (acciones.length === 0) {
        container.innerHTML = `
            <div class="info-box">
                <p>No hay acciones disponibles para tu rol.</p>
            </div>
        `;
        return;
    }

    acciones.forEach(a => {
        const card = document.createElement("div");
        card.className = "card";
        card.onclick = () => loadView(a.view);

        card.innerHTML = `
            <i class="fas ${a.icon}"></i>
            <h3>${a.text}</h3>
        `;

        container.appendChild(card);
    });
}
