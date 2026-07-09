// ======================================================
// MAGNUS ENGINE
// Menu.js
//
// Barra lateral do Magnus Files.
// ======================================================

import CoreModule from "../CoreModule.js";

class Menu extends CoreModule {

    constructor() {

        super({

            name: "Menu",

            version: "1.0.0",

            priority: 70

        });

        this.container = null;

        this.active = null;

        this.items = [

            {
                id: "Dashboard",
                title: "Inicio",
                icon: `<img class="menu-icon" src="assets/icons/home.png">`
            },
            {
                id: "characters",
                title: "Personagens",
                icon: `<img class="menu-icon" src="assets/icons/personagem.png">`
            },
            {
                id: "attacks",
                title: "Atqs, Habs e Efts",
                icon: `<img class="menu-icon" src="assets/icons/missoes.png">`
            },
            {
                id: "basicItems",
                title: "Itens Basicos",
                icon: `<img class="menu-icon" src="assets/icons/biblioteca.png">`
            },
            {
                id: "cases",
                title: "Casos",
                icon: `<img class="menu-icon" src="assets/icons/missoes.png">`
            },
            {
                id: "creatures",
                title: "Biblioteca",
                icon: `<img class="menu-icon" src="assets/icons/biblioteca.png">`
            },
            {
                id: "personalBoard",
                title: "Quadro Investigativo",
                icon: `<img class="menu-icon" src="assets/icons/missoes.png">`
            },
            {
                id: "dcode",
                title: "DCODE",
                icon: "&#x1F512;",
                external: true,
                url: "https://www.dcode.fr"
            },
            {
                id: "logout",
                title: "Sair",
                icon: "&#x23FB;"
            }

        ];

    }

    async initialize() {

        await super.initialize();

        this.container = MC.Layout.sidebar;

        this.render();

        MC.log("Menu iniciado.");

    }

    render() {

        this.container.innerHTML = `

            <div class="mc-sidebar-header">

                <h1>THE MAGNUS INSTITUTE</h1>

            </div>

        `;

        const menuItems = document.createElement("div");
        const dcodeContainer = document.createElement("div");
        const logoutContainer = document.createElement("div");

        menuItems.className = "mc-menu-items";
        dcodeContainer.className = "mc-menu-dcode";
        logoutContainer.className = "mc-menu-logout";

        for (const item of this.items) {

            const button = document.createElement("button");

            button.className = "mc-menu-button";
            button.dataset.page = item.id;
            button.type = "button";

            if (this.active === item.id) {

                button.classList.add("active");

            }

            button.innerHTML = `

                <span class="menu-icon">${item.icon}</span>

                <span class="menu-text">${item.title}</span>

            `;

            button.addEventListener("click", () => this.select(item));

            if (item.id === "dcode") {

                dcodeContainer.appendChild(button);

            }

            else if (item.id === "logout") {

                logoutContainer.appendChild(button);

            }

            else {

                menuItems.appendChild(button);

            }

        }

        this.container.appendChild(menuItems);
        this.container.appendChild(dcodeContainer);
        this.container.appendChild(logoutContainer);

    }

    async select(item) {

        if (item.external) {

            window.open(item.url, "_blank");

            return;

        }

        if (item.id === "logout") {

            await MC.Auth.logout();

            return;

        }

        await MC.Router.open(item.id);

    }

    unlock() {

        this.container?.classList.remove("menu-locked");

        this.render();

    }

    lock() {

        this.active = null;

        this.container?.classList.add("menu-locked");

        this.render();

    }

    setActive(id) {

        this.active = id;

        const buttons = this.container.querySelectorAll(".mc-menu-button");

        buttons.forEach(button => {

            button.classList.toggle(

                "active",

                button.dataset.page === id

            );

        });

    }

    add(item) {

        this.items.push(item);

        this.render();

    }

}

export default new Menu();
