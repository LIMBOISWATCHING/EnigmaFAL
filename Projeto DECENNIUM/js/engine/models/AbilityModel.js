// ======================================================
// MAGNUS ENGINE
// AbilityModel.js
//
// Representa uma habilidade do Magnus Files.
// Herda automaticamente todas as propriedades
// do BaseModel.
// ======================================================

import BaseModel from "./BaseModel.js";

class AbilityModel extends BaseModel {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(data = {}) {

        super(data);

        this.type = "ability";

        // ==============================================
        // INFORMAÇÕES BÁSICAS
        // ==============================================

        this.name = data.name ?? "";

        this.description = data.description ?? "";

        this.icon = data.icon ?? null;

        // ==============================================
        // CLASSIFICAÇÃO
        // ==============================================

        this.category = data.category ?? "Active";

        // Valores sugeridos:
        // Active
        // Passive
        // Reaction
        // Aura
        // Special

        // ==============================================
        // ATIVAÇÃO
        // ==============================================

        this.trigger = data.trigger ?? "Manual";

        // Valores sugeridos:
        // Manual
        // BattleStart
        // BattleEnd
        // TurnStart
        // TurnEnd
        // OnAttack
        // OnHit
        // OnDamage
        // OnHeal
        // Always

        // ==============================================
        // CUSTOS
        // ==============================================

        this.energyCost = data.energyCost ?? 0;

        this.limitCost = data.limitCost ?? 0;

        this.effortCost = data.effortCost ?? 0;

        this.cooldown = data.cooldown ?? 0;

        // ==============================================
        // ALVO
        // ==============================================

        this.target = data.target ?? "Self";

        this.range = data.range ?? "Self";

        // ==============================================
        // MODIFICADORES
        // ==============================================

        this.modifiers = data.modifiers ?? [];

        // ==============================================
        // EFEITOS
        // ==============================================

        this.effectIds = data.effectIds ?? [];

        // ==============================================
        // REQUISITOS
        // ==============================================

        this.requirements = data.requirements ?? [];

        // ==============================================
        // RECURSOS VISUAIS
        // ==============================================

        this.animation = data.animation ?? null;

        this.sound = data.sound ?? null;

        // ==============================================
        // HISTÓRICO
        // ==============================================

        this.history = data.history ?? [];

    }

    // ==================================================
    // SERIALIZAÇÃO
    // ==================================================

    toJSON() {

        return {

            ...super.toJSON(),

            name: this.name,

            description: this.description,

            icon: this.icon,

            category: this.category,

            trigger: this.trigger,

            energyCost: this.energyCost,

            limitCost: this.limitCost,

            effortCost: this.effortCost,

            cooldown: this.cooldown,

            target: this.target,

            range: this.range,

            modifiers: this.modifiers,

            effectIds: this.effectIds,

            requirements: this.requirements,

            animation: this.animation,

            sound: this.sound,

            history: this.history

        };

    }

}

export default AbilityModel;