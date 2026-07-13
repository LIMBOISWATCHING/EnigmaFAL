// ======================================================
// MAGNUS ENGINE
// Auth.js
//
// Sistema completo de identificação do Magnus Files.
// ======================================================

import CoreModule from "../CoreModule.js";

class Auth extends CoreModule {

    constructor() {

        super({

            name: "Auth",

            version: "1.0.0",

            priority: 35

        });

        this.user = null;
        this.storageKey = "magnus-session";
        this.adminSessionKey = "magnus-admin-session";
        this.adminName = "H1g0r";
        this.adminPassword = "371982465";

        this.adminNames = [

            this.adminName

        ];

    }

    // ==================================================
    // INICIALIZAÇÃO
    // ==================================================

    async initialize() {

        await super.initialize();

        MC.log("Auth iniciado.");

    }

    // ==================================================
    // LOGIN
    // ==================================================

    async login(name, password = "") {

        name = name.trim();
        const usernameKey = this.usernameKey(name);

        if (!name.length) {

            return null;

        }

        if (this.isAdminName(name)) {

            if (String(password) !== this.adminPassword) {

                throw new Error("Senha de administrador incorreta.");

            }

            name = this.adminName;

        }

        const lastLogin = Date.now();

        let user = await this.findByName(name);

        if (!user) {

            user = await this.create(name, lastLogin);

        }

        else {

            user.lastLogin = lastLogin;
            this.applyAdminFlags(user);

            await MC.Database.update(

                `users/${user.id}`,

                user

            );

            await MC.Database.set(

                `usernames/${usernameKey}`,

                {

                    id: user.id

                }

            );

        }

        this.user = user;

        MC.State.set("user", user);

        localStorage.setItem(

    this.storageKey,

    user.id

);

        if (this.isAdminUser(user)) {

            localStorage.setItem(this.adminSessionKey, "authenticated");

        }

        else {

            localStorage.removeItem(this.adminSessionKey);

        }

        return user;

    }

    // ==================================================
    // LOGOUT
    // ==================================================

// ==================================================
// LOGOUT
// ==================================================

async logout() {

    const currentName = MC.Router?.currentPage?.();
    const currentPage = currentName ? MC.Router.pages?.[currentName] : null;

    if (currentPage?.close) {

        const canClose = await currentPage.close();

        if (canClose === false) {

            return false;

        }

    }

    // Remove usuário atual
    this.user = null;

    MC.State.set("user", null);

    // Remove sessão salva
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.adminSessionKey);

    // Bloqueia menu
    if (MC.Menu) {

        MC.Menu.lock();

    }

    // Esconde footer
    if (MC.Layout?.footer) {

        MC.Layout.footer.style.display = "none";

    }

    MC.Layout?.setOnline?.(false);

    // Volta para identificação
    await MC.Router.open("Identification");

    return true;

}

    // ==================================================
    // PROCURA PELO NOME
    // ==================================================

    async findByName(name) {

        if (this.isAdminName(name)) {

            name = this.adminName;

        }

        const index = await MC.Database.get(

            `usernames/${this.usernameKey(name)}`

        ) || await MC.Database.get(

            `usernames/${name}`

        );

        if (!index) {

            const user = await this.findExistingUserByName(name);

            if (user) {

                await MC.Database.set(

                    `usernames/${this.usernameKey(name)}`,

                    {

                        id: user.id

                    }

                );

                return user;

            }

            return null;

        }

        return await this.findById(index.id);

    }

    async findExistingUserByName(name) {

        const users = await MC.Database.get("users");
        const key = this.usernameKey(name);

        if (!users || typeof users !== "object") return null;

        const matches = Object.values(users)
            .filter(user => this.usernameKey(user?.username || user?.name) === key)
            .sort((a, b) => Number(a.lastLogin || 0) - Number(b.lastLogin || 0));

        return matches[0] || null;

    }

    // ==================================================
    // PROCURA PELO ID
    // ==================================================

    async findById(id) {

        return await MC.Database.get(

            `users/${id}`

        );

    }

    // ==================================================
    // CRIA NOVO USUÁRIO
    // ==================================================

    async create(name, lastLogin = Date.now()) {

        const id = await MC.Utils.nextId("USR");

        const user = {

            id,

            name,

            username: name,

            lastLogin,

            admin: this.isAdminName(name),
            role: this.isAdminName(name) ? "administrator" : "player",

            profile: {},

            characters: {},

            cases: {},

            attacks: {},

            effects: {},

            settings: {}

        };

        await MC.Database.set(

            `users/${id}`,

            user

        );

        await MC.Database.set(

            `usernames/${this.usernameKey(name)}`,

            {

                id

            }

        );

        if (this.usernameKey(name) !== name) {

            await MC.Database.set(

                `usernames/${name}`,

                {

                    id

                }

            );

        }

        return user;

    }

    usernameKey(name) {

        return String(name || "").trim().toLowerCase();

    }

    isAdminName(name) {

        return String(name || "").trim().toLowerCase() === this.adminName.toLowerCase();

    }

    applyAdminFlags(user) {

        if (!user) return user;

        const admin = this.isAdminName(user.name) || this.isAdminName(user.username);
        user.admin = admin;
        user.role = admin ? "administrator" : (user.role === "administrator" || user.role === "system" ? "player" : user.role || "player");

        return user;

    }

    isAdminUser(user = this.user) {

        return Boolean(user && this.isAdminName(user.name || user.username) && user.admin === true);

    }

    // ==================================================
    // RETORNA USUÁRIO
    // ==================================================

    current() {

        return this.user;

    }

    // ==================================================
    // LOGADO?
    // ==================================================

    logged() {

        return this.user !== null;

    }

    // ==================================================
    // ADMIN?
    // ==================================================

    isAdmin() {

        if (!this.user) {

            return false;

        }

        return this.isAdminUser(this.user);

    }

        // ==================================================
// RESTAURA SESSÃO
// ==================================================

async restoreSession() {

    const id = localStorage.getItem(

        this.storageKey

    );

    if (!id) {

        return false;

    }

    const user = await this.findById(id);

    if (!user) {

        localStorage.removeItem(

            this.storageKey

        );

        return false;

    }

    this.applyAdminFlags(user);

    if (this.isAdminUser(user) && localStorage.getItem(this.adminSessionKey) !== "authenticated") {

        localStorage.removeItem(this.storageKey);
        return false;

    }

    this.user = user;

    MC.State.set("user", user);

    return true;

}

}



export default new Auth();
