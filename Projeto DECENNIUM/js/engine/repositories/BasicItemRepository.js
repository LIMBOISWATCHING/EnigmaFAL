import FirebaseRepository from "./FirebaseRepository.js";
import BasicItemModel from "../models/BasicItemModel.js";

class BasicItemRepository extends FirebaseRepository {

    constructor() {
        super("basicItems", BasicItemModel);
    }

}

export default new BasicItemRepository();
