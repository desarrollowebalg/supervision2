/**
 * Componente para mostrar la ventana de filtro de PDI
 */
var IDCLIENTE_U=0;
var IDUSUARIO_U=0;
var ELEMENTDESTINYCONTENTCOMPONENTHTML_USERS="";
/**
 * {
			"tituloComponente":"Titulo deseado",
      "multiple":true,
			"excepciones":true,	
			"detalleexcepciones":[
        {				
				  "ignorarids": usuariosRespDisp
			  }
      ]
		}
  adicionalmente al componente se le pueden enviar propiedades adicionales
  multiple: si se desea que se seleccione múltiples registros
  tituloComponente: es el titulo de la ventana modal
  excepciones: si se marca un true lo que hará es activar una bandera en el script de servidor
  ignorarids: es un string separado por comas que indicas los ids que no se deben mostrar en la ventana modal y que se pasan al server
 */
var objPropsComponente={};
var tipoComponenteSeleccion="radio";
var tituloComponenteGral="Seleccione un usuario";
async function getUsersClienteComponent(c,f,start,regsxpag){
  // console.log("cliente ",c," filtro ",f," comienza en ",start," termina en ",regsxpag)
  const PATHFILTER="modules/mComponentsUI/usersFilter/usersFilter.php";
  let parametros="a=filter&c="+c+"&f="+f+"&start="+start+"&regs="+regsxpag+"&props="+JSON.stringify(objPropsComponente);
  const headers = new Headers({
    "Content-Type": "application/x-www-form-urlencoded"
  });  
  return await fetch(PATHFILTER, {
    method: "POST",
    body: parametros,
    headers: headers
  })
  .then(response => {      
    if (!response.ok) {
      throw new Error(`Error al obtener los datos de la URL: ${URL}`);
    }
    return response.text();
  })
  .catch(error => {      
    console.error(`Error: ${error}`);
    reject(error)
  });
}

async function layoutElementComponentFilterUsers(opt="N/A"){  
  // Verificar si el elemento ya existe
  let idElemento="modalComponenteSeleccionUsersALG_v0";
  if((document.querySelector("#modalComponenteSeleccionUsersALG_v0")!==null) && opt=="N/A"){
    document.querySelector("#modalComponenteSeleccionUsersALG_v0").remove();
  }
  let elementoExistente = document.getElementById(idElemento); 
  if (!elementoExistente) {
    // Si el elemento no existe, crear el nuevo elemento div
    let nuevoElemento = document.createElement("div");
    // Asignar el atributo id al nuevo elemento
    nuevoElemento.id = idElemento;
    nuevoElemento.setAttribute("uk-modal","")
    // Agregar el nuevo elemento al cuerpo del documento
    document.body.appendChild(nuevoElemento);
    let modal=`
        <div class="uk-modal-dialog">
            <button class="uk-modal-close-default" type="button" uk-close></button>
            <div class="uk-modal-header">
                <h3 class="uk-modal-title" style="font-size: 1.4rem;">${tituloComponenteGral}</h3>  
            </div>
            <div class="uk-modal-body uk-padding-small" uk-overflow-auto>
              <div class="ed-container">
                <div class="ed-item base-100">
                  <input type="text" name="txtComponenteUSERS_ALG_v0" id="txtComponenteUSERS_ALG_v0" placeholder="Buscar ..." class="uk-input uk-border-rounded" style="font-size:1.2rem;background-color: #f0f0f0;" title="Escriba el nombre de un usuario o su nombre completo" />                
                </div>          
              </div>
              <hr />
              <div id="contentLayoutComponentUsersList_v0"></div>
            </div>
            <div class="uk-modal-footer uk-text-right">
                <button class="uk-button uk-button-default uk-modal-close uk-border-rounded botonesAsistComponentFrm_v0" title="Cerrar asistente" type="button">Cerrar</button>
                <button id="btnAddUsersComponentAsistALG_v1" class="uk-button uk-button-primary uk-border-rounded botonesAsistComponentFrm_v0" type="button" title="Agregar usuario">Agregar usuario</button>
            </div>
        </div>`;
    document.getElementById(idElemento).innerHTML=modal;
    UIkit.modal("#"+idElemento,{stack:true}).show();
    let filterTxtComponent=document.querySelector("#txtComponenteUSERS_ALG_v0");
    filterTxtComponent.value="";
    filterTxtComponent.addEventListener("keyup",getRegistrosUsersFiltrarComponent_ALG_v0);    
  }else if(!elementoExistente.classList.contains("uk-open")){
    UIkit.modal("#"+idElemento,{stack:true}).show();
    let filterTxtComponent=document.querySelector("#txtComponenteUSERS_ALG_v0");
    filterTxtComponent.value="";
  }  
}

function componentFilterUsersClient(idUsuario=0,idCliente=0,pag=0,filtro="Ti9B",props={}){
  return new Promise(async (resolve,reject) => {  
    // console.log("componente usuarios")
    // console.log("props ",props)
    objPropsComponente=props;
    // console.log("props componente ",objPropsComponente)
    // evaluamos propiedades adicionales
    if(objPropsComponente.tituloComponente!==undefined){
      tituloComponenteGral=objPropsComponente.tituloComponente;
    }
    // se debe averiguar si en la variable objPropsComponente existe la propiedad multiple
    if((objPropsComponente.multiple!==undefined) && (objPropsComponente.multiple==true)){
      // se adapta la propiedad multiple para determinar si se pone un check o un radio
      tipoComponenteSeleccion="checkbox";      
    }
    //se arma el layout que es una ventana flotante y se muestra en primer plano
    // await layoutElementComponentFilterUsers();
    (filtro=="Ti9B") ? await layoutElementComponentFilterUsers() : await layoutElementComponentFilterUsers("filter");    
    IDCLIENTE_U=idCliente;
    IDUSUARIO_U=idUsuario;  
    ELEMENTDESTINYCONTENTCOMPONENTHTML_USERS="contentLayoutComponentUsersList_v0";    
    let filtroBusquedaUSER="Ti9B";
    let regsEmpezarUsers=0;
    let paginaU=parseInt(pag);
    let resXpagU=30;
    if(filtro!="Ti9B" && pag==0){
      filtroBusquedaUSER=b64EncodeUnicodeComponentUSERS(filtro);
    }else{
      filtroBusquedaUSER=filtro;
    }
    if( paginaU == 0 ){
      regsEmpezarUsers=0;				
    }else{
      regsEmpezarUsers=resXpagU+1;
      regsEmpezarUsers=(paginaU*resXpagU)+1;				
    }
    let destinoF=document.getElementById(ELEMENTDESTINYCONTENTCOMPONENTHTML_USERS);
    destinoF.innerHTML="<div uk-spinner></div>";
    //llamar a la funcion y pedir la consulta a la base de datos
    getUsersClienteComponent(idCliente,filtroBusquedaUSER,regsEmpezarUsers,resXpagU)
    .then(data=>{
      // console.log(data)
      let res=JSON.parse(data);
      // console.log(res)
      if(res.error=="1"){
        console.log("No hay usuarios cargados")
        destinoF.innerHTML="";
        destinoF.innerHTML=`<div class="uk-alert-danger" uk-alert><p>No existen usuarios cargados.</p></div>`;
        reject("-1");
      }else{
        let totalRegs=res.regs;
        let regs=JSON.parse(res.data);
        // console.log("cantidad de usuarios => ",totalRegs);
        // console.log("Regs");
        // console.log(regs);
        let totalPaginasUsers=Math.round(totalRegs / resXpagU);
        // console.log("total de paginas")
        // console.log(totalPaginasUsers)
        let botonAnterior="",botonSiguiente="";
        if(paginaU==0){
          if(totalRegs < resXpagU){
            botonAnterior="";
            botonSiguiente="";
          }else{
            paginaU++;
            botonAnterior="";
            // botonSiguiente="<button class='uk-button uk-button-primary uk-border-rounded botonesPaginadorComponentFrm_v0' type='button' onclick='componentFilterUsersClient(\""+idUsuario+"\",\""+idCliente+"\",\""+paginaU+"\",\""+filtroBusquedaUSER+"\",\""+JSON.parse(JSON.stringify(objPropsComponente))+"\")'>Siguiente</button>";
            botonSiguiente="<button class='uk-button uk-button-primary uk-border-rounded botonesPaginadorComponentFrm_v0' type='button' onclick='componentFilterUsersClient(\""+idUsuario+"\",\""+idCliente+"\",\""+paginaU+"\",\""+filtroBusquedaUSER+"\", JSON.parse(`"+JSON.stringify(objPropsComponente)+"`))'>Siguiente</button>";
          }
        }else if((paginaU+1)==totalPaginasUsers){
          botonAnterior="<button class='uk-button uk-button-primary uk-border-rounded botonesPaginadorComponentFrm_v0' type='button' onclick='componentFilterUsersClient(\""+idUsuario+"\",\""+idCliente+"\",\""+(paginaU - 1)+"\",\""+filtroBusquedaUSER+"\",JSON.parse(`"+JSON.stringify(objPropsComponente)+"`))'>Anterior</button>";	
          botonSiguiente="";
        }else{					
          botonAnterior="<button class='uk-button uk-button-primary uk-border-rounded botonesPaginadorComponentFrm_v0' type='button' onclick='componentFilterUsersClient(\""+idUsuario+"\",\""+idCliente+"\",\""+(paginaU - 1)+"\",\""+filtroBusquedaUSER+"\",JSON.parse(`"+JSON.stringify(objPropsComponente)+"`))'>Anterior</button>";
          paginaU++;
          botonSiguiente="<button class='uk-button uk-button-primary uk-border-rounded botonesPaginadorComponentFrm_v0' type='button' onclick='componentFilterUsersClient(\""+idUsuario+"\",\""+idCliente+"\",\""+paginaU+"\",\""+filtroBusquedaUSER+"\",JSON.parse(`"+JSON.stringify(objPropsComponente)+"`))'>Siguiente</button>";
        }

        
        let idFormularioUsrsX="frmListadoUsersALG_"+Math.random();
        
        destinoF.innerHTML="";
        
        if(totalRegs < resXpagU){
          // debugger;          
          paginaU=1;
          totalPaginasUsers=1;
        }        
        let filerUSERS=`
          <form name="${idFormularioUsrsX}" id="${idFormularioUsrsX}" class="regSeleccionadoListFormComponentALG">	
            <div class="ed-container">            
              <div class="ed-item base-100">
                <h4>Página ${paginaU} de ${totalPaginasUsers} - Total de registros ${totalRegs}</h4>
              </div>`;
              regs.forEach(function(elemento,index){
                let idChkC="chkUSER_"+index;                
                filerUSERS+=`<div class="ed-item base-100 no-padding">                                  
                  <input type='${tipoComponenteSeleccion}' name="rdbUSERSComponentAsistALG_v0" id='${idChkC}' value='${elemento.ID_USUARIO}' class="rdbFormListTaskV3" />
                  <label class="labelLitsFrmTaskComponentV3 ed-container" for='${idChkC}'>
                    <div class="ed-item base-10 no-padding itemContenedorIconoComponenteUsr_v0">
                      <img src="${elemento.FOTO}" class="fotoPerfilUsuarioItemList" title="Imagen perfil usuario" />
                    </div>
                    <div class="ed-item base-90 no-padding contenedorDescripcionItemFrm_v0">
                      <div class="contenedorUserDescripcionItem_v0_titulo">${elemento.NOMBRE}</div>
                      <div class="contenedorUserDescripcionItem_v0_subtitulo">${elemento.USUARIO}</div>
                    </div>				
                  </label>
                  <textarea name="hdnDatosForms_${elemento.ID_USUARIO}" id="hdnDatosForms_${elemento.ID_USUARIO}" cols="20" rows="2" class="noMostrarElementoComponenteFrm_v0">`+JSON.stringify(elemento)+`</textarea>
                </div>`;
              });
              filerUSERS+=`<div id="barraBtnPdiTareas" class="ed-item base-100 contenedorBotonesPaginadorComponentForm_v0">${botonAnterior}${botonSiguiente}</div>
            </div>
          </form>`;
        destinoF.innerHTML=filerUSERS;      
      }
    })

    document.getElementById("btnAddUsersComponentAsistALG_v1").addEventListener("click",()=>{
      // console.log("Agregar usuario")
      //let usersSelCompAsist_ALG_v0=$("input[name='rdbUSERSComponentAsistALG_v0']:checked").val();
      //recuperarmos todos los elementos seleccionados ya sean radio o checkbox con vanilla js
      let usersSelCompAsist_ALG_v0=[];
      let elementosSelCompAsist_ALG_v0=document.querySelectorAll("input[name='rdbUSERSComponentAsistALG_v0']:checked");
      elementosSelCompAsist_ALG_v0.forEach(e=>{
        // console.log(e.value)
        usersSelCompAsist_ALG_v0.push(e.value);        
      });      
      // console.log("usersSelCompAsist_ALG_v0 ",usersSelCompAsist_ALG_v0.toString())  
      if(usersSelCompAsist_ALG_v0.length==0){
        // if(usersSelCompAsist_ALG_v0=="" || usersSelCompAsist_ALG_v0==null || usersSelCompAsist_ALG_v0==undefined){		
        UIkit.modal.alert('<p class="fuente15MsgVtnComponentFrm_v0">Error, seleccione por lo menos un Usuario del listado.</p>',{stack:true}).then(function (e) {
          console.log('Error T-00003.')
          UIkit.modal(e).$destroy(true);
          reject("-1")
        });        
      }else{
        UIkit.modal("#modalComponenteSeleccionUsersALG_v0").hide();
        let x={};
        usersSelCompAsist_ALG_v0.forEach(e=>{
          let idUserSelCV_0="hdnDatosForms_"+e;          
          let valor=document.getElementById(idUserSelCV_0).value;
          x[e]=valor;
        });
        // console.log(x)
        // console.log(JSON.stringify(x))        
        // resolve(JSON.stringify(x))
        resolve(x)
      }    
    });

  })


}
function getRegistrosUsersFiltrarComponent_ALG_v0(){
  // console.log("filtrado de registros");
  let filterTxt=document.querySelector("#txtComponenteUSERS_ALG_v0");
  let totalCharsFilter=filterTxt.value.length;
  let filtro="";
  if(totalCharsFilter >= 3){
    filtro=filterTxt.value;    
  }else if(totalCharsFilter== 0 ){
    // filtro="Ti9B";
    filtro="";
  }
  componentFilterUsersClient(IDUSUARIO_U,IDCLIENTE_U,0,filtro,objPropsComponente);
}

function b64EncodeUnicodeComponentUSERS(str) {return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {return String.fromCharCode('0x' + p1);}));}