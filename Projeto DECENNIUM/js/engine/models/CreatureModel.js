// ======================================================
// MAGNUS ENGINE
// CreatureModel.js
//
// Representa uma criatura do Magnus Files.
// Herda automaticamente todas as propriedades
// do BaseModel.
// ======================================================

import BaseModel from "./BaseModel.js";

class CreatureModel extends BaseModel {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(data = {}) {

        super(data);

        this.type = "creature";

        // ==============================================
        // INFORMAÇÕES BÁSICAS
        // ==============================================

        this.name = data.name ?? "";

        this.photoIds = data.photoIds ?? [];

        this.description = data.description ?? "";

        // ==============================================
        // CLASSIFICAÇÃO
        // ==============================================

        this.species = data.species ?? "";

        this.classification = data.classification ?? "";

        this.dangerLevel = data.dangerLevel ?? 1;

        this.behavior = data.behavior ?? "";

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
        // ATAQUES
        // ==============================================

        this.attackIds = data.attackIds ?? [];

        // ==============================================
        // HABILIDADES
        // ==============================================

        this.abilityIds = data.abilityIds ?? [];

        // ==============================================
        // EFEITOS
        // ==============================================

        this.effectIds = data.effectIds ?? [];

        // ==============================================
        // RECOMPENSAS
        // ==============================================

        this.rewardIds = data.rewardIds ?? [];

        // ==============================================
        // CASOS
        // ==============================================

        this.caseIds = data.caseIds ?? [];

        // ==============================================
        // STATUS
        // ==============================================

        this.captured = data.captured ?? false;

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

            photoIds: this.photoIds,

            description: this.description,

            species: this.species,

            classification: this.classification,

            dangerLevel: this.dangerLevel,

            behavior: this.behavior,

            will: this.will,

            agility: this.agility,

            intellect: this.intellect,

            limit: this.limit,

            effortLimit: this.effortLimit,

            health: this.health,

            energy: this.energy,

            attackIds: this.attackIds,

            abilityIds: this.abilityIds,

            effectIds: this.effectIds,

            rewardIds: this.rewardIds,

            caseIds: this.caseIds,

            captured: this.captured,

            alive: this.alive,

            active: this.active,

            history: this.history

        };

    }

}

export default CreatureModel;