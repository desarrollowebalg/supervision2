/**
 * la siguiente función sirve para agregar un archivo js al dom en caso de necesitarse al momento de trabajar con algun archivo
 * esta función solo se puede añadir en caso de usar modulos en JS
 */
export function loadScriptModuleComponent(url, type, callback) {	  
  const baseUrl = url.split('?')[0]; // Obtenemos la URL base sin los parámetros de consulta
  const scriptsToRemove = document.querySelectorAll(`script[src^="${baseUrl}"]`);
  scriptsToRemove.forEach(script => {
      script.parentNode.removeChild(script);
  });
  const script = document.createElement('script');
  script.type = type || 'text/javascript';
  script.src = url;
  script.onload = () => {
      if (callback) callback();
  };
  document.head.appendChild(script);
}

function loadCSS(url) {
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = url;
	document.head.appendChild(link);
}

/**
 * funcion para borrar los modales en el dom por parte de la librería, esta recibe de momento los id's de los elementos
 */
export function borrarDialog_DOM_V1(...claves){
  let x,e;
  claves.forEach(clave => {
    e="#"+clave;
    x=document.querySelectorAll(e);
    if(x.length > 1){
      x.forEach(function(e,i){
        if(i != 0){ 
          UIkit.modal(e).$destroy(true);
        }
      });     
    }    
  });
}

export function b64DecodeServicios(encodedStr){
	return decodeURIComponent(escape(atob(encodedStr)));
}