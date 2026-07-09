// ======================================================
// MAGNUS ENGINE
// FirebaseRepository.js
//
// Implementação padrão dos Repositories utilizando
// o DatabaseService.
// ======================================================

import BaseRepository from "./BaseRepository.js";
import DatabaseService from "../services/DatabaseService.js";

class FirebaseRepository extends BaseRepository {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(collection, Model) {

        super(collection);

        this.Model = Model;

    }

    // ==================================================
    // BUSCA POR ID
    // ==================================================

    async findById(id) {

        const data = await DatabaseService.get(this.collection, id);

        if (!data) {

            return null;

        }

        return this.deserialize(data);

    }

    // ==================================================
    // LISTA TODOS
    // ==================================================

    async findAll() {

        const documents = await DatabaseService.getAll(this.collection);

        return documents.map(document => this.deserialize(document));

    }

    // ==================================================
    // BUSCA POR CAMPO
    // ==================================================

    async findWhere(field, value) {

        const documents = await this.findAll();

        return documents.filter(model => model[field] === value);

    }

    // ==================================================
    // PRIMEIRO RESULTADO
    // ==================================================

    async findFirst(field, value) {

        const results = await this.findWhere(field, value);

        return results.length > 0

            ? results[0]

            : null;

    }

    // ==================================================
    // BUSCA MÚLTIPLA
    // ==================================================

    async findMany(filters = {}) {

        const documents = await this.findAll();

        return documents.filter(model => {

            return Object.entries(filters).every(

                ([field, value]) => model[field] === value

            );

        });

    }

    // ==================================================
    // EXISTE POR CAMPO
    // ==================================================

    async existsWhere(field, value) {

        const entity = await this.findFirst(field, value);

        return entity !== null;

    }

    // ==================================================
    // CONTAGEM
    // ==================================================

    async count() {

        const documents = await this.findAll();

        return documents.length;

    }

    // ==================================================
    // CRIA
    // ==================================================

    async create(model) {

        const data = this.serialize(model);

        const document = await DatabaseService.create(

            this.collection,

            data

        );

        if (!document) {

            return null;

        }

        model.id = document.id;

        return this.deserialize(document);

    }

    // ==================================================
    // ATUALIZA
    // ==================================================

    async update(model) {

        model.touch();

        const data = this.serialize(model);

        const document = await DatabaseService.update(

            this.collection,

            model.id,

            data

        );

        if (!document) {

            return null;

        }

        return this.deserialize(document);

    }

    // ==================================================
    // REMOVE
    // ==================================================

    async delete(id) {

        return await DatabaseService.delete(

            this.collection,

            id

        );

    }

    // ==================================================
    // SERIALIZAÇÃO
    // ==================================================

    serialize(model) {

        return super.serialize(model);

    }

    // ==================================================
    // DESSERIALIZAÇÃO
    // ==================================================

    deserialize(data) {

        return new this.Model(data);

    }

}

export default FirebaseRepository;
