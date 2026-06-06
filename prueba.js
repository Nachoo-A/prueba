import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDER",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const lista = document.getElementById("lista");
const alerta = document.getElementById("alerta");
const buscador = document.getElementById("buscador");

let productosGlobal = [];

/* ➕ AGREGAR PRODUCTO */
window.agregarProducto = async function () {

  const producto = document.getElementById("producto").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const cantidad = parseInt(document.getElementById("cantidad").value);

  if (!producto || !categoria || isNaN(cantidad)) return;

  await addDoc(collection(db, "stock"), {
    nombre: producto,
    categoria: categoria,
    cantidad: cantidad
  });

  document.getElementById("producto").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("cantidad").value = "";
};

/* 📡 REAL TIME */
onSnapshot(collection(db, "stock"), (snapshot) => {

  productosGlobal = [];

  snapshot.forEach((docu) => {
    productosGlobal.push({ id: docu.id, ...docu.data() });
  });

  render(productosGlobal);
});

/* 🔎 BUSCADOR (producto + categoría) */
buscador.addEventListener("input", () => {

  const texto = buscador.value.toLowerCase();

  const filtrados = productosGlobal.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    p.categoria.toLowerCase().includes(texto)
  );

  render(filtrados);
});

/* 🖥️ RENDER */
function render(productos) {

  lista.innerHTML = "";

  let alertas = [];

  productos.forEach((p) => {

    if (p.cantidad <= 5) alertas.push(p.nombre);

    lista.innerHTML += `
      <div class="producto">
        <div>
          <strong>${p.nombre}</strong>
          <small>📂 ${p.categoria}</small>
          <small>📦 Cantidad: ${p.cantidad}</small>
        </div>

        <button onclick="eliminar('${p.id}')">❌</button>
      </div>
    `;
  });

  if (alertas.length > 0) {
    alerta.classList.remove("oculto");
    alerta.innerHTML = "⚠ Stock bajo: " + alertas.join(", ");
  } else {
    alerta.classList.add("oculto");
  }
}

/* ❌ ELIMINAR */
window.eliminar = async function (id) {
  await deleteDoc(doc(db, "stock", id));
};

/* 📊 EXPORTAR EXCEL */
window.exportarExcel = function () {

  const data = productosGlobal.map(p => ({
    Producto: p.nombre,
    Categoria: p.categoria,
    Cantidad: p.cantidad
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Stock");

  XLSX.writeFile(wb, "stock.xlsx");
};

/* 📝 EXPORTAR WORD */
window.exportarWord = function () {

  let html = `
    <html>
    <head><meta charset="utf-8"></head>
    <body>
    <h2>Stock de Productos</h2>
    <table border="1" style="border-collapse:collapse;">
      <tr>
        <th>Producto</th>
        <th>Categoría</th>
        <th>Cantidad</th>
      </tr>
  `;

  productosGlobal.forEach(p => {
    html += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.categoria}</td>
        <td>${p.cantidad}</td>
      </tr>
    `;
  });

  html += `
    </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/msword" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "stock.doc";
  link.click();
};