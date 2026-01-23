document.addEventListener("DOMContentLoaded", function() {
    
    // Carga del CSV
    d3.csv("../Datos/Transformados/lookslike.csv").then(function(data) {
        
        console.log("Datos cargados:", data.length);

        // --- 1. PROCESAMIENTO DE DATOS ---
        data.forEach(d => {
            d.response = +d.response; 
            d.age = +d.age;           
        });

        // CALCULO DE KPIs
        const totalInteractions = data.length;
        const totalLikes = d3.sum(data, d => d.response);
        const likeRate = (totalLikes / totalInteractions) * 100;
        const avgAge = d3.mean(data, d => d.age);

        // KPI: Marca Top
        const brandCounts = d3.rollup(data, v => v.length, d => d.brand);
        const topBrandEntry = Array.from(brandCounts).sort((a, b) => b[1] - a[1])[0];
        const topBrand = topBrandEntry ? topBrandEntry[0] : "-";

        // --- 2. ACTUALIZAR EL HTML ---
        setText("l-kpi-total", totalInteractions.toLocaleString());
        setText("l-kpi-rate", likeRate.toFixed(1) + "%");
        setText("l-kpi-market", topBrand);
        setText("l-kpi-age", Math.round(avgAge));

        // --- 3. GRÁFICOS (CON COLORES TERRACOTA) ---

        // GRÁFICO 1: Éxito por Morfología
        const shapeGroups = d3.rollup(data, v => d3.mean(v, d => d.response), d => d.body_shape);
        const shapes = Array.from(shapeGroups).map(([key, value]) => ({ 
            shape: key, rate: value * 100 
        })).sort((a, b) => b.rate - a.rate);

        renderChart("l-chart-body", "bar", {
            labels: shapes.map(d => d.shape),
            datasets: [{
                label: "Like Rate (%)",
                data: shapes.map(d => d.rate),
                // Color Terracota Principal
                backgroundColor: "#D07353", 
                borderRadius: 4
            }]
        }, { indexAxis: 'y' }); 

        // GRÁFICO 2: Marcas (Likes vs Total)
        const brandStats = d3.rollup(data,
            v => ({ total: v.length, likes: d3.sum(v, d => d.response) }),
            d => d.brand
        );
        let brandData = Array.from(brandStats).map(([key, val]) => ({
            brand: key, total: val.total, likes: val.likes
        })).sort((a, b) => b.total - a.total).slice(0, 10); 

        renderChart("l-chart-brands", "bar", {
            labels: brandData.map(d => d.brand),
            datasets: [
                {
                    label: "Likes (Éxito)",
                    data: brandData.map(d => d.likes),
                    backgroundColor: "#AC4E2E" // Color Óxido (Más oscuro) para destacar
                },
                {
                    label: "Total Enviadas",
                    data: brandData.map(d => d.total),
                    backgroundColor: "#FFC5B1" // Salmón suave para el fondo
                }
            ]
        });

        // GRÁFICO 3: Desempeño por Fase (Place)
        const placeGroups = d3.rollup(data, v => d3.mean(v, d => d.response), d => d.place);
        const placeData = Array.from(placeGroups).map(([key, val]) => ({
            place: key, rate: val * 100
        })).sort((a, b) => b.rate - a.rate);

        renderChart("l-chart-market", "bar", {
             labels: placeData.map(d => d.place),
             datasets: [{
                 label: "Tasa de Éxito (%)",
                 data: placeData.map(d => d.rate),
                 backgroundColor: "#F7A487", // Color Acento
                 borderRadius: 4
             }]
        });

        // TABLA: Top Familias
        const familyStats = d3.rollup(data,
            v => ({ total: v.length, likes: d3.sum(v, d => d.response) }),
            d => d.family
        );
        let familyData = Array.from(familyStats).map(([key, val]) => ({
            family: key, total: val.total, rate: (val.likes / val.total) * 100
        })).sort((a, b) => b.total - a.total).slice(0, 8); 

        const tableBody = document.getElementById("l-table-families");
        if(tableBody) {
            tableBody.innerHTML = ""; 
            familyData.forEach(d => {
                // Lógica de colores para la badge
                let badgeColor = "#FFC5B1"; // Salmón por defecto
                let textColor = "#111";
                if (d.rate > 50) { 
                    badgeColor = "#D07353"; // Terracota si es alto
                    textColor = "#fff";
                }

                const row = `<tr>
                    <td class="ps-4 fw-bold text-muted" style="text-transform: capitalize;">${d.family}</td>
                    <td class="text-center">${d.total.toLocaleString()}</td>
                    <td class="text-end pe-4">
                        <span class="badge" style="background-color: ${badgeColor}; color: ${textColor};">
                            ${d.rate.toFixed(1)}%
                        </span>
                    </td>
                </tr>`;
                tableBody.innerHTML += row;
            });
        }
    });
});

// Función auxiliar para renderizar
function renderChart(canvasId, type, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return; 
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) existingChart.destroy();
    new Chart(ctx, {
        type: type,
        data: data,
        options: Object.assign({
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }, options)
    });
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}