// ======================================================
// MAGNUS ENGINE
// Events.js
//
// Sistema global de eventos.
// ======================================================

import CoreModule from "../CoreModule.js";

class Events extends CoreModule {

    constructor() {

        super({

            name: "Events",

            version: "1.0.0",

            priority: 20

        });

        this.listeners = new Map();

    }

    // ==================================================
    // INICIALIZAÇÃO
    // ==================================================

    async initialize() {

        await super.initialize();

    }

    // ==================================================
    // REGISTRA UM EVENTO
    // ==================================================

    on(eventName, callback) {

        if (!this.listeners.has(eventName)) {

            this.listeners.set(eventName, []);

        }

        this.listeners.get(eventName).push(callback);

    }

    // ==================================================
    // REMOVE UM EVENTO
    // ==================================================

    off(eventName, callback) {

        if (!this.listeners.has(eventName)) {

            return;

        }

        const callbacks = this.listeners.get(eventName);

        const index = callbacks.indexOf(callback);

        if (index !== -1) {

            callbacks.splice(index, 1);

        }

    }

    // ==================================================
    // DISPARA UM EVENTO
    // ==================================================

    emit(eventName, data = null) {

        if (!this.listeners.has(eventName)) {

            return;

        }

        const callbacks = this.listeners.get(eventName);

        for (const callback of callbacks) {

            callback(data);

        }

    }

    // ==================================================
    // REMOVE TODOS OS EVENTOS
    // ==================================================

    clear(eventName = null) {

        if (eventName) {

            this.listeners.delete(eventName);

            return;

        }

        this.listeners.clear();

    }

    // ==================================================
    // DESTRÓI O MÓDULO
    // ==================================================

    async destroy() {

        this.clear();

        await super.destroy();

    }

}

export default new Events();