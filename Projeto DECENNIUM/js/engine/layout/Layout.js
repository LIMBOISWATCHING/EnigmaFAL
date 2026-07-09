// ======================================================
// MAGNUS ENGINE
// Layout.js
//
// Estrutura visual principal da aplicação.
// ======================================================

import CoreModule from "../CoreModule.js";

class Layout extends CoreModule {

    constructor() {

        super({

            name: "Layout",

            version: "1.0.0",

            priority: 55

        });

        this.root = null;

        this.header = null;

        this.sidebar = null;

        this.content = null;

        this.footer = null;

        this.rollLogs = [];

        this.rollLogsCollapsed = false;

    }

    // ==================================================
    // INICIALIZAÇÃO
    // ==================================================

    async initialize() {

        await super.initialize();

        this.build();

        MC.log("Layout iniciado.");

    }

    // ==================================================
    // CONSTRÓI O LAYOUT
    // ==================================================

    build() {

        this.root = document.createElement("div");

        this.root.id = "mc-layout";

        this.root.innerHTML = `

            <header id="mc-header"></header>

            <aside id="mc-sidebar"></aside>

            <main id="mc-content"></main>

            <footer id="mc-footer"></footer>

            <aside id="mc-dice-panel"></aside>

        `;

        document.body.appendChild(this.root);

        this.header = this.root.querySelector("#mc-header");

        this.sidebar = this.root.querySelector("#mc-sidebar");

        this.content = this.root.querySelector("#mc-content");

        this.footer = this.root.querySelector("#mc-footer");

        this.render();

    }

    // ==================================================
    // RENDERIZA
    // ==================================================

    render() {

        this.header.innerHTML = `

            <div class="mc-header-left">

                <h1>THE MAGNUS INSTITUTE</h1>

                <small>

                    Confidential Investigation Database

                </small>

            </div>

            <div class="mc-header-right">

                OFFLINE

            </div>

        `;

        this.footer.innerHTML = `

            <span>

                Magnus Engine ${MC.version.version}

            </span>

            <span>

                <span id="mc-footer-status">OFFLINE</span>

            </span>

        `;

        this.renderDicePanel();

    }

    // ==================================================
    // MOSTRA LAYOUT
    // ==================================================

    show() {

        this.header.style.display = "";

        this.sidebar.style.display = "";

        this.footer.style.display = "";

    }

    // ==================================================
    // ESCONDE LAYOUT
    // ==================================================

    hide() {

        this.header.style.display = "none";

        this.sidebar.style.display = "none";

        this.footer.style.display = "none";

    }

    // ==================================================
    // ALTERA USUÁRIO
    // ==================================================

    setUser(user) {

        const right = this.header.querySelector(

            ".mc-header-right"

        );

        if (!right) return;

        right.innerHTML = `

            <strong>${user.name}</strong>

            <br>

            ONLINE

        `;

        this.setOnline(true);

    }

    setOnline(online) {

        const status = document.getElementById("mc-footer-status");

        if (status) {

            status.textContent = online ? "ONLINE" : "OFFLINE";

            status.className = online ? "mc-online" : "mc-offline";

        }

    }

    renderDicePanel() {

        const panel = this.root.querySelector("#mc-dice-panel");

        if (!panel) return;

        panel.innerHTML = `

            <div id="mc-dice-popup" class="mc-dice-popup"></div>
            <div class="mc-dice-controls">
                <button id="mc-dice-toggle" type="button" title="Recolher logs">Logs</button>
                <select id="mc-dice-type">
                    <option value="coin">Moeda</option>
                    <option value="6">1d6</option>
                    <option value="10">1d10</option>
                    <option value="12">1d12</option>
                    <option value="20">1d20</option>
                    <option value="custom">1dXX</option>
                </select>
                <input id="mc-dice-custom" type="number" min="2" value="100" title="Dado personalizado">
                <select id="mc-dice-stat" title="Modificador">
                    <option value="">Sem mod</option>
                    <option value="will">VON</option>
                    <option value="agility">AGI</option>
                    <option value="intellect">INT</option>
                </select>
                <label class="mc-dice-bonus-wrap" title="Bonus manual">
                    <span>+</span>
                    <input id="mc-dice-bonus" type="number" value="0">
                </label>
                <label class="mc-dice-count-wrap" title="Quantidade">
                    <span></span>
                    <input id="mc-dice-count" type="number" min="1" max="20" value="1">
                </label>
                <button id="mc-dice-roll" type="button">Girar</button>
            </div>

        `;

        panel.querySelector("#mc-dice-type")
            ?.addEventListener("change", () => this.updateDiceCustomVisibility());

        panel.querySelector("#mc-dice-roll")
            ?.addEventListener("click", () => this.rollDice());

        panel.querySelector("#mc-dice-toggle")
            ?.addEventListener("click", () => this.toggleRollLogs());

        this.updateDiceCustomVisibility();

    }

    updateDiceCustomVisibility() {

        const type = document.getElementById("mc-dice-type");
        const custom = document.getElementById("mc-dice-custom");

        if (custom && type) {

            custom.style.display = type.value === "custom" ? "" : "none";

        }

    }

    rollDice() {

        const type = document.getElementById("mc-dice-type")?.value || "20";
        const custom = parseInt(document.getElementById("mc-dice-custom")?.value || "100", 10);
        const count = Math.max(1, Math.min(20, parseInt(document.getElementById("mc-dice-count")?.value || "1", 10)));
        const stat = document.getElementById("mc-dice-stat")?.value || "";
        const manualBonus = parseInt(document.getElementById("mc-dice-bonus")?.value || "0", 10) || 0;
        const modifier = (stat ? (window.MC_DICE_MODIFIERS?.[stat] || 0) : 0) + manualBonus;

        const sides = type === "custom" ? Math.max(2, custom) : parseInt(type, 10);
        const results = [];

        for (let i = 0; i < count; i++) {

            if (type === "coin") {

                results.push(Math.random() < 0.5 ? "Cara" : "Coroa");

            }

            else {

                results.push(MC.Utils.random(1, sides));

            }

        }

        const critical = type === "20" && results.includes(20);
        const numericResults = results.filter(result => typeof result === "number");
        const total = numericResults.reduce((sum, value) => sum + value, 0) + modifier;
        const statLabels = { will: "Vontade", agility: "Agilidade", intellect: "Intelecto" };
        const statLabel = stat ? ` ${statLabels[stat] || stat}` : "";
        const label = type === "coin" ? "Moeda" : `${count}d${sides}${statLabel}${modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""}`;

        this.rollLogs.unshift({

            label,
            results: modifier && type !== "coin" ? [...results, `Total ${total}`] : results,
            critical

        });

        this.rollLogs = this.rollLogs.slice(0, 5);

        this.renderRollLogs();

    }

    toggleRollLogs() {

        this.rollLogsCollapsed = !this.rollLogsCollapsed;

        const button = document.getElementById("mc-dice-toggle");

        if (button) {

            button.textContent = this.rollLogsCollapsed ? "Ver" : "Logs";

            button.title = this.rollLogsCollapsed ? "Mostrar logs" : "Recolher logs";

        }

        this.renderRollLogs();

    }

    renderRollLogs() {

        const popup = document.getElementById("mc-dice-popup");

        if (!popup) return;

        popup.classList.toggle("collapsed", this.rollLogsCollapsed);

        if (this.rollLogsCollapsed) {

            const latest = this.rollLogs[0];

            popup.innerHTML = latest
                ? `<div class="mc-dice-log compact ${latest.critical ? "critical" : ""}">
                    <strong>${latest.label}</strong>
                    <span>${latest.results.join(", ")}</span>
                </div>`
                : "";

            return;

        }

        popup.innerHTML = this.rollLogs.map(log => `

            <div class="mc-dice-log ${log.critical ? "critical" : ""}">
                <strong>${log.label}</strong>
                <span>${log.results.join(", ")}</span>
            </div>

        `).join("");

    }

}

export default new Layout();
