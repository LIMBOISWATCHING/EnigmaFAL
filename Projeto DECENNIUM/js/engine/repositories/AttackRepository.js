// ======================================================
// MAGNUS ENGINE
// AttackRepository.js
//
// Repository responsável pelos ataques.
// ======================================================

import FirebaseRepository from "./FirebaseRepository.js";
import AttackModel from "../models/AttackModel.js";

class AttackRepository extends FirebaseRepository {

    constructor() {

        super("attacks", AttackModel);

    }

    async findByCategory(category) {

        return await this.findWhere("category", category);

    }

    async findByElement(element) {

        return await this.findWhere("element", element);

    }

}

export default new AttackRepository();