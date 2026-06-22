<?php
/** * 
 *  @package             
 *  @name                Script que logea al usuario  
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Enrique Pe�a 
 *  @modificado          26/04/2011
**/	
	
	$db = new sql($config_bd['host'],$config_bd['port'],$config_bd['bname'],$config_bd['user'],$config_bd['pass']);

	if(isset($_POST['md'])){		
		if($_POST['md']=='lg'){//Login
			$response = array('result'=>'1');
			if(isset($_POST['vuname']) && isset($_POST['vpass'])){			
				$userName = $_POST['vuname'];
				$userPass = $_POST['vpass'];
				$response['result'] = $userAdmin->f_userlogin($userName,$userPass);
				if($response['result']==1){
				   $response['url'] = 'inicio';
					 $response['i'] = base64_encode($_SESSION["s_id_asistencias"]);
				}
			}else{
				$response['result'] = 0;
			}
			
			echo json_encode( $response );
		}	
	}else if($_GET['md']=='lo'){//Logout
		$userAdmin->log_out();
    // echo '<script>window.location="index.php?m=login"</script>';
		// header("Location: /login/default");
		$response = array('result'=>false, 'message'=>'Sesión cerrada');
		echo json_encode( $response);
		exit();
	}
?>
