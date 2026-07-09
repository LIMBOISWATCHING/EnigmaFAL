import MC from "../../js/engine/Core.js";

class BasicItems {

    constructor() {
        this.container = null;
        this.items = [];
        this.vaults = [];
        this.itemSearch = "";
        this.vaultSearch = "";
        this.openVaultIds = new Set();
        this.editingItemId = null;
        this.dirty = false;
    }

    async open(container) {

        this.container = container;
        MC.Layout.show();
        MC.Layout.setUser(MC.Auth.current());
        MC.Menu.unlock();
        this.container.innerHTML = await MC.Loader.html("pages/BasicItems/BasicItems.html");
        this.bindEvents();
        await this.loadAll();

    }

    bindEvents() {

        document.getElementById("basic-btn-create-item")
            ?.addEventListener("click", () => this.createItem());

        document.getElementById("basic-btn-create-vault")
            ?.addEventListener("click", () => this.createVault());

        document.getElementById("basic-item-search")
            ?.addEventListener("input", (e) => this.searchItems(e.target.value));

        document.getElementById("vault-search")
            ?.addEventListener("input", (e) => this.searchVaults(e.target.value));

        this.container
            ?.addEventListener("input", (event) => {
                if (event.target.closest(".basic-form") || event.target.closest(".vault-content")) this.dirty = true;
            });

    }

    async close() {

        if (!this.dirty) return true;
        return await MC.UI.confirm("Existem informacoes nao salvas. Sair sem salvar?");

    }

    async loadAll() {

        await Promise.all([
            this.loadItems(),
            this.loadVaults()
        ]);

    }

    async loadItems() {

        const list = document.getElementById("basic-items-list");
        if (!list) return;

        list.innerHTML = `<p class="basic-empty">Carregando itens...</p>`;

        try { this.items = await MC.Services.PublicItems.findAll(); }
        catch (e) { this.items = []; }

        this.renderItems();

    }

    renderItems() {

        const list = document.getElementById("basic-items-list");
        if (!list) return;

        const items = this.items.filter(item => {
            if (!this.itemSearch) return true;
            const haystack = [
                item.name,
                item.id
            ].join(" ").toLowerCase();
            return haystack.includes(this.itemSearch);
        });

        if (!this.items.length) {
            list.innerHTML = `<p class="basic-empty">Nenhum item basico criado ainda.</p>`;
            return;
        }

        if (!items.length) {
            list.innerHTML = `<p class="basic-empty">Nenhum item encontrado.</p>`;
            return;
        }

        list.innerHTML = items.map(item => this.renderItem(item)).join("");

        list.querySelectorAll(".basic-btn-edit-item").forEach(button => {
            button.addEventListener("click", () => this.editItem(button.dataset.id));
        });

        list.querySelectorAll(".basic-btn-delete-item").forEach(button => {
            button.addEventListener("click", () => this.deleteItem(button.dataset.id));
        });

    }

    searchItems(value) {

        this.itemSearch = String(value || "").trim().toLowerCase();
        this.renderItems();

    }

    renderItem(item) {

        const mine = MC.Services.PublicItems.canManage(item);

        return `
            <article class="basic-card">
                <div class="basic-card-photo">
                    ${this.isImg(item.photo)
                        ? `<img src="${this.esc(item.photo)}" alt="${this.esc(item.name)}">`
                        : `<span>ITM</span>`}
                </div>
                <div class="basic-card-body">
                    <div class="basic-card-head">
                        <strong>${this.esc(item.name || "Sem nome")}</strong>
                        <span>ID: ${this.esc(item.id)}</span>
                    </div>
                    <p>${this.esc(item.description || "---")}</p>
                    <div class="basic-card-meta">
                        <span>${this.esc(item.category || "Geral")}</span>
                        <span>Criado por ${this.esc(item.creatorName || "Anonimo")}</span>
                    </div>
                    ${mine ? `
                        <div class="basic-card-actions">
                            <button class="basic-btn-edit-item" data-id="${this.esc(item.id)}" type="button">Editar</button>
                            <button class="basic-btn-delete-item" data-id="${this.esc(item.id)}" type="button">Apagar</button>
                        </div>
                    ` : ""}
                </div>
            </article>`;

    }

    async createItem() {

        const get = id => document.getElementById(id)?.value?.trim() || "";
        const name = get("basic-item-name");
        if (!name) { await MC.UI.alert("O item precisa de um nome."); return; }

        try {
            const data = {
                name,
                category: get("basic-item-category") || "Geral",
                photo: get("basic-item-photo"),
                attackId: get("basic-item-attack"),
                description: get("basic-item-desc")
            };

            if (this.editingItemId) {
                await MC.Services.PublicItems.update(this.editingItemId, data);
            } else {
                await MC.Services.PublicItems.create(data);
            }

            this.clear(["basic-item-name", "basic-item-category", "basic-item-photo", "basic-item-attack", "basic-item-desc"]);
            this.editingItemId = null;
            this.dirty = false;
            this.setItemFormMode(false);
            await this.loadItems();
        } catch (err) {
            await MC.UI.alert("Erro ao salvar item.");
        }

    }

    async editItem(id) {

        const item = this.items.find(entry => entry.id === id);
        if (!item) return;
        if (!MC.Services.PublicItems.canManage(item)) {
            await MC.UI.alert("Somente o criador pode editar este item.");
            return;
        }

        this.editingItemId = id;
        this.set("basic-item-name", item.name || "");
        this.set("basic-item-category", item.category || "");
        this.set("basic-item-photo", item.photo || "");
        this.set("basic-item-attack", item.attackId || "");
        this.set("basic-item-desc", item.description || "");
        this.setItemFormMode(true);

    }

    async deleteItem(id) {

        const item = this.items.find(entry => entry.id === id);
        if (!item) return;
        if (!MC.Services.PublicItems.canManage(item)) {
            await MC.UI.alert("Somente o criador pode apagar este item.");
            return;
        }

        if (!await MC.UI.confirm("Apagar este item basico?")) return;

        try {
            await MC.Services.PublicItems.delete(id);
            if (this.editingItemId === id) {
                this.editingItemId = null;
                this.clear(["basic-item-name", "basic-item-category", "basic-item-photo", "basic-item-attack", "basic-item-desc"]);
                this.setItemFormMode(false);
            }
            await this.loadItems();
        } catch (err) {
            await MC.UI.alert("Erro ao apagar item.");
        }

    }

    set(id, value) {

        const el = document.getElementById(id);
        if (el) el.value = value ?? "";

    }

    setItemFormMode(editing) {

        const button = document.getElementById("basic-btn-create-item");
        if (button) button.textContent = editing ? "Salvar Item" : "Criar Item";

    }

    async loadVaults() {

        const list = document.getElementById("vaults-list");
        if (!list) return;

        list.innerHTML = `<p class="basic-empty">Carregando cofres...</p>`;

        try { this.vaults = await MC.Services.Vaults.findAll(); }
        catch (e) { this.vaults = []; }

        this.renderVaults();

    }

    renderVaults() {

        const list = document.getElementById("vaults-list");
        if (!list) return;

        const vaults = this.vaults.filter(vault => {
            if (!this.vaultSearch) return true;
            const haystack = [
                vault.name,
                vault.serialCode,
                vault.creatorName
            ].join(" ").toLowerCase();
            return haystack.includes(this.vaultSearch);
        });

        if (!this.vaults.length) {
            list.innerHTML = `<p class="basic-empty">Nenhum cofre registrado ainda.</p>`;
            return;
        }

        if (!vaults.length) {
            list.innerHTML = `<p class="basic-empty">Nenhum cofre encontrado.</p>`;
            return;
        }

        const creatorId = MC.Services.Vaults.currentCreatorId();
        list.innerHTML = vaults.map(vault => this.renderVault(vault, MC.Services.Vaults.canManage(vault) || vault.creatorId === creatorId)).join("");

        list.querySelectorAll(".vault-btn-toggle").forEach(button => {
            button.addEventListener("click", () => this.toggleVault(button.dataset.id));
        });

        list.querySelectorAll(".vault-btn-break").forEach(button => {
            button.addEventListener("click", () => this.breakVault(button.dataset.id));
        });

        list.querySelectorAll(".vault-btn-add-public").forEach(button => {
            button.addEventListener("click", () => this.addPublicItemToVault(button.dataset.id));
        });

        list.querySelectorAll(".vault-btn-create-item").forEach(button => {
            button.addEventListener("click", () => this.createVaultItem(button.dataset.id));
        });

        list.querySelectorAll(".vault-btn-edit-item").forEach(button => {
            button.addEventListener("click", () => this.editVaultItem(button.dataset.vault, button.dataset.id));
        });

        list.querySelectorAll(".vault-btn-delete-item").forEach(button => {
            button.addEventListener("click", () => this.deleteVaultItem(button.dataset.vault, button.dataset.id));
        });

    }

    searchVaults(value) {

        this.vaultSearch = String(value || "").trim().toLowerCase();
        this.renderVaults();

    }

    renderVault(vault, owned) {

        const open = this.openVaultIds.has(vault.id);
        const items = vault.items || [];

        return `
            <article class="vault-card ${owned ? "owned" : ""}">
                <div class="vault-card-mark">
                    <span>SAFE</span>
                    <strong>${this.esc(vault.id)}</strong>
                </div>
                <div class="vault-card-body">
                    <div class="vault-card-head">
                        <strong>${this.esc(vault.name || "Cofre sem nome")}</strong>
                        ${owned ? `<span>SEU COFRE</span>` : `<span>PUBLICO</span>`}
                    </div>
                    <p>${this.esc(vault.description || "---")}</p>
                    <div class="vault-codes">
                        <span>Serie: ${this.esc(vault.serialCode || "---")}</span>
                        <span>Senha: ${owned ? this.esc(vault.passwordCode || "---") : "********"}</span>
                    </div>
                    <div class="basic-card-meta">
                        <span>Criado por ${this.esc(vault.creatorName || "Anonimo")}</span>
                    </div>
                    <div class="vault-actions">
                        <button class="vault-btn-toggle" data-id="${this.esc(vault.id)}" type="button">${open ? "Fechar Cofre" : "Abrir Cofre"}</button>
                        ${owned ? `<button class="vault-btn-break" data-id="${this.esc(vault.id)}" type="button">Quebrar Cofre</button>` : ""}
                    </div>
                    ${open ? this.renderVaultContent(vault, items) : ""}
                </div>
            </article>`;

    }

    renderVaultContent(vault, items) {

        return `
            <div class="vault-content">
                <div class="vault-content-tools">
                    <input class="basic-input vault-public-id" data-id="${this.esc(vault.id)}" type="text" placeholder="ID de item publico...">
                    <button class="vault-btn-add-public" data-id="${this.esc(vault.id)}" type="button">Adicionar ID</button>
                </div>
                <div class="vault-item-form">
                    <input class="basic-input vault-new-name" data-id="${this.esc(vault.id)}" type="text" placeholder="Novo item do cofre">
                    <input class="basic-input vault-new-category" data-id="${this.esc(vault.id)}" type="text" placeholder="Categoria">
                    <input class="basic-input vault-new-photo" data-id="${this.esc(vault.id)}" type="text" placeholder="Foto (URL)">
                    <input class="basic-input vault-new-attack" data-id="${this.esc(vault.id)}" type="text" placeholder="ID de ataque atribuido">
                    <textarea class="basic-textarea vault-new-desc" data-id="${this.esc(vault.id)}" rows="2" placeholder="Descricao"></textarea>
                    <button class="vault-btn-create-item" data-id="${this.esc(vault.id)}" type="button">Criar no Cofre</button>
                </div>
                <div class="vault-items-list">
                    ${items.length
                        ? items.map(item => this.renderVaultItem(vault, item)).join("")
                        : `<p class="basic-empty">Nenhum item dentro deste cofre.</p>`}
                </div>
            </div>`;

    }

    renderVaultItem(vault, item) {

        return `
            <div class="vault-item">
                <div>
                    <strong>${this.esc(item.name || "Item sem nome")}</strong>
                    <span>ID: ${this.esc(item.id)}</span>
                </div>
                <p>${this.esc(item.description || "---")}</p>
                <div class="basic-card-meta">
                    <span>${this.esc(item.category || "Cofre")}</span>
                    <span>${item.source === "public" ? "Item publico" : "Item do cofre"}</span>
                    ${item.attackId ? `<span>Atk: ${this.esc(item.attackId)}</span>` : ""}
                </div>
                <div class="vault-item-actions">
                    <button class="vault-btn-edit-item" data-vault="${this.esc(vault.id)}" data-id="${this.esc(item.id)}" type="button">Editar</button>
                    <button class="vault-btn-delete-item" data-vault="${this.esc(vault.id)}" data-id="${this.esc(item.id)}" type="button">Apagar</button>
                </div>
            </div>`;

    }

    async toggleVault(id) {

        if (this.openVaultIds.has(id)) {
            this.openVaultIds.delete(id);
            this.renderVaults();
            return;
        }

        const vault = this.vaults.find(entry => entry.id === id);
        if (!vault) return;

        const owned = MC.Services.Vaults.canManage(vault) || vault.creatorId === MC.Services.Vaults.currentCreatorId();
        if (!owned) {
            const password = await MC.UI.prompt("Digite a senha do cofre:");
            if (password !== vault.passwordCode) {
                await MC.UI.alert("Senha incorreta.");
                return;
            }
        }

        this.openVaultIds.add(id);
        this.renderVaults();

    }

    async addPublicItemToVault(vaultId) {

        const input = document.querySelector(`.vault-public-id[data-id="${CSS.escape(vaultId)}"]`);
        const itemId = input?.value?.trim();
        if (!itemId) return;

        let item = null;
        try { item = await MC.Services.PublicItems.findById(itemId); }
        catch (e) { item = null; }

        if (!item) {
            await MC.UI.alert("Item publico nao encontrado.");
            return;
        }

        try {
            await MC.Services.Vaults.addPublicItem(vaultId, item);
            if (input) input.value = "";
            this.dirty = false;
            await this.loadVaults();
        } catch (err) {
            await MC.UI.alert("Erro ao adicionar item ao cofre.");
        }

    }

    async createVaultItem(vaultId) {

        const get = (selector) => document.querySelector(`${selector}[data-id="${CSS.escape(vaultId)}"]`)?.value?.trim() || "";
        const name = get(".vault-new-name");
        if (!name) {
            await MC.UI.alert("O item do cofre precisa de um nome.");
            return;
        }

        try {
            await MC.Services.Vaults.createStoredItem(vaultId, {
                name,
                category: get(".vault-new-category") || "Cofre",
                photo: get(".vault-new-photo"),
                attackId: get(".vault-new-attack"),
                description: get(".vault-new-desc")
            });

            [".vault-new-name", ".vault-new-category", ".vault-new-photo", ".vault-new-attack", ".vault-new-desc"].forEach(selector => {
                const el = document.querySelector(`${selector}[data-id="${CSS.escape(vaultId)}"]`);
                if (el) el.value = "";
            });

            this.dirty = false;
            await this.loadVaults();
        } catch (err) {
            await MC.UI.alert("Erro ao criar item no cofre.");
        }

    }

    async editVaultItem(vaultId, itemId) {

        const vault = this.vaults.find(entry => entry.id === vaultId);
        const item = (vault?.items || []).find(entry => entry.id === itemId);
        if (!item) return;

        const name = await MC.UI.prompt("Nome do item:", item.name || "");
        if (!name) return;
        const category = await MC.UI.prompt("Categoria:", item.category || "Cofre") ?? item.category;
        const photo = await MC.UI.prompt("Foto (URL):", item.photo || "") ?? item.photo;
        const attackId = await MC.UI.prompt("ID de ataque atribuido:", item.attackId || "") ?? item.attackId;
        const description = await MC.UI.prompt("Descricao:", item.description || "") ?? item.description;

        try {
            await MC.Services.Vaults.updateItem(vaultId, itemId, { name, category, photo, attackId, description });
            await this.loadVaults();
        } catch (err) {
            await MC.UI.alert("Erro ao editar item do cofre.");
        }

    }

    async deleteVaultItem(vaultId, itemId) {

        if (!await MC.UI.confirm("Apagar este item do cofre?")) return;

        try {
            await MC.Services.Vaults.deleteItem(vaultId, itemId);
            await this.loadVaults();
        } catch (err) {
            await MC.UI.alert("Erro ao apagar item do cofre.");
        }

    }

    async createVault() {

        const get = id => document.getElementById(id)?.value?.trim() || "";
        const name = get("vault-name");
        const passwordCode = get("vault-password");

        if (!name || !passwordCode) {
            await MC.UI.alert("O cofre precisa de nome e codigo de senha.");
            return;
        }

        try {
            await MC.Services.Vaults.create({
                name,
                serialCode: this.generateSerialCode(),
                passwordCode,
                description: get("vault-desc")
            });
            this.clear(["vault-name", "vault-password", "vault-desc"]);
            this.dirty = false;
            await this.loadVaults();
        } catch (err) {
            await MC.UI.alert("Erro ao criar cofre.");
        }

    }

    async breakVault(id) {

        const vault = this.vaults.find(entry => entry.id === id);
        if (!vault || !MC.Services.Vaults.canManage(vault)) return;

        const password = await MC.UI.prompt("Digite a senha do cofre para quebra-lo:");
        if (password === null) return;

        if (!await MC.UI.confirm("Quebrar este cofre apagara ele para sempre.")) return;

        try {
            await MC.Services.Vaults.breakVault(id, password);
            this.openVaultIds.delete(id);
            await this.loadVaults();
        } catch (err) {
            await MC.UI.alert(err.message || "Erro ao quebrar cofre.");
        }

    }

    generateSerialCode() {

        const block = () => String(Math.floor(Math.random() * 100000)).padStart(5, "0");
        return `${block()}-${block()}-SAFE`;

    }

    clear(ids) {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
    }

    isImg(value) {
        return typeof value === "string" && (
            value.startsWith("http") ||
            value.startsWith("/") ||
            value.startsWith("assets/") ||
            value.startsWith("data:image")
        );
    }

    esc(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

}

export default new BasicItems();
