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

/* ============================================================================
 * CONFIGURAÇÕES
 * ========================================================================== */

const ROOT = path.resolve(__dirname, ".."); // docs/
const MUSIC_LIST = path.join(ROOT, "data", "music_list.txt");
const MUSIC_JSON = path.join(ROOT, "data", "music.json");
const ASSETS_MUSIC_JSON = path.resolve(ROOT, "..", "assets", "music.json");

const DEFAULT_VOLUME = 0.35;
const JSON_VERSION = "1.0.0";
const PLATFORM = "YouTube";

const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
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
 * URL
 * ========================================================================== */

function extractVideoId(url) {
    if (!url) return null;
    try {
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

function getNextId(playerlist) {
    if (!playerlist || playerlist.length === 0) {
        return 1;
    }
    const ids = playerlist.map(music => music.id || 0);
    return Math.max(...ids) + 1;
}

/* ============================================================================
 * BUSCAR TÍTULO DO YOUTUBE VIA OEMBED
 * ========================================================================== */

async function fetchYouTubeInfo(videoId) {
    try {
        const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await axios.get(url, {
            headers: REQUEST_HEADERS,
            timeout: 10000
        });
        
        if (response.data) {
            return {
                title: response.data.title || null,
                author: response.data.author_name || null,
                thumbnail: response.data.thumbnail_url || null
            };
        }
    } catch (err) {
        // Silencia erro
    }
    return null;
}

/* ============================================================================
 * EXTRAIR INFORMAÇÕES DO TÍTULO
 * ========================================================================== */

function extractInfoFromTitle(title) {
    if (!title) {
        return { artist: "Artista desconhecido", title: "Título desconhecido" };
    }

    // Remove sufixos comuns
    let cleanTitle = title
        .replace(/\s*[|｜]\s*(?:Official|Official Music Video|MV|Audio|Lyrics|HD|HQ|4K|1080p|720p|60fps|Cover|Remix|Extended|Short|Edit|Version|v2|Original|OST|Soundtrack|Theme|Opening|Ending|OP|ED|Full|Complete|Album|Track|Song|Music|Video|Clip|Trailer|Teaser|Promo|Live|Performance|Concert|Acoustic|Instrumental|Piano|Guitar|Violin|Flute|Orchestra|Symphony|Band|DJ|Mix|Mashup|Medley|Tribute|Reaction|Review|Tutorial|Lesson|Guide|How To|Tips|Tricks|Walkthrough|Gameplay|Playthrough|Let's Play|LP|Stream|VOD|Highlight|Moment|Best|Worst|Funny|Cringe|Epic|Fail|Win|Victory|Defeat|Solo|Duo|Squad|Team|Ranked|Competitive|Casual|Challenge|Speedrun|No Hit|No Damage|Deathless|Permadeath|Hardcore|Expert|Master|Legendary|Mythic|Rare|Epic|Legendary|Unique|Exclusive|Limited|Event|Season|Chapter|Part|Act|Scene|Level|Stage|Phase|Round|Wave|Battle|Fight|Duel|Match|Tournament|Championship|Cup|League|Cup|Trophy|Medal|Award|Prize|Giveaway|Contest|Sweepstakes|Raffle|Lottery|Gacha|Loot|Chest|Box|Pack|Bundle|Set|Collection|Compilation|Anthology|Omnibus|Complete|Box Set|Limited Edition|Collector's Edition|Deluxe|Premium|Gold|Platinum|Diamond|Black|White|Red|Blue|Green|Yellow|Purple|Pink|Orange|Brown|Gray|Silver|Gold|Bronze|Crystal|Emerald|Sapphire|Ruby|Amber|Jade|Onyx|Pearl|Quartz|Topaz|Amethyst|Garnet|Citrine|Tourmaline|Spinel|Zircon|Turquoise|Lapis|Azurite|Malachite|Rhodochrosite|Rhodonite|Serpentine|Sodalite|Tanzanite|Uvarovite|Variscite|Vesuvianite|Wardite|Xenotime|Yttrium|Zincite|Zoisite|Zoomorphic|Zygomorphic|Zen|Yoga|Tao|Chi|Qi|Prana|Prana|Chakra|Aura|Karma|Dharma|Sutra|Mantra|Tantra|Yantra|Mandala|Zen|Tao|Chi|Qi|Prana|Chakra|Aura|Karma|Dharma|Sutra|Mantra|Tantra|Yantra|Mandala)\s*/gi, '')
        .replace(/\s*[\[\(\{][^\]\)\}]*[\]\)\}]\s*/g, '')
        .replace(/\s*-\s*Topic\s*/gi, '')
        .trim();

    // Tenta extrair artista e título
    const match = cleanTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (match) {
        return { artist: match[1].trim(), title: match[2].trim() };
    }
    
    const match2 = cleanTitle.match(/^(.+?)\s*[|｜]\s*(.+)$/);
    if (match2) {
        return { artist: match2[2].trim(), title: match2[1].trim() };
    }
    
    const match3 = cleanTitle.match(/^(.+?)\s*[:：]\s*(.+)$/);
    if (match3) {
        return { artist: match3[1].trim(), title: match3[2].trim() };
    }
    
    const match4 = cleanTitle.match(/^(.+?)\s*[\(（]\s*(.+?)\s*[\)）]$/);
    if (match4) {
        return { artist: match4[2].trim(), title: match4[1].trim() };
    }
    
    return { artist: "Artista desconhecido", title: cleanTitle };
}

/* ============================================================================
 * CRIA OBJETO DE MÚSICA
 * ========================================================================== */

function createMusicObject(videoId, playerlist, title, artist) {
    const safeTitle = title || `Vídeo ${videoId || Date.now()}`;
    const safeArtist = artist || "Artista desconhecido";
    
    const extracted = extractInfoFromTitle(safeTitle);
    const musicTitle = extracted.title || safeTitle;
    const musicArtist = extracted.artist || safeArtist;
    
    const videoIdSafe = videoId || `manual_${Date.now()}`;
    const uuid = generateUUID(musicTitle);
    const fileName = generateFileName(musicTitle, videoIdSafe);
    const url = `https://www.youtube.com/watch?v=${videoIdSafe}`;
    const hash = generateHash(videoIdSafe + musicTitle);

    return {
        id: getNextId(playerlist),
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
        src: `assets/audio/${fileName}`,
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
        notes: "Adicionado manualmente",
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
 * MAIN
 * ========================================================================== */

async function main() {
    console.clear();
    console.log();
    console.log(chalk.magenta("==============================================="));
    console.log(chalk.magenta("         DENSUKI MUSIC DATABASE GENERATOR"));
    console.log(chalk.magenta("==============================================="));
    console.log();

    // 1. Lê a lista de músicas
    info("Lendo lista de músicas...");
    const musicList = await loadMusicList();
    info(`${musicList.length} URLs encontradas.`);
    console.log();

    // 2. Carrega o banco existente ou cria um novo
    info("Carregando banco de dados...");
    let database = null;
    let targetPath = MUSIC_JSON;

    // Tenta ler o arquivo existente
    try {
        if (await fs.pathExists(MUSIC_JSON)) {
            const content = await fs.readFile(MUSIC_JSON, 'utf8');
            if (content && content.trim().length > 0) {
                database = JSON.parse(content);
                info(`Arquivo existente carregado: ${path.relative(process.cwd(), MUSIC_JSON)}`);
            } else {
                warn("Arquivo vazio, criando novo...");
            }
        }
    } catch (err) {
        warn(`Erro ao ler arquivo: ${err.message}`);
    }

    // Se não conseguiu carregar, cria um novo
    if (!database || !database.playerlist) {
        database = { ...DEFAULT_DATABASE };
        database.playerlist = [];
        info("Novo banco de dados criado.");
    }

    // 3. Processa cada URL
    info(`Processando ${musicList.length} URLs...`);
    console.log();

    let added = 0;
    let skipped = 0;

    for (const url of musicList) {
        const videoId = extractVideoId(url);
        if (!videoId) {
            warn(`Não foi possível extrair ID de: ${url}`);
            skipped++;
            continue;
        }

        // Verifica se já existe
        const exists = database.playerlist.some(m => m.videoId === videoId || m.url === url);
        if (exists) {
            warn(`"${videoId}" já existe.`);
            skipped++;
            continue;
        }

        // Tenta buscar informações do YouTube
        let title = null;
        let artist = null;
        
        try {
            const info = await fetchYouTubeInfo(videoId);
            if (info) {
                title = info.title;
                artist = info.author;
                if (title) {
                    success(`Título encontrado: "${title}"`);
                }
            }
        } catch (err) {
            // Ignora
        }

        // Se não conseguiu buscar, usa o videoId como título
        if (!title) {
            title = `Vídeo ${videoId}`;
        }

        const music = createMusicObject(videoId, database.playerlist, title, artist);
        database.playerlist.push(music);
        added++;
        success(`"${music.title}" adicionada (ID: ${music.id})`);
        
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log();

    // 4. Salva o banco de dados
    if (added > 0) {
        info(`Salvando ${added} novas músicas...`);
        
        // Atualiza metadados
        database.generatedAt = new Date().toISOString();
        database.total = database.playerlist.length;
        
        // Ordena
        database.playerlist.sort((a, b) => {
            const artistA = a.artist || '';
            const artistB = b.artist || '';
            if (artistA !== artistB) {
                return artistA.localeCompare(artistB);
            }
            return (a.title || '').localeCompare(b.title || '');
        });

        // Reindexa
        database.playerlist.forEach((music, index) => {
            music.id = index + 1;
        });

        // Salva em docs/data/music.json
        await fs.ensureDir(path.dirname(MUSIC_JSON));
        await fs.writeJson(MUSIC_JSON, database, { spaces: 4 });
        success(`Salvo em ${path.relative(process.cwd(), MUSIC_JSON)}`);
        
        // Salva em assets/music.json
        await fs.ensureDir(path.dirname(ASSETS_MUSIC_JSON));
        await fs.writeJson(ASSETS_MUSIC_JSON, database, { spaces: 4 });
        success(`Salvo em ${path.relative(process.cwd(), ASSETS_MUSIC_JSON)}`);
        
        success(`Total: ${database.playerlist.length} músicas`);
    } else {
        info("Nenhuma música nova para adicionar.");
    }

    // 5. Estatísticas
    console.log();
    console.log(chalk.cyan("==================================="));
    console.log(chalk.cyan("      MUSIC DATABASE UPDATED"));
    console.log(chalk.cyan("==================================="));
    console.log();
    console.log(chalk.green("  Novas músicas:"), added);
    console.log(chalk.yellow("  Ignoradas:"), skipped);
    console.log(chalk.white("  Total:"), database.playerlist?.length || 0);
    console.log();

    success("Processo finalizado!");
}

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
 * EXECUÇÃO
 * ========================================================================== */

if (require.main === module) {
    main()
        .then(() => {
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
    extractVideoId,
    fetchYouTubeInfo,
    createMusicObject,
    extractInfoFromTitle,
    generateUUID,
    generateHash,
    generateFileName,
    getThumbnail,
    getNextId,
    DEFAULT_DATABASE
};