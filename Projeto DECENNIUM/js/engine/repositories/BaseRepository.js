// ======================================================
// MAGNUS ENGINE
// BaseRepository.js
//
// Classe base responsável pelas operações comuns
// de persistência de dados.
//
// Todos os Repositories da Engine herdarão desta
// classe.
// ======================================================

class BaseRepository {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(collection) {

        this.collection = collection;

    }

    // ==================================================
    // BUSCA POR ID
    // ==================================================

    async findById(id) {

        throw new Error("findById() não implementado.");

    }

    // ==================================================
    // LISTA TODOS
    // ==================================================

    async findAll() {

        throw new Error("findAll() não implementado.");

    }

    // ==================================================
    // CRIA
    // ==================================================

    async create(model) {

        throw new Error("create() não implementado.");

    }

    // ==================================================
    // ATUALIZA
    // ==================================================

    async update(model) {

        throw new Error("update() não implementado.");

    }

    // ==================================================
    // REMOVE
    // ==================================================

    async delete(id) {

        throw new Error("delete() não implementado.");

    }

    // ==================================================
    // EXISTE
    // ==================================================

    async exists(id) {

        const entity = await this.findById(id);

        return entity !== null;

    }

    // ==================================================
    // SERIALIZA MODEL
    // ==================================================

    serialize(model) {

        if (model && typeof model.toJSON === "function") {

            return model.toJSON();

        }

        return model;

    }

    // ==================================================
    // DESSERIALIZA
    // ==================================================

    deserialize(data) {

        return data;

    }

}

export default BaseRepository;