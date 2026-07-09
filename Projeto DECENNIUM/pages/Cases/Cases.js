import MC from "../../js/engine/Core.js";

const STATUS_LABELS = {
    not_started: "Nao iniciado",
    in_progress: "Em andamento",
    complete: "Completo",
    Open: "Aberto",
    Investigation: "Em andamento",
    Paused: "Pausado",
    Solved: "Completo",
    Draft: "Nao iniciado"
};

const BOARD_WIDTH = 10800;
const BOARD_HEIGHT = 7200;

class Cases {

    constructor() {
        this.container = null;
        this.cases = [];
        this.current = null;
        this.search = "";
        this.dirty = false;
        this.pendingLinkId = null;
        this.addLineMode = false;
        this.deleteLineMode = false;
        this.drag = null;
        this.pan = null;
        this.resize = null;
        this.boardWheelTimer = null;
    }

    async open(container) {
        this.container = container;
        MC.Layout.show();
        MC.Layout.setUser(MC.Auth.current());
        MC.Menu.unlock();
        this.container.innerHTML = await MC.Loader.html("pages/Cases/Cases.html");
        this.bindEvents();
        await this.loadCases();
    }

    async close() {
        if (!this.dirty) return true;
        return await MC.UI.confirm("Existem informacoes nao salvas neste caso. Sair sem salvar?");
    }

    bindEvents() {
        this.byId("case-new-toggle")?.addEventListener("click", () => {
            this.byId("case-create-form")?.classList.toggle("case-hidden");
        });
        this.byId("case-create-btn")?.addEventListener("click", () => this.createCase());
        this.byId("case-search")?.addEventListener("input", event => {
            this.search = String(event.target.value || "").trim().toLowerCase();
            this.renderCases();
        });
        this.byId("case-back-list")?.addEventListener("click", () => this.backToList());
        this.byId("case-save-main")?.addEventListener("click", () => this.saveCurrent());
        this.byId("case-archive-main")?.addEventListener("click", () => this.archiveCurrent());
        this.byId("case-file-status")?.addEventListener("change", event => {
            if (!this.current) return;
            this.current.status = event.target.value;
            this.markDirty();
            this.refreshHeader();
        });

        [
            "case-edit-name",
            "case-edit-location",
            "case-edit-objective",
            "case-edit-password",
            "case-edit-description"
        ].forEach(id => this.byId(id)?.addEventListener("input", () => this.markDirty()));

        this.byId("case-photo-toggle")?.addEventListener("click", () => {
            this.byId("case-photo-form")?.classList.toggle("case-hidden");
        });
        this.byId("case-add-photo")?.addEventListener("click", () => this.addPhoto());
        this.byId("case-add-note")?.addEventListener("click", () => this.addNote());
        this.byId("case-add-page")?.addEventListener("click", () => this.addPage());
        this.byId("case-add-audio")?.addEventListener("click", () => this.addAudio());
        this.byId("case-add-dossier")?.addEventListener("click", () => this.addDossier());
        this.byId("case-board-quick-note")?.addEventListener("click", () => this.addQuickBoardNote());
        this.byId("case-board-add-line")?.addEventListener("click", () => {
            this.addLineMode = !this.addLineMode;
            this.pendingLinkId = null;
            this.deleteLineMode = false;
            this.byId("case-board-add-line")?.classList.toggle("active", this.addLineMode);
            this.byId("case-board-delete-line")?.classList.remove("active");
            this.renderBoard();
        });
        this.byId("case-board-delete-line")?.addEventListener("click", () => {
            this.pendingLinkId = null;
            this.addLineMode = false;
            this.deleteLineMode = !this.deleteLineMode;
            this.byId("case-board-add-line")?.classList.remove("active");
            this.byId("case-board-delete-line")?.classList.toggle("active", this.deleteLineMode);
            this.renderBoard();
        });
        this.byId("case-board-fullscreen")?.addEventListener("click", () => this.toggleBoardFullscreen());
        this.byId("case-board-zoom-toggle")?.addEventListener("click", () => {
            this.byId("case-board-zoom-controls")?.classList.toggle("case-hidden");
        });
        this.byId("case-board-zoom")?.addEventListener("input", event => {
            if (!this.current?.board?.view) return;
            this.current.board.view.zoom = this.clamp(Number(event.target.value) / 100, 0.03, 6);
            this.applyBoardTransform();
            this.updateZoomLabel();
            this.markDirty();
        });
        this.byId("case-board-zoom")?.addEventListener("change", () => this.quickSave());
        this.byId("case-board-viewport")?.addEventListener("pointerdown", event => this.startPan(event));
        this.byId("case-board-viewport")?.addEventListener("wheel", event => this.handleBoardWheel(event), { passive: false });
        this.byId("case-zoom-close")?.addEventListener("click", () => this.closeZoom());
        document.addEventListener("keydown", event => {
            if (event.key === "Escape") this.setBoardFullscreen(false);
        });
    }

    async loadCases() {
        const grid = this.byId("cases-grid");
        if (grid) grid.innerHTML = `<p class="case-empty">Carregando casos...</p>`;
        try { this.cases = await MC.Services.Cases.findAll(); }
        catch { this.cases = []; }
        this.renderCases();
    }

    renderCases() {
        const grid = this.byId("cases-grid");
        if (!grid) return;
        const cases = this.cases.filter(caseFile => {
            if (!this.search) return true;
            return [
                caseFile.name,
                caseFile.code,
                caseFile.location,
                caseFile.objective
            ].join(" ").toLowerCase().includes(this.search);
        });

        if (!cases.length) {
            grid.innerHTML = `<p class="case-empty">Nenhum caso encontrado.</p>`;
            return;
        }

        grid.innerHTML = cases.map(caseFile => `
            <article class="case-card">
                <div class="case-card-tab">${this.esc(caseFile.code || caseFile.id || "CASO")}</div>
                <div class="case-card-cover">
                    ${this.renderCover(caseFile)}
                </div>
                <div class="case-card-body">
                    <div class="case-card-title-row">
                        <strong>${this.esc(caseFile.name || "Caso sem nome")}</strong>
                        <span>${caseFile.password ? "LOCK" : "OPEN"}</span>
                    </div>
                    <p class="case-card-objective">${this.esc(caseFile.objective || "Objetivo nao informado.")}</p>
                    <p class="case-card-description">${this.esc(caseFile.description || "Sem descricao extra registrada.")}</p>
                    <div class="case-card-meta">
                        <span>Status: ${this.esc(STATUS_LABELS[caseFile.status] || caseFile.status || "---")}</span>
                        <span>Local: ${this.esc(caseFile.location || "---")}</span>
                        <span>Fotos: ${(caseFile.photos || []).length}</span>
                    </div>
                    <button class="case-open-btn" data-id="${this.esc(caseFile.id)}" type="button">Abrir arquivo</button>
                </div>
            </article>
        `).join("");

        grid.querySelectorAll(".case-open-btn").forEach(button => {
            button.addEventListener("click", async event => {
                event.preventDefault();
                event.stopPropagation();
                await this.openCase(button.dataset.id);
            });
        });
    }

    renderCover(caseFile) {
        const photo = (caseFile.photos || [])[0]?.url || caseFile.cover;
        if (this.isImg(photo)) {
            return `<img src="${this.esc(photo)}" alt="${this.esc(caseFile.name)}">`;
        }
        return `<span>${this.esc((caseFile.code || "CAS").slice(0, 3))}</span>`;
    }

    async createCase() {
        const name = this.value("case-name");
        const initialPhotoUrl = this.value("case-initial-photo-url");
        if (!name) {
            await MC.UI.alert("O caso precisa de um nome.");
            return;
        }
        if (initialPhotoUrl && !this.isImg(initialPhotoUrl)) {
            await MC.UI.alert("A foto importante precisa ser uma URL de imagem valida.");
            return;
        }

        try {
            const created = await MC.Services.Cases.create({
                name,
                location: this.value("case-location"),
                objective: this.value("case-objective"),
                description: this.value("case-description"),
                status: this.value("case-status") || "not_started",
                password: this.value("case-password"),
                photos: initialPhotoUrl ? [{
                    id: this.localId("IMG"),
                    title: this.value("case-initial-photo-title") || "Foto importante",
                    url: initialPhotoUrl,
                    ownerId: MC.Services.Cases.currentUserId()
                }] : []
            });
            this.clear([
                "case-name",
                "case-location",
                "case-objective",
                "case-description",
                "case-password",
                "case-initial-photo-title",
                "case-initial-photo-url"
            ]);
            this.byId("case-create-form")?.classList.add("case-hidden");
            this.cases.unshift(created);
            this.renderCases();
            await this.openCase(created.id, true);
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao criar caso.");
        }
    }

    async openCase(id, trusted = false) {
        const caseFile = this.cases.find(entry => entry.id === id) || await MC.Services.Cases.findById(id);
        if (!caseFile) return;

        if (!trusted && !MC.Services.Cases.canOpen(caseFile)) {
            const password = await MC.UI.prompt("Digite a senha do caso:");
            if (!MC.Services.Cases.canOpen(caseFile, password)) {
                await MC.UI.alert("Senha incorreta.");
                return;
            }
        }

        this.current = this.normalizeCase(caseFile);
        this.dirty = false;
        this.byId("cases-list-view")?.classList.add("case-hidden");
        this.byId("case-workspace")?.classList.remove("case-hidden");
        this.byId("case-back-list")?.classList.remove("case-hidden");
        this.fillEditor();
        this.renderCurrent();
    }

    normalizeCase(caseFile) {
        caseFile.photos = caseFile.photos || [];
        caseFile.notes = caseFile.notes || [];
        caseFile.pages = caseFile.pages || [];
        caseFile.audios = caseFile.audios || [];
        caseFile.dossiers = caseFile.dossiers || [];
        caseFile.board = caseFile.board || { items: [], links: [] };
        caseFile.board.items = caseFile.board.items || [];
        caseFile.board.links = caseFile.board.links || [];
        caseFile.board.view = caseFile.board.view || { x: -900, y: -520, zoom: 0.65 };
        caseFile.board.view.zoom = this.clamp(Number(caseFile.board.view.zoom) || 0.65, 0.03, 6);
        caseFile.board.view.x = Number(caseFile.board.view.x) || -900;
        caseFile.board.view.y = Number(caseFile.board.view.y) || -520;
        caseFile.board.items.forEach(item => {
            if ((Number(item.x) || 0) <= 100 && (Number(item.y) || 0) <= 100) {
                item.x = Math.round((Number(item.x) || 50) / 100 * BOARD_WIDTH);
                item.y = Math.round((Number(item.y) || 50) / 100 * BOARD_HEIGHT);
            }
            item.width = this.clamp(Number(item.width) || 170, 90, 620);
            item.height = this.clamp(Number(item.height) || 120, 70, 520);
            item.rotation = Number(item.rotation) || 0;
            item.highlighted = Boolean(item.highlighted);
        });
        if (caseFile.status === "Investigation") caseFile.status = "in_progress";
        if (caseFile.status === "Solved") caseFile.status = "complete";
        if (caseFile.status === "Draft" || caseFile.status === "Open") caseFile.status = "not_started";
        return caseFile;
    }

    fillEditor() {
        this.set("case-edit-name", this.current.name);
        this.set("case-edit-location", this.current.location);
        this.set("case-edit-objective", this.current.objective);
        this.set("case-edit-password", this.current.password);
        this.set("case-edit-description", this.current.description);
        this.set("case-file-status", this.current.status);
    }

    renderCurrent() {
        this.refreshHeader();
        this.renderHeaderPhotos();
        this.renderPhotos();
        this.renderNotes();
        this.renderPages();
        this.renderAudios();
        this.renderDossiers();
        this.renderBoard();
    }

    toggleBoardFullscreen() {
        this.setBoardFullscreen(!this.byId("case-board-area")?.classList.contains("fullscreen"));
    }

    setBoardFullscreen(enabled) {
        const area = this.byId("case-board-area");
        const button = this.byId("case-board-fullscreen");
        if (!area) return;
        area.classList.toggle("fullscreen", Boolean(enabled));
        button?.classList.toggle("active", Boolean(enabled));
        if (button) button.textContent = enabled ? "Sair da tela cheia" : "Tela cheia";
        document.body.classList.toggle("case-board-fullscreen-open", Boolean(enabled));
        requestAnimationFrame(() => this.applyBoardTransform());
    }

    refreshHeader() {
        if (!this.current) return;
        this.byId("case-file-code").textContent = this.current.code || this.current.id || "CASO";
        this.byId("case-file-title").textContent = this.current.name || "Caso sem nome";
        this.byId("case-file-meta").textContent = [
            STATUS_LABELS[this.current.status] || this.current.status,
            this.current.location || "Local nao informado",
            this.current.objective || "Objetivo nao informado"
        ].join(" | ");
        const archiveBtn = this.byId("case-archive-main");
        if (archiveBtn) {
            const canArchive = MC.Services.Cases.isOwner(this.current) || MC.Services.Permissions.isAdmin();
            archiveBtn.classList.toggle("case-hidden", !canArchive);
            archiveBtn.disabled = !canArchive;
        }
    }

    renderHeaderPhotos() {
        const main = this.byId("case-main-photo");
        const strip = this.byId("case-header-photos");
        if (!this.current || !main || !strip) return;

        const photos = this.current.photos || [];
        const first = photos.find(photo => this.isImg(photo.url));

        main.innerHTML = first
            ? `<img src="${this.esc(first.url)}" alt="${this.esc(first.title || this.current.name)}"><span>${this.esc(first.title || "Foto principal")}</span>`
            : `<div class="case-main-photo-empty">${this.esc((this.current.code || "CAS").slice(0, 3))}</div>`;

        strip.innerHTML = photos.length
            ? photos.slice(0, 7).map(photo => this.isImg(photo.url)
                ? `<img src="${this.esc(photo.url)}" alt="${this.esc(photo.title || "")}" title="${this.esc(photo.title || "")}">`
                : "").join("")
            : "";
    }

    async backToList() {
        if (this.dirty && !await MC.UI.confirm("Existem informacoes nao salvas. Voltar sem salvar?")) return;
        this.current = null;
        this.dirty = false;
        this.pendingLinkId = null;
        this.addLineMode = false;
        this.byId("case-workspace")?.classList.add("case-hidden");
        this.byId("case-back-list")?.classList.add("case-hidden");
        this.byId("cases-list-view")?.classList.remove("case-hidden");
        await this.loadCases();
    }

    async saveCurrent() {
        if (!this.current) return;
        this.current.name = this.value("case-edit-name");
        this.current.location = this.value("case-edit-location");
        this.current.objective = this.value("case-edit-objective");
        this.current.password = this.value("case-edit-password");
        this.current.description = this.value("case-edit-description");
        this.current.status = this.value("case-file-status") || this.current.status;
        if (!this.current.name) {
            await MC.UI.alert("O caso precisa de um nome.");
            return;
        }

        try {
            this.current = this.normalizeCase(await MC.Services.Cases.update(this.current));
            this.dirty = false;
            this.refreshHeader();
            await this.loadCases();
            this.byId("cases-list-view")?.classList.add("case-hidden");
            this.byId("case-workspace")?.classList.remove("case-hidden");
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao salvar caso.");
        }
    }

    async quickSave() {
        if (!this.current) return;
        this.current = this.normalizeCase(await MC.Services.Cases.update(this.current));
        this.dirty = false;
    }

    async archiveCurrent() {
        if (!this.current) return;
        if (!await MC.UI.confirm("Arquivar este caso vai apaga-lo para todos. Continuar?")) return;

        try {
            await MC.Services.Cases.archive(this.current);
            this.current = null;
            this.dirty = false;
            this.pendingLinkId = null;
            this.deleteLineMode = false;
            this.byId("case-workspace")?.classList.add("case-hidden");
            this.byId("case-back-list")?.classList.add("case-hidden");
            this.byId("cases-list-view")?.classList.remove("case-hidden");
            await this.loadCases();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao arquivar caso.");
        }
    }

    async addPhoto() {
        const url = this.value("case-photo-url");
        if (!this.isImg(url)) {
            await MC.UI.alert("Informe uma URL de imagem valida.");
            return;
        }
        this.current.photos.push({
            id: this.localId("IMG"),
            title: this.value("case-photo-title") || "Foto importante",
            url,
            ownerId: MC.Services.Cases.currentUserId()
        });
        this.clear(["case-photo-title", "case-photo-url"]);
        this.byId("case-photo-form")?.classList.add("case-hidden");
        this.saveAndRender();
    }

    addNote() {
        const text = this.value("case-note-text");
        if (!text) return;
        this.current.notes.push({
            id: this.localId("NOTE"),
            title: this.value("case-note-title") || "Nota",
            text,
            ownerId: MC.Services.Cases.currentUserId(),
            createdAt: new Date().toISOString()
        });
        this.clear(["case-note-title", "case-note-text"]);
        this.saveAndRender();
    }

    async addQuickBoardNote() {
        if (!this.current) return;

        const data = await this.openArchiveForm({
            heading: "Nova nota do quadro",
            fields: [
                { key: "title", label: "Titulo", value: "Nota", multiline: false },
                { key: "text", label: "Texto da nota", value: "", multiline: true }
            ]
        });

        if (!data || !String(data.text || "").trim()) return;

        const note = {
            id: this.localId("NOTE"),
            title: String(data.title || "").trim() || "Nota",
            text: String(data.text || "").trim(),
            ownerId: MC.Services.Cases.currentUserId(),
            createdAt: new Date().toISOString()
        };

        this.current.notes.push(note);
        this.linkArchiveToBoard("note", note.id);
    }

    addPage() {
        const text = this.value("case-page-text");
        if (!text) return;
        this.current.pages.push({
            id: this.localId("PAG"),
            title: this.value("case-page-title") || "Pagina de texto",
            text,
            ownerId: MC.Services.Cases.currentUserId(),
            createdAt: new Date().toISOString()
        });
        this.clear(["case-page-title", "case-page-text"]);
        this.saveAndRender();
    }

    addAudio() {
        const url = this.value("case-audio-url");
        if (!url) return;
        this.current.audios.push({
            id: this.localId("AUD"),
            title: this.value("case-audio-title") || "Audio log",
            url,
            ownerId: MC.Services.Cases.currentUserId()
        });
        this.clear(["case-audio-title", "case-audio-url"]);
        this.saveAndRender();
    }

    addDossier() {
        const name = this.value("case-dossier-name");
        if (!name) return;
        this.current.dossiers.push({
            id: this.localId("DOS"),
            name,
            photos: this.value("case-dossier-photos").split(",").map(v => v.trim()).filter(Boolean),
            description: this.value("case-dossier-description"),
            ownerId: MC.Services.Cases.currentUserId()
        });
        this.clear(["case-dossier-name", "case-dossier-photos", "case-dossier-description"]);
        this.saveAndRender();
    }

    async saveAndRender() {
        try {
            await this.quickSave();
            this.renderCurrent();
        } catch {
            this.markDirty();
            this.renderCurrent();
        }
    }

    renderPhotos() {
        this.renderArchive("case-photos-list", this.current.photos, photo => `
            <div class="case-photo-tile">
                ${this.isImg(photo.url) ? `<img src="${this.esc(photo.url)}" alt="">` : ""}
                <strong>${this.esc(photo.title || "Foto")}</strong>
                <button data-action="board-photo" data-id="${this.esc(photo.id)}" type="button">Quadro</button>
                <button data-action="edit-photo" data-id="${this.esc(photo.id)}" type="button">Editar</button>
                <button data-action="delete-photo" data-id="${this.esc(photo.id)}" type="button">X</button>
            </div>
        `);
    }

    renderNotes() {
        this.renderArchive("case-notes-list", this.current.notes, note => `
            <div class="case-mini-item">
                <strong>${this.esc(note.title || "Nota")}</strong>
                <p>${this.esc(note.text || "")}</p>
                <button data-action="board-note" data-id="${this.esc(note.id)}" type="button">Quadro</button>
                <button data-action="edit-note" data-id="${this.esc(note.id)}" type="button">Editar</button>
                <button data-action="delete-note" data-id="${this.esc(note.id)}" type="button">X</button>
            </div>
        `);
    }

    renderPages() {
        this.renderArchive("case-pages-list", this.current.pages, page => `
            <div class="case-page-file">
                <strong>${this.esc(page.title || "Pagina")}</strong>
                <p>${this.esc(page.text || "")}</p>
                <button data-action="board-page" data-id="${this.esc(page.id)}" type="button">Quadro</button>
                <button data-action="edit-page" data-id="${this.esc(page.id)}" type="button">Editar</button>
                <button data-action="delete-page" data-id="${this.esc(page.id)}" type="button">X</button>
            </div>
        `);
    }

    renderAudios() {
        this.renderArchive("case-audios-list", this.current.audios, audio => `
            <div class="case-audio-file">
                <div class="case-audio-file-icon">AUD</div>
                <div class="case-audio-file-main">
                    <strong>${this.esc(audio.title || "Audio")}</strong>
                    <span>${this.esc(audio.id || "AUD")}</span>
                    <audio controls src="${this.esc(audio.url)}"></audio>
                </div>
                <div class="case-audio-file-actions">
                    <button data-action="board-audio" data-id="${this.esc(audio.id)}" type="button">Quadro</button>
                    <button data-action="edit-audio" data-id="${this.esc(audio.id)}" type="button">Editar</button>
                    <button data-action="delete-audio" data-id="${this.esc(audio.id)}" type="button">X</button>
                </div>
            </div>
        `);
    }

    renderDossiers() {
        this.renderArchive("case-dossiers-list", this.current.dossiers, dossier => `
            <div class="case-dossier-card">
                <div class="case-dossier-card-photo">
                    ${this.isImg((dossier.photos || [])[0]) ? `<img src="${this.esc((dossier.photos || [])[0])}" alt="">` : `<span>SEM FOTO</span>`}
                </div>
                <div class="case-dossier-card-head">
                    <span>FICHA INVESTIGATIVA</span>
                    <strong>${this.esc(dossier.name || "Ficha")}</strong>
                </div>
                <p class="case-dossier-card-desc">${this.esc(dossier.description || "")}</p>
                ${(dossier.photos || []).length > 1 ? `<div class="case-mini-photos">${(dossier.photos || []).slice(1).map(url => this.isImg(url) ? `<img src="${this.esc(url)}" alt="">` : "").join("")}</div>` : ""}
                <div class="case-dossier-actions">
                    <button data-action="board-dossier" data-id="${this.esc(dossier.id)}" type="button">Quadro</button>
                    <button data-action="edit-dossier" data-id="${this.esc(dossier.id)}" type="button">Editar</button>
                    <button data-action="delete-dossier" data-id="${this.esc(dossier.id)}" type="button">X</button>
                </div>
            </div>
        `);
    }

    renderArchive(id, entries, template) {
        const list = this.byId(id);
        if (!list) return;
        list.innerHTML = entries.length
            ? entries.map(template).join("")
            : `<p class="case-empty small">Nada arquivado.</p>`;
        list.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", () => this.handleArchiveAction(button.dataset.action, button.dataset.id));
        });
    }

    async handleArchiveAction(action, id) {
        if (action?.startsWith("board-")) {
            this.linkArchiveToBoard(action.replace("board-", ""), id);
            return;
        }
        if (action?.startsWith("edit-")) {
            this.editArchive(action.replace("edit-", ""), id);
            return;
        }
        const map = {
            "delete-photo": "photos",
            "delete-note": "notes",
            "delete-page": "pages",
            "delete-audio": "audios",
            "delete-dossier": "dossiers"
        };
        const key = map[action];
        if (!key || !await MC.UI.confirm("Remover este arquivo do caso?")) return;
        this.current[key] = this.current[key].filter(entry => entry.id !== id);
        this.current.board.items = this.current.board.items.filter(item => item.refId !== id);
        this.current.board.links = this.current.board.links.filter(link =>
            this.current.board.items.some(item => item.id === link.from) &&
            this.current.board.items.some(item => item.id === link.to)
        );
        this.saveAndRender();
    }

    linkArchiveToBoard(kind, refId) {
        const source = this.findArchive(kind, refId);
        if (!source) return;
        this.current.board.items.push({
            id: this.localId("BRD"),
            kind,
            refId,
            title: source.title || source.name || "Arquivo",
            text: source.text || source.description || "",
            url: source.url || (source.photos || [])[0] || "",
            x: 1500 + Math.random() * 420,
            y: 950 + Math.random() * 300,
            width: kind === "photo" || kind === "dossier" ? 180 : kind === "page" ? 220 : 160,
            height: kind === "audio" ? 86 : kind === "page" ? 180 : 120,
            rotation: 0,
            highlighted: false
        });
        this.saveAndRender();
    }

    findArchive(kind, id) {
        const key = { photo: "photos", note: "notes", page: "pages", audio: "audios", dossier: "dossiers" }[kind];
        return (this.current[key] || []).find(entry => entry.id === id);
    }

    async editArchive(kind, id) {
        const entry = this.findArchive(kind, id);
        if (!entry) return;

        if (kind === "photo") {
            const edited = await this.openFieldsArchiveEditor({
                heading: "Editar foto",
                fields: [
                    { key: "title", label: "Titulo da foto", value: entry.title || "" },
                    { key: "url", label: "URL da foto", value: entry.url || "" }
                ]
            });
            if (!edited) return;
            if (edited.url && !this.isImg(edited.url)) {
                await MC.UI.alert("URL de imagem invalida.");
                return;
            }
            entry.title = edited.title || "Foto importante";
            entry.url = edited.url;
        }

        if (kind === "note" || kind === "page") {
            const edited = await this.openTextArchiveEditor({
                heading: kind === "page" ? "Editar pagina" : "Editar nota",
                title: entry.title || "",
                text: entry.text || "",
                titlePlaceholder: kind === "page" ? "Titulo da pagina" : "Titulo da nota",
                textPlaceholder: kind === "page" ? "Conteudo da pagina" : "Texto completo da nota"
            });
            if (!edited) return;
            entry.title = edited.title || (kind === "page" ? "Pagina de texto" : "Nota");
            entry.text = edited.text;
        }

        if (kind === "audio") {
            const edited = await this.openFieldsArchiveEditor({
                heading: "Editar audio",
                fields: [
                    { key: "title", label: "Titulo do audio", value: entry.title || "" },
                    { key: "url", label: "URL do audio", value: entry.url || "" }
                ]
            });
            if (!edited) return;
            entry.title = edited.title || "Audio log";
            entry.url = edited.url;
        }

        if (kind === "dossier") {
            const edited = await this.openFieldsArchiveEditor({
                heading: "Editar ficha do caso",
                fields: [
                    { key: "name", label: "Nomenclatura", value: entry.name || "" },
                    { key: "photos", label: "Fotos separadas por virgula", value: (entry.photos || []).join(", ") },
                    { key: "description", label: "Descricao completa", value: entry.description || "", multiline: true }
                ]
            });
            if (!edited) return;
            entry.name = edited.name || "Ficha";
            entry.photos = edited.photos.split(",").map(value => value.trim()).filter(Boolean);
            entry.description = edited.description;
        }

        this.syncBoardItemsForRef(kind, id);
        this.saveAndRender();
    }

    openTextArchiveEditor(options) {
        return new Promise(resolve => {
            const overlay = document.createElement("div");
            overlay.className = "case-edit-modal";
            overlay.innerHTML = `
                <div class="case-edit-dialog">
                    <h3>${this.esc(options.heading)}</h3>
                    <input class="case-input case-edit-title" type="text" placeholder="${this.esc(options.titlePlaceholder)}" value="${this.esc(options.title)}">
                    <textarea class="case-textarea case-edit-text" rows="12" placeholder="${this.esc(options.textPlaceholder)}">${this.esc(options.text)}</textarea>
                    <div class="case-edit-actions">
                        <button class="case-btn case-edit-cancel" type="button">Cancelar</button>
                        <button class="case-btn-primary case-edit-save" type="button">Salvar</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const close = value => {
                overlay.remove();
                resolve(value);
            };

            overlay.querySelector(".case-edit-cancel")?.addEventListener("click", () => close(null));
            overlay.querySelector(".case-edit-save")?.addEventListener("click", () => {
                close({
                    title: overlay.querySelector(".case-edit-title")?.value?.trim() || "",
                    text: overlay.querySelector(".case-edit-text")?.value || ""
                });
            });
            overlay.addEventListener("click", event => {
                if (event.target === overlay) close(null);
            });
            overlay.querySelector(".case-edit-text")?.focus();
        });
    }

    openFieldsArchiveEditor(options) {
        return new Promise(resolve => {
            const overlay = document.createElement("div");
            overlay.className = "case-edit-modal";
            overlay.innerHTML = `
                <div class="case-edit-dialog">
                    <h3>${this.esc(options.heading)}</h3>
                    <div class="case-edit-fields">
                        ${options.fields.map(field => `
                            <label>
                                <span>${this.esc(field.label)}</span>
                                ${field.multiline
                                    ? `<textarea class="case-textarea" data-key="${this.esc(field.key)}" rows="8">${this.esc(field.value || "")}</textarea>`
                                    : `<input class="case-input" data-key="${this.esc(field.key)}" type="text" value="${this.esc(field.value || "")}">`}
                            </label>
                        `).join("")}
                    </div>
                    <div class="case-edit-actions">
                        <button class="case-btn case-edit-cancel" type="button">Cancelar</button>
                        <button class="case-btn-primary case-edit-save" type="button">Salvar</button>
                    </div>
                </div>
            `;

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
                close(data);
            });
            overlay.addEventListener("click", event => {
                if (event.target === overlay) close(null);
            });
            overlay.querySelector("[data-key]")?.focus();
        });
    }

    syncBoardItemsForRef(kind, refId) {
        const source = this.findArchive(kind, refId);
        if (!source) return;
        this.current.board.items
            .filter(item => item.kind === kind && item.refId === refId)
            .forEach(item => {
                item.title = source.title || source.name || "Arquivo";
                item.text = source.text || source.description || "";
                item.url = source.url || (source.photos || [])[0] || "";
            });
    }

    renderBoard() {
        const itemsEl = this.byId("case-board-items");
        const linesEl = this.byId("case-board-lines");
        if (!itemsEl || !linesEl || !this.current) return;

        itemsEl.innerHTML = this.current.board.items.map(item => `
            <div class="case-board-item ${this.esc(item.kind)} ${this.addLineMode ? "line-mode" : ""} ${item.highlighted ? "highlighted" : ""} ${item.id === this.pendingLinkId ? "linking" : ""}"
                 data-id="${this.esc(item.id)}"
                 style="left:${Number(item.x) || 1200}px;top:${Number(item.y) || 900}px;width:${Number(item.width) || 160}px;min-height:${Number(item.height) || 100}px;--board-item-rotation:${Number(item.rotation) || 0}deg">
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

        itemsEl.querySelectorAll(".case-board-item").forEach(el => {
            el.addEventListener("click", event => {
                if (!this.addLineMode || event.target.closest(".case-board-menu, .case-board-resize, audio, button")) return;
                event.preventDefault();
                event.stopPropagation();
                this.handleBoardLink(el.dataset.id, { keepMode: true });
            });
            el.addEventListener("dblclick", event => {
                if (this.addLineMode) return;
                event.stopPropagation();
                this.zoomBoardItem(el.dataset.id);
            });
        });
        itemsEl.querySelectorAll(".case-board-grip").forEach(grip => {
            grip.addEventListener("pointerdown", event => this.startDrag(event, grip.dataset.id));
        });
        itemsEl.querySelectorAll(".case-board-resize").forEach(handle => {
            handle.addEventListener("pointerdown", event => this.startResize(event, handle.dataset.id));
        });
        itemsEl.querySelectorAll(".case-board-link").forEach(button => {
            button.addEventListener("pointerdown", event => event.stopPropagation());
            button.addEventListener("click", event => {
                event.stopPropagation();
                this.addLineMode = true;
                this.byId("case-board-add-line")?.classList.add("active");
                this.handleBoardLink(button.dataset.id, { keepMode: true });
            });
        });
        itemsEl.querySelectorAll(".case-board-delete").forEach(button => {
            button.addEventListener("pointerdown", event => event.stopPropagation());
            button.addEventListener("click", event => {
                event.stopPropagation();
                this.deleteBoardItem(button.dataset.id);
            });
        });
        itemsEl.querySelectorAll(".case-board-size-up, .case-board-size-down").forEach(button => {
            button.addEventListener("pointerdown", event => event.stopPropagation());
            button.addEventListener("click", event => {
                event.stopPropagation();
                this.resizeBoardItemBy(button.dataset.id, button.classList.contains("case-board-size-up") ? 24 : -24);
            });
        });
        itemsEl.querySelectorAll(".case-board-rotate-left, .case-board-rotate-right").forEach(button => {
            button.addEventListener("pointerdown", event => event.stopPropagation());
            button.addEventListener("click", event => {
                event.stopPropagation();
                this.rotateBoardItem(button.dataset.id, button.classList.contains("case-board-rotate-left") ? -8 : 8);
            });
        });
        itemsEl.querySelectorAll(".case-board-highlight").forEach(button => {
            button.addEventListener("pointerdown", event => event.stopPropagation());
            button.addEventListener("click", event => {
                event.stopPropagation();
                this.toggleBoardHighlight(button.dataset.id);
            });
        });
        itemsEl.querySelectorAll(".case-board-edit").forEach(button => {
            button.addEventListener("pointerdown", event => event.stopPropagation());
            button.addEventListener("click", event => {
                event.stopPropagation();
                this.editBoardSource(button.dataset.id);
            });
        });

        this.updateZoomLabel();
        this.applyBoardTransform();
        requestAnimationFrame(() => this.renderBoardLines(linesEl));
    }

    renderBoardContent(item) {
        if (item.kind === "page") {
            return `<div class="case-board-page-sheet"><p class="case-board-page-text">${this.esc(item.text || "")}</p></div>`;
        }
        if (item.kind === "photo") {
            return this.isImg(item.url)
                ? `<img src="${this.esc(item.url)}" alt=""><strong>${this.esc(item.title || "Foto")}</strong>`
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
                <div class="case-board-tape-head">
                    <span>REC</span>
                    <strong>${this.esc(item.title || "Audio")}</strong>
                </div>
                <div class="case-board-tape-body">
                    <span class="case-tape-reel"></span>
                    <span class="case-tape-window"></span>
                    <span class="case-tape-reel"></span>
                </div>
                <audio controls src="${this.esc(item.url || "")}"></audio>
            </article>`;
        }
        return `<strong>${this.esc(item.title || "Nota")}</strong><p>${this.esc(item.text || "")}</p>`;
    }

    renderBoardLines(svg) {
        svg.setAttribute("viewBox", `0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`);
        svg.innerHTML = this.current.board.links.map(link => {
            const from = this.boardItemCenter(link.from);
            const to = this.boardItemCenter(link.to);
            if (!from || !to) return "";
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const angle = this.lineLabelAngle(from, to);
            const label = String(link.label || "").trim();
            const labelWidth = this.lineLabelWidth(label);
            const labelTextWidth = Math.max(120, labelWidth - 28);
            const color = this.esc(link.color || "#a30e0e");
            return `
                <g class="case-board-line-group" data-id="${this.esc(link.id)}">
                    <line class="case-board-line-hit" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>
                    <line class="case-board-line-visual" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" style="stroke:${color}"></line>
                    <g class="case-board-line-ui" transform="translate(${midX} ${midY}) rotate(${angle})">
                        <rect class="case-board-line-ui-hit" x="-104" y="-42" width="208" height="78"></rect>
                        ${label ? `<g class="case-board-line-label" transform="translate(0 -24)">
                            <rect x="${-labelWidth / 2}" y="-17" width="${labelWidth}" height="34"></rect>
                            <text text-anchor="middle" dominant-baseline="middle" textLength="${labelTextWidth}" lengthAdjust="spacingAndGlyphs">${this.esc(label)}</text>
                        </g>` : ""}
                        <g class="case-board-line-palette" transform="translate(-70 16)">
                            ${this.lineColors().map((entry, index) => `<circle class="case-board-line-color" data-color="${entry}" cx="${index * 28}" cy="0" r="8" style="fill:${entry}"></circle>`).join("")}
                        </g>
                    </g>
                </g>`;
        }).join("");
        this.bindBoardLineEvents(svg);
    }

    lineLabelWidth(label = "") {
        return this.clamp(String(label || "").length * 13 + 42, 180, 520);
    }

    bindBoardLineEvents(svg) {
        svg.querySelectorAll(".case-board-line-group").forEach(group => {
            group.addEventListener("pointerdown", event => {
                event.preventDefault();
                event.stopPropagation();
            });
            group.addEventListener("click", async event => {
                event.preventDefault();
                event.stopPropagation();
                if (this.deleteLineMode) {
                    await this.deleteBoardLine(group.dataset.id);
                }
            });
            group.addEventListener("dblclick", event => {
                event.preventDefault();
                event.stopPropagation();
                this.editBoardLineLabel(group.dataset.id);
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
                this.changeBoardLineColor(button.closest(".case-board-line-group")?.dataset.id, button.dataset.color);
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

    changeBoardLineColor(id, color) {
        const link = this.current?.board?.links?.find(entry => entry.id === id);
        if (!link || !color) return;
        link.color = color;
        this.saveAndRender();
    }

    boardItemCenter(id) {
        const item = this.current.board.items.find(entry => entry.id === id);
        if (!item) return null;
        return {
            x: (Number(item.x) || 0) + (Number(item.width) || 0) / 2,
            y: (Number(item.y) || 0) + (Number(item.height) || 0) / 2
        };
    }

    async startDrag(event, id) {
        if (event.button !== 0) return;
        event.stopPropagation();
        const item = this.current.board.items.find(entry => entry.id === id);
        if (!item) return;
        const zoom = this.current.board.view.zoom || 1;
        this.drag = {
            id,
            startX: event.clientX,
            startY: event.clientY,
            itemX: Number(item.x) || 0,
            itemY: Number(item.y) || 0,
            zoom
        };
        window.addEventListener("pointermove", this.dragMove);
        window.addEventListener("pointerup", this.dragEnd, { once: true });
    }

    dragMove = (event) => {
        if (!this.drag || !this.current) return;
        const item = this.current.board.items.find(entry => entry.id === this.drag.id);
        if (!item) return;
        const dx = (event.clientX - this.drag.startX) / this.drag.zoom;
        const dy = (event.clientY - this.drag.startY) / this.drag.zoom;
        item.x = this.clamp(this.drag.itemX + dx, 0, BOARD_WIDTH - (Number(item.width) || 120));
        item.y = this.clamp(this.drag.itemY + dy, 0, BOARD_HEIGHT - (Number(item.height) || 90));
        const el = this.container.querySelector(`.case-board-item[data-id="${CSS.escape(item.id)}"]`);
        if (el) {
            el.style.left = `${item.x}px`;
            el.style.top = `${item.y}px`;
        }
        this.renderBoardLines(this.byId("case-board-lines"));
    };

    dragEnd = async (event) => {
        window.removeEventListener("pointermove", this.dragMove);
        this.drag = null;
        await this.quickSave();
    };

    async startResize(event, id) {
        if (event.button !== 0) return;
        event.stopPropagation();
        const item = this.current.board.items.find(entry => entry.id === id);
        if (!item) return;
        this.resize = {
            id,
            startX: event.clientX,
            startY: event.clientY,
            width: Number(item.width) || 160,
            height: Number(item.height) || 100,
            zoom: this.current.board.view.zoom || 1
        };
        window.addEventListener("pointermove", this.resizeMove);
        window.addEventListener("pointerup", this.resizeEnd, { once: true });
    }

    resizeMove = (event) => {
        if (!this.resize || !this.current) return;
        const item = this.current.board.items.find(entry => entry.id === this.resize.id);
        if (!item) return;
        const dx = (event.clientX - this.resize.startX) / this.resize.zoom;
        const dy = (event.clientY - this.resize.startY) / this.resize.zoom;
        item.width = this.clamp(this.resize.width + dx, 90, 620);
        item.height = this.clamp(this.resize.height + dy, 70, 520);
        const el = this.container.querySelector(`.case-board-item[data-id="${CSS.escape(item.id)}"]`);
        if (el) {
            el.style.width = `${item.width}px`;
            el.style.minHeight = `${item.height}px`;
        }
        this.renderBoardLines(this.byId("case-board-lines"));
    };

    resizeEnd = async () => {
        window.removeEventListener("pointermove", this.resizeMove);
        this.resize = null;
        await this.quickSave();
    };

    async startPan(event) {
        if (event.button !== 0) return;
        if (event.target.closest(".case-board-item") || event.target.closest(".case-board-zoom-panel")) return;
        if (!this.current?.board?.view) return;
        this.pan = {
            startX: event.clientX,
            startY: event.clientY,
            viewX: this.current.board.view.x,
            viewY: this.current.board.view.y
        };
        window.addEventListener("pointermove", this.panMove);
        window.addEventListener("pointerup", this.panEnd, { once: true });
    }

    panMove = (event) => {
        if (!this.pan || !this.current?.board?.view) return;
        this.current.board.view.x = this.pan.viewX + (event.clientX - this.pan.startX);
        this.current.board.view.y = this.pan.viewY + (event.clientY - this.pan.startY);
        this.applyBoardTransform();
    };

    panEnd = async () => {
        window.removeEventListener("pointermove", this.panMove);
        this.pan = null;
        await this.quickSave();
    };

    handleBoardWheel(event) {
        if (!this.current?.board?.view) return;
        if (event.target.closest(".case-board-zoom-panel")) return;

        event.preventDefault();

        const viewport = this.byId("case-board-viewport");
        if (!viewport) return;

        const rect = viewport.getBoundingClientRect();
        const view = this.current.board.view;
        const oldZoom = this.clamp(view.zoom || 0.65, 0.03, 6);
        const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
        const wheelStrength = this.clamp(-delta / 220, -2.5, 2.5);
        const nextZoom = this.clamp(oldZoom * Math.pow(1.22, wheelStrength), 0.03, 6);

        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;
        const worldX = (cursorX - view.x) / oldZoom;
        const worldY = (cursorY - view.y) / oldZoom;

        view.zoom = nextZoom;
        view.x = cursorX - worldX * nextZoom;
        view.y = cursorY - worldY * nextZoom;

        this.applyBoardTransform();
        this.updateZoomLabel();
        this.markDirty();

        clearTimeout(this.boardWheelTimer);
        this.boardWheelTimer = setTimeout(() => this.quickSave(), 260);
    }

    async handleBoardLink(id, options = {}) {
        if (!this.pendingLinkId) {
            this.pendingLinkId = id;
            this.addLineMode = true;
            this.deleteLineMode = false;
            this.byId("case-board-add-line")?.classList.add("active");
            this.byId("case-board-delete-line")?.classList.remove("active");
            this.renderBoard();
            return;
        }
        if (this.pendingLinkId !== id) {
            const exists = this.current.board.links.some(link =>
                (link.from === this.pendingLinkId && link.to === id) ||
                (link.from === id && link.to === this.pendingLinkId)
            );
            if (!exists) {
                const label = await MC.UI.prompt("Texto entre as linhas (opcional):", "") || "";
                this.current.board.links.push({
                    id: this.localId("LNK"),
                    from: this.pendingLinkId,
                    to: id,
                    color: this.value("case-board-line-color") || "#a30e0e",
                    label
                });
            }
        }
        this.pendingLinkId = options.keepMode ? id : null;
        this.saveAndRender();
    }

    async editBoardLineLabel(id) {
        const link = this.current?.board?.links?.find(entry => entry.id === id);
        if (!link) return;
        const label = await MC.UI.prompt("Texto entre as linhas:", link.label || "");
        if (label === null) return;
        link.label = label;
        this.saveAndRender();
    }

    async deleteBoardLine(id) {
        if (!await MC.UI.confirm("Remover esta linha?")) return;
        this.current.board.links = this.current.board.links.filter(link => link.id !== id);
        this.deleteLineMode = false;
        this.addLineMode = false;
        this.pendingLinkId = null;
        this.byId("case-board-add-line")?.classList.remove("active");
        this.byId("case-board-delete-line")?.classList.remove("active");
        this.saveAndRender();
    }

    async deleteBoardItem(id) {
        if (!await MC.UI.confirm("Remover este item do quadro?")) return;
        this.current.board.items = this.current.board.items.filter(item => item.id !== id);
        this.current.board.links = this.current.board.links.filter(link => link.from !== id && link.to !== id);
        this.saveAndRender();
    }

    resizeBoardItemBy(id, amount) {
        const item = this.current.board.items.find(entry => entry.id === id);
        if (!item) return;
        item.width = this.clamp((Number(item.width) || 160) + amount, 90, 620);
        item.height = this.clamp((Number(item.height) || 100) + amount, 70, 520);
        this.saveAndRender();
    }

    rotateBoardItem(id, amount) {
        const item = this.current.board.items.find(entry => entry.id === id);
        if (!item) return;
        item.rotation = (Number(item.rotation) || 0) + amount;
        this.saveAndRender();
    }

    toggleBoardHighlight(id) {
        const item = this.current.board.items.find(entry => entry.id === id);
        if (!item) return;
        item.highlighted = !item.highlighted;
        this.saveAndRender();
    }

    async editBoardSource(id) {
        const item = this.current.board.items.find(entry => entry.id === id);
        if (!item) return;
        if (item.refId) {
            this.editArchive(item.kind, item.refId);
            return;
        }
        const title = await MC.UI.prompt("Titulo:", item.title || "");
        if (title === null) return;
        const text = await MC.UI.prompt("Texto:", item.text || "");
        if (text === null) return;
        item.title = title;
        item.text = text;
        this.saveAndRender();
    }

    zoomBoardItem(id) {
        const item = this.current.board.items.find(entry => entry.id === id);
        if (!item) return;
        const zoom = this.byId("case-zoom");
        const content = this.byId("case-zoom-content");
        if (!zoom || !content) return;
        content.innerHTML = this.renderZoomContent(item);
        zoom.classList.remove("case-hidden");
    }

    renderZoomContent(item) {
        const source = item.refId ? this.findArchive(item.kind, item.refId) : null;
        if (item.kind === "dossier") {
            const dossier = source || item;
            const photos = (dossier.photos || [item.url]).filter(Boolean);
            return `
                <article class="case-zoom-dossier case-zoom-investigation-file">
                    <div class="case-zoom-dossier-photo">
                        ${photos[0] && this.isImg(photos[0]) ? `<img src="${this.esc(photos[0])}" alt="">` : `<span>SEM FOTO</span>`}
                    </div>
                    <div class="case-zoom-dossier-head">
                        <span>Ficha investigativa</span>
                        <strong>${this.esc(dossier.name || item.title || "Ficha")}</strong>
                    </div>
                    <p class="case-zoom-dossier-desc">${this.esc(dossier.description || item.text || "")}</p>
                    ${photos.length > 1 ? `<div class="case-zoom-dossier-photos">${photos.slice(1).map(url => this.isImg(url) ? `<img src="${this.esc(url)}" alt="">` : "").join("")}</div>` : ""}
                </article>`;
        }
        if (item.kind === "page") {
            const page = source || item;
            return `
                <article class="case-zoom-page">
                    <p>${this.esc(page.text || "")}</p>
                </article>`;
        }
        if ((item.kind === "photo" || item.kind === "dossier") && this.isImg(item.url)) {
            return `<img src="${this.esc(item.url)}" alt="${this.esc(item.title || "")}"><strong>${this.esc(item.title || "")}</strong>`;
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
        return `<article class="case-zoom-note"><strong>${this.esc(item.title || "Nota")}</strong><p>${this.esc(item.text || "")}</p></article>`;
    }

    closeZoom() {
        this.byId("case-zoom")?.classList.add("case-hidden");
        const content = this.byId("case-zoom-content");
        if (content) content.innerHTML = "";
    }

    applyBoardTransform() {
        const world = this.byId("case-board-world");
        if (!world || !this.current?.board?.view) return;
        const view = this.current.board.view;
        world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;
    }

    updateZoomLabel() {
        if (!this.current?.board?.view) return;
        const value = Math.round((this.current.board.view.zoom || 0.65) * 100);
        const label = this.byId("case-board-zoom-label");
        const input = this.byId("case-board-zoom");
        if (label) label.textContent = `${value}%`;
        if (input) input.value = String(value);
    }

    markDirty() {
        this.dirty = true;
    }

    localId(prefix) {
        return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    }

    byId(id) {
        return document.getElementById(id);
    }

    value(id) {
        return this.byId(id)?.value?.trim() || "";
    }

    set(id, value) {
        const el = this.byId(id);
        if (el) el.value = value || "";
    }

    clear(ids) {
        ids.forEach(id => this.set(id, ""));
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, Number(value) || 0));
    }

    isImg(value) {
        return typeof value === "string" && (
            value.startsWith("http") ||
            value.startsWith("/") ||
            value.startsWith("assets/") ||
            value.startsWith("data:image")
        );
    }

    esc(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

}

export default new Cases();
