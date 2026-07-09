// ======================================================
// MAGNUS ENGINE
// Router.js
// ======================================================

import CoreModule from "../CoreModule.js";
import Pages from "../../../pages/Pages.js";

class Router extends CoreModule {

    constructor() {

        super({

            name: "Router",

            version: "1.0.0",

            priority: 80

        });

        this.current = null;

        this.pages = Pages;

        this.container = null;

    }

    // ==================================================
    // INICIALIZAÇÃO
    // ==================================================

    async initialize() {

        console.log("Identification inicializada");

        await super.initialize();

        this.container = MC.Layout.content;

        MC.log("Router iniciado.");

    }

// ==================================================
// ABRE UMA PÁGINA
// ==================================================

async open(name) {

    const page = this.pages[name];

    if (!page) {

        console.error(`Página "${name}" não encontrada.`);

        return false;

    }

    // Fecha a página atual

    if (this.current) {

        const current = this.pages[this.current];

        if (current?.close) {

            const canClose = await current.close();

            if (canClose === false) {

                return false;

            }

        }

    }

    this.current = name;

    await page.open(this.container);

    if (MC.Menu?.setActive) {

        MC.Menu.setActive(name);

    }

    return true;

}

    // ==================================================
    // RETORNA A PÁGINA ATUAL
    // ==================================================

    currentPage() {

        return this.current;

    }

}

export default new Router();
