// ===============================================
// URL base da sua API
const API_URL = 'http://localhost:8080/api';
// URL base do seu SERVIDOR (para as fotos)
const SERVER_URL = 'http://localhost:8080'; 
// ===============================================

// Mapeamento de ícones (coloque o seu objeto 'skillIcons' aqui)
const skillIcons = {
    javascript: '<i class="fab fa-js-square" style="color:#f7df1e;"></i>',
    react: '<i class="fab fa-react" style="color:#61dafb;"></i>',
    python: '<i class="fab fa-python" style="color:#3776ab;"></i>',
    java: '<i class="fab fa-java" style="color:#f89820;"></i>',
    html: '<i class="fab fa-html5" style="color:#e34c26;"></i>',
    css: '<i class="fab fa-css3-alt" style="color:#264de4;"></i>',
    sql: '<i class="fas fa-database" style="color:#4479A1;"></i>',
    docker: '<i class="fab fa-docker" style="color:#2496ed;"></i>',
    "spring boot": '<i class="fas fa-leaf" style="color:#6DB33F;"></i>',
    // Adicione outros ícones conforme necessário
};

// --- Funções de UI ---

function createSkillElement(skillName) {
    const skillKey = skillName.toLowerCase();
    const iconHTML =
        skillIcons[skillKey] ||
        '<i class="fas fa-code" style="color:#00318f;"></i>';

    const skillItem = document.createElement("div");
    skillItem.classList.add("skill-item");
    skillItem.innerHTML = `
    <div class="skill-pill">
      ${iconHTML}
      <span>${skillName}</span>
      <button class="delete-skill-btn" title="Remover"><i class="fas fa-times"></i></button>
    </div>
  `;
    skillItem.querySelector(".delete-skill-btn").addEventListener("click", () => {
        skillItem.classList.add("fade-out");
        setTimeout(() => skillItem.remove(), 250);
    });
    return skillItem;
}

function addSkill() {
    const skillInput = document.getElementById("skill-input");
    const skillsList = document.getElementById("skills-list");
    if (!skillInput || !skillsList) return;

    const skillName = skillInput.value.trim();
    if (skillName === "") return;

    const newSkill = createSkillElement(skillName);
    newSkill.classList.add("fade-in");
    skillsList.appendChild(newSkill);
    skillInput.value = "";
}

function setupPhotoPreview() {
    const fileInput = document.getElementById("file-upload");
    const previewImage = document.getElementById("main-profile-pic");
    if (!fileInput || !previewImage) return;

    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
}

// --- Funções de API ---

async function loadProfile() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error("Usuário não logado!");
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/perfis/me`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 alert("Sessão expirada. Faça login novamente.");
                 window.location.href = '/login.html';
            }
            throw new Error('Falha ao carregar perfil.');
        }
        
        const perfil = await response.json();
        console.log("Perfil carregado:", perfil);

        // 1. Popula campos do formulário
        const nomeInput = document.getElementById("profile-nome");
        const tituloInput = document.getElementById("profile-titulo");
        const sobreMimTextarea = document.getElementById("profile-sobre");
        
        if (nomeInput) nomeInput.value = perfil.nomeCompleto || '';
        if (tituloInput) tituloInput.value = perfil.titulo || '';
        if (sobreMimTextarea) sobreMimTextarea.value = perfil.sobreMim || '';

        // 2. Popula as FOTOS (principal e header)
        const mainProfilePic = document.getElementById("main-profile-pic");
        const headerProfilePic = document.getElementById("header-profile-pic");

        // CORREÇÃO: Usa SERVER_URL para criar o caminho absoluto da foto
        if (perfil.fotoPerfilUrl) { 
            // Adiciona um "cache buster" para forçar o navegador a recarregar a imagem
            const cacheBuster = `?t=${new Date().getTime()}`;
            const urlCompleta = SERVER_URL + perfil.fotoPerfilUrl + cacheBuster; 
            
            if (mainProfilePic) mainProfilePic.src = urlCompleta;
            if (headerProfilePic) headerProfilePic.src = urlCompleta;
        }

        // 3. Popula o NOME no HEADER
        const headerProfileName = document.getElementById("header-profile-name");
        
        if (headerProfileName) {
            headerProfileName.textContent = perfil.nomeCompleto || 'Meu Perfil';
        } else {
            console.error("ERRO: Elemento 'header-profile-name' não foi encontrado!");
        }

        // 4. Popula HABILIDADES
        const skillsList = document.getElementById("skills-list");
        if (skillsList) {
            skillsList.innerHTML = '';
            if (perfil.habilidades && perfil.habilidades.length > 0) {
                perfil.habilidades.forEach((skill) => {
                    const skillElement = createSkillElement(skill);
                    skillsList.appendChild(skillElement);
                });
            }
        }

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

async function saveProfile() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error("Usuário não logado!");
        return;
    }

    // --- 1. Coleta dados de TEXTO ---
    const skillsList = document.getElementById("skills-list");
    const nomeInput = document.getElementById("profile-nome");
    const tituloInput = document.getElementById("profile-titulo");
    const sobreMimTextarea = document.getElementById("profile-sobre");
    const saveBtn = document.getElementById("save-profile-btn");

    if (!skillsList || !nomeInput || !tituloInput || !sobreMimTextarea || !saveBtn) {
        console.error("Um ou mais elementos do DOM não foram encontrados. Abortando salvamento.");
        return;
    }

    const skillsNodes = skillsList.querySelectorAll('.skill-pill span');
    const skillsArray = Array.from(skillsNodes).map(span => span.textContent);

    const perfilUpdateDto = {
        nomeCompleto: nomeInput.value,
        titulo: tituloInput.value,
        sobreMim: sobreMimTextarea.value,
        habilidades: skillsArray
    };
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    let textoSalvo = false; 

    // --- 2. Salva os dados de TEXTO (PUT /perfis/me) ---
    try {
        const response = await fetch(`${API_URL}/perfis/me`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(perfilUpdateDto)
        });

        if (!response.ok) {
            throw new Error('Falha ao salvar os dados do perfil.');
        }

        const perfilSalvo = await response.json();
        console.log('Perfil salvo com sucesso:', perfilSalvo);
        
        const headerProfileName = document.getElementById("header-profile-name");
        if(headerProfileName) {
            headerProfileName.textContent = perfilSalvo.nomeCompleto;
        }
        textoSalvo = true;

    } catch (error) {
        console.error('Erro ao salvar dados de texto:', error);
        alert('Erro ao salvar os dados. Tente novamente.');
    }

    // --- 3. Salva a FOTO (POST /perfis/foto) ---
    const fileInput = document.getElementById("file-upload");
    const selectedFile = fileInput.files[0];
    let fotoSalva = false;

    if (textoSalvo && selectedFile) {
        console.log("Enviando nova foto...");
        const formData = new FormData();
        formData.append("file", selectedFile); 

        try {
            const fotoResponse = await fetch(`${API_URL}/perfis/foto`, { 
                method: "POST", 
                headers: { "Authorization": "Bearer " + token },
                body: formData
            });

            if (!fotoResponse.ok) {
                throw new Error('Falha no upload da foto.');
            }
            
            const fotoResult = await fotoResponse.json(); 
            console.log("Foto salva com sucesso:", fotoResult.novaUrl);
            
            // CORREÇÃO: Usa SERVER_URL e cacheBuster para forçar a atualização
            const cacheBuster = `?t=${new Date().getTime()}`;
            const urlCompleta = SERVER_URL + fotoResult.novaUrl + cacheBuster;

            const headerProfilePic = document.getElementById("header-profile-pic");
            const mainProfilePic = document.getElementById("main-profile-pic");

            if (headerProfilePic) headerProfilePic.src = urlCompleta;
            if (mainProfilePic) mainProfilePic.src = urlCompleta;
            
            fotoSalva = true;

        } catch (error) {
            console.error('Erro no upload da foto:', error);
            alert('Os dados de texto foram salvos, mas houve um erro ao enviar a foto.');
        }
    }

    // --- 4. Feedback Final ---
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar Alterações';

    if (textoSalvo && !selectedFile) {
        alert('Perfil atualizado com sucesso!');
    } else if (textoSalvo && fotoSalva) {
        alert('Perfil e foto atualizados com sucesso!');
    }
}

function setupGlobalSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        window.location.href = `resultado-pesquisa.html?q=${encodeURIComponent(searchTerm)}`;
      }
    }
  });
}

// --- Eventos ---
window.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    setupPhotoPreview(); 

    if (typeof setupGlobalSearch === 'function') {
        setupGlobalSearch();
    }
    
    const addSkillBtn = document.getElementById("add-skill-btn");
    const skillInput = document.getElementById("skill-input");
    const saveBtn = document.getElementById("save-profile-btn");

    if (addSkillBtn) addSkillBtn.addEventListener("click", addSkill);
    if (skillInput) {
        skillInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
            }
        });
    }
    if (saveBtn) saveBtn.addEventListener("click", saveProfile);
});