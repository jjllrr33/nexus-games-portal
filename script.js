/* NEXUS — Games & Tecnologia
   Lê noticias.json (gerado por scripts/fetch_news.py via GitHub Actions) e renderiza o portal. */

const grid = document.querySelector("#news-grid");
const featuredEl = document.querySelector("#featured");
const statusEl = document.querySelector("#status");
const updatedEl = document.querySelector("#last-updated");
const emptyEl = document.querySelector("#empty");
const searchEl = document.querySelector("#search");
const moreBtn = document.querySelector("#load-more");
const refreshBtn = document.querySelector("#refresh");
const sourcesEl = document.querySelector("#sources");

const PAGE_SIZE = 12;
let allNews = [];
let activeFilter = "Todas";
let visible = PAGE_SIZE;
let loadError = false;

document.querySelector("#year").textContent = new Date().getFullYear();

/* ---------- Utilidades ---------- */
function safeText(value, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recente";
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (diff >= 0 && min < 60) return min <= 1 ? "agora" : `há ${min} min`;
  const hours = Math.round(min / 60);
  if (diff >= 0 && hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (diff >= 0 && days < 7) return `há ${days} d`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
function hueFor(text) {
  let h = 0;
  for (const ch of String(text)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
const ICONS = {
  Games: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="13.7" r=".9" fill="currentColor"/></svg>',
  Tecnologia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx=".8"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/></svg>'
};

/* ---------- Renderização ---------- */
function thumbHTML(item) {
  return `<div class="thumb" style="--h:${hueFor(item.source || item.category)}" aria-hidden="true">${ICONS[item.category] || ICONS.Tecnologia}<span class="thumb-src">${escapeHTML(item.source || "Fonte externa")}</span></div>`;
}
function metaHTML(item) {
  const cls = item.category === "Games" ? "category games" : "category";
  return `<div class="card-meta"><span class="${cls}">${escapeHTML(item.category)}</span><time datetime="${escapeHTML(item.date || "")}">${escapeHTML(formatDate(item.date))}</time></div>`;
}
function bottomHTML(item) {
  return `<div class="card-bottom"><span class="source">${escapeHTML(item.source || "Fonte externa")}</span><a class="read-link" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">Ler na fonte ↗</a></div>`;
}
function summaryOf(item) {
  return escapeHTML(item.summary || "Acesse a fonte original para conferir os detalhes desta notícia.");
}
function cardHTML(item, index) {
  return `<article class="news-card" style="animation-delay:${Math.min(index % PAGE_SIZE, 11) * 40}ms">
    ${thumbHTML(item)}
    <div class="card-body">
      ${metaHTML(item)}
      <h3>${escapeHTML(item.title)}</h3>
      <p>${summaryOf(item)}</p>
      ${bottomHTML(item)}
    </div>
  </article>`;
}
function featuredHTML(item) {
  return `<article class="featured">
    ${thumbHTML(item)}
    <div class="featured-body">
      <span class="featured-flag">✦ Em destaque</span>
      ${metaHTML(item)}
      <h3>${escapeHTML(item.title)}</h3>
      <p>${summaryOf(item)}</p>
      ${bottomHTML(item)}
    </div>
  </article>`;
}
function skeletonHTML(count = 6) {
  return Array.from({ length: count }, () => `<article class="news-card skeleton" aria-hidden="true">
    <div class="thumb"></div>
    <div class="card-body"><div class="sk-line w40"></div><div class="sk-line w90"></div><div class="sk-line w60"></div><div class="sk-line w90"></div></div>
  </article>`).join("");
}

function filtered() {
  const query = searchEl.value.trim().toLowerCase();
  return allNews.filter(item => {
    const matchesCategory = activeFilter === "Todas" || item.category === activeFilter;
    const matchesQuery = `${item.title} ${item.summary} ${item.source}`.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
}

function render() {
  const items = filtered();
  const showFeatured = items.length > 0 && !searchEl.value.trim();
  const featured = showFeatured ? items[0] : null;
  const rest = showFeatured ? items.slice(1) : items;
  const shown = rest.slice(0, visible);

  featuredEl.innerHTML = featured ? featuredHTML(featured) : "";
  grid.innerHTML = shown.map(cardHTML).join("");
  grid.setAttribute("aria-busy", "false");
  moreBtn.hidden = rest.length <= visible;

  const noItems = items.length === 0;
  emptyEl.hidden = !noItems;
  if (noItems) {
    emptyEl.innerHTML = loadError
      ? '<b>Não foi possível carregar as notícias.</b>Verifique sua conexão e tente novamente.<br><button class="retry-btn" type="button" id="retry">↻ Tentar novamente</button>'
      : allNews.length === 0
        ? "<b>Ainda não há notícias publicadas.</b>A automação pode ainda não ter executado. Volte em alguns instantes."
        : "<b>Nenhuma notícia encontrada.</b>Tente outra busca ou categoria.";
    const retry = document.querySelector("#retry");
    if (retry) retry.addEventListener("click", loadNews);
  }
}

function updateStats() {
  const sources = new Set(allNews.map(item => item.source).filter(Boolean));
  const set = (id, value) => { document.querySelector(id).textContent = value; };
  set("#stat-total", allNews.length || "—");
  set("#stat-sources", sources.size || "—");
  set("#stat-games", allNews.filter(item => item.category === "Games").length || "—");

  if (sources.size) {
    sourcesEl.innerHTML = `<b>Fontes</b>${[...sources].map(name => `<span class="chip">${escapeHTML(name)}</span>`).join("")}`;
    sourcesEl.hidden = false;
  } else {
    sourcesEl.hidden = true;
  }
}

/* ---------- Filtros e busca ---------- */
function setFilter(value) {
  activeFilter = value;
  visible = PAGE_SIZE;
  document.querySelectorAll("[data-filter]").forEach(button => {
    const active = button.dataset.filter === value;
    button.classList.toggle("active", active);
    if (button.classList.contains("filter")) button.setAttribute("aria-pressed", String(active));
  });
  // O link "Início" fica ativo quando nenhum filtro de categoria está aplicado pelo menu.
  const home = document.querySelector('.main-nav a[href="#inicio"]');
  if (home) home.classList.toggle("active", value === "Todas");
  render();
}
document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.filter);
    if (button.classList.contains("nav-link")) {
      document.querySelector("#ultimas").scrollIntoView({ behavior: "smooth" });
      closeMenu();
    }
  });
});

let searchTimer;
searchEl.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { visible = PAGE_SIZE; render(); }, 120);
});
moreBtn.addEventListener("click", () => { visible += PAGE_SIZE; render(); });

/* ---------- Menu mobile ---------- */
const menuBtn = document.querySelector("#menu-toggle");
const nav = document.querySelector("#main-nav");
function closeMenu() {
  nav.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
}
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });

/* ---------- Tema claro/escuro ---------- */
document.querySelector("#theme-toggle").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  document.querySelector('meta[name="theme-color"]').setAttribute("content", next === "light" ? "#f5f7fc" : "#090d18");
  try { localStorage.setItem("nexus-theme", next); } catch (e) { /* armazenamento indisponível */ }
});

/* ---------- Carregamento das notícias ---------- */
async function loadNews() {
  statusEl.className = "status";
  statusEl.textContent = "Atualizando notícias…";
  refreshBtn.disabled = true;
  refreshBtn.classList.add("spinning");
  emptyEl.hidden = true;
  if (!allNews.length) {
    featuredEl.innerHTML = "";
    grid.innerHTML = skeletonHTML();
    grid.setAttribute("aria-busy", "true");
  }
  try {
    const response = await fetch(`noticias.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Arquivo de notícias ainda não publicado.");
    const data = await response.json();
    allNews = (Array.isArray(data.articles) ? data.articles : []).map(item => ({
      ...item,
      title: safeText(item.title, 220),
      summary: safeText(item.summary, 420),
      source: safeText(item.source, 90),
      url: safeText(item.url, 2000),
      category: item.category === "Games" ? "Games" : "Tecnologia"
    })).filter(item => item.title && /^https?:\/\//i.test(item.url));
    loadError = false;
    visible = PAGE_SIZE;
    updateStats();
    render();
    const updated = data.updated_at ? new Date(data.updated_at) : null;
    updatedEl.textContent = updated && !Number.isNaN(updated.getTime())
      ? `Atualizado ${updated.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`
      : "Feed atualizado";
    statusEl.textContent = allNews.length
      ? `${allNews.length} notícias encontradas nas fontes cadastradas.`
      : "Nenhuma notícia disponível. A automação pode ainda não ter executado.";
  } catch (error) {
    loadError = true;
    statusEl.className = "status error";
    statusEl.textContent = "Não foi possível carregar as notícias agora.";
    updatedEl.textContent = "Aguardando primeira atualização";
    allNews = [];
    updateStats();
    render();
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.classList.remove("spinning");
  }
}
refreshBtn.addEventListener("click", loadNews);

/* ---------- Destaque do link ativo ao rolar ---------- */
const homeLink = document.querySelector('.main-nav a[href="#inicio"]');
const aboutLink = document.querySelector('.main-nav a[href="#sobre"]');
const aboutSection = document.querySelector("#sobre");
if ("IntersectionObserver" in window && aboutSection) {
  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (activeFilter !== "Todas") return;
      aboutLink.classList.toggle("active", entry.isIntersecting);
      homeLink.classList.toggle("active", !entry.isIntersecting);
    });
  }, { rootMargin: "-40% 0px -40% 0px" }).observe(aboutSection);
}

loadNews();
