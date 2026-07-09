// ======================================================
// MAGNUS ENGINE
// UserRepository.js
//
// Repository responsável pelos usuários.
// ======================================================

import FirebaseRepository from "./FirebaseRepository.js";
import UserModel from "../models/UserModel.js";

class UserRepository extends FirebaseRepository {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor() {

        super("users", UserModel);

    }

    // ==================================================
    // BUSCA POR E-MAIL
    // ==================================================

    async findByEmail(email) {

        return await this.findWhere("email", email);

    }

    // ==================================================
    // BUSCA POR USERNAME
    // ==================================================

    async findByUsername(username) {

        return await this.findWhere("username", username);

    }

}

export default new UserRepository();