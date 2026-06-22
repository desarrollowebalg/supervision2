<?php
/**
 * componente filtro pdis
 */
	// session_start();
	// echo "<pre>";
	// print_r($userAdmin);
	// echo "</pre>";
	// exit();
	if($_SERVER["HTTP_REFERER"]==""){
		echo "error"; exit();
	}else{
		if($_POST["a"]=="filter"){
			// echo "<pre>";
			// print_r($_POST);
			// echo "</pre>";
			// exit();
			$idCliente=(int)$_POST["c"];
			$filtro=base64_decode($_POST["f"]);
			$regsEmpezar=$_POST["start"];
			$resXpag=$_POST["regs"];
			$props=json_decode($_POST["props"],true);
			// echo "<pre>";
			// print_r($props);
			// echo "</pre>";
			// exit();
			include "../../../config/database.php";
			$objBd = mysqli_connect($config_bd["host"],$config_bd["user"],$config_bd["pass"],$config_bd["bname"],$config_bd["port"]);

			if(!$objBd){
				$mensajex["error"]="1";
				$mensajex["descError"]="Error al realizar la conexion con la base de datos";      
			}else{
				$mensajex=array("error"=>"","descError"=>"","regs"=>"0","data"=>"");
				$excepcion="";
				if($props["excepciones"] && $props["detalleexcepciones"][0]["ignorarids"]!=""){					
					$idsIgnorar=$props["detalleexcepciones"][0]["ignorarids"];					
					$excepcion=" AND ID_USUARIO NOT IN ($idsIgnorar)";					
				}				
				if($filtro=="N/A"){					
					$sqlUserTotal="SELECT COUNT(*) as TOTAL FROM ADM_USUARIOS WHERE ID_CLIENTE = '".$idCliente."' AND ESTATUS='Activo' $excepcion";
					$sqlUSERS="SELECT 
					ID_USUARIO,
					NOMBRE_COMPLETO AS 'NOMBRE',
					USUARIO AS 'USUARIO',
					URL_FOTO_PERFIL AS 'FOTO'
					FROM ADM_USUARIOS 
					WHERE ID_CLIENTE = '".$idCliente."' AND ESTATUS='Activo' $excepcion
					LIMIT $regsEmpezar,$resXpag";
				}else{
					$sqlUserTotal="SELECT COUNT(*) as TOTAL FROM ADM_USUARIOS WHERE ID_CLIENTE = '1' AND ESTATUS='Activo' AND (ADM_USUARIOS.USUARIO LIKE '%".$filtro."%' OR (ADM_USUARIOS.NOMBRE_COMPLETO LIKE '%".$filtro."%')) $excepcion";					
					$sqlUSERS="SELECT 
					ID_USUARIO,
					NOMBRE_COMPLETO AS 'NOMBRE',
					USUARIO AS 'USUARIO',
					URL_FOTO_PERFIL AS 'FOTO',
					ID_CLIENTE
					FROM ADM_USUARIOS 
					WHERE ID_CLIENTE = '".$idCliente."' AND ESTATUS='Activo' AND (USUARIO LIKE '%".$filtro."%' OR (NOMBRE_COMPLETO LIKE '%".$filtro."%')) $excepcion
					LIMIT $regsEmpezar,$resXpag";
				}
				// echo $sqlUserTotal."<br>".$sqlUSERS;
				// exit();
				$resultFORMT=mysqli_query($objBd,$sqlUserTotal);
				$rowFORMT=mysqli_fetch_array($resultFORMT);    
				$totalFORM=(int)$rowFORMT["TOTAL"];
				//echo "total pdi's => ".$totalFORM;
				mysqli_query($objBd,"SET NAMES 'utf8'");
				$resultPDI=mysqli_query($objBd,$sqlUSERS);
				if(mysqli_num_rows($resultPDI) > 0){
					$rowU=mysqli_fetch_all($resultPDI,MYSQLI_ASSOC);
					// echo "<pre>";
					// print_r($rowU);
					// echo "</pre>";
					$mensajex["regs"]=$totalFORM;
					$mensajex["data"]=json_encode($rowU);
				}else{			
					$mensajex["error"]="1";
					$mensajex["descError"]="Ocurrió un error al extraer los formularios asociados";
				}
			}
		}
		echo json_encode($mensajex);
	}
?>