// ======================================================
// MAGNUS ENGINE
// UserService.js
// ======================================================

import BaseService from "./BaseService.js";
import MC from "../Core.js";

class UserService extends BaseService {

    constructor() {

        super(null);

    }

    initialize() {

        this.repository = MC.Repositories.Users;

    }

    async findByEmail(email) {

        return await this.repository.findFirst(

            "email",

            email

        );

    }

    async findByUsername(username) {

        return await this.repository.findFirst(

            "username",

            username

        );

    }

}

export default new UserService();