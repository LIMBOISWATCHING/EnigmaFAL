// ======================================================
// MAGNUS FILES
// Attacks.js
//
// Pagina de ataques e efeitos — criar, listar, vincular.
// ======================================================

import MC from "../../js/engine/Core.js";
import AttackModel from "../../js/engine/models/AttackModel.js";
import EffectModel from "../../js/engine/models/EffectModel.js";
import AbilityModel from "../../js/engine/models/AbilityModel.js";

class Attacks {

    constructor() {

        this.container = null;
        this.pendingEffectIds = [];
        this.pendingAbilityEffectIds = [];
        this.editingAttackId = null;
        this.editingAbilityId = null;
        this.editingEffectId = null;
        this.dirty = false;

    }

    async open(container) {

        this.container = container;
        MC.Layout.show();
        MC.Layout.setUser(MC.Auth.current());
        MC.Menu.unlock();
        this.container.innerHTML =
            await MC.Loader.html("pages/Attacks/Attacks.html");
        this.bindGlobalEvents();
        await this.loadAttacks();
        await this.loadAbilities();
        await this.loadEffects();

    }

    async close() {
        if (this.dirty && !await MC.UI.confirm("Existem informacoes nao salvas. Sair sem salvar?")) {
            return false;
        }
        this.pendingEffectIds = [];
        this.pendingAbilityEffectIds = [];
        this.editingAttackId = null;
        this.editingAbilityId = null;
        this.editingEffectId = null;
        this.dirty = false;
    }

    bindGlobalEvents() {

        // Tabs
        document.getElementById("atk-tab-attacks")
            ?.addEventListener("click", () => this.switchTab("attacks"));
        document.getElementById("atk-tab-abilities")
            ?.addEventListener("click", () => this.switchTab("abilities"));
        document.getElementById("atk-tab-effects")
            ?.addEventListener("click", () => this.switchTab("effects"));

        // Attack form toggle
        document.getElementById("atk-btn-show-new-attack")
            ?.addEventListener("click", () => this.startNewAttack());
        document.getElementById("atk-btn-cancel-attack")
            ?.addEventListener("click", () => this.toggleAttackForm(false));
        document.getElementById("atk-btn-save-attack")
            ?.addEventListener("click", () => this.saveAttack());

        // Ability form toggle
        document.getElementById("atk-btn-show-new-ability")
            ?.addEventListener("click", () => this.startNewAbility());
        document.getElementById("atk-btn-cancel-ability")
            ?.addEventListener("click", () => this.toggleAbilityForm(false));
        document.getElementById("atk-btn-save-ability")
            ?.addEventListener("click", () => this.saveAbility());

        // Effect form toggle
        document.getElementById("atk-btn-show-new-effect")
            ?.addEventListener("click", () => this.startNewEffect());
        document.getElementById("atk-btn-cancel-effect")
            ?.addEventListener("click", () => this.toggleEffectForm(false));
        document.getElementById("atk-btn-save-effect")
            ?.addEventListener("click", () => this.saveEffect());

        // Add effect ID to pending list (attacks)
        document.getElementById("atk-btn-add-effect")
            ?.addEventListener("click", () => this.addPendingEffect());

        // Add effect ID to pending list (abilities)
        document.getElementById("atk-abil-btn-add-effect")
            ?.addEventListener("click", () => this.addPendingAbilityEffect());

        this.container
            ?.addEventListener("input", (event) => {
                if (event.target.closest(".atk-form")) this.dirty = true;
            });

    }

    // ==================================================
    // TABS
    // ==================================================

    switchTab(tab) {

        const views = {
            attacks: document.getElementById("atk-attacks-view"),
            abilities: document.getElementById("atk-abilities-view"),
            effects: document.getElementById("atk-effects-view")
        };
        const tabs = {
            attacks: document.getElementById("atk-tab-attacks"),
            abilities: document.getElementById("atk-tab-abilities"),
            effects: document.getElementById("atk-tab-effects")
        };

        Object.entries(views).forEach(([key, el]) => {
            if (el) el.style.display = key === tab ? "" : "none";
        });
        Object.entries(tabs).forEach(([key, el]) => {
            if (el) el.classList.toggle("active", key === tab);
        });

    }

    // ==================================================
    // ATAQUES — LISTAR
    // ==================================================

    async loadAttacks() {

        const list = document.getElementById("atk-attacks-list");
        if (!list) return;
        list.innerHTML = `<p class="atk-empty">Carregando ataques...</p>`;

        const user = MC.Auth.current();
        if (!user) { list.innerHTML = `<p class="atk-empty">Sessao nao encontrada.</p>`; return; }

        let attacks = [];
        try {
            attacks = await MC.Services.Attacks.findOwned();
        } catch (e) { attacks = []; }

        if (!attacks.length) {
            list.innerHTML = `<p class="atk-empty">Nenhum ataque criado ainda.</p>`;
            return;
        }

        list.innerHTML = attacks.map(a => this.renderAttackCard(a)).join("");
        list.querySelectorAll(".atk-btn-edit-attack").forEach(btn => {
            btn.addEventListener("click", () => this.editAttack(btn.dataset.id));
        });
        list.querySelectorAll(".atk-btn-delete-attack").forEach(btn => {
            btn.addEventListener("click", () => this.deleteAttack(btn.dataset.id));
        });

    }

    renderAttackCard(a) {

        const dmg = a.damage || {};
        const damageLabel = this.formatDamage(dmg);
        const effectsCount = (a.effectIds || []).length;

        return `
            <div class="atk-card" data-id="${this.esc(a.id)}">
                <div class="atk-card-header">
                    <span class="atk-card-name">${this.esc(a.name || "Sem nome")}</span>
                    <span class="atk-card-id">${this.esc(a.id)}</span>
                </div>
                <div class="atk-card-desc">${this.esc(a.description || "---")}</div>
                <div class="atk-card-stats">
                    <span class="atk-card-stat">DMG: ${this.esc(damageLabel)}</span>
                    <span class="atk-card-stat">EN: ${a.energyCost ?? 0}</span>
                    <span class="atk-card-stat">LIM: ${a.limitCost ?? 0}</span>
                    <span class="atk-card-stat">Alvo: ${this.esc(a.target || "Enemy")}</span>
                </div>
                ${effectsCount > 0 ? `<div class="atk-card-effects">${effectsCount} efeito(s) vinculado(s)</div>` : ""}
                <div class="atk-card-actions">
                    <button class="atk-btn-edit-attack" data-id="${this.esc(a.id)}" type="button">Editar</button>
                    <button class="atk-btn-delete-attack" data-id="${this.esc(a.id)}" type="button">Excluir</button>
                </div>
            </div>`;

    }

    // ==================================================
    // ATAQUES — CRIAR
    // ==================================================

    toggleAttackForm(show) {

        const form = document.getElementById("atk-new-attack-form");
        if (form) form.style.display = show ? "" : "none";
        if (show) {
            if (!this.editingAttackId) {
                this.pendingEffectIds = [];
                this.renderPendingEffects();
            }
        } else {
            this.clearAttackForm();
        }

    }

    async addPendingEffect() {

        const input = document.getElementById("atk-new-effect-id");
        const id = input?.value?.trim();
        if (!id) return;
        if (this.pendingEffectIds.includes(id)) { await MC.UI.alert("Efeito ja adicionado."); return; }
        this.pendingEffectIds.push(id);
        this.renderPendingEffects();
        input.value = "";

    }

    removePendingEffect(id) {

        this.pendingEffectIds = this.pendingEffectIds.filter(e => e !== id);
        this.renderPendingEffects();

    }

    renderPendingEffects() {

        const list = document.getElementById("atk-new-effects-list");
        if (!list) return;
        if (!this.pendingEffectIds.length) {
            list.innerHTML = `<p class="atk-empty-small">Nenhum efeito vinculado.</p>`;
            return;
        }
        list.innerHTML = this.pendingEffectIds.map(id => `
            <div class="atk-effect-mini-item">
                <span class="atk-effect-mini-id">${this.esc(id)}</span>
                <button class="atk-btn-remove-pending" data-id="${this.esc(id)}" type="button">X</button>
            </div>
        `).join("");
        list.querySelectorAll(".atk-btn-remove-pending").forEach(btn => {
            btn.addEventListener("click", () => this.removePendingEffect(btn.dataset.id));
        });

    }

    async saveAttack() {

        const get = (id) => document.getElementById(id)?.value || "";
        const num = (id) => { const v = parseFloat(get(id)); return isNaN(v) ? 0 : v; };
        const user = MC.Auth.current();

        const name = get("atk-new-name").trim();
        if (!name) { await MC.UI.alert("O ataque precisa de um nome."); return; }

        const attackData = {
            name,
            description: get("atk-new-desc"),
            category: get("atk-new-category") || "Physical",
            damage: {
                diceCount: Math.max(0, Math.floor(num("atk-new-dice-count"))),
                diceSides: Math.max(0, Math.floor(num("atk-new-dice-sides"))),
                bonus: Math.round(num("atk-new-damage-bonus"))
            },
            energyCost: num("atk-new-ecost"),
            limitCost: num("atk-new-lcost"),
            target: get("atk-new-target") || "Enemy",
            range: get("atk-new-range") || "Short",
            accuracy: num("atk-new-acc"),
            criticalChance: num("atk-new-crit"),
            criticalMultiplier: num("atk-new-critmult"),
            effectIds: [...this.pendingEffectIds]
        };

        try {
            let saved = null;
            if (this.editingAttackId) {
                const existing = await MC.Services.Attacks.findById(this.editingAttackId);
                if (!existing) throw new Error("Ataque nao encontrado para editar.");
                existing.update(attackData);
                saved = await MC.Services.Attacks.update(existing);
                await MC.UI.alert("Ataque \"" + name + "\" atualizado!");
            } else {
                const model = new AttackModel(attackData);
                model.ownerId = user?.id || null;
                saved = await MC.Services.Attacks.create(model);
                await MC.UI.alert("Ataque \"" + name + "\" criado! ID: " + saved.id);
            }
            this.clearAttackForm();
            this.toggleAttackForm(false);
            await this.loadAttacks();
        } catch (err) {
            await MC.UI.alert("Erro ao criar ataque: " + err.message);
        }

    }

    clearAttackForm() {

        const ids = ["atk-new-name", "atk-new-desc", "atk-new-effect-id"];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
        document.getElementById("atk-new-dice-count").value = "1";
        document.getElementById("atk-new-dice-sides").value = "6";
        document.getElementById("atk-new-damage-bonus").value = "0";
        document.getElementById("atk-new-ecost").value = "0";
        document.getElementById("atk-new-lcost").value = "0";
        document.getElementById("atk-new-acc").value = "100";
        document.getElementById("atk-new-crit").value = "0";
        document.getElementById("atk-new-critmult").value = "2";
        this.editingAttackId = null;
        this.setAttackFormMode(false);
        this.pendingEffectIds = [];
        this.renderPendingEffects();
        this.dirty = false;

    }

    startNewAttack() {

        this.clearAttackForm();
        this.toggleAttackForm(true);

    }

    async editAttack(id) {

        let attack = null;
        try { attack = await MC.Services.Attacks.findById(id); } catch (e) {}
        if (!attack) { await MC.UI.alert("Ataque nao encontrado."); return; }

        const set = (fieldId, value) => {
            const el = document.getElementById(fieldId);
            if (el) el.value = value ?? "";
        };
        const dmg = attack.damage || {};
        this.editingAttackId = attack.id;
        this.pendingEffectIds = [...(attack.effectIds || [])];
        set("atk-new-name", attack.name || "");
        set("atk-new-desc", attack.description || "");
        set("atk-new-category", attack.category || "Physical");
        set("atk-new-dice-count", dmg.diceCount ?? dmg.count ?? 1);
        set("atk-new-dice-sides", dmg.diceSides ?? dmg.sides ?? 6);
        set("atk-new-damage-bonus", dmg.bonus ?? 0);
        set("atk-new-ecost", attack.energyCost ?? 0);
        set("atk-new-lcost", attack.limitCost ?? 0);
        set("atk-new-target", attack.target || "Enemy");
        set("atk-new-range", attack.range || "Short");
        set("atk-new-acc", attack.accuracy ?? 100);
        set("atk-new-crit", attack.criticalChance ?? 0);
        set("atk-new-critmult", attack.criticalMultiplier ?? 2);
        this.setAttackFormMode(true);
        this.toggleAttackForm(true);
        this.renderPendingEffects();

    }

    setAttackFormMode(editing) {

        const title = document.getElementById("atk-attack-form-title");
        const button = document.getElementById("atk-btn-save-attack");
        if (title) title.textContent = editing ? "Editar Ataque" : "Criar Ataque";
        if (button) button.textContent = editing ? "Salvar Ataque" : "Criar Ataque";

    }

    // ==================================================
    // ATAQUES — EXCLUIR
    // ==================================================

    async deleteAttack(id) {

        const ok = await this.showConfirm("Excluir este ataque?");
        if (!ok) return;
        try {
            await MC.Services.Attacks.delete(id);
            MC.log("Ataque excluido: " + id);
            await this.loadAttacks();
        } catch (err) {
            await MC.UI.alert("Erro ao excluir ataque.");
        }

    }

    // ==================================================
    // HABILIDADES — LISTAR
    // ==================================================

    async loadAbilities() {

        const list = document.getElementById("atk-abilities-list");
        if (!list) return;
        list.innerHTML = `<p class="atk-empty">Carregando habilidades...</p>`;

        const user = MC.Auth.current();
        if (!user) { list.innerHTML = `<p class="atk-empty">Sessao nao encontrada.</p>`; return; }

        let abilities = [];
        try {
            abilities = await MC.Services.Abilities.findOwned();
        } catch (e) { abilities = []; }

        if (!abilities.length) {
            list.innerHTML = `<p class="atk-empty">Nenhuma habilidade criada ainda.</p>`;
            return;
        }

        list.innerHTML = abilities.map(a => this.renderAbilityCard(a)).join("");
        list.querySelectorAll(".atk-btn-edit-ability").forEach(btn => {
            btn.addEventListener("click", () => this.editAbility(btn.dataset.id));
        });
        list.querySelectorAll(".atk-btn-delete-ability").forEach(btn => {
            btn.addEventListener("click", () => this.deleteAbility(btn.dataset.id));
        });

    }

    renderAbilityCard(a) {

        const catColors = {
            Active: "#224466", Passive: "#336633",
            Reaction: "#664422", Aura: "#662266", Special: "#666622"
        };
        const color = catColors[a.category] || "#333";
        const effectsCount = (a.effectIds || []).length;

        return `
            <div class="atk-card" data-id="${this.esc(a.id)}">
                <div class="atk-card-header">
                    <span class="atk-card-name" style="border-left: 3px solid ${color}; padding-left: 8px;">${this.esc(a.name || "Sem nome")}</span>
                    <span class="atk-card-id">${this.esc(a.id)}</span>
                </div>
                <div class="atk-card-desc">${this.esc(a.description || "---")}</div>
                <div class="atk-card-stats">
                    <span class="atk-card-stat">Tipo: ${this.esc(a.category)}</span>
                    <span class="atk-card-stat">Ativacao: ${this.esc(a.trigger || "Manual")}</span>
                    <span class="atk-card-stat">EN: ${a.energyCost ?? 0}</span>
                    <span class="atk-card-stat">Alvo: ${this.esc(a.target || "Self")}</span>
                </div>
                ${effectsCount > 0 ? `<div class="atk-card-effects">${effectsCount} efeito(s) vinculado(s)</div>` : ""}
                <div class="atk-card-actions">
                    <button class="atk-btn-edit-ability" data-id="${this.esc(a.id)}" type="button">Editar</button>
                    <button class="atk-btn-delete-ability" data-id="${this.esc(a.id)}" type="button">Excluir</button>
                </div>
            </div>`;

    }

    // ==================================================
    // HABILIDADES — CRIAR
    // ==================================================

    toggleAbilityForm(show) {

        const form = document.getElementById("atk-new-ability-form");
        if (form) form.style.display = show ? "" : "none";
        if (show) {
            if (!this.editingAbilityId) {
                this.pendingAbilityEffectIds = [];
                this.renderPendingAbilityEffects();
            }
        } else {
            this.clearAbilityForm();
        }

    }

    async addPendingAbilityEffect() {

        const input = document.getElementById("atk-abil-new-effect-id");
        const id = input?.value?.trim();
        if (!id) return;
        if (this.pendingAbilityEffectIds.includes(id)) { await MC.UI.alert("Efeito ja adicionado."); return; }
        this.pendingAbilityEffectIds.push(id);
        this.renderPendingAbilityEffects();
        input.value = "";

    }

    removePendingAbilityEffect(id) {

        this.pendingAbilityEffectIds = this.pendingAbilityEffectIds.filter(e => e !== id);
        this.renderPendingAbilityEffects();

    }

    renderPendingAbilityEffects() {

        const list = document.getElementById("atk-abil-new-effects-list");
        if (!list) return;
        if (!this.pendingAbilityEffectIds.length) {
            list.innerHTML = `<p class="atk-empty-small">Nenhum efeito vinculado.</p>`;
            return;
        }
        list.innerHTML = this.pendingAbilityEffectIds.map(id => `
            <div class="atk-effect-mini-item">
                <span class="atk-effect-mini-id">${this.esc(id)}</span>
                <button class="atk-btn-remove-pending-abil" data-id="${this.esc(id)}" type="button">X</button>
            </div>
        `).join("");
        list.querySelectorAll(".atk-btn-remove-pending-abil").forEach(btn => {
            btn.addEventListener("click", () => this.removePendingAbilityEffect(btn.dataset.id));
        });

    }

    async saveAbility() {

        const get = (id) => document.getElementById(id)?.value || "";
        const num = (id) => { const v = parseFloat(get(id)); return isNaN(v) ? 0 : v; };
        const user = MC.Auth.current();

        const name = get("atk-abil-new-name").trim();
        if (!name) { await MC.UI.alert("A habilidade precisa de um nome."); return; }

        const abilityData = {
            name,
            description: get("atk-abil-new-desc"),
            category: get("atk-abil-new-category") || "Active",
            trigger: get("atk-abil-new-trigger") || "Manual",
            energyCost: num("atk-abil-new-ecost"),
            limitCost: num("atk-abil-new-lcost"),
            cooldown: num("atk-abil-new-cd"),
            target: get("atk-abil-new-target") || "Self",
            range: get("atk-abil-new-range") || "Self",
            effectIds: [...this.pendingAbilityEffectIds]
        };

        try {
            let saved = null;
            if (this.editingAbilityId) {
                const existing = await MC.Services.Abilities.findById(this.editingAbilityId);
                if (!existing) throw new Error("Habilidade nao encontrada para editar.");
                existing.update(abilityData);
                saved = await MC.Services.Abilities.update(existing);
                await MC.UI.alert("Habilidade \"" + name + "\" atualizada!");
            } else {
                const model = new AbilityModel(abilityData);
                model.ownerId = user?.id || null;
                saved = await MC.Services.Abilities.create(model);
                await MC.UI.alert("Habilidade \"" + name + "\" criada! ID: " + saved.id);
            }
            this.clearAbilityForm();
            this.toggleAbilityForm(false);
            await this.loadAbilities();
        } catch (err) {
            await MC.UI.alert("Erro ao criar habilidade: " + err.message);
        }

    }

    clearAbilityForm() {

        ["atk-abil-new-name", "atk-abil-new-desc", "atk-abil-new-effect-id"].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = "";
        });
        document.getElementById("atk-abil-new-ecost").value = "0";
        document.getElementById("atk-abil-new-lcost").value = "0";
        document.getElementById("atk-abil-new-cd").value = "0";
        this.editingAbilityId = null;
        this.setAbilityFormMode(false);
        this.pendingAbilityEffectIds = [];
        this.renderPendingAbilityEffects();
        this.dirty = false;

    }

    startNewAbility() {

        this.clearAbilityForm();
        this.toggleAbilityForm(true);

    }

    async editAbility(id) {

        let ability = null;
        try { ability = await MC.Services.Abilities.findById(id); } catch (e) {}
        if (!ability) { await MC.UI.alert("Habilidade nao encontrada."); return; }

        const set = (fieldId, value) => {
            const el = document.getElementById(fieldId);
            if (el) el.value = value ?? "";
        };
        this.editingAbilityId = ability.id;
        this.pendingAbilityEffectIds = [...(ability.effectIds || [])];
        set("atk-abil-new-name", ability.name || "");
        set("atk-abil-new-desc", ability.description || "");
        set("atk-abil-new-category", ability.category || "Active");
        set("atk-abil-new-trigger", ability.trigger || "Manual");
        set("atk-abil-new-ecost", ability.energyCost ?? 0);
        set("atk-abil-new-lcost", ability.limitCost ?? 0);
        set("atk-abil-new-cd", ability.cooldown ?? 0);
        set("atk-abil-new-target", ability.target || "Self");
        set("atk-abil-new-range", ability.range || "Self");
        this.setAbilityFormMode(true);
        this.toggleAbilityForm(true);
        this.renderPendingAbilityEffects();

    }

    setAbilityFormMode(editing) {

        const title = document.getElementById("atk-ability-form-title");
        const button = document.getElementById("atk-btn-save-ability");
        if (title) title.textContent = editing ? "Editar Habilidade" : "Criar Habilidade";
        if (button) button.textContent = editing ? "Salvar Habilidade" : "Criar Habilidade";

    }

    // ==================================================
    // HABILIDADES — EXCLUIR
    // ==================================================

    async deleteAbility(id) {

        const ok = await this.showConfirm("Excluir esta habilidade?");
        if (!ok) return;
        try {
            await MC.Services.Abilities.delete(id);
            MC.log("Habilidade excluida: " + id);
            await this.loadAbilities();
        } catch (err) {
            await MC.UI.alert("Erro ao excluir habilidade.");
        }

    }

    // ==================================================
    // EFEITOS — LISTAR
    // ==================================================

    async loadEffects() {

        const list = document.getElementById("atk-effects-list");
        if (!list) return;
        list.innerHTML = `<p class="atk-empty">Carregando efeitos...</p>`;

        const user = MC.Auth.current();
        if (!user) { list.innerHTML = `<p class="atk-empty">Sessao nao encontrada.</p>`; return; }

        let effects = [];
        try {
            effects = await MC.Services.Effects.findOwned();
        } catch (e) { effects = []; }

        if (!effects.length) {
            list.innerHTML = `<p class="atk-empty">Nenhum efeito criado ainda.</p>`;
            return;
        }

        list.innerHTML = effects.map(e => this.renderEffectCard(e)).join("");
        list.querySelectorAll(".atk-btn-edit-effect").forEach(btn => {
            btn.addEventListener("click", () => this.editEffect(btn.dataset.id));
        });
        list.querySelectorAll(".atk-btn-delete-effect").forEach(btn => {
            btn.addEventListener("click", () => this.deleteEffect(btn.dataset.id));
        });

    }

    renderEffectCard(e) {

        const catColors = {
            Buff: "#2a6622", Debuff: "#662222",
            HealOverTime: "#226644", DamageOverTime: "#664422",
            Status: "#444466", Control: "#662266",
            Passive: "#336633", Special: "#666622"
        };
        const color = catColors[e.category] || "#333";
        const tick = e.tick || {};

        return `
            <div class="atk-card atk-effect-card" data-id="${this.esc(e.id)}">
                <div class="atk-card-header">
                    <span class="atk-card-name" style="border-left: 3px solid ${color}; padding-left: 8px;">${this.esc(e.name || "Sem nome")}</span>
                    <span class="atk-card-id">${this.esc(e.id)}</span>
                </div>
                <div class="atk-card-desc">${this.esc(e.description || "---")}</div>
                <div class="atk-card-stats">
                    <span class="atk-card-stat">Tipo: ${this.esc(e.category)}</span>
                    <span class="atk-card-stat">Duracao: ${e.duration ?? 0} turnos</span>
                    <span class="atk-card-stat">Alvo: ${this.esc(e.target || "Self")}</span>
                </div>
                ${tick.type ? `<div class="atk-card-effects">Tick: ${tick.type === "heal" ? "Cura" : "Dano"} ${tick.attribute || "health"} (${tick.value ?? 0} x${tick.multiplier ?? 1})</div>` : ""}
                <div class="atk-card-actions">
                    <button class="atk-btn-edit-effect" data-id="${this.esc(e.id)}" type="button">Editar</button>
                    <button class="atk-btn-delete-effect" data-id="${this.esc(e.id)}" type="button">Excluir</button>
                </div>
            </div>`;

    }

    // ==================================================
    // EFEITOS — CRIAR
    // ==================================================

    toggleEffectForm(show) {

        const form = document.getElementById("atk-new-effect-form");
        if (form) form.style.display = show ? "" : "none";
        if (!show) {
            this.clearEffectForm();
        }

    }

    startNewEffect() {

        this.clearEffectForm();
        this.toggleEffectForm(true);

    }

    async saveEffect() {

        const get = (id) => document.getElementById(id)?.value || "";
        const num = (id) => { const v = parseFloat(get(id)); return isNaN(v) ? 0 : v; };
        const user = MC.Auth.current();

        const name = get("atk-eff-new-name").trim();
        if (!name) { await MC.UI.alert("O efeito precisa de um nome."); return; }

        const tickType = get("atk-eff-new-ticktype");

        const effectData = {
            name,
            description: get("atk-eff-new-desc"),
            category: get("atk-eff-new-category") || "Buff",
            duration: num("atk-eff-new-duration"),
            target: get("atk-eff-new-target") || "Self",
            application: get("atk-eff-new-app") || "Immediate",
            removeOn: get("atk-eff-new-remove") || "Duration",
            stackable: get("atk-eff-new-stack") === "true",
            maxStacks: num("atk-eff-new-maxstacks"),
            tick: tickType ? {
                type: tickType,
                value: num("atk-eff-new-tickval"),
                attribute: get("atk-eff-new-tickattr") || "health",
                multiplier: num("atk-eff-new-tickmult")
            } : { type: null, value: 0, attribute: null, multiplier: 1 }
        };

        try {
            let saved = null;
            if (this.editingEffectId) {
                const existing = await MC.Services.Effects.findById(this.editingEffectId);
                if (!existing) throw new Error("Efeito nao encontrado para editar.");
                existing.update(effectData);
                saved = await MC.Services.Effects.update(existing);
                await MC.UI.alert("Efeito \"" + name + "\" atualizado!");
            } else {
                const model = new EffectModel(effectData);
                model.ownerId = user?.id || null;
                saved = await MC.Services.Effects.create(model);
                await MC.UI.alert("Efeito \"" + name + "\" criado! ID: " + saved.id);
            }
            this.clearEffectForm();
            this.toggleEffectForm(false);
            await this.loadEffects();
        } catch (err) {
            await MC.UI.alert("Erro ao criar efeito: " + err.message);
        }

    }

    clearEffectForm() {

        const ids = ["atk-eff-new-name", "atk-eff-new-desc"];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
        document.getElementById("atk-eff-new-duration").value = "3";
        document.getElementById("atk-eff-new-tickval").value = "0";
        document.getElementById("atk-eff-new-tickmult").value = "1";
        document.getElementById("atk-eff-new-maxstacks").value = "1";
        this.editingEffectId = null;
        this.setEffectFormMode(false);
        this.dirty = false;

    }

    async editEffect(id) {

        let effect = null;
        try { effect = await MC.Services.Effects.findById(id); } catch (e) {}
        if (!effect) { await MC.UI.alert("Efeito nao encontrado."); return; }

        const set = (fieldId, value) => {
            const el = document.getElementById(fieldId);
            if (el) el.value = value ?? "";
        };
        const tick = effect.tick || {};
        this.editingEffectId = effect.id;
        set("atk-eff-new-name", effect.name || "");
        set("atk-eff-new-desc", effect.description || "");
        set("atk-eff-new-category", effect.category || "Buff");
        set("atk-eff-new-duration", effect.duration ?? 3);
        set("atk-eff-new-target", effect.target || "Self");
        set("atk-eff-new-app", effect.application || "Immediate");
        set("atk-eff-new-remove", effect.removeOn || "Duration");
        set("atk-eff-new-stack", String(Boolean(effect.stackable)));
        set("atk-eff-new-maxstacks", effect.maxStacks ?? 1);
        set("atk-eff-new-ticktype", tick.type || "");
        set("atk-eff-new-tickattr", tick.attribute || "health");
        set("atk-eff-new-tickval", tick.value ?? 0);
        set("atk-eff-new-tickmult", tick.multiplier ?? 1);
        this.setEffectFormMode(true);
        this.toggleEffectForm(true);

    }

    setEffectFormMode(editing) {

        const title = document.getElementById("atk-effect-form-title");
        const button = document.getElementById("atk-btn-save-effect");
        if (title) title.textContent = editing ? "Editar Efeito" : "Criar Efeito";
        if (button) button.textContent = editing ? "Salvar Efeito" : "Criar Efeito";

    }

    // ==================================================
    // EFEITOS — EXCLUIR
    // ==================================================

    async deleteEffect(id) {

        const ok = await this.showConfirm("Excluir este efeito?");
        if (!ok) return;
        try {
            await MC.Services.Effects.delete(id);
            MC.log("Efeito excluido: " + id);
            await this.loadEffects();
        } catch (err) {
            await MC.UI.alert("Erro ao excluir efeito.");
        }

    }

    // ==================================================
    // UTILITARIOS
    // ==================================================

    esc(v) {
        return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    formatDamage(damage = {}) {

        const count = Math.max(0, parseInt(damage.diceCount ?? damage.count ?? 0, 10) || 0);
        const sides = Math.max(0, parseInt(damage.diceSides ?? damage.sides ?? 0, 10) || 0);
        const bonus = parseInt(damage.bonus ?? 0, 10) || 0;
        const diceText = count > 0 && sides > 0 ? `${count}d${sides}` : "0";
        if (bonus > 0) return `${diceText} + ${bonus}`;
        if (bonus < 0) return `${diceText} - ${Math.abs(bonus)}`;
        return diceText;

    }

    async showConfirm(message) {

        return new Promise(async (resolve) => {
            const overlay = document.getElementById("atk-confirm-modal");
            const msgEl = document.getElementById("atk-confirm-message");
            const okBtn = document.getElementById("atk-confirm-ok");
            const cancelBtn = document.getElementById("atk-confirm-cancel");
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

export default new Attacks();
