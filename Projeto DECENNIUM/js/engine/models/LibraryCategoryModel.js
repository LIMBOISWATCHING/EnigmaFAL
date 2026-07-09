import BaseModel from "./BaseModel.js";

class LibraryCategoryModel extends BaseModel {

    constructor(data = {}) {

        super(data);

        this.type = "library-category";
        this.name = data.name ?? "";
        this.slug = data.slug ?? "";
        this.description = data.description ?? "";
        this.order = data.order ?? 0;
        this.deleted = data.deleted ?? false;

    }

    toJSON() {

        return {
            ...super.toJSON(),
            name: this.name,
            slug: this.slug,
            description: this.description,
            order: this.order,
            deleted: this.deleted
        };

    }

}

export default LibraryCategoryModel;
