import BaseModel from "./BaseModel.js";

class BasicItemModel extends BaseModel {

    constructor(data = {}) {

        super(data);

        this.type = "basic-item";
        this.name = data.name ?? "";
        this.description = data.description ?? "";
        this.photo = data.photo ?? "";
        this.category = data.category ?? "Geral";
        this.attackId = data.attackId ?? "";
        this.creatorId = data.creatorId ?? null;
        this.creatorName = data.creatorName ?? "Anonimo";

    }

    toJSON() {

        return {
            ...super.toJSON(),
            name: this.name,
            description: this.description,
            photo: this.photo,
            category: this.category,
            attackId: this.attackId,
            creatorId: this.creatorId,
            creatorName: this.creatorName
        };

    }

}

export default BasicItemModel;
