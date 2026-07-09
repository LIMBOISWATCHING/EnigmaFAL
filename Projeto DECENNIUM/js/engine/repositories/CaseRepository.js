// ======================================================
// MAGNUS ENGINE
// CaseRepository.js
//
// Repository responsável pelos casos.
// ======================================================

import FirebaseRepository from "./FirebaseRepository.js";
import CaseModel from "../models/CaseModel.js";

class CaseRepository extends FirebaseRepository {

    constructor() {

        super("cases", CaseModel);

    }

    async findByStatus(status) {

        return await this.findWhere("status", status);

    }

    async findByPriority(priority) {

        return await this.findWhere("priority", priority);

    }

    async findByClassification(classification) {

        return await this.findWhere("classification", classification);

    }

}

export default new CaseRepository();