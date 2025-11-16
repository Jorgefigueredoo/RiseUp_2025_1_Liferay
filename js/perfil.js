// ===============================================
// ARQUIVO: perfil.js
// ===============================================

// ID do usuário (não usado mais)
const USUARIO_ID = 1;

const skillIcons = {
    javascript: '<i class="fab fa-js-square" style="color:#f7df1e;"></i>',
    react: '<i class="fab fa-react" style="color:#61dafb;"></i>',
    "next.js": '<i class="fa-brands fa-react" style="color:#000;"></i>',
    python: '<i class="fab fa-python" style="color:#3776ab;"></i>',
    java: '<i class="fab fa-java" style="color:#f89820;"></i>',
    html: '<i class="fab fa-html5" style="color:#e34c26;"></i>',
    css: '<i class="fab fa-css3-alt" style="color:#264de4;"></i>',
    "node.js": '<i class="fab fa-node-js" style="color:#3c873a;"></i>',
    git: '<i class="fab fa-git-alt" style="color:#f1502f;"></i>',
    github: '<i class="fab fa-github"></i>',
    typescript: '<i class="fab fa-js" style="color:#3178c6;"></i>',
    "c++": '<i class="fab fa-cuttlefish" style="color:#00599C;"></i>',
    "c#": '<i class="fas fa-hashtag" style="color:#68217a;"></i>',
    php: '<i class="fab fa-php" style="color:#777bb3;"></i>',
    sql: '<i class="fas fa-database" style="color:#4479A1;"></i>',
};

const initialSkills = ["React", "Next.js", "JavaScript", "Python"];

// ===============================================
// INICIALIZAÇÃO
// ===============================================
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioId = urlParams.get("usuarioId");

    initializeTabs();

    if (usuarioId) {
        carregarPerfilPublico(usuarioId);

        const saveBtn = document.getElementById("save-profile-btn");
        if (saveBtn) saveBtn.style.display = "none";

        const editIcon = document.querySelector(".edit-icon");
        if (editIcon) editIcon.style.display = "none";

        const addSkillForm = document.querySelector(".add-skill-form");
        if (addSkillForm) addSkillForm.style.display = "none";

    } else {
        carregarMeuPerfilParaEdicao();

        const saveBtn = document.getElementById("save-profile-btn");
        if (saveBtn) saveBtn.addEventListener("click", salvarMeuPerfil);

        const fileUpload = document.getElementById("file-upload");
        if (fileUpload) fileUpload.addEventListener("change", uploadMinhaFoto);

        const addSkillBtn = document.getElementById("add-skill-btn");
        if (addSkillBtn) addSkillBtn.addEventListener("click", adicionarSkillDaCaixa);

        const skillInput = document.getElementById("skill-input");
        if (skillInput) {
            skillInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarSkillDaCaixa();
                }
            });
        }

        const skillsList = document.getElementById("skills-list");
        if (skillsList) {
            skillsList.addEventListener("click", (e) => {
                if (
                    e.target.classList.contains("delete-skill-btn") ||
                    e.target.parentElement?.classList.contains("delete-skill-btn")
                ) {
                    const skillItem = e.target.closest(".skill-item");
                    if (skillItem) {
                        skillItem.classList.add("fade-out");
                        setTimeout(() => skillItem.remove(), 250);
                    }
                }
            });
        }
    }
});

// ===============================================
// TABS
// ===============================================
function initializeTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");

            tabBtns.forEach((b) => b.classList.remove("active"));
            tabContents.forEach((content) => content.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(`tab-${targetTab}`).classList.add("active");

            if (targetTab === "eventos") {
                const eventosList = document.getElementById("eventos-list");
                if (eventosList && eventosList.children.length === 0) {
                    carregarEventosInscritos();
                }
            }
        });
    });
}

// ===============================================
// CARREGAR PERFIL
// ===============================================
async function carregarMeuPerfilParaEdicao() {
    try {
        const resp = await fetch(`${API_URL}/perfis/me`, {
            headers: { Authorization: "Bearer " + token },
        });

        if (!resp.ok) throw new Error();

        const perfil = await resp.json();
        preencherDadosPerfil(perfil, true);

    } catch {
        preencherDadosPerfil(
            {
                nomeCompleto: "Falha ao carregar",
                titulo: "Erro",
                sobreMim: "Não foi possível carregar.",
                habilidades: initialSkills,
            },
            true
        );
    }
}

async function carregarPerfilPublico(usuarioId) {
    try {
        const resp = await fetch(`${API_URL}/perfis/usuario/${usuarioId}`, {
            headers: { Authorization: "Bearer " + token },
        });

        if (!resp.ok) throw new Error();

        preencherDadosPerfil(await resp.json(), false);

    } catch {
        alert("Erro ao carregar o perfil do usuário.");
    }
}

function preencherDadosPerfil(perfil, modoEdicao) {
    const imgPreview = document.getElementById("main-profile-pic");
    if (imgPreview && perfil.fotoPerfilUrl) {
        imgPreview.src = SERVER_URL + perfil.fotoPerfilUrl;
    }

    if (modoEdicao) {
        document.getElementById("profile-nome").value = perfil.nomeCompleto || "";
        document.getElementById("profile-titulo").value = perfil.titulo || "";
        document.getElementById("profile-sobre").value = perfil.sobreMim || "";

        renderizarSkills(perfil.habilidades || [], true);

    } else {
        document.getElementById("profile-nome").replaceWith(criarElementoTexto("h1", perfil.nomeCompleto));
        document.getElementById("profile-titulo").replaceWith(criarElementoTexto("h3", perfil.titulo));
        document.getElementById("profile-sobre").replaceWith(criarElementoTexto("p", perfil.sobreMim));

        renderizarSkills(perfil.habilidades || [], false);
    }
}

function criarElementoTexto(tag, texto) {
    const el = document.createElement(tag);
    el.textContent = texto || "";
    return el;
}

// ===============================================
// SALVAR PERFIL
// ===============================================
async function salvarMeuPerfil(e) {
    e.preventDefault();

    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "Salvando...";

    const dados = {
        nomeCompleto: document.getElementById("profile-nome").value,
        titulo: document.getElementById("profile-titulo").value,
        sobreMim: document.getElementById("profile-sobre").value,
        habilidades: getSkillsDaLista(),
    };

    try {
        const resp = await fetch(`${API_URL}/perfis/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify(dados),
        });

        if (!resp.ok) throw new Error();
        alert("Perfil salvo!");

        if (typeof carregarDadosUsuario === "function") carregarDadosUsuario();

    } finally {
        btn.disabled = false;
        btn.textContent = "Salvar Alterações";
    }
}

// ===============================================
// FOTO
// ===============================================
async function uploadMinhaFoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const btn = document.querySelector(".edit-icon");
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const formData = new FormData();
    formData.append("file", file);

    try {
        const resp = await fetch(`${API_URL}/perfis/foto`, {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: formData,
        });

        if (!resp.ok) throw new Error();

        const data = await resp.json();
        document.getElementById("main-profile-pic").src =
            SERVER_URL + data.novaUrl + "?t=" + Date.now();

        if (typeof carregarDadosUsuario === "function") carregarDadosUsuario();

    } finally {
        if (btn) btn.innerHTML = '<i class="fas fa-camera"></i>';
    }
}

// ===============================================
// SKILLS
// ===============================================
function adicionarSkillDaCaixa() {
    const input = document.getElementById("skill-input");
    if (!input.value.trim()) return;

    const list = document.getElementById("skills-list");
    const el = createSkillElement(input.value, true);

    list.appendChild(el);
    input.value = "";
}

function createSkillElement(skillName, editavel) {
    const icon =
        skillIcons[skillName.toLowerCase()] ||
        '<i class="fas fa-code" style="color:#00318f;"></i>';

    const div = document.createElement("div");
    div.classList.add("skill-item");

    div.innerHTML = `
        <div class="skill-pill">
            ${icon}
            <span>${skillName}</span>
            ${editavel ? `<button class="delete-skill-btn"><i class="fas fa-times"></i></button>` : ""}
        </div>
    `;

    return div;
}

function renderizarSkills(arr, editavel) {
    const list = document.getElementById("skills-list");
    list.innerHTML = "";

    arr.forEach((s) => list.appendChild(createSkillElement(s, editavel)));
}

function getSkillsDaLista() {
    return [...document.querySelectorAll("#skills-list span")].map((s) =>
        s.textContent.trim()
    );
}

// ===============================================
// EVENTOS
// ===============================================
async function carregarEventosInscritos() {
    const loading = document.getElementById("eventos-loading");
    const list = document.getElementById("eventos-list");
    const empty = document.getElementById("eventos-empty");

    loading.style.display = "flex";
    list.style.display = "none";
    empty.style.display = "none";

    try {
        const resp = await fetch(`${API_URL}/perfis/minhas-inscricoes`, {
            headers: { Authorization: "Bearer " + token },
        });

        if (!resp.ok) throw new Error();

        const inscricoes = await resp.json();
        loading.style.display = "none";

        if (inscricoes.length === 0) {
            empty.style.display = "block";
            empty.querySelector("h3").textContent = "Nenhuma inscrição";
            empty.querySelector("p").textContent =
                "Você ainda não se inscreveu em nenhum evento.";
            return;
        }

        list.style.display = "flex";
        renderizarEventos(inscricoes);

    } catch {
        loading.style.display = "none";
        empty.style.display = "block";
        empty.querySelector("h3").textContent = "Erro ao carregar eventos";
        empty.querySelector("p").textContent = "Tente novamente mais tarde.";
    }
}

function renderizarEventos(inscricoes) {
    const list = document.getElementById("eventos-list");
    list.innerHTML = "";

    inscricoes.forEach((i) => {
        if (i.evento) list.appendChild(criarCardEvento(i.evento, i));
    });
}

function criarCardEvento(evento, inscricao) {
    const status = inscricao.status || "PENDENTE";
    const statusClass = status.toLowerCase();

    const div = document.createElement("div");
    div.className = "evento-card";

    div.innerHTML = `
        <span class="evento-status ${statusClass}">${capitalize(status)}</span>
        <div class="evento-icon"><i class="${getIconeCategoria(evento.categoria)}"></i></div>
        <div class="evento-content">
            <h3>${evento.nome}</h3>
            <div class="evento-meta">
                <div class="evento-meta-item"><i class="fas fa-calendar-alt"></i><span>${formatarData(evento.data)}</span></div>
                <div class="evento-meta-item"><i class="fas fa-clock"></i><span>${evento.hora?.substring(0, 5) || "N/A"}</span></div>
                <div class="evento-meta-item"><i class="fas fa-map-marker-alt"></i><span>${evento.local || "Online"}</span></div>
                <div class="evento-meta-item"><i class="fas fa-tag"></i><span>${capitalize(evento.categoria)}</span></div>
            </div>
            <p class="evento-description">${evento.descricao}</p>
            <div class="evento-actions">
                <button class="btn-evento btn-detalhes" onclick="verDetalhesEvento(${evento.id})">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
                ${
                    status === "CONFIRMADA"
                        ? `<button class="btn-evento btn-cancelar-inscricao" onclick="cancelarInscricao(${inscricao.id}, ${evento.id})">
                        <i class="fas fa-times-circle"></i> Cancelar Inscrição
                    </button>`
                        : ""
                }
            </div>
        </div>
    `;

    return div;
}

// ============
function getIconeCategoria(cat) {
    const c = {
        workshop: "fas fa-laptop-code",
        palestra: "fas fa-microphone-alt",
        hackathon: "fas fa-trophy",
        networking: "fas fa-users",
        treinamento: "fas fa-chalkboard-teacher",
        mentoria: "fas fa-user-tie",
        outro: "fas fa-calendar-day",
    };
    return c[cat?.toLowerCase()] || "fas fa-calendar-day";
}

function formatarData(data) {
    if (!data) return "";
    const p = data.split("-");
    return `${p[2]}/${p[1]}/${p[0]}`;
}

function capitalize(str) {
    if (!str) return "";
    str = str.toLowerCase();
    return str[0].toUpperCase() + str.slice(1);
}

function verDetalhesEvento(id) {
    window.location.href = `detalhes-evento.html?id=${id}`;
}

async function cancelarInscricao(inscricaoId) {
    const confirmar = confirm("Deseja cancelar sua inscrição?");
    if (!confirmar) return;

    await fetch(`${API_URL}/inscricoes/${inscricaoId}/cancelar`, {
        method: "PUT",
        headers: { Authorization: "Bearer " + token },
    });

    carregarEventosInscritos();
}
