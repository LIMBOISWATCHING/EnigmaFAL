// ======================================================
// MAGNUS ENGINE
// AbilityRepository.js
//
// Repository responsável pelas habilidades.
// ======================================================

import FirebaseRepository from "./FirebaseRepository.js";
import AbilityModel from "../models/AbilityModel.js";

class AbilityRepository extends FirebaseRepository {

    constructor() {

        super("abilities", AbilityModel);

    }

    async findByCategory(category) {

        return await this.findWhere("category", category);

    }

    async findByTrigger(trigger) {

        return await this.findWhere("trigger", trigger);

    }

}

export default new AbilityRepository();