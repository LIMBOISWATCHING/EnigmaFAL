// ======================================================
// MAGNUS ENGINE
// Database.js
//
// Camada de acesso ao banco de dados.
// Todo acesso ao Firebase deve passar por aqui.
// ======================================================

import CoreModule from "../CoreModule.js";

import {

    ref,
    get,
    set,
    update,
    remove,
    push,
    runTransaction

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

class Database extends CoreModule {

    constructor() {

        super({

            name: "Database",

            version: "1.0.0",

            priority: 40

        });

        this.db = null;

    }

    // ==================================================
    // INICIALIZAÇÃO
    // ==================================================

    async initialize() {

        await super.initialize();

        this.db = MC.Firebase.getDatabase();

        MC.log("Database iniciado.");

    }

    // ==================================================
    // LÊ DADOS
    // ==================================================

    async get(path) {

        try {

            const snapshot = await get(ref(this.db, path));

            if (!snapshot.exists()) {

                return null;

            }

            return snapshot.val();

        }

        catch (error) {

            console.error(error);

            return null;

        }

    }

    // ==================================================
    // SALVA DADOS
    // ==================================================

    async set(path, value) {

        try {

            await set(ref(this.db, path), value);

            return true;

        }

        catch (error) {

            console.error(error);

            return false;

        }

    }

    // ==================================================
    // ATUALIZA DADOS
    // ==================================================

    async update(path, value) {

        try {

            await update(ref(this.db, path), value);

            return true;

        }

        catch (error) {

            console.error(error);

            return false;

        }

    }

    // ==================================================
    // REMOVE DADOS
    // ==================================================

    async remove(path) {

        try {

            await remove(ref(this.db, path));

            return true;

        }

        catch (error) {

            console.error(error);

            return false;

        }

    }

    // ==================================================
    // VERIFICA EXISTÊNCIA
    // ==================================================

    async exists(path) {

        const value = await this.get(path);

        return value !== null;

    }

    // ==================================================
    // GERA ID DO FIREBASE
    // ==================================================

    generateId(path) {

        return push(ref(this.db, path)).key;

    }

    // ==================================================
    // TRANSAÇÃO ATÔMICA
    // ==================================================

    async transaction(path, callback) {

        try {

            const reference = ref(this.db, path);

            const result = await runTransaction(reference, callback);

            return result;

        }

        catch (error) {

            console.error(error);

            return null;

        }

    }

    // ==================================================
    // FINALIZAÇÃO
    // ==================================================

    async destroy() {

        this.db = null;

        await super.destroy();

    }

}

export default new Database();