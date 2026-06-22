<?php
/* 
 *  @package             
 *  @name                Configuracion General  
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Enrique Pe�a 
 *  @modificado          22/03/2013
*/
	/**
	 * usersAdministration
	 * 
	 * @package ubicatec
	 * @author usermail
	 * @copyright 2013
	 * @version $Id$
	 * @access public
	 */
	class usersAdministration{
 		public $user_info;
		public $menu_user;
		public $permisos;
/*		public $x_var; 
		public $nuevo    = "";
		public $eliminar = "";
		public $editar   = "";
		public $registros;
		public $contador = -1;
		public $etiqueta =  0;
		public $arreglo_x  = array();
		public $arreglito;
		public $mas;
		public $menu;
		public $dias;
		public $et;
		public $control=1;
		public $d=''; */
		
		/**
		 * @Function Proceso que se encarga de validar el usuario y crear una sesion.
		 * @Params	 Nombre de Usuario, Password
		 * @Return   1=Logeo correcto, 0=Logeo Incorrecto
		 */
		function f_userlogin($userName,$userPass){
			global $db;
			$sql = "SELECT * FROM ADM_USUARIOS WHERE USUARIO = '".$userName."' AND SHA1_PASSWORD = SHA1('".$userPass."') AND ESTATUS = 'Activo' LIMIT 1";
			$query = $db->sqlQuery($sql);
			$count = $db->sqlEnumRows($query);
			if($count == 1){
				$this->user_info = $db->sqlFetchArray($query);
				session_start();
				$_SESSION['s_id_asistencias'] = $this->user_info['ID_USUARIO'];
				$_SESSION['s_95_asistencias'] = $this->user_info['SHA1_PASSWORD'];
				$_SESSION['s_19_app'] = "asistencia";
				// se añaden las demás variables de sesión para el usuario
				$_SESSION['ID_PROFILE'] = $this->user_info['ID_PERFIL'];
				$_SESSION['ID_USUARIO'] = $this->user_info['ID_USUARIO'];
				$_SESSION['ID_CLIENTE'] = $this->user_info['ID_CLIENTE'];
				$_SESSION['USUARIO'] = $this->user_info['USUARIO'];
				$_SESSION['NOMBRE_COMPLETO'] = $this->user_info['NOMBRE_COMPLETO'];
				$_SESSION['URL_FOTO_PERFIL'] = $this->user_info['URL_FOTO_PERFIL'];
				//insertar en la tabla logs
				$sqlLog="INSERT INTO ADM_LOG_USUARIOS (ID_USUARIO,DATE_LOGIN,SERVIDOR,IP_REMOTA) VALUES ('".$this->user_info["ID_USUARIO"]."','".date("Y-m-d")." ".date("H:i:s")."','".$_SERVER['SERVER_ADDR']."','".$_SERVER['REMOTE_ADDR']."')";
				$resLog=$db->sqlQuery($sqlLog);
				return 1;
			}else{
				return 0;
			}
		}
	
		/**
		 * @Function Valida que el usuario tenga una sesion activa
		 * @Params	 ID usuario, Password
		 * @Return   true=Logeado, false=Sin sesion
		 */	
		function u_logged($module=null){
			global $db;		
			session_start();
 			if(isset($_SESSION['s_id_asistencias']) && isset($_SESSION['s_95_asistencias'])){
				$uid   = $_SESSION['s_id_asistencias'];
 				$upass = $_SESSION['s_95_asistencias'];
	            $sql = "SELECT * FROM ADM_USUARIOS WHERE ID_USUARIO   = '".$uid."' AND SHA1_PASSWORD  = '".$upass."' LIMIT 1";
				$query = $db->sqlQuery($sql);
      			$this->user_info = $db->sqlFetchArray($query);
				if(!empty($this->user_info)){	
					return true;
      			}else{
	        		return false;
    	  		}
			}else{
				return false;
			}
		}
		
		function getData(){
			return $this->user_info;
		}

		/**
		 * @Function Valida y/o elimina la sesion del usuario
		 * @Params	 ID usuario, Password
		 * @Return   true=Logut correcto, false=Logout Incorrecto
		 */		
		function log_out(){
			global $db;
			if(isset($_SESSION['s_id_dispatch']) || isset($_SESSION['s_95_dispatch'])){
            	session_start();
            	session_destroy();
            	unset($this->user_info);
            	return true;
        	}else{
        		session_start();
            	session_destroy();
            	return true;
        	}
		}
		
		/**
		 * @Function Obtiene el menu 
		 * @Params	 ID perfil
		 * @Return   Listado con menu 
		*/		
		function obtener_menu($submenu=null){
			global $db;
			$menu = $this->validar_submenu($submenu,1);			
			$menu_return = '  <div class="wrap">
								 <ul class="tab-list">';
  			$sql = "SELECT ADM_MENU.* 
  					FROM ADM_MENU_TIPO 
  					INNER JOIN ADM_MENU ON ADM_MENU_TIPO.ID_MENU = ADM_MENU.ID_MENU
  					WHERE ADM_MENU_TIPO.ID_TIPO_USUARIO = ".$this->user_info['ID_TIPO_USUARIO']."
   					AND  ADM_MENU.TIPO='W'
  					ORDER BY ADM_MENU_TIPO.ORDEN ASC";
  			$query = $db->sqlQuery($sql);
  			$count = $db->sqlEnumRows($query);
			if($count>0){
  				while($row = $db->sqlFetchArray($query)){
  					$current 			= ($row['ID_MENU']==$menu) ? 'class="current"': '';
  					$principal_module 	= $this->obtener_modulo_prin($row['ID_MENU']);
  					$href				= ($current=='') ? 'index.php?m='.$principal_module : '#';
  						
				  	$menu_return .= '<li rel="/public/images/'.$row['ICONO'].'" '.$current.' ><a href="'.$href.'">'.
						  			utf8_encode($row['DESCRIPCION']).'</a></li>';
  				}				
			}
			
			$menu_return .= ' </ul>
			<div style="font-size:9px; width:100px; position:absolute; top:5px; right:9px;">
    			<span class="ui-icon ui-icon-circle-close" title="Cerrar Sesi&oacute;n"></span>
   					<a href="index.php?m=login&amp;c=login&amp;md=lo" title="Salir del Portal">Cerrar Sesi&oacute;n</a>
    		</div>    
    		<div class="clearfix"></div>  
  			</div>';			
 			return $menu_return;
		}
		
		/**
		 * @Function Obtiene el menu principal del usuario
		 * @Params	 ID perfil
		 * @Return   Listado con menu 
		*/		
		function validar_menu($id_menu=null){
			global $db;
			$find_menu 	= '';
			if(isset($id_menu) && $id_menu!=Null){ $find_menu = ' AND ADM_MENU.ID_MENU = '.$id_menu;}
			
			$sql = "SELECT ADM_MENU.* 
					FROM ADM_MENU_TIPO 
					INNER JOIN ADM_MENU ON ADM_MENU_TIPO.ID_MENU = ADM_MENU.ID_MENU
					WHERE ADM_MENU_TIPO.ID_TIPO_USUARIO = ".$this->user_info['ID_TIPO_USUARIO']."
 					AND  ADM_MENU.TIPO = 'W'
 					$find_menu
					ORDER BY ADM_MENU_TIPO.ORDEN ASC
					LIMIT 1";
			$query = $db->sqlQuery($sql);
			$row = $db->sqlFetchArray($query);
			return $row['URL'];
		}
		
		/**
		 * @Function Valida si el usuario tiene permiso para acceder al modulo
		 * @Params	 ID perfil, Modulo
		 * @Return   Listado con menu 
		*/
		function validar_submenu($modulo=null,$return=null,$s_user=false){
			global $db;
			if(!$s_user){
				$sql = "SELECT *
						FROM ADM_PERFIL_PERMISOS 
						INNER JOIN ADM_SUBMENU ON ADM_PERFIL_PERMISOS.ID_SUBMENU = ADM_SUBMENU.ID_SUBMENU
						WHERE ADM_SUBMENU.UBICACION 			= '".$modulo."' 
	  					  AND ADM_PERFIL_PERMISOS.ID_PERFIL     = ".$this->user_info['ID_PERFIL']."
						LIMIT 1";
				$query = $db->sqlQuery($sql);
				$count = $db->sqlEnumRows($query);
				if($return==null){
					if($count==1){
						$row = $db->sqlFetchAssoc($query);
						$this->permisos_submenu($row['ID_SUBMENU']);
						$result = true;
					}else{
						$result = false;
						$sqlPE="SELECT * FROM ADM_USUARIOS_PERMISOS_MODULO WHERE ID_USUARIO='".$this->user_info["ID_USUARIO"]."' AND PERMISO=1";
						$res=$db->sqlQuery($sqlPE);
						if($db->sqlEnumRows($res) != 0){
							$row=$db->sqlFetchArray($res);
							$count=1;
						}else{
							$count=0;	
						}
					}
					$result = ($count==1) ? true: false;
				}else{
					$row = $db->sqlFetchArray($query);
					$result = $row['ID_MENU'];
				}							
			}else{
				$result = true;				
			}
			return $result;
		}
		
		/**
		 * @Function Obtiene el modulo principal a mostrar en cada menu
		 * @Params	 ID cliente, Id Menu
		 * @Return   Menu principal a mostrar
		*/		
		function obtener_modulo_prin($id_menu=null){
			global $db;
			
			$sql = "SELECT ADM_SUBMENU.UBICACION
					FROM ADM_SUBMENU_CLIENTES 
					INNER JOIN ADM_SUBMENU ON ADM_SUBMENU_CLIENTES.ID_SUBMENU = ADM_SUBMENU.ID_SUBMENU
					WHERE ADM_SUBMENU_CLIENTES.ID_CLIENTE 	= ".$this->user_info['ID_CLIENTE']."
 				      AND ADM_SUBMENU.ID_MENU 				= ".$id_menu."
					ORDER BY ADM_SUBMENU_CLIENTES.ORDEN ASC 
					LIMIT 1";
			$query = $db->sqlQuery($sql);
			$row = $db->sqlFetchArray($query);
			return $row['UBICACION'];			
		}		
		
		/**
		 * @Function Obtiene los permisos del usuario para el submenu ingresado.
		 * @Params	 ID Submenu.
		 * @Return   Arreglo con permisos del usuario.
		*/		
		function permisos_submenu($id_submenu){
			global $db;
					
			$sql_pu = "SELECT * 
					FROM ADM_USUARIOS_PERMISOS
					INNER JOIN ADM_PERMISOS ON ADM_USUARIOS_PERMISOS.ID_PERMISO = ADM_PERMISOS.ID_PERMISO
					WHERE ID_SUBMENU = ".$id_submenu." 
  					  AND ID_USUARIO = ".$this->user_info['ID_USUARIO'];
  			$query_pu = $db->sqlQuery($sql_pu);
  			$count_pu = $db->sqlEnumRows($query_pu);
  			if($count_pu>0){
  				$row = $db->sqlFetchAssoc($query_pu);
  			}else{
				$sql = "SELECT ADM_PERMISOS.* 
						FROM ADM_PERFIL_PERMISOS
						INNER JOIN ADM_PERMISOS ON ADM_PERFIL_PERMISOS.ID_PERMISO = ADM_PERMISOS.ID_PERMISO
						WHERE ID_SUBMENU = ".$id_submenu;
				$query = $db->sqlQuery($sql);  	
				$row = $db->sqlFetchAssoc($query); 			
  			}
  			
  			$this->permisos = $row; 
		}	
		
		/**
		 * @Function Obtiene los submenus 
		 * @Params	 ID cliente, Id Menu
		 * @Return   Menu principal a mostrar
		*/	
		function obtener_submenu($submenu=null){
			global $db;
			$id_menu = $this->validar_submenu($submenu,1);	
			$menu_return='<div id="submenu">
      						<h2>Opciones</h2>
      						<div id="accordion"><!-- SubMenu-->
        						<ol id="selectable" class="selector">';
			
			$sql = "SELECT *
					FROM ADM_SUBMENU_CLIENTES 
					INNER JOIN ADM_SUBMENU ON ADM_SUBMENU_CLIENTES.ID_SUBMENU = ADM_SUBMENU.ID_SUBMENU
					WHERE ADM_SUBMENU_CLIENTES.ID_CLIENTE 	= ".$this->user_info['ID_CLIENTE']."
 				      AND ADM_SUBMENU.ID_MENU 				= ".$id_menu."
					ORDER BY ORDEN ASC";
			$query = $db->sqlQuery($sql);
			while($row = $db->sqlFetchArray($query)){
				$enabled = ($row['UBICACION']==$submenu) ? 'ui-selected': '';
				$href 	 = ($row['UBICACION']!=$submenu) ? 'id="index.php?m='.$row['UBICACION'].'"': 'id="null"';
				$menu_return .= '<li class=" '.$enabled.
					'" '.$href.' >'.utf8_encode($row['DESCRIPTION']).'</li>';
			}
			$menu_return.=' </ol>
			    			</div> 
      						</div><!-- SubMenu -->';
 			return $menu_return;
		}
		
		function getHeaderAdmin($name,$prefix,$all=false){
			global $Functions;
			$b_nuevo 	= '';
			$h_permisos = '';
			$perm_wr = 0;
			$perm_up = 0;
			$perm_dl = 0;
			$perm_ex = 0;
			
			if($all==false){
				$perm_wr = $this->permisos['WR'];
				$perm_up = $this->permisos['UP'];
				$perm_dl = $this->permisos['DL'];
				$perm_ex = $this->permisos['EX'];
			}else{
				$perm_wr = 1;
				$perm_up = 1;
				$perm_dl = 1;
				$perm_ex = 1;				
			}
			
			$h_permisos = '<div><input type="hidden" id="'.$prefix.'_new" 	 value="'.$perm_wr.'">
				<input type="hidden" id="'.$prefix.'_update" value="'.$perm_up.'">
				<input type="hidden" id="'.$prefix.'_delete" value="'.$perm_dl.'">
				<input type="hidden" id="'.$prefix.'_export" value="'.$perm_ex.'"></div>';		
														
			if($perm_wr==1){				
				$b_nuevo = '<button id="'.$prefix.'_add" onClick="'.$prefix.'_edit_function(0)">Nuevo</button>';				
			}
			//$b_ayuda = '<button id="ayudaGeoreferencias" class="ui-state-default ui-corner-all" style="background:orange;color:#FFF;border:1px solid orange;" title="Ayuda"><span class="ui-icon ui-icon-help float_left"></span>Ayuda</button>';
			$header 	= '<div style="width:67%; float:left;border:1px solid #FF0000;">'.'<h3>'.$Functions->codif($name).'</h3></div>'.
        				'<div style="width:29%;  float:right;border:1px solid #FF0000;">'.$b_nuevo.'</div>';
			//$header="";
			return $header.$h_permisos;
		}
		
		/**
		 * @Function Obtiene el menu apra superadministrador 
		 * @Params	 ID perfil
		 * @Return   Listado con menu 
		*/		
		function obtener_menu_admin(){
			global $db;			
			$menu_return = '';
			
  			$sql = "SELECT UBICACION, DESCRIPTION 
					FROM ADM_SUBMENU 
					WHERE ADMIN_ROOT=1
					ORDER BY DESCRIPTION";
  			$query = $db->sqlQuery($sql);
			while($row = $db->sqlFetchArray($query)){					
			  	$menu_return .= '<li onclick="adm_abrir_modulo(\''.$row['UBICACION']
				  				.'\')" ><a href="#">'.
					  			utf8_encode($row['DESCRIPTION']).'</a></li>';
			}
						
 			return $menu_return;
		}			
}
?>
