// ===============================================
// URLs do Servidor (Certifique-se de que estão corretas)
// ===============================================
const API_URL = "http://localhost:8080/api"; 
const SERVER_URL = "http://localhost:8080"; 

// =====================
// 1. VERIFICAÇÃO DE SEGURANÇA (ROTA PROTEGIDA)
// =====================
const token = localStorage.getItem("authToken");
if (!token) {
    alert("Você precisa estar logado para ver os detalhes de um evento.");
    window.location.href = "login.html";
}

// Variável global para armazenar dados do evento
let eventoAtual = null;

// =====================
// FUNÇÃO PARA CARREGAR OS DADOS DO USUÁRIO
// =====================
async function carregarDadosUsuario() {
    const PROFILE_API_URL = `${API_URL}/perfis/me`; 

    if (!token) return;

    try {
        const response = await fetch(PROFILE_API_URL, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.status === 401 || response.status === 403) {
             console.error("Sessão expirada ao buscar perfil.");
             return;
        }

        if (!response.ok) {
            throw new Error('Falha ao carregar perfil.');
        }

        const perfil = await response.json();

        // 1. Popula a foto e nome do perfil no header
        const userImage = document.getElementById("user-avatar");
        const userNameSpan = document.getElementById("user-name");

        if (perfil.nomeCompleto && userNameSpan) {
            // Usa o primeiro nome ou o nome completo
            userNameSpan.textContent = perfil.nomeCompleto.split(" ")[0] || perfil.nomeCompleto; 
        } else {
             userNameSpan.textContent = "Visitante";
        }

        // 2. Popula a foto (usando a URL COMPLETA do servidor)
        if (perfil.fotoPerfilUrl && userImage) {
            // Adicionando cache buster para garantir que a foto mais recente apareça
            const cacheBuster = `?t=${new Date().getTime()}`;
            const urlCompleta = SERVER_URL + perfil.fotoPerfilUrl + cacheBuster; 
            userImage.src = urlCompleta;
        }

    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}


// =====================
// INICIALIZAÇÃO
// =====================
document.addEventListener('DOMContentLoaded', function () {
    // CHAMA A FUNÇÃO DE PERFIL AQUI
    carregarDadosUsuario(); 

    if (typeof setupGlobalSearch === 'function') {
        setupGlobalSearch();
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('id');

    if (eventoId) {
        carregarDetalhesEvento(eventoId);
    } else {
        mostrarErro('Evento não encontrado.');
    }
});

// =====================
// FETCH 1: CARREGAR DETALHES
// =====================
async function carregarDetalhesEvento(eventoId) {
    try {
        const response = await fetch(`http://localhost:8080/api/eventos/${eventoId}`, {
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + token
            }
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
        const response = await fetch(`http://localhost:8080/api/eventos/${eventoId}/status`, {
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Sua sessão expirou (check status). Faça login novamente.");
            localStorage.removeItem("authToken");
            window.location.href = "login.html";
            return;
        }

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

        const response = await fetch(`http://localhost:8080/api/eventos/${eventoId}/inscrever`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            },
        });
        
         if (response.status === 401 || response.status === 403) {
             alert("Sua sessão expirou (inscrição). Faça login novamente.");
             localStorage.removeItem("authToken");
             window.location.href = "login.html";
             return;
         }
         
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
// FUNÇÕES AUXILIARES
// =====================

function preencherDetalhesEvento(evento) {
    document.getElementById('eventName').textContent = evento.nome;
    document.getElementById('eventDescription').textContent = evento.descricao;
    document.getElementById('eventDate').textContent = formatarData(evento.data);
    document.getElementById('eventTime').textContent = evento.hora.substring(0, 5);
    document.getElementById('eventLocation').textContent = evento.local;
    
    const categoryElement = document.getElementById('eventCategory');
    if (categoryElement) {
        categoryElement.textContent = evento.categoria || '-';
    }

    const vagasElement = document.getElementById('eventVagas');
    if (vagasElement) {
        const vagas = evento.vagas; 
        const textoVagas = (vagas !== undefined && vagas !== null && vagas >= 0)
            ? `${vagas} vagas` 
            : '- vagas';
        vagasElement.textContent = textoVagas;
    }
}

function atualizarBotaoInscricao(status) {
    const btn = document.getElementById('inscricaoBtn');
    const msg = document.getElementById('statusMessage');

    if (status.jaInscrito) {
        btn.textContent = 'Já Inscrito';
        btn.disabled = true;
        msg.textContent = 'Você já está inscrito neste evento.';
    } else if (status.esgotado) {
        btn.textContent = 'Vagas Esgotadas';
        btn.disabled = true;
        msg.textContent = 'Vagas esgotadas.';
    } else {
        btn.textContent = 'Inscrever-se';
        btn.disabled = false;
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