// ======================================================
// MAGNUS FILES
// Placeholder.js
//
// Paginas temporarias para secoes ainda nao implementadas.
// ======================================================

class Placeholder {

    constructor(title) {

        this.title = title;

    }

    async open(container) {

        container.innerHTML = `

            <section class="dashboard-page">

                <header class="dashboard-header">

                    <div>

                        <h1>${this.title}</h1>

                        <p class="dashboard-subtitle">

                            Secao em desenvolvimento.

                        </p>

                    </div>

                </header>

                <section class="dashboard-welcome">

                    <h2>Arquivo indisponivel.</h2>

                    <p>Esta area ainda sera catalogada no sistema.</p>

                </section>

            </section>

        `;

    }

    async close() {}

}

export default Placeholder;
