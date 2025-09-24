const unalib = require('../libs/unalib');

describe('UNA-LIB Validacion de Mensajes', () => {
    
    describe('Prevencion de XSS', () => {
        test('Debe bloquear script basico', () => {
            const maliciousInput = JSON.stringify({
                nombre: "Hacker",
                mensaje: "<script>alert('XSS')</script>",
                color: "#FF0000"
            });
            
            const result = JSON.parse(unalib.validateMessage(maliciousInput));
            expect(result.mensaje).not.toContain('<script>');
            expect(result.mensaje).not.toContain('alert');
        });
        
        test('Debe bloquear JavaScript en URLs', () => {
            const maliciousInput = JSON.stringify({
                nombre: "Hacker",
                mensaje: "javascript:alert('XSS')",
                color: "#FF0000"
            });
            
            const result = JSON.parse(unalib.validateMessage(maliciousInput));
            expect(result.mensaje).not.toContain('javascript:');
        });
        
        test('Debe bloquear event handlers', () => {
            const maliciousInput = JSON.stringify({
                nombre: "Hacker",
                mensaje: "<img src='x' onerror='alert(1)'>",
                color: "#FF0000"
            });
            
            const result = JSON.parse(unalib.validateMessage(maliciousInput));
            expect(result.mensaje).not.toContain('onerror=');
            expect(result.mensaje).not.toContain('alert(1)');
        });
        
        test('Debe detectar intentos de inyeccion', () => {
            expect(unalib.isScriptInjection('<script>alert("test")</script>')).toBe(true);
            expect(unalib.isScriptInjection('javascript:void(0)')).toBe(true);
            expect(unalib.isScriptInjection('<img onerror="alert(1)">')).toBe(true);
            expect(unalib.isScriptInjection('Mensaje normal')).toBe(false);
        });
    });

    describe('Validacion de URLs de Imagenes', () => {
        test('Debe validar URLs de imagenes con extension JPG', () => {
            const imageUrl = 'https://example.com/imagen.jpg';
            expect(unalib.isValidMediaURL(imageUrl)).toBe(true);
        });
        
        test('Debe validar URLs de imagenes con extension PNG', () => {
            const imageUrl = 'https://example.com/foto.png';
            expect(unalib.isValidMediaURL(imageUrl)).toBe(true);
        });
        
        test('Debe validar URLs de imagenes con extension GIF', () => {
            const imageUrl = 'https://i.imgur.com/animacion.gif';
            expect(unalib.isValidMediaURL(imageUrl)).toBe(true);
        });
        
        test('Debe crear HTML para imagen valida', () => {
            const imageUrl = 'https://example.com/test.jpg';
            const html = unalib.createMediaHTML(imageUrl);
            
            expect(html).toContain('<img');
            expect(html).toContain(imageUrl);
            expect(html).toContain('max-width: 300px');
        });
        
        test('Debe manejar URLs de Imgur', () => {
            const imgurUrl = 'https://i.imgur.com/test123.jpg';
            expect(unalib.isValidMediaURL(imgurUrl)).toBe(true);
            
            const html = unalib.createMediaHTML(imgurUrl);
            expect(html).toContain('<img');
        });
    });
    
    describe('Validacion de URLs de Videos', () => {
        test('Debe validar URLs de videos MP4', () => {
            const videoUrl = 'https://example.com/video.mp4';
            expect(unalib.isValidMediaURL(videoUrl)).toBe(true);
        });
        
        test('Debe validar URLs de videos WebM', () => {
            const videoUrl = 'https://example.com/video.webm';
            expect(unalib.isValidMediaURL(videoUrl)).toBe(true);
        });
        
        test('Debe crear HTML para video valido', () => {
            const videoUrl = 'https://example.com/test.mp4';
            const html = unalib.createMediaHTML(videoUrl);
            
            expect(html).toContain('<video');
            expect(html).toContain('controls');
            expect(html).toContain(videoUrl);
        });
        
        test('Debe manejar URLs de YouTube', () => {
            const youtubeUrls = [
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'https://youtu.be/dQw4w9WgXcQ'
            ];
            
            youtubeUrls.forEach(url => {
                expect(unalib.isValidMediaURL(url)).toBe(true);
                const html = unalib.createMediaHTML(url);
                expect(html).toContain('<iframe');
                expect(html).toContain('youtube.com/embed');
            });
        });
        
        test('Debe rechazar URLs de video invalidas', () => {
            const invalidUrls = [
                'not-a-url',
                'ftp://example.com/video.mp4',
                'https://example.com/file.txt'
            ];
            
            invalidUrls.forEach(url => {
                expect(unalib.isValidMediaURL(url)).toBe(false);
            });
        });
    });
    
    describe('Sanitizacion de Entrada', () => {
        test('Debe sanitizar nombres con HTML', () => {
            const dirtyName = '<b>Usuario</b><script>alert(1)</script>';
            const clean = unalib.sanitizeInput(dirtyName);
            
            expect(clean).toBe('Usuario');
            expect(clean).not.toContain('<script>');
            expect(clean).not.toContain('<b>');
        });
        
        test('Debe limitar longitud de nombres', () => {
            const longName = 'A'.repeat(100);
            const clean = unalib.sanitizeInput(longName);
            
            expect(clean.length).toBeLessThanOrEqual(50);
        });
        
        test('Debe manejar entrada no string', () => {
            expect(unalib.sanitizeInput(null)).toBe('Anónimo');
            expect(unalib.sanitizeInput(undefined)).toBe('Anónimo');
            expect(unalib.sanitizeInput(123)).toBe('Anónimo');
        });
    });
    
    describe('Validacion de Colores', () => {
        test('Debe validar colores hexadecimales validos', () => {
            expect(unalib.validateColor('#FF0000')).toBe('#FF0000');
            expect(unalib.validateColor('#00FF00')).toBe('#00FF00');
            expect(unalib.validateColor('#0000FF')).toBe('#0000FF');
        });
        
        test('Debe rechazar colores invalidos', () => {
            expect(unalib.validateColor('rojo')).toBe('#000000');
            expect(unalib.validateColor('#GGG')).toBe('#000000');
            expect(unalib.validateColor('javascript:alert(1)')).toBe('#000000');
        });
    });
    
    describe('Integracion Completa', () => {
        test('Debe procesar mensaje normal correctamente', () => {
            const normalInput = JSON.stringify({
                nombre: "Usuario",
                mensaje: "Hola, como estan?",
                color: "#3366CC"
            });
            
            const result = JSON.parse(unalib.validateMessage(normalInput));
            
            expect(result.nombre).toBe('Usuario');
            expect(result.mensaje).toBe('Hola, como estan?');
            expect(result.color).toBe('#3366CC');
        });
        
        test('Debe procesar imagen y mantener seguridad', () => {
            const imageInput = JSON.stringify({
                nombre: "Usuario<script>alert(1)</script>",
                mensaje: "https://example.com/imagen.jpg",
                color: "#FF0000"
            });
            
            const result = JSON.parse(unalib.validateMessage(imageInput));
            
            expect(result.nombre).toBe('Usuario');
            expect(result.mensaje).toContain('<img');
            expect(result.mensaje).toContain('example.com/imagen.jpg');
            expect(result.mensaje).not.toContain('<script>');
        });
        
        test('Debe manejar JSON malformado', () => {
            const badInput = 'esto no es JSON valido';
            const result = JSON.parse(unalib.validateMessage(badInput));
            
            expect(result.nombre).toBe('Sistema');
            expect(result.mensaje).toBe('Mensaje inválido');
            expect(result.color).toBe('#FF0000');
        });
    });
});