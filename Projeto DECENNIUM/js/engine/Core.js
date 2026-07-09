// ======================================================
// MAGNUS ENGINE
// Core.js
//
// Núcleo da Engine.
// Responsável por registrar, inicializar e gerenciar
// todos os módulos.
// ======================================================

import Version from "./Version.js";
import Manifest from "./Manifest.js";
import Repositories from "./repositories/Repositories.js";
import Services from "./services/Services.js";

class Core {

    constructor() {

        this.modules = new Map();

        this.started = false;

        this.version = Version;

        this.Repositories = Repositories;

        this.Services = Services;

    }

    // ==================================================
    // INICIALIZA A ENGINE
    // ==================================================

async start() {

    if (this.started) {

        return;

    }

    this.started = true;

    this.logHeader();

    this.initializeServices();

    await this.initializeModules();

    // ==========================================
    // RESTAURA SESSÃO
    // ==========================================

    this.log("");

    this.log("Magnus Engine iniciada.");

}

    // ==================================================
    // INICIALIZA TODOS OS SERVIÇOS
    // ==================================================

    initializeServices() {

        for (const service of Object.values(this.Services)) {

            if (service.initialize) {

                service.initialize();

            }

        }

    }

    // ==================================================
    // INICIALIZA TODOS OS MÓDULOS
    // ==================================================

    async initializeModules() {

        for (const module of Manifest) {

            this.modules.set(module.name, module);

            this[module.name] = module;

            this.log("Inicializando módulo:", module.name);

            await module.initialize();

        }

    }

    // ==================================================
    // FINALIZA TODOS OS MÓDULOS
    // ==================================================

    async shutdown() {

        const modules = [...this.modules.values()].reverse();

        for (const module of modules) {

            this.log("Finalizando módulo:", module.name);

            await module.destroy();

        }

        this.started = false;

    }

    // ==================================================
    // RETORNA UM MÓDULO
    // ==================================================

    module(name) {

        return this.modules.get(name);

    }

    // ==================================================
    // VERIFICA EXISTÊNCIA
    // ==================================================

    has(name) {

        return this.modules.has(name);

    }

    // ==================================================
    // LOG
    // ==================================================

    log(...args) {

        if (!this.version.debug) {

            return;

        }

        console.log(...args);

    }

    // ==================================================
    // HEADER
    // ==================================================

    logHeader() {

        if (!this.version.debug) {

            return;

        }

        console.clear();

        console.log("");

        console.log("==============================================");

        console.log("THE MAGNUS INSTITUTE");

        console.log("");

        console.log(this.version.engine);

        console.log("");

        console.log("Versão :", this.version.version);

        console.log("Build  :", this.version.build);

        console.log("");

        console.log("==============================================");

        console.log("");

    }

}

const MC = new Core();

window.MC = MC;

export default MC;