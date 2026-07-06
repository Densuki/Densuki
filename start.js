const { spawn } = require("child_process");
const net = require("net");
const chalk = require("chalk");

// ======================
// CONFIG
// ======================
const API_PORT = 5000;
const FRONTEND_PORT = 5500;

// ======================
// UTIL: porta aberta?
// ======================
function isPortOpen(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        socket.setTimeout(700);

        socket.once("connect", () => {
            socket.destroy();
            resolve(true);
        });

        socket.once("timeout", () => {
            socket.destroy();
            resolve(false);
        });

        socket.once("error", () => resolve(false));

        socket.connect(port, "127.0.0.1");
    });
}

// ======================
// PROCESS MANAGER
// ======================
class Service {
    constructor(name, command, args, options = {}, color = "cyan") {
        this.name = name;
        this.command = command;
        this.args = args;
        this.options = options;
        this.color = color;
        this.process = null;
        this.restarting = false;
    }

    log(msg) {
        console.log(chalk[this.color](`[${this.name}]`), msg);
    }

    start() {
        this.log("Iniciando...");

        this.process = spawn(this.command, this.args, {
            stdio: "pipe",
            ...this.options
        });

        this.process.stdout.on("data", (data) => {
            process.stdout.write(
                chalk[this.color](`[${this.name}] `) + data.toString()
            );
        });

        this.process.stderr.on("data", (data) => {
            process.stderr.write(
                chalk.red(`[${this.name} ERROR] `) + data.toString()
            );
        });

        this.process.on("close", (code) => {
            this.log(`Encerrado (${code})`);

            if (!this.restarting) {
                this.log("Reiniciando em 2s...");
                setTimeout(() => this.start(), 2000);
            }
        });

        this.process.on("error", (err) => {
            this.log(`Erro: ${err.message}`);
        });
    }

    stop() {
        if (this.process) {
            this.restarting = true;
            this.process.kill();
        }
    }
}

// ======================
// SERVIÇOS
// ======================
const api = new Service(
    "API",
    "/workspaces/Densuki/.venv/bin/python",
    ["app.py"],
    {
        cwd: "/workspaces/Densuki/backend/api"
    },
    "green"
);

const frontend = new Service(
    "FRONTEND",
    "npx",
    ["serve", "docs", "-l", FRONTEND_PORT.toString()],
    {
        cwd: "/workspaces/Densuki"
    },
    "blue"
);

// ======================
// BOOT
// ======================
(async () => {
    console.log(chalk.magenta("\n=========================="));
    console.log(chalk.magenta("🔥 DEV MODE STARTING"));
    console.log(chalk.magenta("==========================\n"));

    if (!(await isPortOpen(API_PORT))) {
        api.start();
    } else {
        console.log(chalk.yellow("⚠️ API já está em uso"));
    }

    if (!(await isPortOpen(FRONTEND_PORT))) {
        frontend.start();
    } else {
        console.log(chalk.yellow("⚠️ FRONTEND já está em uso"));
    }

    console.log(chalk.magenta("\n=========================="));
    console.log("✅ SISTEMA ONLINE");
    console.log(`🌐 Frontend: http://localhost:${FRONTEND_PORT}`);
    console.log(`🐍 API: http://localhost:${API_PORT}`);
    console.log("==========================\n");

    // ======================
    // CTRL + C LIMPO
    // ======================
    process.on("SIGINT", () => {
        console.log(chalk.red("\n🛑 Encerrando serviços..."));

        api.stop();
        frontend.stop();

        setTimeout(() => {
            console.log(chalk.red("👋 Finalizado com segurança"));
            process.exit(0);
        }, 1000);
    });
})();