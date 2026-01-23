// 1. DICCIONARIO DE DESCRIPCIONES (ACTUALIZADO)
const lookDescriptions = {
    1: "Este conjunto destaca por la combinación de una chaqueta vaquera azul oscuro de algodón y elastano, un top de viscosa color crudo de manga corta y sin cierre, y unos pantalones chinos caqui de sarga de algodón con cierre de cremallera y botón. Es un look casual de entretiempo que juega con texturas naturales y colores neutros.",
    2: "Este look es la definición de elegancia clásica, combinando la fluidez de la falda midi plisada negra con la estructura y calidez del abrigo de paño camel. La blusa estampada de viscosa añade un toque de sofisticación y detalle visual, creando un conjunto armonioso y atemporal. Es una opción versátil que transita perfectamente del entorno laboral a una salida nocturna con estilo.",
    3: "Este conjunto es pura energía y funcionalidad, combinando el estampado clásico de rayas de la camiseta de algodón con el color amarillo vibrante e impermeable del chubasquero, y la comodidad atemporal de los jeans rectos. Es el look ideal para días de lluvia o escapadas al aire libre, aportando un toque de alegría y frescura.",
    4: "Este look bohemio y urbano combina la textura y el color mostaza de los pantalones vaqueros ajustados con la suavidad y el tono azul oscuro del top de manga corta. La chaqueta de sarga beige ajustada añade una capa final de estilo y estructura, creando un conjunto equilibrado y lleno de personalidad para un día casual.",
    5: "Este look es la definición de elegancia minimalista, con la línea limpia del pantalón de pinzas, la textura suave y cálida del jersey de cuello vuelto, y el estampado clásico y estructurado del blazer Príncipe de Gales. Es un conjunto de estilo 'working girl' moderno y pulido que transmite sofisticación y profesionalidad.",
    6: "Este look es una combinación audaz de estilo rockero y elegancia clásica, donde la chaqueta de cuero tipo biker aporta una actitud rebelde que se equilibra con el estampado floral delicado del top. El pantalón skinny de tiro alto completa el conjunto, creando una silueta moderna y sofisticada para una salida nocturna.",
    7: "Este conjunto destaca por la luminosidad y el contraste, combinando la elegancia de un blazer blanco minimalista con la sobriedad de unos pantalones beige de corte clásico. El top morado de estilo boho rompe la monocromía con un toque vibrante de color, creando un look equilibrado y lleno de personalidad.",
    8: "Este look fusiona lo clásico y lo urbano, combinando unos pantalones beige minimalistas con una camiseta gris de algodón. El protagonismo lo roba el jersey color teja, que añade un toque moderno y vibrante con sus detalles brillantes y bandas deportivas.",
    9: "Este look urbano y relajado combina la intensidad de los jeans granates con la frescura de la camiseta blanca de algodón con mensaje. La sudadera marrón claro con cremallera completa el conjunto, aportando un aire deportivo y cómodo ideal para el día a día.",
    10: "Este look destaca por la elegancia de los pantalones verdes de corte clásico, que contrastan perfectamente con el top negro de popelín, rico en detalles como volantes y bordados. El jersey gris de punto añade el toque final de calidez y sobriedad, creando un conjunto versátil y lleno de estilo para cualquier ocasión."
};

// 2. FUNCIÓN PRINCIPAL
function initLooks() {
    const btnContainer = document.getElementById('looks-buttons');
    const imgDisplay = document.getElementById('look-current-img');
    const titleDisplay = document.getElementById('look-current-title');
    const descDisplay = document.getElementById('look-current-desc');

    // Validación básica
    if (!btnContainer || !imgDisplay) return;

    // Limpiar botones previos
    btnContainer.innerHTML = '';

    // CREAR LOS 10 BOTONES
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.innerText = `Look ${i}`;
        // Clase base
        btn.className = 'btn btn-outline-dark px-4 py-2 text-nowrap';
        btn.style.marginRight = "5px"; 
        
        // EVENTO AL HACER CLICK
        btn.onclick = () => {
            // A. Gestión de clases (Estilos de botón activo)
            document.querySelectorAll('#looks-buttons button').forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-outline-dark');
            });
            btn.classList.remove('btn-outline-dark');
            btn.classList.add('active', 'btn-primary');

            // B. Efecto de "Fade Out" (Desvanecer)
            imgDisplay.style.opacity = 0;

            // C. Cambiar contenido tras una breve pausa para la animación
            setTimeout(() => {
                
                imgDisplay.src = `looks/look_${i}.png`;
                imgDisplay.onerror = function() {
                    console.warn(`No se encontró la imagen looks/look_${i}.png`);
                };

                // Cambiar Títulos y Texto
                if (titleDisplay) titleDisplay.innerText = `Propuesta de Look #${i}`;
                if (descDisplay) descDisplay.innerHTML = `<p class="fs-5">${lookDescriptions[i] || "Descripción no disponible."}</p>`;

                // 3. Efecto "Fade In" (Aparecer)
                imgDisplay.style.opacity = 1;
            }, 200);
        };

        btnContainer.appendChild(btn);
    }

    // CLICK AUTOMÁTICO EN EL PRIMER LOOK AL CARGAR
    if (btnContainer.firstChild) {
        btnContainer.firstChild.click();
    }
}

// 3. EJECUTAR AL CARGAR LA PÁGINA
document.addEventListener("DOMContentLoaded", initLooks);