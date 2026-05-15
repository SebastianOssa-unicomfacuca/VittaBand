/**
 * ============================================
 * HU01 - VISUALIZACIÓN BPM (Frecuencia Cardíaca)
 * ============================================
 * Módulo que simula la lectura de BPM en tiempo real.
 * Genera valores aleatorios dentro de rangos fisiológicos,
 * actualiza la UI cada segundo y genera alertas cuando
 * los valores están fuera del rango seguro (30-220 BPM).
 */
kjngfijaijg
(function() {
    'use strict';

    // Referencias DOM
    const bpmValue = document.getElementById('bpmValue');
    const bpmStatus = document.getElementById('bpmStatus');
    const bpmBar = document.getElementById('bpmBar');
    const bpmCard = document.getElementById('bpmCard');
    const bpmAlert = document.getElementById('bpmAlert');
    const bpmAlertText = document.getElementById('bpmAlertText');

    // Estado del módulo
    let bpmInterval = null;
    let isRunning = false;
    let bpmHistory = []; // Historial para el gráfico

    // Constantes de configuración
    const UPDATE_INTERVAL = 1000; // 1 segundo
    const MIN_NORMAL_BPM = 60;
    const MAX_NORMAL_BPM = 100;
    const MIN_ALERT_BPM = 30;   // Alerta si BPM < 30
    const MAX_ALERT_BPM = 220;  // Alerta si BPM > 220
    const HISTORY_MAX_POINTS = 20;

    /**
     * Genera un valor de BPM simulado
     * Usa distribución normal centrada en 75 BPM con variación realista
     * @returns {number} - Valor BPM entero
     */
    function generateBPM() {
        // Simulación realista: media 75, desviación estándar 15
        // Ocasionalmente genera valores anormales para probar alertas (5% probabilidad)
        const isAbnormal = Math.random() < 0.05;
        
        let bpm;
        if (isAbnormal) {
            // Generar valor fuera de rango para demostrar alertas
            bpm = Math.random() < 0.5 
                ? Math.floor(Math.random() * 25) + 5   // 5-30 (bradicardia extrema)
                : Math.floor(Math.random() * 50) + 221; // 221-270 (taquicardia extrema)
        } else {
            // Valor normal con variación
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            bpm = Math.round(75 + z * 15);
        }

        return Math.max(0, bpm); // Evitar negativos
    }

    /**
     * Determina el estado del BPM y el color correspondiente
     * @param {number} bpm - Valor actual de BPM
     * @returns {Object} - {status, cssClass, message}
     */
    function getBPMStatus(bpm) {
        if (bpm < MIN_ALERT_BPM) {
            return {
                status: 'danger',
                cssClass: 'status-danger',
                message: '⚠️ Bradicardia severa - ¡Atención médica urgente!'
            };
        }
        if (bpm > MAX_ALERT_BPM) {
            return {
                status: 'danger',
                cssClass: 'status-danger',
                message: '⚠️ Taquicardia severa - ¡Atención médica urgente!'
            };
        }
        if (bpm < MIN_NORMAL_BPM) {
            return {
                status: 'warning',
                cssClass: 'status-warning',
                message: '⚡ Bradicardia leve'
            };
        }
        if (bpm > MAX_NORMAL_BPM) {
            return {
                status: 'warning',
                cssClass: 'status-warning',
                message: '⚡ Taquicardia leve'
            };
        }
        return {
            status: 'normal',
            cssClass: 'status-normal',
            message: '✅ Ritmo cardíaco normal'
        };
    }

    /**
     * Calcula el porcentaje para la barra de progreso visual
     * @param {number} bpm - Valor actual
     * @returns {number} - Porcentaje (0-100)
     */
    function calculateBarPercentage(bpm) {
        // Escala: 0 BPM = 0%, 250 BPM = 100%
        const percentage = (bpm / 250) * 100;
        return Math.min(100, Math.max(0, percentage));
    }

    /**
     * Obtiene color para la barra según el estado
     * @param {string} status - Estado del BPM
     * @returns {string} - Color CSS
     */
    function getBarColor(status) {
        const colors = {
            normal: '#10b981',   // verde
            warning: '#f59e0b',  // amarillo
            danger: '#ef4444'    // rojo
        };
        return colors[status] || colors.normal;
    }

    /**
     * Actualiza la interfaz de usuario con el nuevo valor de BPM
     * @param {number} bpm - Valor actual
     */
    function updateBPMUI(bpm) {
        const statusInfo = getBPMStatus(bpm);
        
        // Actualizar valor numérico
        bpmValue.textContent = bpm;
        
        // Actualizar estado textual
        bpmStatus.textContent = statusInfo.message;
        bpmStatus.className = 'metric-status ' + statusInfo.cssClass;
        
        // Actualizar barra visual
        bpmBar.style.width = calculateBarPercentage(bpm) + '%';
        bpmBar.style.backgroundColor = getBarColor(statusInfo.status);
        
        // Manejar alertas visuales
        if (statusInfo.status === 'danger') {
            bpmCard.classList.add('alert');
            bpmAlert.classList.remove('hidden');
            bpmAlertText.textContent = statusInfo.message;
        } else {
            bpmCard.classList.remove('alert');
            bpmAlert.classList.add('hidden');
        }

        // Guardar en historial para gráfico
        bpmHistory.push({ value: bpm, timestamp: Date.now() });
        if (bpmHistory.length > HISTORY_MAX_POINTS) {
            bpmHistory.shift();
        }

        // Actualizar gráfico si existe
        updateChart();
    }

    /**
     * Ciclo principal: genera y muestra nuevo valor de BPM
     */
    function bpmTick() {
        const currentBPM = generateBPM();
        updateBPMUI(currentBPM);
    }

    /**
     * Inicia la simulación de lecturas de BPM
     */
    function startBPM() {
        if (isRunning) return;
        
        isRunning = true;
        bpmTick(); // Primera lectura inmediata
        
        // Actualizaciones periódicas
        bpmInterval = setInterval(bpmTick, UPDATE_INTERVAL);
    }

    /**
     * Detiene la simulación de lecturas de BPM
     */
    function stopBPM() {
        if (bpmInterval) {
            clearInterval(bpmInterval);
            bpmInterval = null;
        }
        isRunning = false;
        
        // Resetear UI
        bpmValue.textContent = '--';
        bpmStatus.textContent = 'Esperando datos...';
        bpmStatus.className = 'metric-status';
        bpmBar.style.width = '0%';
        bpmCard.classList.remove('alert');
        bpmAlert.classList.add('hidden');
        bpmHistory = [];
    }

    /**
     * Actualiza el gráfico de historial (canvas)
     */
    function updateChart() {
        const canvas = document.getElementById('historyChart');
        if (!canvas || bpmHistory.length < 2) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        ctx.clearRect(0, 0, width, height);
        
        // Dibujar línea de BPM
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        
        bpmHistory.forEach((point, index) => {
            const x = (index / (HISTORY_MAX_POINTS - 1)) * width;
            const y = height - ((point.value / 250) * height);
            
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    }

    // Escuchar eventos de sesión
    window.addEventListener('userLoggedIn', startBPM);
    window.addEventListener('userLoggedOut', stopBPM);

})();
