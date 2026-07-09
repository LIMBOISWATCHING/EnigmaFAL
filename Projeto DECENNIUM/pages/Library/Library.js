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
        this.byId("library-toggle-drawing")?.addEventListener("click", () => this.toggleDrawingMode());
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

        if (!this.dirty) return true;
        return await MC.UI.confirm("Existem alteracoes nao salvas na Biblioteca. Sair sem salvar?");

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
        this.fillBookTools();
        this.renderOpenBook();

    }

    async closeReader() {

        if (this.dirty && !await MC.UI.confirm("Existem alteracoes nao salvas. Fechar o livro mesmo assim?")) return;
        this.activeBook = null;
        this.pages = [];
        this.dirty = false;
        this.pageHistory = [];
        this.byId("library-reader")?.classList.add("hidden");
        this.byId("library-shelves")?.classList.remove("hidden");
        this.byId("library-close-book")?.classList.add("hidden");

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
        this.set("library-edit-password", book.password);

        ["library-edit-title", "library-edit-seal", "library-edit-font", "library-edit-color", "library-cover-color", "library-cover-border", "library-edit-password", "library-save-book", "library-delete-book"].forEach(id => {
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
            this.byId("library-first-page")?.addEventListener("click", () => this.addPage());
            return;
        }

        const canEdit = MC.Services.Library.canEditPage(page) && !page.torn;
        const canDraw = !page.torn;
        const canTear = MC.Services.Library.canTearPage(book, page);

        this.set("library-page-title", page.title || "");
        this.set("library-highlight-words", (page.highlightWords || []).join(", "));
        this.byId("library-page-title").disabled = !canEdit;
        this.byId("library-save-page").disabled = !canEdit;
        this.byId("library-tear-page").disabled = !canTear || page.torn;
        [
            "library-text-color",
            "library-selection-font",
            "library-selection-size",
            "library-apply-color",
            ...Array.from(this.container.querySelectorAll(".library-format-btn")),
            "library-highlight-words",
            "library-apply-highlights",
            "library-clear-highlights",
            "library-ref-label",
            "library-ref-book",
            "library-ref-page",
            "library-ref-selection",
            "library-add-ref"
        ].forEach(entry => {
            const el = typeof entry === "string" ? this.byId(entry) : entry;
            if (el) el.disabled = !canEdit;
        });

        ["library-toggle-drawing", "library-toggle-eraser", "library-clear-drawings"].forEach(id => {
            const el = this.byId(id);
            if (el) el.disabled = !canDraw;
        });

        ["library-image-url", "library-add-image", "library-note-text", "library-add-note"].forEach(id => {
            const el = this.byId(id);
            if (el) el.disabled = Boolean(page.torn);
        });

        paper.innerHTML = page.torn
            ? this.renderTornPage(page)
            : this.renderWritablePage(page, canEdit);

        paper.classList.toggle("drawing-mode", this.drawingMode);
        paper.classList.toggle("eraser-mode", this.eraserMode);

        this.bindPageSurface(page, canEdit, canDraw);
        this.applyHighlights(page.highlightWords || []);

    }

    renderTornPage(page) {

        return `
            <div class="library-page-number">Pagina ${this.esc(page.pageNumber)} | pagina arrancada</div>
            <div class="library-torn-page">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

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

        this.container.querySelectorAll(".library-ref-link").forEach(button => {
            button.addEventListener("click", () => this.openBook(button.dataset.book, Number(button.dataset.page || 1), true));
        });

    }

    drawExistingLines(page) {

        const canvas = this.byId("library-drawing-canvas");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        (page.drawings || []).forEach(line => {
            if (line.type !== "line" || !line.points?.length) return;
            ctx.strokeStyle = line.color || "#000";
            ctx.lineWidth = Number(line.size || 3);
            ctx.lineCap = "round";
            ctx.beginPath();
            line.points.forEach((point, index) => {
                if (index === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        });

    }

    bindCanvas(page, canDraw) {

        const canvas = this.byId("library-drawing-canvas");
        if (!canvas || !canDraw) return;

        canvas.addEventListener("pointerdown", event => {
            if (!this.drawingMode) return;
            event.preventDefault();
            canvas.setPointerCapture?.(event.pointerId);

            if (this.eraserMode) {
                this.erasing = true;
                this.eraseLineAt(canvas, event, page);
                return;
            }

            this.drawing = true;
            this.currentLine = { type: "line", color: this.byId("library-text-color")?.value || "#000", size: 3, points: [] };
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
                this.saveDrawings(page);
                return;
            }
            if (!this.drawing || !this.currentLine) return;
            page.drawings = [...(page.drawings || []), this.currentLine];
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

    eraseLineAt(canvas, event, page) {

        const rect = canvas.getBoundingClientRect();
        const point = {
            x: Math.round((event.clientX - rect.left) / rect.width * canvas.width),
            y: Math.round((event.clientY - rect.top) / rect.height * canvas.height)
        };
        const radius = 26;
        const before = (page.drawings || []).length;

        page.drawings = (page.drawings || []).filter(line => {
            return !(line.points || []).some(linePoint => {
                const dx = Number(linePoint.x || 0) - point.x;
                const dy = Number(linePoint.y || 0) - point.y;
                return Math.sqrt(dx * dx + dy * dy) <= radius;
            });
        });

        if (page.drawings.length !== before) {
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

        const rect = canvas.getBoundingClientRect();
        this.currentLine.points.push({
            x: Math.round((event.clientX - rect.left) / rect.width * canvas.width),
            y: Math.round((event.clientY - rect.top) / rect.height * canvas.height)
        });

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

    async saveBook() {

        if (!this.activeBook) return;

        try {
            this.activeBook = await MC.Services.Library.updateBook(this.activeBook.id, {
                title: this.byId("library-edit-title")?.value.trim() || this.activeBook.title,
                seal: this.byId("library-edit-seal")?.value || this.activeBook.seal,
                fontFamily: this.byId("library-edit-font")?.value || this.activeBook.fontFamily,
                textColor: this.byId("library-edit-color")?.value || this.activeBook.textColor,
                coverColor: this.byId("library-cover-color")?.value || this.activeBook.coverColor,
                coverBorderColor: this.byId("library-cover-border")?.value || this.activeBook.coverBorderColor,
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
            this.closeReader();
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

    async savePage() {

        const page = this.currentPage();
        if (!page) return;

        try {
            const editor = this.byId("library-editor");
            const paperTitle = this.byId("library-paper-title")?.textContent?.trim() || "";
            const sideTitle = this.byId("library-page-title")?.value.trim() || "";
            const updated = await MC.Services.Library.updatePage(page.id, {
                title: sideTitle || paperTitle,
                content: this.stripHighlightMarkup(editor?.innerHTML || ""),
                drawings: page.drawings || [],
                images: page.images || [],
                notes: page.notes || [],
                references: page.references || [],
                highlightWords: this.parseWords(this.byId("library-highlight-words")?.value || "")
            });
            this.pages[this.activePageIndex] = updated;
            this.dirty = false;
            this.renderOpenBook();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao salvar pagina.");
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
        if (this.dirty && !await MC.UI.confirm("Existem alteracoes nao salvas. Trocar de pagina mesmo assim?")) return;
        this.dirty = false;
        this.goToPageIndex(Math.max(0, Math.min(this.pages.length - 1, this.activePageIndex + delta)), true);

    }

    async jumpPage() {

        const number = Number(this.byId("library-page-jump")?.value || 1);
        const index = this.pages.findIndex(page => Number(page.pageNumber) === number);
        if (index < 0) {
            await MC.UI.alert("Pagina nao encontrada.");
            return;
        }
        if (this.dirty && !await MC.UI.confirm("Existem alteracoes nao salvas. Ir para outra pagina mesmo assim?")) return;
        this.dirty = false;
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
        this.renderOpenBook();

    }

    async backPage() {

        if (!this.pageHistory.length) {
            this.closeReader();
            return;
        }

        if (this.dirty && !await MC.UI.confirm("Existem alteracoes nao salvas. Voltar mesmo assim?")) return;

        const previous = this.pageHistory.pop();
        this.dirty = false;

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
        const eraser = this.byId("library-toggle-eraser");
        if (eraser) eraser.classList.toggle("active", this.eraserMode);

    }

    async clearDrawings() {

        const page = this.currentPage();
        if (!page || page.torn) return;
        if (!await MC.UI.confirm("Apagar todos os desenhos desta pagina?")) return;

        page.drawings = [];
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

    esc(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    }

}

export default new Library();
