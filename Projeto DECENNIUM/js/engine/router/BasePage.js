// ======================================================
// MAGNUS ENGINE
// BasePage.js
//
// Classe base para todas as páginas da aplicação.
// ======================================================

export default class BasePage {

    constructor(config = {}) {

        this.id = config.id || "";

        this.title = config.title || "";

        this.html = config.html || "";

        this.css = config.css || "";

        this.loaded = false;

        this.visible = false;

    }

    // ==================================================
    // CARREGA A PÁGINA
    // ==================================================

    async load() {

        this.loaded = true;

    }

    // ==================================================
    // INICIALIZA
    // ==================================================

    async init() {

    }

    // ==================================================
    // EXIBE
    // ==================================================

    async show() {

        this.visible = true;

    }

    // ==================================================
    // ESCONDE
    // ==================================================

    async hide() {

        this.visible = false;

    }

    // ==================================================
    // FINALIZA
    // ==================================================

    async destroy() {

        this.loaded = false;

        this.visible = false;

    }

}