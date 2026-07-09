// ======================================================
// MAGNUS ENGINE
// BattleModel.js
//
// Representa uma batalha do Magnus Files.
// Responsável apenas por armazenar os dados da batalha.
// Toda a lógica será implementada futuramente pelo
// BattleSystem.
// ======================================================

import BaseModel from "./BaseModel.js";

class BattleModel extends BaseModel {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(data = {}) {

        super(data);

        this.type = "battle";

        // ==============================================
        // INFORMAÇÕES BÁSICAS
        // ==============================================

        this.name = data.name ?? "";

        this.description = data.description ?? "";

        this.caseId = data.caseId ?? null;

        // ==============================================
        // STATUS
        // ==============================================

        this.status = data.status ?? "Waiting";

        // Waiting
        // Running
        // Paused
        // Finished
        // Cancelled

        // ==============================================
        // PARTICIPANTES
        // ==============================================

        this.participants = data.participants ?? [];

        /*
        Estrutura sugerida:

        {

            entityId,

            entityType,

            team,

            initiative,

            alive

        }
        */

        // ==============================================
        // TURNOS
        // ==============================================

        this.turn = data.turn ?? 1;

        this.round = data.round ?? 1;

        this.activeParticipant = data.activeParticipant ?? null;

        this.initiativeOrder = data.initiativeOrder ?? [];

        // ==============================================
        // AMBIENTE
        // ==============================================

        this.weather = data.weather ?? "Normal";

        this.environment = data.environment ?? "";

        // ==============================================
        // EFEITOS GLOBAIS
        // ==============================================

        this.globalEffectIds = data.globalEffectIds ?? [];

        // ==============================================
        // AÇÕES
        // ==============================================

        this.actions = data.actions ?? [];

        // ==============================================
        // LOGS
        // ==============================================

        this.logs = data.logs ?? [];

        // ==============================================
        // RESULTADO
        // ==============================================

        this.winner = data.winner ?? null;

        this.endedAt = data.endedAt ?? null;

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

            caseId: this.caseId,

            status: this.status,

            participants: this.participants,

            turn: this.turn,

            round: this.round,

            activeParticipant: this.activeParticipant,

            initiativeOrder: this.initiativeOrder,

            weather: this.weather,

            environment: this.environment,

            globalEffectIds: this.globalEffectIds,

            actions: this.actions,

            logs: this.logs,

            winner: this.winner,

            endedAt: this.endedAt,

            history: this.history

        };

    }

}

export default BattleModel;