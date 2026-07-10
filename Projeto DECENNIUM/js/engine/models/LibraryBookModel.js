import BaseModel from "./BaseModel.js";

class LibraryBookModel extends BaseModel {

    constructor(data = {}) {

        super(data);

        this.type = "library-book";
        this.categoryId = data.categoryId ?? "";
        this.title = data.title ?? "";
        this.ownerId = data.ownerId ?? null;
        this.ownerName = data.ownerName ?? "Anonimo";
        this.fontFamily = data.fontFamily ?? "Georgia, serif";
        this.textColor = data.textColor ?? "#1b130d";
        this.coverStyle = data.coverStyle ?? "dark";
        this.coverColor = data.coverColor ?? "#17100c";
        this.coverBorderColor = data.coverBorderColor ?? "#2d2118";
        this.pageStyle = data.pageStyle ?? "middle";
        this.pageColor = data.pageColor ?? "#d8c49c";
        this.seal = data.seal ?? "incompleto";
        this.password = data.password ?? "";
        this.references = Array.isArray(data.references) ? data.references : [];
        this.deleted = data.deleted ?? false;

    }

    toJSON() {

        return {
            ...super.toJSON(),
            categoryId: this.categoryId,
            title: this.title,
            ownerId: this.ownerId,
            ownerName: this.ownerName,
            fontFamily: this.fontFamily,
            textColor: this.textColor,
            coverStyle: this.coverStyle,
            coverColor: this.coverColor,
            coverBorderColor: this.coverBorderColor,
            pageStyle: this.pageStyle,
            pageColor: this.pageColor,
            seal: this.seal,
            password: this.password,
            references: this.references,
            deleted: this.deleted
        };

    }

}

export default LibraryBookModel;
