// ======================================================
// MAGNUS ENGINE
// CoreModule.js
//
// Classe base para todos os módulos da Engine.
// ======================================================

export default class CoreModule {

    constructor(config = {}) {

        this.name = config.name || "Module";

        this.version = config.version || "1.0.0";

        this.priority = config.priority || 0;

        this.initialized = false;

    }

    // ==================================================
    // Inicialização
    // ==================================================

    async initialize() {

        this.initialized = true;

    }

    // ==================================================
    // Finalização
    // ==================================================

    async destroy() {

        this.initialized = false;

    }

    // ==================================================
    // Utilitário
    // ==================================================

    isInitialized() {

        return this.initialized;

    }

}