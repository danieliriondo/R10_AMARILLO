let usuarioChartsLoaded = false;

function initUsuario() {
    if (usuarioChartsLoaded) return;
    
    console.log("Iniciando Dashboard UX con paleta Coral...");

    // --- IMPORTACIÓN DE PALETA CSS ---
    // Obtenemos los colores definidos en styles.css para asegurar coherencia
    const style = getComputedStyle(document.documentElement);
    const colorFondo = style.getPropertyValue('--color-fondo').trim();       // Melocotón claro
    const colorSecundario = style.getPropertyValue('--color-secundario').trim(); // Salmón suave
    const colorPrincipal = style.getPropertyValue('--color-principal').trim(); // Terracota
    const colorOscuro = style.getPropertyValue('--color-oscuro').trim();     // Óxido (para alertas/fricción)
    const colorAcento = style.getPropertyValue('--color-acento').trim();     // Acento vivo

    // 1. GRÁFICO DE SEGMENTACIÓN (Donut) - Paleta Coral
    const ctxSegments = document.getElementById('chart-user-segments');
    if (ctxSegments) {
        new Chart(ctxSegments, {
            type: 'doughnut',
            data: {
                labels: ['Convertida (Directa)', 'Convertida (Recapturada)', 'Abandono Temprano', 'Abandono Recurrente'],
                datasets: [{
                    data: [58.5, 19.5, 12.2, 9.8],
                    backgroundColor: [
                        colorPrincipal, 
                        colorAcento,     
                        colorSecundario, 
                        colorOscuro      
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '65%'
            }
        });
    }

    // 2. GRÁFICO DE FRICCIÓN (Tiempo por Sección) - Paleta Coral
    const ctxTime = document.getElementById('chart-user-time');
    if (ctxTime) {
        new Chart(ctxTime, {
            type: 'bar',
            indexAxis: 'y', // Gráfico horizontal
            data: {
                labels: ['Estilos (quiz_styles)', 'Fotos (quiz_photos)', 'Cuerpo (quiz_bodyShape)', 'Tallas (quiz_sizes)', 'Calzado (quiz_footwear)', 'Aventurera (quiz_adventurous)'],
                datasets: [{
                    label: 'Mediana de Tiempo (segundos)',
                    data: [51.6, 34.3, 30.4, 27.6, 27.2, 22.8],
                    backgroundColor: (context) => {
                        // Si supera 30s, usa el color Óxido (alerta), si no, el Principal
                        return context.raw > 30 ? colorOscuro : colorPrincipal;
                    },
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                xMin: 30,
                                xMax: 30,
                                borderColor: colorOscuro,
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: { 
                                    enabled: true, 
                                    content: 'Umbral Fricción (30s)',
                                    backgroundColor: colorOscuro,
                                    color: 'white'
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { color: colorFondo } }
                }
            }
        });
    }

    // 3. GRÁFICO DE FUNNEL (Abandono) - Paleta Coral
    const ctxFunnel = document.getElementById('chart-user-funnel');
    if (ctxFunnel) {
        new Chart(ctxFunnel, {
            type: 'line',
            data: {
                labels: ['Ocio', 'Trabajo', 'Ajuste', 'Estilos', 'Precios', 'Fotos', 'Calzado', 'Registro'],
                datasets: [
                    {
                        label: 'Tasa de Abandono (%)',
                        data: [31.2, 4.5, 2, 1, 1, 13.2, 24.0, 80.5], 
                        borderColor: colorOscuro, // Línea de alerta
                        backgroundColor: colorOscuro,
                        borderWidth: 3,
                        tension: 0.3,
                        pointRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Volumen de Sesiones',
                        data: [40, 39, 38, 37, 36, 35, 28, 5], 
                        backgroundColor: colorSecundario, 
                        hoverBackgroundColor: colorAcento,
                        type: 'bar',
                        yAxisID: 'y1',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: '% Abandono', color: colorOscuro },
                        grid: { drawOnChartArea: false }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Sesiones', color: colorPrincipal },
                        grid: { color: colorFondo }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    usuarioChartsLoaded = true;
}