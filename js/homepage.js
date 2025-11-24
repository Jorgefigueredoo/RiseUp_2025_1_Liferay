// ===============================================
// ARQUIVO: homepage.js
// ===============================================

document.addEventListener("DOMContentLoaded", () => {
    // A única coisa que a homepage precisa fazer
    carregarEventos();

    // O carrossel de cursos já está estático no HTML,
    // então podemos ligar ele imediatamente.
    setupCarousels('[data-carousel-id="cursos"]');
});

// =====================
// EVENTOS (ESPECÍFICO DA HOMEPAGE)
// =====================
// =====================
// EVENTOS (ESPECÍFICO DA HOMEPAGE)
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

        // ====================================================
        // 💡 NOVA LÓGICA DE FILTRAGEM (INTEIROS)
        // ====================================================

        // 1. Cria um número inteiro para HOJE (Ex: 20251124)
        const hojeObj = new Date();
        const hojeInteiro = (hojeObj.getFullYear() * 10000) + 
                            ((hojeObj.getMonth() + 1) * 100) + 
                            hojeObj.getDate();
        
        console.log("📅 Data de Hoje (Inteiro):", hojeInteiro);

        const eventosFuturos = eventos.filter(evento => {
            if (!evento.data) return false;

            // Tenta criar a data. Se falhar, tenta corrigir formato BR
            let dataObj = new Date(evento.data);
            
            // Se for Invalid Date (ex: formato DD/MM/AAAA puro), ajusta manualmente
            if (isNaN(dataObj.getTime())) {
                const partes = evento.data.split('/'); // Tenta dividir 21/11/2025
                if (partes.length === 3) {
                    // Cria new Date(ano, mês-1, dia)
                    dataObj = new Date(partes[2], partes[1] - 1, partes[0]);
                }
            }

            // Se ainda for inválido, ignora esse evento
            if (isNaN(dataObj.getTime())) return false;

            // 2. Cria um número inteiro para o EVENTO (Ex: 20251121)
            const eventoInteiro = (dataObj.getFullYear() * 10000) + 
                                  ((dataObj.getMonth() + 1) * 100) + 
                                  dataObj.getDate();

            // Debug no console (F12) para ver o que está acontecendo
            // console.log(`Checando: ${evento.nome} | Data: ${eventoInteiro} >= Hoje: ${hojeInteiro} ?`);

            // 3. Compara: O evento é maior ou igual a hoje?
            return eventoInteiro >= hojeInteiro;
        })
        .sort((a, b) => new Date(a.data) - new Date(b.data));

        // ====================================================

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

            const data = document.createElement("p");
            if (evento.data) {
                // Tenta formatar bonitinho
                const d = new Date(evento.data);
                // Ajuste de segurança para exibição se a data for válida
                if (!isNaN(d.getTime())) {
                     data.textContent = d.toLocaleDateString("pt-BR", { timeZone: 'UTC' });
                } else {
                     data.textContent = evento.data; // fallback
                }
            }

            const descricao = document.createElement("p");
            if (evento.descricao) {
                descricao.textContent = evento.descricao.substring(0, 100) + "...";
            }

            card.appendChild(img);
            card.appendChild(h3);
            card.appendChild(data);
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
// CARROSSEL (Lógica genérica de carrossel)
// =====================
function setupCarousels(selector) {
    // Pega só o carrossel que foi pedido (eventos ou cursos)
    const carousel = document.querySelector(selector);
    if (!carousel) {
        console.warn(`Carrossel "${selector}" não encontrado.`);
        return;
    }

    const track = carousel.querySelector(".carousel-track");
    const prevButton = carousel.querySelector(".carousel-arrow.prev");
    const nextButton = carousel.querySelector(".carousel-arrow.next");

    if (!track || !prevButton || !nextButton) return;

    let index = 0;
    const cards = carousel.querySelectorAll(".card");
    const totalCards = cards.length;
    const visibleCards = 3; // Você pode ajustar isso

    if (totalCards === 0) {
        prevButton.style.display = "none";
        nextButton.style.display = "none";
        return;
    }

    // Esconde botões se não houver cards suficientes para rolar
    if (totalCards <= visibleCards) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
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

    prevButton.addEventListener('click', () => {
        index = Math.max(index - 1, 0);
        updateCarousel();
    });

    nextButton.addEventListener('click', () => {
        index = Math.min(index + 1, Math.max(0, totalCards - visibleCards));
        updateCarousel();
    });

    // Atualiza na hora e também se a janela mudar de tamanho
    updateCarousel();
    window.addEventListener('resize', updateCarousel);
}