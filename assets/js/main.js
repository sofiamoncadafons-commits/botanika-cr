/*==================================
  BOTANIKA CR
  CONFIGURACIÓN GENERAL
==================================*/

const CONFIG = {
  whatsapp: "50671214468",

  productsUrl:
    "assets/data/productos.json",

  fallbackImage:
    "assets/img/logo-botanika.png",

  cartKey:
    "botanika_cart_estable",

  favoritesKey:
    "botanika_favorites_estable"
};


/*==================================
  ESTADO DE LA APLICACIÓN
==================================*/

const state = {
  products: [],

  filtered: [],

  cart: loadStorage(
    CONFIG.cartKey,
    []
  ),

  favorites: loadStorage(
    CONFIG.favoritesKey,
    []
  ),

  filters: {
    search: "",

    category: "all",

    brand: "all",

    price: "all",

    sort: "default",

    quick: "all"
  },

  page: 1,

  pageSize: 12,

  modalProductId: null,

  modalColor: "",

  modalQuantity: 1
};


/*==================================
  SELECTORES
==================================*/

const $ = (
  selector,
  parent = document
) => parent.querySelector(selector);

const $$ = (
  selector,
  parent = document
) => [
  ...parent.querySelectorAll(selector)
];


/*==================================
  ALMACENAMIENTO LOCAL
==================================*/

function loadStorage(
  key,
  fallback
) {
  try {
    const value =
      localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;
  } catch (error) {
    console.error(
      "No se pudo leer localStorage:",
      error
    );

    return fallback;
  }
}


function saveStorage(
  key,
  value
) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error(
      "No se pudo guardar en localStorage:",
      error
    );
  }
}


/*==================================
  UTILIDADES
==================================*/

function escapeHTML(
  value = ""
) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function normalize(
  value = ""
) {
  return String(value)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}


/*===== MOTOR DE BÚSQUEDA INTELIGENTE =====*/
function searchTokens(value = "") {
  return normalize(value)
    .split(/\s+/)
    .filter(Boolean);
}


function productColorText(product = {}) {
  if (!Array.isArray(product.colors)) {
    return "";
  }

  return product.colors
    .map((color) => {
      if (typeof color === "string") {
        return color;
      }

      return [
        color?.name,
        color?.label,
        color?.tone,
        color?.shade,
        color?.value,
        color?.code
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join(" ");
}


function productSearchText(product = {}) {
  const tags = Array.isArray(product.tags)
    ? product.tags.join(" ")
    : product.tags || "";

  const labels = [
    product.featured ? "destacado recomendados mas vendido" : "",
    product.new ? "nuevo novedad reciente" : "",
    product.available ? "disponible en existencia" : "agotado no disponible"
  ].join(" ");

  return normalize(
    [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.description,
      productColorText(product),
      tags,
      product.keywords,
      product.finish,
      product.coverage,
      product.skinType,
      product.size,
      product.presentation,
      labels
    ]
      .filter(Boolean)
      .join(" ")
  );
}


function productMatchesSearch(product, value) {
  const tokens = searchTokens(value);

  if (!tokens.length) {
    return true;
  }

  const haystack = productSearchText(product);

  return tokens.every((token) =>
    haystack.includes(token)
  );
}


function productSearchScore(product, value) {
  const query = normalize(value);
  const tokens = searchTokens(value);
  const name = normalize(product.name);
  const brand = normalize(product.brand);
  const subcategory = normalize(product.subcategory);
  const colors = normalize(productColorText(product));

  let score = 0;

  if (name === query) score += 120;
  if (name.startsWith(query)) score += 70;
  if (name.includes(query)) score += 45;
  if (brand === query) score += 50;
  if (brand.includes(query)) score += 28;
  if (subcategory.includes(query)) score += 20;
  if (colors.includes(query)) score += 18;

  tokens.forEach((token) => {
    if (name.startsWith(token)) score += 14;
    else if (name.includes(token)) score += 9;
    if (brand.includes(token)) score += 6;
    if (colors.includes(token)) score += 4;
  });

  if (product.featured) score += 2;
  if (product.available) score += 1;

  return score;
}


function searchMatchContext(product, value) {
  const query = normalize(value);
  const colors = Array.isArray(product.colors)
    ? product.colors
        .map((color) =>
          typeof color === "string"
            ? color
            : color?.name || color?.label || color?.tone || color?.shade || ""
        )
        .filter(Boolean)
    : [];

  const matchedColor = colors.find((color) =>
    normalize(color).includes(query) ||
    searchTokens(value).some((token) => normalize(color).includes(token))
  );

  if (matchedColor) {
    return `Tono: ${matchedColor}`;
  }

  if (normalize(product.brand).includes(query)) {
    return `Marca: ${product.brand}`;
  }

  return product.subcategory || product.category || "Producto";
}


function formatPrice(
  value,
  currency = "CRC"
) {
  return new Intl.NumberFormat(
    "es-CR",
    {
      style: "currency",

      currency,

      minimumFractionDigits: 0,

      maximumFractionDigits: 0
    }
  ).format(
    Number(value) || 0
  );
}


function whatsappUrl(
  message
) {
  return (
    `https://wa.me/${CONFIG.whatsapp}` +
    `?text=${encodeURIComponent(message)}`
  );
}


function productById(
  id
) {
  return state.products.find(
    (product) =>
      product.id === id
  );
}


function imageFallback(
  image
) {
  image.onerror = null;

  image.src =
    CONFIG.fallbackImage;
}


function toast(
  message
) {
  const element =
    $("#toast");

  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.classList.add(
    "show"
  );

  clearTimeout(
    toast.timer
  );

  toast.timer =
    setTimeout(() => {
      element.classList.remove(
        "show"
      );
    }, 1800);
}


/*==================================
  MENÚ PRINCIPAL
==================================*/

function initNavigation() {
  const toggle = $("#nav-toggle");
  const menu = $("#nav-menu");

  if (!toggle || !menu) {
    console.warn("No se encontró el menú principal.");
    return;
  }

  const setOpen = (open) => {
    menu.classList.toggle("show", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");

    const icon = $("i", toggle);
    if (icon) {
      icon.className = open ? "bx bx-x" : "bx bx-menu";
    }
  };

  /* Un único controlador evita que iOS abra y cierre el menú en el mismo toque. */
  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(!menu.classList.contains("show"));
  });

  $$(".nav-link", menu).forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (href?.startsWith("#")) {
        const target = $(href);
        if (target) {
          event.preventDefault();
          setOpen(false);
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }

      setOpen(false);
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav")) {
      setOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      setOpen(false);
    }
  });
}


/*==================================
  CARGAR PRODUCTOS
==================================*/

async function loadProducts() {
  const container =
    $("#products-container");

  if (!container) {
    console.error(
      "No existe #products-container."
    );

    return;
  }

  container.innerHTML = `
    <div class="empty-message">

      <i
        class="bx bx-loader-alt bx-spin"
        style="font-size: 3rem;"
      ></i>

      <h3>
        Cargando productos
      </h3>

    </div>
  `;

  try {
    const response =
      await fetch(
        CONFIG.productsUrl,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data ||
      !Array.isArray(
        data.products
      )
    ) {
      throw new Error(
        "productos.json inválido"
      );
    }

    state.products =
      data.products.filter(
        (product) =>
          product
      );

    populateBrands();

    renderBrandShowcase();

    applyFilters();
  } catch (error) {
    console.error(
      "Error cargando catálogo:",
      error
    );

    container.innerHTML = `
      <div class="empty-message">

        <i
          class="bx bx-error-circle"
          style="font-size: 3rem;"
        ></i>

        <h3>
          No se pudo cargar el catálogo
        </h3>

        <p>
          Confirme que existe
          assets/data/productos.json
          y abra el sitio con Live Server.
        </p>

      </div>
    `;
  }
}


/*==================================
  MARCAS
==================================*/

function populateBrands() {
  const brandFilter =
    $("#brand-filter");

  if (!brandFilter) {
    return;
  }

  const brands = [
    ...new Set(
      state.products
        .map(
          (product) =>
            product.brand
        )
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "es"
      )
  );

  brandFilter.innerHTML = `
    <option value="all">
      Todas las marcas
    </option>

    ${brands
      .map(
        (brand) => `
          <option
            value="${escapeHTML(
              brand
            )}"
          >
            ${escapeHTML(
              brand
            )}
          </option>
        `
      )
      .join("")}
  `;
}

/*==================================
  FILTROS
==================================*/

function matchesPrice(product) {
  const price = Number(product.price) || 0;

  switch (state.filters.price) {
    case "0-5000":
      return price <= 5000;

    case "5001-10000":
      return price >= 5001 && price <= 10000;

    case "10001-15000":
      return price >= 10001 &&
             price <= 15000;

    case "15001+":
      return price >= 15001;

    default:
      return true;
  }
}

function pulseProductsBeforeUpdate() {
  const container =
    $("#products-container");

  if (!container) {
    return;
  }

  container.classList.remove(
    "products-updating"
  );

  void container.offsetWidth;

  container.classList.add(
    "products-updating"
  );
}


function productFlag(
  product,
  ...keys
) {
  for (const key of keys) {
    const value =
      product?.[key];

    if (
      value === true ||
      value === 1
    ) {
      return true;
    }

    if (
      typeof value === "string" &&
      [
        "true",
        "1",
        "si",
        "sí",
        "yes"
      ].includes(
        normalize(value)
      )
    ) {
      return true;
    }
  }

  return false;
}


function resetSecondaryFilters() {
  state.filters.search = "";
  state.filters.category = "all";
  state.filters.brand = "all";
  state.filters.price = "all";
  state.page = 1;

  const searchInput =
    $("#product-search");

  const clearSearch =
    $("#clear-search");

  const category =
    $("#category-filter");

  const brand =
    $("#brand-filter");

  const price =
    $("#price-filter");

  if (searchInput) {
    searchInput.value = "";
  }

  if (clearSearch) {
    clearSearch.hidden = true;
  }

  if (category) {
    category.value = "all";
  }

  if (brand) {
    brand.value = "all";
  }

  if (price) {
    price.value = "all";
  }

  closeSearchSuggestions();
}


function applyFilters() {
  pulseProductsBeforeUpdate();


  let products = [...state.products];

  /* BUSCADOR */

  if (state.filters.search) {

    const search =
      normalize(state.filters.search);

    products = products.filter((product) =>
      productMatchesSearch(product, search)
    );

  }

  /* CATEGORIA */

  if (
    state.filters.category !==
    "all"
  ) {

    products = products.filter(
      product =>
        product.category ===
        state.filters.category
    );

  }

  /* MARCA */

  if (
    state.filters.brand !==
    "all"
  ) {

    products = products.filter(
      product =>
        product.brand ===
        state.filters.brand
    );

  }

  /* PRECIO */

  if (
    state.filters.price !==
    "all"
  ) {

    products =
      products.filter(
        matchesPrice
      );

  }

  /* FILTRO RÁPIDO */

  if (state.filters.quick === "new") {
    products = products.filter(
      product =>
        productFlag(
          product,
          "new",
          "nuevo",
          "isNew"
        )
    );
  }

  if (state.filters.quick === "featured") {
    products = products.filter(
      product =>
        productFlag(
          product,
          "featured",
          "destacado",
          "isFeatured"
        )
    );
  }

  if (state.filters.quick === "offer") {
    products = products.filter(
      product =>
        productFlag(
          product,
          "offer",
          "oferta",
          "isOffer"
        )
    );
  }

  if (state.filters.quick === "available") {
    products = products.filter(
      product => product.available !== false
    );
  }

  /* ORDEN */

  switch (
    state.filters.sort
  ) {

    case "price-asc":

      products.sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price)
      );

      break;

    case "price-desc":

      products.sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price)
      );

      break;

    case "name-asc":

      products.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            "es"
          )
      );

      break;

    default:

      products.sort(
        (a, b) => {

          const scoreA =
            Number(
              productFlag(
                a,
                "featured",
                "destacado",
                "isFeatured"
              )
            ) * 2 +
            Number(
              productFlag(
              a,
              "new",
              "nuevo",
              "isNew"
            )
            );

          const scoreB =
            Number(
              productFlag(
                b,
                "featured",
                "destacado",
                "isFeatured"
              )
            ) * 2 +
            Number(
              productFlag(
              b,
              "new",
              "nuevo",
              "isNew"
            )
            );

          return (
            scoreB -
            scoreA
          );

        }
      );

  }

  state.filtered =
    products;

  const pageSizeFilter =
    $("#page-size");

  if (
    pageSizeFilter?.value ===
    "all"
  ) {
    state.pageSize =
      Math.max(
        products.length,
        1
      );

    state.page = 1;
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        products.length /
        state.pageSize
      )
    );

  state.page =
    Math.min(
      state.page,
      totalPages
    );

  renderProducts();

}


/*==================================
  RENDERIZAR PRODUCTOS
==================================*/

function revealProductCards() {
  const cards =
    $$(".product-card");

  if (
    !("IntersectionObserver" in window)
  ) {
    cards.forEach(
      (card) =>
        card.classList.add(
          "is-visible"
        )
    );

    return;
  }

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              entry.isIntersecting
            ) {
              entry.target
                .classList.add(
                  "is-visible"
                );

              observer.unobserve(
                entry.target
              );
            }
          }
        );
      },
      {
        threshold: .08
      }
    );

  cards.forEach(
    (card) =>
      observer.observe(card)
  );
}


function skeletonCardHTML() {
  return `
    <article class="product-card product-card--skeleton" aria-hidden="true">
      <div class="skeleton-media">
        <span class="skeleton-block skeleton-block--image"></span>
      </div>

      <div class="skeleton-content">
        <span class="skeleton-block skeleton-block--brand"></span>
        <span class="skeleton-block skeleton-block--title"></span>
        <span class="skeleton-block skeleton-block--title-short"></span>
        <span class="skeleton-block skeleton-block--price"></span>

        <div class="skeleton-actions">
          <span class="skeleton-block skeleton-block--button"></span>
          <span class="skeleton-block skeleton-block--button"></span>
          <span class="skeleton-block skeleton-block--button"></span>
        </div>
      </div>
    </article>
  `;
}


function renderSkeletonProducts(
  count = 8
) {
  const container =
    $("#products-container");

  if (!container) {
    return;
  }

  container.setAttribute(
    "aria-busy",
    "true"
  );

  container.innerHTML =
    Array.from(
      {
        length: count
      },
      () => skeletonCardHTML()
    ).join("");
}


function clearProductsLoadingState() {
  const container =
    $("#products-container");

  container?.removeAttribute(
    "aria-busy"
  );
}


function revealRenderedProducts() {
  const cards =
    $$(".product-card:not(.product-card--skeleton)");

  cards.forEach(
    (card, index) => {
      card.style.setProperty(
        "--reveal-delay",
        `${Math.min(index, 12) * 34}ms`
      );

      requestAnimationFrame(
        () => {
          card.classList.add(
            "product-card--loaded"
          );
        }
      );
    }
  );
}


function renderProducts() {

  const container =
    $("#products-container");

  if (!container) {
    return;
  }

  const total =
    state.filtered.length;

  const start =
    (
      state.page - 1
    ) *
    state.pageSize;

  const end =
    Math.min(
      start +
      state.pageSize,
      total
    );

  const products =
    state.filtered.slice(
      start,
      end
    );

  const status =
    $("#catalog-status");

  if (status) {

    status.textContent =
      total === 1
        ? "1 producto encontrado"
        : `${total} productos encontrados`;

  }

  const info =
    $("#pagination-info");

  if (info) {

    const showAll =
      $("#page-size")?.value ===
      "all";

    info.textContent =
      total
        ? showAll
          ? total === 1
            ? "Mostrando 1 producto"
            : `Mostrando los ${total} productos`
          : `Mostrando ${start + 1} - ${end} de ${total}`
        : "";

  }

  if (
    products.length === 0
  ) {

    container.innerHTML = `

      <div
        class="empty-message"
      >

        <i
          class="bx bx-search"
          style="
            font-size:3rem;
          "
        ></i>

        <h3>
          No encontramos productos
        </h3>

      </div>

    `;

    renderPagination();

    return;

  }

  container.innerHTML =
    products
      .map(
        productCardHTML
      )
      .join("");

  revealProductCards();

  clearProductsLoadingState();
  revealRenderedProducts();

  renderPagination();

}

/*==================================
  PAGINACIÓN
==================================*/

function renderPagination() {
  const pagination =
    $("#pagination");

  if (!pagination) {
    return;
  }

  if (
    $("#page-size")?.value ===
    "all"
  ) {
    pagination.innerHTML = "";

    return;
  }

  const totalPages =
    Math.ceil(
      state.filtered.length /
      state.pageSize
    );

  if (totalPages <= 1) {
    pagination.innerHTML = "";

    return;
  }

  pagination.innerHTML = `
    <button
      type="button"
      data-page="${state.page - 1}"
      ${state.page === 1 ? "disabled" : ""}
    >
      Anterior
    </button>

    ${Array.from(
      {
        length: totalPages
      },
      (_, index) =>
        index + 1
    )
      .map(
        (page) => `
          <button
            type="button"
            data-page="${page}"
            class="${
              page === state.page
                ? "active"
                : ""
            }"
          >
            ${page}
          </button>
        `
      )
      .join("")}

    <button
      type="button"
      data-page="${state.page + 1}"
      ${
        state.page === totalPages
          ? "disabled"
          : ""
      }
    >
      Siguiente
    </button>
  `;
}

/*==================================
  PRODUCTOS DESTACADOS
==================================*/

function renderFeaturedProducts() {
  const container =
    $("#featured-products");

  if (!container) {
    return;
  }

  const featuredProducts =
    state.products
      .filter(
        (product) =>
          product.featured === true &&
          product.available !== false
      )
      .slice(0, 4);

  const section =
    $("#destacados");

  if (
    featuredProducts.length === 0
  ) {
    container.innerHTML = "";

    if (section) {
      section.hidden = true;
    }

    return;
  }

  if (section) {
    section.hidden = false;
  }

  container.innerHTML =
    featuredProducts
      .map(productCardHTML)
      .join("");
}


/*==================================
  PRODUCTOS NUEVOS
==================================*/

function renderNewProducts() {
  const container =
    $("#new-products");

  if (!container) {
    return;
  }

  const newProducts =
    state.products
      .filter(
        (product) =>
          product.new === true &&
          product.available !== false
      )
      .slice(0, 4);

  const section =
    $("#nuevos");

  if (
    newProducts.length === 0
  ) {
    container.innerHTML = "";

    if (section) {
      section.hidden = true;
    }

    return;
  }

  if (section) {
    section.hidden = false;
  }

  container.innerHTML =
    newProducts
      .map(productCardHTML)
      .join("");
}


/*==================================
  MARCAS DESTACADAS
==================================*/

function renderBrandShowcase() {
  const container =
    $("#brands-showcase");

  if (!container) {
    return;
  }

  const brands =
    [...new Set(
      state.products
        .map(
          (product) =>
            String(
              product.brand || ""
            ).trim()
        )
        .filter(Boolean)
    )]
      .sort(
        (a, b) =>
          a.localeCompare(
            b,
            "es"
          )
      );

  if (brands.length === 0) {
    container.innerHTML = "";
    container.closest(
      ".brands-section"
    )?.setAttribute(
      "hidden",
      ""
    );

    return;
  }

  container.closest(
    ".brands-section"
  )?.removeAttribute(
    "hidden"
  );

  container.innerHTML =
    brands
      .slice(0, 12)
      .map(
        (brand) => `
          <button
            type="button"
            class="brand-pill"
            data-brand-showcase="${escapeHTML(
              brand
            )}"
          >
            <span>${escapeHTML(
              brand
            )}</span>
            <i class="bx bx-right-arrow-alt"></i>
          </button>
        `
      )
      .join("");
}


function getProductTagInfo(product) {
  if (product.available === false) {
    return {
      text: "Agotado",
      className: "tag--sold-out"
    };
  }

  if (product.offer === true) {
    return {
      text: "Oferta",
      className: "tag--offer"
    };
  }

  if (product.new === true) {
    return {
      text: "Nuevo",
      className: "tag--new"
    };
  }

  if (product.featured === true) {
    return {
      text: "Destacado",
      className: "tag--featured"
    };
  }

  return null;
}


/*==================================
  CREAR TARJETA DE PRODUCTO
==================================*/

function productCardHTML(product) {
  const colors =
    Array.isArray(product.colors)
      ? product.colors
      : [];

  const firstColor =
    colors[0] || null;

  const image =
    firstColor?.image ||
    product.image ||
    CONFIG.fallbackImage;

  const isFavorite =
    state.favorites.includes(
      product.id
    );

  const tagInfo =
    getProductTagInfo(
      product
    );

  return `
    <article
      class="product-card ${
        product.available === false
          ? "product-card--sold-out"
          : ""
      }"
      data-id="${escapeHTML(
        product.id
      )}"
      data-color="${escapeHTML(
        firstColor?.name || ""
      )}"
    >

      <div class="product-media">

        <button
          type="button"
          data-action="details"
          aria-label="Ver detalle de ${escapeHTML(
            product.name
          )}"
        >
          <img
            src="${escapeHTML(
              image
            )}"
            alt="${escapeHTML(
              product.name
            )}"
            class="product-image"
            loading="lazy"
          >
        </button>

        ${
          tagInfo
            ? `
              <span
                class="tag ${tagInfo.className}"
              >
                ${escapeHTML(
                  tagInfo.text
                )}
              </span>
            `
            : ""
        }

        <button
          type="button"
          class="favorite ${
            isFavorite
              ? "active"
              : ""
          }"
          data-action="favorite"
          aria-label="${
            isFavorite
              ? "Quitar de favoritos"
              : "Agregar a favoritos"
          }"
        >
          <i
            class="bx ${
              isFavorite
                ? "bxs-heart"
                : "bx-heart"
            }"
          ></i>
        </button>

      </div>

      <div class="product-content">

        <span class="product-brand">
          ${escapeHTML(
            product.brand ||
            product.category
          )}
        </span>

        <button
          type="button"
          class="product-name"
          data-action="details"
        >
          ${escapeHTML(
            product.name
          )}
        </button>

        <span class="product-sub">
          ${escapeHTML(
            product.subcategory || ""
          )}
        </span>

        <div class="product-price-wrap">
          ${
            Number(product.oldPrice) >
            Number(product.price)
              ? `
                <span class="product-old-price">
                  ${formatPrice(
                    product.oldPrice,
                    product.currency ||
                    "CRC"
                  )}
                </span>
              `
              : ""
          }

          <strong class="product-price">
            ${formatPrice(
              product.price,
              product.currency ||
              "CRC"
            )}
          </strong>
        </div>

        <div class="swatches">

          ${colors
            .slice(0, 6)
            .map(
              (
                color,
                index
              ) => `
                <button
                  type="button"
                  class="swatch ${
                    index === 0
                      ? "selected"
                      : ""
                  }"
                  data-action="color"
                  data-color="${escapeHTML(
                    color.name
                  )}"
                  data-image="${escapeHTML(
                    color.image ||
                    product.image ||
                    CONFIG.fallbackImage
                  )}"
                  style="--swatch: ${escapeHTML(
                    color.value ||
                    "#cccccc"
                  )};"
                  title="${escapeHTML(
                    color.name
                  )}"
                  aria-label="Seleccionar color ${escapeHTML(
                    color.name
                  )}"
                ></button>
              `
            )
            .join("")}

        </div>

        <div class="product-actions">

          <button
            type="button"
            class="add-cart add-cart-icon"
            data-action="add-cart"
            aria-label="${
              product.available === false
                ? "Producto agotado"
                : `Agregar ${escapeHTML(product.name)} al carrito`
            }"
            title="${
              product.available === false
                ? "Producto agotado"
                : "Agregar al carrito"
            }"
            ${
              product.available === false
                ? "disabled"
                : ""
            }
          >
            <i class="bx ${
              product.available === false
                ? "bx-x-circle"
                : "bxs-shopping-bag"
            }"></i>
          </button>

          <button
            type="button"
            class="details details-icon"
            data-action="details"
            aria-label="Ver detalle de ${escapeHTML(
              product.name
            )}"
            title="Ver detalle"
          >
            <i class="bx bx-show"></i>
          </button>

          <button
            type="button"
            class="share-product"
            data-action="share"
            aria-label="Compartir ${escapeHTML(
              product.name
            )} por WhatsApp"
            title="Compartir por WhatsApp"
          >
            <i class="bx bxl-whatsapp"></i>
          </button>

        </div>

      </div>

    </article>
  `;
}


/*==================================
  FAVORITOS
==================================*/

function toggleFavorite(id) {
  const index =
    state.favorites.indexOf(id);

  if (index === -1) {
    state.favorites.push(id);

    toast(
      "Producto agregado a favoritos"
    );
  } else {
    state.favorites.splice(
      index,
      1
    );

    toast(
      "Producto eliminado de favoritos"
    );
  }

  saveStorage(
    CONFIG.favoritesKey,
    state.favorites
  );

  updateCounters();

  replayAnimation($("#favorites-count"), "counter--pop");

  renderProducts();

  if (
    $("#favorites-drawer")
      ?.classList.contains("open")
  ) {
    renderFavoritesDrawer();
  }
}


/*==================================
  CLAVE DEL CARRITO
==================================*/

function cartKey(
  id,
  color = ""
) {
  return `${id}::${color}`;
}


/*==================================
  AGREGAR AL CARRITO
==================================*/

function addToCart(
  id,
  color = "",
  card = null,
  quantity = 1
) {
  const product =
    productById(id);

  if (!product) {
    return;
  }

  if (product.available === false) {
    toast(
      "Este producto está agotado"
    );

    return;
  }

  const safeQuantity = Math.max(
    1,
    Math.min(99, Number(quantity) || 1)
  );

  const key =
    cartKey(
      id,
      color
    );

  const existing =
    state.cart.find(
      (item) =>
        item.key === key
    );

  const image =
    card
      ? $(
          ".product-image",
          card
        )?.src
      : product.image;

  if (existing) {
    existing.quantity += safeQuantity;
  } else {
    state.cart.push({
      key,

      id,

      name:
        product.name,

      brand:
        product.brand || "",

      price:
        Number(
          product.price
        ) || 0,

      currency:
        product.currency ||
        "CRC",

      color,

      image:
        image ||
        CONFIG.fallbackImage,

      quantity: safeQuantity
    });
  }

  saveStorage(
    CONFIG.cartKey,
    state.cart
  );

  updateCounters();

  animateCartCounter();

  renderCart();

  toast(
    "Producto agregado al carrito"
  );

  openCart();
}


/*==================================
  ACTUALIZAR CONTADORES
==================================*/

function updateCounters() {
  const cartCounter =
    $("#cart-count");

  const favoritesCounter =
    $("#favorites-count");

  const cartQuantity =
    state.cart.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  if (cartCounter) {
    cartCounter.textContent =
      String(
        cartQuantity
      );

    cartCounter.classList.toggle(
      "show",
      cartQuantity > 0
    );
  }

  if (favoritesCounter) {
    favoritesCounter.textContent =
      String(
        state.favorites.length
      );

    favoritesCounter.classList.toggle(
      "show",
      state.favorites.length > 0
    );
  }
}


/*==================================
  TOTAL DEL CARRITO
==================================*/

function cartTotal() {
  return state.cart.reduce(
    (
      total,
      item
    ) =>
      total +
      Number(
        item.price || 0
      ) *
      Number(
        item.quantity || 0
      ),
    0
  );
}


/*==================================
  MOSTRAR CARRITO
==================================*/

function getCartUnits() {
  return state.cart.reduce(
    (total, item) =>
      total + Number(item.quantity || 1),
    0
  );
}


function updateCartPremiumSummary() {
  const units =
    getCartUnits();

  const count =
    $("#cart-items-count");

  const summary =
    $("#cart-header-summary");

  if (count) {
    count.textContent =
      String(units);
  }

  if (summary) {
    summary.textContent =
      units === 0
        ? "Su carrito está vacío."
        : units === 1
          ? "Tiene 1 producto seleccionado."
          : `Tiene ${units} productos seleccionados.`;
  }
}


function renderCart() {
  const container =
    $("#cart-items");

  const totalElement =
    $("#cart-total");

  const clearButton =
    $("#cart-clear");

  const whatsappButton =
    $("#cart-whatsapp");

  if (
    !container ||
    !totalElement
  ) {
    return;
  }

  const isEmpty =
    state.cart.length === 0;

  if (isEmpty) {
    container.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty__icon">
          <i class="bx bx-shopping-bag"></i>
        </span>

        <h3>Su carrito está vacío</h3>

        <p>
          Agregue productos y continúe su pedido fácilmente por WhatsApp.
        </p>

        <button
          type="button"
          class="button outline"
          data-cart-empty-continue
        >
          Explorar productos
        </button>
      </div>
    `;
  } else {
    container.innerHTML =
      state.cart
        .map(
          (item) => `
            <article class="cart-item">

              <img
                src="${escapeHTML(
                  item.image ||
                  CONFIG.fallbackImage
                )}"
                alt="${escapeHTML(
                  item.name
                )}"
                loading="lazy"
                decoding="async"
                width="180"
                height="180"
              >

              <div>

                <small>
                  ${escapeHTML(
                    item.brand || ""
                  )}
                </small>

                <h3>
                  ${escapeHTML(
                    item.name
                  )}
                </h3>

                ${
                  item.color
                    ? `
                      <p>
                        Color:
                        ${escapeHTML(
                          item.color
                        )}
                      </p>
                    `
                    : ""
                }

                <strong>
                  ${formatPrice(
                    item.price,
                    item.currency ||
                    "CRC"
                  )}
                </strong>

                <div class="cart-controls">

                  <div class="qty">

                    <button
                      type="button"
                      data-cart="minus"
                      data-key="${escapeHTML(
                        item.key
                      )}"
                      aria-label="Disminuir cantidad"
                    >
                      <i class="bx bx-minus"></i>
                    </button>

                    <span>
                      ${item.quantity}
                    </span>

                    <button
                      type="button"
                      data-cart="plus"
                      data-key="${escapeHTML(
                        item.key
                      )}"
                      aria-label="Aumentar cantidad"
                    >
                      <i class="bx bx-plus"></i>
                    </button>

                  </div>

                  <button
                    type="button"
                    class="remove"
                    data-cart="remove"
                    data-key="${escapeHTML(
                      item.key
                    )}"
                    aria-label="Eliminar producto"
                  >
                    <i class="bx bx-trash"></i>
                  </button>

                </div>

              </div>

            </article>
          `
        )
        .join("");
  }

  totalElement.textContent =
    formatPrice(
      cartTotal()
    );

  if (clearButton) {
    clearButton.disabled =
      isEmpty;
  }

  if (whatsappButton) {
    whatsappButton.disabled =
      isEmpty;
  }

  updateCartPremiumSummary();
}

/*==================================
  ABRIR CARRITO
==================================*/

function openCart() {
  const drawer =
    $("#cart-drawer");

  const overlay =
    $("#overlay");

  if (
    !drawer ||
    !overlay
  ) {
    return;
  }

  drawer.classList.add(
    "open"
  );

  overlay.hidden =
    false;

  requestAnimationFrame(() => {
    overlay.classList.add(
      "show"
    );
  });

  document.body.classList.add(
    "no-scroll"
  );
}


/*==================================
  CERRAR CARRITO
==================================*/

function closeCart() {
  const drawer =
    $("#cart-drawer");

  const overlay =
    $("#overlay");

  if (
    !drawer ||
    !overlay
  ) {
    return;
  }

  drawer.classList.remove(
    "open"
  );

  overlay.classList.remove(
    "show"
  );

  document.body.classList.remove(
    "no-scroll"
  );

  setTimeout(() => {
    if (
      !overlay.classList.contains(
        "show"
      )
    ) {
      overlay.hidden =
        true;
    }
  }, 250);
}


/*==================================
  ENVIAR CARRITO POR WHATSAPP
==================================*/

function sendCartWhatsApp() {
  if (
    state.cart.length === 0
  ) {
    return;
  }

  const lines = [
    "Hola Botanika CR,",
    "",
    "Deseo consultar por el siguiente pedido:",
    ""
  ];

  state.cart.forEach(
    (
      item,
      index
    ) => {
      lines.push(
        `${index + 1}. ${item.name}`
      );

      if (item.color) {
        lines.push(
          `   Color: ${item.color}`
        );
      }

      lines.push(
        `   Cantidad: ${item.quantity}`
      );

      lines.push(
        `   Subtotal: ${formatPrice(
          Number(item.price) *
          Number(item.quantity),
          item.currency ||
          "CRC"
        )}`
      );

      lines.push("");
    }
  );

  lines.push(
    `Total estimado: ${formatPrice(
      cartTotal()
    )}`
  );

  lines.push("");

  lines.push(
    "Por favor, confírmenme disponibilidad y opciones de entrega."
  );

  window.open(
    whatsappUrl(
      lines.join("\n")
    ),
    "_blank",
    "noopener,noreferrer"
  );
}


/*==================================
  ABRIR MODAL
==================================*/

function openModal(id) {
  const product =
    productById(id);

  const modal =
    $("#product-modal");

  if (
    !product ||
    !modal
  ) {
    return;
  }

  state.modalProductId =
    id;

  state.modalQuantity = 1;

  updateModalQuantity();

  const colors =
    Array.isArray(
      product.colors
    )
      ? product.colors
      : [];

  const firstColor =
    colors[0] || null;

  state.modalColor =
    firstColor?.name || "";

  updateModalSelectedTone(
    state.modalColor
  );

  const modalImage =
    $("#modal-image");

  if (modalImage) {
    setModalMainImage(
      firstColor?.image ||
        product.image ||
        CONFIG.fallbackImage,
      product.name
    );
  }

  const modalBrand =
    $("#modal-brand");

  const modalName =
    $("#modal-name");

  const modalSubcategory =
    $("#modal-subcategory");

  const modalPrice =
    $("#modal-price");

  const modalDescription =
    $("#modal-description");

  const modalAvailability =
    $("#modal-availability");

  if (modalAvailability) {
    const isAvailable =
      product.available !== false;

    modalAvailability.classList.toggle(
      "is-unavailable",
      !isAvailable
    );

    modalAvailability.innerHTML =
      isAvailable
        ? '<i class="bx bx-check-circle"></i> Disponible'
        : '<i class="bx bx-x-circle"></i> Agotado';
  }

  const modalAddButton =
    $("#modal-add-cart");

  if (modalAddButton) {
    const isAvailable =
      product.available !== false;

    modalAddButton.disabled =
      !isAvailable;

    modalAddButton.setAttribute(
      "aria-label",
      isAvailable
        ? `Agregar ${product.name} al carrito`
        : "Producto agotado"
    );

    modalAddButton.title =
      isAvailable
        ? "Agregar al carrito"
        : "Producto agotado";

    modalAddButton.innerHTML =
      isAvailable
        ? '<i class="bx bxs-shopping-bag"></i><span>Agregar al carrito</span>'
        : '<i class="bx bx-x-circle"></i><span>Producto agotado</span>';
  }

  if (modalBrand) {
    modalBrand.textContent =
      product.brand ||
      product.category ||
      "";
  }

  if (modalName) {
    modalName.textContent =
      product.name;
  }

  if (modalSubcategory) {
    modalSubcategory.textContent =
      product.subcategory || "";
  }

  if (modalPrice) {
    modalPrice.textContent =
      formatPrice(
        product.price,
        product.currency ||
        "CRC"
      );
  }

  if (modalDescription) {
    modalDescription.textContent =
      product.description || "";
  }

  renderModalGallery(
    product,
    colors
  );

  renderModalColors(
    product,
    colors
  );

  renderRelatedProducts(
    product
  );

  updateModalWhatsApp(
    product
  );

  modal.hidden =
    false;

  requestAnimationFrame(() => {
    modal.classList.add(
      "show"
    );
  });

  document.body.classList.add(
    "no-scroll"
  );
}


/*==================================
  COLORES DEL MODAL
==================================*/

function getProductGalleryImages(
  product,
  colors = []
) {
  const images = [];

  const addImage =
    (src, label) => {
      const value =
        String(src || "").trim();

      if (
        !value ||
        images.some(
          (item) =>
            item.src === value
        )
      ) {
        return;
      }

      images.push({
        src: value,
        label:
          String(label || product.name)
      });
    };

  addImage(
    product.image,
    product.name
  );

  if (
    Array.isArray(product.images)
  ) {
    product.images.forEach(
      (image, index) => {
        if (
          typeof image === "string"
        ) {
          addImage(
            image,
            `${product.name} ${index + 1}`
          );
        } else {
          addImage(
            image?.src || image?.image,
            image?.alt ||
              image?.label ||
              `${product.name} ${index + 1}`
          );
        }
      }
    );
  }

  colors.forEach(
    (color) => {
      addImage(
        color.image,
        color.name
          ? `${product.name} - ${color.name}`
          : product.name
      );
    }
  );

  if (images.length === 0) {
    addImage(
      CONFIG.fallbackImage,
      product.name
    );
  }

  return images;
}


function setModalMainImage(
  src,
  alt
) {
  const image =
    $("#modal-image");

  if (!image) {
    return;
  }

  image.classList.remove(
    "modal-image--changing"
  );

  void image.offsetWidth;

  image.src =
    src || CONFIG.fallbackImage;

  image.alt =
    alt || "";

  image.classList.add(
    "modal-image--changing"
  );
}


function renderModalGallery(
  product,
  colors = []
) {
  const container =
    $("#modal-gallery");

  if (!container) {
    return;
  }

  const images =
    getProductGalleryImages(
      product,
      colors
    );

  if (images.length <= 1) {
    container.innerHTML = "";
    container.hidden = true;

    return;
  }

  container.hidden = false;

  container.innerHTML =
    images
      .map(
        (image, index) => `
          <button
            type="button"
            class="modal-gallery__thumb ${
              index === 0
                ? "is-active"
                : ""
            }"
            data-modal-gallery-image="${escapeHTML(
              image.src
            )}"
            data-modal-gallery-alt="${escapeHTML(
              image.label
            )}"
            aria-label="Ver imagen ${index + 1}"
          >
            <img
              src="${escapeHTML(
                image.src
              )}"
              alt="${escapeHTML(
                image.label
              )}"
              loading="lazy"
              decoding="async"
              width="62"
              height="62"
            >
          </button>
        `
      )
      .join("");
}


function updateModalSelectedTone(
  tone
) {
  const container =
    $("#modal-selected-tone");

  if (!container) {
    return;
  }

  const value =
    container.querySelector(
      "strong"
    );

  if (!value) {
    return;
  }

  if (!tone) {
    container.hidden = true;
    value.textContent = "";

    return;
  }

  container.hidden = false;
  value.textContent = tone;
}


function renderModalColors(
  product,
  colors
) {
  const container =
    $("#modal-colors");

  if (!container) {
    return;
  }

  if (
    !Array.isArray(colors) ||
    colors.length === 0
  ) {
    container.innerHTML =
      "";

    return;
  }

  container.innerHTML = `
    <p class="muted">
      Colores disponibles:
    </p>

    <div class="swatches">

      ${colors
        .map(
          (
            color,
            index
          ) => `
            <button
              type="button"
              class="modal-tone ${
                index === 0
                  ? "selected"
                  : ""
              }"
              data-modal-color="${escapeHTML(
                color.name
              )}"
              data-modal-image="${escapeHTML(
                color.image ||
                product.image ||
                CONFIG.fallbackImage
              )}"
              title="${escapeHTML(
                color.name
              )}"
              aria-label="Seleccionar color ${escapeHTML(
                color.name
              )}"
            >
              <span
                class="modal-tone__dot"
                style="--swatch: ${escapeHTML(
                  color.value ||
                  "#cccccc"
                )};"
              ></span>
              <span>${escapeHTML(color.name)}</span>
            </button>
          `
        )
        .join("")}

    </div>
  `;
}


/*==================================
  PRODUCTOS RELACIONADOS
==================================*/

function renderRelatedProducts(
  product
) {
  const container =
    $("#related-products");

  if (!container) {
    return;
  }

  const related =
    state.products
      .filter(
        (item) =>
          item.id !== product.id
      )
      .sort(
        (a, b) => {
          const score =
            (item) =>
              Number(
                item.category ===
                  product.category
              ) * 2 +
              Number(
                item.brand ===
                  product.brand
              );

          return (
            score(b) -
            score(a)
          );
        }
      )
      .slice(
        0,
        4
      );

  if (
    related.length === 0
  ) {
    container.innerHTML = `
      <p class="muted">
        No hay productos relacionados.
      </p>
    `;

    return;
  }

  container.innerHTML =
    related
      .map(
        (item) => `
          <button
            type="button"
            class="related-card"
            data-related="${escapeHTML(
              item.id
            )}"
          >

            <span class="related-card__media">
              <img
                src="${escapeHTML(
                  item.image ||
                  CONFIG.fallbackImage
                )}"
                alt="${escapeHTML(
                  item.name
                )}"
                loading="lazy"
                decoding="async"
                width="68"
                height="68"
              >
            </span>

            <small>
              ${escapeHTML(
                item.brand ||
                item.category ||
                ""
              )}
            </small>

            <span>
              ${escapeHTML(
                item.name
              )}
            </span>

            <strong>
              ${formatPrice(
                item.price,
                item.currency ||
                "CRC"
              )}
            </strong>

          </button>
        `
      )
      .join("");
}




/*==================================
  CANTIDAD DEL MODAL
==================================*/

function updateModalQuantity() {
  const value = $("#modal-quantity");
  const minus = $("#modal-quantity-minus");

  state.modalQuantity = Math.max(
    1,
    Math.min(99, Number(state.modalQuantity) || 1)
  );

  if (value) {
    value.textContent = String(state.modalQuantity);
  }

  if (minus) {
    minus.disabled = state.modalQuantity <= 1;
  }
}

/*==================================
  ACTUALIZAR WHATSAPP DEL MODAL
==================================*/

function updateModalWhatsApp(
  product
) {
  const button =
    $("#modal-whatsapp");

  if (
    !button ||
    !product
  ) {
    return;
  }

  const lines = [
    "Hola Botanika CR,",
    "",
    `Deseo consultar por: ${product.name}.`
  ];

  if (state.modalColor) {
    lines.push(
      `Color o tono: ${state.modalColor}.`
    );
  }

  button.href =
    whatsappUrl(
      lines.join("\n")
    );
}


/*==================================
  CERRAR MODAL
==================================*/

function closeModal() {
  closeImageZoom();

  const modal =
    $("#product-modal");

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "show"
  );

  document.body.classList.remove(
    "no-scroll"
  );

  setTimeout(() => {
    if (
      !modal.classList.contains(
        "show"
      )
    ) {
      modal.hidden =
        true;
    }
  }, 220);
}

/*==================================
  EVENTOS GENERALES
==================================*/

/*==================================
  ZOOM DE IMAGEN
==================================*/

function openImageZoom() {
  const zoom = $("#image-zoom");
  const sourceImage = $("#modal-image");
  const zoomImage = $("#zoom-image");
  if (!zoom || !sourceImage || !zoomImage) return;
  zoomImage.src = sourceImage.src;
  zoomImage.alt = sourceImage.alt || "";
  zoom.hidden = false;
  requestAnimationFrame(() => zoom.classList.add("show"));
  document.body.classList.add("no-scroll");
}

function closeImageZoom() {
  const zoom = $("#image-zoom");
  if (!zoom) return;
  zoom.classList.remove("show");
  setTimeout(() => { if (!zoom.classList.contains("show")) zoom.hidden = true; }, 220);
  const productModal = $("#product-modal");
  if (!productModal || productModal.hidden) document.body.classList.remove("no-scroll");
}

/*==================================
  CARRUSEL DE PORTADA
==================================*/

function initHeroCarousel() {
  const slides =
    $$("[data-hero-slide]");

  const dots =
    $$("[data-hero-dot]");

  const previousButton =
    $("#hero-prev");

  const nextButton =
    $("#hero-next");

  if (
    slides.length === 0
  ) {
    return;
  }

  let currentIndex = 0;
  let timerId = null;

  function showSlide(index) {
    currentIndex =
      (index + slides.length) %
      slides.length;

    slides.forEach(
      (slide, slideIndex) => {
        const isActive =
          slideIndex === currentIndex;

        slide.classList.toggle(
          "is-active",
          isActive
        );

        slide.setAttribute(
          "aria-hidden",
          String(!isActive)
        );
      }
    );

    dots.forEach(
      (dot, dotIndex) => {
        dot.classList.toggle(
          "is-active",
          dotIndex === currentIndex
        );
      }
    );
  }

  function nextSlide() {
    showSlide(
      currentIndex + 1
    );
  }

  function restartTimer() {
    clearInterval(timerId);

    timerId =
      setInterval(
        nextSlide,
        6000
      );
  }

  previousButton
    ?.addEventListener(
      "click",
      () => {
        showSlide(
          currentIndex - 1
        );

        restartTimer();
      }
    );

  nextButton
    ?.addEventListener(
      "click",
      () => {
        nextSlide();

        restartTimer();
      }
    );

  dots.forEach(
    (dot) => {
      dot.addEventListener(
        "click",
        () => {
          showSlide(
            Number(
              dot.dataset.heroDot
            )
          );

          restartTimer();
        }
      );
    }
  );

  const carousel =
    $(".hero-carousel");

  carousel
    ?.addEventListener(
      "mouseenter",
      () => {
        clearInterval(timerId);
      }
    );

  carousel
    ?.addEventListener(
      "mouseleave",
      restartTimer
    );

  showSlide(0);
  restartTimer();
}


function openFavorites() {
  const drawer = $("#favorites-drawer");
  const overlay = $("#overlay");

  if (!drawer || !overlay) {
    return;
  }

  renderFavoritesDrawer();

  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");

  overlay.hidden = false;

  requestAnimationFrame(() => {
    overlay.classList.add("show");
  });

  document.body.classList.add("no-scroll");
}


function closeFavorites() {
  const drawer = $("#favorites-drawer");
  const overlay = $("#overlay");

  if (!drawer || !overlay) {
    return;
  }

  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");

  if (!$("#cart-drawer")?.classList.contains("open")) {
    overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");

    setTimeout(() => {
      if (!overlay.classList.contains("show")) {
        overlay.hidden = true;
      }
    }, 250);
  }
}


function renderFavoritesDrawer() {
  const container = $("#favorites-items");

  if (!container) {
    return;
  }

  const favoriteProducts =
    state.products.filter(
      product =>
        state.favorites.includes(product.id)
    );

  if (favoriteProducts.length === 0) {
    container.innerHTML = `
      <div class="favorites-empty">
        <i class="bx bx-heart"></i>
        <h3>Aún no tiene favoritos</h3>
        <p>Presione el corazón de un producto para guardarlo aquí.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    favoriteProducts
      .map(
        product => `
          <article class="favorite-drawer-item" data-id="${escapeHTML(product.id)}">
            <img
              src="${escapeHTML(product.image || CONFIG.fallbackImage)}"
              alt="${escapeHTML(product.name)}"
            >

            <div>
              <small>${escapeHTML(product.brand || "")}</small>
              <strong>${escapeHTML(product.name)}</strong>
              <span>${formatPrice(product.price, product.currency || "CRC")}</span>
            </div>

            <div class="favorite-drawer-actions">
              <button type="button" data-favorite-drawer-action="details" aria-label="Ver detalle">
                <i class="bx bx-show"></i>
              </button>
              <button type="button" data-favorite-drawer-action="remove" aria-label="Quitar de favoritos">
                <i class="bx bx-trash"></i>
              </button>
            </div>
          </article>
        `
      )
      .join("");
}


function shareProduct(id) {
  const product = productById(id);

  if (!product) {
    return;
  }

  const message = [
    "Hola Botanika CR,",
    "",
    "Me interesa este producto:",
    product.name,
    product.brand ? `Marca: ${product.brand}` : "",
    `Precio: ${formatPrice(product.price, product.currency || "CRC")}`,
    "",
    "¿Me puede brindar más información?"
  ]
    .filter(Boolean)
    .join("\n");

  window.open(
    whatsappUrl(message),
    "_blank",
    "noopener,noreferrer"
  );
}


/*==================================
  BUSCADOR INTELIGENTE
==================================*/

function closeSearchSuggestions() {
  const container =
    $("#search-suggestions");

  const input =
    $("#product-search");

  if (!container) {
    return;
  }

  container.hidden = true;
  container.innerHTML = "";

  input?.setAttribute(
    "aria-expanded",
    "false"
  );
}


function renderSearchSuggestions(
  value
) {
  const container =
    $("#search-suggestions");

  const input =
    $("#product-search");

  if (
    !container ||
    !input
  ) {
    return;
  }

  const search =
    normalize(value);

  if (
    !search ||
    search.length < 2
  ) {
    closeSearchSuggestions();

    return;
  }

  const allMatches = state.products
    .filter((product) =>
      productMatchesSearch(product, search)
    )
    .sort(
      (a, b) =>
        productSearchScore(b, search) -
        productSearchScore(a, search)
    );

  const matches = allMatches.slice(0, 6);

  if (
    matches.length === 0
  ) {
    container.innerHTML = `
      <div class="smart-search-empty">
        <i class="bx bx-search-alt"></i>
        <strong>Sin resultados</strong>
        <span>No encontramos productos con “${escapeHTML(value)}”.</span>
      </div>
    `;

    container.hidden = false;
    input.setAttribute(
      "aria-expanded",
      "true"
    );

    return;
  }

  container.innerHTML = `
    <div class="smart-search-panel__head">
      <span>Sugerencias</span>
      <small>${allMatches.length} ${allMatches.length === 1 ? "resultado" : "resultados"}</small>
    </div>

    <div class="smart-search-results">
      ${matches
        .map(
          (product) => `
            <button
              type="button"
              class="smart-search-item"
              data-search-product="${escapeHTML(
                product.id
              )}"
            >
              <span class="smart-search-item__media">
                <img
                  src="${escapeHTML(
                    product.image ||
                    CONFIG.fallbackImage
                  )}"
                  alt="${escapeHTML(
                    product.name
                  )}"
                  loading="lazy"
                  decoding="async"
                  width="58"
                  height="58"
                >
              </span>

              <span class="smart-search-item__body">
                <small>${escapeHTML(
                  product.brand ||
                  product.category ||
                  ""
                )}</small>

                <strong>${escapeHTML(
                  product.name
                )}</strong>

                <span class="smart-search-item__details">
                  <span>${escapeHTML(
                    searchMatchContext(product, value)
                  )}</span>

                  <b>${formatPrice(
                    product.price,
                    product.currency ||
                    "CRC"
                  )}</b>
                </span>
              </span>

              <i class="bx bx-chevron-right"></i>
            </button>
          `
        )
        .join("")}
    </div>

    <button
      type="button"
      class="smart-search-view-all"
      data-search-view-all
    >
      Ver todos los resultados
      <i class="bx bx-right-arrow-alt"></i>
    </button>
  `;

  container.hidden = false;
  input.setAttribute(
    "aria-expanded",
    "true"
  );
}


function openSuggestionProduct(
  id
) {
  closeSearchSuggestions();

  if (!productById(id)) {
    return;
  }

  openModal(id);
}


/*==================================
  MENÚ RESPONSIVE
==================================*/

function setMobileMenu(
  open
) {
  const menu =
    $("#nav-menu");

  const toggle =
    $("#nav-toggle");

  if (
    !menu ||
    !toggle
  ) {
    return;
  }

  menu.classList.toggle(
    "show",
    open
  );

  document.body.classList.toggle(
    "menu-open",
    open
  );

  toggle.setAttribute(
    "aria-expanded",
    String(open)
  );

  toggle.setAttribute(
    "aria-label",
    open
      ? "Cerrar menú"
      : "Abrir menú"
  );

  const icon =
    $("i", toggle);

  if (icon) {
    icon.className =
      open
        ? "bx bx-x"
        : "bx bx-menu";
  }
}


function toggleMobileMenu() {
  const menu =
    $("#nav-menu");

  setMobileMenu(
    !menu?.classList.contains(
      "show"
    )
  );
}


function closeMobileMenu() {
  setMobileMenu(false);
}


function closeProductModalSafely() {
  const modal =
    $("#product-modal");

  if (!modal) {
    return;
  }

  closeModal();
}


function replayAnimation(
  element,
  className
) {
  if (!element) {
    return;
  }

  element.classList.remove(
    className
  );

  void element.offsetWidth;

  element.classList.add(
    className
  );

  window.setTimeout(
    () => {
      element.classList.remove(
        className
      );
    },
    520
  );
}


function animateCartCounter() {
  replayAnimation(
    $("#cart-count"),
    "counter--pop"
  );

  replayAnimation(
    $("#cart-button"),
    "nav-action--pulse"
  );
}


function animateFavoriteButton(
  button
) {
  replayAnimation(
    button,
    "favorite--beat"
  );

  replayAnimation(
    $("#favorites-count"),
    "counter--pop"
  );
}


function animateShareButton(
  button
) {
  replayAnimation(
    button,
    "share-product--sent"
  );
}


function animateFilterButton(
  button
) {
  replayAnimation(
    button,
    "quick-filter--selected"
  );
}


function animateProductImageChange(
  image
) {
  replayAnimation(
    image,
    "product-image--changed"
  );
}


function scheduleResponsiveRefresh() {
  let timerId = null;

  return () => {
    window.clearTimeout(
      timerId
    );

    timerId =
      window.setTimeout(
        () => {
          updateCompactHeaderState();
          closeSearchSuggestions();

          if (
            window.innerWidth > 760
          ) {
            closeMobileMenu();
          }
        },
        120
      );
  };
}


function initEvents() {
  const searchInput =
    $("#product-search");

  const clearSearchButton =
    $("#clear-search");

  const categoryFilter =
    $("#category-filter");

  const brandFilter =
    $("#brand-filter");

  const priceFilter =
    $("#price-filter");

  const sortFilter =
    $("#product-sort");

  const pageSizeFilter =
    $("#page-size");


  /*===== ACCESIBILIDAD DEL MODAL =====*/

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !$("#product-modal")?.hidden
      ) {
        closeProductModalSafely();
      }
    }
  );


  /* El menú responsive se inicializa exclusivamente en initNavigation(). */


  /*===== AUDITORÍA DE LAYOUT =====*/

  const responsiveRefresh =
    scheduleResponsiveRefresh();




  window.addEventListener(
    "resize",
    responsiveRefresh,
    {
      passive: true
    }
  );


  /*===== BÚSQUEDA =====*/

  searchInput?.addEventListener(
    "input",
    (event) => {
      state.filters.search =
        event.target.value;

      state.page = 1;

      if (clearSearchButton) {
        clearSearchButton.hidden =
          !event.target.value;
      }

      renderSearchSuggestions(
        event.target.value
      );

      applyFilters();
    }
  );


  clearSearchButton?.addEventListener(
    "click",
    () => {
      state.filters.search =
        "";

      if (searchInput) {
        searchInput.value =
          "";

        searchInput.focus();
      }

      clearSearchButton.hidden =
        true;

      closeSearchSuggestions();

      state.page = 1;

      applyFilters();
    }
  );


  /*===== SUGERENCIAS DEL BUSCADOR =====*/

  $("#search-suggestions")
    ?.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-search-product]"
          );

        if (!button) {
          return;
        }

        openSuggestionProduct(
          button.dataset.searchProduct
        );
      }
    );

  $("#search-suggestions")
    ?.addEventListener(
      "click",
      (event) => {
        const viewAll =
          event.target.closest(
            "[data-search-view-all]"
          );

        if (!viewAll) {
          return;
        }

        closeSearchSuggestions();

        document
          .querySelector(
            "#productos"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );

  document.addEventListener(
    "click",
    (event) => {
      if (
        !event.target.closest(
          ".smart-search"
        )
      ) {
        closeSearchSuggestions();
      }
    }
  );

  searchInput?.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key ===
        "Escape"
      ) {
        closeSearchSuggestions();
      }
    }
  );

  searchInput?.addEventListener(
    "focus",
    () => {
      if (
        searchInput.value.trim().length >= 2
      ) {
        renderSearchSuggestions(
          searchInput.value
        );
      }
    }
  );


  /*===== FILTROS =====*/

  categoryFilter?.addEventListener(
    "change",
    (event) => {
      state.filters.category =
        event.target.value;

      state.page = 1;

      applyFilters();
    }
  );


  brandFilter?.addEventListener(
    "change",
    (event) => {
      state.filters.brand =
        event.target.value;

      state.page = 1;

      applyFilters();
    }
  );


  priceFilter?.addEventListener(
    "change",
    (event) => {
      state.filters.price =
        event.target.value;

      state.page = 1;

      applyFilters();
    }
  );


  sortFilter?.addEventListener(
    "change",
    (event) => {
      state.filters.sort =
        event.target.value;

      state.page = 1;

      applyFilters();
    }
  );


  pageSizeFilter?.addEventListener(
    "change",
    (event) => {
      const value =
        event.target.value;

      state.pageSize =
        value === "all"
          ? Math.max(
              state.filtered.length,
              state.products.length,
              1
            )
          : Number(value) || 12;

      state.page = 1;

      applyFilters();
    }
  );


  /*===== CATEGORÍAS =====*/

  document.addEventListener(
    "click",
    (event) => {
      const categoryCard =
        event.target.closest(
          ".category-card[data-category]"
        );

      if (!categoryCard) {
        return;
      }

      const category =
        categoryCard.dataset.category;

      state.filters.category =
        category;

      state.page = 1;

      if (categoryFilter) {
        categoryFilter.value =
          category;
      }

      applyFilters();

      $("#productos")
        ?.scrollIntoView({
          behavior: "smooth",

          block: "start"
        });
    }
  );


  /*===== PRODUCTOS =====*/

  $("#products-container")
    ?.addEventListener(
      "click",
      (event) => {
        const actionElement =
          event.target.closest(
            "[data-action]"
          );

        const card =
          event.target.closest(
            ".product-card"
          );

        if (
          !actionElement ||
          !card
        ) {
          return;
        }

        const id =
          card.dataset.id;

        const action =
          actionElement.dataset.action;


        if (
          action ===
          "favorite"
        ) {
          toggleFavorite(id);

          return;
        }


        if (
          action ===
          "details"
        ) {
          openModal(id);

          return;
        }


        if (action === "share") {
          shareProduct(id);
          return;
        }

        if (
          action ===
          "add-cart"
        ) {
          if (actionElement.disabled) {
            return;
          }

          addToCart(
            id,
            card.dataset.color || "",
            card
          );

          return;
        }


        if (
          action ===
          "color"
        ) {
          $$(".swatch", card)
            .forEach(
              (swatch) => {
                swatch.classList.remove(
                  "selected"
                );
              }
            );

          actionElement.classList.add(
            "selected"
          );

          card.dataset.color =
            actionElement.dataset.color ||
            "";

          const image =
            $(".product-image", card);

          if (image) {
            image.src =
              actionElement.dataset.image ||
              CONFIG.fallbackImage;
          }
        }
      }
    );



  /*===== PRODUCTOS DESTACADOS =====*/

  $("#featured-products")
    ?.addEventListener(
      "click",
      (event) => {
        const actionElement =
          event.target.closest(
            "[data-action]"
          );

        const card =
          event.target.closest(
            ".product-card"
          );

        if (
          !actionElement ||
          !card
        ) {
          return;
        }

        const id =
          card.dataset.id;

        const action =
          actionElement.dataset.action;

        if (
          action ===
          "favorite"
        ) {
          toggleFavorite(id);
          renderFeaturedProducts();
          return;
        }

        if (
          action ===
          "details"
        ) {
          openModal(id);
          return;
        }

        if (action === "share") {
          shareProduct(id);
          return;
        }

        if (
          action ===
          "add-cart"
        ) {
          if (actionElement.disabled) {
            return;
          }

          addToCart(
            id,
            card.dataset.color || "",
            card
          );

          return;
        }

        if (
          action ===
          "color"
        ) {
          $$(".swatch", card)
            .forEach(
              (swatch) => {
                swatch.classList.remove(
                  "selected"
                );
              }
            );

          actionElement.classList.add(
            "selected"
          );

          card.dataset.color =
            actionElement.dataset.color ||
            "";

          const image =
            $(".product-image", card);

          if (image) {
            image.src =
              actionElement.dataset.image ||
              CONFIG.fallbackImage;
          }
        }
      }
    );


  /*===== PRODUCTOS NUEVOS =====*/

  $("#new-products")
    ?.addEventListener(
      "click",
      (event) => {
        const actionElement =
          event.target.closest(
            "[data-action]"
          );

        const card =
          event.target.closest(
            ".product-card"
          );

        if (
          !actionElement ||
          !card
        ) {
          return;
        }

        const id =
          card.dataset.id;

        const action =
          actionElement.dataset.action;

        if (
          action ===
          "favorite"
        ) {
          toggleFavorite(id);
          renderNewProducts();
          return;
        }

        if (
          action ===
          "details"
        ) {
          openModal(id);
          return;
        }

        if (action === "share") {
          shareProduct(id);
          return;
        }

        if (
          action ===
          "add-cart"
        ) {
          if (actionElement.disabled) {
            return;
          }

          addToCart(
            id,
            card.dataset.color || "",
            card
          );

          return;
        }

        if (
          action ===
          "color"
        ) {
          $$(".swatch", card)
            .forEach(
              (swatch) => {
                swatch.classList.remove(
                  "selected"
                );
              }
            );

          actionElement.classList.add(
            "selected"
          );

          card.dataset.color =
            actionElement.dataset.color ||
            "";

          const image =
            $(".product-image", card);

          if (image) {
            image.src =
              actionElement.dataset.image ||
              CONFIG.fallbackImage;
          }
        }
      }
    );


  /*===== MARCAS DEL HOME =====*/

  $("#brands-showcase")
    ?.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-brand-showcase]"
          );

        if (!button) {
          return;
        }

        const brand =
          String(
            button.dataset.brandShowcase ||
            ""
          ).trim();

        const brandFilter =
          $("#brand-filter");

        if (
          !brand ||
          !brandFilter
        ) {
          return;
        }

        const matchingOption =
          [...brandFilter.options]
            .find(
              (option) =>
                String(option.value)
                  .trim()
                  .toLocaleLowerCase("es") ===
                brand.toLocaleLowerCase("es")
            );

        if (!matchingOption) {
          toast(
            `No se encontró la marca ${brand}`
          );

          return;
        }

        brandFilter.value =
          matchingOption.value;

        brandFilter.dispatchEvent(
          new Event(
            "change",
            {
              bubbles: true
            }
          )
        );

        $$(".brand-pill")
          .forEach(
            (brandButton) => {
              brandButton.classList.toggle(
                "is-active",
                brandButton === button
              );
            }
          );

        document
          .querySelector(
            "#productos"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );

  /*===== FILTROS DEL CARRUSEL =====*/

  document
    .querySelectorAll(
      "[data-carousel-filter]"
    )
    .forEach(
      (link) => {
        link.addEventListener(
          "click",
          (event) => {
            event.preventDefault();

            const filter =
              String(
                link.dataset.carouselFilter ||
                "all"
              );

            state.filters.quick =
              filter;

            if (
              [
                "new",
                "featured",
                "offer"
              ].includes(filter)
            ) {
              resetSecondaryFilters();
            }

            state.page =
              1;

            $$(".quick-filter")
              .forEach(
                (button) => {
                  button.classList.toggle(
                    "is-active",
                    button.dataset.quickFilter ===
                    filter
                  );
                }
              );

            applyFilters();

            requestAnimationFrame(
              () => {
                document
                  .querySelector(
                    "#productos"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
              }
            );
          }
        );
      }
    );


  


  /*===== FILTROS RÁPIDOS =====*/

  $("#quick-filters")
    ?.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-quick-filter]"
          );

        if (!button) {
          return;
        }

        state.filters.quick =
          button.dataset.quickFilter ||
          "all";

        if (
          [
            "new",
            "featured",
            "offer"
          ].includes(
            state.filters.quick
          )
        ) {
          resetSecondaryFilters();
        }

        animateFilterButton(
          button
        );

        state.page = 1;

        $$(".quick-filter")
          .forEach(
            item => {
              item.classList.toggle(
                "is-active",
                item === button
              );
            }
          );

        applyFilters();
      }
    );


  /*===== FAVORITOS =====*/

  $("#favorites-button")
    ?.addEventListener(
      "click",
      openFavorites
    );

  $("#favorites-close")
    ?.addEventListener(
      "click",
      closeFavorites
    );

  $("#favorites-items")
    ?.addEventListener(
      "click",
      (event) => {
        const actionButton =
          event.target.closest(
            "[data-favorite-drawer-action]"
          );

        const item =
          event.target.closest(
            ".favorite-drawer-item"
          );

        if (!actionButton || !item) {
          return;
        }

        const id = item.dataset.id;
        const action =
          actionButton.dataset.favoriteDrawerAction;

        if (action === "details") {
          closeFavorites();
          openModal(id);
          return;
        }

        if (action === "remove") {
          toggleFavorite(id);
          renderFavoritesDrawer();
        }
      }
    );


  /*===== MICROANIMACIONES =====*/

  document.addEventListener(
    "click",
    (event) => {
      const favorite =
        event.target.closest(
          '[data-action="favorite"]'
        );

      const cart =
        event.target.closest(
          '[data-action="add-cart"], #modal-add-cart'
        );

      const share =
        event.target.closest(
          '[data-action="share"]'
        );

      const filter =
        event.target.closest(
          ".quick-filter"
        );

      if (favorite) {
        animateFavoriteButton(
          favorite
        );
      }

      if (cart) {
        replayAnimation(
          cart,
          "add-cart--success"
        );
      }

      if (share) {
        animateShareButton(
          share
        );
      }

      if (filter) {
        animateFilterButton(
          filter
        );
      }
    }
  );


  /*===== PAGINACIÓN =====*/

  $("#pagination")
    ?.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-page]"
          );

        if (
          !button ||
          button.disabled
        ) {
          return;
        }

        const selectedPage =
          Number(
            button.dataset.page
          );

        if (
          !Number.isInteger(
            selectedPage
          ) ||
          selectedPage < 1
        ) {
          return;
        }

        state.page =
          selectedPage;

        renderProducts();

        $("#productos")
          ?.scrollIntoView({
            behavior: "smooth",

            block: "start"
          });
      }
    );


  /*===== CARRITO =====*/

  $("#cart-button")
    ?.addEventListener(
      "click",
      openCart
    );


  $("#cart-close")
    ?.addEventListener(
      "click",
      closeCart
    );


  $("#cart-continue")
    ?.addEventListener(
      "click",
      () => {
        closeCart();

        document
          .querySelector(
            "#productos"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    );


  $("#cart-items")
    ?.addEventListener(
      "click",
      (event) => {
        if (
          event.target.closest(
            "[data-cart-empty-continue]"
          )
        ) {
          closeCart();

          document
            .querySelector(
              "#productos"
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
        }
      }
    );


  $("#overlay")
    ?.addEventListener(
      "click",
      () => {
        closeCart();
        closeFavorites();
      }
    );


  $("#cart-clear")
    ?.addEventListener(
      "click",
      () => {
        state.cart = [];

        saveStorage(
          CONFIG.cartKey,
          state.cart
        );

        initPremiumHeader();

    initHeaderScrollRefinement();

    updateCompactHeaderState();

    updateCounters();

        renderCart();

        toast(
          "Carrito vaciado"
        );
      }
    );


  $("#cart-whatsapp")
    ?.addEventListener(
      "click",
      sendCartWhatsApp
    );


  $("#cart-items")
    ?.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-cart]"
          );

        if (!button) {
          return;
        }

        const item =
          state.cart.find(
            (cartItem) =>
              cartItem.key ===
              button.dataset.key
          );

        if (!item) {
          return;
        }

        const action =
          button.dataset.cart;


        if (
          action === "plus"
        ) {
          item.quantity += 1;
        }


        if (
          action === "minus"
        ) {
          item.quantity -= 1;
        }


        if (
          action === "remove" ||
          item.quantity <= 0
        ) {
          state.cart =
            state.cart.filter(
              (cartItem) =>
                cartItem.key !==
                item.key
            );
        }

        saveStorage(
          CONFIG.cartKey,
          state.cart
        );

        updateCounters();

        renderCart();
      }
    );


  /*===== COLORES DEL MODAL =====*/

  $("#modal-colors")
    ?.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-modal-color]"
          );

        if (!button) {
          return;
        }

        $$(".modal-tone", $("#modal-colors"))
          .forEach(
            (swatch) => {
              swatch.classList.remove(
                "selected"
              );
            }
          );

        button.classList.add(
          "selected"
        );

        state.modalColor =
          button.dataset.modalColor ||
          "";

        updateModalSelectedTone(
          state.modalColor
        );

        const modalImage =
          $("#modal-image");

        if (modalImage) {
          modalImage.src =
            button.dataset.modalImage ||
            CONFIG.fallbackImage;
        }

        updateModalWhatsApp(
          productById(
            state.modalProductId
          )
        );
      }
    );




  /*===== CANTIDAD DEL MODAL =====*/

  $("#modal-quantity-minus")
    ?.addEventListener("click", () => {
      state.modalQuantity = Math.max(1, state.modalQuantity - 1);
      updateModalQuantity();
    });

  $("#modal-quantity-plus")
    ?.addEventListener("click", () => {
      state.modalQuantity = Math.min(99, state.modalQuantity + 1);
      updateModalQuantity();
    });


  /*===== AGREGAR DESDE EL MODAL =====*/

  $("#modal-add-cart")
    ?.addEventListener(
      "click",
      () => {
        if (
          !state.modalProductId
        ) {
          return;
        }

        addToCart(
          state.modalProductId,
          state.modalColor,
          null,
          state.modalQuantity
        );
      }
    );


  /*===== PRODUCTOS RELACIONADOS =====*/

  $("#related-products")
    ?.addEventListener(
      "click",
      (event) => {
        const relatedCard =
          event.target.closest(
            "[data-related]"
          );

        if (!relatedCard) {
          return;
        }

        openModal(
          relatedCard.dataset.related
        );
      }
    );


  /*===== CERRAR MODAL =====*/

  $$("[data-close-modal]")
    .forEach(
      (element) => {
        element.addEventListener(
          "click",
          closeModal
        );
      }
    );


  /*===== IMÁGENES CON ERROR =====*/

  document.addEventListener(
    "error",
    (event) => {
      if (
        event.target instanceof
        HTMLImageElement
      ) {
        imageFallback(
          event.target
        );
      }
    },
    true
  );


  /*===== ZOOM DE IMAGEN =====*/

  $("#modal-image-button")?.addEventListener("click", openImageZoom);
  $$('[data-close-zoom]').forEach((element) => element.addEventListener("click", closeImageZoom));

  /*===== TECLA ESCAPE =====*/

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      const zoom = $("#image-zoom");
      if (zoom && !zoom.hidden) {
        closeImageZoom();
        return;
      }

      closeCart();

      const modal =
        $("#product-modal");

      if (
        modal &&
        !modal.hidden
      ) {
        closeModal();
      }
    }
  );
}


/*==================================
  INICIAR BOTANIKA
==================================*/

function registerBotanikaServiceWorker() {
  if (
    !("serviceWorker" in navigator) ||
    !window.isSecureContext
  ) {
    return;
  }

  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .catch((error) => {
          console.warn(
            "No se pudo registrar el service worker:",
            error
          );
        });
    },
    {
      once: true
    }
  );
}


async function startBotanika() {
renderSkeletonProducts();

  if (
    window.__botanikaStarted
  ) {
    return;
  }

  window.__botanikaStarted =
    true;

  initNavigation();

  initHeroCarousel();

  initEvents();

  updateCounters();

  renderCart();

  const footerCopy =
    $(".footer-copy");

  if (footerCopy) {
    footerCopy.textContent =
      `© ${new Date().getFullYear()} Botanika CR. Todos los derechos reservados.`;
  }

  await loadProducts();
}


/*==================================
  EJECUTAR APLICACIÓN
==================================*/


/*==================================
  HEADER PREMIUM
==================================*/

function updateCompactHeaderState() {
  const header =
    $("#header");

  if (!header) {
    return;
  }

  header.classList.toggle(
    "is-scrolled",
    window.scrollY > 24
  );
}


function initHeaderScrollRefinement() {
  const header =
    $("#header");

  if (!header) {
    return;
  }

  let ticking = false;

  const update =
    () => {
      header.classList.toggle(
        "is-scrolled",
        window.scrollY > 14
      );

      ticking = false;
    };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    {
      passive: true
    }
  );

  update();
}


function initPremiumHeader() {
  const header =
    $("#header");

  const links =
    $$(".nav-link");

  const sections =
    links
      .map(
        (link) => {
          const href =
            link.getAttribute(
              "href"
            );

          if (
            !href ||
            !href.startsWith("#")
          ) {
            return null;
          }

          return {
            link,
            section:
              document.querySelector(
                href
              )
          };
        }
      )
      .filter(
        (item) =>
          item?.section
      );

  const updateHeader =
    () => {
      header?.classList.toggle(
        "is-scrolled",
        window.scrollY > 18
      );

      const position =
        window.scrollY + 110;

      let activeItem =
        sections[0] || null;

      sections.forEach(
        (item) => {
          if (
            item.section.offsetTop <=
            position
          ) {
            activeItem = item;
          }
        }
      );

      links.forEach(
        (link) => {
          link.classList.toggle(
            "is-active",
            link ===
            activeItem?.link
          );
        }
      );
    };

  window.addEventListener(
    "scroll",
    updateHeader,
    {
      passive: true
    }
  );

  updateHeader();
}


if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    startBotanika,
    {
      once: true
    }
  );
} else {
  startBotanika();
}