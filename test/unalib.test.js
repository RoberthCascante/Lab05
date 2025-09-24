// Librería UNA-LIB con mejor manejo de URLs problemáticas
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
    
    // Dominios conocidos
    const knownMediaDomains = [
        /wikia\.nocookie\.net/i,
        /wikitide\.net/i,
        /fandom\.com/i,
        /wikipedia\.org/i,
        /preview\.redd\.it/i,
        /i\.redd\.it/i,
        /v\.redd\.it/i,
        /reddit\.com/i,
        /imgur\.com/i,
        /i\.imgur\.com/i,
        /cdn\./i,
        /static\./i,
        /images\./i,
        /photos\./i,
        /media\./i,
        /discordapp\.com/i,
        /discord\.com/i,
        /githubusercontent\.com/i,
        /picsum\.photos/i,
        /unsplash\.com/i,
        /pexels\.com/i,
        /pixabay\.com/i,
        /tenor\.com/i,
        /giphy\.com/i,
        /youtube\.com/i,
        /youtu\.be/i,
        /vimeo\.com/i,
        /dailymotion\.com/i,
        /twitch\.tv/i,
        /streamable\.com/i
    ];
    
    const isKnownDomain = knownMediaDomains.some(pattern => pattern.test(url));
    if (isKnownDomain) {
        return true;
    }
    
    // Patrones en la ruta
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
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?.*)?$/i;
    const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v)(\?.*)?$/i;
    
    // URLs problemáticas que mejor mostrar como enlaces
    const problematicDomains = [
        /preview\.redd\.it/i,
        /v\.redd\.it/i
    ];
    
    // Si es un dominio problemático, mostrar como enlace directamente
    if (problematicDomains.some(pattern => pattern.test(url))) {
        return createLinkPreview(url);
    }
    
    // Dominios confiables para imágenes
    const reliableImageDomains = [
        /i\.imgur\.com/i,
        /imgur\.com/i,
        /wikia\.nocookie\.net/i,
        /wikitide\.net/i,
        /discordapp\.com.*attachments/i,
        /githubusercontent\.com/i,
        /picsum\.photos/i,
        /media\.tenor\.com/i,
        /i\.redd\.it/i  // Solo i.redd.it, no preview.redd.it
    ];
    
    const reliableVideoDomains = [
        /streamable\.com/i,
        /gfycat\.com/i
    ];
    
    // Determinar tipo de contenido
    const hasImageExtension = imageExtensions.test(url);
    const hasVideoExtension = videoExtensions.test(url);
    const isReliableImageDomain = reliableImageDomains.some(pattern => pattern.test(url));
    const isReliableVideoDomain = reliableVideoDomains.some(pattern => pattern.test(url));
    
    // YouTube manejo especial
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            return `<iframe width="300" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="border-radius: 5px;"></iframe>`;
        }
    }
    
    // Crear HTML según el tipo
    if (hasImageExtension || isReliableImageDomain) {
        return `<img src="${url}" alt="Imagen compartida" style="max-width: 300px; max-height: 200px; border-radius: 5px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" onerror="this.parentNode.innerHTML = '${createLinkPreview(url).replace(/'/g, "&apos;")}';" onclick="window.open('${url}', '_blank')" />`;
    }
    
    if (hasVideoExtension || isReliableVideoDomain) {
        return `<video controls style="max-width: 300px; max-height: 200px; border-radius: 5px;" onerror="this.parentNode.innerHTML = '${createLinkPreview(url).replace(/'/g, "&apos;")}';" ><source src="${url}" type="video/mp4">Tu navegador no soporta videos.</video>`;
    }
    
    // Fallback: enlace con preview
    return createLinkPreview(url);
}

function createLinkPreview(url) {
    // Detectar tipo de contenido por la URL
    let icon = "🔗";
    let description = "Ver contenido";
    
    if (url.includes('reddit.com') || url.includes('redd.it')) {
        icon = "📱";
        description = "Ver en Reddit";
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        icon = "📺";
        description = "Ver video en YouTube";
    } else if (url.includes('imgur.com')) {
        icon = "🖼️";
        description = "Ver imagen en Imgur";
    } else if (url.includes('discord')) {
        icon = "💬";
        description = "Ver en Discord";
    }
    
    // Acortar URL para mostrar
    const shortUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
    
    return `<div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin: 5px 0; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); cursor: pointer;" onclick="window.open('${url}', '_blank')">
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2em;">${icon}</span>
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #1976d2; margin-bottom: 2px;">${description}</div>
                <div style="font-size: 0.85em; color: #666; word-break: break-all;">${shortUrl}</div>
            </div>
        </div>
    </div>`;
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

module.exports = {
    validateMessage,
    sanitizeInput,
    processMessage,
    isValidMediaURL,
    createMediaHTML,
    validateColor,
    isScriptInjection
};