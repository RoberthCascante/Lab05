// Servidor de Chat UNA - Lab 5 Seguridad Informática
// Universidad Nacional - Sede Regional Chorotega Campus Nicoya

const validation = require('./libs/unalib');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const port = process.env.PORT || 3000;

// Función para logs de seguridad
function logSecurity(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

// Servir archivos estáticos
app.use(express.static('public'));

// Ruta principal: servir el HTML del chat
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Ruta para información del servidor
app.get('/info', function(req, res){
  res.json({
    name: 'UNA Chat Lab 5',
    version: '1.0.0',
    security: 'XSS Protection Enabled',
    features: ['Image URLs', 'Video URLs', 'YouTube Embedding'],
    university: 'Universidad Nacional - Costa Rica',
    course: 'Seguridad Informática',
    timestamp: new Date().toISOString()
  });
});

// Estadísticas para el Lab 5
let stats = {
  totalConnections: 0,
  activeConnections: 0,
  messagesSent: 0,
  blockedMessages: 0,
  xssAttempts: 0,
  mediaShared: 0
};

// Manejo de conexiones WebSocket
io.on('connection', function(socket){
  stats.totalConnections++;
  stats.activeConnections++;
  
  const clientId = socket.id;
  const clientIP = socket.handshake.address;
  
  logSecurity(`Nueva conexión: ${clientId} desde ${clientIP}`, 'INFO');
  
  // Enviar información de bienvenida
  socket.emit('connection-info', {
    id: clientId,
    connectedAt: new Date().toISOString(),
    serverInfo: 'UNA Chat Lab 5 - Servidor Seguro Activo',
    securityLevel: 'HIGH'
  });

  // Escuchar mensajes del cliente - PUNTO CLAVE DEL LAB 5
  socket.on('Evento-Mensaje-Server', function(msg){
    try {
      logSecurity(`Mensaje recibido de ${clientId}`, 'INFO');
      
      // Parsear mensaje original para análisis
      const originalMsg = JSON.parse(msg);
      
      // VALIDAR con la librería UNA-LIB (requisito del Lab 5)
      const validatedMsg = validation.validateMessage(msg);
      const validatedObj = JSON.parse(validatedMsg);
      
      // Detectar intentos de XSS (evidencia para el Lab)
      if (validation.isScriptInjection && validation.isScriptInjection(originalMsg.mensaje)) {
        stats.blockedMessages++;
        stats.xssAttempts++;
        
        logSecurity(`🚨 INTENTO DE XSS DETECTADO Y BLOQUEADO 🚨`, 'WARNING');
        logSecurity(`Cliente: ${clientId}`, 'WARNING');
        logSecurity(`Nombre: ${originalMsg.nombre}`, 'WARNING');
        logSecurity(`Payload bloqueado: ${originalMsg.mensaje.substring(0, 100)}...`, 'WARNING');
        
        // Enviar advertencia de seguridad al cliente atacante
        socket.emit('security-warning', {
          message: '⚠️ Intento de script injection detectado y bloqueado por el sistema de seguridad',
          timestamp: new Date().toISOString(),
          action: 'Message sanitized and logged',
          labInfo: 'Lab 5 - Demostración de protección XSS'
        });
      }
      
      // Detectar contenido multimedia válido
      if (validation.isValidMediaURL && validation.isValidMediaURL(originalMsg.mensaje)) {
        stats.mediaShared++;
        logSecurity(`📷 Contenido multimedia válido compartido: ${originalMsg.mensaje.substring(0, 50)}...`, 'INFO');
      }
      
      stats.messagesSent++;
      
      // Reenviar mensaje VALIDADO a todos los clientes
      io.emit('Evento-Mensaje-Server', validatedMsg);
      
      logSecurity(`Mensaje validado y enviado a ${stats.activeConnections} clientes conectados`, 'INFO');
      
    } catch (error) {
      logSecurity(`❌ Error procesando mensaje de ${clientId}: ${error.message}`, 'ERROR');
      
      // Enviar mensaje de error sanitizado
      const errorMsg = validation.validateMessage(JSON.stringify({
        nombre: 'Sistema UNA',
        mensaje: '⚠️ Error procesando mensaje. Mensaje bloqueado por seguridad.',
        color: '#FF0000'
      }));
      
      socket.emit('Evento-Mensaje-Server', errorMsg);
    }
  });

  // Manejar desconexión de clientes
  socket.on('disconnect', function(reason){
    stats.activeConnections--;
    logSecurity(`Cliente desconectado: ${clientId}, razón: ${reason}`, 'INFO');
    
    // Notificar estadísticas si es la última conexión
    if (stats.activeConnections === 0) {
      logSecurity(`📊 Sesión terminada - Mensajes: ${stats.messagesSent}, XSS bloqueados: ${stats.xssAttempts}`, 'STATS');
    }
  });

  // Manejar errores de socket
  socket.on('error', function(error){
    logSecurity(`⚠️ Error en socket ${clientId}: ${error.message}`, 'ERROR');
  });
});

// Ruta para estadísticas del Lab 5
app.get('/stats', function(req, res){
  res.json({
    ...stats,
    uptime: process.uptime(),
    uptimeFormatted: formatUptime(process.uptime()),
    securityStatus: 'ACTIVE',
    lab: 'Lab 5 - Seguridad Informática',
    timestamp: new Date().toISOString()
  });
});

// Función auxiliar para formatear tiempo de actividad
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

// Manejo global de errores
process.on('uncaughtException', function(error){
  logSecurity(`💥 Error crítico no capturado: ${error.message}`, 'CRITICAL');
  logSecurity(`Stack trace: ${error.stack}`, 'CRITICAL');
});

process.on('unhandledRejection', function(reason, promise){
  logSecurity(`💥 Promesa rechazada no manejada: ${reason}`, 'CRITICAL');
});

// INICIAR SERVIDOR DEL LAB 5
http.listen(port, function(){
  console.log('='.repeat(70));
  console.log('🎓 UNIVERSIDAD NACIONAL DE COSTA RICA');
  console.log('🏛️ SEDE REGIONAL CHOROTEGA - CAMPUS NICOYA');
  console.log('💻 INGENIERÍA EN SISTEMAS DE LA INFORMACIÓN');
  console.log('='.repeat(70));
  console.log('🔒 LAB 5 - SEGURIDAD INFORMÁTICA');
  console.log('👨‍🏫 Profesor: Ing. Alex Villegas Carranza, M.Sc.');
  console.log('='.repeat(70));
  
  logSecurity(`🚀 Servidor UNA Chat iniciado en puerto ${port}`, 'INFO');
  logSecurity('✅ Características de seguridad habilitadas:', 'INFO');
  logSecurity('   • Protección contra XSS (Cross-Site Scripting)', 'INFO');
  logSecurity('   • Sanitización automática de entrada', 'INFO');
  logSecurity('   • Soporte seguro para URLs de imágenes', 'INFO');
  logSecurity('   • Soporte seguro para URLs de videos', 'INFO');
  logSecurity('   • Integración con YouTube', 'INFO');
  logSecurity('   • Logging de seguridad en tiempo real', 'INFO');
  logSecurity('   • Validación con librería UNA-LIB', 'INFO');
 

  //puerto de la aplicacion 
  console.log(`   1. Abre tu navegador en: http://localhost:${port}`);

});

// Mostrar estadísticas cada 5 minutos (solo si hay actividad)
setInterval(function(){
  if (stats.activeConnections > 0 || stats.messagesSent > 0) {
    logSecurity(`📊 ESTADÍSTICAS LAB 5: ${stats.activeConnections} conectados | ${stats.messagesSent} mensajes | ${stats.xssAttempts} ataques XSS bloqueados | ${stats.mediaShared} multimedia compartido`, 'STATS');
  }
}, 300000); // 5 minutos

// Mensaje final para el profesor
process.on('SIGINT', function() {
  console.log('\n' + '='.repeat(70));
  logSecurity('🎯 RESUMEN FINAL DEL LAB 5:', 'STATS');
  logSecurity(`📈 Total conexiones: ${stats.totalConnections}`, 'STATS');
  logSecurity(`💬 Mensajes procesados: ${stats.messagesSent}`, 'STATS');
  logSecurity(`🚫 Ataques XSS bloqueados: ${stats.xssAttempts}`, 'STATS');
  logSecurity(`🖼️ Contenido multimedia compartido: ${stats.mediaShared}`, 'STATS');
  logSecurity(`⏱️ Tiempo activo: ${formatUptime(process.uptime())}`, 'STATS');
  console.log('='.repeat(70));
  console.log('✅ Lab 5 completado exitosamente');
  console.log('👋 ¡Hasta la próxima!');
  process.exit(0);
});