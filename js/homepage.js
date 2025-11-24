// ===============================================
// homepage.js — VERSÃO FINAL CORRIGIDA
// ===============================================

// Carrega configurações globais do global.js
// API_URL, SERVER_URL e token já estão disponíveis

document.addEventListener("DOMContentLoaded", () => {
    carregarEventosFuturos();
});

// ===========================
// Função SEGURA para converter data (sem fuso, sem erro)
// ===========================
function parseDataSegura(dataString) {
    if (!dataString) return null;
    const partes = dataString.split("-");
    if (partes.length !== 3) return null;

    return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

// ===========================
// Carregar eventos futuros
// ===========================
async function carregarEventosFuturos() {
    try {
        const resposta = await fetch(`${API_URL}/eventos/futuros`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("STATUS:", resposta.status);

        if (!resposta.ok) {
            throw new Error(`Erro ao buscar eventos: ${resposta.status}`);
        }

        const eventos = await resposta.json();
        console.log("EVENTOS FUTUROS RECEBIDOS:", eventos);

        renderizarEventos(eventos);

    } catch (erro) {
        console.error("Erro:", erro);
        document.getElementById("eventosContainer").innerHTML =
            "<p>Erro ao carregar eventos.</p>";
    }
}

// ===========================
// Renderizar eventos
// ===========================
function renderizarEventos(eventos) {
    const container = document.getElementById("eventosContainer");
    container.innerHTML = "";

    if (!eventos || eventos.length === 0) {
        container.innerHTML = "<p>Nenhum evento futuro encontrado.</p>";
        return;
    }

    eventos.forEach(evento => {
        const [ano, mes, dia] = evento.data.split("-");
        const dataFormatada = `${dia}/${mes}/${ano}`;

        const card = `
            <div class="card-evento">
                <h3>${evento.nome}</h3>
                <p><strong>Data:</strong> ${dataFormatada}</p>
                <p><strong>Hora:</strong> ${evento.hora}</p>
                <p><strong>Local:</strong> ${evento.local}</p>
            </div>
        `;

        container.innerHTML += card;
    });
}
