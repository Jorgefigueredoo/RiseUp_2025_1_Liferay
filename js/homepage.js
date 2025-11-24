// ===============================================
// ARQUIVO: homepage.js (VERSÃO FINAL DEFINITIVA)
// ===============================================

document.addEventListener("DOMContentLoaded", () => {
    carregarEventos();
    setupCarousels('[data-carousel-id="cursos"]');
});

// ====================================================
// FUNÇÃO SEGURA PARA PARSE DE LOCALDATE DO BACK-END
// ====================================================
// O back-end envia: "yyyy-MM-dd"
// NÃO USAR new Date("2025-11-21") porque o JS converte para UTC!
// ====================================================
function parseDataSegura(dataStr) {
    if (!dataStr) return null;

    const partes = dataStr.split("-");
    if (partes.length !== 3) return null;

    const ano = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1;
    const dia = parseInt(partes[2]);

    const d = new Date(ano, mes, dia);
    if (isNaN(d.getTime())) return null;

    d.setHours(0, 0, 0, 0);
    return d;
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

        if (!response.ok) throw new Error("Falha ao carregar eventos.");

        const eventos = await response.json();
        track.innerHTML = "";

        // =============================
        // FILTRAGEM — APENAS EVENTOS FUTUROS
        // =============================
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const eventosFuturos = eventos
            .filter(evento => {
                const data = parseDataSegura(evento.data);
                return data && data >= hoje;
            })
            .sort((a, b) => {
                const dataA = parseDataSegura(a.data);
                const dataB = parseDataSegura(b.data);
                return dataA - dataB;
            });

        if (eventosFuturos.length === 0) {
            track.innerHTML =
                '<p style="padding: 0 20px; color: #555;">Nenhum evento futuro encontrado.</p>';
            return;
        }

        // =============================
        // RENDERIZAÇÃO DOS CARDS
        // =============================
        eventosFuturos.forEach(evento => {
            const card = document.createElement("div");
            card.classList.add("card");

            const img = document.createElement("img");
            img.src = "assets/pictures/liferay-devcon.jpg";
            img.alt = evento.nome || "Evento";

            const h3 = document.createElement("h3");
            const link = document.createElement("a");
            link.href = `detalhes-evento.html?id=${evento.id}`;
            link.textContent = evento.nome || "Evento sem nome";
            link.style.color = "inherit";
            link.style.textDecoration = "none";
            h3.appendChild(link);

            const dataEl = document.createElement("p");
            if (evento.data) {
                const dataFormatada = parseDataSegura(evento.data)?.toLocaleDateString("pt-BR");
                dataEl.textContent = dataFormatada || evento.data;
            }

            const descricao = document.createElement("p");
            if (evento.descricao) {
                descricao.textContent =
                    evento.descricao.substring(0, 100) +
                    (evento.descricao.length > 100 ? "..." : "");
            }

            card.appendChild(img);
            card.appendChild(h3);
            card.appendChild(dataEl);
            card.appendChild(descricao);
            track.appendChild(card);
        });

        setupCarousels('[data-carousel-id="eventos"]');
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        track.innerHTML = `<p style="text-align:center;color:red;">Erro ao carregar.</p>`;
    }
}

// =====================
// CARROSSEL
// =====================
function setupCarousels(selector) {
    const carousel = document.querySelector(selector);
    if (!carousel) return;

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

    if (totalCards <= visibleCards) {
        prevButton.style.display = "none";
        nextButton.style.display = "none";
    }

    function updateCarousel() {
        if (cards.length === 0) return;

        const cardStyle = getComputedStyle(cards[0]);
        const cardWidth =
            cards[0].offsetWidth +
            parseInt(cardStyle.marginRight || 0) +
            parseInt(cardStyle.marginLeft || 0);

        if (cardWidth === 0) return;

        track.style.transform = `translateX(-${index * cardWidth}px)`;
        prevButton.disabled = index === 0;
        nextButton.disabled = index >= Math.max(0, totalCards - visibleCards);
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
}
