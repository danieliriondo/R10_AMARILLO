/* --- VARIABLES --- */
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const mainContent = document.querySelector("main");

let sidebarOpen = false;

/* --- 1. ABRIR / CERRAR SIDEBAR --- */
if(menuBtn) {
    menuBtn.addEventListener("click", () => toggleSidebar());
}

function toggleSidebar() {
  if (sidebarOpen) {
    sidebar.style.left = "-250px";
    mainContent.style.marginLeft = "0";
  } else {
    sidebar.style.left = "0";
    mainContent.style.marginLeft = "250px";
  }
  sidebarOpen = !sidebarOpen;
}

/* --- 2. SUBMENÚ --- */
function toggleSubmenu(submenuId) {
  const submenu = document.getElementById(submenuId);
  const parentBtn = document.getElementById("btn-graficos");
  const arrow = parentBtn ? parentBtn.querySelector(".arrow") : null;

  if (submenu.style.maxHeight) {
    submenu.style.maxHeight = null;
    if(arrow) arrow.classList.remove("rotate-arrow"); 
  } else {
    submenu.style.maxHeight = submenu.scrollHeight + "px";
    if(arrow) arrow.classList.add("rotate-arrow"); 
  }
}

/* --- 3. NAVEGACIÓN --- */
function showSection(sectionId) {
  
  // A. Ocultar secciones
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));

  // B. Mostrar objetivo
  const targetSection = document.getElementById(sectionId);
  if (targetSection) targetSection.classList.add("active");

  // C. Gestión visual Menú
  document.querySelectorAll(".sidebar li").forEach(item => item.classList.remove("active"));

  const activeTab = document.getElementById("tab-" + sectionId);
  if (activeTab) {
    activeTab.classList.add("active");

    // Mantener submenú abierto si estamos dentro
    if (activeTab.parentElement.classList.contains("submenu")) {
       const parentBtn = document.getElementById("btn-graficos");
       if(parentBtn) parentBtn.classList.add("active");
       
       const submenu = activeTab.parentElement;
       if (!submenu.style.maxHeight) {
           submenu.style.maxHeight = submenu.scrollHeight + "px";
           const arrow = parentBtn.querySelector(".arrow");
           if(arrow) arrow.classList.add("rotate-arrow");
       }
    }
  }

  // D. Inicialización de Dashboards (Lazy Loading)
  if (sectionId === "prendas" && typeof initPrendas === 'function') setTimeout(initPrendas, 50);
  if (sectionId === "looklike" && typeof initLookLike === 'function') setTimeout(initLookLike, 50);
  if (sectionId === "looks" && typeof initLooks === 'function') setTimeout(initLooks, 50);
  if (sectionId === "usuario") {
      if (typeof initUsuario === 'function') setTimeout(initUsuario, 50);
  }
  if (sectionId === "modelo") {
      if (typeof initModeloLookLike === 'function') {
          setTimeout(initModeloLookLike, 50);
      } else {
          console.error("Error: initModeloLookLike no está definido. Revisa modelo_looklike.js");
      }
  }

  // Cierre en móvil
  if (window.innerWidth < 768 && sidebarOpen) toggleSidebar();
}

// Init automático
document.addEventListener("DOMContentLoaded", () => {
    if(!document.querySelector(".section.active")) showSection('inicio');
});



