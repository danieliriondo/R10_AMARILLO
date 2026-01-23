

let modeloGraficosLoaded = false;

function initModeloLookLike() {
    // Si ya se cargaron, no hacemos nada para evitar duplicados
    if (modeloGraficosLoaded) return;
    
    console.log("Iniciando gráficos del Modelo CatBoost...");

    // 1. GRÁFICO DE RENDIMIENTO (AUC 0.82)
    const ctxPerformance = document.getElementById('chart-performance');
    if (ctxPerformance) {
        new Chart(ctxPerformance, {
            type: 'bar',
            data: {
                labels: ['AUC-ROC (Calidad Global)', 'Precisión', 'Recall'],
                datasets: [
                    {
                        label: 'Métricas del Modelo',
                        data: [0.82, 0.83, 0.90], 
                        backgroundColor: ['#D07353', '#FFC5B1', '#FFC5B1'], 
                        borderColor: '#D07353',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Rendimiento: CatBoost Classifier' }
                },
                scales: { y: { beginAtZero: true, max: 1.0 } }
            }
        });
    }

    // 2. GRÁFICO DE IMPORTANCIA DE VARIABLES
    const ctxFeatures = document.getElementById('chart-features');
    if (ctxFeatures) {
        new Chart(ctxFeatures, {
            type: 'bar',
            indexAxis: 'y', // Horizontal
            data: {
                labels: [
                    'Talla Sujetador (Bra)', 
                    'Estampado (Print)', 
                    'Profesión (Job)', 
                    'Familia', 
                    'Modelo', 
                    'Estilo 1', 
                    'Estilo 2'
                ],
                datasets: [{
                    label: 'Importancia (%)',
                    data: [10.68, 8.44, 7.19, 5.46, 4.44, 4.26, 4.04], 
                    backgroundColor: '#D07353',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Variables Determinantes (Top 7)' }
                }
            }
        });
    }

    modeloGraficosLoaded = true;
}