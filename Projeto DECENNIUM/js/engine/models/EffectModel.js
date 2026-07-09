// ======================================================
// MAGNUS ENGINE
// EffectModel.js
//
// Representa um efeito aplicado durante o jogo.
// Pode ser utilizado por ataques, habilidades,
// itens e batalhas.
// ======================================================

import BaseModel from "./BaseModel.js";

class EffectModel extends BaseModel {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(data = {}) {

        super(data);

        this.type = "effect";

        // ==============================================
        // INFORMAÇÕES BÁSICAS
        // ==============================================

        this.name = data.name ?? "";

        this.description = data.description ?? "";

        this.icon = data.icon ?? null;

        // ==============================================
        // CLASSIFICAÇÃO
        // ==============================================

        this.category = data.category ?? "Status";

        // Valores sugeridos:
        // Buff
        // Debuff
        // Status
        // DamageOverTime
        // HealOverTime
        // Control
        // Passive
        // Special

        // ==============================================
        // DURAÇÃO
        // ==============================================

        this.duration = data.duration ?? 0;

        // 0  = Instantâneo
        // -1 = Permanente

        this.stackable = data.stackable ?? false;

        this.maxStacks = data.maxStacks ?? 1;

        // ==============================================
        // APLICAÇÃO
        // ==============================================

        this.application = data.application ?? "Immediate";

        // Valores sugeridos:
        // Immediate
        // TurnStart
        // TurnEnd
        // OnAttack
        // OnHit
        // OnDamage
        // OnHeal
        // BattleStart
        // BattleEnd
        // Always

        // ==============================================
        // ALVO
        // ==============================================

        this.target = data.target ?? "Self";

        // Self
        // Ally
        // Enemy
        // Area
        // Everyone

        // ==============================================
        // MODIFICADORES
        // ==============================================

        this.modifiers = data.modifiers ?? [];

        // ==============================================
        // DANO / CURA PERIÓDICA
        // ==============================================

        this.tick = data.tick ?? {

            type: null,

            value: 0,

            attribute: null,

            multiplier: 1

        };

        // ==============================================
        // REMOÇÃO
        // ==============================================

        this.removeOn = data.removeOn ?? "Duration";

        // Duration
        // Manual
        // Damage
        // Heal
        // BattleStart
        // BattleEnd

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

            duration: this.duration,

            stackable: this.stackable,

            maxStacks: this.maxStacks,

            application: this.application,

            target: this.target,

            modifiers: this.modifiers,

            tick: this.tick,

            removeOn: this.removeOn,

            animation: this.animation,

            sound: this.sound,

            history: this.history

        };

    }

}

export default EffectModel;