// ======================================================
// MAGNUS ENGINE
// EffectRepository.js
//
// Repository responsável pelos efeitos.
// ======================================================

import FirebaseRepository from "./FirebaseRepository.js";
import EffectModel from "../models/EffectModel.js";

class EffectRepository extends FirebaseRepository {

    constructor() {

        super("effects", EffectModel);

    }

    async findByCategory(category) {

        return await this.findWhere("category", category);

    }

    async findByTarget(target) {

        return await this.findWhere("target", target);

    }

    async findStackable() {

        return await this.findWhere("stackable", true);

    }

}

export default new EffectRepository();