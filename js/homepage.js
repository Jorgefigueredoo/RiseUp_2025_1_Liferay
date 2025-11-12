// ===============================================
// URL base do servidor e da API
const API_URL = "http://localhost:8080/api";
const SERVER_URL = "http://localhost:8080";
// ===============================================

const token = localStorage.getItem("authToken");

if (!token) {
  alert("Você precisa estar logado para ver esta página.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  carregarDadosUsuario();
  carregarEventos();
  setupCarousels();
  setupLogout();
  setupGlobalSearch();
});

// =====================
// DADOS DO USUÁRIO
// =====================
async function carregarDadosUsuario() {
  const PROFILE_API_URL = `${API_URL}/perfis/me`;

  if (!token) return;

  try {
    const response = await fetch(PROFILE_API_URL, {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });

    if (response.status === 401 || response.status === 403) {
      console.error("Sessão expirada ao buscar perfil.");
      return;
    }

    const perfil = await response.json();

    // ========================================================
    // CORREÇÃO FEITA AQUI:
    // Ajustado para usar os IDs do seu HTML.
    // ========================================================
    const userImage = document.getElementById("header-profile-pic"); // <-- CORREÇÃO
    const userNameSpan = document.getElementById("header-profile-name"); // <-- CORREÇÃO

    if (perfil.nomeCompleto && userNameSpan) {
      userNameSpan.textContent = perfil.nomeCompleto;
    }

    if (perfil.fotoPerfilUrl && userImage) {
      userImage.src = SERVER_URL + perfil.fotoPerfilUrl;
    }
  } catch (error) {
    console.error("Erro ao carregar dados do usuário:", error);
    
    // Ajustado aqui também para garantir
    const userNameSpan = document.getElementById("header-profile-name"); // <-- CORREÇÃO
    if (userNameSpan) {
      userNameSpan.textContent = "Visitante";
    }
  }
}

// =====================
// LOGOUT
// =====================
function setupLogout() {
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("authToken");
      alert("Você saiu da sua conta.");
      window.location.href = "login.html";
    });
  }
}

// =====================
// EVENTOS
// =====================
async function carregarEventos() {
  const eventosURL = `${API_URL}/eventos`;
  const track = document.querySelector('[data-carousel-id="eventos"] .carousel-track');

  if (!track) return;

  try {
    const response = await fetch(eventosURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });

    if (response.status === 401 || response.status === 403) {
      alert("Sua sessão expirou. Faça login novamente.");
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
      return;
    }

    const eventos = await response.json();
    track.innerHTML = "";

    if (eventos.length === 0) {
      const aviso = document.createElement("p");
      aviso.textContent = "Nenhum evento disponível no momento.";
      aviso.style.textAlign = "center";
      aviso.style.color = "#555";
      track.appendChild(aviso);
      return;
    }

    eventos.forEach((evento) => {
      const card = document.createElement("div");
      card.classList.add("card");

      const img = document.createElement("img");
      img.src = "assets/pictures/liferay-devcon.jpg";
      img.alt = evento.nome || "Evento Liferay";

      const h3 = document.createElement("h3");
      const link = document.createElement("a");
      link.href = `/detalhes-evento.html?id=${evento.id}`;
      link.textContent = evento.nome || "Evento sem nome";
      link.style.color = "inherit";
      link.style.textDecoration = "none";
      h3.appendChild(link);

      const data = document.createElement("p");
      if (evento.data) {
        const dataFormatada = new Date(evento.data).toLocaleDateString("pt-BR", {
          timeZone: "UTC",
        });
        data.textContent = dataFormatada;
      }

      const descricao = document.createElement("p");
      if (evento.descricao) {
        descricao.textContent =
          evento.descricao.substring(0, 100) +
          (evento.descricao.length > 100 ? "..." : "");
      }

      card.appendChild(img);
      card.appendChild(h3);
      card.appendChild(data);
      card.appendChild(descricao);

      track.appendChild(card);
    });

    setupCarousels();
  } catch (error) {
    console.error("Erro ao carregar eventos:", error);
    track.innerHTML = `<p style="text-align:center;color:red;">Não foi possível carregar os eventos.</p>`;
  }
}

// =====================
// CARROSSEL
// =====================
function setupCarousels() {
  const carousels = document.querySelectorAll(".carousel");

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const prevButton = carousel.querySelector(".carousel-arrow.prev");
    const nextButton = carousel.querySelector(".carousel-arrow.next");

    if (!track || !prevButton || !nextButton) return;

    let index = 0;
    const cards = carousel.querySelectorAll(".card");
    const totalCards = cards.length;
    const visibleCards = 3;

    if (totalCards === 0) {
      prevButton.style.display = "none";
      nextButton.style.display = "none";
      return;
    }

    function updateCarousel() {
      const cardStyle = getComputedStyle(cards[0]);
      const cardWidth =
        cards[0].offsetWidth +
        parseInt(cardStyle.marginRight) +
        parseInt(cardStyle.marginLeft);

      track.style.transform = `translateX(-${index * cardWidth}px)`;
      prevButton.disabled = index === 0;
      nextButton.disabled = index >= totalCards - visibleCards;
    }

    prevButton.addEventListener("click", () => {
      index = Math.max(index - 1, 0);
      updateCarousel();
    });

    nextButton.addEventListener("click", () => {
      index = Math.min(index + 1, Math.max(0, totalCards - visibleCards));
      updateCarousel();
    });

    updateCarousel();
    window.addEventListener("resize", updateCarousel);
  });
}

// =====================
// GLOBAL SEARCH
// =====================
function setupGlobalSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        // Redireciona para a página de resultado, passando o termo na URL
        // O encodeURIComponent garante que caracteres especiais sejam tratados
        window.location.href = `resultado-pesquisa.html?q=${encodeURIComponent(searchTerm)}`;
      }
    }
  });
}