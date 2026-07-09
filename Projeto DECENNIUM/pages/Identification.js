// ======================================================
// MAGNUS FILES
// Identification.js
// ======================================================

import MC from "../js/engine/Core.js";

class Identification {

    constructor() {

        this.container = null;

        this.form = null;

        this.input = null;

        this.button = null;

        this.submit = this.onSubmit.bind(this);

    }

    async open(container) {

        this.container = container;

        this.container.innerHTML =
            await MC.Loader.html("pages/Identification.html");

        this.form = document.getElementById("identification-form");

        this.input = document.getElementById("username");

        this.button = document.getElementById("access-button");

        if (!this.form || !this.input)
            return;

        this.form.addEventListener(
            "submit",
            this.submit
        );

        this.input.focus();

    }

    async onSubmit(event) {

        event.preventDefault();

        const username = this.input.value.trim();

        if (!username)
            return;

        if (this.button) {

            this.button.disabled = true;

            this.button.textContent = "AUTENTICANDO...";

        }

        try {

            let password = "";

            if (MC.Auth.isAdminName?.(username)) {

                password = await MC.UI.promptSecret("Senha de administrador:", "", "DCode administrativo");

                if (password === null) {

                    throw new Error("Login administrativo cancelado.");

                }

            }

            await MC.Auth.login(username, password);

            await MC.Loader.playBoot({ username });

            MC.Menu.unlock();

            MC.Layout.footer.style.display = "";

            await MC.Router.open("Dashboard");

        }

        catch(error){

            console.error(error);

            if (this.button) {

                this.button.disabled = false;

                this.button.textContent = "ACESSAR";

            }

        }

    }

    async close() {

        if (this.form) {

            this.form.removeEventListener(

                "submit",

                this.submit

            );

        }

    }

}

export default new Identification();
