// ======================================================
// MAGNUS ENGINE
// CreatureService.js
// ======================================================

import BaseService from "./BaseService.js";
import MC from "../Core.js";

class CreatureService extends BaseService {

    constructor() {

        super(null);

    }

    initialize() {

        this.repository = MC.Repositories.Creatures;

    }

    async heal(creature, amount) {

        creature.life = Math.min(

            creature.maxLife,

            creature.life + amount

        );

        return await this.update(creature);

    }

    async damage(creature, amount) {

        creature.life = Math.max(

            0,

            creature.life - amount

        );

        return await this.update(creature);

    }

    async kill(creature) {

        creature.life = 0;

        return await this.update(creature);

    }

}

export default new CreatureService();