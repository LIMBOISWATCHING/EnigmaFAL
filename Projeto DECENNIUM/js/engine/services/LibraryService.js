import LibraryCategoryModel from "../models/LibraryCategoryModel.js";
import LibraryBookModel from "../models/LibraryBookModel.js";
import LibraryPageModel from "../models/LibraryPageModel.js";

class LibraryService {

    constructor() {

        this.categoryRepository = null;
        this.bookRepository = null;
        this.pageRepository = null;

        this.defaultCategories = [
            ["CAT-GENERAL", "Geral", "geral"],
            ["CAT-CREATURES", "Criaturas", "criaturas"],
            ["CAT-ITEMS", "Itens", "itens"],
            ["CAT-SYMBOLS", "Simbolos", "simbolos"],
            ["CAT-RITUALS", "Entidades", "entidades"],
            ["CAT-PLACES", "Locais", "locais"],
            ["CAT-FACTIONS", "Faccoes", "faccoes"],
            ["CAT-DOCUMENTS", "Documentos", "documentos"]
        ];

    }

    initialize() {

        this.categoryRepository = MC.Repositories.LibraryCategories;
        this.bookRepository = MC.Repositories.LibraryBooks;
        this.pageRepository = MC.Repositories.LibraryPages;

    }

    actor() {

        const user = MC.Auth?.current?.() || null;
        const key = "mc-library-visitor-key";
        let localId = localStorage.getItem(key);

        if (!localId) {
            localId = "LIB-" + Date.now() + "-" + Math.floor(Math.random() * 999999);
            localStorage.setItem(key, localId);
        }

        return {
            id: user?.id || localId,
            name: user?.name || "Anonimo"
        };

    }

    async ensureCategories() {

        const existing = await this.categoryRepository.findAll();
        const byId = new Set(existing.map(category => category.id));
        const existingById = new Map(existing.map(category => [category.id, category]));

        for (let index = 0; index < this.defaultCategories.length; index++) {
            const [id, name, slug] = this.defaultCategories[index];

            if (byId.has(id)) {
                const category = existingById.get(id);
                if (category.name !== name || category.slug !== slug || Number(category.order || 0) !== index + 1) {
                    category.name = name;
                    category.slug = slug;
                    category.order = index + 1;
                    await this.categoryRepository.update(category);
                }
                continue;
            }

            await this.categoryRepository.create(new LibraryCategoryModel({
                id,
                name,
                slug,
                order: index + 1,
                ownerId: null,
                permissions: { read: ["public"], write: ["public"], admin: [] }
            }));
        }

        const ritual = existing.find(category => category.id === "CAT-RITUALS");
        if (ritual && ritual.name !== "Entidades") {
            ritual.name = "Entidades";
            ritual.slug = "entidades";
            await this.categoryRepository.update(ritual);
        }

    }

    async findCategories() {

        await this.ensureCategories();

        const categories = await this.categoryRepository.findAll();

        return categories
            .filter(category => !category.deleted)
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    }

    async findBooks(categoryId = "") {

        const books = await this.bookRepository.findAll();

        return books
            .filter(book => !book.deleted && (!categoryId || book.categoryId === categoryId))
            .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    }

    async findBook(id) {

        const book = await this.bookRepository.findById(id);

        return book && !book.deleted ? book : null;

    }

    async createBook(data = {}) {

        const actor = this.actor();
        const title = String(data.title || "").trim();

        if (!title) throw new Error("O livro precisa de titulo.");

        const book = new LibraryBookModel({
            ...data,
            id: data.id || await MC.Utils.nextId("BOK"),
            title,
            ownerId: actor.id,
            ownerName: actor.name,
            permissions: { read: ["public"], write: [actor.id], admin: [actor.id] }
        });

        return await this.bookRepository.create(book);

    }

    canManageBook(book) {

        return MC.Services.Permissions.isAdmin() || book?.ownerId === this.actor().id;

    }

    canOpenBook(book, password = "") {

        const savedPassword = String(book?.password || "").trim();
        const typedPassword = String(password || "").trim();

        return this.canManageBook(book) || !savedPassword || savedPassword === typedPassword;

    }

    async updateBook(id, data = {}) {

        const book = await this.findBook(id);
        if (!book) throw new Error("Livro nao encontrado.");
        if (!this.canManageBook(book)) throw new Error("Somente o dono pode editar este livro.");

        book.update({
            title: data.title ?? book.title,
            fontFamily: data.fontFamily ?? book.fontFamily,
            textColor: data.textColor ?? book.textColor,
            coverStyle: data.coverStyle ?? book.coverStyle,
            coverColor: data.coverColor ?? book.coverColor,
            coverBorderColor: data.coverBorderColor ?? book.coverBorderColor,
            pageStyle: data.pageStyle ?? book.pageStyle,
            pageColor: data.pageColor ?? book.pageColor,
            seal: data.seal ?? book.seal,
            password: data.password ?? book.password,
            references: Array.isArray(data.references) ? data.references : book.references
        });

        return await this.bookRepository.update(book);

    }

    async deleteBook(id) {

        const book = await this.findBook(id);
        if (!book) throw new Error("Livro nao encontrado.");
        if (!this.canManageBook(book)) throw new Error("Somente o dono pode tirar este livro da prateleira.");

        book.deleted = true;
        book.status = "deleted";

        return await this.bookRepository.update(book);

    }

    async findPages(bookId) {

        const pages = await this.pageRepository.findAll();

        return pages
            .filter(page => !page.deleted && page.bookId === bookId)
            .sort((a, b) => Number(a.pageNumber || 0) - Number(b.pageNumber || 0));

    }

    async findPage(id) {

        const page = await this.pageRepository.findById(id);

        return page && !page.deleted ? page : null;

    }

    async createPage(bookId, data = {}) {

        const book = await this.findBook(bookId);
        if (!book) throw new Error("Livro nao encontrado.");

        const actor = this.actor();
        const pages = await this.findPages(bookId);
        const nextNumber = pages.reduce((max, page) => Math.max(max, Number(page.pageNumber || 0)), 0) + 1;

        const page = new LibraryPageModel({
            ...data,
            id: data.id || await MC.Utils.nextId("PAG"),
            bookId,
            ownerId: actor.id,
            ownerName: actor.name,
            pageNumber: Number(data.pageNumber || nextNumber),
            permissions: { read: ["public"], write: [actor.id], admin: [actor.id] }
        });

        return await this.pageRepository.create(page);

    }

    canEditPage(page) {

        return MC.Services.Permissions.isAdmin() || page?.ownerId === this.actor().id;

    }

    canTearPage(book, page) {

        return this.canManageBook(book) || this.canEditPage(page);

    }

    async updatePage(id, data = {}) {

        const page = await this.findPage(id);
        if (!page) throw new Error("Pagina nao encontrada.");
        if (!this.canEditPage(page)) throw new Error("Somente quem escreveu esta pagina pode edita-la.");
        if (page.torn) throw new Error("Pagina arrancada nao pode ser editada.");

        page.update({
            title: data.title ?? page.title,
            content: this.sanitizeHtml(data.content ?? page.content),
            drawings: Array.isArray(data.drawings) ? data.drawings : page.drawings,
            images: Array.isArray(data.images) ? data.images : page.images,
            notes: Array.isArray(data.notes) ? data.notes : page.notes,
            references: Array.isArray(data.references) ? data.references : page.references,
            highlightWords: Array.isArray(data.highlightWords) ? data.highlightWords : page.highlightWords,
            pageStyle: data.pageStyle ?? page.pageStyle,
            pageColor: data.pageColor ?? page.pageColor,
            pageNumber: Number(data.pageNumber || page.pageNumber)
        });

        return await this.pageRepository.update(page);

    }

    async updateDrawings(pageId, drawings = []) {

        const page = await this.findPage(pageId);
        if (!page) throw new Error("Pagina nao encontrada.");
        if (page.torn) throw new Error("Pagina arrancada nao pode receber desenhos.");

        page.drawings = Array.isArray(drawings) ? drawings : [];
        page.touch();

        return await this.pageRepository.update(page);

    }

    async tearPage(bookId, pageId) {

        const book = await this.findBook(bookId);
        const page = await this.findPage(pageId);
        const actor = this.actor();

        if (!book || !page) throw new Error("Pagina nao encontrada.");
        if (!this.canTearPage(book, page)) throw new Error("Voce nao pode arrancar esta pagina.");

        page.torn = true;
        page.tornBy = actor.id;
        page.content = "";
        page.images = [];
        page.drawings = [];
        page.notes = [];
        page.references = [];
        page.highlightWords = [];
        page.touch();

        return await this.pageRepository.update(page);

    }

    async addAnonymousNote(pageId, note = {}) {

        const page = await this.findPage(pageId);
        if (!page || page.torn) throw new Error("Pagina indisponivel.");

        const notes = Array.isArray(page.notes) ? page.notes : [];

        notes.push({
            id: await MC.Utils.nextId("NTE"),
            text: String(note.text || "").trim(),
            ownerId: this.actor().id,
            x: Number(note.x ?? 62),
            y: Number(note.y ?? 42),
            open: false,
            createdAt: new Date().toISOString()
        });

        page.notes = notes;
        page.touch();

        return await this.pageRepository.update(page);

    }

    async addImage(pageId, image = {}) {

        const page = await this.findPage(pageId);
        if (!page || page.torn) throw new Error("Pagina indisponivel.");

        const actor = this.actor();
        const images = Array.isArray(page.images) ? page.images : [];

        images.push({
            id: await MC.Utils.nextId("IMG"),
            url: String(image.url || "").trim(),
            ownerId: actor.id,
            x: Number(image.x ?? 18),
            y: Number(image.y ?? 18),
            width: Number(image.width ?? 26),
            rotation: Number(image.rotation ?? 0),
            createdAt: new Date().toISOString()
        });

        page.images = images;
        page.touch();

        return await this.pageRepository.update(page);

    }

    canManagePageAsset(page, asset) {

        const actor = this.actor();

        if (!page || !asset) return false;
        if (MC.Services.Permissions.isAdmin()) return true;
        if (page.ownerId === actor.id) return true;
        if (!asset.ownerId) return true;

        return asset.ownerId === actor.id;

    }

    async updateImage(pageId, imageId, data = {}) {

        const page = await this.findPage(pageId);
        if (!page || page.torn) throw new Error("Pagina indisponivel.");

        const image = (page.images || []).find(entry => entry.id === imageId);
        if (!image) throw new Error("Imagem nao encontrada.");
        if (!this.canManagePageAsset(page, image)) throw new Error("Somente quem adicionou a imagem pode altera-la.");

        page.images = (page.images || []).map(entry =>
            entry.id === imageId
                ? {
                    ...entry,
                    x: Number(data.x ?? entry.x ?? 18),
                    y: Number(data.y ?? entry.y ?? 18),
                    width: Number(data.width ?? entry.width ?? 26),
                    rotation: Number(data.rotation ?? entry.rotation ?? 0)
                }
                : entry
        );
        page.touch();

        return await this.pageRepository.update(page);

    }

    async deleteImage(pageId, imageId) {

        const page = await this.findPage(pageId);
        if (!page || page.torn) throw new Error("Pagina indisponivel.");

        const image = (page.images || []).find(entry => entry.id === imageId);
        if (!image) return page;
        if (!this.canManagePageAsset(page, image)) throw new Error("Somente quem adicionou a imagem pode remove-la.");

        page.images = (page.images || []).filter(entry => entry.id !== imageId);
        page.touch();

        return await this.pageRepository.update(page);

    }

    async updateNote(pageId, noteId, data = {}) {

        const page = await this.findPage(pageId);
        if (!page || page.torn) throw new Error("Pagina indisponivel.");

        page.notes = (page.notes || []).map(note =>
            note.id === noteId
                ? { ...note, ...data, id: note.id }
                : note
        );
        page.touch();

        return await this.pageRepository.update(page);

    }

    async deleteNote(pageId, noteId) {

        const page = await this.findPage(pageId);
        if (!page || page.torn) throw new Error("Pagina indisponivel.");

        const actor = this.actor();
        const note = (page.notes || []).find(entry => entry.id === noteId);
        if (!note) return page;

        if (!MC.Services.Permissions.isAdmin() && note.ownerId && note.ownerId !== actor.id && page.ownerId !== actor.id) {
            throw new Error("Somente quem adicionou a nota pode remove-la.");
        }

        page.notes = (page.notes || []).filter(entry => entry.id !== noteId);
        page.touch();

        return await this.pageRepository.update(page);

    }

    sanitizeHtml(html = "") {

        const template = document.createElement("template");
        template.innerHTML = String(html || "");

        template.content.querySelectorAll("script, iframe, object, embed, link, style").forEach(node => node.remove());
        template.content.querySelectorAll("*").forEach(node => {
            [...node.attributes].forEach(attribute => {
                const name = attribute.name.toLowerCase();
                const value = attribute.value || "";
                if (name.startsWith("on") || value.toLowerCase().includes("javascript:")) {
                    node.removeAttribute(attribute.name);
                }
            });
        });

        return template.innerHTML;

    }

}

export default new LibraryService();
