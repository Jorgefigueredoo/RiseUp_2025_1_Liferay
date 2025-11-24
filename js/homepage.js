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
    try {
        const response = await fetch(`${API_URL}/eventos`);
        const eventos = await response.json();

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // zera horas para comparação exata

        // FILTRAR APENAS EVENTOS FUTUROS
        const eventosFuturos = eventos.filter(ev => {
            const dataEvento = new Date(ev.data + "T00:00:00");
            return dataEvento >= hoje;
        });

        console.log("EVENTOS FUTUROS:", eventosFuturos);

        renderizarEventos(eventosFuturos);

    } catch (erro) {
        console.error("Erro ao carregar eventos:", erro);
    }
}

function renderizarEventos(eventos) {
    const container = document.getElementById("eventosContainer");
    container.innerHTML = "";

    if (eventos.length === 0) {
        container.innerHTML = "<p>Nenhum evento futuro encontrado.</p>";
        return;
    }

    eventos.forEach(evento => {
        const card = `
            <div class="card-evento">
                <h3>${evento.nome}</h3>
                <p><strong>Data:</strong> ${evento.data}</p>
                <p><strong>Hora:</strong> ${evento.hora}</p>
                <p><strong>Local:</strong> ${evento.local}</p>
            </div>
        `;
        container.innerHTML += card;
    });
}

carregarEventos();


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
