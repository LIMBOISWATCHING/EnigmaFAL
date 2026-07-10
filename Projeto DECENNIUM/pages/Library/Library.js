import MC from "../../js/engine/Core.js";

class Library {

    constructor() {

        this.container = null;
        this.categories = [];
        this.books = [];
        this.pages = [];
        this.activeCategoryId = "";
        this.activeBook = null;
        this.activePageIndex = 0;
        this.search = "";
        this.unlockedBooks = new Set();
        this.dirty = false;
        this.drawing = false;
        this.currentLine = null;
        this.drawingMode = false;
        this.eraserMode = false;
        this.erasing = false;
        this.pageHistory = [];
        this.savedSelection = null;
        this.zoomImage = null;
        this.zoomScale = 1;
        this.zoomOffset = { x: 0, y: 0 };
        this.uvLightOn = false;
        this.uvDrawingMode = false;
        this.uvSpot = null;
        this.drawingRedoStack = [];

    }

    async open(container) {

        this.container = container;
        MC.Layout.show();
        MC.Layout.setUser(MC.Auth.current());
        MC.Menu.unlock();
        this.container.innerHTML = await MC.Loader.html("pages/Library/Library.html");
        this.bindEvents();
        await this.loadCategories();
        await this.openRequestedBook();

    }

    bindEvents() {

        this.byId("library-book-search")?.addEventListener("input", event => {
            this.search = event.target.value.trim().toLowerCase();
            this.renderBooks();
        });

        this.byId("library-create-book-btn")?.addEventListener("click", () => this.createBook());
        this.byId("library-close-book")?.addEventListener("click", () => this.closeReader());
        this.byId("library-save-book")?.addEventListener("click", () => this.saveBook());
        this.byId("library-delete-book")?.addEventListener("click", () => this.deleteBook());
        this.byId("library-add-page")?.addEventListener("click", () => this.addPage());
        this.byId("library-save-page")?.addEventListener("click", () => this.savePage());
        this.byId("library-tear-page")?.addEventListener("click", () => this.tearPage());
        this.byId("library-prev-page")?.addEventListener("click", () => this.changePage(-1));
        this.byId("library-next-page")?.addEventListener("click", () => this.changePage(1));
        this.byId("library-jump-page")?.addEventListener("click", () => this.jumpPage());
        this.byId("library-back-page")?.addEventListener("click", () => this.backPage());
        this.byId("library-return-shelves")?.addEventListener("click", () => this.closeReader());
        this.byId("library-selection-font")?.addEventListener("mousedown", () => this.saveEditorSelection());
        this.byId("library-selection-size")?.addEventListener("mousedown", () => this.saveEditorSelection());
        this.byId("library-apply-color")?.addEventListener("click", () => this.applyTextColor());
        this.byId("library-selection-font")?.addEventListener("change", event => this.applySelectionFont(event.target.value));
        this.byId("library-selection-size")?.addEventListener("change", event => this.applySelectionSize(event.target.value));
        this.container.querySelectorAll(".library-format-btn").forEach(button => {
            button.addEventListener("mousedown", event => event.preventDefault());
            button.addEventListener("click", () => this.applyFormat(button));
        });
        this.byId("library-page-title")?.addEventListener("input", event => {
            const title = this.byId("library-paper-title");
            if (title) {
                title.textContent = event.target.value || "";
                title.classList.toggle("empty", !event.target.value.trim());
            }
        });
        this.byId("library-page-own-style")?.addEventListener("change", () => {
            this.applyCurrentPageVisuals(this.currentPage(), true);
            this.dirty = true;
        });
        this.byId("library-page-own-color")?.addEventListener("input", () => {
            this.applyCurrentPageVisuals(this.currentPage(), true);
            this.dirty = true;
        });
        this.byId("library-toggle-drawing")?.addEventListener("click", () => this.toggleDrawingMode());
        this.byId("library-drawing-undo")?.addEventListener("click", () => this.undoDrawing());
        this.byId("library-drawing-redo")?.addEventListener("click", () => this.redoDrawing());
        this.byId("library-toggle-uv-drawing")?.addEventListener("click", () => this.toggleUvDrawingMode());
        this.byId("library-apply-uv-text")?.addEventListener("mousedown", event => event.preventDefault());
        this.byId("library-apply-uv-text")?.addEventListener("click", () => this.applyUvText());
        this.byId("library-uv-light")?.addEventListener("click", () => this.toggleUvLight());
        this.byId("library-toggle-eraser")?.addEventListener("click", () => this.toggleEraserMode());
        this.byId("library-clear-drawings")?.addEventListener("click", () => this.clearDrawings());
        this.byId("library-apply-highlights")?.addEventListener("click", () => this.applyHighlightsFromInput());
        this.byId("library-clear-highlights")?.addEventListener("click", () => this.clearHighlights());
        this.byId("library-add-image")?.addEventListener("click", () => this.addImage());
        this.byId("library-add-note")?.addEventListener("click", () => this.addNote());
        this.byId("library-ref-selection")?.addEventListener("click", () => this.useSelectionAsReferenceLabel());
        this.byId("library-add-ref")?.addEventListener("click", () => this.addReference());

        this.container.querySelectorAll(".library-tool-label").forEach(button => {
            button.addEventListener("click", () => button.closest(".library-tool-block")?.classList.toggle("collapsed"));
        });

        this.container.addEventListener("input", event => {
            if (event.target.closest("#library-reader")) this.dirty = true;
        });

    }

    async close() {

        if (this.activeBook) {
            return await this.saveBeforeLeavingBook();
        }

        return true;

    }

    async loadCategories() {

        this.categories = await MC.Services.Library.findCategories();
        this.activeCategoryId = this.activeCategoryId || this.categories[0]?.id || "";
        this.renderCategories();
        await this.loadBooks();

    }

    async openRequestedBook() {

        const requested = sessionStorage.getItem("mc-open-library-book");
        if (!requested) return;

        sessionStorage.removeItem("mc-open-library-book");
        await this.openBook(requested, 1, false);

    }

    async renderCategories() {

        const nav = this.byId("library-categories");
        if (!nav) return;

        nav.innerHTML = this.categories.map(category => `
            <button class="library-category ${category.id === this.activeCategoryId ? "active" : ""}" data-id="${this.esc(category.id)}" type="button">
                <span>${this.esc(category.name)}</span>
            </button>
        `).join("");

        nav.querySelectorAll(".library-category").forEach(button => {
            button.addEventListener("click", async () => {
                this.activeCategoryId = button.dataset.id;
                this.renderCategories();
                await this.loadBooks();
            });
        });

    }

    async loadBooks() {

        const title = this.byId("library-category-title");
        const category = this.categories.find(entry => entry.id === this.activeCategoryId);
        if (title) title.textContent = category?.name || "Livros";

        this.books = await MC.Services.Library.findBooks(this.activeCategoryId === "CAT-GENERAL" ? "" : this.activeCategoryId);
        this.renderBooks();

    }

    renderBooks() {

        const list = this.byId("library-books");
        if (!list) return;

        const books = this.books.filter(book => {
            if (!this.search) return true;
            return [book.title, book.id, book.ownerName, book.seal].join(" ").toLowerCase().includes(this.search);
        });

        if (!books.length) {
            list.innerHTML = `<p class="library-empty">Nenhum livro encontrado nesta prateleira.</p>`;
            return;
        }

        list.innerHTML = books.map(book => `
            <article class="library-book-card ${this.esc(book.coverStyle || "dark")}" style="--library-cover-color:${this.esc(book.coverColor || "#17100c")};--library-cover-border:${this.esc(book.coverBorderColor || "#2d2118")};">
                <div class="library-card-top">
                    <span class="library-seal">${this.esc(book.seal || "incompleto")}</span>
                    <strong>${this.esc(book.id)}</strong>
                </div>
                <h3>${this.esc(book.title || "Sem titulo")}</h3>
                <p>Autor: ${this.esc(book.ownerName || "Anonimo")}</p>
                <button class="library-open-book library-btn" data-id="${this.esc(book.id)}" type="button">
                    Abrir Livro
                </button>
            </article>
        `).join("");

        list.querySelectorAll(".library-open-book").forEach(button => {
            button.addEventListener("click", () => this.openBook(button.dataset.id));
        });

    }

    async createBook() {

        const title = this.byId("library-book-title")?.value.trim() || "";
        if (!title) {
            await MC.UI.alert("O livro precisa de um titulo.");
            return;
        }

        try {
            await MC.Services.Library.createBook({
                categoryId: this.activeCategoryId,
                title,
                password: this.byId("library-book-password")?.value.trim() || "",
                seal: this.byId("library-book-seal")?.value || "incompleto"
            });
            this.clear(["library-book-title", "library-book-password"]);
            await this.loadBooks();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao criar livro.");
        }

    }

    async openBook(id, requestedPage = 1, pushHistory = true) {

        if (this.activeBook && (this.activeBook.id !== id || this.currentPage())) {
            const saved = await this.saveBeforeLeavingBook();
            if (!saved) return;
        }

        const book = await MC.Services.Library.findBook(id);
        if (!book) return;

        if (String(book.password || "").trim() && !MC.Services.Library.canManageBook(book)) {
            const password = await MC.UI.prompt("Senha do livro:");
            if (!MC.Services.Library.canOpenBook(book, password)) {
                await MC.UI.alert("Senha incorreta.");
                return;
            }
        }

        if (pushHistory && this.activeBook && this.currentPage()) {
            this.pageHistory.push({
                bookId: this.activeBook.id,
                pageNumber: this.currentPage().pageNumber
            });
        }

        this.activeBook = book;
        this.pages = await MC.Services.Library.findPages(book.id);
        this.activePageIndex = Math.max(0, this.pages.findIndex(page => Number(page.pageNumber) === Number(requestedPage)));
        if (this.activePageIndex < 0) this.activePageIndex = 0;

        this.byId("library-shelves")?.classList.add("hidden");
        this.byId("library-reader")?.classList.remove("hidden");
        this.byId("library-close-book")?.classList.remove("hidden");
        this.byId("library-uv-light")?.classList.remove("hidden");
        this.fillBookTools();
        this.renderOpenBook();

    }

    async closeReader(options = {}) {

        if (!options.skipSave && !await this.saveBeforeLeavingBook()) return;
        this.activeBook = null;
        this.pages = [];
        this.dirty = false;
        this.pageHistory = [];
        this.byId("library-reader")?.classList.add("hidden");
        this.byId("library-shelves")?.classList.remove("hidden");
        this.byId("library-close-book")?.classList.add("hidden");
        this.byId("library-uv-light")?.classList.add("hidden");
        this.uvLightOn = false;
        this.uvDrawingMode = false;

    }

    fillBookTools() {

        const book = this.activeBook;
        const canManage = MC.Services.Library.canManageBook(book);

        this.set("library-edit-title", book.title);
        this.set("library-edit-seal", book.seal);
        this.set("library-edit-font", book.fontFamily);
        this.set("library-edit-color", book.textColor);
        this.set("library-cover-color", book.coverColor || "#17100c");
        this.set("library-cover-border", book.coverBorderColor || "#2d2118");
        this.set("library-page-style", book.pageStyle || "middle");
        this.set("library-page-color", book.pageColor || "#d8c49c");
        this.set("library-edit-password", book.password);

        ["library-edit-title", "library-edit-seal", "library-edit-font", "library-edit-color", "library-cover-color", "library-cover-border", "library-page-style", "library-page-color", "library-edit-password", "library-save-book", "library-delete-book"].forEach(id => {
            const el = this.byId(id);
            if (el) el.disabled = !canManage;
        });

    }

    renderOpenBook() {

        const book = this.activeBook;
        const page = this.currentPage();

        this.byId("library-open-title").textContent = book.title;
        this.byId("library-open-seal").textContent = String(book.seal || "incompleto").toUpperCase();
        this.byId("library-open-meta").textContent = `${book.id} | ${book.ownerName || "Anonimo"}`;

        const cover = this.container.querySelector(".library-book-cover");
        if (cover) {
            cover.style.setProperty("--library-cover-color", book.coverColor || "#17100c");
            cover.style.setProperty("--library-cover-border", book.coverBorderColor || "#2d2118");
        }

        const paper = this.byId("library-page-view");
        if (!paper) return;

        paper.style.fontFamily = book.fontFamily;
        paper.style.color = book.textColor;

        if (!page) {
            paper.innerHTML = `
                <div class="library-empty-page">
                    <p>Este livro ainda nao possui paginas.</p>
                    <button id="library-first-page" class="library-btn" type="button">Escrever Primeira Pagina</button>
                </div>
            `;
            this.applyCurrentPageVisuals(null);
            this.byId("library-first-page")?.addEventListener("click", () => this.addPage());
            return;
        }

        const pageTorn = this.isTornPage(page);
        const canEdit = MC.Services.Library.canEditPage(page) && !pageTorn;
        const canDraw = !pageTorn;
        const canTear = MC.Services.Library.canTearPage(book, page);
        if (pageTorn) {
            this.drawingMode = false;
            this.eraserMode = false;
            this.drawing = false;
            this.erasing = false;
            this.currentLine = null;
        }

        this.set("library-page-title", page.title || "");
        this.set("library-highlight-words", (page.highlightWords || []).join(", "));
        this.set("library-page-own-style", page.pageStyle || "");
        this.set("library-page-own-color", page.pageColor || book.pageColor || "#d8c49c");
        this.applyCurrentPageVisuals(page);
        this.byId("library-page-title").disabled = !canEdit;
        this.byId("library-save-page").disabled = !canEdit;
        this.byId("library-tear-page").disabled = !canTear || pageTorn;
        [
            "library-text-color",
            "library-selection-font",
            "library-selection-size",
            "library-apply-color",
            "library-apply-uv-text",
            ...Array.from(this.container.querySelectorAll(".library-format-btn")),
            "library-highlight-words",
            "library-apply-highlights",
            "library-clear-highlights",
            "library-ref-label",
            "library-ref-book",
            "library-ref-page",
            "library-ref-selection",
            "library-add-ref",
            "library-page-own-style",
            "library-page-own-color"
        ].forEach(entry => {
            const el = typeof entry === "string" ? this.byId(entry) : entry;
            if (el) el.disabled = !canEdit;
        });

        ["library-toggle-drawing", "library-toggle-uv-drawing", "library-toggle-eraser", "library-clear-drawings"].forEach(id => {
            const el = this.byId(id);
            if (el) el.disabled = !canDraw;
        });

        ["library-image-url", "library-add-image", "library-note-text", "library-add-note"].forEach(id => {
            const el = this.byId(id);
            if (el) el.disabled = pageTorn;
        });

        paper.innerHTML = pageTorn
            ? this.renderTornPage(page)
            : this.renderWritablePage(page, canEdit);

        paper.classList.toggle("drawing-mode", this.drawingMode);
        paper.classList.toggle("eraser-mode", this.eraserMode);
        paper.classList.toggle("torn", pageTorn);
        paper.classList.toggle("uv-light-on", this.uvLightOn);

        this.bindPageSurface(page, canEdit, canDraw);
        this.applyHighlights(page.highlightWords || []);

    }

    renderTornPage(page) {

        return `
            <div class="library-page-number">Pagina ${this.esc(page.pageNumber)} | pagina arrancada</div>
            <div class="library-torn-page">
                <i></i>
                <i></i>
                <i></i>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

    }

    applyCurrentPageVisuals(page = this.currentPage(), fromControls = false) {

        const paper = this.byId("library-page-view");
        const book = this.activeBook;
        if (!paper || !book) return;

        const ownStyle = fromControls
            ? (this.byId("library-page-own-style")?.value || "")
            : (page?.pageStyle || "");
        const ownColor = fromControls
            ? (this.byId("library-page-own-color")?.value || "")
            : (page?.pageColor || "");
        const style = ownStyle || book.pageStyle || "middle";
        const color = style === "custom"
            ? (ownColor || page?.pageColor || book.pageColor || "#d8c49c")
            : "#d8c49c";

        paper.style.setProperty("--library-page-color", color);
        paper.classList.remove("page-style-a4", "page-style-middle", "page-style-aged", "page-style-custom");
        paper.classList.add(`page-style-${style}`);
        paper.classList.toggle("uv-light-on", this.uvLightOn);

    }

    renderWritablePage(page, canEdit) {

        return `
            <div class="library-page-number">Pagina ${this.esc(page.pageNumber)} | ${this.esc(page.ownerName || "Anonimo")}</div>
            <h3 id="library-paper-title" class="library-written-page-title ${page.title ? "" : "empty"}" contenteditable="${canEdit ? "true" : "false"}">${this.esc(page.title || "")}</h3>
            <div id="library-editor" class="book-page-editor" contenteditable="${canEdit ? "true" : "false"}">${page.content || ""}</div>
            <canvas id="library-drawing-canvas" class="library-drawing-canvas" width="900" height="1120"></canvas>
            <div id="library-image-layer" class="library-image-layer">
                ${(page.images || []).map(image => this.renderImage(page, image)).join("")}
            </div>
            <div id="library-note-layer" class="library-note-layer">
                ${(page.notes || []).map(note => this.renderNote(page, note)).join("")}
            </div>
            <div class="library-page-refs">
                ${(page.references || []).map(ref => `
                    <button class="library-ref-link" data-book="${this.esc(ref.bookId)}" data-page="${this.esc(ref.pageNumber || 1)}" type="button">
                        ${this.esc(ref.label || "Referencia")}
                    </button>
                `).join("")}
            </div>
        `;

    }

    bindPageSurface(page, canEdit, canDraw) {

        const editor = this.byId("library-editor");
        if (editor) {
            editor.addEventListener("input", () => { this.dirty = true; });
            editor.addEventListener("mouseup", () => this.saveEditorSelection());
            editor.addEventListener("keyup", () => this.saveEditorSelection());
        }

        const title = this.byId("library-paper-title");
        if (title) {
            title.addEventListener("input", () => {
                this.set("library-page-title", title.textContent.trim());
                this.dirty = true;
            });
        }

        this.drawExistingLines(page);
        this.bindCanvas(page, canDraw);
        this.bindMovableImages(page, canEdit);
        this.bindNotes(page);
        this.bindUvLightMovement();

        this.container.querySelectorAll(".library-ref-link").forEach(button => {
            button.addEventListener("click", () => this.openBook(button.dataset.book, Number(button.dataset.page || 1), true));
        });

    }

    bindUvLightMovement() {

        const paper = this.byId("library-page-view");
        if (!paper) return;

        paper.addEventListener("pointermove", event => {
            if (!this.uvLightOn) return;
            const rect = paper.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            paper.style.setProperty("--uv-x", `${x}px`);
            paper.style.setProperty("--uv-y", `${y}px`);
            this.uvSpot = { x, y };
            this.updateUvReveal();
            this.drawExistingLines(this.currentPage() || { drawings: [] });
        });

    }

    updateUvReveal() {

        const paper = this.byId("library-page-view");
        if (!paper || !this.uvLightOn || !this.uvSpot) return;

        const paperRect = paper.getBoundingClientRect();
        const radius = 160;

        paper.querySelectorAll(".library-uv-text").forEach(node => {
            const rect = node.getBoundingClientRect();
            const closestX = Math.max(rect.left - paperRect.left, Math.min(this.uvSpot.x, rect.right - paperRect.left));
            const closestY = Math.max(rect.top - paperRect.top, Math.min(this.uvSpot.y, rect.bottom - paperRect.top));
            const dx = closestX - this.uvSpot.x;
            const dy = closestY - this.uvSpot.y;
            node.classList.toggle("revealed", Math.sqrt(dx * dx + dy * dy) <= radius);
        });

    }

    drawExistingLines(page) {

        const canvas = this.byId("library-drawing-canvas");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        (page.drawings || []).forEach(line => {
            if (line.uv && !this.uvLightOn) return;
            if (line.type === "fill") {
                ctx.save();
                if (line.uv && !this.applyUvCanvasClip(ctx, canvas)) {
                    ctx.restore();
                    return;
                }
                if (Array.isArray(line.spans) && line.spans.length) {
                    this.drawFillSpans(ctx, line);
                } else if (Number.isFinite(Number(line.x)) && Number.isFinite(Number(line.y))) {
                    this.floodFillCanvas(ctx, canvas, line);
                } else {
                    ctx.fillStyle = line.uv ? "rgba(183, 120, 255, .18)" : (line.color || "rgba(0,0,0,.08)");
                    ctx.globalAlpha = Number(line.opacity ?? .18);
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.restore();
                return;
            }
            if (line.type !== "line" || !line.points?.length) return;
            if (line.uv && !this.uvLightOn) return;
            ctx.save();
            if (line.uv && !this.applyUvCanvasClip(ctx, canvas)) {
                ctx.restore();
                return;
            }
            ctx.strokeStyle = line.uv ? "rgba(183, 120, 255, .95)" : (line.color || "#000");
            ctx.shadowColor = line.uv ? "rgba(183, 120, 255, .75)" : "transparent";
            ctx.shadowBlur = line.uv ? 10 : 0;
            ctx.lineWidth = Number(line.size || 3);
            ctx.lineCap = line.penType === "marker" ? "square" : "round";
            ctx.lineJoin = "round";
            ctx.globalAlpha = Number(line.opacity ?? 1);
            if (line.penType === "scratch") ctx.setLineDash([8, 6]);
            else ctx.setLineDash([]);
            if (line.penType === "brush" && !line.uv) {
                ctx.shadowColor = line.color || "#000";
                ctx.shadowBlur = 2;
            }
            ctx.beginPath();
            line.points.forEach((point, index) => {
                if (index === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
            ctx.restore();
        });

    }

    applyUvCanvasClip(ctx, canvas) {

        if (!this.uvSpot) return false;

        const paper = this.byId("library-page-view");
        if (!paper) return false;

        const rect = paper.getBoundingClientRect();
        const x = this.uvSpot.x / rect.width * canvas.width;
        const y = this.uvSpot.y / rect.height * canvas.height;
        const radius = 160 / rect.width * canvas.width;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        return true;

    }

    floodFillCanvas(ctx, canvas, fill) {

        const x = Math.max(0, Math.min(canvas.width - 1, Math.round(Number(fill.x || 0))));
        const y = Math.max(0, Math.min(canvas.height - 1, Math.round(Number(fill.y || 0))));
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        const start = (y * canvas.width + x) * 4;
        const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
        const paint = this.colorToRgba(fill.uv ? "#b778ff" : (fill.color || "#000000"), Number(fill.opacity ?? .16));
        const tolerance = 18;
        const boundaryAlpha = 38;

        if (!this.canFloodPixel(target, target, paint, tolerance, boundaryAlpha)) return;

        const stack = [[x, y]];
        const visited = new Uint8Array(canvas.width * canvas.height);

        while (stack.length) {
            const [px, py] = stack.pop();
            if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue;

            const pixelIndex = py * canvas.width + px;
            if (visited[pixelIndex]) continue;
            visited[pixelIndex] = 1;

            const offset = pixelIndex * 4;
            const current = [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
            if (!this.canFloodPixel(current, target, paint, tolerance, boundaryAlpha)) continue;

            data[offset] = paint[0];
            data[offset + 1] = paint[1];
            data[offset + 2] = paint[2];
            data[offset + 3] = paint[3];

            stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
        }

        ctx.putImageData(image, 0, 0);

    }

    buildFloodFillSpans(ctx, canvas, fill) {

        const x = Math.max(0, Math.min(canvas.width - 1, Math.round(Number(fill.x || 0))));
        const y = Math.max(0, Math.min(canvas.height - 1, Math.round(Number(fill.y || 0))));
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        const start = (y * canvas.width + x) * 4;
        const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
        const paint = this.colorToRgba(fill.uv ? "#b778ff" : (fill.color || "#000000"), Number(fill.opacity ?? .16));
        const tolerance = 18;
        const boundaryAlpha = 38;

        if (!this.canFloodPixel(target, target, paint, tolerance, boundaryAlpha)) return [];

        const stack = [[x, y]];
        const visited = new Uint8Array(canvas.width * canvas.height);
        const byRow = new Map();

        while (stack.length) {
            const [px, py] = stack.pop();
            if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue;

            const pixelIndex = py * canvas.width + px;
            if (visited[pixelIndex]) continue;
            visited[pixelIndex] = 1;

            const offset = pixelIndex * 4;
            const current = [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
            if (!this.canFloodPixel(current, target, paint, tolerance, boundaryAlpha)) continue;

            if (!byRow.has(py)) byRow.set(py, []);
            byRow.get(py).push(px);

            stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
        }

        return [...byRow.entries()].flatMap(([row, xs]) => {
            xs.sort((a, b) => a - b);
            const spans = [];
            let startX = xs[0];
            let lastX = xs[0];

            for (let i = 1; i < xs.length; i++) {
                if (xs[i] === lastX + 1) {
                    lastX = xs[i];
                    continue;
                }
                spans.push([row, startX, lastX]);
                startX = xs[i];
                lastX = xs[i];
            }

            if (Number.isFinite(startX)) spans.push([row, startX, lastX]);
            return spans;
        });

    }

    drawFillSpans(ctx, fill) {

        ctx.fillStyle = fill.uv ? "rgba(183, 120, 255, .18)" : (fill.color || "rgba(0,0,0,.08)");
        ctx.globalAlpha = Number(fill.opacity ?? .18);

        fill.spans.forEach(span => {
            const [y, x1, x2] = span;
            ctx.fillRect(x1, y, Math.max(1, x2 - x1 + 1), 1);
        });

    }

    canFloodPixel(current, target, paint, tolerance, boundaryAlpha) {

        const alreadyPainted = Math.abs(current[0] - paint[0]) <= tolerance
            && Math.abs(current[1] - paint[1]) <= tolerance
            && Math.abs(current[2] - paint[2]) <= tolerance
            && Math.abs(current[3] - paint[3]) <= tolerance;

        if (alreadyPainted) return false;

        const targetTransparent = target[3] < boundaryAlpha;
        if (targetTransparent) return current[3] < boundaryAlpha;

        return Math.abs(current[0] - target[0]) <= tolerance
            && Math.abs(current[1] - target[1]) <= tolerance
            && Math.abs(current[2] - target[2]) <= tolerance
            && Math.abs(current[3] - target[3]) <= tolerance;

    }

    colorToRgba(color, opacity = 1) {

        const hex = String(color || "#000000").trim();
        const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
        const full = normalized.length === 3
            ? normalized.split("").map(char => char + char).join("")
            : normalized.padEnd(6, "0").slice(0, 6);

        return [
            parseInt(full.slice(0, 2), 16) || 0,
            parseInt(full.slice(2, 4), 16) || 0,
            parseInt(full.slice(4, 6), 16) || 0,
            Math.max(0, Math.min(255, Math.round(opacity * 255)))
        ];

    }

    bindCanvas(page, canDraw) {

        const canvas = this.byId("library-drawing-canvas");
        if (!canvas || !canDraw) return;

        canvas.addEventListener("pointerdown", event => {
            if (!this.drawingMode) return;
            event.preventDefault();
            canvas.setPointerCapture?.(event.pointerId);

            const tool = this.byId("library-drawing-tool")?.value || "pen";
            if (tool === "eyedropper") {
                this.pickDrawingColor(canvas, event, page);
                return;
            }
            if (tool === "bucket") {
                this.fillDrawingPage(canvas, event, page);
                return;
            }

            if (this.eraserMode) {
                this.erasing = true;
                this.eraseLineAt(canvas, event, page);
                return;
            }

            this.drawing = true;
            this.currentLine = this.createDrawingLine();
            this.addLinePoint(canvas, event);
        });

        canvas.addEventListener("pointermove", event => {
            if (!this.drawingMode) return;
            event.preventDefault();

            if (this.erasing) {
                this.eraseLineAt(canvas, event, page);
                return;
            }
            if (!this.drawing) return;
            this.addLinePoint(canvas, event);
            this.drawExistingLines({ drawings: [...(page.drawings || []), this.currentLine] });
        });

        const finish = event => {
            canvas.releasePointerCapture?.(event.pointerId);

            if (this.erasing) {
                this.erasing = false;
                this.dirty = true;
                this.drawingRedoStack = [];
                this.saveDrawings(page);
                return;
            }
            if (!this.drawing || !this.currentLine) return;
            page.drawings = [...(page.drawings || []), this.currentLine];
            this.drawingRedoStack = [];
            this.currentLine = null;
            this.drawing = false;
            this.dirty = true;
            this.saveDrawings(page);
        };

        canvas.addEventListener("pointerup", finish);
        canvas.addEventListener("pointercancel", finish);
        canvas.addEventListener("lostpointercapture", () => {
            this.erasing = false;
            this.drawing = false;
        });

    }

    createDrawingLine() {

        const penType = this.byId("library-pen-type")?.value || "normal";
        const brushSize = this.num("library-brush-size", 3);
        const brushOpacity = this.num("library-brush-opacity", 100) / 100;
        const presets = {
            thin: { size: Math.max(1, brushSize * .5), opacity: brushOpacity },
            normal: { size: brushSize, opacity: brushOpacity },
            marker: { size: Math.max(4, brushSize * 1.8), opacity: brushOpacity },
            brush: { size: Math.max(3, brushSize * 1.35), opacity: brushOpacity },
            scratch: { size: Math.max(1, brushSize * .75), opacity: brushOpacity }
        };
        const preset = presets[penType] || presets.normal;

        return {
            type: "line",
            color: this.byId("library-drawing-color")?.value || "#000",
            size: preset.size,
            opacity: preset.opacity,
            penType,
            uv: this.uvDrawingMode,
            points: []
        };

    }

    async fillDrawingPage(canvas, event, page) {

        if (!page || !canvas) return;
        const point = this.eventToCanvasPoint(canvas, event);

        const fill = {
            type: "fill",
            color: this.byId("library-drawing-color")?.value || "#000",
            opacity: this.num("library-brush-opacity", 100) / 100,
            x: point.x,
            y: point.y,
            uv: this.uvDrawingMode,
            createdAt: new Date().toISOString()
        };

        fill.spans = this.buildFloodFillSpans(canvas.getContext("2d"), canvas, fill);
        if (!fill.spans.length) return;

        page.drawings = [...(page.drawings || []), fill];
        this.drawingRedoStack = [];
        this.dirty = true;
        this.drawExistingLines(page);
        await this.saveDrawings(page);

    }

    pickDrawingColor(canvas, event, page) {

        const point = this.eventToCanvasPoint(canvas, event);
        const nearest = [...(page.drawings || [])].reverse().find(line => {
            if (line.type === "fill") return true;
            return (line.points || []).some(p => {
                const dx = Number(p.x || 0) - point.x;
                const dy = Number(p.y || 0) - point.y;
                return Math.sqrt(dx * dx + dy * dy) <= 24;
            });
        });

        if (nearest?.color) this.set("library-drawing-color", nearest.color);

    }

    async undoDrawing() {

        const page = this.currentPage();
        if (!page || this.isTornPage(page)) return;

        const drawings = [...(page.drawings || [])];
        const removed = drawings.pop();
        if (!removed) return;

        page.drawings = drawings;
        this.drawingRedoStack.push(removed);
        this.dirty = true;
        this.drawExistingLines(page);
        await this.saveDrawings(page);

    }

    async redoDrawing() {

        const page = this.currentPage();
        if (!page || this.isTornPage(page)) return;

        const restored = this.drawingRedoStack.pop();
        if (!restored) return;

        page.drawings = [...(page.drawings || []), restored];
        this.dirty = true;
        this.drawExistingLines(page);
        await this.saveDrawings(page);

    }

    eraseLineAt(canvas, event, page) {

        const point = this.eventToCanvasPoint(canvas, event);
        const radius = this.num("library-eraser-size", 26);
        const before = JSON.stringify(page.drawings || []);

        page.drawings = (page.drawings || []).flatMap(line => {
            if (line.type !== "line" || !Array.isArray(line.points)) return [line];

            const fragments = [];
            let current = [];

            line.points.forEach(linePoint => {
                const dx = Number(linePoint.x || 0) - point.x;
                const dy = Number(linePoint.y || 0) - point.y;
                const insideEraser = Math.sqrt(dx * dx + dy * dy) <= radius;

                if (insideEraser) {
                    if (current.length > 1) fragments.push(current);
                    current = [];
                    return;
                }

                current.push(linePoint);
            });

            if (current.length > 1) fragments.push(current);

            return fragments.map(fragment => ({
                ...line,
                points: fragment
            }));
        });

        if (JSON.stringify(page.drawings || []) !== before) {
            this.dirty = true;
            this.drawExistingLines(page);
        }

    }

    async saveDrawings(page) {

        try {
            const updated = await MC.Services.Library.updateDrawings(page.id, page.drawings || []);
            this.pages[this.activePageIndex] = updated;
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao salvar desenho.");
        }

    }

    addLinePoint(canvas, event) {

        this.currentLine.points.push(this.eventToCanvasPoint(canvas, event));

    }

    eventToCanvasPoint(canvas, event) {

        const rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((event.clientX - rect.left) / rect.width * canvas.width),
            y: Math.round((event.clientY - rect.top) / rect.height * canvas.height)
        };

    }

    renderImage(page, image) {

        const style = `left:${Number(image.x || 20)}%;top:${Number(image.y || 20)}%;width:${Number(image.width || 24)}%;transform:rotate(${Number(image.rotation || 0)}deg);`;
        const canManage = MC.Services.Library.canManagePageAsset(page, image);

        return `
            <div class="library-page-image" data-id="${this.esc(image.id)}" style="${style}">
                <img src="${this.esc(image.url)}" alt="">
                ${canManage ? `
                    <div class="library-image-tools">
                        <button class="library-image-tool library-remove-image" data-id="${this.esc(image.id)}" type="button">x</button>
                        <button class="library-image-tool library-image-grow" data-id="${this.esc(image.id)}" type="button">+</button>
                        <button class="library-image-tool library-image-shrink" data-id="${this.esc(image.id)}" type="button">-</button>
                        <button class="library-image-tool library-image-rotate-left" data-id="${this.esc(image.id)}" type="button">L</button>
                        <button class="library-image-tool library-image-rotate-right" data-id="${this.esc(image.id)}" type="button">R</button>
                    </div>
                    <button class="library-image-drag" data-id="${this.esc(image.id)}" type="button" title="Mover imagem"></button>
                ` : ""}
            </div>
        `;

    }

    renderImageZoom() {

        return `
            <div id="library-image-zoom" class="library-image-zoom">
                <button id="library-close-image-zoom" type="button">Fechar</button>
                <img id="library-image-zoom-img" src="${this.esc(this.zoomImage.url)}" alt="" style="transform:translate(${this.zoomOffset.x}px, ${this.zoomOffset.y}px) scale(${this.zoomScale});">
            </div>
        `;

    }

    async bindMovableImages(page) {

        this.byId("library-close-image-zoom")?.addEventListener("click", () => {
            this.zoomImage = null;
            this.zoomScale = 1;
            this.zoomOffset = { x: 0, y: 0 };
            document.getElementById("library-image-zoom")?.remove();
        });

        const zoomOverlay = document.getElementById("library-image-zoom");
        const zoomImg = document.getElementById("library-image-zoom-img");

        zoomOverlay?.addEventListener("wheel", event => {
            event.preventDefault();
            this.zoomScale = Math.max(1, Math.min(5, this.zoomScale + (event.deltaY < 0 ? 0.18 : -0.18)));
            this.applyZoomTransform();
        }, { passive:false });

        zoomImg?.addEventListener("dblclick", () => {
            this.zoomScale = this.zoomScale >= 2.8 ? 1 : Math.min(5, this.zoomScale + 0.8);
            if (this.zoomScale === 1) this.zoomOffset = { x: 0, y: 0 };
            this.applyZoomTransform();
        });

        zoomImg?.addEventListener("pointerdown", event => {
            event.preventDefault();
            const startX = event.clientX;
            const startY = event.clientY;
            const baseX = this.zoomOffset.x;
            const baseY = this.zoomOffset.y;

            const move = moveEvent => {
                this.zoomOffset = {
                    x: baseX + (moveEvent.clientX - startX),
                    y: baseY + (moveEvent.clientY - startY)
                };
                this.applyZoomTransform();
            };

            const up = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
                zoomImg.releasePointerCapture?.(event.pointerId);
            };

            zoomImg.setPointerCapture?.(event.pointerId);
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
        });

        zoomOverlay?.addEventListener("click", event => {
            if (event.target !== zoomOverlay) return;
            this.zoomImage = null;
            this.zoomScale = 1;
            this.zoomOffset = { x: 0, y: 0 };
            zoomOverlay.remove();
        });

        this.container.querySelectorAll(".library-remove-image").forEach(button => {
            button.addEventListener("click", async (event) => {
                event.stopPropagation();
                await this.deleteImage(page, button.dataset.id);
            });
        });

        this.container.querySelectorAll(".library-image-grow").forEach(button => {
            button.addEventListener("click", async (event) => {
                event.stopPropagation();
                await this.resizeImage(page, button.dataset.id, 5);
            });
        });

        this.container.querySelectorAll(".library-image-shrink").forEach(button => {
            button.addEventListener("click", async (event) => {
                event.stopPropagation();
                await this.resizeImage(page, button.dataset.id, -5);
            });
        });

        this.container.querySelectorAll(".library-image-rotate-left").forEach(button => {
            button.addEventListener("click", async (event) => {
                event.stopPropagation();
                await this.rotateImage(page, button.dataset.id, -15);
            });
        });

        this.container.querySelectorAll(".library-image-rotate-right").forEach(button => {
            button.addEventListener("click", async (event) => {
                event.stopPropagation();
                await this.rotateImage(page, button.dataset.id, 15);
            });
        });

        this.container.querySelectorAll(".library-page-image").forEach(node => {
            node.addEventListener("dblclick", (event) => {
                if (event.target.closest("button")) return;
                const image = (page.images || []).find(entry => entry.id === node.dataset.id);
                if (!image) return;
                this.zoomImage = image;
                this.zoomScale = 1;
                this.zoomOffset = { x: 0, y: 0 };
                this.openImageZoom();
            });

            const handle = node.querySelector(".library-image-drag");
            handle?.addEventListener("pointerdown", event => {
                const image = (page.images || []).find(entry => entry.id === node.dataset.id);
                if (!image || !MC.Services.Library.canManagePageAsset(page, image)) return;
                event.preventDefault();
                event.stopPropagation();
                const startX = event.clientX;
                const startY = event.clientY;
                const baseX = Number(image?.x || 20);
                const baseY = Number(image?.y || 20);
                const parent = node.parentElement.getBoundingClientRect();

                const move = moveEvent => {
                    const dx = (moveEvent.clientX - startX) / parent.width * 100;
                    const dy = (moveEvent.clientY - startY) / parent.height * 100;
                    image.x = Math.max(0, Math.min(85, baseX + dx));
                    image.y = Math.max(0, Math.min(85, baseY + dy));
                    node.style.left = `${image.x}%`;
                    node.style.top = `${image.y}%`;
                    this.dirty = true;
                };

                const up = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", up);
                    handle.releasePointerCapture?.(event.pointerId);
                    this.saveImage(page, image);
                };

                handle.setPointerCapture?.(event.pointerId);
                window.addEventListener("pointermove", move);
                window.addEventListener("pointerup", up);
            });
        });

    }

    openImageZoom() {

        document.getElementById("library-image-zoom")?.remove();
        document.body.insertAdjacentHTML("beforeend", this.renderImageZoom());
        this.bindMovableImages(this.currentPage());

    }

    applyZoomTransform() {

        const zoomImg = document.getElementById("library-image-zoom-img");
        if (!zoomImg) return;

        zoomImg.style.transform = `translate(${this.zoomOffset.x}px, ${this.zoomOffset.y}px) scale(${this.zoomScale})`;

    }

    async resizeImage(page, imageId, delta) {

        const image = (page.images || []).find(entry => entry.id === imageId);
        if (!image) return;

        image.width = Math.max(6, Math.min(92, Number(image.width || 26) + delta));
        await this.saveImage(page, image);

    }

    async rotateImage(page, imageId, delta) {

        const image = (page.images || []).find(entry => entry.id === imageId);
        if (!image) return;

        image.rotation = Number(image.rotation || 0) + delta;
        await this.saveImage(page, image);

    }

    async saveImage(page, image) {

        try {
            const updated = await MC.Services.Library.updateImage(page.id, image.id, image);
            this.pages[this.activePageIndex] = updated;
            this.dirty = false;
            this.renderOpenBook();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao salvar imagem.");
        }

    }

    async deleteImage(page, imageId) {

        try {
            const updated = await MC.Services.Library.deleteImage(page.id, imageId);
            this.pages[this.activePageIndex] = updated;
            this.zoomImage = null;
            this.dirty = false;
            this.renderOpenBook();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao remover imagem.");
        }

    }

    renderNote(page, note) {

        const canManage = MC.Services.Library.canManagePageAsset(page, note);

        return `
            <button class="library-note ${note.open ? "open" : ""}" data-id="${this.esc(note.id)}" style="left:${Number(note.x || 30)}%;top:${Number(note.y || 30)}%;" type="button">
                <span></span>
                ${canManage ? `<b class="library-note-remove" data-id="${this.esc(note.id)}">x</b>` : ""}
                <p>${this.esc(note.text || "")}</p>
            </button>
        `;

    }

    async bindNotes(page) {

        this.container.querySelectorAll(".library-note").forEach(noteEl => {
            noteEl.addEventListener("click", (event) => {
                if (event.target.closest(".library-note-remove")) return;
                const note = (page.notes || []).find(entry => entry.id === noteEl.dataset.id);
                if (!note) return;
                note.open = !note.open;
                noteEl.classList.toggle("open", note.open);
                this.saveNotePosition(page, note);
            });

            noteEl.addEventListener("pointerdown", event => {
                const note = (page.notes || []).find(entry => entry.id === noteEl.dataset.id);
                if (!note || event.detail > 1) return;
                const startX = event.clientX;
                const startY = event.clientY;
                const baseX = Number(note.x || 30);
                const baseY = Number(note.y || 30);
                const parent = noteEl.parentElement.getBoundingClientRect();

                const move = moveEvent => {
                    const dx = (moveEvent.clientX - startX) / parent.width * 100;
                    const dy = (moveEvent.clientY - startY) / parent.height * 100;
                    note.x = Math.max(0, Math.min(88, baseX + dx));
                    note.y = Math.max(0, Math.min(88, baseY + dy));
                    noteEl.style.left = `${note.x}%`;
                    noteEl.style.top = `${note.y}%`;
                };

                const up = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", up);
                    this.saveNotePosition(page, note);
                };

                window.addEventListener("pointermove", move);
                window.addEventListener("pointerup", up);
            });
        });

        this.container.querySelectorAll(".library-note-remove").forEach(button => {
            button.addEventListener("click", async (event) => {
                event.stopPropagation();
                await this.deleteNote(page, button.dataset.id);
            });
        });

    }

    async deleteNote(page, noteId) {

        try {
            const updated = await MC.Services.Library.deleteNote(page.id, noteId);
            this.pages[this.activePageIndex] = updated;
            this.renderOpenBook();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao remover nota.");
        }

    }

    async saveNotePosition(page, note) {

        try { await MC.Services.Library.updateNote(page.id, note.id, note); }
        catch (err) {}

    }

    currentPage() {

        return this.pages[this.activePageIndex] || null;

    }

    isTornPage(page) {

        return page?.torn === true || page?.torn === "true" || page?.torn === 1 || page?.torn === "1";

    }

    async saveBeforePageNavigation() {

        const page = this.currentPage();
        if (!page || this.isTornPage(page) || page.deleted) {
            this.dirty = false;
            return true;
        }

        return await this.savePage({ silent: true, render: false });

    }

    async saveBook() {

        if (!this.activeBook) return;

        try {
            const pagesSaved = await this.saveAllPages({ silent: true });
            if (!pagesSaved) {
                await MC.UI.alert("Nao foi possivel salvar todas as paginas.");
                return;
            }
            this.activeBook = await MC.Services.Library.updateBook(this.activeBook.id, {
                title: this.byId("library-edit-title")?.value.trim() || this.activeBook.title,
                seal: this.byId("library-edit-seal")?.value || this.activeBook.seal,
                fontFamily: this.byId("library-edit-font")?.value || this.activeBook.fontFamily,
                textColor: this.byId("library-edit-color")?.value || this.activeBook.textColor,
                coverColor: this.byId("library-cover-color")?.value || this.activeBook.coverColor,
                coverBorderColor: this.byId("library-cover-border")?.value || this.activeBook.coverBorderColor,
                pageStyle: this.byId("library-page-style")?.value || this.activeBook.pageStyle,
                pageColor: this.byId("library-page-color")?.value || this.activeBook.pageColor,
                password: this.byId("library-edit-password")?.value.trim() || ""
            });
            this.dirty = false;
            await this.loadBooks();
            this.renderOpenBook();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao salvar livro.");
        }

    }

    async deleteBook() {

        if (!this.activeBook || !await MC.UI.confirm("Tirar este livro da prateleira para sempre?")) return;

        try {
            await MC.Services.Library.deleteBook(this.activeBook.id);
            this.closeReader({ skipSave: true });
            await this.loadBooks();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao apagar livro.");
        }

    }

    async addPage() {

        if (!this.activeBook) return;

        try {
            const page = await MC.Services.Library.createPage(this.activeBook.id, {
                title: "",
                content: "<p></p>"
            });
            this.pages = await MC.Services.Library.findPages(this.activeBook.id);
            this.activePageIndex = this.pages.findIndex(entry => entry.id === page.id);
            this.dirty = false;
            this.renderOpenBook();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao criar pagina.");
        }

    }

    async savePage(options = {}) {

        const page = this.currentPage();
        if (!page) return true;
        if (this.isTornPage(page) || page.deleted) {
            this.dirty = false;
            return true;
        }

        try {
            const updated = await MC.Services.Library.updatePage(page.id, this.pageSavePayload(page));
            this.pages[this.activePageIndex] = updated;
            this.dirty = false;
            if (options.render !== false) this.renderOpenBook();
            return true;
        } catch (err) {
            if (!options.silent) await MC.UI.alert(err.message || "Erro ao salvar pagina.");
            return false;
        }

    }

    async saveAllPages(options = {}) {

        if (!this.pages.length) return true;

        const current = this.currentPage();
        const currentPageNumber = current?.pageNumber;
        const currentPageId = current?.id;

        if (current && !this.isTornPage(current) && !current.deleted) {
            const saved = await this.savePage({ silent: options.silent, render: false });
            if (!saved) return false;
        }

        if (this.activeBook?.id) {
            this.pages = await MC.Services.Library.findPages(this.activeBook.id);
            const idIndex = this.pages.findIndex(page => page.id === currentPageId);
            const nextIndex = idIndex >= 0
                ? idIndex
                : this.pages.findIndex(page => Number(page.pageNumber) === Number(currentPageNumber));
            this.activePageIndex = Math.max(0, nextIndex);
        }

        this.dirty = false;
        return true;

    }

    pageSavePayload(page) {

        const editor = this.byId("library-editor");
        const paperTitle = this.byId("library-paper-title")?.textContent?.trim() || "";
        const sideTitle = this.byId("library-page-title")?.value.trim() || "";
    
        return {
            title: sideTitle || paperTitle,
            content: this.stripHighlightMarkup(editor?.innerHTML || page.content || ""),
            drawings: page.drawings || [],
            images: page.images || [],
            notes: page.notes || [],
            references: page.references || [],
            highlightWords: this.parseWords(this.byId("library-highlight-words")?.value || ""),
            pageStyle: this.byId("library-page-own-style")?.value || "",
            pageColor: this.byId("library-page-own-color")?.value || ""
        };
    
    }

    async saveBeforeLeavingBook() {

        if (!this.activeBook) return true;

        const pagesSaved = await this.saveAllPages({ silent: true });
        if (!pagesSaved) {
            await MC.UI.alert("Nao foi possivel salvar as paginas antes de sair.");
            return false;
        }

        try {
            this.activeBook = await MC.Services.Library.updateBook(this.activeBook.id, {
                title: this.byId("library-edit-title")?.value.trim() || this.activeBook.title,
                seal: this.byId("library-edit-seal")?.value || this.activeBook.seal,
                fontFamily: this.byId("library-edit-font")?.value || this.activeBook.fontFamily,
                textColor: this.byId("library-edit-color")?.value || this.activeBook.textColor,
                coverColor: this.byId("library-cover-color")?.value || this.activeBook.coverColor,
                coverBorderColor: this.byId("library-cover-border")?.value || this.activeBook.coverBorderColor,
                pageStyle: this.byId("library-page-style")?.value || this.activeBook.pageStyle,
                pageColor: this.byId("library-page-color")?.value || this.activeBook.pageColor,
                password: this.byId("library-edit-password")?.value.trim() || ""
            });
            this.dirty = false;
            await this.loadBooks();
            return true;
        } catch (err) {
            await MC.UI.alert(err.message || "Nao foi possivel salvar o livro antes de sair.");
            return false;
        }

    }

    async tearPage() {

        const page = this.currentPage();
        if (!this.activeBook || !page || !await MC.UI.confirm("Arrancar esta pagina? A marca ficara no livro.")) return;

        try {
            this.pages[this.activePageIndex] = await MC.Services.Library.tearPage(this.activeBook.id, page.id);
            this.dirty = false;
            this.renderOpenBook();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao arrancar pagina.");
        }

    }

    async changePage(delta) {

        if (!this.pages.length) return;
        if (!await this.saveBeforePageNavigation()) return;

        const nextIndex = Math.max(0, Math.min(this.pages.length - 1, this.activePageIndex + delta));
        this.goToPageIndex(nextIndex, true);

    }

    async jumpPage() {

        const number = Number(this.byId("library-page-jump")?.value || 1);
        const index = this.pages.findIndex(page => Number(page.pageNumber) === number);
        if (index < 0) {
            await MC.UI.alert("Pagina nao encontrada.");
            return;
        }
        if (!await this.saveBeforePageNavigation()) return;
        this.goToPageIndex(index, true);

    }

    goToPageIndex(index, pushHistory = true) {

        if (index === this.activePageIndex) return;

        if (pushHistory && this.activeBook && this.currentPage()) {
            this.pageHistory.push({
                bookId: this.activeBook.id,
                pageNumber: this.currentPage().pageNumber
            });
        }

        this.activePageIndex = index;
        this.drawingRedoStack = [];
        this.renderOpenBook();

    }

    async backPage() {

        if (!this.pageHistory.length) {
            this.closeReader();
            return;
        }

        if (!await this.saveBeforePageNavigation()) return;

        const previous = this.pageHistory.pop();

        if (previous.bookId !== this.activeBook?.id) {
            await this.openBook(previous.bookId, previous.pageNumber, false);
            return;
        }

        const index = this.pages.findIndex(page => Number(page.pageNumber) === Number(previous.pageNumber));
        if (index >= 0) {
            this.goToPageIndex(index, false);
        }

    }

    applyTextColor() {

        const color = this.byId("library-text-color")?.value || "#000000";
        this.restoreEditorSelection();
        document.execCommand("foreColor", false, color);
        this.dirty = true;

    }

    applyUvText() {

        this.restoreEditorSelection();

        const selection = window.getSelection?.();
        const editor = this.byId("library-editor");

        if (selection && selection.rangeCount && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            if (!editor || !editor.contains(range.commonAncestorContainer)) return;
            const span = document.createElement("span");
            span.className = "library-uv-text";
            span.appendChild(range.extractContents());
            range.insertNode(span);
            selection.removeAllRanges();
            selection.selectAllChildren(span);
            this.savedSelection = selection.getRangeAt(0).cloneRange();
            this.dirty = true;
        }

    }

    applySelectionFont(fontName) {

        if (!fontName) return;

        this.restoreEditorSelection();

        const selection = window.getSelection?.();
        if (selection && selection.rangeCount && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const span = document.createElement("span");
            span.style.fontFamily = fontName;
            span.appendChild(range.extractContents());
            range.insertNode(span);
            selection.removeAllRanges();
            selection.selectAllChildren(span);
        } else {
            document.execCommand("fontName", false, fontName);
        }

        this.byId("library-selection-font").value = "";
        this.dirty = true;

    }

    applySelectionSize(size) {

        if (!size) return;

        this.restoreEditorSelection();
        this.wrapSelectionWithStyle({ fontSize: size });
        this.byId("library-selection-size").value = "";
        this.dirty = true;

    }

    wrapSelectionWithStyle(styles = {}) {

        const editor = this.byId("library-editor");
        const selection = window.getSelection?.();

        if (selection && selection.rangeCount && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            if (!editor || !editor.contains(range.commonAncestorContainer)) return;
            const span = document.createElement("span");
            Object.assign(span.style, styles);
            span.appendChild(range.extractContents());
            range.insertNode(span);
            selection.removeAllRanges();
            selection.selectAllChildren(span);
            this.savedSelection = selection.getRangeAt(0).cloneRange();
        }

    }

    applyFormat(button) {

        if (!button || button.disabled) return;

        this.restoreEditorSelection();

        if (button.dataset.block) {
            document.execCommand("formatBlock", false, button.dataset.block);
        } else if (button.dataset.command) {
            document.execCommand(button.dataset.command, false, null);
        }

        this.dirty = true;

    }

    saveEditorSelection() {

        const editor = this.byId("library-editor");
        const selection = window.getSelection?.();

        if (!editor || !selection || !selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        if (editor.contains(range.commonAncestorContainer)) {
            this.savedSelection = range.cloneRange();
        }

    }

    restoreEditorSelection() {

        const editor = this.byId("library-editor");
        const selection = window.getSelection?.();

        if (!editor || !selection) return;

        editor.focus();

        if (this.savedSelection) {
            selection.removeAllRanges();
            selection.addRange(this.savedSelection);
        }

    }

    toggleDrawingMode() {

        this.drawingMode = !this.drawingMode;
        if (!this.drawingMode) this.eraserMode = false;
        this.syncDrawingButtons();

    }

    toggleUvDrawingMode() {

        this.uvDrawingMode = !this.uvDrawingMode;
        if (this.uvDrawingMode) this.drawingMode = true;
        this.syncDrawingButtons();

    }

    toggleUvLight() {

        this.uvLightOn = !this.uvLightOn;
        const button = this.byId("library-uv-light");
        if (button) button.classList.toggle("active", this.uvLightOn);
        const paper = this.byId("library-page-view");
        paper?.classList.toggle("uv-light-on", this.uvLightOn);
        if (!this.uvLightOn) {
            this.uvSpot = null;
            paper?.querySelectorAll(".library-uv-text.revealed").forEach(node => node.classList.remove("revealed"));
        } else if (!this.uvSpot && paper) {
            this.uvSpot = { x: paper.clientWidth / 2, y: paper.clientHeight / 2 };
            paper.style.setProperty("--uv-x", `${this.uvSpot.x}px`);
            paper.style.setProperty("--uv-y", `${this.uvSpot.y}px`);
            this.updateUvReveal();
        }
        this.drawExistingLines(this.currentPage() || { drawings: [] });

    }

    toggleEraserMode() {

        this.eraserMode = !this.eraserMode;
        if (this.eraserMode) this.drawingMode = true;
        this.syncDrawingButtons();

    }

    syncDrawingButtons() {

        const paper = this.byId("library-page-view");
        paper?.classList.toggle("drawing-mode", this.drawingMode);
        paper?.classList.toggle("eraser-mode", this.eraserMode);
        const button = this.byId("library-toggle-drawing");
        if (button) button.classList.toggle("active", this.drawingMode);
        const uvDrawing = this.byId("library-toggle-uv-drawing");
        if (uvDrawing) uvDrawing.classList.toggle("active", this.uvDrawingMode);
        const eraser = this.byId("library-toggle-eraser");
        if (eraser) eraser.classList.toggle("active", this.eraserMode);

    }

    async clearDrawings() {

        const page = this.currentPage();
        if (!page || this.isTornPage(page)) return;
        if (!await MC.UI.confirm("Apagar todos os desenhos desta pagina?")) return;

        page.drawings = [];
        this.drawingRedoStack = [];
        this.dirty = true;
        await this.saveDrawings(page);
        this.renderOpenBook();

    }

    applyHighlightsFromInput() {

        this.applyHighlights(this.parseWords(this.byId("library-highlight-words")?.value || ""));
        this.dirty = true;

    }

    applyHighlights(words) {

        const editor = this.byId("library-editor");
        if (!editor) return;

        let html = this.stripHighlightMarkup(editor.innerHTML);

        if (!words.length) {
            editor.innerHTML = html;
            return;
        }

        words.forEach(word => {
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            html = html.replace(new RegExp(`(${escaped})`, "gi"), `<mark class="library-highlight">$1</mark>`);
        });

        editor.innerHTML = html;

    }

    clearHighlights() {

        const page = this.currentPage();
        const editor = this.byId("library-editor");
        if (!page || !editor) return;

        page.highlightWords = [];
        this.set("library-highlight-words", "");
        editor.innerHTML = this.stripHighlightMarkup(editor.innerHTML);
        this.dirty = true;

    }

    stripHighlightMarkup(html = "") {

        return String(html || "").replace(/<mark class="library-highlight">([\s\S]*?)<\/mark>/g, "$1");

    }

    async addImage() {

        const page = this.currentPage();
        const url = this.byId("library-image-url")?.value.trim() || "";
        if (!page || !url) return;

        try {
            const updated = await MC.Services.Library.addImage(page.id, { url });
            this.pages[this.activePageIndex] = updated;
            this.set("library-image-url", "");
            this.renderOpenBook();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao adicionar imagem.");
        }

    }

    async addNote() {

        const page = this.currentPage();
        const text = this.byId("library-note-text")?.value.trim() || "";
        if (!page || !text) return;

        try {
            const updated = await MC.Services.Library.addAnonymousNote(page.id, { text });
            this.pages[this.activePageIndex] = updated;
            this.set("library-note-text", "");
            this.renderOpenBook();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao criar nota.");
        }

    }

    async addReference() {

        const page = this.currentPage();
        if (!page) return;

        const label = this.byId("library-ref-label")?.value.trim() || "";
        const bookId = this.byId("library-ref-book")?.value.trim() || "";
        const pageNumber = Number(this.byId("library-ref-page")?.value || 1);

        if (!label || !bookId) {
            await MC.UI.alert("Referencia precisa de texto e ID do livro.");
            return;
        }

        page.references = [
            ...(page.references || []),
            { label, bookId, pageNumber }
        ];
        this.clear(["library-ref-label", "library-ref-book", "library-ref-page"]);
        this.dirty = true;
        this.renderOpenBook();

    }

    async useSelectionAsReferenceLabel() {

        const selection = window.getSelection?.();
        const selectedText = selection ? String(selection.toString() || "").trim() : "";

        if (!selectedText) {
            await MC.UI.alert("Selecione uma palavra ou trecho da pagina primeiro.");
            return;
        }

        this.set("library-ref-label", selectedText);

        const block = this.byId("library-ref-label")?.closest(".library-tool-block");
        block?.classList.remove("collapsed");

    }

    parseWords(value) {

        return String(value || "")
            .split(",")
            .map(word => word.trim())
            .filter(Boolean);

    }

    byId(id) {

        return document.getElementById(id);

    }

    set(id, value) {

        const el = this.byId(id);
        if (el) el.value = value ?? "";

    }

    clear(ids) {

        ids.forEach(id => this.set(id, ""));

    }

    num(id, fallback = 0) {

        const value = Number(this.byId(id)?.value);
        return Number.isFinite(value) ? value : fallback;

    }

    esc(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    }

}

export default new Library();
