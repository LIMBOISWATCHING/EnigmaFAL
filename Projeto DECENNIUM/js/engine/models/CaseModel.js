// ======================================================
// MAGNUS ENGINE
// CaseModel.js
//
// Representa um caso/investigação do Magnus Files.
// Funciona como o contêiner principal de todos os
// elementos relacionados a uma investigação.
// ======================================================

import BaseModel from "./BaseModel.js";

class CaseModel extends BaseModel {

    // ==================================================
    // CONSTRUTOR
    // ==================================================

    constructor(data = {}) {

        super(data);

        this.type = "case";

        // ==============================================
        // INFORMAÇÕES BÁSICAS
        // ==============================================

        this.name = data.name ?? "";

        this.code = data.code ?? "";

        this.location = data.location ?? "";

        this.objective = data.objective ?? "";

        this.description = data.description ?? "";

        this.cover = data.cover ?? null;

        this.password = data.password ?? "";

        this.creatorName = data.creatorName ?? "";

        // ==============================================
        // STATUS
        // ==============================================

        this.status = data.status ?? "not_started";

        // Draft
        // Open
        // Investigation
        // Paused
        // Solved
        // Archived
        // Cancelled

        this.priority = data.priority ?? "Medium";

        // Low
        // Medium
        // High
        // Critical

        this.classification = data.classification ?? "Restricted";

        // Public
        // Restricted
        // Confidential
        // TopSecret

        // ==============================================
        // PARTICIPANTES
        // ==============================================

        this.characterIds = data.characterIds ?? [];

        this.userIds = data.userIds ?? [];

        // ==============================================
        // CRIATURAS
        // ==============================================

        this.creatureIds = data.creatureIds ?? [];

        // ==============================================
        // EVIDÊNCIAS
        // ==============================================

        this.evidenceIds = data.evidenceIds ?? [];

        // ==============================================
        // DOCUMENTOS
        // ==============================================

        this.documentIds = data.documentIds ?? [];

        // ==============================================
        // ÁUDIOS
        // ==============================================

        this.audioIds = data.audioIds ?? [];

        // ==============================================
        // MÍDIAS
        // ==============================================

        this.mediaIds = data.mediaIds ?? [];

        // ==============================================
        // LOCAIS
        // ==============================================

        this.locationIds = data.locationIds ?? [];

        // ==============================================
        // EVENTOS
        // ==============================================

        this.eventIds = data.eventIds ?? [];

        // ==============================================
        // NOTAS
        // ==============================================

        this.noteIds = data.noteIds ?? [];

        this.photos = data.photos ?? [];

        this.notes = data.notes ?? [];

        this.pages = data.pages ?? [];

        this.audios = data.audios ?? [];

        this.dossiers = data.dossiers ?? [];

        // ==============================================
        // QUADRO INVESTIGATIVO
        // ==============================================

        this.boardId = data.boardId ?? null;

        this.board = data.board ?? {

            items: [],

            links: []

        };

        // ==============================================
        // LINHA DO TEMPO
        // ==============================================

        this.timeline = data.timeline ?? [];

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

            code: this.code,

            location: this.location,

            objective: this.objective,

            description: this.description,

            cover: this.cover,

            password: this.password,

            creatorName: this.creatorName,

            status: this.status,

            priority: this.priority,

            classification: this.classification,

            characterIds: this.characterIds,

            userIds: this.userIds,

            creatureIds: this.creatureIds,

            evidenceIds: this.evidenceIds,

            documentIds: this.documentIds,

            audioIds: this.audioIds,

            mediaIds: this.mediaIds,

            locationIds: this.locationIds,

            eventIds: this.eventIds,

            noteIds: this.noteIds,

            photos: this.photos,

            notes: this.notes,

            pages: this.pages,

            audios: this.audios,

            dossiers: this.dossiers,

            boardId: this.boardId,

            board: this.board,

            timeline: this.timeline,

            history: this.history

        };

    }

}

export default CaseModel;
