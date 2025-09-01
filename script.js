const daySelector = document.getElementById("daySelector");
const ordenSelect = document.getElementById("ordenSelect");
const taskList = document.getElementById("taskList");
const btnAgregarTarea = document.getElementById("btnAgregarTarea");
const inputNuevaTarea = document.getElementById("inputNuevaTarea");
const mensajeFelicidades = document.getElementById("mensajeFelicidades");
const sonidoFelicidades = document.getElementById("sonidoFelicidades");
const contadorDias = document.getElementById("contadorDias");
const barraProgreso = document.getElementById("barraProgreso");
const progresoTexto = document.getElementById("progresoTexto");
const temaSelect = document.getElementById("temaSelect");

const STORAGE_TAREAS_BASE = "rutina_tareasBase";
const STORAGE_TAREAS_EXTRA = "rutina_tareasExtra";
const STORAGE_ESTADOS = "rutina_estados"; 
const STORAGE_HISTORIAL = "rutina_historial";

const tareasBaseDefault = [];
let yaFelicito = false;

// Inicializar tareas
function inicializarTareasBase() {
  if (!localStorage.getItem(STORAGE_TAREAS_BASE)) {
    localStorage.setItem(STORAGE_TAREAS_BASE, JSON.stringify(tareasBaseDefault));
  }
  if (!localStorage.getItem(STORAGE_TAREAS_EXTRA)) {
    localStorage.setItem(STORAGE_TAREAS_EXTRA, JSON.stringify([]));
  }
}

function obtenerTodasTareas() {
  const base = JSON.parse(localStorage.getItem(STORAGE_TAREAS_BASE)) || [];
  const extra = JSON.parse(localStorage.getItem(STORAGE_TAREAS_EXTRA)) || [];
  return base.concat(extra);
}

function guardarTareasExtra(extra) {
  localStorage.setItem(STORAGE_TAREAS_EXTRA, JSON.stringify(extra));
}

function obtenerEstado(dia) {
  const estados = JSON.parse(localStorage.getItem(STORAGE_ESTADOS)) || {};
  return estados[dia] || {};
}

function guardarEstado(dia, estado) {
  const estados = JSON.parse(localStorage.getItem(STORAGE_ESTADOS)) || {};
  estados[dia] = estado;
  localStorage.setItem(STORAGE_ESTADOS, JSON.stringify(estados));
}

function cargarTareas(dia) {
  taskList.innerHTML = "";
  const tareas = obtenerTodasTareas();
  const estado = obtenerEstado(dia);

  if (ordenSelect.value === "nombre") {
    tareas.sort((a,b)=>a.localeCompare(b));
  } else {
    tareas.sort((a,b)=>{
      const estA = estado[a] ? 0 : 1;
      const estB = estado[b] ? 0 : 1;
      return estA - estB || a.localeCompare(b);
    });
  }

  tareas.forEach(tarea=>{
    const label = document.createElement("label");

    const contenedor = document.createElement("div");
    contenedor.style.display="flex";
    contenedor.style.alignItems="center";

    const checkbox = document.createElement("input");
    checkbox.type="checkbox";
    checkbox.checked = estado[tarea] || false;
    checkbox.addEventListener("change", ()=>{
      estado[tarea] = checkbox.checked;
      guardarEstado(dia, estado);
      actualizarProgreso(tareas, estado);
    });

    const inputNombre = document.createElement("input");
    inputNombre.type = "text";
    inputNombre.value = tarea;
    inputNombre.addEventListener("blur", ()=>{
      actualizarNombreTarea(tarea, inputNombre.value.trim());
    });

    inputNombre.addEventListener("keydown", e=>{
      if(e.key==="Enter") inputNombre.blur();
    });

    const borrarBtn = document.createElement("button");
    borrarBtn.textContent = "🗑️";
    borrarBtn.classList.add("borrar-btn");
    borrarBtn.addEventListener("click", ()=>{
      eliminarTarea(tarea, dia);
    });

    contenedor.appendChild(checkbox);
    contenedor.appendChild(inputNombre);
    contenedor.appendChild(borrarBtn);
    label.appendChild(contenedor);
    taskList.appendChild(label);
  });

  actualizarProgreso(tareas, estado);
}

function agregarTarea() {
  const nuevaTarea = inputNuevaTarea.value.trim();
  if(!nuevaTarea) return alert("Ingrese un nombre para la nueva tarea.");
  let todas = obtenerTodasTareas();
  if(todas.some(t=>t.toLowerCase()===nuevaTarea.toLowerCase())) return alert("Esta tarea ya existe.");

  let extra = JSON.parse(localStorage.getItem(STORAGE_TAREAS_EXTRA)) || [];
  extra.push(nuevaTarea);
  guardarTareasExtra(extra);
  inputNuevaTarea.value = "";
  cargarTareas(daySelector.value);
}

function eliminarTarea(nombre, dia){
  let extra = JSON.parse(localStorage.getItem(STORAGE_TAREAS_EXTRA)) || [];
  extra = extra.filter(t => t!==nombre);
  guardarTareasExtra(extra);

  let estado = obtenerEstado(dia);
  delete estado[nombre];
  guardarEstado(dia, estado);

  cargarTareas(dia);
}

function actualizarProgreso(tareas, estado){
  const total = tareas.length;
  const completadas = tareas.filter(t=>estado[t]).length;
  const porcentaje = total ? Math.round((completadas/total)*100) : 0;
  barraProgreso.style.width = porcentaje+"%";
  progresoTexto.textContent = `Progreso: ${completadas}/${total} completadas`;

  if(porcentaje===100){
    mensajeFelicidades.style.display="block";
    if(!yaFelicito){
      sonidoFelicidades.play().catch(()=>{});
      yaFelicito=true;
    }
    actualizarHistorial(getHoy(), true);
  } else {
    mensajeFelicidades.style.display="none";
    yaFelicito=false;
    actualizarHistorial(getHoy(), false);
  }
}

function getHoy(){
  return new Date().toISOString().slice(0,10);
}

function cargarHistorial(){
  return JSON.parse(localStorage.getItem(STORAGE_HISTORIAL)) || [];
}

function guardarHistorial(historial){
  localStorage.setItem(STORAGE_HISTORIAL, JSON.stringify(historial));
}

function actualizarHistorial(dia, completo){
  let historial = cargarHistorial();
  if(completo && !historial.includes(dia)) historial.push(dia);
  else if(!completo && historial.includes(dia)) historial = historial.filter(d=>d!==dia);
  guardarHistorial(historial);
  actualizarContador(historial.length);
  renderizarHistorial(historial);
}

function actualizarContador(cantidad){
  contadorDias.textContent = cantidad;
}

function renderizarHistorial(historial){
  const lista = document.getElementById("listaHistorial");
  if(!lista) return;
  lista.innerHTML="";
  const historialOrdenado = historial.slice().sort().reverse();
  historialOrdenado.forEach(fecha=>{
    const item = document.createElement("li");
    item.textContent = `🗓 ${fecha} — Rutina completada ✅`;
    lista.appendChild(item);
  });
}

function seleccionarDiaActual(){
  const dias=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const hoyNum = new Date().getDay();
  const hoyStr = dias[hoyNum];
  if([...daySelector.options].some(opt=>opt.value===hoyStr)) daySelector.value=hoyStr;
}

function actualizarNombreTarea(viejo, nuevo){
  if(!nuevo.trim()){ cargarTareas(daySelector.value); return; }
  const todas = obtenerTodasTareas();
  if(todas.some(t=>t.toLowerCase()===nuevo.toLowerCase() && t!==viejo)){ cargarTareas(daySelector.value); return; }

  let extra = JSON.parse(localStorage.getItem(STORAGE_TAREAS_EXTRA)) || [];
  extra = extra.map(t => t===viejo?nuevo:t);
  guardarTareasExtra(extra);

  const estados = JSON.parse(localStorage.getItem(STORAGE_ESTADOS)) || {};
  for(const dia in estados){
    if(estados[dia][viejo]!==undefined){
      estados[dia][nuevo] = estados[dia][viejo];
      delete estados[dia][viejo];
    }
  }
  localStorage.setItem(STORAGE_ESTADOS, JSON.stringify(estados));
  cargarTareas(daySelector.value);
}

// Event listeners
daySelector.addEventListener("change", ()=>cargarTareas(daySelector.value));
ordenSelect.addEventListener("change", ()=>cargarTareas(daySelector.value));
btnAgregarTarea.addEventListener("click", agregarTarea);
inputNuevaTarea.addEventListener("keypress", e=>{
  if(e.key==="Enter") agregarTarea();
});

temaSelect.addEventListener("change", ()=>{
  document.body.classList.remove("tema-claro","tema-colorido","tema-oscuro");
  document.body.classList.add(`tema-${temaSelect.value}`);
  localStorage.setItem("temaSeleccionado",temaSelect.value);
});

document.addEventListener("DOMContentLoaded", ()=>{
  inicializarTareasBase();
  seleccionarDiaActual();
  cargarTareas(daySelector.value);
  actualizarContador(cargarHistorial().length);
  renderizarHistorial(cargarHistorial());

  const temaGuardado = localStorage.getItem("temaSeleccionado") || "colorido";
  temaSelect.value = temaGuardado;
  document.body.classList.add(`tema-${temaGuardado}`);
});
