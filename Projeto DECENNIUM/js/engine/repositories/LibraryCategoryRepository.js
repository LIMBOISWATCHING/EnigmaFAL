import FirebaseRepository from "./FirebaseRepository.js";
import LibraryCategoryModel from "../models/LibraryCategoryModel.js";

class LibraryCategoryRepository extends FirebaseRepository {

    constructor() {

        super("libraryCategories", LibraryCategoryModel);

    }

}

export default new LibraryCategoryRepository();
