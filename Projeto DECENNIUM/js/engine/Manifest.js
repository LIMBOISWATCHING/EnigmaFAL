// ======================================================
// MAGNUS ENGINE
// Manifest.js
//
// Define quais módulos fazem parte da Engine e
// em qual ordem serão inicializados.
// ======================================================

import Modules from "./Modules.js";

// ======================================================
// MANIFESTO DA ENGINE
// ======================================================

const Manifest = [

    Modules.State,

    Modules.Events,

    Modules.Firebase,

    Modules.Auth,

    Modules.Database,

    Modules.Loader,

    Modules.Layout,

    Modules.UI,

    Modules.Menu,

    Modules.Router,

    Modules.Utils

].filter(Boolean);

// ======================================================
// ORDENA PELA PRIORIDADE DEFINIDA EM CADA MÓDULO
// ======================================================

Manifest.sort((a, b) => a.priority - b.priority);

export default Manifest;