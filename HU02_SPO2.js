/**
 * ============================================
 * HU02 - VISUALIZACIÓN SpO₂ (Oxigenación)
 * ============================================
 * Módulo que simula la lectura de SpO₂ en tiempo real.
 * Genera valores realistas de saturación de oxígeno,
 * actualiza la UI periódicamente y alerta cuando
 * SpO₂ cae por debajo de 50% (hipoxemia severa).
 */
//esta es una mos=dificacion de prueba para git
// version 1
// segunda modificacion para git
(function() {
    'use strict';

    // Referencias DOM
    const spo2Value = document.getElementById('spo2Value');
    const spo2Status = document.getElementById('spo2Status');
    const spo2Bar = document.getElementById('spo2Bar');
    const spo2Card = document.getElementById('spo2Card');
    const spo2Alert = document.getElementById('spo2Alert');
    const spo2AlertText = document.getElementById('spo2AlertText');

    // Estado del módulo
    let spo2Interval = null;
    let isRunning = false;
    let spo2History = [];

    // Constantes de configuración
    const UPDATE_INTERVAL = 1500; // 1.5 segundos (ligeramente diferente a BPM para no sincronizar)
    const MIN_NORMAL_SPO2 = 95;
    const MIN_WARNING_SPO2 = 90;
    const MIN_ALERT_SPO2 = 50;   // Alerta crítica si SpO₂ < 50%
    const HISTORY_MAX_POINTS = 20;

    /**
     * Genera un valor de SpO₂ simulado
     * Valores normales: 95-100%
     * Ocasionalmente genera valores bajos para probar alertas
     * @returns {number} - Valor SpO₂ entero
     */
    function generateSpO2() {
        const isCritical = Math.random() < 0.03; // 3% probabilidad de valor crítico
        
        let spo2;
        if (isCritical) {
            // Valor crítico: 30-49%
            spo2 = Math.floor(Math.random() * 20) + 30;
        } else {
            // Valor normal o levemente bajo
            const base = 97;
            const variation = (Math.random() - 0.5) * 10; // ±5%
            spo2 = Math.round(base + variation);
        }

        return Math.min(100, Math.max(0, spo2));
    }

    /**
     * Determina el estado del SpO₂ y el mensaje correspondiente
     * @param {number} spo2 - Valor actual de SpO₂
     * @returns {Object} - {status, cssClass, message}
     */
    function getSpO2Status(spo2) {
        if (spo2 < MIN_ALERT_SPO2) {
            return {
                status: 'danger',
                cssClass: 'status-danger',
                message: '🚨 Hipoxemia severa - ¡Emergencia médica!'
            };
        }
        if (spo2 < MIN_WARNING_SPO2) {
            return {
                status: 'warning',
                cssClass: 'status-warning',
                message: '⚠️ Hipoxemia moderada'
            };
        }
        if (spo2 < MIN_NORMAL_SPO2) {
            return {
                status: 'warning',
                cssClass: 'status-warning',
                message: '⚡ SpO₂ ligeramente baja'
            };
        }
        return {
            status: 'normal',
            cssClass: 'status-normal',
            message: '✅ Oxigenación normal'
        };
    }

    /**
     * Calcula el porcentaje para la barra visual
     * @param {number} spo2 - Valor actual
     * @returns {number} - Porcentaje (0-100)
     */
    function calculateBarPercentage(spo2) {
        return spo2; // SpO₂ ya es un porcentaje
    }

    /**
     * Obtiene color para la barra según el estado
     * @param {string} status - Estado del SpO₂
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
     * Actualiza la interfaz de usuario con el nuevo valor de SpO₂
     * @param {number} spo2 - Valor actual
     */
    function updateSpO2UI(spo2) {
        const statusInfo = getSpO2Status(spo2);
        
        // Actualizar valor numérico
        spo2Value.textContent = spo2;
        
        // Actualizar estado textual
        spo2Status.textContent = statusInfo.message;
        spo2Status.className = 'metric-status ' + statusInfo.cssClass;
        
        // Actualizar barra visual
        spo2Bar.style.width = calculateBarPercentage(spo2) + '%';
        spo2Bar.style.backgroundColor = getBarColor(statusInfo.status);
        
        // Manejar alertas visuales
        if (statusInfo.status === 'danger') {
            spo2Card.classList.add('alert');
            spo2Alert.classList.remove('hidden');
            spo2AlertText.textContent = statusInfo.message;
        } else {
            spo2Card.classList.remove('alert');
            spo2Alert.classList.add('hidden');
        }

        // Guardar en historial
        spo2History.push({ value: spo2, timestamp: Date.now() });
        if (spo2History.length > HISTORY_MAX_POINTS) {
            spo2History.shift();
        }

        // Actualizar gráfico
        updateSpO2Chart();
    }

    /**
     * Ciclo principal: genera y muestra nuevo valor de SpO₂
     */
    function spo2Tick() {
        const currentSpO2 = generateSpO2();
        updateSpO2UI(currentSpO2);
    }

    /**
     * Inicia la simulación de lecturas de SpO₂
     */
    function startSpO2() {
        if (isRunning) return;
        
        isRunning = true;
        spo2Tick(); // Primera lectura inmediata
        
        spo2Interval = setInterval(spo2Tick, UPDATE_INTERVAL);
    }

    /**
     * Detiene la simulación de lecturas de SpO₂
     */
    function stopSpO2() {
        if (spo2Interval) {
            clearInterval(spo2Interval);
            spo2Interval = null;
        }
        isRunning = false;
        
        // Resetear UI
        spo2Value.textContent = '--';
        spo2Status.textContent = 'Esperando datos...';
        spo2Status.className = 'metric-status';
        spo2Bar.style.width = '0%';
        spo2Card.classList.remove('alert');
        spo2Alert.classList.add('hidden');
        spo2History = [];
    }

    /**
     * Actualiza el gráfico de historial de SpO₂ (segunda línea en canvas)
     */
    function updateSpO2Chart() {
        const canvas = document.getElementById('historyChart');
        if (!canvas || spo2History.length < 2) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // No limpiamos, dibujamos sobre la línea de BPM ya existente
        // Dibujar línea de SpO₂
        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        
        spo2History.forEach((point, index) => {
            const x = (index / (HISTORY_MAX_POINTS - 1)) * width;
            const y = height - ((point.value / 100) * height);
            
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    }

    // Escuchar eventos de sesión
    window.addEventListener('userLoggedIn', startSpO2);
    window.addEventListener('userLoggedOut', stopSpO2);

})();