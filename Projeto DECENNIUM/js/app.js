// ======================================================

// MAGNUS FILES

// app.js

//

// Bootstrap da aplicação.

// ======================================================



import MC from "./engine/Core.js";

const bootCommands = [
    "> loading core modules...",
    "> mounting database service...",
    "> checking session keys...",
    "> indexing repositories...",
    "> restoring encrypted archive...",
    "> binding sidebar routes...",
    "> calibrating dice interface...",
    "> loading investigation database...",
    "> synchronizing public vault registry...",
    "> preparing terminal viewport..."
];

const bootGlitches = [
    "> signal anomaly detected < O >",
    "> visual parser blink < O >",
    "> archive echo < O >",
    "> terminal frame desync < O >"
];

let bootTimer = null;
let bootIndex = 0;

function pushBootCommand(text) {
    const log = document.getElementById("mc-engine-boot-log");
    if (!log) return;

    const line = document.createElement("span");
    line.textContent = text;
    if (text.includes("< O >")) {
        line.className = "mc-engine-boot-glitch";
    }
    log.appendChild(line);

    while (log.children.length > 22) {
        log.removeChild(log.firstElementChild);
    }
}

function setBootStatus(text) {
    const status = document.getElementById("mc-engine-boot-status");
    if (status) status.textContent = text;
}

function startEngineBoot() {
    const boot = document.getElementById("mc-engine-boot");
    if (boot) boot.classList.remove("hidden");

    pushBootCommand("> boot sequence accepted");
    bootTimer = setInterval(() => {
        const command = Math.random() < 0.18
            ? bootGlitches[Math.floor(Math.random() * bootGlitches.length)]
            : bootCommands[bootIndex % bootCommands.length];

        pushBootCommand(command);
        bootIndex += 1;
    }, 180);
}

function stopEngineBoot() {
    if (bootTimer) {
        clearInterval(bootTimer);
        bootTimer = null;
    }

    pushBootCommand("> boot complete");
    setBootStatus("ENGINE PRONTA");

    setTimeout(() => {
        document.getElementById("mc-engine-boot")?.classList.add("hidden");
    }, 180);
}



window.addEventListener("DOMContentLoaded", async () => {



    try {

        startEngineBoot();

        setBootStatus("INICIANDO MODULOS");

        await MC.start();



        window.MC = MC;



        const staticApp = document.getElementById("mc-app");



        if (staticApp) {



            staticApp.style.display = "none";



        }



        setBootStatus("RESTAURANDO SESSAO");

        const restored = await MC.Auth.restoreSession();



        if (restored) {



            if (MC.Menu) {



                MC.Menu.unlock();



            }



            if (MC.Layout?.footer) {



                MC.Layout.footer.style.display = "";



            }



            setBootStatus("ABRINDO DASHBOARD");

            await MC.Router.open("Dashboard");



        }



        else {



            if (MC.Menu) {



                MC.Menu.lock();



            }



            setBootStatus("ABRINDO IDENTIFICACAO");

            await MC.Router.open("Identification");



        }



        stopEngineBoot();

    }



    catch (error) {

        if (bootTimer) {
            clearInterval(bootTimer);
            bootTimer = null;
        }


        console.error("");



        console.error("==============================================");

        setBootStatus("ERRO AO INICIAR ENGINE");
        pushBootCommand("> boot failed: " + (error?.message || "unknown error"));



        console.error("ERRO AO INICIAR A MAGNUS ENGINE");



        console.error("");



        console.error(error);



        console.error("");



        console.error("==============================================");



    }



});


