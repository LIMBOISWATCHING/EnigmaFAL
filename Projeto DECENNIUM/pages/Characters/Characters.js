// ======================================================
// MAGNUS FILES
// Characters.js
//
// Pagina de personagens — lista, ficha, dano, ataques.
// ======================================================

import MC from "../../js/engine/Core.js";
import CharacterModel from "../../js/engine/models/CharacterModel.js";

class Characters {

    constructor() {

        this.container = null;

        this.current = null;

        this.isNew = false;

        this.dirty = false;

        this.sessionDamageLog = [];

        this.turnEffortUsed = 0;

        this.pendingEffort = 0;

        this.editingItemIndex = null;

        this.pendingEffortByStat = { will: 0, agility: 0, intellect: 0 };
        this.pendingEffortEnergyCost = 0;
        this.pendingEffortDiscountByStat = { will: 0, agility: 0, intellect: 0 };
        this.lastTurnEffortByStat = { will: 0, agility: 0, intellect: 0 };

        this.turnSummary = [];

        this.inventoryCollapsed = false;

        this.inventorySearch = "";

    }

    async open(container) {

        this.container = container;
        MC.Layout.show();
        MC.Layout.setUser(MC.Auth.current());
        MC.Menu.unlock();
        this.container.innerHTML =
            await MC.Loader.html("pages/Characters/Characters.html");
        this.bindGlobalEvents();
        await this.showList();

    }

    async close() {
        if (!(await this.confirmDiscardChanges())) {
            return false;
        }
        this.current = null;
        this.isNew = false;
        this.dirty = false;
        this.sessionDamageLog = [];
        this.turnEffortUsed = 0;
        this.pendingEffort = 0;
        this.pendingEffortDiscountByStat = { will: 0, agility: 0, intellect: 0 };
        this.editingItemIndex = null;
    }

    bindGlobalEvents() {

        document.getElementById("chars-btn-new")
            ?.addEventListener("click", () => this.openNewSheet());
        document.getElementById("chars-btn-back")
            ?.addEventListener("click", () => this.showList());
        document.getElementById("chars-btn-save")
            ?.addEventListener("click", () => this.saveCharacter());
        document.getElementById("chars-btn-delete")
            ?.addEventListener("click", () => this.deleteCharacter());
        document.getElementById("chars-btn-link-attack")
            ?.addEventListener("click", () => this.linkAttack());
        document.getElementById("chars-btn-apply-damage")
            ?.addEventListener("click", () => this.applyDamageByCode());
        document.getElementById("chars-btn-direct-damage")
            ?.addEventListener("click", () => this.applyDirectDamage());
        document.getElementById("chars-btn-pass-turn")
            ?.addEventListener("click", () => this.passTurn());
        document.getElementById("chars-btn-reset-turn")
            ?.addEventListener("click", () => this.resetTurnCounter());
        document.getElementById("chars-btn-apply-effect")
            ?.addEventListener("click", () => this.applyEffectById());
        document.getElementById("chars-btn-add-item")
            ?.addEventListener("click", () => this.addInventoryItem());
        document.getElementById("chars-btn-add-basic-item")
            ?.addEventListener("click", () => this.addBasicItemById());
        document.getElementById("chars-btn-use-effort")
            ?.addEventListener("click", () => this.useEffort());
        document.getElementById("chars-btn-clear-effort")
            ?.addEventListener("click", () => this.clearEffort());
        document.getElementById("chars-btn-add-good-trait")
            ?.addEventListener("click", () => this.addTrait("good"));
        document.getElementById("chars-btn-add-bad-trait")
            ?.addEventListener("click", () => this.addTrait("bad"));
        document.getElementById("chars-btn-show-good-trait")
            ?.addEventListener("click", () => this.toggleTraitForm("good"));
        document.getElementById("chars-btn-show-bad-trait")
            ?.addEventListener("click", () => this.toggleTraitForm("bad"));
        document.getElementById("chars-turn-summary-close")
            ?.addEventListener("click", () => this.closeTurnSummary());
        document.getElementById("chars-btn-toggle-inventory")
            ?.addEventListener("click", () => this.toggleInventory());
        document.getElementById("chars-inventory-search")
            ?.addEventListener("input", (e) => this.searchInventory(e.target.value));
        document.getElementById("chars-photo-url")
            ?.addEventListener("input", (e) => this.updatePhotoPreview(e.target.value));

        ["chars-hp-current", "chars-hp-max",
         "chars-en-current", "chars-en-max"].forEach(id => {
            document.getElementById(id)
                ?.addEventListener("input", () => this.updateBars());
        });

        document.getElementById("chars-sheet-view")
            ?.addEventListener("input", () => this.markDirty());

    }

    // ==================================================
    // LISTA
    // ==================================================

    async showList() {

        if (!(await this.confirmDiscardChanges())) {
            return;
        }

        const listView = document.getElementById("chars-list-view");
        const sheetView = document.getElementById("chars-sheet-view");
        if (sheetView) sheetView.style.display = "none";
        if (listView) listView.style.display = "";

        const grid = document.getElementById("chars-grid");
        if (!grid) return;

        grid.innerHTML = `<p class="chars-empty">Carregando personagens...</p>`;
        const user = MC.Auth.current();
        if (!user) {
            grid.innerHTML = `<p class="chars-empty">Sessao nao encontrada.</p>`;
            return;
        }

        let characters = [];
        try {
            characters = await MC.Services.Characters.findActiveByPlayer(user.id);
        } catch (e) { characters = []; }

        if (!characters.length) {
            grid.innerHTML = `<p class="chars-empty">Nenhum personagem criado ainda.</p>`;
            return;
        }

        grid.innerHTML = characters.map(ch => this.renderCard(ch)).join("");
        grid.querySelectorAll(".chars-card").forEach(card => {
            card.addEventListener("click", () => this.openSheet(card.dataset.id));
        });

    }

    renderCard(ch) {

        const photo = this.resolveImageUrl(ch);
        const initials = this.initials(ch.name || "?");
        const hp = ch.health || {};
        const hpPct = hp.maximum > 0 ? Math.round((hp.current / hp.maximum) * 100) : 0;

        return `
            <article class="chars-card" data-id="${this.esc(ch.id)}">
                <div class="chars-card-photo">
                    ${photo
                        ? `<img src="${this.esc(photo)}" alt="${this.esc(ch.name)}">`
                        : `<span class="chars-card-ph">${this.esc(initials)}</span>`}
                </div>
                <div class="chars-card-info">
                    <strong class="chars-card-name">${this.esc(ch.name || "Sem nome")}</strong>
                    <span class="chars-card-type">${this.esc(ch.characterType || "---")}</span>
                    <div class="chars-card-hp-track"><div class="chars-card-hp-fill" style="width:${hpPct}%"></div></div>
                    <span class="chars-card-meta">HP ${hp.current ?? 0}/${hp.maximum ?? 0}</span>
                </div>
            </article>`;

    }

    // ==================================================
    // FICHA
    // ==================================================

    async openSheet(id) {

        if (!(await this.confirmDiscardChanges())) {
            return;
        }

        let character = null;
        try { character = await MC.Services.Characters.findById(id); }
        catch (e) { character = null; }
        if (!character) { MC.log("Personagem nao encontrado."); return; }

        this.current = character;
        this.isNew = false;
        this.dirty = false;
        this.sessionDamageLog = [];
        this.turnEffortUsed = 0;
        this.pendingEffort = 0;
        this.pendingEffortByStat = { will: 0, agility: 0, intellect: 0 };
        this.pendingEffortEnergyCost = 0;
        this.pendingEffortDiscountByStat = { will: 0, agility: 0, intellect: 0 };
        this.turnSummary = [];
        this.editingItemIndex = null;
        this.inventorySearch = "";
        this.fillSheet(character);
        this.toggleViews(true);

    }

    async openNewSheet() {

        if (this.dirty && !await MC.UI.confirm("Existem alteracoes nao salvas. Sair sem salvar?")) {
            return;
        }

        const user = MC.Auth.current();
        this.current = new CharacterModel({
            playerId: user?.id || null,
            ownerId: user?.id || null
        });
        this.isNew = true;
        this.dirty = false;
        this.sessionDamageLog = [];
        this.turnEffortUsed = 0;
        this.pendingEffort = 0;
        this.pendingEffortByStat = { will: 0, agility: 0, intellect: 0 };
        this.pendingEffortEnergyCost = 0;
        this.pendingEffortDiscountByStat = { will: 0, agility: 0, intellect: 0 };
        this.turnSummary = [];
        this.editingItemIndex = null;
        this.inventorySearch = "";
        this.fillSheet(this.current);
        this.toggleViews(true);

    }

    toggleViews(showSheet) {

        const listView = document.getElementById("chars-list-view");
        const sheetView = document.getElementById("chars-sheet-view");
        const headerBtn = document.getElementById("chars-btn-new");
        if (showSheet) {
            if (listView) listView.style.display = "none";
            if (sheetView) sheetView.style.display = "";
            if (headerBtn) headerBtn.style.display = "none";
        } else {
            if (listView) listView.style.display = "";
            if (sheetView) sheetView.style.display = "none";
            if (headerBtn) headerBtn.style.display = "";
        }

    }

    fillSheet(ch) {

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val ?? "";
        };

        const photoUrl = this.resolveImageUrl(ch);
        set("chars-photo-url", photoUrl || "");
        this.updatePhotoPreview(photoUrl);
        set("chars-name", ch.name);
        set("chars-age", ch.age || "");
        set("chars-type", ch.characterType);
        set("chars-summary-phrase", ch.summaryPhrase || "");
        set("chars-desc", ch.description);
        set("chars-hp-current", ch.health?.current ?? 0);
        set("chars-hp-max", ch.health?.maximum ?? 0);
        set("chars-en-current", ch.energy?.current ?? 0);
        set("chars-en-max", ch.energy?.maximum ?? 0);
        this.updateBars();
        set("chars-will-base", ch.will?.base ?? 0);
        set("chars-agi-base", ch.agility?.base ?? 0);
        set("chars-int-base", ch.intellect?.base ?? 0);
        set("chars-will-limit", ch.will?.limit ?? 0);
        set("chars-agi-limit", ch.agility?.limit ?? 0);
        set("chars-int-limit", ch.intellect?.limit ?? 0);
        set("chars-effort-base", ch.effortLimit?.base ?? 0);
        set("chars-inventory-search", this.inventorySearch);
        this.renderAttacksList(ch.attackIds || []);
        this.renderInventory(ch.inventory || []);
        this.renderTraits("good", ch.goodTraits || []);
        this.renderTraits("bad", ch.badTraits || []);
        this.renderInventoryVisibility();
        this.renderSufferLog(this.sessionDamageLog);
        this.renderActiveEffects(ch.activeEffects || []);
        this.renderTurnCounter();
        this.clearInventoryForm();
        this.renderEffortStatus();
        this.updateDiceModifiers();

        const deleteBtn = document.getElementById("chars-btn-delete");
        if (deleteBtn) deleteBtn.style.display = this.isNew ? "none" : "";

    }

    readSheet() {

        const get = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
        const num = (id) => { const v = parseFloat(get(id)); return isNaN(v) ? 0 : v; };
        const ch = this.current;

        ch.name = get("chars-name");
        ch.age = num("chars-age");
        ch.characterType = get("chars-type");
        ch.description = get("chars-desc");
        ch.summaryPhrase = get("chars-summary-phrase");

        const photoUrl = get("chars-photo-url");
        ch.photoIds = (photoUrl && this.isImg(photoUrl)) ? [photoUrl] : [];

        ch.health = { maximum: num("chars-hp-max"), current: num("chars-hp-current"), temporary: ch.health?.temporary ?? 0 };
        ch.energy = { maximum: num("chars-en-max"), current: num("chars-en-current"), temporary: ch.energy?.temporary ?? 0 };

        // Stats: somente base (current = base para calculos) + limite por stat
        ch.will = { base: num("chars-will-base"), current: num("chars-will-base"), limit: num("chars-will-limit") };
        ch.agility = { base: num("chars-agi-base"), current: num("chars-agi-base"), limit: num("chars-agi-limit") };
        ch.intellect = { base: num("chars-int-base"), current: num("chars-int-base"), limit: num("chars-int-limit") };
        ch.effortLimit = { base: num("chars-effort-base") };

        ch.inventory = this.current.inventory || [];
        ch.disabledPassiveIds = this.current.disabledPassiveIds || [];
        ch.goodTraits = this.current.goodTraits || [];
        ch.badTraits = this.current.badTraits || [];
        ch.turnNumber = Math.max(1, parseInt(this.current.turnNumber || 1, 10) || 1);

        ch.history = (ch.history || []).filter(entry => entry.type !== "damage");

        return ch;

    }

    // ==================================================
    // CRUD
    // ==================================================

    async saveCharacter(options = {}) {

        if (!this.current) return;
        const ch = this.readSheet();
        if (!ch.name || !ch.name.trim()) {
            if (!options.silent) await MC.UI.alert("O personagem precisa de um nome.");
            return null;
        }

        try {
            if (this.isNew) {
                const created = await MC.Services.Characters.create(ch);
                this.current = created;
                this.isNew = false;
                this.dirty = false;
                MC.log("Personagem criado: " + ch.name);
            } else {
                this.current = await MC.Services.Characters.update(ch);
                this.dirty = false;
                MC.log("Personagem salvo: " + ch.name);
            }
            if (!options.silent) {
                await this.showList();
            }

            return this.current;
        } catch (err) {
            MC.log("Erro ao salvar: " + err.message);
            if (!options.silent) await MC.UI.alert("Erro ao salvar. Tente novamente.");
            return null;
        }

    }

    markDirty() {

        if (this.current) {

            this.dirty = true;

        }

    }

    async confirmDiscardChanges() {

        if (!this.dirty) {

            return true;

        }

        return await this.showConfirm("Existem alteracoes nao salvas. Sair sem salvar?");

    }

    async deleteCharacter() {

        if (!this.current || this.isNew) return;
        const ok = await this.showConfirm("Excluir \"" + this.current.name + "\" permanentemente?");
        if (!ok) return;
        try {
            await MC.Services.Characters.delete(this.current.id);
            this.dirty = false;
            MC.log("Personagem excluido: " + this.current.name);
            await this.showList();
        } catch (err) {
            await MC.UI.alert("Erro ao excluir.");
        }

    }

    // ==================================================
    // VINCULAR / DESVINCULAR ATAQUES
    // ==================================================

    async linkAttack() {

        const input = document.getElementById("chars-attack-link-input");
        const id = input?.value?.trim();
        if (!id || !this.current) return;
        if (!this.current.attackIds) this.current.attackIds = [];
        if (this.current.attackIds.includes(id)) { await MC.UI.alert("Ja vinculado."); return; }

        let entity = null;
        try { entity = await MC.Services.Attacks.findById(id); } catch (e) {}
        if (!entity) { try { entity = await MC.Services.Abilities.findById(id); } catch (e) {} }
        if (!entity) { await MC.UI.alert("Nao encontrado."); return; }

        this.current.attackIds.push(id);
        await this.renderAttacksList(this.current.attackIds);
        input.value = "";
        this.markDirty();

    }

    async renderAttacksList(ids) {

        const list = document.getElementById("chars-attacks-list");
        if (!list) return;
        if (!ids || !ids.length) {
            list.innerHTML = `<p class="chars-empty-small">Nenhum ataque vinculado.</p>`;
            return;
        }

        const items = await Promise.all(ids.map(async (id) => {
            let entity = null;
            let kind = "Registro";
            try {
                entity = await MC.Services.Attacks.findById(id);
                if (entity) kind = "Ataque";
            } catch (e) {}
            if (!entity) {
                try {
                    entity = await MC.Services.Abilities.findById(id);
                    if (entity) kind = "Habilidade";
                } catch (e) {}
            }

            return { id, entity, kind };
        }));

        list.innerHTML = items.map(({ id, entity, kind }) => `
            <div class="chars-attack-item">
                <div class="chars-attack-info">
                    <strong>${this.esc(entity?.name || "Nao encontrado")}</strong>
                    <span class="chars-attack-code">${this.esc(id)} | ${this.esc(kind)}</span>
                </div>
                <div class="chars-attack-costs">
                    ${entity?.damage ? `<span>DMG ${this.esc(this.formatDamage(entity.damage))}</span>` : ""}
                    <span>EN ${entity?.energyCost ?? 0}</span>
                    <span>LIM ${entity?.limitCost ?? 0}</span>
                    ${entity?.cooldown ? `<span>CD ${entity.cooldown}</span>` : ""}
                </div>
                <button class="chars-btn-use-attack" data-id="${this.esc(id)}" type="button">Usar</button>
                ${entity?.category === "Passive" ? `<button class="chars-btn-toggle-passive" data-id="${this.esc(id)}" type="button">${(this.current.disabledPassiveIds || []).includes(id) ? "OFF" : "ON"}</button>` : ""}
                <button class="chars-btn-remove-attack" data-id="${this.esc(id)}" type="button">X</button>
            </div>
        `).join("");

        list.querySelectorAll(".chars-btn-use-attack").forEach(btn => {
            btn.addEventListener("click", () => this.useLinkedAction(btn.dataset.id));
        });

        list.querySelectorAll(".chars-btn-remove-attack").forEach(btn => {
            btn.addEventListener("click", () => this.unlinkAttack(btn.dataset.id));
        });

        list.querySelectorAll(".chars-btn-toggle-passive").forEach(btn => {
            btn.addEventListener("click", () => this.togglePassive(btn.dataset.id));
        });

    }

    unlinkAttack(id) {
        if (!this.current) return;
        this.current.attackIds = (this.current.attackIds || []).filter(a => a !== id);
        this.renderAttacksList(this.current.attackIds);
        this.markDirty();
    }

    async addTrait(type) {

        if (!this.current) return;

        const nameId = type === "good" ? "chars-good-trait-name" : "chars-bad-trait-name";
        const descId = type === "good" ? "chars-good-trait-desc" : "chars-bad-trait-desc";
        const key = type === "good" ? "goodTraits" : "badTraits";
        const name = document.getElementById(nameId)?.value?.trim() || "";
        const description = document.getElementById(descId)?.value?.trim() || "";

        if (!name) {
            await MC.UI.alert("A caracteristica precisa de um nome.");
            return;
        }

        if (!this.current[key]) this.current[key] = [];
        this.current[key].push({ name, description });

        document.getElementById(nameId).value = "";
        document.getElementById(descId).value = "";
        this.toggleTraitForm(type, false);
        this.renderTraits(type, this.current[key]);
        this.markDirty();

    }

    toggleTraitForm(type, force) {

        const form = document.getElementById(type === "good" ? "chars-good-trait-form" : "chars-bad-trait-form");
        const button = document.getElementById(type === "good" ? "chars-btn-show-good-trait" : "chars-btn-show-bad-trait");
        if (!form) return;

        const show = typeof force === "boolean" ? force : form.style.display === "none";
        form.style.display = show ? "" : "none";
        if (button) button.textContent = show ? "Cancelar" : "Criar";

    }

    togglePassive(id) {

        if (!this.current.disabledPassiveIds) this.current.disabledPassiveIds = [];
        if (this.current.disabledPassiveIds.includes(id)) {
            this.current.disabledPassiveIds = this.current.disabledPassiveIds.filter(entry => entry !== id);
        } else {
            this.current.disabledPassiveIds.push(id);
        }
        this.renderAttacksList(this.current.attackIds || []);
        this.markDirty();

    }

    async useLinkedAction(id) {

        if (!this.current) return;

        let entity = null;
        try { entity = await MC.Services.Attacks.findById(id); } catch (e) {}
        if (!entity) { try { entity = await MC.Services.Abilities.findById(id); } catch (e) {} }
        if (!entity) { await MC.UI.alert("Acao nao encontrada."); return; }

        const energyCost = Math.max(0, parseInt(entity.energyCost || 0, 10) || 0);
        if ((this.current.energy?.current || 0) < energyCost) {
            await MC.UI.alert("Energia insuficiente.");
            return;
        }

        this.current.energy.current -= energyCost;
        const enEl = document.getElementById("chars-en-current");
        if (enEl) enEl.value = this.current.energy.current;

        this.turnSummary.push(`Usou ${entity.name || id} e gastou ${energyCost} EN.`);

        if ((entity.target || "Self") === "Self") {
            await this.applyLinkedEffects(entity);
            this.turnSummary.push(`${entity.name || id} aplicou efeitos em si mesmo.`);
        }

        this.updateBars();
        this.markDirty();

    }

    formatDamage(damage = {}) {

        const count = parseInt(damage.diceCount ?? damage.count ?? 0, 10) || 0;
        const sides = parseInt(damage.diceSides ?? damage.sides ?? 0, 10) || 0;
        const bonus = parseInt(damage.bonus ?? 0, 10) || 0;
        const dice = count > 0 && sides > 0 ? `${count}d${sides}` : "0";
        if (bonus > 0) return `${dice}+${bonus}`;
        if (bonus < 0) return `${dice}-${Math.abs(bonus)}`;
        return dice;

    }

    renderTraits(type, traits) {

        const list = document.getElementById(type === "good" ? "chars-good-traits-list" : "chars-bad-traits-list");
        if (!list) return;

        if (!traits || !traits.length) {
            list.innerHTML = `<p class="chars-empty-small">Nenhuma caracteristica.</p>`;
            return;
        }

        list.innerHTML = traits.map((trait, index) => `
            <details class="chars-trait-item">
                <summary>${this.esc(trait.name || "Sem nome")}</summary>
                <p>${this.esc(trait.description || "---")}</p>
                <button class="chars-btn-remove-trait" data-type="${type}" data-idx="${index}" type="button">X</button>
            </details>
        `).join("");

        list.querySelectorAll(".chars-btn-remove-trait").forEach(button => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.removeTrait(button.dataset.type, parseInt(button.dataset.idx, 10));
            });
        });

    }

    removeTrait(type, index) {

        const key = type === "good" ? "goodTraits" : "badTraits";
        if (!this.current?.[key]) return;
        this.current[key].splice(index, 1);
        this.renderTraits(type, this.current[key]);
        this.markDirty();

    }

    toggleInventory() {

        this.inventoryCollapsed = !this.inventoryCollapsed;
        this.renderInventoryVisibility();

    }

    renderInventoryVisibility() {

        const body = document.getElementById("chars-inventory-body");
        const button = document.getElementById("chars-btn-toggle-inventory");
        if (body) body.style.display = this.inventoryCollapsed ? "none" : "";
        if (button) button.textContent = this.inventoryCollapsed ? "Abrir" : "Fechar";

    }

    searchInventory(value) {

        this.inventorySearch = (value || "").trim().toLowerCase();
        this.renderInventory(this.current?.inventory || []);

    }

    // ==================================================
    // INVENTARIO
    // ==================================================

    async addInventoryItem() {

        if (!this.current) return;

        const name = document.getElementById("chars-item-name")?.value?.trim() || "";
        const category = document.getElementById("chars-item-category")?.value?.trim() || "";
        const photo = document.getElementById("chars-item-photo")?.value?.trim() || "";
        const attackId = document.getElementById("chars-item-attack")?.value?.trim() || "";
        const description = document.getElementById("chars-item-desc")?.value?.trim() || "";

        if (!name) {

            await MC.UI.alert("O item precisa de um nome.");

            return;

        }

        if (!this.current.inventory) this.current.inventory = [];

        const existing = this.editingItemIndex !== null
            ? this.current.inventory[this.editingItemIndex]
            : null;
        const itemId = existing?.id || await MC.Utils.nextId("ITM");
        const item = {

            id: itemId,
            name,
            category,
            photo,
            description,
            attackId

        };

        if (existing) this.current.inventory[this.editingItemIndex] = item;
        else this.current.inventory.push(item);

        this.clearInventoryForm();

        this.renderInventory(this.current.inventory);
        this.markDirty();

    }

    async addBasicItemById() {

        if (!this.current) return;

        const input = document.getElementById("chars-basic-item-id");
        const id = input?.value?.trim();
        if (!id) return;

        let basicItem = null;
        try { basicItem = await MC.Services.PublicItems.findById(id); }
        catch (e) { basicItem = null; }

        if (!basicItem) {
            try { basicItem = await MC.Services.Vaults.findItemById(id); }
            catch (e) { basicItem = null; }
        }

        if (!basicItem) {
            await MC.UI.alert("Item nao encontrado.");
            return;
        }

        if (!this.current.inventory) this.current.inventory = [];

        if (this.current.inventory.some(item => item.id === basicItem.id)) {
            await MC.UI.alert("Este item ja esta no inventario.");
            return;
        }

        this.current.inventory.push({
            id: basicItem.id,
            name: basicItem.name || "Item basico",
            category: basicItem.category || "Geral",
            photo: basicItem.photo || "",
            description: basicItem.description || "",
            attackId: basicItem.attackId || ""
        });

        input.value = "";
        this.renderInventory(this.current.inventory);
        this.markDirty();

    }

    renderInventory(items) {

        const list = document.getElementById("chars-inventory-list");

        if (!list) return;

        const filtered = (items || []).filter(item => {

            if (!this.inventorySearch) return true;
            return String(item.name || "").toLowerCase().includes(this.inventorySearch);

        });

        if (!items || !items.length) {

            list.innerHTML = `<p class="chars-empty-small">Nenhum item no inventario.</p>`;

            return;

        }

        if (!filtered.length) {

            list.innerHTML = `<p class="chars-empty-small">Nenhum item encontrado.</p>`;

            return;

        }

        list.innerHTML = filtered.map((item) => {

            const index = items.indexOf(item);
            if (!item.id) item.id = MC.Utils.generateId("ITM", Date.now() % 10000 + index);

            return `

            <div class="chars-inventory-item">
                <div class="chars-inventory-photo">
                    ${this.isImg(item.photo)
                        ? `<img src="${this.esc(item.photo)}" alt="${this.esc(item.name)}">`
                        : `<span>?</span>`}
                </div>
                <div class="chars-inventory-info">
                    <strong>${this.esc(item.name)}</strong>
                    <span class="chars-inventory-id">ID: ${this.esc(item.id)}</span>
                    <span class="chars-inventory-id">Categoria: ${this.esc(item.category || "Geral")}</span>
                    <p>${this.esc(item.description || "---")}</p>
                    ${item.attackId ? `<span>Atk: ${this.esc(item.attackId)}</span>` : ""}
                </div>
                <div class="chars-inventory-actions">
                    <button class="chars-btn-edit-item" data-idx="${index}" type="button">Editar</button>
                    <button class="chars-btn-remove-item" data-idx="${index}" type="button">X</button>
                </div>
            </div>

        `;

        }).join("");

        list.querySelectorAll(".chars-btn-edit-item").forEach(button => {

            button.addEventListener("click", () => this.editInventoryItem(parseInt(button.dataset.idx, 10)));

        });

        list.querySelectorAll(".chars-btn-remove-item").forEach(button => {

            button.addEventListener("click", () => this.removeInventoryItem(parseInt(button.dataset.idx, 10)));

        });

    }

    editInventoryItem(index) {

        if (!this.current?.inventory?.[index]) return;

        const item = this.current.inventory[index];
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value ?? "";
        };

        this.editingItemIndex = index;
        set("chars-item-name", item.name || "");
        set("chars-item-category", item.category || "");
        set("chars-item-photo", item.photo || "");
        set("chars-item-attack", item.attackId || "");
        set("chars-item-desc", item.description || "");

        const button = document.getElementById("chars-btn-add-item");
        if (button) button.textContent = "Salvar Item";

    }

    clearInventoryForm() {

        ["chars-item-name", "chars-item-category", "chars-item-photo", "chars-item-attack", "chars-item-desc"].forEach(id => {

            const el = document.getElementById(id);

            if (el) el.value = "";

        });

        this.editingItemIndex = null;
        const button = document.getElementById("chars-btn-add-item");
        if (button) button.textContent = "Adicionar Item";

    }

    removeInventoryItem(index) {

        if (!this.current?.inventory) return;

        this.current.inventory.splice(index, 1);

        if (this.editingItemIndex === index) {
            this.clearInventoryForm();
        } else if (this.editingItemIndex !== null && this.editingItemIndex > index) {
            this.editingItemIndex -= 1;
        }

        this.renderInventory(this.current.inventory);

        this.markDirty();

    }

    // ==================================================
    // DANO
    // ==================================================

    async applyDamageByCode() {

        const input = document.getElementById("chars-suffer-code-input");
        const code = input?.value?.trim();
        if (!code || !this.current) return;

        let attack = null;
        try { attack = await MC.Services.Attacks.findById(code); } catch (e) {}
        if (!attack) { try { attack = await MC.Services.Abilities.findById(code); } catch (e) {} }
        if (!attack) { await MC.UI.alert("Ataque nao encontrado."); return; }

        const roll = this.rollAttackDamage(attack.damage || {}, attack);
        const total = roll.total;

        if (total > 0) {
            this.applyDamageToHP(total);
            this.logDamage(attack.name || code, total, "codigo", roll.critical);
        }

        await this.applyLinkedEffects(attack);
        this.pendingEffort = 0;
        this.pendingEffortByStat = { will: 0, agility: 0, intellect: 0 };
        this.pendingEffortEnergyCost = 0;
        this.pendingEffortDiscountByStat = { will: 0, agility: 0, intellect: 0 };
        this.renderEffortStatus();
        this.markDirty();
        input.value = "";

    }

    rollAttackDamage(damage = {}, attack = {}) {

        const diceCount = Math.max(0, parseInt(damage.diceCount ?? damage.count ?? 0, 10) || 0);
        const diceSides = Math.max(0, parseInt(damage.diceSides ?? damage.sides ?? 0, 10) || 0);
        const bonus = parseInt(damage.bonus ?? 0, 10) || 0;
        const criticalChance = Math.max(0, Math.min(100, parseFloat(attack.criticalChance ?? 0) || 0));
        const criticalMultiplier = Math.max(1, parseFloat(attack.criticalMultiplier ?? 1) || 1);
        let total = bonus;
        let rolled = 0;
        let maxRoll = 0;

        if (diceCount <= 0 || diceSides <= 0) {
            const critical = Math.random() * 100 < criticalChance;
            if (critical) total = Math.round(total * criticalMultiplier);
            return { total: Math.max(0, total), critical };
        }

        for (let i = 0; i < diceCount; i++) {
            const value = Math.floor(Math.random() * diceSides) + 1;
            rolled += value;
            total += value;
        }

        maxRoll = diceCount * diceSides;

        const criticalByChance = Math.random() * 100 < criticalChance;
        const criticalByMaxDamage = rolled === maxRoll;
        const critical = criticalByChance || criticalByMaxDamage;

        if (critical) total = Math.round(total * criticalMultiplier);

        return { total: Math.max(0, total), critical };

    }

    applyDirectDamage() {

        const input = document.getElementById("chars-direct-dmg-input");
        const value = parseFloat(input?.value);
        if (isNaN(value) || value <= 0 || !this.current) return;

        const total = Math.round(value);
        this.applyDamageToHP(total);
        this.logDamage("Dano direto", total, "direto", false);
        this.markDirty();
        input.value = "";

    }

    applyDamageToHP(amount) {

        if (!this.current.health) this.current.health = { maximum: 0, current: 0, temporary: 0 };
        this.current.health.current = Math.max(0, this.current.health.current - amount);
        this.triggerPassiveAbilities("OnDamage");
        const el = document.getElementById("chars-hp-current");
        if (el) el.value = this.current.health.current;
        this.updateBars();

    }

    logDamage(source, amount, method, critical = false) {

        this.sessionDamageLog.push({
            type: "damage", attackName: source, damage: amount,
            method: method, critical: Boolean(critical), timestamp: new Date().toISOString()
        });
        this.turnSummary.push(`Dano tomado: ${amount} HP por ${source}.`);
        this.renderSufferLog(this.sessionDamageLog);

    }

    renderSufferLog(history) {

        const log = document.getElementById("chars-suffer-log");
        if (!log) return;
        const entries = (history || []).filter(h => h.type === "damage");
        if (!entries.length) { log.innerHTML = `<p class="chars-empty-small">Nenhum dano registrado.</p>`; return; }

        log.innerHTML = entries.map(e => {
            const t = new Date(e.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            return `<div class="chars-suffer-entry ${e.critical ? "critical" : ""}">
                <span class="chars-suffer-name">${this.esc(e.attackName)}</span>
                <span class="chars-suffer-dmg">-${e.damage} HP${e.critical ? " CRIT" : ""}</span>
                <span class="chars-suffer-time">${this.esc(t)}</span>
            </div>`;
        }).join("");

    }

    // ==================================================
    // APLICAR EFEITO POR ID
    // ==================================================

    async applyEffectById() {

        const input = document.getElementById("chars-effect-link-input");
        const id = input?.value?.trim();
        if (!id || !this.current) return;

        let effect = null;
        try { effect = await MC.Services.Effects.findById(id); } catch (e) {}
        if (!effect) { await MC.UI.alert("Efeito nao encontrado."); return; }

        this.applyEffectToCharacter(effect);
        this.markDirty();
        input.value = "";

    }

    // ==================================================
    // EFEITOS ATIVOS
    // ==================================================

    renderActiveEffects(effects) {

        const list = document.getElementById("chars-active-effects");
        if (!list) return;
        if (!effects || !effects.length) { list.innerHTML = `<p class="chars-empty-small">Nenhum efeito ativo.</p>`; return; }

        const labels = { Buff: "BUFF", Debuff: "DEBUFF", HealOverTime: "CURA", DamageOverTime: "DOT", Status: "STATUS", Control: "CTRL", Passive: "PASS", Special: "SPEC" };
        list.innerHTML = effects.map((eff, idx) => {
            const cat = eff.category || "Buff";
            const cls = cat === "Buff" ? "chars-eff-buff" : cat === "Debuff" ? "chars-eff-debuff" : cat === "HealOverTime" ? "chars-eff-heal" : cat === "DamageOverTime" ? "chars-eff-dot" : "chars-eff-buff";
            const tick = eff.tick || {};
            const tickInfo = tick.type ? `${tick.type === "heal" ? "Cura" : "Dano"} ${tick.attribute || ""} (${tick.value ?? 0})` : "";
            return `<div class="chars-effect-item ${cls}">
                <div class="chars-effect-info">
                    <span class="chars-effect-name">${this.esc(eff.name)}</span>
                    <span class="chars-effect-detail">${labels[cat] || cat} ${tickInfo}</span>
                </div>
                <div class="chars-effect-turns">
                    <span class="chars-effect-turn-count">${eff.remainingTurns ?? 0}</span>
                    <span class="chars-effect-turn-label">turnos</span>
                </div>
                <button class="chars-btn-remove-effect" data-idx="${idx}" type="button">X</button>
            </div>`;
        }).join("");

        list.querySelectorAll(".chars-btn-remove-effect").forEach(btn => {
            btn.addEventListener("click", () => this.removeActiveEffect(parseInt(btn.dataset.idx)));
        });

    }

    removeActiveEffect(idx) {
        if (!this.current?.activeEffects) return;
        const removed = this.current.activeEffects.splice(idx, 1);
        if (removed.length) this.revertEffect(removed[0]);
        this.renderActiveEffects(this.current.activeEffects);
        this.markDirty();
    }

    revertEffect(eff) {
        const cat = eff?.category || "";
        const tick = eff?.tick || {};
        // Revert stat changes from Buff/Debuff (not health/energy ticks)
        if (cat === "Buff" || cat === "Debuff") {
            const attr = tick.attribute || "";
            if (attr && attr !== "health" && attr !== "energy") {
                const stat = this.current[attr];
                if (stat && typeof stat.base === "number") {
                    const val = (tick.value || 0) * (tick.multiplier || 1);
                    if (cat === "Buff") stat.current = Math.max(0, (stat.current || 0) - val);
                    else stat.current = (stat.current || 0) + val;
                }
            }
        }
    }

    // ==================================================
    // PASSAR TURNO
    // ==================================================

    async passTurn() {

        if (!this.current) return;

        this.lastTurnEffortByStat = { ...this.pendingEffortByStat };
        this.current.turnNumber = Math.max(1, parseInt(this.current.turnNumber || 1, 10) || 1) + 1;
        await this.triggerPassiveAbilities("TurnEnd");
        await this.triggerPassiveAbilities("Always");
        this.renderTurnCounter();

        if (!this.current?.activeEffects?.length) {
            this.showTurnSummary();
            this.expireTurnEffort();
            this.markDirty();
            return;
        }
        const effects = this.current.activeEffects;
        const expired = [];

        for (let i = effects.length - 1; i >= 0; i--) {
            const eff = effects[i];
            const tick = eff.tick || {};

            // Process tick effects (heal or damage per turn)
            if (tick.type === "heal") {
                const attr = tick.attribute || "health";
                const val = Math.round((tick.value || 0) * (tick.multiplier || 1));
                if (attr === "health") {
                    this.current.health.current = Math.min(this.current.health.maximum, this.current.health.current + val);
                    this.turnSummary.push(`Recuperou ${val} HP por ${eff.name || "efeito"}.`);
                } else if (attr === "energy") {
                    this.current.energy.current = Math.min(this.current.energy.maximum, this.current.energy.current + val);
                    this.turnSummary.push(`Recuperou ${val} EN por ${eff.name || "efeito"}.`);
                }
            } else if (tick.type === "damage") {
                const attr = tick.attribute || "health";
                const val = Math.round((tick.value || 0) * (tick.multiplier || 1));
                if (attr === "health") {
                    this.current.health.current = Math.max(0, this.current.health.current - val);
                    this.turnSummary.push(`Sofreu ${val} HP por ${eff.name || "efeito"}.`);
                } else if (attr === "energy") {
                    this.current.energy.current = Math.max(0, this.current.energy.current - val);
                    this.turnSummary.push(`Perdeu ${val} EN por ${eff.name || "efeito"}.`);
                }
            }

            // Decrement turn counter
            eff.remainingTurns = (eff.remainingTurns ?? 0) - 1;
            if (eff.remainingTurns <= 0) expired.push(i);
        }

        // Remove expired effects and revert their stat changes
        for (const idx of expired) { this.revertEffect(effects[idx]); effects.splice(idx, 1); }

        // Update UI
        const hpEl = document.getElementById("chars-hp-current");
        if (hpEl) hpEl.value = this.current.health.current;
        const enEl = document.getElementById("chars-en-current");
        if (enEl) enEl.value = this.current.energy.current;
        this.updateBars();
        this.renderActiveEffects(this.current.activeEffects);
        this.renderTurnCounter();
        this.showTurnSummary();
        this.expireTurnEffort();
        this.markDirty();

    }

    expireTurnEffort() {

        this.turnEffortUsed = 0;
        this.pendingEffort = 0;
        this.pendingEffortByStat = { will: 0, agility: 0, intellect: 0 };
        this.pendingEffortEnergyCost = 0;
        this.pendingEffortDiscountByStat = { will: 0, agility: 0, intellect: 0 };
        this.renderEffortStatus();
        this.updateDiceModifiers();

    }

    async triggerPassiveAbilities(trigger) {

        if (!this.current?.attackIds?.length) return;

        for (const id of this.current.attackIds) {
            if ((this.current.disabledPassiveIds || []).includes(id)) continue;

            let ability = null;
            try { ability = await MC.Services.Abilities.findById(id); } catch (e) {}
            if (!ability || ability.category !== "Passive") continue;
            if ((ability.trigger || "Always") !== trigger && !(trigger === "Always" && ability.trigger === "Manual")) continue;

            await this.applyLinkedEffects(ability);
            this.turnSummary.push(`Passiva ativada: ${ability.name || id}.`);
        }

    }

    showTurnSummary() {

        const modal = document.getElementById("chars-turn-summary-modal");
        const content = document.getElementById("chars-turn-summary-content");
        if (!modal || !content) return;

        const gains = [
            `Vontade +${this.lastTurnEffortByStat?.will || 0}`,
            `Agilidade +${this.lastTurnEffortByStat?.agility || 0}`,
            `Intelecto +${this.lastTurnEffortByStat?.intellect || 0}`
        ];
        const entries = this.turnSummary.length ? this.turnSummary : ["Nada relevante aconteceu neste turno."];

        content.innerHTML = `
            <ul>${entries.map(entry => `<li>${this.esc(entry)}</li>`).join("")}</ul>
            <div class="chars-turn-gains">${gains.map(gain => `<span>${this.esc(gain)}</span>`).join("")}</div>
        `;
        modal.style.display = "flex";
        this.turnSummary = [];

    }

    closeTurnSummary() {

        const modal = document.getElementById("chars-turn-summary-modal");
        if (modal) modal.style.display = "none";

    }

    renderTurnCounter() {

        const counter = document.getElementById("chars-turn-number");
        if (!counter) return;

        const turn = Math.max(1, parseInt(this.current?.turnNumber || 1, 10) || 1);
        counter.textContent = String(turn);

    }

    resetTurnCounter() {

        if (!this.current) return;
        this.current.turnNumber = 1;
        this.renderTurnCounter();
        this.turnSummary.push("Contagem de turnos reiniciada.");
        this.markDirty();

    }

    applyEffectToCharacter(effectModel) {

        if (!this.current.activeEffects) this.current.activeEffects = [];
        const eff = {
            name: effectModel.name || "Efeito",
            category: effectModel.category || "Buff",
            duration: effectModel.duration || 1,
            remainingTurns: effectModel.duration || 1,
            tick: effectModel.tick || { type: null, value: 0, attribute: null, multiplier: 1 },
            effectId: effectModel.id || null
        };

        // Apply immediate stat changes for Buff/Debuff
        const cat = eff.category;
        const tick = eff.tick || {};
        if (cat === "Buff" || cat === "Debuff") {
            const attr = tick.attribute || "";
            if (attr && attr !== "health" && attr !== "energy") {
                const stat = this.current[attr];
                if (stat?.base != null) {
                    const val = (tick.value || 0) * (tick.multiplier || 1);
                    if (cat === "Buff") stat.current = (stat.current || 0) + val;
                    else stat.current = Math.max(0, (stat.current || 0) - val);
                }
            }
        }

        // Do NOT apply HoT/DoT immediately - they tick on turn pass only

        this.current.activeEffects.push(eff);
        this.turnSummary.push(`Efeito aplicado: ${eff.name}.`);
        this.renderActiveEffects(this.current.activeEffects);

        // Update bars if health/energy changed
        const hpEl = document.getElementById("chars-hp-current");
        if (hpEl) hpEl.value = this.current.health.current;
        const enEl = document.getElementById("chars-en-current");
        if (enEl) enEl.value = this.current.energy.current;
        this.updateBars();
        this.markDirty();

    }

    async applyLinkedEffects(attack) {

        const effectIds = attack.effectIds || [];

        for (const id of effectIds) {

            let effect = null;

            try {

                effect = await MC.Services.Effects.findById(id);

            } catch (error) {

                effect = null;

            }

            if (effect) {

                this.applyEffectToCharacter(effect);

            }

        }

    }

    async useEffort() {

        if (!this.current) return;

        const amount = Math.max(1, parseInt(document.getElementById("chars-effort-use")?.value || "1", 10));
        const stat = document.getElementById("chars-effort-stat")?.value || "will";
        const limit = Math.max(0, parseInt(this.current.effortLimit?.base || 0, 10));
        const statLimit = Math.max(0, parseInt(this.current[stat]?.limit || 0, 10));
        const available = Math.max(0, limit - this.turnEffortUsed);

        if (amount > available) {

            await MC.UI.alert("Esforco acima do limite disponivel neste turno.");

            return;

        }

        let rawCost = 0;

        for (let i = 0; i < amount; i++) {

            rawCost += (this.turnEffortUsed + i) === 0 ? 3 : 2;

        }

        const usedDiscount = Math.max(0, this.pendingEffortDiscountByStat?.[stat] || 0);
        const discount = Math.max(0, Math.min(rawCost, statLimit - usedDiscount));
        const cost = Math.max(0, rawCost - discount);

        if ((this.current.energy?.current || 0) < cost) {

            await MC.UI.alert("Energia insuficiente para esse esforco.");

            return;

        }

        this.current.energy.current -= cost;
        this.turnEffortUsed += amount;
        this.pendingEffort += amount;
        this.pendingEffortByStat[stat] = (this.pendingEffortByStat[stat] || 0) + amount * 3;
        this.pendingEffortEnergyCost += cost;
        this.pendingEffortDiscountByStat[stat] = usedDiscount + discount;
        this.turnSummary.push(`Esforco ${amount} em ${this.statLabel(stat)}: +${amount * 3}, custo ${cost} EN.`);

        const enEl = document.getElementById("chars-en-current");
        if (enEl) enEl.value = this.current.energy.current;

        this.updateBars();
        this.updateDiceModifiers();
        this.renderEffortStatus();
        this.markDirty();

    }

    clearEffort() {

        if (!this.current) return;

        if (this.pendingEffortEnergyCost > 0) {
            this.current.energy.current = Math.min(
                this.current.energy?.maximum || this.current.energy.current,
                (this.current.energy?.current || 0) + this.pendingEffortEnergyCost
            );
        }

        this.turnSummary.push(`Esforco pendente removido: ${this.pendingEffort} nivel(is).`);
        this.turnEffortUsed = 0;
        this.pendingEffort = 0;
        this.pendingEffortByStat = { will: 0, agility: 0, intellect: 0 };
        this.pendingEffortEnergyCost = 0;
        this.pendingEffortDiscountByStat = { will: 0, agility: 0, intellect: 0 };

        const enEl = document.getElementById("chars-en-current");
        if (enEl) enEl.value = this.current.energy.current;
        this.updateBars();
        this.renderEffortStatus();
        this.updateDiceModifiers();
        this.markDirty();

    }

    renderEffortStatus() {

        const status = document.getElementById("chars-effort-status");

        if (!status) return;

        const limit = this.current?.effortLimit?.base || 0;

        status.textContent = `Esforco ${this.turnEffortUsed}/${limit} | VON +${this.pendingEffortByStat.will || 0} AGI +${this.pendingEffortByStat.agility || 0} INT +${this.pendingEffortByStat.intellect || 0}`;

    }

    updateDiceModifiers() {

        const modFor = (stat) => {
            const current = parseFloat(this.current?.[stat]?.current || 0) || 0;
            const base = parseFloat(this.current?.[stat]?.base || 0) || 0;
            return Math.round((current - base) + (this.pendingEffortByStat?.[stat] || 0));
        };

        window.MC_DICE_MODIFIERS = {
            will: modFor("will"),
            agility: modFor("agility"),
            intellect: modFor("intellect")
        };

    }

    statLabel(stat) {

        return { will: "Vontade", agility: "Agilidade", intellect: "Intelecto" }[stat] || stat;

    }

    // ==================================================
    // BARRAS E UTILITARIOS
    // ==================================================

    updateBars() {

        const num = (id) => { const el = document.getElementById(id); const v = parseFloat(el?.value); return isNaN(v) ? 0 : v; };
        const hpCur = num("chars-hp-current"), hpMax = num("chars-hp-max");
        const enCur = num("chars-en-current"), enMax = num("chars-en-max");
        const hpPct = hpMax > 0 ? Math.min(100, Math.round((hpCur / hpMax) * 100)) : 0;
        const enPct = enMax > 0 ? Math.min(100, Math.round((enCur / enMax) * 100)) : 0;
        const hpFill = document.getElementById("chars-hp-fill");
        const enFill = document.getElementById("chars-en-fill");
        if (hpFill) hpFill.style.width = hpPct + "%";
        if (enFill) enFill.style.width = enPct + "%";

    }

    updatePhotoPreview(url) {

        const preview = document.getElementById("chars-photo-preview");
        if (!preview) return;
        if (url && this.isImg(url)) preview.innerHTML = `<img src="${this.esc(url)}" alt="Foto">`;
        else preview.innerHTML = `<span class="chars-photo-placeholder">?</span>`;

    }

    resolveImageUrl(ch) {
        const p = ch.photoIds?.[0];
        if (this.isImg(p)) return p;
        if (this.isImg(ch.photo)) return ch.photo;
        if (this.isImg(ch.metadata?.photoUrl)) return ch.metadata.photoUrl;
        return null;
    }

    isImg(v) {
        if (!v || typeof v !== "string") return false;
        return v.startsWith("http") || v.startsWith("/") || v.startsWith("assets/") || v.startsWith("data:image");
    }

    initials(name) {
        return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("") || "?";
    }

    esc(v) {
        return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    async showConfirm(message) {

        return new Promise(async (resolve) => {
            const overlay = document.getElementById("chars-confirm-modal");
            const msgEl = document.getElementById("chars-confirm-message");
            const okBtn = document.getElementById("chars-confirm-ok");
            const cancelBtn = document.getElementById("chars-confirm-cancel");
            if (!overlay || !msgEl || !okBtn || !cancelBtn) { resolve(await MC.UI.confirm(message)); return; }

            msgEl.textContent = message;
            overlay.style.display = "flex";

            const cleanup = () => {
                overlay.style.display = "none";
                okBtn.removeEventListener("click", onOk);
                cancelBtn.removeEventListener("click", onCancel);
            };
            const onOk = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };

            okBtn.addEventListener("click", onOk);
            cancelBtn.addEventListener("click", onCancel);
        });

    }

}

export default new Characters();
