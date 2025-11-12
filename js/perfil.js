// ===============================================
// ARQUIVO: perfil.js (AGORA INTELIGENTE)
// =M
// NOTA:
// O global.js já cuidou do header e da busca.
// Este script agora sabe mostrar o SEU perfil ou o de OUTROS.
//

// "Liga" as funções da página
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica a URL da página
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioId = urlParams.get('usuarioId');

    if (usuarioId) {
        // Se tem um ID, carrega o perfil PÚBLICO de outra pessoa
        carregarPerfilPublico(usuarioId);
        // Esconde os botões de edição
        document.getElementById('save-profile-btn').style.display = 'none';
        document.querySelector('.edit-icon').style.display = 'none';
        
        // Esconde o formulário de adicionar skill
        const addSkillForm = document.querySelector('.add-skill-form');
        if (addSkillForm) addSkillForm.style.display = 'none';
        
    } else {
        // Se não tem ID, carrega o SEU perfil para EDIÇÃO
        carregarMeuPerfilParaEdicao();
        
        // Configura os botões de EDIÇÃO
        document.getElementById('save-profile-btn').addEventListener('click', salvarMeuPerfil);
        document.getElementById('file-upload').addEventListener('change', uploadMinhaFoto);
        
        // Configura a lógica das Habilidades (skills)
        document.getElementById('add-skill-btn').addEventListener('click', adicionarSkillDaCaixa);
        document.getElementById('skills-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-skill-btn')) {
                e.target.parentElement.remove();
            }
        });
    }
});

// =====================
// LÓGICA 1: Carregar o SEU perfil (para editar)
// =====================
async function carregarMeuPerfilParaEdicao() {
    try {
        const response = await fetch(`${API_URL}/perfis/me`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) throw new Error('Falha ao carregar seu perfil para edição');

        const perfil = await response.json();
        preencherDadosPerfil(perfil, true); // true = modo edição

    } catch (error) {
        console.error('Erro ao carregar seu perfil:', error);
        alert('Não foi possível carregar seus dados para edição.');
    }
}

// =====================
// LÓGICA 2: Carregar o perfil PÚBLICO (para ver)
// =====================
async function carregarPerfilPublico(usuarioId) {
    try {
        const response = await fetch(`${API_URL}/perfis/usuario/${usuarioId}`, {
            headers: { 'Authorization': 'Bearer ' + token } // O token ainda é necessário (pelas regras de segurança)
        });
        if (!response.ok) throw new Error('Falha ao carregar perfil do usuário');

        const perfil = await response.json();
        preencherDadosPerfil(perfil, false); // false = modo visualização

    } catch (error) {
        console.error('Erro ao carregar perfil público:', error);
        alert('Não foi possível carregar o perfil deste usuário.');
    }
}


// =====================
// FUNÇÃO CENTRAL: Preencher o HTML
// =====================
function preencherDadosPerfil(perfil, modoEdicao) {
    // Inputs (só preenche se estiver no modo edição)
    if (modoEdicao) {
        document.getElementById('profile-nome').value = perfil.nomeCompleto || '';
        document.getElementById('profile-titulo').value = perfil.titulo || '';
        document.getElementById('profile-sobre').value = perfil.sobreMim || '';
        renderizarSkills(perfil.habilidades || [], true); // true = editável
    } else {
        // Se não está em modo edição, transforma inputs em texto
        document.getElementById('profile-nome').replaceWith(criarElementoTexto('h1', perfil.nomeCompleto || 'Usuário', 'profile-nome-texto'));
        document.getElementById('profile-titulo').replaceWith(criarElementoTexto('h3', perfil.titulo || 'Colaborador', 'profile-titulo-texto'));
        document.getElementById('profile-sobre').replaceWith(criarElementoTexto('p', perfil.sobreMim || 'Sem descrição.', 'profile-sobre-texto'));
        renderizarSkills(perfil.habilidades || [], false); // false = não editável
    }

    // Atualiza a foto de perfil principal da página
    const imgPreview = document.getElementById('main-profile-pic');
    if (imgPreview && perfil.fotoPerfilUrl) {
        imgPreview.src = SERVER_URL + perfil.fotoPerfilUrl;
    }
}

// Helper para criar texto
function criarElementoTexto(tag, texto, id) {
    const el = document.createElement(tag);
    el.id = id;
    el.textContent = texto;
    return el;
}


// =====================
// Funções de EDIÇÃO (Salvar Perfil, Upload Foto, Skills)
// (Estas funções só são chamadas se for o SEU perfil)
// =====================

async function salvarMeuPerfil(event) {
    event.preventDefault(); 
    const btnSalvar = document.getElementById('save-profile-btn');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    const dadosAtualizados = {
        nomeCompleto: document.getElementById('profile-nome').value,
        titulo: document.getElementById('profile-titulo').value,
        sobreMim: document.getElementById('profile-sobre').value,
        habilidades: getSkillsDaLista(), // <-- CORRIGIDO: Agora envia um Array
    };

    try {
        const response = await fetch(`${API_URL}/perfis/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(dadosAtualizados)
        });
        if (!response.ok) throw new Error('Falha ao salvar. Tente novamente.');
        alert('Perfil salvo com sucesso!');
        carregarDadosUsuario(); // Atualiza o header
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert(error.message);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar Alterações';
    }
}

async function uploadMinhaFoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    const btnLabel = document.querySelector('.edit-icon');
    btnLabel.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 

    try {
        const response = await fetch(`${API_URL}/perfis/foto`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        if (!response.ok) throw new Error((await response.json()).erro || 'Falha no upload.');

        const resultado = await response.json();
        const imgPreview = document.getElementById('main-profile-pic');
        imgPreview.src = SERVER_URL + resultado.novaUrl + '?t=' + new Date().getTime();
        carregarDadosUsuario(); // Atualiza o header
    } catch (error) {
        console.error('Erro no upload da foto:', error);
        alert(error.message);
    } finally {
        btnLabel.innerHTML = '<i class="fas fa-camera"></i>';
    }
}

function adicionarSkillDaCaixa() {
    const input = document.getElementById('skill-input');
    const skillName = input.value.trim();
    if (skillName) {
        criarTagSkill(skillName, true); // true = editável
        input.value = '';
    }
}

// ========================================================
// FUNÇÃO CORRIGIDA (Linha 217)
// ========================================================
function renderizarSkills(habilidadesArray, editavel) {
    const list = document.getElementById('skills-list');
    list.innerHTML = ''; 

    // O backend manda um Array (ex: ["Java", "React"])
    // Esta função agora lida com um Array, e não mais com uma String.
    if (Array.isArray(habilidadesArray)) {
        habilidadesArray
            .filter(s => s && s.trim() !== '') // Filtra strings nulas ou vazias
            .forEach(skillName => criarTagSkill(skillName, editavel));
    } 
    // Fallback (plano B) caso ainda venha uma string
    else if (typeof habilidadesArray === 'string' && habilidadesArray) {
        habilidadesArray.split(',')
            .filter(s => s.trim() !== '')
            .forEach(skillName => criarTagSkill(skillName, editavel));
    }
}

function criarTagSkill(nome, editavel) {
    const list = document.getElementById('skills-list');
    const tag = document.createElement('div');
    tag.classList.add('skill-tag');
    tag.textContent = nome;

    if (editavel) {
        const removeBtn = document.createElement('span');
        removeBtn.classList.add('remove-skill-btn');
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remover habilidade';
        tag.appendChild(removeBtn);
    }
    list.appendChild(tag);
}

// ========================================================
// FUNÇÃO CORRIGIDA (Linha 238)
// ========================================================
function getSkillsDaLista() {
    const skillsList = document.querySelectorAll('#skills-list .skill-tag');
    const skillsArray = Array.from(skillsList).map(tag => tag.firstChild.textContent.trim());
    return skillsArray; // <-- CORRIGIDO: Retorna um Array (preferido pelo backend)
}