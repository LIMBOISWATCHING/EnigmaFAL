import BasicItemModel from "../models/BasicItemModel.js";

class PublicItemService {

    constructor() {
        this.repository = null;
    }

    initialize() {
        this.repository = MC.Repositories.BasicItems;
    }

    creator() {

        const user = MC.Auth?.current?.() || null;
        const storageKey = "mc-public-creator-key";
        let localKey = localStorage.getItem(storageKey);

        if (!localKey) {
            localKey = "LOCAL-" + Date.now() + "-" + Math.floor(Math.random() * 999999);
            localStorage.setItem(storageKey, localKey);
        }

        return {
            id: user?.id || localKey,
            name: user?.name || "Anonimo"
        };

    }

    async findAll() {

        const items = await this.repository.findAll();
        return items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    }

    async findById(id) {

        return await this.repository.findById(id);

    }

    async create(data = {}) {

        const creator = this.creator();
        const model = new BasicItemModel({
            ...data,
            id: data.id || await MC.Utils.nextId("ITM"),
            ownerId: null,
            creatorId: creator.id,
            creatorName: creator.name,
            permissions: { read: ["public"], write: ["public"], admin: [] }
        });

        return await this.repository.create(model);

    }

    canManage(item) {

        return MC.Services.Permissions.isAdmin() || item?.creatorId === this.creator().id;

    }

    async update(id, data = {}) {

        const item = await this.findById(id);
        if (!item) throw new Error("Item nao encontrado.");
        if (!this.canManage(item)) throw new Error("Somente o criador pode editar este item.");

        item.update({
            name: data.name ?? item.name,
            category: data.category ?? item.category,
            photo: data.photo ?? item.photo,
            attackId: data.attackId ?? item.attackId,
            description: data.description ?? item.description
        });

        return await this.repository.update(item);

    }

    async delete(id) {

        const item = await this.findById(id);
        if (!item) throw new Error("Item nao encontrado.");
        if (!this.canManage(item)) throw new Error("Somente o criador pode apagar este item.");

        return await this.repository.delete(id);

    }

}

export default new PublicItemService();
