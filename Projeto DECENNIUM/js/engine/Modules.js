// ======================================================
// MAGNUS ENGINE
// Modules.js
//
// Registro central de todos os módulos da Engine.
// ======================================================

// ======================================================
// IMPORTAÇÃO DOS MÓDULOS
// ======================================================

import State from "./state/State.js";

import Events from "./events/Events.js";

import Firebase from "./database/Firebase.js";

import Database from "./database/Database.js";

import Loader from "./loader/Loader.js";

import UI from "./ui/UI.js";

import Menu from "./menu/Menu.js";

import Router from "./router/Router.js";

import Utils from "./utils/Utils.js";

import Auth from "./auth/Auth.js";

import Layout from "./layout/Layout.js";

// ======================================================
// EXPORTAÇÃO
// ======================================================

const Modules = {

    State,

    Events,

    Firebase,

    Auth,

    Database,

    Loader,

    UI,

    Menu,

    Router,

    Layout,

    Utils

};

export default Modules;