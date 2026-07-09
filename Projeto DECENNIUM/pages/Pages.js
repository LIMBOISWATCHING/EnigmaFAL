// ======================================================
// MAGNUS FILES
// Pages.js
//
// Registro de todas as páginas do Magnus Files.
// ======================================================

import Identification from "./Identification.js";
import Dashboard from "./Dashboard/Dashboard.js";
import Characters from "./Characters/Characters.js";
import Attacks from "./Attacks/Attacks.js";
import BasicItems from "./BasicItems/BasicItems.js";
import Cases from "./Cases/Cases.js";
import Library from "./Library/Library.js";
import PersonalBoard from "./PersonalBoard/PersonalBoard.js";
import Placeholder from "./Placeholder.js";

const Pages = {

    Identification: Identification,

    Dashboard: Dashboard,

    characters: Characters,

    attacks: Attacks,

    basicItems: BasicItems,

    cases: Cases,

    creatures: Library,

    personalBoard: PersonalBoard,

    settings: new Placeholder("CONFIGURACOES")

};

export default Pages;
