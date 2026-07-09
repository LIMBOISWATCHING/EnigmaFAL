// ======================================================
// MAGNUS ENGINE
// CharacterRepository.js
//
// Repository responsável pelos personagens.
// ======================================================

import FirebaseRepository from "./FirebaseRepository.js";
import CharacterModel from "../models/CharacterModel.js";

class CharacterRepository extends FirebaseRepository {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor() {

        super("characters", CharacterModel);

    }

    // ==================================================
    // BUSCA POR JOGADOR
    // ==================================================

    async findByPlayer(playerId) {

        return await this.findWhere("playerId", playerId);

    }

    // ==================================================
    // PERSONAGENS ATIVOS
    // ==================================================

    async findActive() {

        return await this.findWhere("active", true);

    }

    // ==================================================
    // PERSONAGENS VIVOS
    // ==================================================

    async findAlive() {

        return await this.findWhere("alive", true);

    }

}

export default new CharacterRepository();