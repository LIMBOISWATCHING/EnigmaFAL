// ======================================================
// MAGNUS FILES
// Dashboard.js
//
// Tela inicial — mostra casos e personagens do operador.
// ======================================================

import MC from "../../js/engine/Core.js";

const ACTIVE_CASE_STATUSES = ["Open", "Investigation", "Paused", "not_started", "in_progress"];

class Dashboard {

    constructor() {

        this.container = null;

    }

    // ==================================================
    // ABRE
    // ==================================================

    async open(container) {

        this.container = container;

        MC.Layout.show();

        MC.Layout.setUser(MC.Auth.current());

        MC.Menu.unlock();

        this.container.innerHTML =
            await MC.Loader.html("pages/Dashboard/Dashboard.html");

        document.getElementById("dashboard-open-manual")
            ?.addEventListener("click", async () => {
                sessionStorage.setItem("mc-open-library-book", "BOK2241");
                await MC.Router.open("creatures");
            });

        await this.render();

    }

    // ==================================================
    // RENDERIZA
    // ==================================================

    async render() {

        const user = MC.Auth.current() || MC.State.get("user");

        const username = user?.name || user?.username || "Investigador";

        let lastLogin = "--";

        if(user?.lastLogin){

            const date = new Date(user.lastLogin);

            lastLogin =
                date.toLocaleDateString("pt-BR") +
                " - " +
                date.toLocaleTimeString("pt-BR",{

                    hour:"2-digit",

                    minute:"2-digit"

                });

        }

        document.getElementById("dashboard-user").textContent =
            `Bem-vindo de volta, ${username}.`;

        document.getElementById("dashboard-login").textContent =
            lastLogin;

        // Carrega casos e personagens
        if (user) {

            const [characters, cases] = await Promise.all([

                this.loadCharacters(user),

                this.loadCases(user)

            ]);

            // Atualiza contadores
            const casesCountEl = document.getElementById("dashboard-cases");
            const charsCountEl = document.getElementById("dashboard-characters");

            if (casesCountEl) casesCountEl.textContent = cases.length;
            if (charsCountEl) charsCountEl.textContent = characters.length;

            // Renderiza seções de cards
            const casesSection = document.getElementById("dashboard-cases-list");
            const charsSection = document.getElementById("dashboard-chars-list");

            if (casesSection) casesSection.innerHTML = this.renderCases(cases);
            if (charsSection) charsSection.innerHTML = this.renderCharacters(characters);

        }

    }

    // ==================================================
    // CARREGA PERSONAGENS
    // ==================================================

    async loadCharacters(user) {

        try {

            const all = await MC.Services.Characters.findByPlayer(user.id);

            return all.filter(ch => ch.active);

        } catch { return []; }

    }

    // ==================================================
    // CARREGA CASOS
    // ==================================================

    async loadCases(user) {

        try {

            const all = await MC.Services.Cases.findAll();

            return all.filter(c => {

                if (!ACTIVE_CASE_STATUSES.includes(c.status)) return false;

                if (c.userIds?.includes(user.id)) return true;

                if (user.cases && user.cases[c.id]) return true;

                return c.ownerId === user.id;

            });

        } catch { return []; }

    }

    // ==================================================
    // RENDERIZA CASOS
    // ==================================================

    renderCases(cases) {

        if (!cases.length) {

            return `<p class="dashboard-empty">Nenhum caso em andamento.</p>`;

        }

        return `<div class="dashboard-card-grid">${

            cases.map(c => {

                const photo = this.resolveImageUrl(c, "cover");
                const initials = this.initials(c.name || c.code || "C");
                const status = this.translateCaseStatus(c.status);

                return `
                    <article class="dashboard-item">
                        <div class="dashboard-item-photo">
                            ${photo
                                ? `<img src="${this.esc(photo)}" alt="${this.esc(c.name)}">`
                                : `<span class="dashboard-item-ph">${this.esc(initials)}</span>`}
                        </div>
                        <div class="dashboard-item-info">
                            <span class="dashboard-item-label">${this.esc(c.code || "SEM CÓDIGO")}</span>
                            <strong class="dashboard-item-name">${this.esc(c.name || "Caso sem título")}</strong>
                            <span class="dashboard-item-meta">${this.esc(status)}</span>
                        </div>
                    </article>`;

            }).join("")

        }</div>`;

    }

    // ==================================================
    // RENDERIZA PERSONAGENS
    // ==================================================

    renderCharacters(characters) {

        if (!characters.length) {

            return `<p class="dashboard-empty">Nenhum personagem ativo.</p>`;

        }

        return `<div class="dashboard-card-grid">${

            characters.map(ch => {

                const photo = this.resolveImageUrl(ch, "photo");
                const initials = this.initials(ch.name || "?");

                return `
                    <article class="dashboard-item">
                        <div class="dashboard-item-photo">
                            ${photo
                                ? `<img src="${this.esc(photo)}" alt="${this.esc(ch.name)}">`
                                : `<span class="dashboard-item-ph">${this.esc(initials)}</span>`}
                        </div>
                        <div class="dashboard-item-info">
                            <strong class="dashboard-item-name">${this.esc(ch.name || "Sem nome")}</strong>
                            <span class="dashboard-item-meta">${ch.alive === false ? "Inativo" : "Ativo"}</span>
                        </div>
                    </article>`;

            }).join("")

        }</div>`;

    }

    // ==================================================
    // UTILITÁRIOS
    // ==================================================

    resolveImageUrl(entity, primaryField) {

        const d = entity[primaryField];
        if (this.isImg(d)) return d;
        if (this.isImg(entity.photo)) return entity.photo;
        if (this.isImg(entity.metadata?.photoUrl)) return entity.metadata.photoUrl;
        if (this.isImg(entity.metadata?.coverUrl)) return entity.metadata.coverUrl;
        const p = entity.photoIds?.[0];
        if (this.isImg(p)) return p;
        return null;

    }

    isImg(v) {

        if (!v || typeof v !== "string") return false;
        return v.startsWith("http") || v.startsWith("/") ||
               v.startsWith("assets/") || v.startsWith("data:image");

    }

    initials(name) {

        return name.split(/\s+/).filter(Boolean).slice(0, 2)
            .map(p => p[0].toUpperCase()).join("") || "?";

    }

    translateCaseStatus(s) {

        return { Open:"Aberto", Investigation:"Em investigação",
                 Paused:"Pausado", Draft:"Rascunho", Solved:"Resolvido",
                 Archived:"Arquivado", Cancelled:"Cancelado",
                 not_started:"Nao iniciado", in_progress:"Em andamento",
                 complete:"Completo" }[s] || s;

    }

    esc(v) {

        return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

    }

    // ==================================================
    // FECHA
    // ==================================================

    async close(){}

}

export default new Dashboard();
