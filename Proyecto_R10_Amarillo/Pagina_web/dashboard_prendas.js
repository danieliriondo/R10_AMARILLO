let prendasLoaded = false;

function initPrendas() {
    if (prendasLoaded) return;

    // Recuperamos los colores del CSS
    const style = getComputedStyle(document.body);
    const C = {
        main: style.getPropertyValue('--color-principal').trim() || "#D07353",
        accent: style.getPropertyValue('--color-acento').trim() || "#F7A487",
        dark: style.getPropertyValue('--color-oscuro').trim() || "#AC4E2E",
        sec: style.getPropertyValue('--color-secundario').trim() || "#FFC5B1",
        bg: style.getPropertyValue('--color-fondo').trim() || "#FFE0D6"
    };
    
    const palette = [C.main, C.accent, C.sec, C.dark, C.bg];
    
    // Aseguramos tooltip
    let tooltip = d3.select(".d3-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div").attr("class", "d3-tooltip").style("opacity", 0);
    }

    d3.csv("../Datos/Transformados/csv_limpio.csv").then(data => {
        if(!data.length) return;
        
        // --- KPIS ---
        document.getElementById('p-kpi-total').innerText = data.length.toLocaleString();
        
        const brands = new Set(data.map(d => d.marca ? d.marca.trim() : "N/A"));
        document.getElementById('p-kpi-brands').innerText = brands.size;

        const styles = d3.rollups(data, v => v.length, d => d.style || "N/A").sort((a,b) => b[1]-a[1]);
        document.getElementById('p-kpi-style').innerText = styles[0] ? styles[0][0] : "-";

        const weather = d3.rollups(data, v => v.length, d => d.weather || "N/A").sort((a,b) => b[1]-a[1]);
        document.getElementById('p-kpi-weather').innerText = weather[0] ? weather[0][0].replace(/_/g, ' ') : "-";

        // --- DATOS ---
        const prints = d3.rollups(data, v => v.length, d => d.Estampado || "N/A").sort((a,b) => b[1]-a[1]).slice(0, 5);
        const types = d3.rollups(data, v => v.length, d => d.tipo_producto || "N/A").sort((a,b) => b[1]-a[1]).slice(0, 15);

        // --- RENDERIZADO ---
        drawBarChart(styles.slice(0, 10), "#p-chart-style", C.accent);
        drawDonutChart(prints, "#p-chart-print", palette);
        drawHorizBar(types, "#p-chart-product-type", C.main);

        prendasLoaded = true;
    }).catch(console.error);

    // --- FUNCIONES GRÁFICAS (CON ANIMACIONES) ---

    function drawBarChart(data, selector, color) {
        const container = document.querySelector(selector);
        // Fallback de ancho por si el contenedor está oculto al inicio
        const width = container.clientWidth || 400, height = 250;
        const margin = {top: 20, right: 20, bottom: 40, left: 40};
        
        // Limpiar SVG previo si existe
        d3.select(selector).selectAll("*").remove();

        const svg = d3.select(selector).append("svg")
            .attr("width", width).attr("height", height)
            .append("g").attr("transform", `translate(0,0)`); 

        const x = d3.scaleBand().range([margin.left, width-margin.right]).domain(data.map(d=>d[0])).padding(0.3);
        const y = d3.scaleLinear().range([height-margin.bottom, margin.top]).domain([0, d3.max(data, d=>d[1])]);

        // Ejes
        svg.append("g").attr("transform", `translate(0,${height-margin.bottom})`)
           .call(d3.axisBottom(x)).selectAll("text")
           .style("text-anchor","end").attr("transform","rotate(-15)").style("font-size", "11px");
        
        svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));

        // Barras con ANIMACIÓN
        svg.selectAll("rect").data(data).join("rect")
            .attr("x", d=>x(d[0]))
            .attr("y", y(0)) // Empiezan abajo (en 0)
            .attr("width", x.bandwidth())
            .attr("height", 0) // Altura inicial 0
            .attr("fill", color)
            .on("mouseover", function(e,d) {
                d3.select(this).transition().duration(200).attr("fill", C.dark);
                showTooltip(e, `Estilo: ${d[0]}<br>${d[1]}`);
            })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("fill", color);
                hideTooltip();
            })
            .transition().duration(1000) // Animación de crecimiento
            .attr("y", d=>y(d[1]))
            .attr("height", d=>height-margin.bottom-y(d[1]));
    }

    function drawDonutChart(data, selector, palette) {
        const width = 250, height = 250, radius = width/2 - 20;
        d3.select(selector).selectAll("*").remove();

        const svg = d3.select(selector).append("svg")
            .attr("width", width).attr("height", height)
            .append("g").attr("transform", `translate(${width/2},${height/2})`);
        
        const color = d3.scaleOrdinal(palette);
        const pie = d3.pie().value(d=>d[1]);
        const arc = d3.arc().innerRadius(radius*0.6).outerRadius(radius);
        const arcHover = d3.arc().innerRadius(radius*0.6).outerRadius(radius * 1.1); // Expansión

        svg.selectAll("path").data(pie(data)).join("path")
            .attr("d", arc)
            .attr("fill", (d,i)=>color(i))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .on("mouseover", function(e,d) {
                d3.select(this).transition().duration(200).attr("d", arcHover); // Efecto Hover
                showTooltip(e, `${d.data[0]}: ${d.data[1]}`);
            })
            .on("mouseout", function(e,d) {
                d3.select(this).transition().duration(200).attr("d", arc);
                hideTooltip();
            })
            .transition().duration(1000).attrTween("d", function(d) {
                const i = d3.interpolate(d.startAngle+0.1, d.endAngle);
                return function(t) {
                    d.endAngle = i(t);
                    return arc(d);
                }
            });
    }

    function drawHorizBar(data, selector, color) {
        const container = document.querySelector(selector);
        const width = container.clientWidth || 600, height = 300;
        const margin = {top: 20, right: 30, bottom: 20, left: 100};

        d3.select(selector).selectAll("*").remove();
        const svg = d3.select(selector).append("svg").attr("width", width).attr("height", height);
        
        const x = d3.scaleLinear().domain([0, d3.max(data, d=>d[1])]).range([margin.left, width-margin.right]);
        const y = d3.scaleBand().domain(data.map(d=>d[0])).range([margin.top, height-margin.bottom]).padding(0.2);

        svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
        svg.append("g").attr("transform", `translate(0,${height-margin.bottom})`).call(d3.axisBottom(x));

        // Barras con ANIMACIÓN
        svg.selectAll("rect").data(data).join("rect")
            .attr("x", margin.left)
            .attr("y", d=>y(d[0]))
            .attr("height", y.bandwidth())
            .attr("width", 0) 
            .attr("fill", color)
            .on("mouseover", function(e,d) {
                d3.select(this).attr("fill", C.dark);
                showTooltip(e, `${d[0]}: ${d[1]}`);
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", color);
                hideTooltip();
            })
            .transition().duration(1000) 
            .attr("width", d=>x(d[1])-margin.left);
    }

    function showTooltip(e, html) {
        tooltip.style("opacity", 1).html(html).style("left", (e.pageX+10)+"px").style("top", (e.pageY-20)+"px");
    }
    function hideTooltip() { tooltip.style("opacity", 0); }
}