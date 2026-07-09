// ======================================================
// MAGNUS ENGINE
// Services.js
// ======================================================

import UserService from "./UserService.js";
import CharacterService from "./CharacterService.js";
import CreatureService from "./CreatureService.js";
import AttackService from "./AttackService.js";
import AbilityService from "./AbilityService.js";
import EffectService from "./EffectService.js";
import CaseService from "./CaseService.js";
import BattleService from "./BattleService.js";
import PermissionService from "./PermissionService.js";
import PublicItemService from "./PublicItemService.js";
import VaultService from "./VaultService.js";
import LibraryService from "./LibraryService.js";

const Services = {

    Users: UserService,

    Characters: CharacterService,

    Creatures: CreatureService,

    Attacks: AttackService,

    Abilities: AbilityService,

    Effects: EffectService,

    Cases: CaseService,

    Battles: BattleService,

    Permissions: PermissionService,

    PublicItems: PublicItemService,

    Vaults: VaultService,

    Library: LibraryService

};

export default Services;
