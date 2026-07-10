const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const chalk = require('chalk');

const ROOT_DIR = __dirname;
const API_DIR = path.join(ROOT_DIR, 'backend', 'api');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const PYTHON = process.env.PYTHON || process.env.PYTHON_BIN || 'python3';

const CONFIG = {
  apiPort: Number(process.env.API_PORT || process.env.PORT || 5000),
  frontendPort: Number(process.env.FRONTEND_PORT || 5500),
  host: process.env.DEV_HOST || '127.0.0.1',
  restart: process.env.DEV_RESTART !== 'false',
};

const COMMANDS = {
  dev: 'Sobe API + frontend estático com reinício automático.',
  api: 'Sobe somente backend/api/app.py.',
  frontend: 'Sobe somente docs/ via python -m http.server.',
  keepalive: 'Executa backend/api/keep_alive.py em modo experimental/contínuo.',
  test: 'Roda verificações Python e JavaScript do repositório.',
  help: 'Mostra esta ajuda.',
};

function log(label, message, color = 'cyan') {
  console.log(chalk[color](`[${label}]`), message);
}

function isPortOpen(port, host = CONFIG.host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(700);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
    socket.connect(port, host);
  });
}

class Service {
  constructor({ name, command, args, cwd = ROOT_DIR, color = 'cyan', restart = CONFIG.restart, env = {} }) {
    this.name = name;
    this.command = command;
    this.args = args;
    this.cwd = cwd;
    this.color = color;
    this.restart = restart;
    this.env = env;
    this.process = null;
    this.stopping = false;
  }

  start() {
    log(this.name, `${this.command} ${this.args.join(' ')}`, this.color);
    this.process = spawn(this.command, this.args, {
      cwd: this.cwd,
      stdio: 'pipe',
      env: { ...process.env, ...this.env },
    });

    this.process.stdout.on('data', (data) => process.stdout.write(chalk[this.color](`[${this.name}] `) + data));
    this.process.stderr.on('data', (data) => process.stderr.write(chalk.red(`[${this.name} ERROR] `) + data));
    this.process.on('close', (code) => {
      log(this.name, `Encerrado com código ${code}`, this.color);
      if (this.restart && !this.stopping) {
        log(this.name, 'Reiniciando em 2s...', this.color);
        setTimeout(() => this.start(), 2000);
      }
    });
    this.process.on('error', (error) => log(this.name, `Falha ao iniciar: ${error.message}`, 'red'));
  }

  stop() {
    this.stopping = true;
    if (this.process && !this.process.killed) this.process.kill();
  }
}

function createApiService() {
  return new Service({
    name: 'API',
    command: PYTHON,
    args: ['app.py'],
    cwd: API_DIR,
    color: 'green',
    env: { PORT: String(CONFIG.apiPort), PYTHONDONTWRITEBYTECODE: '1' },
  });
}

function createFrontendService() {
  return new Service({
    name: 'FRONTEND',
    command: PYTHON,
    args: ['-m', 'http.server', String(CONFIG.frontendPort), '--bind', CONFIG.host, '--directory', DOCS_DIR],
    cwd: ROOT_DIR,
    color: 'blue',
    env: { PYTHONDONTWRITEBYTECODE: '1' },
  });
}

function createKeepAliveService() {
  return new Service({
    name: 'KEEP_ALIVE',
    command: PYTHON,
    args: ['keep_alive.py'],
    cwd: API_DIR,
    color: 'yellow',
    restart: true,
    env: { PYTHONDONTWRITEBYTECODE: '1' },
  });
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false, ...options });
    child.on('close', (code) => resolve(code));
    child.on('error', () => resolve(1));
  });
}

async function runTests() {
  const checks = [
    {
      label: 'Python syntax',
      command: PYTHON,
      args: ['-m', 'py_compile',
        'backend/api/app.py', 'backend/api/auth.py', 'backend/api/config.py', 'backend/api/keep_alive.py',
        'backend/api/models.py', 'backend/api/services.py',
        'backend/api/routes/about_routes.py', 'backend/api/routes/auth_routes.py', 'backend/api/routes/curriculum_routes.py',
        'backend/api/routes/debug_routes.py', 'backend/api/routes/download_routes.py', 'backend/api/routes/profile_routes.py',
        'backend/api/utils/docx_utils.py', 'backend/api/utils/json_utils.py'],
      options: { cwd: ROOT_DIR, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } },
    },
    {
      label: 'JavaScript syntax',
      command: process.execPath,
      args: ['scripts/check-js-modules.js'],
      options: { cwd: ROOT_DIR },
    },
  ];

  for (const check of checks) {
    log('TEST', check.label, 'magenta');
    const code = await runCommand(check.command, check.args, check.options);
    if (code !== 0) {
      log('TEST', `${check.label} falhou (${code})`, 'red');
      process.exit(code);
    }
  }
  log('TEST', 'Todas as verificações passaram.', 'green');
}

async function startServices(services) {
  for (const service of services) {
    const port = service.name === 'API' ? CONFIG.apiPort : service.name === 'FRONTEND' ? CONFIG.frontendPort : null;
    if (port && await isPortOpen(port)) {
      log(service.name, `Porta ${port} já está em uso; não iniciei outro processo.`, 'yellow');
      continue;
    }
    service.start();
  }

  process.on('SIGINT', () => {
    log('DEV', 'Encerrando serviços...', 'red');
    services.forEach((service) => service.stop());
    setTimeout(() => process.exit(0), 600);
  });
}

function printHelp() {
  console.log(chalk.magenta('\nDensuki start.js\n'));
  Object.entries(COMMANDS).forEach(([command, description]) => console.log(`  ${chalk.cyan(command.padEnd(10))} ${description}`));
  console.log('\nVariáveis úteis: PYTHON, API_PORT/PORT, FRONTEND_PORT, DEV_HOST, DEV_RESTART=false\n');
}

async function main() {
  const mode = process.argv[2] || 'dev';
  if (mode === 'help' || mode === '--help' || mode === '-h') return printHelp();
  if (mode === 'test') return runTests();
  if (mode === 'api') return startServices([createApiService()]);
  if (mode === 'frontend') return startServices([createFrontendService()]);
  if (mode === 'keepalive') return startServices([createKeepAliveService()]);
  if (mode === 'dev') return startServices([createApiService(), createFrontendService()]);

  log('DEV', `Comando desconhecido: ${mode}`, 'red');
  printHelp();
  process.exit(1);
}

main();
