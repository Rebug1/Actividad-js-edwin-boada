let tareas = [];
let filtroActual = "todas";
const URL_API_TAREAS = "http://localhost:8000/api/tareas";

const formularioTarea = document.getElementById("formulario-tarea");
const entradaTarea = document.getElementById("entrada-tarea");
const listaTareas = document.getElementById("lista-tareas");
const estadisticas = document.getElementById("estadisticas");
const botonesFiltro = document.querySelectorAll(".filtros button");

formularioTarea.addEventListener("submit", (evento) => {
  evento.preventDefault();
  agregarTarea();
});

botonesFiltro.forEach((boton) => {
  boton.addEventListener("click", () => {
    filtroActual = boton.dataset.filtro;
    actualizarFiltroActivo();
    renderizarTareas(obtenerTareasFiltradas());
  });
});

async function cargarTareas() {
  try {
    const respuesta = await fetch(URL_API_TAREAS);
    tareas = await respuesta.json();
    renderizarTareas(obtenerTareasFiltradas());
  } catch (error) {
    mostrarError("No se pudieron cargar las tareas desde el JSON.");
  }
}

async function agregarTarea() {
  const texto = entradaTarea.value.trim();

  if (texto === "") {
    entradaTarea.focus();
    return;
  }

  try {
    const respuesta = await fetch(URL_API_TAREAS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ texto })
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo guardar la tarea.");
    }

    const tarea = await respuesta.json();
    tareas.push(tarea);
    entradaTarea.value = "";
    entradaTarea.focus();
    renderizarTareas(obtenerTareasFiltradas());
  } catch (error) {
    mostrarError("No se pudo agregar la tarea al JSON.");
  }
}

function renderizarTareas(tareasParaMostrar) {
  if (tareasParaMostrar.length === 0) {
    listaTareas.innerHTML = `
      <li class="mensaje-vacio">
        No hay tareas para mostrar.
      </li>
    `;
    actualizarEstadisticas();
    return;
  }

  listaTareas.innerHTML = tareasParaMostrar.map((tarea) => `
    <li class="tarea">
      <label class="contenido-tarea">
        <input
          type="checkbox"
          ${tarea.completada ? "checked" : ""}
          onchange="alternarTarea(${tarea.id})"
        />
        <span class="${tarea.completada ? "tarea-completada" : ""}">
          ${escaparHTML(tarea.texto)}
        </span>
      </label>

      <button
        type="button"
        class="boton-eliminar"
        onclick="eliminarTarea(${tarea.id})"
        aria-label="Eliminar tarea"
      >
        Eliminar
      </button>
    </li>
  `).join("");

  actualizarEstadisticas();
}

function escaparHTML(texto) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function alternarTarea(id) {
  try {
    const respuesta = await fetch(`${URL_API_TAREAS}/${id}`, {
      method: "PUT"
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo actualizar la tarea.");
    }

    const tareaActualizada = await respuesta.json();

    tareas = tareas.map((tarea) => {
      if (tarea.id === id) {
        return tareaActualizada;
      }

      return tarea;
    });

    renderizarTareas(obtenerTareasFiltradas());
  } catch (error) {
    mostrarError("No se pudo actualizar la tarea en el JSON.");
  }
}

async function eliminarTarea(id) {
  try {
    const respuesta = await fetch(`${URL_API_TAREAS}/${id}`, {
      method: "DELETE"
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo eliminar la tarea.");
    }

    tareas = tareas.filter((tarea) => tarea.id !== id);
    renderizarTareas(obtenerTareasFiltradas());
  } catch (error) {
    mostrarError("No se pudo eliminar la tarea del JSON.");
  }
}

function obtenerTareasFiltradas() {
  if (filtroActual === "pendientes") {
    return tareas.filter((tarea) => !tarea.completada);
  }

  if (filtroActual === "completadas") {
    return tareas.filter((tarea) => tarea.completada);
  }

  return tareas;
}

function actualizarFiltroActivo() {
  botonesFiltro.forEach((boton) => {
    boton.classList.toggle("filtro-activo", boton.dataset.filtro === filtroActual);
  });
}

function actualizarEstadisticas() {
  const completadas = tareas.reduce((total, tarea) => {
    return tarea.completada ? total + 1 : total;
  }, 0);

  const total = tareas.length;
  const pendientes = total - completadas;

  estadisticas.innerHTML = `
    <span>Completadas: ${completadas}</span>
    <span>Pendientes: ${pendientes}</span>
    <span>Total: ${total}</span>
  `;
}

function mostrarError(mensaje) {
  listaTareas.innerHTML = `
    <li class="mensaje-vacio">
      ${mensaje}
    </li>
  `;
}

cargarTareas();