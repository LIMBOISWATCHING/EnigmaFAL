import FirebaseRepository from "./FirebaseRepository.js";
import LibraryPageModel from "../models/LibraryPageModel.js";

class LibraryPageRepository extends FirebaseRepository {

    constructor() {

        super("bookPages", LibraryPageModel);

    }

}

export default new LibraryPageRepository();
