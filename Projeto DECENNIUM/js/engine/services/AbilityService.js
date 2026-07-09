// ======================================================
// MAGNUS ENGINE
// AbilityService.js
// ======================================================

import BaseService from "./BaseService.js";
import MC from "../Core.js";

class AbilityService extends BaseService {

    constructor() {

        super(null);

    }

    initialize() {

        this.repository = MC.Repositories.Abilities;

    }

    async byCategory(category) {

        const abilities = await this.repository.findByCategory(category);

        return abilities.filter(ability =>

            MC.Services.Permissions.canView(ability)

        );

    }

    async byTrigger(trigger) {

        const abilities = await this.repository.findByTrigger(trigger);

        return abilities.filter(ability =>

            MC.Services.Permissions.canView(ability)

        );

    }

    async findOwned() {

        return await this.findAll();

    }

}

export default new AbilityService();
