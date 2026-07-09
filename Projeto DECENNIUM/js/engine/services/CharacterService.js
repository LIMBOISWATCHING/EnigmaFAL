// ======================================================
// MAGNUS ENGINE
// CharacterService.js
// ======================================================

import BaseService from "./BaseService.js";
import MC from "../Core.js";

class CharacterService extends BaseService {

    constructor() {

        super(null);

    }

    initialize() {

        this.repository = MC.Repositories.Characters;

    }

    async findByPlayer(playerId) {

        const characters = MC.Services.Permissions.isAdmin()

            ? await this.repository.findAll()

            : await this.repository.findByPlayer(playerId);

        return characters.filter(character =>

            MC.Services.Permissions.canView(character)

        );

    }

    async findActiveByPlayer(playerId) {

        const characters = await this.findByPlayer(playerId);

        return characters.filter(character => character.active !== false);

    }

    async heal(character, amount) {

        character.life = Math.min(

            character.maxLife,

            character.life + amount

        );

        return await this.update(character);

    }

    async damage(character, amount) {

        character.life = Math.max(

            0,

            character.life - amount

        );

        return await this.update(character);

    }

    async revive(character) {

        character.life = 1;

        return await this.update(character);

    }

}

export default new CharacterService();
