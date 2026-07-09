// ======================================================
// MAGNUS ENGINE
// BaseService.js
//
// Classe base para todos os Services da Engine.
// Responsável por encapsular regras de negócio
// utilizando os Repositories.
// ======================================================

import MC from "../Core.js";

class BaseService {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(repository) {

        this.repository = repository;

    }

    // ==================================================
    // BUSCA POR ID
    // ==================================================

    async findById(id) {

        const entity = await this.repository.findById(id);

        if (!entity) {

            return null;

        }

        if (entity.status === "deleted") {

            return null;

        }

        return MC.Services.Permissions.canView(entity)

            ? entity

            : null;

    }

    // ==================================================
    // LISTA TODOS
    // ==================================================

    async findAll() {

        const entities = await this.repository.findAll();

        return entities.filter(entity =>

            entity.status !== "deleted" &&
            MC.Services.Permissions.canView(entity)

        );

    }

    // ==================================================
    // CRIA
    // ==================================================

    async create(model) {

        const collection = this.repository.collection;
        const user = MC.Services.Permissions.currentUser();

        MC.Services.Permissions.assert(

            MC.Services.Permissions.canCreate(collection, user),

            "Voce nao tem permissao para criar este registro."

        );

        if (user && !model.ownerId) {

            model.ownerId = user.id;

        }

        if (!model.id) {

            model.id = await MC.Utils.nextId(this.idPrefix(collection, model));

        }

        return await this.repository.create(model);

    }

    idPrefix(collection, model) {

        const prefixes = {

            users: "USR",
            characters: "CHR",
            creatures: "CR",
            attacks: "ATK",
            abilities: "HAB",
            effects: "EFT",
            cases: "CAS",
            battles: "BTL"

        };

        return prefixes[collection] || String(model.type || "ENT").toUpperCase().slice(0, 3);

    }

    // ==================================================
    // ATUALIZA
    // ==================================================

    async update(model) {

        MC.Services.Permissions.assert(

            MC.Services.Permissions.canUpdate(model),

            "Voce nao tem permissao para alterar este registro."

        );

        return await this.repository.update(model);

    }

    // ==================================================
    // REMOVE
    // ==================================================

    async delete(id) {

        const entity = await this.repository.findById(id);

        MC.Services.Permissions.assert(

            MC.Services.Permissions.canDelete(entity),

            "Voce nao tem permissao para remover este registro."

        );

        if ("active" in entity) {

            entity.active = false;

        }

        entity.status = "deleted";

        return await this.repository.update(entity);

    }

    // ==================================================
    // EXISTE
    // ==================================================

    async exists(id) {

        return await this.repository.exists(id);

    }

    // ==================================================
    // CONTAGEM
    // ==================================================

    async count() {

        return await this.repository.count();

    }

}

export default BaseService;
