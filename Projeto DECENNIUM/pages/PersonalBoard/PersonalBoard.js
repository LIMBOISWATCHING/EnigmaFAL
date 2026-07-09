import MC from "../../js/engine/Core.js";

const BOARD_WIDTH = 10800;
const BOARD_HEIGHT = 7200;

class PersonalBoard {

    constructor() {
        this.container = null;
        this.board = null;
        this.pendingLinkId = null;
        this.addLineMode = false;
        this.deleteLineMode = false;
        this.drag = null;
        this.resize = null;
        this.pan = null;
        this.wheelTimer = null;
        this.adminUsers = [];
        this.selectedBoardUserId = null;
    }

    async open(container) {
        this.container = container;
        MC.Layout.show();
        MC.Layout.setUser(MC.Auth.current());
        MC.Menu.unlock();
        this.container.innerHTML = await MC.Loader.html("pages/PersonalBoard/PersonalBoard.html");
        await this.loadAdminUsers();
        this.loadBoard();
        await this.hydrateLinkedBooks();
        this.bindEvents();
        this.renderAdminSwitcher();
        this.renderBoard();
    }

    async close() {
        this.saveBoard();
        return true;
    }

    bindEvents() {
        this.byId("personal-board-add-note")?.addEventListener("click", () => this.addItem("note"));
        this.byId("personal-board-add-page")?.addEventListener("click", () => this.addItem("page"));
        this.byId("personal-board-add-dossier")?.addEventListener("click", () => this.addItem("dossier"));
        this.byId("personal-board-add-photo")?.addEventListener("click", () => this.addItem("photo"));
        this.byId("personal-board-add-audio")?.addEventListener("click", () => this.addItem("audio"));
        this.byId("personal-board-add-case")?.addEventListener("click", () => this.addItem("case"));
        this.byId("personal-board-add-book")?.addEventListener("click", () => this.addItem("book"));
        this.byId("personal-board-add-line")?.addEventListener("click", () => {
            this.addLineMode = !this.addLineMode;
            this.pendingLinkId = null;
            this.deleteLineMode = false;
            this.byId("personal-board-add-line")?.classList.toggle("active", this.addLineMode);
            this.byId("personal-board-delete-line")?.classList.remove("active");
            this.renderBoard();
        });
        this.byId("personal-board-delete-line")?.addEventListener("click", () => {
            this.pendingLinkId = null;
            this.addLineMode = false;
            this.deleteLineMode = !this.deleteLineMode;
            this.byId("personal-board-add-line")?.classList.remove("active");
            this.byId("personal-board-delete-line")?.classList.toggle("active", this.deleteLineMode);
            this.renderBoard();
        });
        this.byId("personal-board-fullscreen")?.addEventListener("click", () => this.toggleBoardFullscreen());
        this.byId("personal-board-admin-user")?.addEventListener("change", async event => {
            this.saveBoard();
            this.selectedBoardUserId = event.target.value || this.currentUserId();
            localStorage.setItem("mc-personal-board-admin-target", this.selectedBoardUserId);
            this.loadBoard();
            await this.hydrateLinkedBooks();
            this.renderBoard();
        });
        this.byId("personal-board-zoom-toggle")?.addEventListener("click", () => {
            this.byId("personal-board-zoom-controls")?.classList.toggle("case-hidden");
        });
        this.byId("personal-board-zoom")?.addEventListener("input", event => {
            this.board.view.zoom = this.clamp(Number(event.target.value) / 100, .03, 6);
            this.applyTransform();
            this.updateZoomLabel();
            clearTimeout(this.wheelTimer);
            this.wheelTimer = setTimeout(() => this.saveBoard(), 180);
        });
        this.byId("personal-board-viewport")?.addEventListener("pointerdown", event => this.startPan(event));
        this.byId("personal-board-viewport")?.addEventListener("wheel", event => this.handleWheel(event), { passive:false });
        this.byId("personal-board-zoom-close")?.addEventListener("click", () => this.closeZoom());
        document.addEventListener("keydown", event => {
            if (event.key === "Escape") this.setBoardFullscreen(false);
        });
    }

    storageKey() {
        return `mc-personal-board:${this.boardOwnerId()}`;
    }

    currentUserId() {
        const user = MC.Auth.current() || MC.State.get("user");
        return user?.id || "anon";
    }

    boardOwnerId() {
        if (MC.Services.Permissions.isAdmin()) {
            return this.selectedBoardUserId || this.currentUserId();
        }

        return this.currentUserId();
    }

    async loadAdminUsers() {
        if (!MC.Services.Permissions.isAdmin()) {
            this.adminUsers = [];
            this.selectedBoardUserId = this.currentUserId();
            return;
        }

        try {
            this.adminUsers = await MC.Services.Users.findAll();
        } catch {
            this.adminUsers = [MC.Auth.current()].filter(Boolean);
        }

        const currentId = this.currentUserId();
        const savedId = localStorage.getItem("mc-personal-board-admin-target");
        const userIds = this.adminUsers.map(user => user.id);
        this.selectedBoardUserId = userIds.includes(savedId) ? savedId : currentId;
    }

    renderAdminSwitcher() {
        const wrap = this.byId("personal-board-admin-wrap");
        const select = this.byId("personal-board-admin-user");

        if (!wrap || !select) return;

        if (!MC.Services.Permissions.isAdmin()) {
            wrap.classList.add("case-hidden");
            return;
        }

        wrap.classList.remove("case-hidden");
        select.innerHTML = this.adminUsers
            .map(user => `<option value="${this.esc(user.id)}"${user.id === this.boardOwnerId() ? " selected" : ""}>${this.esc(user.name || user.username || user.id)}</option>`)
            .join("");
    }

    loadBoard() {
        try {
            this.board = JSON.parse(localStorage.getItem(this.storageKey()) || "null");
        } catch {
            this.board = null;
        }
        this.board = this.board || { view:{ x:-900, y:-520, zoom:.65 }, items:[], links:[] };
        this.board.view = this.board.view || { x:-900, y:-520, zoom:.65 };
        this.board.view.zoom = this.clamp(this.board.view.zoom || .65, .03, 6);
        this.board.items = this.board.items || [];
        this.board.links = this.board.links || [];
    }

    saveBoard() {
        localStorage.setItem(this.storageKey(), JSON.stringify(this.board));
    }

    async hydrateLinkedBooks() {
        const books = this.board.items.filter(item => item.kind === "book");
        if (!books.length) return;
        let changed = false;

        for (const item of books) {
            if (item.refId && item.coverColor && item.coverBorderColor && item.seal) continue;
            const query = String(item.refId || item.title || "").trim();
            if (!query) continue;
            const linked = await this.resolveLinkedItem("book", {
                title: query,
                text: item.text || "",
                url: item.url || ""
            });
            if (!linked.refId) continue;
            item.refId = linked.refId;
            item.title = linked.title;
            item.text = linked.text;
            item.coverColor = linked.coverColor;
            item.coverBorderColor = linked.coverBorderColor;
            item.seal = linked.seal;
            changed = true;
        }

        if (changed) this.saveBoard();
    }

    async addItem(kind) {
        const data = await this.openItemForm(kind);
        if (!data) return;
        const size = this.defaultSize(kind);
        const linked = await this.resolveLinkedItem(kind, data);
        this.board.items.push({
            id: this.localId("PBD"),
            kind,
            refId: linked.refId,
            title: linked.title,
            text: linked.text,
            url: linked.url,
            coverColor: linked.coverColor,
            coverBorderColor: linked.coverBorderColor,
            seal: linked.seal,
            x: 1500 + Math.random() * 360,
            y: 900 + Math.random() * 260,
            width: size.width,
            height: size.height,
            rotation: 0,
            highlighted: false
        });
        this.saveBoard();
        this.renderBoard();
    }

    async resolveLinkedItem(kind, data) {
        if (kind === "case") {
            try {
                const query = data.title.trim();
                let caseFile = await MC.Services.Cases.findById(query);
                if (!caseFile) {
                    const cases = await MC.Services.Cases.findAll();
                    caseFile = cases.find(entry =>
                        String(entry.name || "").trim().toLowerCase() === query.toLowerCase() ||
                        String(entry.code || "").trim().toLowerCase() === query.toLowerCase() ||
                        String(entry.id || "").trim().toLowerCase() === query.toLowerCase()
                    );
                }
                if (caseFile) {
                    return {
                        ...data,
                        refId: caseFile.id,
                        title: caseFile.name || caseFile.code || data.title,
                        text: [caseFile.code, caseFile.status, caseFile.location].filter(Boolean).join(" | "),
                        url: (caseFile.photos || [])[0]?.url || ""
                    };
                }
            } catch {}
            return { ...data, text: "" };
        }
        if (kind === "book") {
            try {
                const query = data.title.trim();
                let book = await MC.Services.Library.findBook(query);
                if (!book) {
                    const books = await MC.Services.Library.findBooks("");
                    book = books.find(entry =>
                        String(entry.title || "").trim().toLowerCase() === query.toLowerCase() ||
                        String(entry.id || "").trim().toLowerCase() === query.toLowerCase()
                    );
                }
                if (book) {
                    return {
                        ...data,
                        refId: book.id,
                        title: book.title || data.title,
                        text: `Autor: ${book.ownerName || "Anonimo"}`,
                        coverColor: book.coverColor || "#17100c",
                        coverBorderColor: book.coverBorderColor || "#2d2118",
                        seal: book.seal || "incompleto"
                    };
                }
            } catch {}
            return { ...data, text: "" };
        }
        return data;
    }

    openItemForm(kind, item = {}) {
        return new Promise(resolve => {
            const overlay = document.createElement("div");
            overlay.className = "case-edit-modal personal-board-form-modal";
            overlay.innerHTML = `
                <div class="case-edit-dialog personal-board-form ${this.esc(kind)}">
                    <h3>${this.esc(this.kindLabel(kind))}</h3>
                    <input class="case-input" data-key="title" type="text" placeholder="${this.esc(this.titlePrompt(kind).replace(":", ""))}" value="${this.esc(item.title || "")}">
                    ${["photo", "audio", "dossier"].includes(kind) ? `<input class="case-input" data-key="url" type="text" placeholder="${this.esc(this.urlLabel(kind))}" value="${this.esc(item.url || "")}">` : ""}
                    ${["book", "case"].includes(kind) ? `<p class="personal-board-form-hint">Informe o ID ou nome exato para vincular ao registro existente.</p>` : `<textarea class="case-textarea" data-key="text" rows="6" placeholder="${this.esc(this.textLabel(kind))}">${this.esc(item.text || "")}</textarea>`}
                    <div class="case-edit-actions">
                        <button class="case-edit-cancel case-btn" type="button">Cancelar</button>
                        <button class="case-edit-save case-btn-primary" type="button">Salvar</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            const close = value => {
                overlay.remove();
                resolve(value);
            };
            overlay.querySelector(".case-edit-cancel")?.addEventListener("click", () => close(null));
            overlay.querySelector(".case-edit-save")?.addEventListener("click", () => {
                const data = {};
                overlay.querySelectorAll("[data-key]").forEach(input => {
                    data[input.dataset.key] = input.value || "";
                });
                if (!data.title) return;
                close({ title: data.title, text: data.text || "", url: data.url || "" });
            });
            overlay.addEventListener("click", event => {
                if (event.target === overlay) close(null);
            });
            overlay.querySelector("[data-key]")?.focus();
        });
    }

    titlePrompt(kind) {
        return {
            note: "Titulo da nota:",
            page: "Nome interno da pagina:",
            dossier: "Nomenclatura da ficha:",
            photo: "Titulo da foto:",
            audio: "Titulo do audio:",
            case: "Nome ou ID do caso:",
            book: "Nome ou ID do livro:"
        }[kind] || "Titulo:";
    }

    textLabel(kind) {
        return {
            note: "Texto da nota:",
            page: "Texto da pagina:",
            dossier: "Descricao da ficha:",
            photo: "Descricao curta:",
            audio: "Descricao curta:",
            case: "Descricao curta:",
            book: "Descricao curta:"
        }[kind] || "Texto:";
    }

    async textPrompt(kind) {
        return await MC.UI.prompt(this.textLabel(kind), "");
    }

    urlLabel(kind) {
        return {
            photo: "URL da foto:",
            audio: "URL do audio:",
            dossier: "URL da foto da ficha:"
        }[kind] || "";
    }

    async urlPrompt(kind) {
        if (!["photo", "audio", "dossier"].includes(kind)) return "";
        return await MC.UI.prompt(this.urlLabel(kind), "");
    }

    defaultSize(kind) {
        return {
            note: { width: 180, height: 130 },
            page: { width: 230, height: 190 },
            dossier: { width: 260, height: 170 },
            photo: { width: 190, height: 150 },
            audio: { width: 220, height: 124 },
            case: { width: 260, height: 150 },
            book: { width: 285, height: 300 }
        }[kind] || { width: 190, height: 120 };
    }

    renderBoard() {
        const items = this.byId("personal-board-items");
        const lines = this.byId("personal-board-lines");
        if (!items || !lines) return;
        items.innerHTML = this.board.items.map(item => `
            <div class="case-board-item ${this.esc(item.kind)} ${this.addLineMode ? "line-mode" : ""} ${item.highlighted ? "highlighted" : ""} ${item.id === this.pendingLinkId ? "linking" : ""}"
                 data-id="${this.esc(item.id)}"
                 style="left:${Number(item.x) || 1200}px;top:${Number(item.y) || 900}px;width:${Number(item.width) || 180}px;min-height:${Number(item.height) || 120}px;--board-item-rotation:${Number(item.rotation) || 0}deg">
                <div class="case-board-grip" data-id="${this.esc(item.id)}"></div>
                <div class="case-board-menu">
                    <button class="case-board-size-down" data-id="${this.esc(item.id)}" type="button">-</button>
                    <button class="case-board-size-up" data-id="${this.esc(item.id)}" type="button">+</button>
                    <button class="case-board-rotate-left" data-id="${this.esc(item.id)}" type="button">L</button>
                    <button class="case-board-rotate-right" data-id="${this.esc(item.id)}" type="button">R</button>
                    <button class="case-board-highlight" data-id="${this.esc(item.id)}" type="button">Marca</button>
                    <button class="case-board-edit" data-id="${this.esc(item.id)}" type="button">Editar</button>
                    <button class="case-board-link" data-id="${this.esc(item.id)}" type="button">Linha</button>
                    <button class="case-board-delete" data-id="${this.esc(item.id)}" type="button">X</button>
                </div>
                ${this.renderBoardContent(item)}
                <div class="case-board-resize" data-id="${this.esc(item.id)}"></div>
            </div>
        `).join("");

        items.querySelectorAll(".case-board-item").forEach(el => {
            el.addEventListener("click", event => {
                if (!this.addLineMode || event.target.closest(".case-board-menu, .case-board-resize, audio, button")) return;
                event.preventDefault();
                event.stopPropagation();
                this.linkItem(el.dataset.id, { keepMode: true });
            });
            el.addEventListener("dblclick", event => {
                if (this.addLineMode) return;
                event.stopPropagation();
                this.zoomItem(el.dataset.id);
            });
        });
        items.querySelectorAll(".case-board-grip").forEach(el => el.addEventListener("pointerdown", event => this.startDrag(event, el.dataset.id)));
        items.querySelectorAll(".case-board-resize").forEach(el => el.addEventListener("pointerdown", event => this.startResize(event, el.dataset.id)));
        items.querySelectorAll(".case-board-link").forEach(el => el.addEventListener("click", event => {
            event.stopPropagation();
            this.addLineMode = true;
            this.byId("personal-board-add-line")?.classList.add("active");
            this.linkItem(el.dataset.id, { keepMode: true });
        }));
        items.querySelectorAll(".case-board-delete").forEach(el => el.addEventListener("click", event => { event.stopPropagation(); this.deleteItem(el.dataset.id); }));
        items.querySelectorAll(".case-board-edit").forEach(el => el.addEventListener("click", event => { event.stopPropagation(); this.editItem(el.dataset.id); }));
        items.querySelectorAll(".case-board-highlight").forEach(el => el.addEventListener("click", event => { event.stopPropagation(); this.toggleHighlight(el.dataset.id); }));
        items.querySelectorAll(".case-board-rotate-left, .case-board-rotate-right").forEach(el => el.addEventListener("click", event => { event.stopPropagation(); this.rotateItem(el.dataset.id, el.classList.contains("case-board-rotate-left") ? -8 : 8); }));
        items.querySelectorAll(".case-board-size-up, .case-board-size-down").forEach(el => el.addEventListener("click", event => { event.stopPropagation(); this.resizeItem(el.dataset.id, el.classList.contains("case-board-size-up") ? 24 : -24); }));

        this.updateZoomLabel();
        this.applyTransform();
        this.renderLines();
    }

    toggleBoardFullscreen() {
        this.setBoardFullscreen(!this.byId("personal-board-area")?.classList.contains("fullscreen"));
    }

    setBoardFullscreen(enabled) {
        const area = this.byId("personal-board-area");
        const button = this.byId("personal-board-fullscreen");
        if (!area) return;
        area.classList.toggle("fullscreen", Boolean(enabled));
        button?.classList.toggle("active", Boolean(enabled));
        if (button) button.textContent = enabled ? "Sair da tela cheia" : "Tela cheia";
        document.body.classList.toggle("case-board-fullscreen-open", Boolean(enabled));
        requestAnimationFrame(() => this.applyTransform());
    }

    async renderLines() {
        const svg = this.byId("personal-board-lines");
        if (!svg) return;
        svg.setAttribute("viewBox", `0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`);
        svg.innerHTML = this.board.links.map(link => {
            const from = this.center(link.from);
            const to = this.center(link.to);
            if (!from || !to) return "";
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const angle = this.lineLabelAngle(from, to);
            return `<g class="case-board-line-group" data-id="${this.esc(link.id)}">
                <line class="case-board-line-hit" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>
                <line class="case-board-line-visual" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" style="stroke:${this.esc(link.color || "#a30e0e")}"></line>
                <g class="case-board-line-ui" transform="translate(${midX} ${midY}) rotate(${angle})">
                    <rect class="case-board-line-ui-hit" x="-104" y="-42" width="208" height="78"></rect>
                    ${link.label ? `<g class="case-board-line-label" transform="translate(0 -24)"><rect x="-90" y="-15" width="180" height="30"></rect><text text-anchor="middle" dominant-baseline="middle">${this.esc(link.label)}</text></g>` : ""}
                    <g class="case-board-line-palette" transform="translate(-70 16)">
                        ${this.lineColors().map((entry, index) => `<circle class="case-board-line-color" data-color="${entry}" cx="${index * 28}" cy="0" r="8" style="fill:${entry}"></circle>`).join("")}
                    </g>
                </g>
            </g>`;
        }).join("");
        svg.querySelectorAll(".case-board-line-group").forEach(group => {
            group.addEventListener("pointerdown", event => {
                event.preventDefault();
                event.stopPropagation();
            });
            group.addEventListener("click", async event => {
                event.preventDefault();
                event.stopPropagation();
                if (this.deleteLineMode) {
                    await this.deleteLine(group.dataset.id);
                }
            });
            group.addEventListener("dblclick", async event => {
                event.preventDefault();
                event.stopPropagation();
                const line = this.board.links.find(link => link.id === group.dataset.id);
                if (!line) return;
                const label = await MC.UI.prompt("Texto da linha:", line.label || "");
                if (label === null) return;
                line.label = label;
                this.saveBoard();
                this.renderBoard();
            });
        });
        svg.querySelectorAll(".case-board-line-color").forEach(button => {
            button.addEventListener("pointerdown", event => {
                event.preventDefault();
                event.stopPropagation();
            });
            button.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                this.changeLineColor(button.closest(".case-board-line-group")?.dataset.id, button.dataset.color);
            });
        });
    }

    lineColors() {
        return ["#a30e0e", "#16d96d", "#d9c74a", "#5aa7ff", "#e86cff"];
    }

    lineLabelAngle(from, to) {
        let angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
        if (angle > 90 || angle < -90) angle += 180;
        return Number(angle.toFixed(2));
    }

    changeLineColor(id, color) {
        const line = this.board.links.find(link => link.id === id);
        if (!line || !color) return;
        line.color = color;
        this.saveBoard();
        this.renderBoard();
    }

    renderBoardContent(item) {
        if (item.kind === "page") {
            return `<div class="case-board-page-sheet"><p class="case-board-page-text">${this.esc(item.text || item.title || "")}</p></div>`;
        }
        if (item.kind === "photo") {
            const url = this.imageUrl(item);
            return url
                ? `<img src="${this.esc(url)}" alt=""><strong>${this.esc(item.title || "Foto")}</strong>`
                : `<strong>${this.esc(item.title || "Foto")}</strong><p>${this.esc(item.text || "")}</p>`;
        }
        if (item.kind === "dossier") {
            return `<article class="case-board-dossier">
                <div class="case-board-dossier-photo">${this.isImg(item.url) ? `<img src="${this.esc(item.url)}" alt="">` : `<span>SEM FOTO</span>`}</div>
                <div class="case-board-dossier-head">
                    <span>FICHA INVESTIGATIVA</span>
                    <strong>${this.esc(item.title || "Ficha")}</strong>
                </div>
                <p class="case-board-dossier-desc">${this.esc(item.text || "")}</p>
            </article>`;
        }
        if (item.kind === "audio") {
            return `<article class="case-board-tape">
                <div class="case-board-tape-head"><span>REC</span><strong>${this.esc(item.title || "Audio")}</strong></div>
                <div class="case-board-tape-body">
                    <span class="case-tape-reel"></span>
                    <span class="case-tape-window"></span>
                    <span class="case-tape-reel"></span>
                </div>
                <audio controls src="${this.esc(item.url || "")}"></audio>
            </article>`;
        }
        if (item.kind === "case") {
            return `<article class="personal-case-link">
                <span>ARQUIVO DE CASO</span>
                <strong>${this.esc(item.title || "Caso")}</strong>
                <p>${this.esc(item.text || "")}</p>
            </article>`;
        }
        if (item.kind === "book") {
            const coverColor = item.coverColor || "#17100c";
            const coverBorderColor = item.coverBorderColor || "#2d2118";
            return `<article class="library-book-card personal-book-link" style="--library-cover-color:${this.esc(coverColor)};--library-cover-border:${this.esc(coverBorderColor)};">
                <div class="library-card-top">
                    <span class="library-seal">${this.esc(item.seal || "incompleto")}</span>
                    <strong>${this.esc(item.refId || "BOK")}</strong>
                </div>
                <h3>${this.esc(item.title || "Livro")}</h3>
                ${item.text ? `<p>${this.esc(item.text)}</p>` : ""}
            </article>`;
        }
        return `<strong>${this.esc(item.title || "Nota")}</strong><p>${this.esc(item.text || "")}</p>`;
    }

    async linkItem(id, options = {}) {
        if (!this.pendingLinkId) {
            this.pendingLinkId = id;
            this.addLineMode = true;
            this.deleteLineMode = false;
            this.byId("personal-board-add-line")?.classList.add("active");
            this.byId("personal-board-delete-line")?.classList.remove("active");
            this.renderBoard();
            return;
        }
        if (this.pendingLinkId !== id) {
            this.board.links.push({
                id:this.localId("LNK"),
                from:this.pendingLinkId,
                to:id,
                color:this.byId("personal-board-line-color")?.value || "#a30e0e",
                label:await MC.UI.prompt("Texto da linha:", "") || ""
            });
        }
        this.pendingLinkId = options.keepMode ? id : null;
        this.saveBoard();
        this.renderBoard();
    }

    async editItem(id) {
        const item = this.board.items.find(entry => entry.id === id);
        if (!item) return;
        const data = await this.openItemForm(item.kind, item);
        if (!data) return;
        item.title = data.title;
        item.text = data.text;
        item.url = data.url;
        this.saveBoard();
        this.renderBoard();
    }

    zoomItem(id) {
        const item = this.board.items.find(entry => entry.id === id);
        const zoom = this.byId("personal-board-zoom-overlay");
        const content = this.byId("personal-board-zoom-content");
        if (!item || !zoom || !content) return;
        content.innerHTML = this.renderZoomContent(item);
        zoom.classList.remove("case-hidden");
    }

    closeZoom() {
        this.byId("personal-board-zoom-overlay")?.classList.add("case-hidden");
    }

    renderZoomContent(item) {
        if (item.kind === "note") {
            return `<article class="case-zoom-note"><strong>${this.esc(item.title || "Nota")}</strong><p>${this.esc(item.text || "")}</p></article>`;
        }
        if (item.kind === "page" || item.kind === "book") {
            return `<article class="case-zoom-page"><p>${this.esc(item.kind === "book" ? `${item.title || "Livro"}\n\n${item.text || ""}` : item.text || item.title || "")}</p></article>`;
        }
        if (item.kind === "dossier" || item.kind === "case") {
            return `<article class="case-zoom-dossier case-zoom-investigation-file">
                <div class="case-zoom-dossier-photo">${this.isImg(item.url) ? `<img src="${this.esc(item.url)}" alt="">` : `<span>${this.esc(item.kind === "case" ? "CASO" : "SEM FOTO")}</span>`}</div>
                <div class="case-zoom-dossier-head">
                    <span>${this.esc(item.kind === "case" ? "Arquivo vinculado" : "Ficha investigativa")}</span>
                    <strong>${this.esc(item.title || "Ficha")}</strong>
                </div>
                <p class="case-zoom-dossier-desc">${this.esc(item.text || "")}</p>
            </article>`;
        }
        if (item.kind === "photo" && this.imageUrl(item)) {
            const url = this.imageUrl(item);
            return `<img src="${this.esc(url)}" alt="${this.esc(item.title || "")}"><strong>${this.esc(item.title || "")}</strong>`;
        }
        if (item.kind === "audio") {
            return `<article class="case-board-tape case-zoom-tape">
                <div class="case-board-tape-head"><span>PLAY</span><strong>${this.esc(item.title || "Audio")}</strong></div>
                <div class="case-board-tape-body">
                    <span class="case-tape-reel"></span>
                    <span class="case-tape-window"></span>
                    <span class="case-tape-reel"></span>
                </div>
                <audio controls autoplay src="${this.esc(item.url || "")}"></audio>
            </article>`;
        }
        return `<strong>${this.esc(item.title || "Item")}</strong><p>${this.esc(item.text || "")}</p>`;
    }

    async deleteItem(id) {
        if (!await MC.UI.confirm("Remover este item?")) return;
        this.board.items = this.board.items.filter(item => item.id !== id);
        this.board.links = this.board.links.filter(link => link.from !== id && link.to !== id);
        this.saveBoard();
        this.renderBoard();
    }

    async deleteLine(id) {
        if (!await MC.UI.confirm("Remover esta linha?")) return;
        this.board.links = this.board.links.filter(link => link.id !== id);
        this.deleteLineMode = false;
        this.addLineMode = false;
        this.pendingLinkId = null;
        this.byId("personal-board-add-line")?.classList.remove("active");
        this.saveBoard();
        this.renderBoard();
    }

    startDrag(event, id) {
        event.stopPropagation();
        const item = this.board.items.find(entry => entry.id === id);
        if (!item) return;
        this.drag = { id, x:event.clientX, y:event.clientY, itemX:item.x, itemY:item.y, zoom:this.board.view.zoom || 1 };
        window.addEventListener("pointermove", this.dragMove);
        window.addEventListener("pointerup", this.dragEnd, { once:true });
    }

    dragMove = event => {
        const item = this.board.items.find(entry => entry.id === this.drag?.id);
        if (!item) return;
        item.x = this.clamp(this.drag.itemX + (event.clientX - this.drag.x) / this.drag.zoom, 0, BOARD_WIDTH - item.width);
        item.y = this.clamp(this.drag.itemY + (event.clientY - this.drag.y) / this.drag.zoom, 0, BOARD_HEIGHT - item.height);
        this.renderBoard();
    };

    dragEnd = () => {
        window.removeEventListener("pointermove", this.dragMove);
        this.drag = null;
        this.saveBoard();
    };

    startResize(event, id) {
        event.stopPropagation();
        const item = this.board.items.find(entry => entry.id === id);
        if (!item) return;
        this.resize = { id, x:event.clientX, y:event.clientY, width:item.width, height:item.height, zoom:this.board.view.zoom || 1 };
        window.addEventListener("pointermove", this.resizeMove);
        window.addEventListener("pointerup", this.resizeEnd, { once:true });
    }

    resizeMove = event => {
        const item = this.board.items.find(entry => entry.id === this.resize?.id);
        if (!item) return;
        item.width = this.clamp(this.resize.width + (event.clientX - this.resize.x) / this.resize.zoom, 90, 620);
        item.height = this.clamp(this.resize.height + (event.clientY - this.resize.y) / this.resize.zoom, 70, 520);
        this.renderBoard();
    };

    resizeEnd = () => {
        window.removeEventListener("pointermove", this.resizeMove);
        this.resize = null;
        this.saveBoard();
    };

    startPan(event) {
        if (event.target.closest(".case-board-item") || event.target.closest(".case-board-zoom-panel")) return;
        this.pan = { x:event.clientX, y:event.clientY, viewX:this.board.view.x, viewY:this.board.view.y };
        window.addEventListener("pointermove", this.panMove);
        window.addEventListener("pointerup", this.panEnd, { once:true });
    }

    panMove = event => {
        this.board.view.x = this.pan.viewX + event.clientX - this.pan.x;
        this.board.view.y = this.pan.viewY + event.clientY - this.pan.y;
        this.applyTransform();
    };

    panEnd = () => {
        window.removeEventListener("pointermove", this.panMove);
        this.pan = null;
        this.saveBoard();
    };

    handleWheel(event) {
        event.preventDefault();
        const rect = this.byId("personal-board-viewport").getBoundingClientRect();
        const oldZoom = this.clamp(this.board.view.zoom || .65, .03, 6);
        const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
        const wheelStrength = this.clamp(-delta / 220, -2.5, 2.5);
        const nextZoom = this.clamp(oldZoom * Math.pow(1.22, wheelStrength), .03, 6);
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;
        const worldX = (cursorX - this.board.view.x) / oldZoom;
        const worldY = (cursorY - this.board.view.y) / oldZoom;
        this.board.view.zoom = nextZoom;
        this.board.view.x = cursorX - worldX * nextZoom;
        this.board.view.y = cursorY - worldY * nextZoom;
        this.applyTransform();
        this.updateZoomLabel();
        clearTimeout(this.wheelTimer);
        this.wheelTimer = setTimeout(() => this.saveBoard(), 240);
    }

    applyTransform() {
        const world = this.byId("personal-board-world");
        if (world) world.style.transform = `translate(${this.board.view.x}px, ${this.board.view.y}px) scale(${this.board.view.zoom})`;
    }

    updateZoomLabel() {
        const value = Math.round((this.board.view.zoom || .65) * 100);
        this.byId("personal-board-zoom-label").textContent = `${value}%`;
        this.byId("personal-board-zoom").value = String(value);
    }

    center(id) {
        const item = this.board.items.find(entry => entry.id === id);
        return item ? { x:item.x + item.width / 2, y:item.y + item.height / 2 } : null;
    }

    resizeItem(id, amount) {
        const item = this.board.items.find(entry => entry.id === id);
        if (!item) return;
        item.width = this.clamp(item.width + amount, 90, 620);
        item.height = this.clamp(item.height + amount, 70, 520);
        this.saveBoard();
        this.renderBoard();
    }

    rotateItem(id, amount) {
        const item = this.board.items.find(entry => entry.id === id);
        if (item) item.rotation = (item.rotation || 0) + amount;
        this.saveBoard();
        this.renderBoard();
    }

    toggleHighlight(id) {
        const item = this.board.items.find(entry => entry.id === id);
        if (item) item.highlighted = !item.highlighted;
        this.saveBoard();
        this.renderBoard();
    }

    kindLabel(kind) {
        return {
            note:"Nota",
            page:"Pagina",
            dossier:"Ficha",
            photo:"Foto",
            audio:"Audio",
            case:"Caso",
            book:"Livro"
        }[kind] || "Item";
    }

    isImg(value) {
        const url = String(value || "").trim();
        return typeof value === "string" && (
            url.startsWith("http") ||
            url.startsWith("/") ||
            url.startsWith("assets/") ||
            url.startsWith("data:image")
        );
    }

    imageUrl(item) {
        const candidates = [item?.url, item?.text, item?.photo].map(value => String(value || "").trim());
        return candidates.find(value => this.isImg(value)) || "";
    }

    localId(prefix) {
        return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    }

    byId(id) {
        return document.getElementById(id);
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, Number(value) || 0));
    }

    esc(value) {
        return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

}

export default new PersonalBoard();
