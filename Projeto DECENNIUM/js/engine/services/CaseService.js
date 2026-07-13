// ======================================================
// MAGNUS ENGINE
// CaseService.js
// ======================================================

import BaseService from "./BaseService.js";
import MC from "../Core.js";
import CaseModel from "../models/CaseModel.js";

class CaseService extends BaseService {

    constructor() {

        super(null);

    }

    initialize() {

        this.repository = MC.Repositories.Cases;

    }

    currentUser() {

        return MC.Services.Permissions.currentUser();

    }

    currentUserId() {

        return this.currentUser()?.id || "anon";

    }

    currentUserName() {

        const user = this.currentUser();
        return user?.name || user?.username || "Anonimo";

    }

    isOwner(caseModel) {

        return Boolean(caseModel && caseModel.ownerId === this.currentUserId());

    }

    canOpen(caseModel, password = "") {

        if (!caseModel) return false;
        if (MC.Services.Permissions.isAdmin()) return true;
        if (this.isOwner(caseModel)) return true;
        if (!caseModel.password) return true;
        return String(caseModel.password).trim() === String(password).trim();

    }

    async findById(id) {

        const entity = await this.repository.findById(id);
        if (!entity || entity.status === "deleted") return null;
        return entity;

    }

    async findAll() {

        const entities = await this.repository.findAll();
        return entities.filter(entity => entity.status !== "deleted");

    }

    async create(data = {}) {

        const user = this.currentUser();
        MC.Services.Permissions.assert(Boolean(user), "Voce precisa estar logado para criar casos.");

        const model = new CaseModel({
            ...data,
            code: data.code || await MC.Utils.nextId("CAS"),
            ownerId: user.id,
            creatorName: this.currentUserName(),
            permissions: {
                read: ["public"],
                write: ["public"],
                admin: [user.id]
            }
        });

        return await this.repository.create(model);

    }

    async update(caseModel) {

        const model = caseModel instanceof CaseModel
            ? caseModel
            : new CaseModel(caseModel);

        if (!model.id) {
            throw new Error("Caso sem ID.");
        }

        if (!model.permissions?.read?.length) {
            model.permissions = {
                read: ["public"],
                write: ["public"],
                admin: model.ownerId ? [model.ownerId] : []
            };
        }

        return await this.repository.update(model);

    }

    async patch(id, data = {}) {

        const entity = await this.repository.findById(id);
        if (!entity || entity.status === "deleted") throw new Error("Caso nao encontrado.");

        const allowed = [
            "name",
            "location",
            "objective",
            "description",
            "cover",
            "password",
            "status",
            "priority",
            "classification",
            "photos",
            "notes",
            "pages",
            "audios",
            "dossiers",
            "board"
        ];
        const payload = {};

        allowed.forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(data, key)) return;
            payload[key] = data[key];
            entity[key] = data[key];
        });

        if (!Object.keys(payload).length) return entity;

        payload.updatedAt = new Date().toISOString();
        entity.updatedAt = payload.updatedAt;

        await MC.Database.update(`cases/${id}`, payload);

        return new CaseModel(entity.toJSON ? entity.toJSON() : entity);

    }

    async delete(id) {

        const entity = await this.repository.findById(id);
        MC.Services.Permissions.assert(
            this.isOwner(entity) || MC.Services.Permissions.isAdmin(),
            "Somente o criador pode apagar este caso."
        );
        entity.status = "deleted";
        return await this.repository.update(entity);

    }

    async findActiveForCurrentUser() {

        const activeStatuses = ["Open", "Investigation", "Paused", "not_started", "in_progress"];
        const cases = await this.findAll();

        return cases.filter(caseModel =>

            activeStatuses.includes(caseModel.status)

        );

    }

    // ==================================================
    // ABRIR CASO
    // ==================================================

    async open(caseModel) {

        caseModel.status = "Open";

        return await this.update(caseModel);

    }

    // ==================================================
    // ARQUIVAR CASO
    // ==================================================

    async archive(caseModel) {

        MC.Services.Permissions.assert(
            this.isOwner(caseModel) || MC.Services.Permissions.isAdmin(),
            "Somente o criador pode arquivar este caso."
        );

        caseModel.status = "deleted";

        return await this.update(caseModel);

    }

    // ==================================================
    // CONCLUIR CASO
    // ==================================================

    async solve(caseModel) {

        caseModel.status = "Solved";

        return await this.update(caseModel);

    }

}

export default new CaseService();
