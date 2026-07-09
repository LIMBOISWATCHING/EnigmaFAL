// ======================================================
// MAGNUS ENGINE
// UI.js
//
// Utilitarios visuais simples usados pelas paginas.
// ======================================================

import CoreModule from "../CoreModule.js";

class UI extends CoreModule {

    constructor() {

        super({

            name: "UI",

            version: "1.0.0",

            priority: 60

        });

        this.modal = null;

        this.toastContainer = null;

        this.root = null;

    }

    async initialize() {

        await super.initialize();

        this.createRoot();

        this.createToastContainer();

        MC.log("UI iniciado.");

    }

    alert(message, title = "Aviso") {

        return this.dialog({
            title,
            message,
            buttons: [
                { label: "OK", value: true, primary: true }
            ]
        });

    }

    confirm(message, title = "Confirmar") {

        return this.dialog({
            title,
            message,
            buttons: [
                { label: "Cancelar", value: false },
                { label: "Confirmar", value: true, primary: true }
            ]
        });

    }

    prompt(message, defaultValue = "", title = "Entrada") {

        return this.dialog({
            title,
            message,
            input: true,
            defaultValue,
            buttons: [
                { label: "Cancelar", value: null },
                { label: "OK", value: "__input__", primary: true }
            ]
        });

    }

    promptSecret(message, defaultValue = "", title = "Acesso restrito") {

        return this.dialog({
            title,
            message,
            input: true,
            inputType: "password",
            defaultValue,
            buttons: [
                { label: "Cancelar", value: null },
                { label: "OK", value: "__input__", primary: true }
            ]
        });

    }

    dialog(options = {}) {

        return new Promise(resolve => {

            const overlay = document.createElement("div");
            overlay.className = "mc-ui-overlay";

            overlay.innerHTML = `
                <div class="mc-ui-window" role="dialog" aria-modal="true">
                    <div class="mc-ui-title">${this.escape(options.title || "Magnus Engine")}</div>
                    <div class="mc-ui-content">
                        <p class="mc-ui-message">${this.escape(options.message || "")}</p>
                        ${options.input ? `
                            <input class="mc-ui-input" type="${this.escape(options.inputType || "text")}" value="${this.escape(options.defaultValue || "")}">
                        ` : ""}
                    </div>
                    <div class="mc-ui-buttons">
                        ${(options.buttons || []).map((button, index) => `
                            <button
                                type="button"
                                class="${button.primary ? "mc-ui-primary" : ""}"
                                data-index="${index}">
                                ${this.escape(button.label)}
                            </button>
                        `).join("")}
                    </div>
                </div>
            `;

            const close = value => {
                overlay.remove();
                resolve(value);
            };

            overlay.querySelectorAll("button[data-index]").forEach(button => {
                button.addEventListener("click", () => {
                    const config = options.buttons[Number(button.dataset.index)];
                    if (config.value === "__input__") {
                        close(overlay.querySelector(".mc-ui-input")?.value ?? "");
                        return;
                    }
                    close(config.value);
                });
            });

            overlay.addEventListener("keydown", event => {
                if (event.key === "Escape") {
                    const cancel = (options.buttons || []).find(button => button.value === false || button.value === null);
                    close(cancel ? cancel.value : false);
                }
                if (event.key === "Enter" && options.input) {
                    close(overlay.querySelector(".mc-ui-input")?.value ?? "");
                }
            });

            this.root.appendChild(overlay);

            setTimeout(() => {
                (overlay.querySelector(".mc-ui-input") || overlay.querySelector(".mc-ui-primary") || overlay.querySelector("button"))?.focus();
            }, 0);

        });

    }

    toast(message, duration = 3000) {

        const toast = document.createElement("div");

        toast.className = "mc-ui-toast";

        toast.textContent = message;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {

            toast.remove();

        }, duration);

        return toast;

    }

    modalWindow(options = {}) {

        this.close();

        const title = options.title || "";

        const content = options.content || "";

        this.modal = document.createElement("div");

        this.modal.className = "mc-ui-overlay";

        this.modal.innerHTML = `

            <div class="mc-ui-window">

                <div class="mc-ui-title">

                    ${title}

                </div>

                <div class="mc-ui-content">${content}</div>

                <div class="mc-ui-buttons">

                    <button type="button" class="mc-ui-close">FECHAR</button>

                </div>

            </div>

        `;

        this.modal
            .querySelector(".mc-ui-close")
            .addEventListener("click", () => this.close());

        this.root.appendChild(this.modal);

        return this.modal;

    }

    close() {

        if (!this.modal) {

            return;

        }

        this.modal.remove();

        this.modal = null;

    }

    createToastContainer() {

        this.toastContainer = document.getElementById("mc-toast-container");

        if (this.toastContainer) {

            return;

        }

        this.toastContainer = document.createElement("div");

        this.toastContainer.id = "mc-toast-container";

        this.root.appendChild(this.toastContainer);

    }

    createRoot() {

        this.root = document.getElementById("mc-ui");

        if (this.root) {

            return;

        }

        this.root = document.createElement("div");
        this.root.id = "mc-ui";
        document.body.appendChild(this.root);

    }

    escape(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    }

}

export default new UI();
