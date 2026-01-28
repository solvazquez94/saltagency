let video;
let canvas;
let ctx;
let objectDetector;
let detections = [];
let modelLoaded = false;

async function setup() {
    try {
        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');

        // Actualizar texto de carga
        document.querySelector('.loading-text').textContent = 'Solicitando acceso a la cámara...';

        // Solicitar acceso a la cámara
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        });
        
        video.srcObject = stream;
        
        // Esperar a que el video esté listo
        video.addEventListener('loadeddata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            document.querySelector('.loading-text').textContent = 'Cargando modelo de detección...';
            
            // Inicializar el modelo de detección de objetos
            initializeModel();
        });

        // Manejar errores de video
        video.addEventListener('error', (e) => {
            console.error('Error en video:', e);
            showError('Error al cargar el video de la cámara');
        });

    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        if (error.name === 'NotAllowedError') {
            showError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
        } else if (error.name === 'NotFoundError') {
            showError('No se encontró ninguna cámara. Asegúrate de tener una cámara conectada.');
        } else {
            showError('Error al acceder a la cámara: ' + error.message);
        }
    }
}

function initializeModel() {
    try {
        // Usar la sintaxis correcta para ML5.js como en p5.js
        objectDetector = ml5.objectDetector('cocossd', modelReady);
        
        function modelReady() {
            console.log('Modelo COCO-SSD cargado');
            modelLoaded = true;
            
            // Ocultar pantalla de carga y mostrar video
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('video-container').classList.remove('hidden');
            // No mostrar el panel de detecciones
            // document.getElementById('detection-info').classList.remove('hidden');
            
            // Comenzar la detección
            detect();
        }
    } catch (error) {
        console.error('Error al cargar el modelo:', error);
        showError('Error al cargar el modelo de detección: ' + error.message);
    }
}

function detect() {
    if (!modelLoaded || !objectDetector) return;
    
    try {
        objectDetector.detect(video, (err, results) => {
            if (err) {
                console.error(err);
                return;
            }
            detections = results;
            drawDetections();
            // Ya no actualizamos el panel inferior
            // updateDetectionInfo();
            
            // Continuar detectando (loop como en p5.js)
            detect();
        });
    } catch (error) {
        console.error('Error en ciclo de detección:', error);
    }
}

function drawDetections() {
    if (!ctx) return;
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar detecciones como en p5.js
    for (let i = 0; i < detections.length; i++) {
        let obj = detections[i];

        let label = obj.label;
        let confidence = (obj.confidence * 100).toFixed(1);

        // Calcular posición invertida para el texto (para que no aparezca en espejo)
        const invertedX = canvas.width - obj.x - obj.width;
        
        // Dibujar caja de detección
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

        // Guardar el estado del contexto
        ctx.save();
        
        // Invertir horizontalmente solo para el texto
        ctx.scale(-1, 1);
        
        // Dibujar etiqueta sin espejo
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillText(
            `${label} ${confidence}%`,
            -invertedX + 5,
            obj.y + 20
        );
        
        // Restaurar el estado del contexto
        ctx.restore();
    }
}

function updateDetectionInfo() {
    const detectionCount = document.getElementById('detection-count');
    const detectionList = document.getElementById('detection-list');
    
    if (detections.length === 0) {
        detectionCount.textContent = 'No se detectaron objetos';
        detectionList.innerHTML = '';
    } else {
        detectionCount.textContent = `Se detectaron ${detections.length} objeto(s):`;
        
        detectionList.innerHTML = detections.map(detection => {
            const confidence = (detection.confidence * 100).toFixed(1);
            return `<div class="detection-tag">${detection.label} ${confidence}%</div>`;
        }).join('');
    }
}

function showError(message) {
    document.getElementById('loading').classList.add('hidden');
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
    errorContainer.style.display = 'block';
}

// Iniciar la aplicación
window.addEventListener('load', setup);
