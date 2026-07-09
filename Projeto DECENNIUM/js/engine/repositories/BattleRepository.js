// ======================================================
// MAGNUS ENGINE
// BattleRepository.js
//
// Repository responsável pelas batalhas.
// ======================================================

import FirebaseRepository from "./FirebaseRepository.js";
import BattleModel from "../models/BattleModel.js";

class BattleRepository extends FirebaseRepository {

    constructor() {

        super("battles", BattleModel);

    }

    async findByStatus(status) {

        return await this.findWhere("status", status);

    }

    async findByCase(caseId) {

        return await this.findWhere("caseId", caseId);

    }

    async findRunning() {

        return await this.findWhere("status", "Running");

    }

}

export default new BattleRepository();