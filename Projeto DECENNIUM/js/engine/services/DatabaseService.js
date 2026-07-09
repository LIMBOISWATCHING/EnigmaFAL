// ======================================================
// MAGNUS ENGINE
// DatabaseService.js
//
// Serviço responsável por realizar todas as operações
// de leitura e escrita no banco de dados.
//
// Nenhum Repository deve acessar o Firebase
// diretamente.
// ======================================================

import Database from "../database/Database.js";

class DatabaseService {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor() {

        this.database = Database;

    }

    // ==================================================
    // BUSCA DOCUMENTO
    // ==================================================

    async get(collection, id) {

        return await this.database.get(

            `${collection}/${id}`

        );

    }

    // ==================================================
    // LISTA DOCUMENTOS
    // ==================================================

    async getAll(collection) {

        const data = await this.database.get(collection);

        if (!data) {

            return [];

        }

        return Object.entries(data).map(([id, value]) => ({

            ...value,

            id: value.id || id

        }));

    }

    // ==================================================
    // CRIA DOCUMENTO
    // ==================================================

    async create(collection, data) {

        const id = data.id || this.database.generateId(collection);

        const document = {

            ...data,

            id

        };

        const success = await this.database.set(

            `${collection}/${id}`,

            document

        );

        return success ? document : null;

    }

    // ==================================================
    // ATUALIZA DOCUMENTO
    // ==================================================

    async update(collection, id, data) {

        if (!id) {

            throw new Error("ID obrigatorio para atualizar documento.");

        }

        const document = {

            ...data,

            id

        };

        const success = await this.database.update(

            `${collection}/${id}`,

            document

        );

        return success ? document : null;

    }

    // ==================================================
    // REMOVE DOCUMENTO
    // ==================================================

    async delete(collection, id) {

        if (!id) {

            throw new Error("ID obrigatorio para remover documento.");

        }

        return await this.database.remove(

            `${collection}/${id}`

        );

    }

}

const DatabaseServiceInstance = new DatabaseService();

export default DatabaseServiceInstance;
