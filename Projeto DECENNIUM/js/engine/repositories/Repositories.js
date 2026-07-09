// ======================================================
// MAGNUS ENGINE
// Repositories.js
//
// Registro central de todos os Repositories da Engine.
//
// Funciona da mesma forma que Modules.js.
// ======================================================

// ======================================================
// IMPORTAÇÕES
// ======================================================

import UserRepository from "./UserRepository.js";

import CharacterRepository from "./CharacterRepository.js";

import CreatureRepository from "./CreatureRepository.js";

import AttackRepository from "./AttackRepository.js";

import AbilityRepository from "./AbilityRepository.js";

import EffectRepository from "./EffectRepository.js";

import CaseRepository from "./CaseRepository.js";

import BattleRepository from "./BattleRepository.js";
import BasicItemRepository from "./BasicItemRepository.js";
import VaultRepository from "./VaultRepository.js";
import LibraryCategoryRepository from "./LibraryCategoryRepository.js";
import LibraryBookRepository from "./LibraryBookRepository.js";
import LibraryPageRepository from "./LibraryPageRepository.js";

// ======================================================
// REGISTRO
// ======================================================

const Repositories = {

    Users: UserRepository,

    Characters: CharacterRepository,

    Creatures: CreatureRepository,

    Attacks: AttackRepository,

    Abilities: AbilityRepository,

    Effects: EffectRepository,

    Cases: CaseRepository,

    Battles: BattleRepository,

    BasicItems: BasicItemRepository,

    Vaults: VaultRepository,

    LibraryCategories: LibraryCategoryRepository,

    LibraryBooks: LibraryBookRepository,

    LibraryPages: LibraryPageRepository

};

export default Repositories;
