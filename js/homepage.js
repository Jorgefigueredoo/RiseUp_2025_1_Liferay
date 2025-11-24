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
async function carregarEventos() {
    // 'API_URL' e 'token' vêm do global.js
    const eventosURL = `${API_URL}/eventos`;
    const track = document.querySelector('[data-carousel-id="eventos"] .carousel-track');

    if (!track) {
        console.warn('Elemento .carousel-track para [eventos] não encontrado.');
        return;
    }

    try {
        const response = await fetch(eventosURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token, // Usa a const global
            },
        });

        if (!response.ok) {
            // Se falhar (ex: 401), o global.js já vai ter pego
            // Mas é bom tratar o erro aqui também
            throw new Error('Falha ao carregar eventos.');
        }

        const eventos = await response.json();
        track.innerHTML = ""; // Limpa o "Carregando..."

        // ====================================================
        // 💡 LÓGICA DE FILTRAGEM E ORDENAÇÃO DE EVENTOS FUTUROS
        // ====================================================

        // 1. Define a data de hoje, zerando as horas (00:00:00) para garantir comparação por dia
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); 
        const hojeTimestamp = hoje.getTime(); 

        const eventosFuturos = eventos
            .filter(evento => {
                // Tenta criar o objeto Date a partir da string da API
                const dataEventoRaw = new Date(evento.data);
                
                // Verifica se a data é válida
                if (isNaN(dataEventoRaw.getTime())) return false;

                // ZERA as horas da data do evento para comparar APENAS o dia
                dataEventoRaw.setHours(0, 0, 0, 0); 
                
                // Retorna TRUE se a data do evento for MAIOR OU IGUAL (>=) à data de hoje
                return dataEventoRaw.getTime() >= hojeTimestamp;
            })
            // Ordena os eventos do mais próximo ao mais distante
            .sort((a, b) => new Date(a.data) - new Date(b.data)); 

        // ====================================================

        if (eventosFuturos.length === 0) {
            track.innerHTML = '<p style="padding: 0 20px; color: #555;">Nenhum evento disponível no momento.</p>';
            return;
        }

        // Itera sobre a lista FILTRADA E ORDENADA (eventosFuturos)
        eventosFuturos.forEach((evento) => {
            const card = document.createElement("div");
            card.classList.add("card");

            const img = document.createElement("img");
            img.src = "assets/pictures/liferay-devcon.jpg"; // TODO: Usar img do evento
            img.alt = evento.nome || "Evento Liferay";

            const h3 = document.createElement("h3");
            const link = document.createElement("a");
            // ATENÇÃO: Verifique se essa URL de detalhes está correta!
            link.href = `detalhes-evento.html?id=${evento.id}`; 
            link.textContent = evento.nome || "Evento sem nome";
            link.style.color = "inherit";
            link.style.textDecoration = "none";
            h3.appendChild(link);

            const data = document.createElement("p");
            if (evento.data) {
                // Formata a data para exibição
                const dataFormatada = new Date(evento.data).toLocaleDateString("pt-BR", {
                    timeZone: "UTC", // Importante para formatação consistente
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

        // Chama o carrossel DEPOIS que os cards de EVENTOS forem criados
        setupCarousels('[data-carousel-id="eventos"]'); 
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        track.innerHTML = `<p style="text-align:center;color:red;">Não foi possível carregar os eventos.</p>`;
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