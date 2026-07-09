import BaseModel from "./BaseModel.js";

class VaultModel extends BaseModel {

    constructor(data = {}) {

        super(data);

        this.type = "vault";
        this.name = data.name ?? "";
        this.serialCode = data.serialCode ?? "";
        this.passwordCode = data.passwordCode ?? "";
        this.description = data.description ?? "";
        this.items = data.items ?? [];
        this.creatorId = data.creatorId ?? null;
        this.creatorName = data.creatorName ?? "Anonimo";

    }

    toJSON() {

        return {
            ...super.toJSON(),
            name: this.name,
            serialCode: this.serialCode,
            passwordCode: this.passwordCode,
            description: this.description,
            items: this.items,
            creatorId: this.creatorId,
            creatorName: this.creatorName
        };

    }

}

export default VaultModel;
