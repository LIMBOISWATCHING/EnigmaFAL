// ======================================================
// MAGNUS ENGINE
// State.js
//
// Estado global da aplicação.
// ======================================================

import CoreModule from "../CoreModule.js";

class State extends CoreModule {

    constructor() {

        super({

            name: "State",

            version: "1.0.0",

            priority: 10

        });

        this.reset();

    }

    // ==================================================
    // INICIALIZAÇÃO
    // ==================================================

    async initialize() {

        await super.initialize();

    }

    // ==================================================
    // RESTAURA O ESTADO
    // ==================================================

    reset() {

        this.data = {

            user: null,

            isAdmin: false,

            currentPage: null,

            currentCase: null,

            currentCharacter: null,

            currentBattle: null,

            loading: false,

            online: true

        };

    }

    // ==================================================
    // DEFINE UM VALOR
    // ==================================================

    set(key, value) {

        this.data[key] = value;

    }

    // ==================================================
    // OBTÉM UM VALOR
    // ==================================================

    get(key) {

        return this.data[key];

    }

    // ==================================================
    // VERIFICA EXISTÊNCIA
    // ==================================================

    has(key) {

        return key in this.data;

    }

    // ==================================================
    // REMOVE UM VALOR
    // ==================================================

    remove(key) {

        delete this.data[key];

    }

    // ==================================================
    // RETORNA TODO O ESTADO
    // ==================================================

    all() {

        return this.data;

    }

    // ==================================================
    // DESTRÓI O MÓDULO
    // ==================================================

    async destroy() {

        this.reset();

        await super.destroy();

    }

}

export default new State();