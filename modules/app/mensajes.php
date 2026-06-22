<?php
/**
 *  @package             
 *  @name                Manejador para los mensajes general en plataforma
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Gerardo Lara
 *  @modificado          02-11-2024
 */
  error_reporting(E_ALL); ini_set('display_errors', '1');
  class mensajes{
    private $tipo;
    private $status;
    private $creado;
    private $mensaje;
    private $urlFotoPerfil;
    private $headerTemplate="";
    private $footerTemplate="";
    private $templateMsg="";

    // Método constructor para establecer la conexión
    public function __construct() {
      
    }
    public function __get($name) {
      return $this->$name;
    }

    public function __set($name, $value) { 
      return $this->$name = $value;
    }

    public function get_headerTemplate(){
      $headerTemplate="";
      $bodyHeaderTemplate ="";
      $bodyHeaderTemplate = file_get_contents("./modules/app/template/mensajesApp/headerMensaje.html");
      if ($bodyHeaderTemplate === false) {
        throw new Exception("Error al cargar plantilla de mensajes");
      }
      $this->headerTemplate=$bodyHeaderTemplate;
    }

    public function get_TemplateMsg(){      
      // necesario para que el mensaje se transforme de base de datos
      $mensajeAppALGC="";
      $mensajeAppALGC=str_replace("¬","&",$this->mensaje);
      $mensajeAppALGC=html_entity_decode($mensajeAppALGC);

      if($this->creado=="Administrador"){
        $this->creado="Bot Asistencias";
      }
      
      $bodyPlantilla ="";
      if ($bodyPlantilla === false) {
        throw new Exception("Error al cargar plantilla de mensajes");
      }
      // $bodyPlantilla .= file_get_contents("./modules/app/template/mensajesApp/headerMensaje.html");
      $bodyPlantilla .= file_get_contents("./modules/app/template/mensajesApp/mensajeApp.html");
      if($this->tipo=="Default"){        
        $bodyPlantilla = str_replace('{{TITULO_SECTION}}', htmlspecialchars("Actualizaciones"), $bodyPlantilla);        
        $bodyPlantilla = str_replace('{{COLOR_BORDE_SECCION}}', htmlspecialchars("border: 1px solid var(--color-divisor-linea2)"), $bodyPlantilla);        
      }else if ($this->tipo=="Permanente"){        
        $bodyPlantilla = str_replace('{{TITULO_SECTION}}', htmlspecialchars("Mensaje de prioridad"), $bodyPlantilla);
        $bodyPlantilla = str_replace('{{CLASE_COLOR_FONDO_SECCION}}', htmlspecialchars("seccionMensajesError_txt"), $bodyPlantilla);
        $bodyPlantilla = str_replace('{{COLOR_BORDE_SECCION}}', htmlspecialchars("border: 1px solid var(--fondoBotonDanger);"), $bodyPlantilla);
        $bodyPlantilla = str_replace('{{CLASE_FONDO_MENSAJE}}', htmlspecialchars("msgPermanentePlattform"), $bodyPlantilla);        
      }
      
      $bodyPlantilla = str_replace('{{URL_FOTO_PERFIL}}', htmlspecialchars($this->urlFotoPerfil), $bodyPlantilla);
      $bodyPlantilla = str_replace('{{AUTOR}}', htmlspecialchars($this->creado), $bodyPlantilla);
      $bodyPlantilla = str_replace('{{MENSAJE}}', $mensajeAppALGC, $bodyPlantilla);
      
      // $bodyPlantilla .= file_get_contents("./modules/app/template/mensajesApp/footerMensaje.html");      

      $this->templateMsg=$bodyPlantilla;
    }

  }
?>