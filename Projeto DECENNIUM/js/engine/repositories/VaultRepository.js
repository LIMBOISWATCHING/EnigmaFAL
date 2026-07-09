import FirebaseRepository from "./FirebaseRepository.js";
import VaultModel from "../models/VaultModel.js";

class VaultRepository extends FirebaseRepository {

    constructor() {
        super("vaults", VaultModel);
    }

}

export default new VaultRepository();
