// ======================================================
// MAGNUS ENGINE
// Firebase.js
//
// Responsável por inicializar e fornecer acesso ao
// Firebase Realtime Database.
// ======================================================

import CoreModule from "../CoreModule.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

    getDatabase

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

class Firebase extends CoreModule {

    constructor() {

        super({

            name: "Firebase",

            version: "1.0.0",

            priority: 30

        });

        this.app = null;

        this.database = null;

    }

    // ==================================================
    // INICIALIZAÇÃO
    // ==================================================

    async initialize() {

        await super.initialize();

        const firebaseConfig = {

            apiKey: "AIzaSyDU86YIxOEF4PniyquLKQJoNckxhkKIXFI",

            authDomain: "chaton-3ee70.firebaseapp.com",

            databaseURL: "https://chaton-3ee70-default-rtdb.firebaseio.com/",

            projectId: "chaton-3ee70",

            storageBucket: "chaton-3ee70.firebasestorage.app",

            messagingSenderId: "725824098805",

            appId: "1:725824098805:web:636f25ab9360de14d050bc"

        };

        this.app = initializeApp(firebaseConfig);

        this.database = getDatabase(this.app);

        MC.log("Firebase conectado.");

    }

    // ==================================================
    // RETORNA A INSTÂNCIA DO FIREBASE
    // ==================================================

    getDatabase() {

        return this.database;

    }

    // ==================================================
    // FINALIZAÇÃO
    // ==================================================

    async destroy() {

        this.database = null;

        this.app = null;

        await super.destroy();

    }

}

export default new Firebase();