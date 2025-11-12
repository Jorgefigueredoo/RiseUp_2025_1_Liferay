// ===============================================
// ARQUIVO: global.js (O "CHEFE")
// ===============================================

// 1. Definições globais
const API_URL = "http://localhost:8080/api";
const SERVER_URL = "http://localhost:8080";
const token = localStorage.getItem("authToken");

// 2. Verificação de segurança global
// Se não tiver token E não estiver na página de login, manda pro login.
if (!token && !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('criar-conta.html')) {
    alert("Você precisa estar logado para ver esta página.");
    window.location.href = "login.html"; 
}

// =====================
// FUNÇÕES GLOBAIS
// =====================

/**
 * Carrega os dados do usuário (nome e foto) no header.
 * Procura por:
 * <img id="header-profile-pic" ...>
 * <span id="header-profile-name">...</span>
 */
async function carregarDadosUsuario() {
    if (!token) return; // Sai se não tiver token

    const PROFILE_API_URL = `${API_URL}/perfis/me`;
    const userImage = document.getElementById("header-profile-pic"); 
    const userNameSpan = document.getElementById("header-profile-name");

    // Se não achar os elementos no header, não faz nada.
    if (!userImage || !userNameSpan) {
        console.warn("Elementos do perfil no header (header-profile-pic ou header-profile-name) não encontrados.");
        return;
    }

    try {
        const response = await fetch(PROFILE_API_URL, {
            method: "GET",
            headers: { Authorization: "Bearer " + token },
        });

        if (!response.ok) {
            console.error("Sessão expirada ou falha ao buscar perfil.");
            if (response.status === 401 || response.status === 403) {
                 localStorage.removeItem("authToken");
                 window.location.href = "login.html";
            }
            return;
        }

        const perfil = await response.json();

        if (perfil.nomeCompleto && userNameSpan) {
            userNameSpan.textContent = perfil.nomeCompleto;
        }
        if (perfil.fotoPerfilUrl && userImage) {
            userImage.src = SERVER_URL + perfil.fotoPerfilUrl;
        }
    } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
    }
}

/**
 * Configura o botão de logout (se existir na página).
 */
function setupLogout() {
    // Você mencionou um botão de logout, mas ele não está no HTML que vi.
    // Se você tiver um <button id="logout-button">, isto vai funcionar.
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

/**
 * Configura a barra de pesquisa global com autocomplete.
 * Procura por:
 * <input id="search-input" ...>
 * <div id="global-search-results">...</div>
 */
function setupGlobalSearch() {
    const searchInput = document.getElementById("search-input");
    const resultsContainer = document.getElementById("global-search-results");

    if (!searchInput || !resultsContainer) {
        console.warn("Elementos da busca global (search-input ou global-search-results) não encontrados.");
        return;
    }

    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    const fetchResults = async (query) => {
        if (query.length < 2) { // Não busca por menos de 2 caracteres
            resultsContainer.style.display = "none";
            return;
        }
        try {
            const response = await fetch(`${API_URL}/perfis/buscar?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!response.ok) throw new Error('Erro na busca');
            
            const data = await response.json();
            renderResults(data);

        } catch (error) {
            console.error('Falha na busca:', error);
            resultsContainer.innerHTML = '<div style="padding:10px; color: #777;">Erro ao buscar.</div>';
            resultsContainer.style.display = 'block';
        }
    };

    const renderResults = (results) => {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div style="padding:10px; color: #777;">Nenhum resultado encontrado.</div>';
            resultsContainer.style.display = 'block';
            return;
        }

        resultsContainer.innerHTML = ""; // Limpa resultados antigos

        results.forEach(item => {
            const linkElement = document.createElement('a');
            // A URL vem pronta do backend (ex: /web/jorge-antonio/perfil?usuarioId=1)
            linkElement.href = item.urlPerfil; 
            linkElement.innerHTML = `
                <strong>${item.nome}</strong>
                <span>${item.descricao}</span>
            `;
            resultsContainer.appendChild(linkElement);
        });
        resultsContainer.style.display = 'block';
    };

    // "Ouve" a digitação, com delay
    searchInput.addEventListener('input', debounce((e) => {
        fetchResults(e.target.value);
    }, 300));

    // Fecha o dropdown se clicar fora
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });
}

// ===============================================
// INICIALIZAÇÃO GLOBAL (LIGA TUDO)
// ===============================================
document.addEventListener("DOMContentLoaded", () => {
    // Roda em TODAS as páginas que importarem este script
    carregarDadosUsuario();
    setupLogout();
    setupGlobalSearch();
});