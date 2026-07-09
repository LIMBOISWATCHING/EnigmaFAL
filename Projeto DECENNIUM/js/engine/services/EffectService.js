// ======================================================
// MAGNUS ENGINE
// EffectService.js
// ======================================================

import BaseService from "./BaseService.js";
import MC from "../Core.js";

class EffectService extends BaseService {

    constructor() {

        super(null);

    }

    initialize() {

        this.repository = MC.Repositories.Effects;

    }

    async byCategory(category) {

        const effects = await this.repository.findByCategory(category);

        return effects.filter(effect =>

            MC.Services.Permissions.canView(effect)

        );

    }

    async byTarget(target) {

        const effects = await this.repository.findByTarget(target);

        return effects.filter(effect =>

            MC.Services.Permissions.canView(effect)

        );

    }

    async stackables() {

        const effects = await this.repository.findStackable();

        return effects.filter(effect =>

            MC.Services.Permissions.canView(effect)

        );

    }

    async findOwned() {

        return await this.findAll();

    }

}

export default new EffectService();
