// ======================================================
// MAGNUS ENGINE
// BattleService.js
// ======================================================

import BaseService from "./BaseService.js";
import MC from "../Core.js";

class BattleService extends BaseService {

    constructor() {

        super(null);

    }

    initialize() {

        this.repository = MC.Repositories.Battles;

    }

    // ==================================================
    // INICIAR
    // ==================================================

    async start(battle) {

        battle.status = "Running";

        battle.round = 1;

        battle.turn = 1;

        return await this.update(battle);

    }

    // ==================================================
    // FINALIZAR
    // ==================================================

    async finish(battle, winner = null) {

        battle.status = "Finished";

        battle.winner = winner;

        battle.endedAt = Date.now();

        return await this.update(battle);

    }

    // ==================================================
    // PRÓXIMO TURNO
    // ==================================================

    async nextTurn(battle) {

        battle.turn++;

        return await this.update(battle);

    }

    // ==================================================
    // PRÓXIMA RODADA
    // ==================================================

    async nextRound(battle) {

        battle.round++;

        battle.turn = 1;

        return await this.update(battle);

    }

}

export default new BattleService();