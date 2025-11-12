// ===============================================
// ARQUIVO: detalhes-evento.js (MAGRO E FOCADO)
// ===============================================
//
// NOTA:
// O 'global.js' já cuidou de:
// 1. API_URL, SERVER_URL, token
// 2. carregarDadosUsuario()
// 3. setupGlobalSearch()
//

// Variável global APENAS para esta página
let eventoAtual = null;

// "Liga" as funções específicas desta página
document.addEventListener('DOMContentLoaded', function () {
    // O 'global.js' já rodou seu próprio DOMContentLoaded
    // para o header. Este é só para a página de detalhes.
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('id');

    if (eventoId) {
        carregarDetalhesEvento(eventoId);
    } else {
        mostrarErro('ID do evento não fornecido.');
    }
});

// =====================
// FETCH 1: CARREGAR DETALHES
// =====================
async function carregarDetalhesEvento(eventoId) {
    try {
        // 'API_URL' e 'token' vêm do global.js
        const response = await fetch(`${API_URL}/eventos/${eventoId}`, {
            method: 'GET',
            headers: { "Authorization": "Bearer " + token }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Sua sessão expirou. Faça login novamente.");
            localStorage.removeItem("authToken");
            window.location.href = "login.html";
            return;
        }
        if (!response.ok) throw new Error('Erro ao buscar evento.');

        eventoAtual = await response.json();
        preencherDetalhesEvento(eventoAtual);
        
        // Chama o próximo fetch
        verificarStatusInscricao(eventoId); 
    } catch (erro) {
        console.error('Erro ao carregar evento:', erro);
        mostrarErro('Erro ao carregar evento.');
    }
}

// =====================
// FETCH 2: VERIFICAR STATUS DA INSCRIÇÃO
// =====================
async function verificarStatusInscricao(eventoId) {
    try {
        const response = await fetch(`${API_URL}/eventos/${eventoId}/status`, {
            method: 'GET',
            headers: { "Authorization": "Bearer " + token }
        });

        if (response.ok) {
            const status = await response.json();
            atualizarBotaoInscricao(status);
        }
    } catch (erro) {
        console.error('Erro ao verificar inscrição:', erro);
    }
}

// =====================
// FETCH 3: FAZER INSCRIÇÃO
// =====================
async function inscreverEvento() {
    const btn = document.getElementById('inscricaoBtn');
    const msg = document.getElementById('statusMessage');
    btn.disabled = true;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const eventoId = urlParams.get('id');

        const response = await fetch(`${API_URL}/eventos/${eventoId}/inscrever`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            },
        });
        
        if (!response.ok) {
             const resultadoErro = await response.json();
             throw new Error(resultadoErro.erro || 'Erro desconhecido');
        }
        
        mostrarConfirmacaoInscricao(eventoAtual);
        
    } catch (erro) {
        console.error('Erro na inscrição:', erro);
        msg.textContent = `Erro: ${erro.message}`; 
        btn.disabled = false;
    }
}


// =====================
// FUNÇÕES AUXILIARES (Helpers)
// =====================

function preencherDetalhesEvento(evento) {
    document.getElementById('eventName').textContent = evento.nome;
    document.getElementById('eventDescription').textContent = evento.descricao;
    document.getElementById('eventDate').textContent = formatarData(evento.data);
    document.getElementById('eventTime').textContent = evento.hora.substring(0, 5);
    document.getElementById('eventLocation').textContent = evento.local;
    document.getElementById('eventCategory').textContent = evento.categoria || '-';
    
    const vagasElement = document.getElementById('eventVagas');
    if (vagasElement) {
        const vagas = evento.vagas; 
        vagasElement.textContent = (vagas !== undefined && vagas >= 0) ? `${vagas} vagas` : '- vagas';
    }
}

function atualizarBotaoInscricao(status) {
    const btn = document.getElementById('inscricaoBtn');
    const msg = document.getElementById('statusMessage');

  	// Pega o span dentro do botão (se existir)
	const btnText = btn.querySelector('span');
	const textTarget = btnText || btn; // Altera o span ou o próprio botão

    if (status.jaInscrito) {
        textTarget.textContent = 'Já Inscrito';
        btn.disabled = true;
        msg.textContent = 'Você já está inscrito neste evento.';
    } else if (status.esgotado) {
        textTarget.textContent = 'Vagas Esgotadas';
        btn.disabled = true;
        msg.textContent = 'Vagas esgotadas.';
    } else {
        textTarget.textContent = 'Inscrever-se';
        btn.disabled = false;
        // Remove o 'onclick' do HTML e adiciona o listener de forma segura
        if(btn.hasAttribute('onclick')) {
            btn.removeAttribute('onclick');
        }
        btn.addEventListener('click', inscreverEvento); 
        msg.textContent = '';
    }
}

function mostrarConfirmacaoInscricao(evento) {
    localStorage.setItem('inscricaoRealizada', JSON.stringify({
        eventoNome: evento.nome,
        eventoData: formatarData(evento.data),
        eventoHora: evento.hora.substring(0, 5),
        eventoLocal: evento.local
    }));
    window.location.href = 'inscricao-confirmacao.html';
}

function formatarData(data) {
    if (!data) return "--/--/----";
    const partes = data.split('-');
    if (partes.length < 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function mostrarErro(mensagem) {
    document.getElementById('eventName').textContent = 'Erro';
    document.getElementById('eventDescription').textContent = mensagem;
    const btn = document.getElementById('inscricaoBtn');
    if (btn) btn.style.display = 'none';
}