// ===============================================
// ARQUIVO: homepage.js (CORRIGIDO E BLINDADO DEFINITIVO)
// ===============================================

document.addEventListener("DOMContentLoaded", () => {
    carregarEventos();
    setupCarousels('[data-carousel-id="cursos"]');
});

// =====================
// FUNÇÃO SEGURA PARA PARSE DE DATAS
// =====================
function parseDataSegura(dataStr) {
    if (!dataStr) return null;

    let data;

    // Formato ISO: "2025-11-21" ou "2025-11-21T00:00:00"
    if (dataStr.includes('-')) {
        const partes = dataStr.split('T')[0].split('-'); 
        data = new Date(partes[0], partes[1] - 1, partes[2]);
    }
    // Formato BR: "21/11/2025"
    else if (dataStr.includes('/')) {
        const partes = dataStr.split('/');
        data = new Date(partes[2], partes[1] - 1, partes[0]);
    }
    else {
        data = new Date(dataStr);
    }

    if (isNaN(data.getTime())) return null;

    // Zera horas para evitar falhas na comparação
    data.setHours(0, 0, 0, 0);
    return data;
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

        if (!response.ok) throw new Error('Falha ao carregar eventos.');

        const eventos = await response.json();
        track.innerHTML = ""; 

        // =============================
        // FILTRAGEM CORRETA — SÓ FUTUROS
        // =============================
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const eventosFuturos = eventos
            .filter(evento => {
                const dataEvento = parseDataSegura(evento.data);
                if (!dataEvento) return false;
                return dataEvento >= hoje;
            })
            .sort((a, b) => {
                const dataA = parseDataSegura(a.data);
                const dataB = parseDataSegura(b.data);
                return dataA - dataB;
            });

        if (eventosFuturos.length === 0) {
            track.innerHTML = '<p style="padding: 0 20px; color: #555;">Nenhum evento futuro encontrado.</p>';
            return;
        }

        // =============================
        // RENDERIZAÇÃO DOS CARDS
        // =============================
        eventosFuturos.forEach((evento) => {
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
                const dataFormatada = parseDataSegura(evento.data)?.toLocaleDateString("pt-BR") || evento.data;
                dataEl.textContent = dataFormatada;
            }

            const descricao = document.createElement("p");
            if (evento.descricao) {
                descricao.textContent = evento.descricao.substring(0, 100) + (evento.descricao.length > 100 ? "..." : "");
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
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
    }

    function updateCarousel() {
        if (cards.length === 0) return;

        const cardStyle = getComputedStyle(cards[0]);
        const cardWidth = cards[0].offsetWidth 
            + parseInt(cardStyle.marginRight || 0)
            + parseInt(cardStyle.marginLeft || 0);

        if (cardWidth === 0) return;

        track.style.transform = `translateX(-${index * cardWidth}px)`;
        prevButton.disabled = index === 0;
        nextButton.disabled = index >= Math.max(0, totalCards - visibleCards);
    }

    prevButton.addEventListener('click', () => {
        index = Math.max(index - 1, 0);
        updateCarousel();
    });

    nextButton.addEventListener('click', () => {
        index = Math.min(index + 1, Math.max(0, totalCards - visibleCards));
        updateCarousel();
    });

    updateCarousel();
    window.addEventListener('resize', updateCarousel);
}
