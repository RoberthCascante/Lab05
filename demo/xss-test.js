// Script de demostración XSS para Lab 5
const unalib = require('../libs/unalib');

console.log('='.repeat(60));
console.log('🔴 DEMOSTRACIÓN XSS - LAB 5 UNA');
console.log('='.repeat(60));

// Casos de prueba XSS
const testCases = [
    {
        name: 'Script básico',
        payload: '<script>alert("Inyección de script")</script>'
    },
    {
        name: 'Event handler',
        payload: '<img src="x" onerror="alert(\'XSS\')">'
    },
    {
        name: 'JavaScript URL',
        payload: 'javascript:alert("XSS")'
    },
    {
        name: 'Iframe malicioso',
        payload: '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    }
];

console.log('🧪 PRUEBAS XSS:\n');

testCases.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   Payload: ${test.payload}`);
    
    const maliciousMessage = JSON.stringify({
        nombre: 'Hacker',
        mensaje: test.payload,
        color: '#FF0000'
    });
    
    const result = unalib.validateMessage(maliciousMessage);
    const sanitized = JSON.parse(result);
    
    console.log(`   Resultado: ${sanitized.mensaje}`);
    
    const wasBlocked = !sanitized.mensaje.includes('<script>') && 
                      !sanitized.mensaje.includes('javascript:') && 
                      !sanitized.mensaje.includes('onerror=');
    
    console.log(`   Estado: ${wasBlocked ? '✅ BLOQUEADO' : '❌ VULNERABLE'}`);
    console.log('');
});

console.log('='.repeat(60));
console.log('🔒 PRUEBAS MULTIMEDIA:\n');

const mediaCases = [
    'https://example.com/imagen.jpg',
    'https://i.imgur.com/ejemplo.png',
    'https://example.com/video.mp4',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
];

mediaCases.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
    const isValid = unalib.isValidMediaURL(url);
    console.log(`   Válido: ${isValid ? '✅ SÍ' : '❌ NO'}`);
    console.log('');
});

