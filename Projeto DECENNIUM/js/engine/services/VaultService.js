import VaultModel from "../models/VaultModel.js";

class VaultService {

    constructor() {
        this.repository = null;
    }

    initialize() {
        this.repository = MC.Repositories.Vaults;
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

    currentCreatorId() {
        return this.creator().id;
    }

    canManage(vault) {
        return MC.Services.Permissions.isAdmin() || vault?.creatorId === this.currentCreatorId();
    }

    async findAll() {

        const creatorId = this.currentCreatorId();
        const vaults = await this.repository.findAll();

        return vaults.sort((a, b) => {
            const aOwn = this.canManage(a) || a.creatorId === creatorId ? 1 : 0;
            const bOwn = this.canManage(b) || b.creatorId === creatorId ? 1 : 0;
            if (aOwn !== bOwn) return bOwn - aOwn;
            return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        });

    }

    async create(data = {}) {

        const creator = this.creator();
        const model = new VaultModel({
            ...data,
            id: data.id || await MC.Utils.nextId("COF"),
            ownerId: null,
            creatorId: creator.id,
            creatorName: creator.name,
            permissions: { read: ["public"], write: ["public"], admin: [] }
        });

        return await this.repository.create(model);

    }

    async findById(id) {

        return await this.repository.findById(id);

    }

    async update(vault) {

        return await this.repository.update(vault);

    }

    async addPublicItem(vaultId, item) {

        const vault = await this.findById(vaultId);
        if (!vault) throw new Error("Cofre nao encontrado.");

        if (!vault.items) vault.items = [];
        if (vault.items.some(existing => existing.id === item.id)) return vault;

        vault.items.push({
            id: item.id,
            name: item.name || "Item basico",
            description: item.description || "",
            photo: item.photo || "",
            category: item.category || "Geral",
            attackId: item.attackId || "",
            source: "public"
        });

        return await this.update(vault);

    }

    async createStoredItem(vaultId, data = {}) {

        const vault = await this.findById(vaultId);
        if (!vault) throw new Error("Cofre nao encontrado.");

        if (!vault.items) vault.items = [];

        const item = {
            id: await MC.Utils.nextId("ITM"),
            name: data.name || "Item de cofre",
            description: data.description || "",
            photo: data.photo || "",
            category: data.category || "Cofre",
            attackId: data.attackId || "",
            source: "vault",
            vaultId: vault.id
        };

        vault.items.push(item);
        await this.update(vault);
        return item;

    }

    async findItemById(itemId) {

        const vaults = await this.repository.findAll();

        for (const vault of vaults) {
            const item = (vault.items || []).find(entry => entry.id === itemId);
            if (item) {
                return {
                    ...item,
                    vaultId: vault.id,
                    vaultName: vault.name
                };
            }
        }

        return null;

    }

    async updateItem(vaultId, itemId, data = {}) {

        const vault = await this.findById(vaultId);
        if (!vault) throw new Error("Cofre nao encontrado.");

        const item = (vault.items || []).find(entry => entry.id === itemId);
        if (!item) throw new Error("Item nao encontrado.");

        Object.assign(item, {
            name: data.name ?? item.name,
            category: data.category ?? item.category,
            photo: data.photo ?? item.photo,
            attackId: data.attackId ?? item.attackId,
            description: data.description ?? item.description
        });

        return await this.update(vault);

    }

    async deleteItem(vaultId, itemId) {

        const vault = await this.findById(vaultId);
        if (!vault) throw new Error("Cofre nao encontrado.");

        vault.items = (vault.items || []).filter(item => item.id !== itemId);
        return await this.update(vault);

    }

    async breakVault(vaultId, password) {

        const vault = await this.findById(vaultId);
        if (!vault) throw new Error("Cofre nao encontrado.");
        if (!this.canManage(vault)) throw new Error("Somente o criador pode quebrar este cofre.");
        if (password !== vault.passwordCode) throw new Error("Senha incorreta.");

        return await this.repository.delete(vaultId);

    }

}

export default new VaultService();
