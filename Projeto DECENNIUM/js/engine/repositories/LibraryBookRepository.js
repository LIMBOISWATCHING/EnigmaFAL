import FirebaseRepository from "./FirebaseRepository.js";
import LibraryBookModel from "../models/LibraryBookModel.js";

class LibraryBookRepository extends FirebaseRepository {

    constructor() {

        super("books", LibraryBookModel);

    }

}

export default new LibraryBookRepository();
