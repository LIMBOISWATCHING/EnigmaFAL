// ======================================================
// MAGNUS ENGINE
// TESTE DA UI
// ======================================================

window.testUI = async function () {

    console.clear();

    console.log("==================================");
    console.log(" MAGNUS UI TEST ");
    console.log("==================================");

    //-----------------------------------------
    // ALERT
    //-----------------------------------------

    await MC.UI.alert(

        "Teste do sistema de Alert."

    );

    //-----------------------------------------
    // CONFIRM
    //-----------------------------------------

    const confirm = await MC.UI.confirm(

        "Você está gostando da Magnus Engine?"

    );

    console.log("Confirm:", confirm);

    //-----------------------------------------
    // PROMPT
    //-----------------------------------------

    const nome = await MC.UI.prompt(

        "Digite um nome",

        "Magnus"

    );

    console.log("Prompt:", nome);

    //-----------------------------------------
    // TOAST
    //-----------------------------------------

    MC.UI.toast(

        "Toast funcionando!"

    );

    //-----------------------------------------
    // MODAL CUSTOMIZADA
    //-----------------------------------------

    const container = document.createElement("div");

    container.innerHTML = `

        <h2>Janela Personalizada</h2>

        <p>

            A UI da Magnus Engine está funcionando.

        </p>

    `;

    const modal = MC.UI.modalWindow({

        title: "TESTE",

        content: container

    });

    const button = document.createElement("button");

    button.textContent = "FECHAR";

    button.onclick = () => MC.UI.close();

    modal.body.appendChild(button);

    console.log("Fim dos testes.");

}