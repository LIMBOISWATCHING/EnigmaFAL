// ======================================================
// MAGNUS ENGINE
// CreatureRepository.js
//
// Repository responsável pelas criaturas.
// ======================================================

import FirebaseRepository from "./FirebaseRepository.js";
import CreatureModel from "../models/CreatureModel.js";

class CreatureRepository extends FirebaseRepository {

    constructor() {

        super("creatures", CreatureModel);

    }

    async findBySpecies(species) {

        return await this.findWhere("species", species);

    }

    async findByClassification(classification) {

        return await this.findWhere("classification", classification);

    }

    async findByDangerLevel(level) {

        return await this.findWhere("dangerLevel", level);

    }

}

export default new CreatureRepository();