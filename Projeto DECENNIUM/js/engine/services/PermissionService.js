// ======================================================
// MAGNUS ENGINE
// PermissionService.js
//
// Camada central de permissoes da aplicacao.
// ======================================================

import MC from "../Core.js";

class PermissionService {

    currentUser() {

        return MC.Auth?.current?.() || MC.State?.get?.("user") || null;

    }

    isAdmin(user = this.currentUser()) {

        if (MC.Auth?.isAdminUser) {

            return MC.Auth.isAdminUser(user);

        }

        return Boolean(user?.admin);

    }

    isOwner(entity, user = this.currentUser()) {

        if (!entity || !user) {

            return false;

        }

        return entity.ownerId === user.id ||
               entity.playerId === user.id ||
               entity.id === user.id;

    }

    hasPermission(entity, level, user = this.currentUser()) {

        if (!entity?.permissions || !user) {

            return false;

        }

        const permissions = entity.permissions;

        return permissions[level]?.includes(user.id) ||
               permissions.admin?.includes(user.id);

    }

    canView(entity, user = this.currentUser()) {

        if (!entity) {

            return false;

        }

        if (this.isAdmin(user) || this.isOwner(entity, user)) {

            return true;

        }

        if (entity.status === "public") {

            return true;

        }

        if (entity.userIds?.includes?.(user?.id)) {

            return true;

        }

        return this.hasPermission(entity, "read", user);

    }

    canCreate(collection, user = this.currentUser()) {

        if (!user) {

            return false;

        }

        if (this.isAdmin(user)) {

            return true;

        }

        return [

            "characters",
            "attacks",
            "abilities",
            "effects",
            "notes"

        ].includes(collection);

    }

    canUpdate(entity, user = this.currentUser()) {

        return this.isAdmin(user) ||
               this.isOwner(entity, user) ||
               this.hasPermission(entity, "write", user);

    }

    canDelete(entity, user = this.currentUser()) {

        return this.isAdmin(user) ||
               this.isOwner(entity, user) ||
               this.hasPermission(entity, "admin", user);

    }

    assert(condition, message = "Permissao negada.") {

        if (!condition) {

            throw new Error(message);

        }

    }

}

export default new PermissionService();
