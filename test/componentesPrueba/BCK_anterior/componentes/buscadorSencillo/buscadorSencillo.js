/**
 * Este código implementa una función de búsqueda sobre los elementos anteriores de rondines e incidencias
 * se respalda para un posible uso posterior
 * @param {} t 
 * @returns 
 */


function parseTimeToSeconds(t) {
    // Asegurarse que el formato tenga segundos
    const [h, m, s = "00"] = t.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  }

  function resaltarTexto(texto, busqueda) {
    if (!busqueda) return texto;
    
    const regex = new RegExp(`(${busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<span class="texto-resaltado">$1</span>');
  }

  function filtrarPorHoras(query) {
    const items = document.querySelectorAll("#contenedorListadoRondinesTabV1 .timeline-item");
    
    // Si el query está vacío, restaurar todos los items y el texto original
    if (!query) {
      items.forEach(item => {
        item.style.display = "";
        const observacionesSpan = item.querySelector(".observaciones p span");
        if (observacionesSpan) {
          observacionesSpan.innerHTML = observacionesSpan.innerText;
        }
      });
      return;
    }
    
    // Separar la consulta por comas
    const queryParts = query.split(",").map(part => part.trim());
    
    // Buscar el rango horario y el filtro de texto
    let timeRange = null;
    let textFilter = "";
    
    for (const part of queryParts) {
      const rangeMatch = part.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
      if (rangeMatch) {
        const [_, startStr, endStr] = rangeMatch;
        timeRange = {
          start: parseTimeToSeconds(startStr + ":00"),
          end: parseTimeToSeconds(endStr + ":00")
        };
      } else {
        textFilter += (textFilter ? " " : "") + part;
      }
    }
    
    textFilter = textFilter.toLowerCase();
    
    // Primero aplicar filtro de horas si existe
    if (timeRange) {
      items.forEach(item => {
        const timeStr = item.getAttribute("date-is") || "";
        const itemTime = parseTimeToSeconds(timeStr);
        const inTimeRange = itemTime >= timeRange.start && itemTime <= timeRange.end;
        item.style.display = inTimeRange ? "" : "none";
      });
    }
    
    // Luego aplicar filtro de texto si existe
    if (textFilter) {
      items.forEach(item => {
        // Solo procesar items visibles (después del filtro de horas)
        if (item.style.display !== "none") {
          const observacionesSpan = item.querySelector(".observaciones p span");
          if (observacionesSpan) {
            const observacionesText = observacionesSpan.innerText;
            const matchesText = observacionesText.toLowerCase().includes(textFilter);
            
            if (matchesText) {
              observacionesSpan.innerHTML = resaltarTexto(observacionesText, textFilter);
            } else {
              observacionesSpan.innerHTML = observacionesText;
              // Si no hay rango horario, ocultar el item
              if (!timeRange) {
                item.style.display = "none";
              }
            }
          }
        }
      });
    }
    
    // Log para depuración
    console.log("Filtros aplicados:", {
      rangoHorario: timeRange ? `${timeRange.start}-${timeRange.end}` : "ninguno",
      texto: textFilter || "ninguno"
    });
  }

  document.getElementById("searchInputGralRondinesInc_v0").addEventListener("input", function () {
    const query = this.value.trim();
    filtrarPorHoras(query);
  });