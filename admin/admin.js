(() => {
  "use strict";

  const FALLBACK_IMAGE = "../assets/img/logo-botanika.png";
  const config = window.BOTANIKA_SUPABASE_CONFIG || {};

  const state = {
    client: null,
    user: null,
    products: [],
    combos: [],
    activeSection: "overview",
    editingType: null,
    editingId: null,
    pendingDelete: null,
    imageFile: null,
    excelFile: null,
    excelData: { products: [], combos: [], items: [], errors: [] },
    excelPreviewSheet: "products"
  };

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slugify(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function adminImageUrl(value = "") {
    const image = String(value || "").trim();
    if (!image) return FALLBACK_IMAGE;
    if (/^(https?:|data:|blob:)/i.test(image)) return image;
    if (image.startsWith("../")) return image;
    if (image.startsWith("/")) return image;
    return `../${image.replace(/^\.\//, "")}`;
  }

  function showToast(message, type = "success") {
    const toast = $("#admin-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle("is-error", type === "error");
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function setBusy(button, busy, label = "Procesando...") {
    if (!button) return;
    if (busy) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<i class="bx bx-loader-alt bx-spin"></i>${escapeHTML(label)}`;
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    }
  }

  function linesToArray(value = "") {
    return String(value)
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function mapProduct(row = {}) {
    return {
      id: row.id,
      name: row.name || "",
      brand: row.brand || "Botanika",
      category: row.category || "Otros",
      subcategory: row.subcategory || "",
      price: Number(row.price || 0),
      currency: row.currency || "CRC",
      description: row.description || "",
      image: row.image_url || FALLBACK_IMAGE,
      available: row.available !== false,
      featured: Boolean(row.featured),
      new: Boolean(row.is_new),
      offer: Boolean(row.offer),
      priority: Number(row.priority || 100),
      colors: Array.isArray(row.colors) ? row.colors : [],
      gallery: Array.isArray(row.gallery) ? row.gallery : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function mapCombo(row = {}) {
    const items = Array.isArray(row.combo_items)
      ? row.combo_items
          .map((item) => ({
            productId: item.product_id,
            quantity: Number(item.quantity || 1),
            sortOrder: Number(item.sort_order || 0),
            product: item.product ? mapProduct(item.product) : null
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [];

    return {
      id: row.id,
      name: row.name || "",
      brand: row.brand || "Botanika",
      category: row.category || "Combos Botanika",
      subcategory: row.subcategory || "",
      price: Number(row.price || 0),
      currency: row.currency || "CRC",
      description: row.description || "",
      image: row.image_url || FALLBACK_IMAGE,
      available: row.available !== false,
      featured: Boolean(row.featured),
      new: Boolean(row.is_new),
      offer: Boolean(row.offer),
      priority: Number(row.priority || 100),
      label: row.label || "Combo Botanika",
      idealFor: Array.isArray(row.ideal_for) ? row.ideal_for : [],
      benefits: Array.isArray(row.benefits) ? row.benefits : [],
      usage: row.usage || "",
      items,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function databaseProduct(product) {
    return {
      id: product.id,
      name: product.name,
      brand: product.brand || "Botanika",
      category: product.category || "Otros",
      subcategory: product.subcategory || "",
      price: Number(product.price || 0),
      currency: "CRC",
      description: product.description || "",
      image_url: product.image || "",
      available: product.available !== false,
      featured: Boolean(product.featured),
      is_new: Boolean(product.new),
      offer: Boolean(product.offer),
      priority: Number(product.priority || 100),
      colors: Array.isArray(product.colors) ? product.colors : [],
      gallery: Array.isArray(product.gallery) ? product.gallery : []
    };
  }

  function databaseCombo(combo) {
    return {
      id: combo.id,
      name: combo.name,
      brand: combo.brand || "Botanika",
      category: combo.category || "Combos Botanika",
      subcategory: combo.subcategory || "",
      price: Number(combo.price || 0),
      currency: "CRC",
      description: combo.description || "",
      image_url: combo.image || "",
      available: combo.available !== false,
      featured: Boolean(combo.featured),
      is_new: Boolean(combo.new),
      offer: Boolean(combo.offer),
      priority: Number(combo.priority || 100),
      label: combo.label || "Combo Botanika",
      ideal_for: Array.isArray(combo.idealFor) ? combo.idealFor : [],
      benefits: Array.isArray(combo.benefits) ? combo.benefits : [],
      usage: combo.usage || ""
    };
  }

  function initClient() {
    const configured =
      config.enabled === true &&
      config.url &&
      config.publishableKey &&
      !config.url.includes("SU-PROYECTO") &&
      !config.publishableKey.includes("SU-PUBLISHABLE");

    if (!configured || !window.supabase?.createClient) return false;

    state.client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    return true;
  }

  function showScreen(name) {
    $("#setup-screen").hidden = name !== "setup";
    $("#login-screen").hidden = name !== "login";
    $("#dashboard-screen").hidden = name !== "dashboard";
  }

  async function verifyAdmin(user) {
    if (!user) return false;
    const { data, error } = await state.client
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    return Boolean(data);
  }

  async function boot() {
    bindStaticEvents();

    if (!initClient()) {
      showScreen("setup");
      return;
    }

    const { data } = await state.client.auth.getSession();
    const user = data.session?.user || null;

    if (!user) {
      showScreen("login");
      return;
    }

    const allowed = await verifyAdmin(user);
    if (!allowed) {
      await state.client.auth.signOut();
      $("#login-error").textContent = "Este usuario no está autorizado como administrador.";
      $("#login-error").hidden = false;
      showScreen("login");
      return;
    }

    await enterDashboard(user);
  }

  async function enterDashboard(user) {
    state.user = user;
    $("#admin-email").textContent = user.email || "Administrador";
    showScreen("dashboard");
    await refreshData();
    showSection("overview");
  }

  async function refreshData() {
    const [productsResult, combosResult] = await Promise.all([
      state.client
        .from("products")
        .select("*")
        .order("priority", { ascending: true })
        .order("name", { ascending: true }),
      state.client
        .from("combos")
        .select(`
          *,
          combo_items (
            product_id,
            quantity,
            sort_order,
            product:products (*)
          )
        `)
        .order("priority", { ascending: true })
        .order("name", { ascending: true })
    ]);

    if (productsResult.error) throw productsResult.error;
    if (combosResult.error) throw combosResult.error;

    state.products = (productsResult.data || []).map(mapProduct);
    state.combos = (combosResult.data || []).map(mapCombo);
    renderAll();
  }

  function renderAll() {
    renderStats();
    renderRecent();
    renderProductsTable();
    renderCombosTable();
  }

  function renderStats() {
    $("#stat-products").textContent = state.products.length;
    $("#stat-combos").textContent = state.combos.length;
    $("#stat-featured").textContent =
      state.products.filter((item) => item.featured).length +
      state.combos.filter((item) => item.featured).length;
    $("#stat-unavailable").textContent =
      state.products.filter((item) => !item.available).length +
      state.combos.filter((item) => !item.available).length;
  }

  function renderRecent() {
    const target = $("#recent-products");
    const recent = [...state.products]
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(0, 6);

    target.innerHTML = recent.length
      ? recent
          .map(
            (product) => `
              <div class="compact-item">
                <img src="${escapeHTML(adminImageUrl(product.image))}" alt="" onerror="this.src='${FALLBACK_IMAGE}'">
                <div><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.brand)} · ${escapeHTML(product.category)}</small></div>
                <span>${formatPrice(product.price)}</span>
              </div>
            `
          )
          .join("")
      : `<p class="muted">Todavía no hay productos. Use “Importar catálogo”.</p>`;
  }

  function productMatches(product) {
    const search = normalize($("#product-search")?.value || "");
    const status = $("#product-status-filter")?.value || "all";
    const haystack = normalize(`${product.name} ${product.brand} ${product.category} ${product.subcategory}`);

    if (search && !haystack.includes(search)) return false;
    if (status === "available" && !product.available) return false;
    if (status === "unavailable" && product.available) return false;
    if (status === "new" && !product.new) return false;
    if (status === "featured" && !product.featured) return false;
    if (status === "offer" && !product.offer) return false;
    return true;
  }

  function renderBadges(item) {
    const badges = [
      item.available
        ? `<span class="badge badge--available">Disponible</span>`
        : `<span class="badge badge--unavailable">No disponible</span>`,
      item.new ? `<span class="badge badge--new">Nuevo</span>` : "",
      item.featured ? `<span class="badge badge--featured">Destacado</span>` : "",
      item.offer ? `<span class="badge badge--offer">Oferta</span>` : ""
    ];
    return badges.filter(Boolean).join("");
  }

  function renderProductsTable() {
    const body = $("#products-table-body");
    if (!body) return;
    const products = state.products.filter(productMatches);
    $("#products-empty").hidden = products.length > 0;

    body.innerHTML = products
      .map(
        (product) => `
          <tr>
            <td>
              <div class="product-cell">
                <img src="${escapeHTML(adminImageUrl(product.image))}" alt="" onerror="this.src='${FALLBACK_IMAGE}'">
                <div><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.id)}</small></div>
              </div>
            </td>
            <td><strong>${escapeHTML(product.brand)}</strong><br><span class="muted">${escapeHTML(product.category)}${product.subcategory ? ` · ${escapeHTML(product.subcategory)}` : ""}</span></td>
            <td class="price-cell">${formatPrice(product.price)}</td>
            <td><div class="badges">${product.available ? `<span class="badge badge--available">Disponible</span>` : `<span class="badge badge--unavailable">No disponible</span>`}</div></td>
            <td><div class="badges">${renderBadges({ ...product, available: undefined }).replace(/<span class="badge badge--(?:available|unavailable)">.*?<\/span>/, "") || `<span class="muted">Normal</span>`}</div></td>
            <td><div class="row-actions">
              <button type="button" data-edit-product="${escapeHTML(product.id)}" title="Editar"><i class="bx bx-edit"></i></button>
              <button type="button" data-delete="product" data-id="${escapeHTML(product.id)}" title="Eliminar"><i class="bx bx-trash"></i></button>
            </div></td>
          </tr>
        `
      )
      .join("");
  }

  function comboRegularPrice(combo) {
    return combo.items.reduce((total, item) => {
      const product = item.product || state.products.find((entry) => entry.id === item.productId);
      return total + Number(product?.price || 0) * Number(item.quantity || 1);
    }, 0);
  }

  function renderCombosTable() {
    const body = $("#combos-table-body");
    if (!body) return;
    $("#combos-empty").hidden = state.combos.length > 0;

    body.innerHTML = state.combos
      .map((combo) => {
        const regular = comboRegularPrice(combo);
        const saving = Math.max(regular - combo.price, 0);
        return `
          <tr>
            <td><div class="product-cell"><img src="${escapeHTML(adminImageUrl(combo.image))}" alt="" onerror="this.src='${FALLBACK_IMAGE}'"><div><strong>${escapeHTML(combo.name)}</strong><small>${renderBadges(combo)}</small></div></div></td>
            <td>${combo.items.length} producto${combo.items.length === 1 ? "" : "s"}</td>
            <td class="price-cell">${formatPrice(combo.price)}</td>
            <td>${formatPrice(regular)}</td>
            <td><span class="badge badge--available">${formatPrice(saving)}</span></td>
            <td><div class="row-actions">
              <button type="button" data-edit-combo="${escapeHTML(combo.id)}" title="Editar"><i class="bx bx-edit"></i></button>
              <button type="button" data-delete="combo" data-id="${escapeHTML(combo.id)}" title="Eliminar"><i class="bx bx-trash"></i></button>
            </div></td>
          </tr>
        `;
      })
      .join("");
  }

  function showSection(section) {
    state.activeSection = section;
    $$(".admin-section").forEach((node) => (node.hidden = node.id !== `section-${section}`));
    $$(".sidebar-link[data-section]").forEach((button) => button.classList.toggle("is-active", button.dataset.section === section));
    const titles = { overview: "Resumen", products: "Productos", combos: "Combos", import: "Importar catálogo" };
    $("#page-title").textContent = titles[section] || "Administración";
    $("#admin-sidebar").classList.remove("is-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function productFormHTML(product = null) {
    const item = product || {
      id: "",
      name: "",
      brand: "",
      category: "Maquillaje",
      subcategory: "",
      price: 0,
      description: "",
      image: "",
      available: true,
      featured: false,
      new: false,
      offer: false,
      priority: 100,
      colors: [],
      gallery: []
    };

    const colorRows = (item.colors.length ? item.colors : [{ name: "", value: "", image: "" }])
      .map((color) => colorRowHTML(color))
      .join("");

    return `
      <div class="form-grid">
        <label class="field"><span>Nombre *</span><input id="product-name" name="name" required value="${escapeHTML(item.name)}"></label>
        <label class="field"><span>Identificador *</span><input id="product-id" name="id" required value="${escapeHTML(item.id)}" ${product ? "readonly" : ""}><small class="form-note">Se genera desde el nombre y no debe repetirse.</small></label>
        <label class="field"><span>Marca *</span><input name="brand" required value="${escapeHTML(item.brand)}"></label>
        <label class="field"><span>Categoría *</span><input name="category" required value="${escapeHTML(item.category)}" list="category-options"></label>
        <datalist id="category-options"><option value="Maquillaje"><option value="Skincare"><option value="Accesorios"><option value="Cuidado corporal"><option value="Cabello"></datalist>
        <label class="field"><span>Subcategoría</span><input name="subcategory" value="${escapeHTML(item.subcategory)}"></label>
        <label class="field"><span>Precio en colones *</span><input name="price" type="number" min="0" step="1" required value="${Number(item.price || 0)}"></label>
        <label class="field"><span>Prioridad</span><input name="priority" type="number" step="1" value="${Number(item.priority || 100)}"><small class="form-note">Los números menores aparecen primero.</small></label>
        <label class="field field--full"><span>Descripción</span><textarea name="description">${escapeHTML(item.description)}</textarea></label>

        <div class="field field--full">
          <span>Imagen principal</span>
          <div class="image-upload-box">
            <img id="editor-image-preview" class="image-preview" src="${escapeHTML(adminImageUrl(item.image))}" alt="Vista previa" onerror="this.src='${FALLBACK_IMAGE}'">
            <div class="image-upload-actions">
              <input id="editor-image-url" name="image" value="${escapeHTML(item.image)}" placeholder="URL o ruta de la imagen">
              <input id="editor-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif">
              <small class="form-note">Puede mantener una ruta existente o subir una imagen nueva a Supabase Storage.</small>
            </div>
          </div>
        </div>

        <div class="switches field--full">
          ${switchHTML("available", "Disponible", item.available)}
          ${switchHTML("new", "Novedad", item.new)}
          ${switchHTML("featured", "Destacado", item.featured)}
          ${switchHTML("offer", "Oferta", item.offer)}
        </div>

        <section class="form-section">
          <h3>Tonos o colores</h3>
          <div id="color-list" class="dynamic-list">${colorRows}</div>
          <button id="add-color-row" class="add-row-button" type="button"><i class="bx bx-plus"></i>Agregar tono</button>
        </section>

        <div class="form-actions">
          <button class="secondary-button" type="button" data-close-editor>Cancelar</button>
          <button id="save-editor-button" class="primary-button" type="submit"><i class="bx bx-save"></i>Guardar producto</button>
        </div>
      </div>
    `;
  }

  function colorRowHTML(color = {}) {
    return `
      <div class="dynamic-row color-row">
        <input name="color-name" placeholder="Nombre del tono" value="${escapeHTML(color.name || "")}">
        <input name="color-value" placeholder="#D98C9A o descripción" value="${escapeHTML(color.value || color.hex || "")}">
        <button type="button" data-remove-row aria-label="Eliminar tono"><i class="bx bx-x"></i></button>
        <input name="color-image" placeholder="URL de imagen opcional" value="${escapeHTML(color.image || "")}">
      </div>
    `;
  }

  function switchHTML(name, label, checked) {
    return `<label class="switch-field"><input type="checkbox" name="${name}" ${checked ? "checked" : ""}><span>${escapeHTML(label)}</span></label>`;
  }

  function comboFormHTML(combo = null) {
    const item = combo || {
      id: "",
      name: "",
      brand: "Botanika",
      category: "Combos Botanika",
      subcategory: "",
      price: 0,
      description: "",
      image: "",
      available: true,
      featured: false,
      new: false,
      offer: true,
      priority: 100,
      label: "Combo Botanika",
      idealFor: [],
      benefits: [],
      usage: "",
      items: []
    };

    const itemMap = new Map(item.items.map((entry) => [entry.productId, entry]));
    const picker = state.products
      .map((product) => {
        const selected = itemMap.get(product.id);
        return `
          <label class="combo-picker-row">
            <input type="checkbox" name="combo-product" value="${escapeHTML(product.id)}" ${selected ? "checked" : ""}>
            <img src="${escapeHTML(adminImageUrl(product.image))}" alt="" onerror="this.src='${FALLBACK_IMAGE}'">
            <span><strong>${escapeHTML(product.name)}</strong><br><small>${formatPrice(product.price)}</small></span>
            <input type="number" name="combo-quantity-${escapeHTML(product.id)}" min="1" step="1" value="${Number(selected?.quantity || 1)}" aria-label="Cantidad">
          </label>
        `;
      })
      .join("");

    return `
      <div class="form-grid">
        <label class="field"><span>Nombre del combo *</span><input id="combo-name" name="name" required value="${escapeHTML(item.name)}"></label>
        <label class="field"><span>Identificador *</span><input id="combo-id" name="id" required value="${escapeHTML(item.id)}" ${combo ? "readonly" : ""}></label>
        <label class="field"><span>Subcategoría</span><input name="subcategory" value="${escapeHTML(item.subcategory)}"></label>
        <label class="field"><span>Precio especial *</span><input name="price" type="number" min="0" step="1" required value="${Number(item.price || 0)}"></label>
        <label class="field"><span>Prioridad</span><input name="priority" type="number" step="1" value="${Number(item.priority || 100)}"></label>
        <label class="field"><span>Etiqueta</span><input name="label" value="${escapeHTML(item.label)}"></label>
        <label class="field field--full"><span>Descripción</span><textarea name="description">${escapeHTML(item.description)}</textarea></label>

        <div class="field field--full">
          <span>Imagen del combo</span>
          <div class="image-upload-box">
            <img id="editor-image-preview" class="image-preview" src="${escapeHTML(adminImageUrl(item.image))}" alt="Vista previa" onerror="this.src='${FALLBACK_IMAGE}'">
            <div class="image-upload-actions">
              <input id="editor-image-url" name="image" value="${escapeHTML(item.image)}" placeholder="URL o ruta de la imagen">
              <input id="editor-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif">
            </div>
          </div>
        </div>

        <div class="switches field--full">
          ${switchHTML("available", "Disponible", item.available)}
          ${switchHTML("new", "Novedad", item.new)}
          ${switchHTML("featured", "Destacado", item.featured)}
          ${switchHTML("offer", "Oferta", item.offer)}
        </div>

        <label class="field field--full"><span>Ideal para (una opción por línea)</span><textarea name="idealFor">${escapeHTML(item.idealFor.join("\n"))}</textarea></label>
        <label class="field field--full"><span>Beneficios (uno por línea)</span><textarea name="benefits">${escapeHTML(item.benefits.join("\n"))}</textarea></label>
        <label class="field field--full"><span>Modo de uso</span><textarea name="usage">${escapeHTML(item.usage)}</textarea></label>

        <section class="form-section">
          <h3>Productos incluidos *</h3>
          <p class="form-note">Marque los productos y ajuste la cantidad. El precio individual y el ahorro se calculan automáticamente en el catálogo.</p>
          <div class="combo-product-picker">${picker || `<p class="muted">Primero debe crear o importar productos.</p>`}</div>
        </section>

        <div class="form-actions">
          <button class="secondary-button" type="button" data-close-editor>Cancelar</button>
          <button id="save-editor-button" class="primary-button" type="submit"><i class="bx bx-save"></i>Guardar combo</button>
        </div>
      </div>
    `;
  }

  function openEditor(type, id = null) {
    state.editingType = type;
    state.editingId = id;
    state.imageFile = null;

    const form = $("#editor-form");
    const entity = type === "product"
      ? state.products.find((item) => item.id === id) || null
      : state.combos.find((item) => item.id === id) || null;

    $("#editor-kicker").textContent = type === "product" ? "Inventario" : "Venta agrupada";
    $("#editor-title").textContent = `${entity ? "Editar" : "Crear"} ${type === "product" ? "producto" : "combo"}`;
    form.innerHTML = type === "product" ? productFormHTML(entity) : comboFormHTML(entity);
    $("#editor-modal").hidden = false;
    document.body.style.overflow = "hidden";

    bindEditorEvents();
    setTimeout(() => form.querySelector("input:not([readonly])")?.focus(), 50);
  }

  function closeEditor() {
    $("#editor-modal").hidden = true;
    document.body.style.overflow = "";
    state.editingType = null;
    state.editingId = null;
    state.imageFile = null;
  }

  function bindEditorEvents() {
    const form = $("#editor-form");
    const nameInput = form.querySelector(state.editingType === "product" ? "#product-name" : "#combo-name");
    const idInput = form.querySelector(state.editingType === "product" ? "#product-id" : "#combo-id");

    if (!state.editingId) {
      nameInput?.addEventListener("input", () => {
        idInput.value = slugify(nameInput.value);
      });
    }

    const imageUrl = $("#editor-image-url", form);
    const imageFile = $("#editor-image-file", form);
    const preview = $("#editor-image-preview", form);

    imageUrl?.addEventListener("input", () => {
      if (!state.imageFile) preview.src = adminImageUrl(imageUrl.value);
    });

    imageFile?.addEventListener("change", () => {
      const file = imageFile.files?.[0];
      state.imageFile = file || null;
      if (file) preview.src = URL.createObjectURL(file);
    });

    $("#add-color-row", form)?.addEventListener("click", () => {
      $("#color-list", form).insertAdjacentHTML("beforeend", colorRowHTML());
    });

    form.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove-row]");
      if (remove) remove.closest(".dynamic-row")?.remove();
    });

    form.addEventListener("submit", saveEditor);
  }

  async function uploadImage(entityId) {
    if (!state.imageFile) return $("#editor-image-url")?.value.trim() || "";

    if (state.imageFile.size > 6 * 1024 * 1024) {
      throw new Error("La imagen supera el máximo de 6 MB.");
    }

    const extension = state.imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const folder = state.editingType === "combo" ? "combos" : "products";
    const path = `${folder}/${entityId}-${Date.now()}.${extension}`;
    const bucket = config.storageBucket || "product-images";

    const { error } = await state.client.storage
      .from(bucket)
      .upload(path, state.imageFile, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data } = state.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  function collectColors(form) {
    return $$(".color-row", form)
      .map((row) => ({
        name: row.querySelector('[name="color-name"]')?.value.trim() || "",
        value: row.querySelector('[name="color-value"]')?.value.trim() || "",
        image: row.querySelector('[name="color-image"]')?.value.trim() || ""
      }))
      .filter((color) => color.name || color.value || color.image);
  }

  function formValue(form, name) {
    return form.elements.namedItem(name)?.value?.trim?.() || "";
  }

  function formChecked(form, name) {
    return Boolean(form.elements.namedItem(name)?.checked);
  }

  async function saveEditor(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = $("#save-editor-button", form);
    setBusy(button, true, "Guardando...");

    try {
      const id = formValue(form, "id");
      if (!id) throw new Error("Debe indicar un identificador.");
      const image = await uploadImage(id);

      if (state.editingType === "product") {
        const product = {
          id,
          name: formValue(form, "name"),
          brand: formValue(form, "brand"),
          category: formValue(form, "category"),
          subcategory: formValue(form, "subcategory"),
          price: Number(formValue(form, "price") || 0),
          description: formValue(form, "description"),
          image,
          available: formChecked(form, "available"),
          new: formChecked(form, "new"),
          featured: formChecked(form, "featured"),
          offer: formChecked(form, "offer"),
          priority: Number(formValue(form, "priority") || 100),
          colors: collectColors(form),
          gallery: []
        };

        if (!product.name || !product.brand || !product.category) {
          throw new Error("Complete nombre, marca y categoría.");
        }

        const { error } = await state.client.from("products").upsert(databaseProduct(product));
        if (error) throw error;
        showToast("Producto guardado correctamente.");
      } else {
        const selectedItems = $$("input[name='combo-product']:checked", form).map((checkbox, index) => ({
          productId: checkbox.value,
          quantity: Number(form.elements.namedItem(`combo-quantity-${checkbox.value}`)?.value || 1),
          sortOrder: index
        }));

        if (!selectedItems.length) throw new Error("Seleccione al menos un producto para el combo.");

        const combo = {
          id,
          name: formValue(form, "name"),
          brand: "Botanika",
          category: "Combos Botanika",
          subcategory: formValue(form, "subcategory"),
          price: Number(formValue(form, "price") || 0),
          description: formValue(form, "description"),
          image,
          available: formChecked(form, "available"),
          new: formChecked(form, "new"),
          featured: formChecked(form, "featured"),
          offer: formChecked(form, "offer"),
          priority: Number(formValue(form, "priority") || 100),
          label: formValue(form, "label") || "Combo Botanika",
          idealFor: linesToArray(formValue(form, "idealFor")),
          benefits: linesToArray(formValue(form, "benefits")),
          usage: formValue(form, "usage")
        };

        if (!combo.name) throw new Error("Complete el nombre del combo.");

        const { error: comboError } = await state.client.from("combos").upsert(databaseCombo(combo));
        if (comboError) throw comboError;

        const { error: deleteError } = await state.client.from("combo_items").delete().eq("combo_id", id);
        if (deleteError) throw deleteError;

        const { error: itemsError } = await state.client.from("combo_items").insert(
          selectedItems.map((item) => ({
            combo_id: id,
            product_id: item.productId,
            quantity: item.quantity,
            sort_order: item.sortOrder
          }))
        );
        if (itemsError) throw itemsError;
        showToast("Combo guardado correctamente.");
      }

      const savedType = state.editingType;
      closeEditor();
      await refreshData();
      showSection(savedType === "combo" ? "combos" : "products");
    } catch (error) {
      console.error(error);
      showToast(error.message || "No se pudo guardar.", "error");
    } finally {
      setBusy(button, false);
    }
  }

  function requestDelete(type, id) {
    const item = type === "product"
      ? state.products.find((entry) => entry.id === id)
      : state.combos.find((entry) => entry.id === id);
    if (!item) return;

    state.pendingDelete = { type, id };
    $("#confirm-message").textContent = `¿Desea eliminar “${item.name}”? Esta acción no se puede deshacer.`;
    $("#confirm-modal").hidden = false;
  }

  function closeConfirm() {
    $("#confirm-modal").hidden = true;
    state.pendingDelete = null;
  }

  async function confirmDelete() {
    if (!state.pendingDelete) return;
    const button = $("#confirm-delete-button");
    setBusy(button, true, "Eliminando...");

    try {
      const table = state.pendingDelete.type === "product" ? "products" : "combos";
      const { error } = await state.client.from(table).delete().eq("id", state.pendingDelete.id);
      if (error) {
        if (String(error.message).includes("combo_items_product_id_fkey")) {
          throw new Error("Este producto pertenece a un combo. Retírelo del combo antes de eliminarlo.");
        }
        throw error;
      }
      showToast("Registro eliminado.");
      closeConfirm();
      await refreshData();
    } catch (error) {
      console.error(error);
      showToast(error.message || "No se pudo eliminar.", "error");
    } finally {
      setBusy(button, false);
    }
  }

  async function importJsonCatalog() {
    const button = $("#import-json-button");
    const result = $("#import-result");
    setBusy(button, true, "Importando...");
    result.hidden = true;

    try {
      const [productsResponse, combosResponse] = await Promise.all([
        fetch("../assets/data/productos.json", { cache: "no-store" }),
        fetch("../assets/data/combos.json", { cache: "no-store" })
      ]);

      if (!productsResponse.ok) throw new Error("No se pudo leer productos.json.");
      const productData = await productsResponse.json();
      const products = Array.isArray(productData.products) ? productData.products : [];

      const { error: productsError } = await state.client
        .from("products")
        .upsert(products.map((product) => databaseProduct(product)));
      if (productsError) throw productsError;

      let combos = [];
      if (combosResponse.ok) {
        const comboData = await combosResponse.json();
        combos = Array.isArray(comboData.combos) ? comboData.combos : [];
      }

      if (combos.length) {
        const { error: combosError } = await state.client
          .from("combos")
          .upsert(combos.map((combo) => databaseCombo({
            ...combo,
            idealFor: combo.idealFor || [],
            benefits: combo.benefits || []
          })));
        if (combosError) throw combosError;

        for (const combo of combos) {
          await state.client.from("combo_items").delete().eq("combo_id", combo.id);
          if (Array.isArray(combo.items) && combo.items.length) {
            const { error: itemsError } = await state.client.from("combo_items").insert(
              combo.items.map((item, index) => ({
                combo_id: combo.id,
                product_id: item.productId,
                quantity: Number(item.quantity || 1),
                sort_order: index
              }))
            );
            if (itemsError) throw itemsError;
          }
        }
      }

      result.innerHTML = `<strong>Importación completada.</strong><br>${products.length} productos y ${combos.length} combos procesados.`;
      result.hidden = false;
      showToast("Catálogo importado correctamente.");
      await refreshData();
    } catch (error) {
      console.error(error);
      result.textContent = error.message || "No se pudo completar la importación.";
      result.hidden = false;
      showToast(result.textContent, "error");
    } finally {
      setBusy(button, false);
    }
  }


  function excelHeader(value = "") {
    return normalize(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function excelBoolean(value, defaultValue = false) {
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;
    const text = normalize(value);
    if (["si", "sí", "true", "verdadero", "1", "x"].includes(text)) return true;
    if (["no", "false", "falso", "0"].includes(text)) return false;
    return defaultValue;
  }

  function excelNumber(value, defaultValue = 0) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const clean = String(value ?? "").replace(/[^0-9,.-]/g, "").replace(/,(?=\d{1,2}$)/, ".").replace(/,/g, "");
    const parsed = Number(clean);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  function excelList(value = "") {
    return String(value || "").split(/[;\n]+/).map((item) => item.trim()).filter(Boolean);
  }

  function excelColors(value = "") {
    if (!String(value || "").trim()) return [];
    return excelList(value).map((entry) => {
      const [name = "", color = "", image = ""] = entry.split("|").map((item) => item.trim());
      return { name, value: color, image };
    }).filter((item) => item.name);
  }

  function normalizeExcelRows(sheet) {
    if (!sheet || !window.XLSX) return [];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
    return rows.map((row, index) => {
      const normalized = { __row: index + 2 };
      Object.entries(row).forEach(([key, value]) => { normalized[excelHeader(key)] = value; });
      return normalized;
    }).filter((row) => Object.entries(row).some(([key, value]) => key !== "__row" && String(value).trim() !== ""));
  }

  function findWorkbookSheet(workbook, candidates) {
    const names = workbook.SheetNames || [];
    const found = names.find((name) => candidates.includes(normalize(name).replace(/\s+/g, "")));
    return found ? workbook.Sheets[found] : null;
  }

  function validateExcelWorkbook(workbook) {
    const errors = [];
    const productRows = normalizeExcelRows(findWorkbookSheet(workbook, ["productos", "products"]));
    const comboRows = normalizeExcelRows(findWorkbookSheet(workbook, ["combos", "combo"]));
    const itemRows = normalizeExcelRows(findWorkbookSheet(workbook, ["productoscombo", "comboitems", "itemscombo", "productos_combos"]));

    const productIds = new Set();
    const products = productRows.map((row) => {
      const id = slugify(row.id || row.codigo || row.sku || row.nombre);
      const product = {
        id,
        name: String(row.nombre || row.name || "").trim(),
        brand: String(row.marca || row.brand || "Botanika").trim(),
        category: String(row.categoria || row.category || "").trim(),
        subcategory: String(row.subcategoria || row.subcategory || "").trim(),
        price: excelNumber(row.precio ?? row.price, 0),
        currency: "CRC",
        description: String(row.descripcion || row.description || "").trim(),
        image: String(row.imagen || row.image || row.image_url || "").trim(),
        available: excelBoolean(row.disponible ?? row.available, true),
        new: excelBoolean(row.nuevo ?? row.new ?? row.is_new, false),
        featured: excelBoolean(row.destacado ?? row.featured, false),
        offer: excelBoolean(row.oferta ?? row.offer, false),
        priority: Math.trunc(excelNumber(row.prioridad ?? row.priority, 100)),
        colors: excelColors(row.colores || row.colors),
        gallery: excelList(row.galeria || row.gallery),
        __row: row.__row
      };
      if (!product.id) errors.push({ sheet: "Productos", row: row.__row, field: "id", message: "Falta el ID del producto." });
      if (!product.name) errors.push({ sheet: "Productos", row: row.__row, field: "nombre", message: "Falta el nombre." });
      if (!product.category) errors.push({ sheet: "Productos", row: row.__row, field: "categoria", message: "Falta la categoría." });
      if (product.price < 0) errors.push({ sheet: "Productos", row: row.__row, field: "precio", message: "El precio no puede ser negativo." });
      if (product.id && productIds.has(product.id)) errors.push({ sheet: "Productos", row: row.__row, field: "id", message: `ID duplicado: ${product.id}.` });
      productIds.add(product.id);
      return product;
    });

    const comboIds = new Set();
    const combos = comboRows.map((row) => {
      const id = slugify(row.id || row.codigo || row.nombre);
      const combo = {
        id,
        name: String(row.nombre || row.name || "").trim(),
        brand: "Botanika",
        category: "Combos Botanika",
        subcategory: String(row.subcategoria || row.subcategory || "").trim(),
        price: excelNumber(row.precio ?? row.price, 0),
        currency: "CRC",
        description: String(row.descripcion || row.description || "").trim(),
        image: String(row.imagen || row.image || row.image_url || "").trim(),
        available: excelBoolean(row.disponible ?? row.available, true),
        new: excelBoolean(row.nuevo ?? row.new ?? row.is_new, false),
        featured: excelBoolean(row.destacado ?? row.featured, false),
        offer: excelBoolean(row.oferta ?? row.offer, false),
        priority: Math.trunc(excelNumber(row.prioridad ?? row.priority, 100)),
        label: String(row.etiqueta || row.label || "Combo Botanika").trim(),
        idealFor: excelList(row.ideal_para || row.idealfor || row.ideal_for),
        benefits: excelList(row.beneficios || row.benefits),
        usage: String(row.modo_uso || row.usage || "").trim(),
        __row: row.__row
      };
      if (!combo.id) errors.push({ sheet: "Combos", row: row.__row, field: "id", message: "Falta el ID del combo." });
      if (!combo.name) errors.push({ sheet: "Combos", row: row.__row, field: "nombre", message: "Falta el nombre." });
      if (combo.price < 0) errors.push({ sheet: "Combos", row: row.__row, field: "precio", message: "El precio no puede ser negativo." });
      if (combo.id && comboIds.has(combo.id)) errors.push({ sheet: "Combos", row: row.__row, field: "id", message: `ID duplicado: ${combo.id}.` });
      comboIds.add(combo.id);
      return combo;
    });

    const knownProducts = new Set([...state.products.map((item) => item.id), ...products.map((item) => item.id)]);
    const knownCombos = new Set([...state.combos.map((item) => item.id), ...combos.map((item) => item.id)]);
    const itemKeys = new Set();
    const items = itemRows.map((row, index) => {
      const item = {
        comboId: slugify(row.combo_id || row.combo || row.comboid),
        productId: slugify(row.producto_id || row.product_id || row.producto || row.productoid),
        quantity: Math.max(1, Math.trunc(excelNumber(row.cantidad || row.quantity, 1))),
        sortOrder: Math.max(0, Math.trunc(excelNumber(row.orden || row.sort_order, index))),
        __row: row.__row
      };
      if (!item.comboId) errors.push({ sheet: "ProductosCombo", row: row.__row, field: "combo_id", message: "Falta el ID del combo." });
      if (!item.productId) errors.push({ sheet: "ProductosCombo", row: row.__row, field: "producto_id", message: "Falta el ID del producto." });
      if (item.comboId && !knownCombos.has(item.comboId)) errors.push({ sheet: "ProductosCombo", row: row.__row, field: "combo_id", message: `El combo ${item.comboId} no existe.` });
      if (item.productId && !knownProducts.has(item.productId)) errors.push({ sheet: "ProductosCombo", row: row.__row, field: "producto_id", message: `El producto ${item.productId} no existe.` });
      const key = `${item.comboId}::${item.productId}`;
      if (itemKeys.has(key)) errors.push({ sheet: "ProductosCombo", row: row.__row, field: "producto_id", message: "Producto repetido dentro del mismo combo." });
      itemKeys.add(key);
      return item;
    });

    if (!productRows.length && !comboRows.length) errors.push({ sheet: "Archivo", row: "-", field: "hojas", message: "El archivo no contiene registros en Productos ni Combos." });
    return { products, combos, items, errors };
  }

  function excelRowHasError(sheet, row) {
    return state.excelData.errors.some((error) => error.sheet === sheet && Number(error.row) === Number(row));
  }

  function validExcelData() {
    return {
      products: state.excelData.products.filter((item) => !excelRowHasError("Productos", item.__row)),
      combos: state.excelData.combos.filter((item) => !excelRowHasError("Combos", item.__row)),
      items: state.excelData.items.filter((item) => !excelRowHasError("ProductosCombo", item.__row))
    };
  }

  function renderExcelPreview(sheetName = state.excelPreviewSheet) {
    state.excelPreviewSheet = sheetName;
    $$(".preview-tab").forEach((button) => button.classList.toggle("is-active", button.dataset.previewSheet === sheetName));
    const head = $("#excel-preview-head");
    const body = $("#excel-preview-body");
    const configs = {
      products: { headers: ["Fila", "ID", "Producto", "Marca", "Categoría", "Precio", "Estado"], rows: state.excelData.products.map((item) => [item.__row, item.id, item.name, item.brand, item.category, formatPrice(item.price), excelRowHasError("Productos", item.__row) ? "Con errores" : "Válido"]) },
      combos: { headers: ["Fila", "ID", "Combo", "Precio", "Prioridad", "Estado"], rows: state.excelData.combos.map((item) => [item.__row, item.id, item.name, formatPrice(item.price), item.priority, excelRowHasError("Combos", item.__row) ? "Con errores" : "Válido"]) },
      items: { headers: ["Fila", "Combo", "Producto", "Cantidad", "Orden", "Estado"], rows: state.excelData.items.map((item) => [item.__row, item.comboId, item.productId, item.quantity, item.sortOrder, excelRowHasError("ProductosCombo", item.__row) ? "Con errores" : "Válido"]) },
      errors: { headers: ["Hoja", "Fila", "Campo", "Detalle"], rows: state.excelData.errors.map((item) => [item.sheet, item.row, item.field, item.message]) }
    };
    const config = configs[sheetName] || configs.products;
    head.innerHTML = `<tr>${config.headers.map((value) => `<th>${escapeHTML(value)}</th>`).join("")}</tr>`;
    body.innerHTML = config.rows.length
      ? config.rows.slice(0, 200).map((row) => `<tr>${row.map((value) => `<td>${escapeHTML(value)}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${config.headers.length}" class="muted">No hay registros para mostrar.</td></tr>`;
  }

  function renderExcelValidation() {
    const { products, combos, items, errors } = state.excelData;
    const valid = validExcelData();
    $("#preview-products-count").textContent = products.length;
    $("#preview-combos-count").textContent = combos.length;
    $("#preview-items-count").textContent = items.length;
    $("#preview-errors-count").textContent = errors.length;
    const summary = $("#excel-validation-summary");
    summary.innerHTML = `<div class="validation-kpis"><span><strong>${valid.products.length}</strong> productos válidos</span><span><strong>${valid.combos.length}</strong> combos válidos</span><span><strong>${valid.items.length}</strong> relaciones válidas</span><span class="${errors.length ? "has-errors" : "is-valid"}"><strong>${errors.length}</strong> errores</span></div>`;
    summary.hidden = false;
    $("#excel-preview").hidden = false;
    $("#download-error-report").hidden = !errors.length;
    $("#import-excel-button").disabled = !valid.products.length && !valid.combos.length;
    renderExcelPreview("products");
  }

  async function readExcelFile() {
    const file = state.excelFile;
    if (!file) return showToast("Seleccione un archivo Excel.", "error");
    if (!window.XLSX) return showToast("No se pudo cargar el lector de Excel.", "error");
    const button = $("#validate-excel-button");
    setBusy(button, true, "Validando...");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: "array", cellDates: true });
      state.excelData = validateExcelWorkbook(workbook);
      renderExcelValidation();
      showToast(state.excelData.errors.length ? "Revise los errores encontrados." : "Archivo validado correctamente.", state.excelData.errors.length ? "error" : "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "No se pudo leer el archivo Excel.", "error");
    } finally {
      setBusy(button, false);
    }
  }

  function selectExcelFile(file) {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) return showToast("Seleccione un archivo .xlsx o .xls.", "error");
    state.excelFile = file;
    state.excelData = { products: [], combos: [], items: [], errors: [] };
    $("#excel-file-summary").innerHTML = `<i class="bx bx-file"></i><div><strong>${escapeHTML(file.name)}</strong><small>${(file.size / 1024).toFixed(1)} KB</small></div>`;
    $("#excel-file-summary").hidden = false;
    $("#excel-validation-summary").hidden = true;
    $("#excel-preview").hidden = true;
    $("#validate-excel-button").disabled = false;
  }

  async function importExcelCatalog() {
    const button = $("#import-excel-button");
    const mode = $("#excel-import-mode").value;
    const data = validExcelData();
    setBusy(button, true, "Importando...");
    try {
      let products = data.products;
      let combos = data.combos;
      if (mode === "insert") {
        const productIds = new Set(state.products.map((item) => item.id));
        const comboIds = new Set(state.combos.map((item) => item.id));
        products = products.filter((item) => !productIds.has(item.id));
        combos = combos.filter((item) => !comboIds.has(item.id));
      }
      if (products.length) {
        const payload = products.map(({ __row, ...product }) => databaseProduct(product));
        const query = mode === "insert" ? state.client.from("products").insert(payload) : state.client.from("products").upsert(payload);
        const { error } = await query;
        if (error) throw error;
      }
      if (combos.length) {
        const payload = combos.map(({ __row, ...combo }) => databaseCombo(combo));
        const query = mode === "insert" ? state.client.from("combos").insert(payload) : state.client.from("combos").upsert(payload);
        const { error } = await query;
        if (error) throw error;
      }
      const comboIdsToUpdate = new Set(data.items.map((item) => item.comboId));
      for (const comboId of comboIdsToUpdate) {
        if (mode === "insert" && state.combos.some((item) => item.id === comboId)) continue;
        const { error: deleteError } = await state.client.from("combo_items").delete().eq("combo_id", comboId);
        if (deleteError) throw deleteError;
        const rows = data.items.filter((item) => item.comboId === comboId).map((item) => ({ combo_id: item.comboId, product_id: item.productId, quantity: item.quantity, sort_order: item.sortOrder }));
        if (rows.length) {
          const { error: itemsError } = await state.client.from("combo_items").insert(rows);
          if (itemsError) throw itemsError;
        }
      }
      $("#import-result").innerHTML = `<strong>Importación Excel completada.</strong><br>${products.length} productos, ${combos.length} combos y ${data.items.length} relaciones procesadas.`;
      $("#import-result").hidden = false;
      showToast(state.excelData.errors.length ? "Se importaron los registros válidos; revise el reporte de errores." : "Catálogo importado desde Excel.", state.excelData.errors.length ? "error" : "success");
      await refreshData();
    } catch (error) {
      console.error(error);
      showToast(error.message || "No se pudo importar el Excel.", "error");
    } finally {
      setBusy(button, false);
    }
  }

  function downloadExcelErrorReport() {
    const rows = [["Hoja", "Fila", "Campo", "Detalle"], ...state.excelData.errors.map((item) => [item.sheet, item.row, item.field, item.message])];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "errores-importacion-botanika.csv"; link.click();
    URL.revokeObjectURL(url);
  }

  function bindStaticEvents() {
    $("#login-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = $("#login-button");
      const errorBox = $("#login-error");
      errorBox.hidden = true;
      setBusy(button, true, "Ingresando...");

      try {
        const { data, error } = await state.client.auth.signInWithPassword({
          email: $("#login-email").value.trim(),
          password: $("#login-password").value
        });
        if (error) throw error;
        const allowed = await verifyAdmin(data.user);
        if (!allowed) {
          await state.client.auth.signOut();
          throw new Error("El usuario existe, pero no está autorizado como administrador.");
        }
        await enterDashboard(data.user);
      } catch (error) {
        errorBox.textContent = error.message || "No fue posible iniciar sesión.";
        errorBox.hidden = false;
      } finally {
        setBusy(button, false);
      }
    });

    $("#logout-button")?.addEventListener("click", async () => {
      await state.client.auth.signOut();
      state.user = null;
      showScreen("login");
    });

    $("#sidebar-toggle")?.addEventListener("click", () => $("#admin-sidebar").classList.toggle("is-open"));

    document.addEventListener("click", (event) => {
      const sectionButton = event.target.closest("[data-section]");
      if (sectionButton) showSection(sectionButton.dataset.section);

      const goButton = event.target.closest("[data-go-section]");
      if (goButton) showSection(goButton.dataset.goSection);

      if (event.target.closest("[data-new-product]")) openEditor("product");
      if (event.target.closest("[data-new-combo]")) openEditor("combo");

      const editProduct = event.target.closest("[data-edit-product]");
      if (editProduct) openEditor("product", editProduct.dataset.editProduct);

      const editCombo = event.target.closest("[data-edit-combo]");
      if (editCombo) openEditor("combo", editCombo.dataset.editCombo);

      const deleteButton = event.target.closest("[data-delete]");
      if (deleteButton) requestDelete(deleteButton.dataset.delete, deleteButton.dataset.id);

      if (event.target.closest("[data-close-editor]")) closeEditor();
      if (event.target.closest("[data-close-confirm]")) closeConfirm();
    });

    $("#product-search")?.addEventListener("input", renderProductsTable);
    $("#product-status-filter")?.addEventListener("change", renderProductsTable);
    $("#confirm-delete-button")?.addEventListener("click", confirmDelete);
    $("#import-json-button")?.addEventListener("click", importJsonCatalog);
    $("#excel-file")?.addEventListener("change", (event) => selectExcelFile(event.target.files?.[0]));
    $("#validate-excel-button")?.addEventListener("click", readExcelFile);
    $("#import-excel-button")?.addEventListener("click", importExcelCatalog);
    $("#download-error-report")?.addEventListener("click", downloadExcelErrorReport);
    $$(".preview-tab").forEach((button) => button.addEventListener("click", () => renderExcelPreview(button.dataset.previewSheet)));
    const dropZone = $("#excel-drop-zone");
    dropZone?.addEventListener("dragover", (event) => { event.preventDefault(); dropZone.classList.add("is-dragging"); });
    dropZone?.addEventListener("dragleave", () => dropZone.classList.remove("is-dragging"));
    dropZone?.addEventListener("drop", (event) => { event.preventDefault(); dropZone.classList.remove("is-dragging"); selectExcelFile(event.dataTransfer.files?.[0]); });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!$("#editor-modal").hidden) closeEditor();
        if (!$("#confirm-modal").hidden) closeConfirm();
        $("#admin-sidebar")?.classList.remove("is-open");
      }
    });
  }

  boot().catch((error) => {
    console.error(error);
    showToast("No se pudo iniciar el panel administrativo.", "error");
  });
})();
