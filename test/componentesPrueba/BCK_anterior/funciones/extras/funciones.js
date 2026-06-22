export function obtenerImagenesActivas(searchContainerId) {	
  const elementos = Array.from(document.querySelectorAll(`#${searchContainerId} listado-elementos-component`));
  const fotosGral = [];
  const elementosVisibles = elementos.filter(el => el.style.display === "block");
  
  elementosVisibles.forEach(el => {
		const foto = el.querySelector("foto-gallery img");
		if (foto) {
			fotosGral.push({
				url: foto.getAttribute("src"),
				caption: foto.getAttribute("alt")
			});
		}
  });  

  // console.log("fotosGral => ",fotosGral);
	let selectorComponenteGaleria="";
	// se evalua el origen o el contenedor de la busqueda
	if(searchContainerId === "resultsRondinesList"){
		selectorComponenteGaleria="contentFotosGral";		
	}else if(searchContainerId==="resultsIncidenciasList"){
		selectorComponenteGaleria="contentFotosGralIncidencias";
	}else if(searchContainerId==="resultsIncidenciasListTotal"){
		selectorComponenteGaleria="contentFotosGralIncidenciasT";
	}
	

  // se actualiza el atributo fotos del componente fotosGallery en su atributo fotos
  // para mostrar las fotos de los elementos que están activos
  const fotoGallery = document.querySelector(`#${selectorComponenteGaleria} foto-gallery`);
	if (fotoGallery) {
		fotoGallery.setAttribute("fotos", JSON.stringify(fotosGral));
	} else {
		console.warn("No se encontró el componente foto-gallery");
	}
}