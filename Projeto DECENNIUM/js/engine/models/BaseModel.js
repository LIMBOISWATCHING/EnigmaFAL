// ======================================================
// MAGNUS ENGINE
// BaseModel.js
//
// Classe base para todas as entidades da Engine.
// Define os campos comuns compartilhados por todos
// os Models do Magnus Files.
// ======================================================

class BaseModel {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(data = {}) {

        this.id = data.id ?? null;

        this.type = data.type ?? "entity";

        this.version = data.version ?? 1;

        this.status = data.status ?? "active";

        this.createdAt = data.createdAt ?? new Date().toISOString();

        this.updatedAt = data.updatedAt ?? new Date().toISOString();

        this.ownerId = data.ownerId ?? null;

        this.permissions = data.permissions ?? {

            read: [],

            write: [],

            admin: []

        };

        this.metadata = data.metadata ?? {};

    }

    // ==================================================
    // SERIALIZA O MODEL
    // ==================================================

    toJSON() {

        return {

            id: this.id,

            type: this.type,

            version: this.version,

            status: this.status,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt,

            ownerId: this.ownerId,

            permissions: this.permissions,

            metadata: this.metadata

        };

    }

    // ==================================================
    // ATUALIZA DATA DE MODIFICAÇÃO
    // ==================================================

    touch() {

        this.updatedAt = new Date().toISOString();

    }

    // ==================================================
    // ALTERA STATUS
    // ==================================================

    setStatus(status) {

        this.status = status;

        this.touch();

    }

    // ==================================================
    // DEFINE PROPRIETÁRIO
    // ==================================================

    setOwner(ownerId) {

        this.ownerId = ownerId;

        this.touch();

    }

    // ==================================================
    // DEFINE PERMISSÕES
    // ==================================================

    setPermissions(permissions) {

        this.permissions = permissions;

        this.touch();

    }

    // ==================================================
    // DEFINE METADADOS
    // ==================================================

    setMetadata(metadata) {

        this.metadata = metadata;

        this.touch();

    }

    // ==================================================
    // MESCLA NOVOS DADOS
    // ==================================================

    update(data = {}) {

        Object.assign(this, data);

        this.touch();

    }

}

export default BaseModel;