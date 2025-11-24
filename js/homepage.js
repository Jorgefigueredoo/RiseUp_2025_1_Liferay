// ===============================================
// ARQUIVO: homepage.js (CORRIGIDO E BLINDADO)
// ===============================================

document.addEventListener("DOMContentLoaded", () => {
    carregarEventos();
    setupCarousels('[data-carousel-id="cursos"]');
});

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

        // -----------------------------------------------------------
        // 🔒 LÓGICA DE FILTRAGEM (DATA SEGURA)
        // -----------------------------------------------------------
        
        // 1. Pega a data de HOJE e zera as horas (00:00:00)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const eventosFuturos = eventos.filter(evento => {
            if (!evento.data) return false;

            let dataEvento;

            // CASO 1: Data vem como "2025-11-21" (ISO)
            if (evento.data.includes('-')) {
                // Divide a string para evitar conversão de fuso horário automática
                // Ex: "2025-11-21" vira [2025, 11, 21]
                const partes = evento.data.split('T')[0].split('-'); 
                // new Date(ano, mes-1, dia) cria a data no horário local do usuário
                dataEvento = new Date(partes[0], partes[1] - 1, partes[2]);
            } 
            // CASO 2: Data vem como "21/11/2025" (BR)
            else if (evento.data.includes('/')) {
                const partes = evento.data.split('/');
                // new Date(ano, mes-1, dia)
                dataEvento = new Date(partes[2], partes[1] - 1, partes[0]);
            } 
            // FALLBACK: Tenta conversão padrão se falhar
            else {
                dataEvento = new Date(evento.data);
            }

            // Segurança: Se a data for inválida, remove o evento
            if (isNaN(dataEvento.getTime())) return false;

            // Zera as horas do evento para comparar apenas o dia
            dataEvento.setHours(0, 0, 0, 0);

            // LOG PARA DEBUG (Ative se necessário apertando F12)
            // console.log(`Evento: ${evento.nome} | DataEvento: ${dataEvento.toLocaleDateString()} | Hoje: ${hoje.toLocaleDateString()} | Passou? ${dataEvento >= hoje}`);

            // COMPARAÇÃO: Retorna true se a data for igual ou futura
            return dataEvento.getTime() >= hoje.getTime();
        })
        .sort((a, b) => {
            // Ordenação também precisa ser segura
            // Recriamos os objetos date aqui para garantir a conta certa
            const dateA = new Date(a.data);
            const dateB = new Date(b.data);
            return dateA - dateB; 
        });

        // -----------------------------------------------------------

        if (eventosFuturos.length === 0) {
            track.innerHTML = '<p style="padding: 0 20px; color: #555;">Nenhum evento futuro encontrado.</p>';
            return;
        }

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
                // Exibição amigável
                // Se for ISO, converte para UTC para não voltar um dia na string
                const d = new Date(evento.data);
                // Pequeno ajuste visual para evitar que mostre dia anterior na tela
                const visualDate = d.toLocaleDateString("pt-BR", { timeZone: 'UTC' });
                // Se o resultado for "Invalid Date", mostra a string original
                dataEl.textContent = visualDate !== "Invalid Date" ? visualDate : evento.data;
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
        const cardWidth = cards[0].offsetWidth + parseInt(cardStyle.marginRight || 0) + parseInt(cardStyle.marginLeft || 0);

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