// ======================================================
// MAGNUS ENGINE
// UserModel.js
//
// Representa um usuário do Magnus Files.
// Herda automaticamente todas as propriedades
// do BaseModel.
// ======================================================

import BaseModel from "./BaseModel.js";

class UserModel extends BaseModel {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(data = {}) {

        super(data);

        this.type = "user";

        // ==============================================
        // INFORMAÇÕES BÁSICAS
        // ==============================================

        this.name = data.name ?? "";

        this.username = data.username ?? "";

        this.email = data.email ?? "";

        this.photo = data.photo ?? null;

        this.bio = data.bio ?? "";

        // ==============================================
        // AUTENTICAÇÃO
        // ==============================================

        this.firebaseUid = data.firebaseUid ?? null;

        this.emailVerified = data.emailVerified ?? false;

        this.lastLogin = data.lastLogin ?? null;

        // ==============================================
        // PERMISSÕES
        // ==============================================

        this.role = data.role ?? "player";

        // Valores possíveis:
        // player
        // administrator
        // system

        // ==============================================
        // CONFIGURAÇÕES
        // ==============================================

        this.preferences = data.preferences ?? {

            theme: "dark",

            language: "pt-BR",

            notifications: true

        };

        // ==============================================
        // RELACIONAMENTOS
        // ==============================================

        this.characterIds = data.characterIds ?? [];

        this.caseIds = data.caseIds ?? [];

        this.favoriteCharacterId = data.favoriteCharacterId ?? null;

        // ==============================================
        // HISTÓRICO
        // ==============================================

        this.history = data.history ?? [];

    }

    // ==================================================
    // SERIALIZAÇÃO
    // ==================================================

    toJSON() {

        return {

            ...super.toJSON(),

            name: this.name,

            username: this.username,

            email: this.email,

            photo: this.photo,

            bio: this.bio,

            firebaseUid: this.firebaseUid,

            emailVerified: this.emailVerified,

            lastLogin: this.lastLogin,

            role: this.role,

            preferences: this.preferences,

            characterIds: this.characterIds,

            caseIds: this.caseIds,

            favoriteCharacterId: this.favoriteCharacterId,

            history: this.history

        };

    }

}

export default UserModel;