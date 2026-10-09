/* ===== Éclat · tienda ===== */

// Número de WhatsApp de la tienda (formato internacional, sin + ni espacios)
const WHATSAPP_NUMBER = "5491136324877";

// Catálogo. Cambiá precios, nombres e imágenes acá.
const PRODUCTS = [
  { id: "pure-calm",    name: "Pure Calm",    scent: "Verbena",      size: "250 g", price: 7000, img: "assets/img/pure-calm.jpg" },
  { id: "red-pasion",   name: "Red Pasion",   scent: "Frutos rojos", size: "250 g", price: 7000, img: "assets/img/red-pasion.jpg" },
  { id: "cherry-kiss",  name: "Cherry Kiss",  scent: "Cherry",       size: "250 g", price: 7000, img: "assets/img/cherry-kiss.jpg" },
  // TODO: completar el aroma de Fleur Douce (en la foto no se lee bien)
  { id: "fleur-douce",  name: "Fleur Douce",  scent: "",             size: "250 g", price: 7000, img: "assets/img/fleur-douce.jpg" }
];

const STORAGE_KEY = "eclat_cart_v1";

const money = (n) => "$" + n.toLocaleString("es-AR");
const $ = (sel) => document.querySelector(sel);

/* ---------- Estado del carrito ---------- */
let cart = loadCart();

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(raw)) return [];
    // descartamos productos que ya no existen en el catálogo
    return raw.filter(i => PRODUCTS.some(p => p.id === i.id) && i.qty > 0);
  } catch (e) {
    return [];
  }
}

function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* modo privado */ }
}

function addToCart(id) {
  const item = cart.find(i => i.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  update();
  bumpBadge();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  update();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  update();
}

function clearCart() {
  cart = [];
  update();
}

const totalItems = () => cart.reduce((s, i) => s + i.qty, 0);
const totalPrice = () =>
  cart.reduce((s, i) => s + i.qty * PRODUCTS.find(p => p.id === i.id).price, 0);

/* ---------- Render ---------- */
function renderProducts() {
  const grid = $("#products");
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="product">
      <div class="product-photo">
        <img src="${p.img}" alt="Vela ${p.name}" loading="lazy">
      </div>
      <div class="product-label">
        <h3>${p.name}.</h3>
        <p class="scent">${p.scent}</p>
        <div class="product-meta">
          <span>${p.size}</span>
          <span class="price">${money(p.price)}</span>
        </div>
        <button class="add-btn" data-add="${p.id}">Agregar al carrito</button>
      </div>
    </article>
  `).join("");
}

function renderCart() {
  const list = $("#cart-items");
  const empty = $("#cart-empty");
  const footer = $("#cart-footer");

  if (cart.length === 0) {
    list.innerHTML = "";
    empty.hidden = false;
    footer.hidden = true;
    return;
  }

  empty.hidden = true;
  footer.hidden = false;

  list.innerHTML = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return `
      <li class="cart-item">
        <img src="${p.img}" alt="">
        <div class="cart-item-info">
          <strong>${p.name}</strong>
          ${p.scent ? `<span>${p.scent}</span>` : ""}
          <span>${money(p.price)} c/u</span>
          <div class="qty">
            <button data-dec="${p.id}" aria-label="Quitar una ${p.name}">−</button>
            <span aria-live="polite">${i.qty}</span>
            <button data-inc="${p.id}" aria-label="Sumar una ${p.name}">+</button>
          </div>
        </div>
        <div class="cart-item-side">
          <strong>${money(p.price * i.qty)}</strong>
          <button class="remove" data-remove="${p.id}" aria-label="Eliminar ${p.name}">Eliminar</button>
        </div>
      </li>`;
  }).join("");

  $("#cart-total").textContent = money(totalPrice());
}

function renderBadge() {
  const n = totalItems();
  const badge = $("#cart-count");
  badge.textContent = n;
  badge.hidden = n === 0;
}

function update() {
  saveCart();
  renderCart();
  renderBadge();
  $("#whatsapp-checkout").setAttribute("href", buildWhatsAppLink());
}

function bumpBadge() {
  const badge = $("#cart-count");
  badge.classList.remove("bump");
  void badge.offsetWidth; // reinicia la animación
  badge.classList.add("bump");
}

/* ---------- WhatsApp ---------- */
function buildOrderMessage() {
  const lines = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return `• ${i.qty} x ${p.name}${p.scent ? " (" + p.scent + ")" : ""} - ${money(p.price * i.qty)}`;
  });
  return [
    "¡Hola Éclat! Quiero hacer este pedido:",
    "",
    ...lines,
    "",
    `Total: ${money(totalPrice())}`,
    "",
    "¿Cómo coordinamos el pago y la entrega?"
  ].join("\n");
}

function buildWhatsAppLink() {
  if (cart.length === 0) return `https://wa.me/${WHATSAPP_NUMBER}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderMessage())}`;
}

/* ---------- Drawer ---------- */
const drawer = $("#cart-drawer");
const overlay = $("#cart-overlay");
let lastFocus = null;

function openCart() {
  lastFocus = document.activeElement;
  drawer.classList.add("open");
  overlay.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  $("#cart-close").focus();
}

function closeCart() {
  drawer.classList.remove("open");
  overlay.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  if (lastFocus) lastFocus.focus();
}

/* ---------- Eventos ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;

  if (t.dataset.add) { addToCart(t.dataset.add); return; }
  if (t.dataset.inc) { changeQty(t.dataset.inc, +1); return; }
  if (t.dataset.dec) { changeQty(t.dataset.dec, -1); return; }
  if (t.dataset.remove) { removeItem(t.dataset.remove); return; }
});

$("#cart-open").addEventListener("click", openCart);
$("#cart-close").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
$("#cart-clear").addEventListener("click", clearCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

/* ---------- Init ---------- */
renderProducts();
update();
