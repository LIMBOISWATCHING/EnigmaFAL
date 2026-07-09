// ======================================================
// MAGNUS ENGINE
// AttackModel.js
//
// Representa um ataque do Magnus Files.
// Herda automaticamente todas as propriedades
// do BaseModel.
// ======================================================

import BaseModel from "./BaseModel.js";

class AttackModel extends BaseModel {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(data = {}) {

        super(data);

        this.type = "attack";

        // ==============================================
        // INFORMAÇÕES BÁSICAS
        // ==============================================

        this.name = data.name ?? "";

        this.description = data.description ?? "";

        this.icon = data.icon ?? null;

        // ==============================================
        // CLASSIFICAÇÃO
        // ==============================================

        this.category = data.category ?? "Physical";

        this.element = data.element ?? "None";

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

        this.target = data.target ?? "Enemy";

        this.range = data.range ?? "Short";

        // ==============================================
        // DANO
        // ==============================================

        this.damage = data.damage ?? {

            diceCount: 1,

            diceSides: 6,

            bonus: 0

        };

        // ==============================================
        // PRECISÃO
        // ==============================================

        this.accuracy = data.accuracy ?? 100;

        this.criticalChance = data.criticalChance ?? 0;

        this.criticalMultiplier = data.criticalMultiplier ?? 2;

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

            element: this.element,

            energyCost: this.energyCost,

            limitCost: this.limitCost,

            effortCost: this.effortCost,

            cooldown: this.cooldown,

            target: this.target,

            range: this.range,

            damage: this.damage,

            accuracy: this.accuracy,

            criticalChance: this.criticalChance,

            criticalMultiplier: this.criticalMultiplier,

            effectIds: this.effectIds,

            requirements: this.requirements,

            animation: this.animation,

            sound: this.sound,

            history: this.history

        };

    }

}

export default AttackModel;
