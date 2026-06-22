<?php
/** * 
 *  @package             4TOGO
 *  @name                Obtiene la ultima pocision de las unidades de la BD 192.168.6.45
*   @version             1
*   @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Enrique Peña 
 *  @modificado          02-12-2010 
**/
class claseFunciones{
	
	private $objDb;
	private $host;
	private $port;
	private $bname;
	private $user;
	private $pass;
	private $conectar;
	private $db_seleccionada;

	function __construct() {
	   
/*   		$rutaBase = str_replace("libs","config/database.php",str_replace("\\","/",dirname(__FILE__)));
	    include $rutaBase;

		$this->host =$config_bd['host'];
		$this->port =$config_bd['port'];
		$this->bname=$config_bd['bname'];
		$this->user =$config_bd['user'];
		$this->pass =$config_bd['pass'];*/	
		
	     $this->port = '3306';			        //Puerto de la base de datos
		 $this->host = '188.138.16.27';		        //Host o ip donde se ubica la base de datos
		 $this->bname='ALG_BD_CORPORATE_MOVI';	//Nombre  de la base de datos
		 $this->user = 'savl';			        //usuario de la base de datos 
		 $this->pass = '$s4v1XX0$';		
		
	   	}
	
	 public function contruirFuncion($nombreFuncion,$arregloVariables){

	    $this->conectar        = mysql_connect($this->host,$this->user, $this->pass);
	    $this->db_seleccionada = mysql_select_db($this->bname,$this->conectar);
		
		foreach ($arregloVariables as $indiceArreglo => $valoresArreglo){  //se utiliza la crecion de variables dinamicas para cada metodo, y asi evitar definirlas desde inicio y desperdiciar memoria
		         ${$indiceArreglo} = $valoresArreglo;
		}

        if($nombreFuncion == 'tareas'){   // se filtran para buscar la funcion adecuada
	
				$sql = 'INSERT INTO DSP2_TAREAS (ID_CLIENTE,
											  FECHA_CAPTURA,
											  ITEM_NUMBER,
											  NOMBRE_TAREA,
											  DESCRIPCION,
											  FECHA_PROGRAMADA,
											  ID_FORMULARIO,
											  ID_PRIORIDAD,
											  ORDEN,
											  DIRECCION,
											  LATITUD,
											  LONGITUD,
											  SEMANA_ANIO,
											  ID_USUARIO_CREO,
											  ITEM_NUMBER_PDI,
											  ID_RESPONSABLE_TAREA,
											  ORIGEN_TAREA,
											  AUX1
											) VALUES '.str_replace("\'","'",$cadenaInsertar);
											
					  $respuesta = mysql_query($sql,$this->conectar);	
		   			  if($respuesta){/////////////////*******************
						  //$resultado = 1; 
					       
				      $sql_x2 = 'SELECT ID_TAREA,ITEM_NUMBER FROM DSP2_TAREAS WHERE ITEM_NUMBER IN ('.$itemBuscar.') AND ID_CLIENTE = '.$idCliente; 
					  $res_query2 = mysql_query($sql_x2,$this->conectar) or die(mysql_error().''.$sql_x2);	
					  $cantidad2  = mysql_num_rows($res_query2);							
					  $cadena_captura = '';
					  
					  if($cantidad2>0){
			
									while($registros = mysql_fetch_array($res_query2)){
										if($cadena_captura ==''){
												$cadena_captura = '("'.$registros['ID_TAREA'].'","'.$idUsuario.'","4")';
										}else{
												$cadena_captura .= ',("'.$registros['ID_TAREA'].'","'.$idUsuario.'","4")';
										}
									}
				   
								$sql_x3 = 'INSERT INTO DSP2_CAPTURA (ID_TAREA,ID_USUARIO,ID_STATUS) VALUES '.$cadena_captura.';'; 
								$res_query3 = mysql_query($sql_x3,$this->conectar);
					  
							  if($res_query3){
								  $sql_x4 = 'INSERT INTO DSP2_CARGAS (FECHA_CARGA,ID_CLIENTE) VALUES("'.date('Y-m-d G:H:s').'","'.$idCliente.'")';
										  $res_query4 = mysql_query($sql_x4,$this->conectar);
											 if($res_query4){
												 $resultado =  1;  
											 }else{
												 $resultado = mysql_error().' '.$sql_x4;  
											 }
							  }else{
								  $resultado = mysql_error().''.$sql_x3;  
							  }
					  }else{
								 $resultado = 'no hay datos en DSP2_TAREAS';
					  }
			
			  }else{//******************************************
						  $resultado =mysql_error().'-'.$sql.'|'.$this->bname;
			 }		
			
				  return  $resultado;	
 }	 
	    if($nombreFuncion == 'avisoAndroid'){
				$url = "http://movi.2gps.net/apis_movi/Push.php";  
				$ttl = "Nueva Tarea";
				$msj = "La tarea ha sido asignada a usted.";
				$cmd = "typ:1|opt:1|tab:4";
				$dev = $usuNoti;
				$sub = '';
				
				$parametros="ttl=".$ttl."&msj=".$msj."&sub=".$sub."&cmd=".$cmd."&dev=".$dev;
				
				$handler = curl_init();  
				curl_setopt($handler, CURLOPT_URL, $url);  
				curl_setopt($handler, CURLOPT_POST,true);  
				curl_setopt($handler, CURLOPT_POSTFIELDS, $parametros);  
				curl_setopt($handler, CURLOPT_RETURNTRANSFER,true);
				$response = curl_exec ($handler);  
				$error    = curl_error($handler);
				curl_close($handler);  
				
						 
				
						if($response){
						  // $texto= 'Se ha enviado la tarea al usuario';
						   $enviado = 1;
						}else{
						   $enviado = 0;	
						}
					
				//	echo mensajeCambio($texto);
					return  $enviado;
		}
		
		if($nombreFuncion == 'enviarMail'){
			 
		include("smtp/class.phpmailer.php"); //Importamos la función PHP class.phpmailer
	    include 'smtp/PHPMailerAutoload.php';

			$mail = new PHPMailer();
			
			//Luego tenemos que iniciar la validación por SMTP:
			$mail->IsSMTP();
			$mail->SMTPAuth = true; // True para que verifique autentificación de la cuenta o de lo contrario False
			$mail->Username="tickets_alerta@airlogisticsgps.com";
			$mail->Password="1qa2ws";
			
			
			$mail->Host     = "airlogisticsgps.com";
			$mail->From     = $from;
			$mail->FromName = $fromName;
			$mail->Subject  = $asunto;
			
			foreach($destinatarios as $email => $name){
			   $mail->AddAddress($email, $name);
			}
			
			if($cc == 1){
				$destinatariosCC = array();
				$destinatariosCC = arregloDestinatarios($idFolio,'wf');
				
				foreach($destinatariosCC as $email2 => $name2){
				  $mail->AddCC($email2, $name2);
				}
				
			}
			//$mail->AddAddress("darsa760707@gmail.com","danilo");
			//$mail->AddBCC("darsa760707@gmail.com","danilo");
			
			$mail->WordWrap = 50;
			
			$body  = $cuerpo;
			
			$mail->Body = $body.$cc;
			$mail->IsHTML(true);
			$mail->Send();
			
			
			// Notificamos al usuario del estado del mensaje
			
				if(!$mail->Send()){
				  // echo "No se pudo enviar el Mensaje.".$recipients;
				   return 0;
				}else{
				   //echo "Mensaje enviado";
				   return 1;
				}	
			}

    }
	
	 public function contruirFuncionV2($nombreFuncion,$parametros){
	    $this->conectar        = mysql_connect($this->host,$this->user, $this->pass);
	    $this->db_seleccionada = mysql_select_db($this->bname,$this->conectar);
	
	    if($nombreFuncion === 'tareas2'){   // se filtran para buscar la funcion adecuada
				 $sql = 'INSERT INTO DSP2_TAREAS ('.$parametros['cadenaInsertCamposTarea'].') VALUES ('.str_replace("\'","'",$parametros['cadenaInsertValoresTarea']).')';
											
					  $respuesta = mysql_query($sql,$this->conectar);	
		   		 
				  if($respuesta){
		            
				      $sql_x2 = 'SELECT ID_TAREA,ITEM_NUMBER FROM DSP2_TAREAS WHERE ITEM_NUMBER IN ("'.$parametros['item_number'].'") AND ID_CLIENTE = '.$parametros['datosClienteTarea']; 
					  $res_query2 = mysql_query($sql_x2,$this->conectar) or die(mysql_error().''.$sql_x2);	
					  $cantidad2  = mysql_num_rows($res_query2);							
					  $cadena_captura = '';
					  
					  if($cantidad2>0){
			          
									while($registros = mysql_fetch_array($res_query2)){
										if($cadena_captura ==''){
												$cadena_captura = '("'.$registros['ID_TAREA'].'","'.$parametros['idUsuario'].'","4")';
										}else{
												$cadena_captura .= ',("'.$registros['ID_TAREA'].'","'.$parametros['idUsuario'].'","4")';
										}
									}
				   
								$sql_x3 = 'INSERT INTO DSP2_CAPTURA (ID_TAREA,ID_USUARIO,ID_STATUS) VALUES '.$cadena_captura.';'; 
								$res_query3 = mysql_query($sql_x3,$this->conectar);
					  
							     if($res_query3){
								   $resultado =  1;  
								 }else{
								  $resultado = mysql_error().''.$sql_x3;  
							    }
					  }else{
								 $resultado = 'no hay datos en DSP2_TAREAS';
					  }
			
				   }else{
							  $resultado =mysql_error().'-'.$sql.'|'.$this->bname;
				   }		
			
				  return  $resultado;
 }	
	 }
}
?>
