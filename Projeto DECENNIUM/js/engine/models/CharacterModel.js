// ======================================================
// MAGNUS ENGINE
// CharacterModel.js
//
// Representa um personagem do Magnus Files.
// Herda automaticamente todas as propriedades
// do BaseModel.
// ======================================================

import BaseModel from "./BaseModel.js";

class CharacterModel extends BaseModel {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(data = {}) {

        super(data);

        this.type = "character";

        // ==============================================
        // INFORMAÇÕES BÁSICAS
        // ==============================================

        this.name = data.name ?? "";

        this.age = data.age ?? 0;

        this.characterType = data.characterType ?? "";

        this.photoIds = data.photoIds ?? [];

        this.description = data.description ?? "";

        this.summaryPhrase = data.summaryPhrase ?? "";

        this.goodTraits = data.goodTraits ?? [];

        this.badTraits = data.badTraits ?? [];

        this.playerId = data.playerId ?? null;

        // ==============================================
        // ATRIBUTOS
        // ==============================================

        this.will = data.will ?? {

            base: 0,

            current: 0

        };

        this.agility = data.agility ?? {

            base: 0,

            current: 0

        };

        this.intellect = data.intellect ?? {

            base: 0,

            current: 0

        };

        // ==============================================
        // LIMITES
        // ==============================================

        this.limit = data.limit ?? {

            base: 0,

            current: 0

        };

        this.effortLimit = data.effortLimit ?? {

            base: 0,

            current: 0

        };

        // ==============================================
        // VIDA
        // ==============================================

        this.health = data.health ?? {

            maximum: 0,

            current: 0,

            temporary: 0

        };

        // ==============================================
        // ENERGIA
        // ==============================================

        this.energy = data.energy ?? {

            maximum: 0,

            current: 0,

            temporary: 0

        };

        // ==============================================
        // INVENTÁRIO
        // ==============================================

        this.itemIds = data.itemIds ?? [];

        this.inventory = data.inventory ?? [];

        // ==============================================
        // ATAQUES
        // ==============================================

        this.attackIds = data.attackIds ?? [];

        // ==============================================
        // HABILIDADES
        // ==============================================

        this.abilityIds = data.abilityIds ?? [];

        this.disabledPassiveIds = data.disabledPassiveIds ?? [];

        // ==============================================
        // EFEITOS
        // ==============================================

        this.effectIds = data.effectIds ?? [];

        // ==============================================
        // EFEITOS ATIVOS (temporarios em batalha)
        // ==============================================

        this.activeEffects = data.activeEffects ?? [];

        this.turnNumber = data.turnNumber ?? 1;

        // ==============================================
        // CASOS
        // ==============================================

        this.caseIds = data.caseIds ?? [];

        // ==============================================
        // STATUS
        // ==============================================

        this.alive = data.alive ?? true;

        this.active = data.active ?? true;

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

            age: this.age,

            characterType: this.characterType,

            photoIds: this.photoIds,

            description: this.description,

            summaryPhrase: this.summaryPhrase,

            goodTraits: this.goodTraits,

            badTraits: this.badTraits,

            playerId: this.playerId,

            will: this.will,

            agility: this.agility,

            intellect: this.intellect,

            limit: this.limit,

            effortLimit: this.effortLimit,

            health: this.health,

            energy: this.energy,

            itemIds: this.itemIds,

            inventory: this.inventory,

            attackIds: this.attackIds,

            abilityIds: this.abilityIds,

            disabledPassiveIds: this.disabledPassiveIds,

            effectIds: this.effectIds,

            activeEffects: this.activeEffects,

            turnNumber: this.turnNumber,

            caseIds: this.caseIds,

            alive: this.alive,

            active: this.active,

            history: this.history

        };

    }

}

export default CharacterModel;
