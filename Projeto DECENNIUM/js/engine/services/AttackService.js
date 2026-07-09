// ======================================================
// MAGNUS ENGINE
// AttackService.js
// ======================================================

import BaseService from "./BaseService.js";
import MC from "../Core.js";

class AttackService extends BaseService {

    constructor() {

        super(null);

    }

    initialize() {

        this.repository = MC.Repositories.Attacks;

    }

    async byCategory(category) {

        const attacks = await this.repository.findByCategory(category);

        return attacks.filter(attack =>

            MC.Services.Permissions.canView(attack)

        );

    }

    async byElement(element) {

        const attacks = await this.repository.findByElement(element);

        return attacks.filter(attack =>

            MC.Services.Permissions.canView(attack)

        );

    }

    async findOwned() {

        return await this.findAll();

    }

}

export default new AttackService();
