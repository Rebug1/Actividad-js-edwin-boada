// Imágenes por tipo de habitación (Unsplash - acceso libre)
const IMAGENES_HABITACION = {
    "Standard Single":    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
    "Double Deluxe":      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
    "Executive Suite":    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&q=80",
    "Presidential Suite": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80"
};

// Simulación de JSON remoto (se puede reemplazar por una URL real de una API o archivo .json)
const simulacionJSONRemoto = [
    { "id": 1, "numero": "101", "tipo": "Standard Single",    "precio": 60,  "disponible": true,  "imagen": IMAGENES_HABITACION["Standard Single"] },
    { "id": 2, "numero": "102", "tipo": "Double Deluxe",      "precio": 120, "disponible": true,  "imagen": IMAGENES_HABITACION["Double Deluxe"] },
    { "id": 3, "numero": "103", "tipo": "Executive Suite",    "precio": 250, "disponible": false, "imagen": IMAGENES_HABITACION["Executive Suite"] },
    { "id": 4, "numero": "201", "tipo": "Standard Single",    "precio": 60,  "disponible": true,  "imagen": IMAGENES_HABITACION["Standard Single"] },
    { "id": 5, "numero": "202", "tipo": "Double Deluxe",      "precio": 120, "disponible": false, "imagen": IMAGENES_HABITACION["Double Deluxe"] },
    { "id": 6, "numero": "203", "tipo": "Presidential Suite", "precio": 500, "disponible": true,  "imagen": IMAGENES_HABITACION["Presidential Suite"] }
];

// Estado global de la aplicación
let habitaciones = [];
let filtroActual = "todas";

// 1. CONSUMIR JSON REMOTO (Simulado con async/await y Promesa)
async function cargarHabitaciones() {
    try {
        // Simulamos un retraso de red de 500ms
        habitaciones = await new Promise((resolve) => {
            setTimeout(() => resolve(simulacionJSONRemoto), 500);
        });
        
        actualizarInterfaz();
    } catch (error) {
        console.error("Error al cargar los datos del hotel:", error);
    }
}

// 2. MOSTRAR HABITACIONES (Uso de map)
function renderizarHabitaciones(listaHabitaciones) {
    const grid = document.getElementById("rooms-grid");
    
    if (listaHabitaciones.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-light);">No se encontraron habitaciones en esta categoría.</p>`;
        return;
    }

    // Convertimos el array de objetos en un array de strings HTML con map()
    const habitacionesHTML = listaHabitaciones.map(habitacion => {
        const estadoTexto = habitacion.disponible ? "Disponible" : "Reservada";
        const estadoClase = habitacion.disponible ? "disponible" : "reservada";
        const botonTexto = habitacion.disponible ? "Reservar Habitación" : "Cancelar Reserva";
        const botonClase = habitacion.disponible ? "btn-reservar" : "btn-cancelar";

    return `
        <div class="room-card">
            <div class="room-img-container">
                <img src="${habitacion.imagen}" alt="${habitacion.tipo}" class="room-img">
            </div>
            
            <div class="room-info">
                <div class="room-type">${habitacion.tipo}</div>
                <div class="room-number">Habitación ${habitacion.numero}</div>
                <div class="room-price">$${habitacion.precio} / noche</div>
                <span class="status-badge ${estadoClase}">${estadoTexto}</span>
                <button class="btn-action ${botonClase}" onclick="alternarReserva(${habitacion.id})">
                    ${botonTexto}
                </button>
            </div>
        </div>
    `;
}).join('');

    grid.innerHTML = habitacionesHTML;
}

// 3. FILTRAR DISPONIBILIDAD (Uso de filter)
function aplicarFiltro() {
    let habitacionesFiltradas = habitaciones;

    if (filtroActual === "disponibles") {
        habitacionesFiltradas = habitaciones.filter(h => h.disponible === true);
    } else if (filtroActual === "reservadas") {
        habitacionesFiltradas = habitaciones.filter(h => h.disponible === false);
    }

    renderizarHabitaciones(habitacionesFiltradas);
}

// 4. CALCULAR INGRESOS ESTIMADOS (Uso de reduce)
function calcularIngresos() {
    const totalIngresosContenedor = document.getElementById("total-ingresos");
    
    // Sumamos el precio solo de las habitaciones que están ocupadas (reservadas)
    const total = habitaciones.reduce((acumulador, habitacion) => {
        if (!habitacion.disponible) {
            return acumulador + habitacion.precio;
        }
        return acumulador;
    }, 0);

    totalIngresosContenedor.textContent = `$${total}`;
}

// Acciones: Reservar o Cancelar Reserva
function alternarReserva(id) {
    habitaciones = habitaciones.map(h => {
        if (h.id === id) {
            return { ...h, disponible: !h.disponible }; // Cambia el estado true/false alternadamente
        }
        return h;
    });

    actualizarInterfaz();
}

// Refresca la lógica visual y los cálculos matemáticos
function actualizarInterfaz() {
    aplicarFiltro();
    calcularIngresos();
}

// Configuración de los botones de filtro del DOM
document.querySelectorAll(".btn-filter").forEach(boton => {
    boton.addEventListener("click", (e) => {
        document.querySelector(".btn-filter.active").classList.remove("active");
        e.target.classList.add("active");
        
        filtroActual = e.target.getAttribute("data-filter");
        aplicarFiltro();
    });
});

// Inicializar la aplicación al cargar la página
document.addEventListener("DOMContentLoaded", cargarHabitaciones);