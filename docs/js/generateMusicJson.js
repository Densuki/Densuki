/**
 * ============================================================================
 * generateMusicJson.js
 * ----------------------------------------------------------------------------
 * Gera automaticamente o arquivo docs/data/music.json a partir da lista
 * contida em docs/data/music_list.txt.
 * ============================================================================
 */

"use strict";

/* ============================================================================
 * IMPORTS
 * ========================================================================== */

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const slugify = require("slugify");
const chalk = require("chalk");
const axios = require("axios");

// Tenta importar o ytdl-core
let ytdl;
let ytdlError = false;

try {
    ytdl = require("ytdl-core");
    console.log(chalk.green("[OK]") + " ytdl-core carregado.");
} catch (err) {
    try {
        ytdl = require("@distube/ytdl-core");
        console.log(chalk.yellow("[WARN]") + " Usando @distube/ytdl-core.");
    } catch (err2) {
        console.log(chalk.red("[ERROR]") + " Nenhum pacote ytdl-core encontrado.");
        ytdlError = true;
    }
}

/* ============================================================================
 * CONFIGURAÇÕES
 * ========================================================================== */

const ROOT = path.resolve(__dirname, "..");
const MUSIC_LIST = path.join(ROOT, "data", "music_list.txt");
const MUSIC_JSON = path.join(ROOT, "data", "music.json");
const AUDIO_FOLDER = path.resolve(ROOT, "..", "assets", "audio");

const DEFAULT_VOLUME = 0.35;
const JSON_VERSION = "1.0.0";
const PLATFORM = "YouTube";
const MAX_RETRIES = 0;

const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
};

/* ============================================================================
 * TEMPLATE PADRÃO
 * ========================================================================== */

const DEFAULT_DATABASE = {
    version: JSON_VERSION,
    generatedAt: "",
    total: 0,
    playerlist: []
};

/* ============================================================================
 * LOG
 * ========================================================================== */

function info(message) {
    console.log(chalk.cyan("[INFO]"), message);
}

function success(message) {
    console.log(chalk.green("[OK]"), message);
}

function warn(message) {
    console.log(chalk.yellow("[WARN]"), message);
}

function error(message) {
    console.log(chalk.red("[ERROR]"), message);
}

/* ============================================================================
 * ARQUIVOS
 * ========================================================================== */

async function ensureDatabase() {
    const exists = await fs.pathExists(MUSIC_JSON);
    if (exists) return;
    await fs.writeJson(MUSIC_JSON, DEFAULT_DATABASE, { spaces: 4 });
    success("music.json criado.");
}

async function loadDatabase() {
    await ensureDatabase();
    return await fs.readJson(MUSIC_JSON);
}

async function saveDatabase(database) {
    database.generatedAt = new Date().toISOString();
    database.total = database.playerlist.length;
    await fs.writeJson(MUSIC_JSON, database, { spaces: 4 });
}

/* ============================================================================
 * MUSIC LIST
 * ========================================================================== */

async function loadMusicList() {
    const exists = await fs.pathExists(MUSIC_LIST);
    if (!exists) {
        throw new Error("music_list.txt não encontrado.");
    }

    const content = await fs.readFile(MUSIC_LIST, "utf8");
    
    return content
        .split(/\r?\n/g)
        .map(line => line.trim())
        .filter(line => 
            line.length > 0 && 
            !line.startsWith("#") &&
            (line.startsWith("http://") || line.startsWith("https://"))
        );
}

/* ============================================================================
 * URL
 * ========================================================================== */

function extractVideoId(url) {
    if (!url) return null;
    try {
        if (ytdl && !ytdlError && ytdl.getURLVideoID) {
            return ytdl.getURLVideoID(url);
        }
        const patterns = [
            /(?:v=|youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/,
            /youtube\.com\/embed\/([^?]+)/,
            /youtube\.com\/v\/([^?]+)/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    } catch {
        return null;
    }
}

/* ============================================================================
 * HASH
 * ========================================================================== */

function generateHash(text) {
    if (!text) return crypto.randomBytes(16).toString('hex');
    return crypto
        .createHash("sha1")
        .update(text)
        .digest("hex");
}

/* ============================================================================
 * UUID
 * ========================================================================== */

function generateUUID(title) {
    if (!title) return `music_${Date.now()}`;
    return slugify(title, {
        lower: true,
        strict: true,
        trim: true,
        replacement: "-"
    });
}

/* ============================================================================
 * NOME DO ARQUIVO
 * ========================================================================== */

function generateFileName(title, videoId) {
    if (!title) title = `video_${videoId || Date.now()}`;
    let name = slugify(title, {
        replacement: "_",
        lower: false,
        strict: false,
        trim: true
    });

    name = name
        .replace(/[^\w_]/g, "")
        .replace(/__+/g, "_")
        .replace(/^_+|_+$/g, "");

    if (name.length > 50) {
        name = name.substring(0, 50);
    }

    const suffix = videoId ? videoId.substring(0, 8) : Date.now().toString().substring(0, 8);
    return `${name || 'music'}_${suffix}.mp3`;
}

/* ============================================================================
 * CAPA DO YOUTUBE
 * ========================================================================== */

function getThumbnail(videoId) {
    if (!videoId) return '';
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/* ============================================================================
 * ID
 * ========================================================================== */

function getNextId(database) {
    if (!database.playerlist || database.playerlist.length === 0) {
        return 1;
    }
    const ids = database.playerlist.map(music => music.id || 0);
    return Math.max(...ids) + 1;
}

/* ============================================================================
 * EXTRAIR INFORMAÇÕES DO TÍTULO
 * ========================================================================== */

function extractInfoFromTitle(title) {
    if (!title) {
        return { artist: "Artista desconhecido", title: "Título desconhecido" };
    }

    // Tenta extrair artista e título do formato "Artista - Título"
    const match = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (match) {
        return { artist: match[1].trim(), title: match[2].trim() };
    }
    
    // Tenta extrair do formato "Título | Artista"
    const match2 = title.match(/^(.+?)\s*[|｜]\s*(.+)$/);
    if (match2) {
        return { artist: match2[2].trim(), title: match2[1].trim() };
    }
    
    // Tenta extrair do formato "Artista: Título"
    const match3 = title.match(/^(.+?)\s*[:：]\s*(.+)$/);
    if (match3) {
        return { artist: match3[1].trim(), title: match3[2].trim() };
    }
    
    // Tenta extrair do formato "Título (Artista)"
    const match4 = title.match(/^(.+?)\s*[\(（]\s*(.+?)\s*[\)）]$/);
    if (match4) {
        return { artist: match4[2].trim(), title: match4[1].trim() };
    }
    
    return { artist: "Artista desconhecido", title: title };
}

/* ============================================================================
 * CRIA OBJETO DE MÚSICA COM DADOS MANUAIS
 * ========================================================================== */

function createManualMusicObject(videoId, database, title, artist) {
    // Garante que todos os campos tenham valores válidos
    const safeTitle = title || `Vídeo ${videoId || Date.now()}`;
    const safeArtist = artist || "Artista desconhecido";
    
    const extracted = extractInfoFromTitle(safeTitle);
    const musicTitle = extracted.title || safeTitle;
    const musicArtist = extracted.artist || safeArtist;
    
    const videoIdSafe = videoId || `manual_${Date.now()}`;
    const uuid = generateUUID(musicTitle);
    const fileName = generateFileName(musicTitle, videoIdSafe);
    const url = videoIdSafe.startsWith('http') ? videoIdSafe : `https://www.youtube.com/watch?v=${videoIdSafe}`;
    const hash = generateHash(videoIdSafe + musicTitle);

    return {
        id: getNextId(database),
        uuid: uuid,
        hash: hash,
        videoId: videoIdSafe,
        title: musicTitle,
        artist: musicArtist,
        artists: [musicArtist],
        album: "",
        composer: "",
        arranger: "",
        publisher: "",
        copyright: "",
        releaseDate: new Date().toISOString().split('T')[0],
        duration: 0,
        genre: [],
        language: "pt",
        country: "",
        description: "",
        cover: getThumbnail(videoIdSafe),
        src: "",
        fileName: fileName,
        url: url,
        platform: PLATFORM,
        favorite: false,
        background: false,
        hidden: false,
        downloaded: false,
        localFile: false,
        verified: false,
        loop: true,
        autoplay: false,
        volume: DEFAULT_VOLUME,
        type: "youtube",
        tags: [],
        notes: "Adicionado manualmente (fallback)",
        defaults: {
            favorite: false,
            background: false,
            autoplay: false,
            loop: true,
            volume: DEFAULT_VOLUME
        },
        statistics: {
            views: 0,
            likes: "",
            comments: "",
            favorites: 0,
            played: 0
        },
        metadata: {
            importedAt: new Date().toISOString(),
            source: "Manual",
            generator: "generateMusicJson.js",
            version: JSON_VERSION
        }
    };
}

/* ============================================================================
 * METADADOS DO YOUTUBE - FALLBACK MANUAL SEGURO
 * ========================================================================== */

function createSafeVideoDetails(videoId, title, artist) {
    const safeTitle = title || `Vídeo ${videoId || Date.now()}`;
    const safeArtist = artist || "Artista desconhecido";
    
    return {
        videoId: videoId || `manual_${Date.now()}`,
        title: safeTitle,
        author: { name: safeArtist },
        lengthSeconds: "0",
        publishDate: new Date().toISOString().split('T')[0],
        shortDescription: "",
        viewCount: "0",
        keywords: [],
        description: "",
        thumbnails: [],
        isLiveContent: false,
        isLive: false,
        isPrivate: false,
        isUnlisted: false,
        isFamilySafe: true,
        isYoutubeKids: false,
        isOwnerViewing: false,
        // Garante que todos os campos estejam definidos
        player_response: {},
        streamingData: {},
        microformat: {},
        videoDetails: null
    };
}

/* ============================================================================
 * METADADOS DO YOUTUBE - VIA YTDL
 * ========================================================================== */

async function fetchVideoInfoYTDL(url) {
    if (!ytdl || ytdlError) {
        throw new Error("ytdl-core não disponível");
    }

    try {
        const options = {
            requestOptions: { headers: REQUEST_HEADERS }
        };
        const info = await ytdl.getInfo(url, options);
        
        if (info && info.videoDetails) {
            const details = info.videoDetails;
            return {
                videoId: details.videoId || extractVideoId(url) || 'unknown',
                title: details.title || 'Título desconhecido',
                author: { name: details.author?.name || 'Artista desconhecido' },
                lengthSeconds: details.lengthSeconds || '0',
                publishDate: details.publishDate || new Date().toISOString().split('T')[0],
                shortDescription: details.shortDescription || '',
                viewCount: details.viewCount || '0',
                keywords: details.keywords || [],
                description: details.description || '',
                thumbnails: details.thumbnails || [],
                isLiveContent: details.isLiveContent || false,
                isLive: details.isLive || false,
                isPrivate: details.isPrivate || false,
                isUnlisted: details.isUnlisted || false,
                isFamilySafe: details.isFamilySafe || true,
                isYoutubeKids: details.isYoutubeKids || false,
                isOwnerViewing: details.isOwnerViewing || false,
                videoDetails: details
            };
        }
        throw new Error("Dados inválidos do YouTube");
    } catch (err) {
        if (err.statusCode === 410 || err.message?.includes('410')) {
            throw new Error("Vídeo removido ou indisponível (410)");
        }
        throw err;
    }
}

/* ============================================================================
 * METADADOS DO YOUTUBE - PRINCIPAL
 * ========================================================================== */

async function fetchVideoInfo(url) {
    const videoId = extractVideoId(url);
    if (!videoId) {
        throw new Error("Não foi possível extrair o videoId");
    }

    // Tenta com ytdl primeiro
    if (ytdl && !ytdlError) {
        try {
            return await fetchVideoInfoYTDL(url);
        } catch (err) {
            const errorMsg = err.message || '';
            
            if (errorMsg.includes('410') || errorMsg.includes('removido') || errorMsg.includes('indisponível')) {
                warn(`Vídeo ${videoId} está indisponível. Usando dados manuais.`);
                return createSafeVideoDetails(videoId);
            }
            
            if (errorMsg.includes('bot') || 
                errorMsg.includes('Sign in') || 
                errorMsg.includes('parse') || 
                errorMsg.includes('watch.html') ||
                errorMsg.includes('Status code')) {
                
                warn(`Erro ao buscar metadados, usando dados manuais.`);
                return createSafeVideoDetails(videoId);
            }
        }
    }

    // Fallback: dados manuais seguros
    return createSafeVideoDetails(videoId);
}

/* ============================================================================
 * DUPLICIDADE
 * ========================================================================== */

function alreadyExists(database, music) {
    if (!database.playerlist || database.playerlist.length === 0) return false;
    return database.playerlist.some(item => 
        (item.url && item.url === music.url) ||
        (item.videoId && item.videoId === music.videoId) ||
        (item.hash && item.hash === music.hash)
    );
}

/* ============================================================================
 * CAMPOS PADRÃO
 * ========================================================================== */

function createMusicObject(videoDetails, database) {
    // Garante que videoDetails existe
    if (!videoDetails || typeof videoDetails !== 'object') {
        const videoId = videoDetails?.videoId || `manual_${Date.now()}`;
        return createManualMusicObject(videoId, database, null, null);
    }

    const videoId = videoDetails.videoId || `manual_${Date.now()}`;
    let title = videoDetails.title || "Título desconhecido";
    let artist = videoDetails.author?.name || "Artista desconhecido";
    
    const extracted = extractInfoFromTitle(title);
    if (extracted.artist !== "Artista desconhecido" && !artist.includes(extracted.artist)) {
        artist = extracted.artist;
    }
    title = extracted.title;

    const duration = Number(videoDetails.lengthSeconds || 0);
    const uploadDate = videoDetails.publishDate || new Date().toISOString().split('T')[0];
    const uuid = generateUUID(title);
    const fileName = generateFileName(title, videoId);
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const hash = generateHash(videoId + title);

    const tags = videoDetails.keywords || [];

    return {
        id: getNextId(database),
        uuid: uuid,
        hash: hash,
        videoId: videoId,
        title: title,
        artist: artist,
        artists: [artist],
        album: "",
        composer: "",
        arranger: "",
        publisher: "",
        copyright: "",
        releaseDate: uploadDate,
        duration: duration,
        genre: [],
        language: "pt",
        country: "",
        description: videoDetails.shortDescription || videoDetails.description || "",
        cover: getThumbnail(videoId),
        src: "",
        fileName: fileName,
        url: url,
        platform: PLATFORM,
        favorite: false,
        background: false,
        hidden: false,
        downloaded: false,
        localFile: false,
        verified: false,
        loop: true,
        autoplay: false,
        volume: DEFAULT_VOLUME,
        type: "youtube",
        tags: tags.slice(0, 10),
        notes: "",
        defaults: {
            favorite: false,
            background: false,
            autoplay: false,
            loop: true,
            volume: DEFAULT_VOLUME
        },
        statistics: {
            views: Number(videoDetails.viewCount || 0),
            likes: "",
            comments: "",
            favorites: 0,
            played: 0
        },
        metadata: {
            importedAt: new Date().toISOString(),
            source: "YouTube",
            generator: "generateMusicJson.js",
            version: JSON_VERSION
        }
    };
}

/* ============================================================================
 * IMPORTAÇÃO - VERSÃO SEGURA
 * ========================================================================== */

async function importMusic(url, database) {
    try {
        info(`Processando:`);
        console.log(chalk.gray(`  ${url}`));

        const video = await fetchVideoInfo(url);
        
        // Garante que video é um objeto válido
        if (!video || typeof video !== 'object') {
            const videoId = extractVideoId(url) || `manual_${Date.now()}`;
            const manualMusic = createManualMusicObject(videoId, database, null, null);
            if (!alreadyExists(database, manualMusic)) {
                database.playerlist.push(manualMusic);
                success(`"${manualMusic.title}" adicionada (fallback).`);
                return true;
            }
            return false;
        }

        const music = createMusicObject(video, database);

        if (alreadyExists(database, music)) {
            warn(`"${music.title}" já existe na base.`);
            return false;
        }

        database.playerlist.push(music);
        success(`"${music.title}" adicionada.`);
        return true;
    } catch (err) {
        error(`Falha ao importar:\n  ${url}`);
        console.error(chalk.red(`  ${err.message}`));
        
        // Fallback manual
        try {
            const videoId = extractVideoId(url) || `manual_${Date.now()}`;
            const manualMusic = createManualMusicObject(videoId, database, null, null);
            if (!alreadyExists(database, manualMusic)) {
                database.playerlist.push(manualMusic);
                success(`"${manualMusic.title}" adicionada como fallback.`);
                return true;
            }
        } catch (fallbackErr) {
            error(`Fallback também falhou para ${url}`);
        }
        return false;
    }
}

/* ============================================================================
 * ATUALIZAÇÃO DO BANCO
 * ========================================================================== */

async function processMusicList(database, musicList) {
    let imported = 0;
    let ignored = 0;

    for (const url of musicList) {
        const successImport = await importMusic(url, database);
        if (successImport) {
            imported++;
        } else {
            ignored++;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { imported, ignored };
}

/* ============================================================================
 * ORDENAÇÃO
 * ========================================================================== */

function sortDatabase(database) {
    if (!database.playerlist || database.playerlist.length === 0) return;
    database.playerlist.sort((a, b) => {
        const artistA = a.artist || '';
        const artistB = b.artist || '';
        if (artistA !== artistB) {
            return artistA.localeCompare(artistB);
        }
        return (a.title || '').localeCompare(b.title || '');
    });
}

/* ============================================================================
 * REINDEXAÇÃO
 * ========================================================================== */

function rebuildIds(database) {
    if (!database.playerlist) return;
    database.playerlist.forEach((music, index) => {
        music.id = index + 1;
    });
}

/* ============================================================================
 * REMOVER DUPLICATAS
 * ========================================================================== */

function removeDuplicates(database) {
    if (!database.playerlist || database.playerlist.length === 0) return;
    
    const unique = [];
    const hashes = new Set();

    for (const music of database.playerlist) {
        if (music.hash && hashes.has(music.hash)) {
            warn(`Duplicado removido: ${music.title}`);
            continue;
        }
        if (music.hash) {
            hashes.add(music.hash);
        }
        unique.push(music);
    }

    database.playerlist = unique;
}

/* ============================================================================
 * VALIDAÇÃO
 * ========================================================================== */

function validateDatabase(database) {
    if (!database.playerlist || database.playerlist.length === 0) {
        warn("Banco de dados vazio.");
        return;
    }

    let hasErrors = false;
    database.playerlist.forEach((music, index) => {
        if (!music.title) {
            warn(`Música #${index + 1} sem título.`);
            hasErrors = true;
        }
        if (!music.artist) {
            warn(`"${music.title || 'Untitled'}" sem artista.`);
            hasErrors = true;
        }
        if (!music.videoId) {
            warn(`"${music.title || 'Untitled'}" sem videoId.`);
            hasErrors = true;
        }
    });

    if (!hasErrors) {
        success("Validação concluída sem erros.");
    }
}

/* ============================================================================
 * ESTATÍSTICAS
 * ========================================================================== */

function showStatistics(database, result) {
    console.log();
    console.log(chalk.cyan("==================================="));
    console.log(chalk.cyan("      MUSIC DATABASE UPDATED"));
    console.log(chalk.cyan("==================================="));
    console.log();
    console.log(chalk.green("  Novas músicas:"), result.imported);
    console.log(chalk.yellow("  Ignoradas:"), result.ignored);
    console.log(chalk.white("  Total:"), database.playerlist?.length || 0);
    console.log();
}

/* ============================================================================
 * BACKUP
 * ========================================================================== */

async function backupDatabase() {
    if (!await fs.pathExists(MUSIC_JSON)) return;
    const backupFolder = path.join(ROOT, "backup");
    await fs.ensureDir(backupFolder);
    const fileName = `music_${Date.now()}.json`;
    await fs.copy(MUSIC_JSON, path.join(backupFolder, fileName));
    info("Backup criado.");
}

/* ============================================================================
 * LIMPEZA
 * ========================================================================== */

async function clearDatabase() {
    await fs.writeJson(MUSIC_JSON, DEFAULT_DATABASE, { spaces: 4 });
    success("Banco limpo.");
}

/* ============================================================================
 * ARGUMENTOS
 * ========================================================================== */

const args = process.argv.slice(2);

const OPTIONS = {
    clear: args.includes("--clear"),
    backup: args.includes("--backup"),
    validate: args.includes("--validate"),
    stats: args.includes("--stats"),
    manual: args.includes("--manual"),
    fix: args.includes("--fix")
};

/* ============================================================================
 * MAIN
 * ========================================================================== */

async function main() {
    console.clear();
    console.log();
    console.log(chalk.magenta("==============================================="));
    console.log(chalk.magenta("         DENSUKI MUSIC DATABASE GENERATOR"));
    console.log(chalk.magenta("==============================================="));
    console.log();

    if (OPTIONS.clear) {
        await clearDatabase();
        return;
    }

    if (OPTIONS.backup) {
        await backupDatabase();
    }

    const database = await loadDatabase();
    const musicList = await loadMusicList();

    info(`${musicList.length} músicas encontradas.`);
    console.log();

    if (OPTIONS.manual || OPTIONS.fix) {
        info("Modo manual: adicionando músicas com dados básicos...");
        let added = 0;
        for (const url of musicList) {
            const videoId = extractVideoId(url);
            const manualMusic = createManualMusicObject(videoId || `manual_${Date.now()}`, database, null, null);
            if (!alreadyExists(database, manualMusic)) {
                database.playerlist.push(manualMusic);
                added++;
                success(`"${manualMusic.title}" adicionada manualmente.`);
            } else {
                warn(`"${manualMusic.title}" já existe.`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (added > 0) {
            removeDuplicates(database);
            rebuildIds(database);
            sortDatabase(database);
            await saveDatabase(database);
        }
        
        success(`${added} músicas adicionadas manualmente.`);
    } else {
        const result = await processMusicList(database, musicList);

        if (result.imported > 0) {
            removeDuplicates(database);
            rebuildIds(database);
            sortDatabase(database);
        }

        if (OPTIONS.validate) {
            console.log();
            info("Validando banco...");
            validateDatabase(database);
        }

        await saveDatabase(database);

        if (OPTIONS.stats || true) {
            showStatistics(database, result);
        }
    }

    success("music.json atualizado com sucesso.");
}

/* ============================================================================
 * EXECUÇÃO
 * ========================================================================== */

if (require.main === module) {
    main()
        .then(() => {
            console.log();
            console.log(chalk.green("Processo finalizado."));
            process.exit(0);
        })
        .catch(err => {
            console.log();
            console.log(chalk.red("Erro inesperado."));
            console.error(err);
            process.exit(1);
        });
}

/* ============================================================================
 * EXPORTS
 * ========================================================================== */

module.exports = {
    loadMusicList,
    loadDatabase,
    saveDatabase,
    backupDatabase,
    clearDatabase,
    fetchVideoInfo,
    fetchVideoInfoYTDL,
    createMusicObject,
    createManualMusicObject,
    createSafeVideoDetails,
    importMusic,
    processMusicList,
    removeDuplicates,
    rebuildIds,
    sortDatabase,
    validateDatabase,
    generateUUID,
    generateHash,
    generateFileName,
    extractVideoId,
    getThumbnail,
    getNextId,
    extractInfoFromTitle,
    DEFAULT_DATABASE,
    DEFAULT_VOLUME,
    JSON_VERSION,
    PLATFORM,
    REQUEST_HEADERS
};