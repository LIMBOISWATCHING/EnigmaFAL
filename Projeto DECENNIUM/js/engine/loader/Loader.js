// ======================================================
// MAGNUS ENGINE
// Loader.js
//
// Flash rápido verde com símbolo < 0 >
// ======================================================

import CoreModule from "../CoreModule.js";

class Loader extends CoreModule {

    constructor() {

        super({

            name: "Loader",

            version: "1.0.0",

            priority: 50

        });

        this.overlay = null;

    }

    async initialize() {

        await super.initialize();

        this.createOverlay();

        MC.log("Loader iniciado.");

    }

    createOverlay() {

        this.overlay = document.createElement("div");

        this.overlay.id = "mc-loader";

        document.body.appendChild(this.overlay);

    }

    async boot(options = {}) {

        return this.playBoot(options);

    }

    async playBoot(options = {}) {

        if (!this.overlay) {

            this.createOverlay();

        }

        // Mostra o flash com símbolo
        this.overlay.innerHTML = `

            <span class="mc-loader-symbol">&lt; 0 &gt;</span>

        `;

        this.overlay.classList.add("mc-loader-visible");

        // Duração total do flash
        await this.wait(200);

        this.hideBoot();

    }

    hideBoot() {

        if (!this.overlay) {

            return;

        }

        this.overlay.classList.remove("mc-loader-visible");

        this.overlay.innerHTML = "";

    }

    wait(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

    }

    async html(path) {

        const response = await fetch(path);

        if (!response.ok) {

            throw new Error(`Erro ao carregar HTML: ${path}`);

        }

        return await response.text();

    }

}

export default new Loader();
