// Librería UNA-LIB con detección flexible de URLs
function validateMessage(jsonMsg) {
    try {
        const msgObj = JSON.parse(jsonMsg);
        
        msgObj.nombre = sanitizeInput(msgObj.nombre || "Anónimo");
        msgObj.mensaje = processMessage(msgObj.mensaje || "");
        msgObj.color = validateColor(msgObj.color || "#000000");
        
        return JSON.stringify(msgObj);
    } catch (error) {
        console.error('Error validating message:', error);
        return JSON.stringify({
            nombre: "Sistema",
            mensaje: "Mensaje inválido",
            color: "#FF0000"
        });
    }
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return "Anónimo";
    
    return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim()
        .substring(0, 50) || "Anónimo";
}

function processMessage(message) {
    if (typeof message !== 'string') return "";
    
    let sanitized = sanitizeInput(message);
    
    // Verificar si es URL válida de imagen o video
    if (isValidMediaURL(sanitized)) {
        return createMediaHTML(sanitized);
    }
    
    return sanitized;
}

function isValidMediaURL(url) {
    // Validar que sea una URL válida
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(url)) return false;
    
    // Extensiones explícitas
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?.*)?$/i;
    const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?.*)?$/i;
    
    // Si tiene extensión clara, es válida
    if (imageExtensions.test(url) || videoExtensions.test(url)) {
        return true;
    }
    
    // NUEVA ESTRATEGIA: Ser más permisivo con dominios conocidos
    const knownMediaDomains = [
        // Wikis y enciclopedias
        /wikia\.nocookie\.net/i,
        /wikitide\.net/i,           // ✅ Para tu caso de wikitide
        /fandom\.com/i,
        /wikipedia\.org/i,
        
        // Redes sociales y comunidades
        /preview\.redd\.it/i,       // ✅ Para Reddit
        /i\.redd\.it/i,
        /v\.redd\.it/i,
        /reddit\.com/i,
        /imgur\.com/i,
        /i\.imgur\.com/i,
        
        // CDNs y hosting de imágenes
        /cdn\./i,
        /static\./i,
        /images\./i,
        /photos\./i,
        /media\./i,
        
        // Servicios de imágenes
        /discordapp\.com/i,
        /discord\.com/i,
        /githubusercontent\.com/i,
        /picsum\.photos/i,
        /unsplash\.com/i,
        /pexels\.com/i,
        /pixabay\.com/i,
        /tenor\.com/i,
        /giphy\.com/i,
        
        // Videos
        /youtube\.com/i,
        /youtu\.be/i,
        /vimeo\.com/i,
        /dailymotion\.com/i,
        /twitch\.tv/i,
        /streamable\.com/i
    ];
    
    // Si es un dominio conocido, intentar mostrar como imagen
    const isKnownDomain = knownMediaDomains.some(pattern => pattern.test(url));
    if (isKnownDomain) {
        return true;
    }
    
    // Patrones en la ruta que sugieren contenido multimedia
    const pathPatterns = [
        /\/images?\//i,
        /\/photos?\//i,
        /\/media\//i,
        /\/gallery\//i,
        /\/uploads?\//i,
        /\/assets?\//i,
        /\/attachments?\//i,
        /\/files?\//i,
        /\/thumb/i,
        /\/preview/i
    ];
    
    return pathPatterns.some(pattern => pattern.test(url));
}

function createMediaHTML(url) {
    // Extensiones explícitas
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?.*)?$/i;
    const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?.*)?$/i;
    
    // Dominios que sabemos que son imágenes
    const definiteImageDomains = [
        /imgur\.com/i,
        /i\.imgur\.com/i,
        /wikia\.nocookie\.net/i,
        /wikitide\.net/i,
        /preview\.redd\.it/i,
        /i\.redd\.it/i,
        /discordapp\.com.*attachments/i,
        /githubusercontent\.com/i,
        /picsum\.photos/i,
        /media\.tenor\.com/i
    ];
    
    // Dominios que sabemos que son videos
    const definiteVideoDomains = [
        /v\.redd\.it/i,
        /streamable\.com/i,
        /gfycat\.com/i
    ];
    
    // YouTube - procesar PRIMERO antes que otros tipos
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            return `<iframe width="300" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="border-radius: 5px;"></iframe>`;
        }
    }
    
    // Determinar tipo de contenido
    const hasImageExtension = imageExtensions.test(url);
    const hasVideoExtension = videoExtensions.test(url);
    const isImageDomain = definiteImageDomains.some(pattern => pattern.test(url));
    const isVideoDomain = definiteVideoDomains.some(pattern => pattern.test(url));
    
    // Crear HTML según el tipo
    if (hasImageExtension || isImageDomain || (!hasVideoExtension && !isVideoDomain)) {
        // Tratarlo como imagen por defecto
        return `<img src="${url}" alt="Imagen compartida" style="max-width: 300px; max-height: 200px; border-radius: 5px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" onerror="this.style.display='none'; this.nextSibling.style.display='inline';" onclick="window.open('${url}', '_blank')" /><span style="display:none; color:#888; font-size: 0.9em;">[Imagen no disponible: <a href="${url}" target="_blank" style="color: #1976d2;">${url.length > 30 ? url.substring(0, 30) + '...' : url}</a>]</span>`;
    }
    
    if (hasVideoExtension || isVideoDomain) {
        return `<video controls style="max-width: 300px; max-height: 200px; border-radius: 5px;" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><source src="${url}" type="video/mp4">Tu navegador no soporta videos.</video><span style="display:none; color:#888;">[Video no disponible: <a href="${url}" target="_blank" style="color: #1976d2;">${url}</a>]</span>`;
    }
    
    // Fallback: enlace con preview
    return `<div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; margin: 5px 0; background: #f9f9f9;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: none; font-weight: 500;">🔗 Ver contenido</a><br><small style="color: #666; word-break: break-all;">${url}</small></div>`;
}

function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function validateColor(color) {
    const colorRegex = /^#[0-9A-F]{6}$/i;
    return colorRegex.test(color) ? color : "#000000";
}

function isScriptInjection(input) {
    const scriptPatterns = [
        /<script[^>]*>/gi,
        /javascript:/gi,
        /on\w+=/gi,
        /<iframe[^>]*>/gi,
        /<object[^>]*>/gi,
        /<embed[^>]*>/gi
    ];
    
    return scriptPatterns.some(pattern => pattern.test(input));
}

// Función para validar números de teléfono
function is_valid_phone(phone) {
    if (typeof phone !== 'string') return false;
    // Formato: 8297-8547 (4 dígitos, guion, 4 dígitos)
    const phoneRegex = /^\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
}

// Función para validar URLs de imágenes
function is_valid_url_image(url) {
    if (typeof url !== 'string') return false;
    
    // Verificar que sea una URL válida
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(url)) return false;
    
    // Verificar extensiones de imagen
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?.*)?$/i;
    return imageExtensions.test(url);
}

// Función para validar URLs de videos de YouTube
function is_valid_yt_video(url) {
    if (typeof url !== 'string') return false;
    
    // Patrones de YouTube
    const youtubePatterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
        /^https?:\/\/youtu\.be\/[\w-]+/i
    ];
    
    return youtubePatterns.some(pattern => pattern.test(url));
}

module.exports = {
    validateMessage,
    sanitizeInput,
    processMessage,
    isValidMediaURL,
    createMediaHTML,
    validateColor,
    isScriptInjection,
    is_valid_phone,
    is_valid_url_image,
    is_valid_yt_video
};