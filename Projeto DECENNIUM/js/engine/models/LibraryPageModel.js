import BaseModel from "./BaseModel.js";

class LibraryPageModel extends BaseModel {

    constructor(data = {}) {

        super(data);

        this.type = "library-page";
        this.bookId = data.bookId ?? "";
        this.ownerId = data.ownerId ?? null;
        this.ownerName = data.ownerName ?? "Anonimo";
        this.pageNumber = Number(data.pageNumber ?? 1);
        this.title = data.title ?? "";
        this.content = data.content ?? "";
        this.drawings = Array.isArray(data.drawings) ? data.drawings : [];
        this.images = Array.isArray(data.images) ? data.images : [];
        this.notes = Array.isArray(data.notes) ? data.notes : [];
        this.references = Array.isArray(data.references) ? data.references : [];
        this.highlightWords = Array.isArray(data.highlightWords) ? data.highlightWords : [];
        this.torn = data.torn ?? false;
        this.tornBy = data.tornBy ?? null;
        this.deleted = data.deleted ?? false;

    }

    toJSON() {

        return {
            ...super.toJSON(),
            bookId: this.bookId,
            ownerId: this.ownerId,
            ownerName: this.ownerName,
            pageNumber: this.pageNumber,
            title: this.title,
            content: this.content,
            drawings: this.drawings,
            images: this.images,
            notes: this.notes,
            references: this.references,
            highlightWords: this.highlightWords,
            torn: this.torn,
            tornBy: this.tornBy,
            deleted: this.deleted
        };

    }

}

export default LibraryPageModel;
