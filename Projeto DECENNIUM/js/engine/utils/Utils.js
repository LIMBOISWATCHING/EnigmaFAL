// ======================================================
// MAGNUS ENGINE
// Utils.js
//
// Funções utilitárias da Engine.
// ======================================================

import CoreModule from "../CoreModule.js";

class Utils extends CoreModule {

    constructor() {

        super({

            name: "Utils",

            version: "1.0.0",

            priority: 90

        });

        // ==================================================
        // PREFIXOS OFICIAIS
        // ==================================================

        this.IDS = {

            PLAYER: "PLY",

            CASE: "CAS",

            CREATURE: "CR",

            NPC: "NPC",

            ATTACK: "ATK",

            CHARACTER: "CHR",

            ABILITY: "HAB",

            SKILL: "HAB",

            EFFECT: "EFT",

            AUDIO: "AUD",

            IMAGE: "IMG",

            NOTE: "NOTE",

            USER: "USR",

            LOG: "LOG",

            BASIC_ITEM: "ITM",

            VAULT: "COF"

        };

        // ==================================================
        // CAMINHOS DO FIREBASE
        // ==================================================

        this.PATHS = {

            ENGINE: "engine",

            IDS: "engine/ids",

            USERS: "usuarios",

            CHARACTERS: "personagens",

            CASES: "casos",

            CREATURES: "criaturas",

            ATTACKS: "ataques",

            SKILLS: "habilidades",

            EFFECTS: "efeitos",

            LOGS: "logs"

        };

    }

    // ==================================================
    // INICIALIZAÇÃO
    // ==================================================

    async initialize() {

        await super.initialize();

        await this.initializeIds();

        MC.log("Utils iniciado.");

    }

    // ==================================================
    // INICIALIZA CONTADORES
    // ==================================================

    async initializeIds() {

        for (const prefix of Object.values(this.IDS)) {

            const path = `${this.PATHS.IDS}/${prefix}`;

            const exists = await MC.Database.exists(path);

            if (!exists) {

                await MC.Database.set(path, 0);

                MC.log(`Contador criado: ${prefix}`);

            }

        }

    }

    // ==================================================
    // PRÓXIMO ID
    // ==================================================

    async nextId(prefix) {

        for (let tries = 0; tries < 100; tries++) {

            const value = Math.floor(Math.random() * 9999) + 1;
            const id = prefix + String(value).padStart(4, "0");
            const path = `${this.PATHS.IDS}/${prefix}/used/${id}`;

            if (!(await MC.Database.exists(path))) {

                await MC.Database.set(path, true);

                return id;

            }

        }

        const fallback = await MC.Database.transaction(

            `${this.PATHS.IDS}/${prefix}/fallback`,

            current => (current || 0) + 1

        );

        if (!fallback || !fallback.snapshot.exists()) {

            throw new Error(`Erro ao gerar ID (${prefix}).`);

        }

        const value = fallback.snapshot.val();

        return prefix + "R" + String(value).padStart(4, "0");

    }

    // ==================================================
    // GERA ID MANUAL
    // ==================================================

    generateId(prefix, number) {

        return prefix + String(number).padStart(4, "0");

    }

    // ==================================================
    // DATA
    // ==================================================

    today() {

        return new Date().toLocaleDateString("pt-BR");

    }

    // ==================================================
    // HORA
    // ==================================================

    time() {

        return new Date().toLocaleTimeString("pt-BR");

    }

    // ==================================================
    // DATA COMPLETA
    // ==================================================

    now() {

        return {

            date: this.today(),

            time: this.time(),

            timestamp: Date.now()

        };

    }

    // ==================================================
    // CLONA OBJETO
    // ==================================================

    clone(object) {

        return structuredClone(object);

    }

    // ==================================================
    // RANDOM
    // ==================================================

    random(min, max) {

        return Math.floor(Math.random() * (max - min + 1)) + min;

    }

    // ==================================================
    // LIMITA VALOR
    // ==================================================

    clamp(value, min, max) {

        return Math.max(min, Math.min(max, value));

    }

    // ==================================================
    // CAPITALIZA
    // ==================================================

    capitalize(text) {

        if (!text) {

            return "";

        }

        return text.charAt(0).toUpperCase() + text.slice(1);

    }

    // ==================================================
    // NORMALIZA
    // ==================================================

    normalize(text) {

        return text.trim();

    }

}

export default new Utils();
