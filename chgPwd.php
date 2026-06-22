<?php
	error_reporting(E_ALL);
	ini_set('display_errors', '0');
	date_default_timezone_set('America/Mexico_City');
	include "apis_me/genToken.php";
	session_start();
	$msgValidacion="";
	$token="";
	if($_GET){		
		$usuario=$_GET["c"];
		$idUsuario=$_GET["i"];
		$usuario=base64_encode($usuario);
		$idUsuario=base64_encode($idUsuario);
		$payload=$usuario."^||^".$idUsuario;
		$payload=base64_encode($payload);
		$token=Auth::SignIn($payload);		
	}
	
	if($_POST){		
		include "apis_me/validaPassword.php";
		$objPass = new validaPassword();		
		try {			
			$token=$_GET["t"];
			$pass1=trim($_POST["txtPass1"]);
			$pass2=trim($_POST["txtPass2"]);
			
			$payload=Auth::GetData($token);
			$payload=base64_decode($payload);
			$payload=explode("^||^",$payload);

			$usuario=base64_decode(base64_decode($payload[0]));
			$idUsuario=base64_decode(base64_decode($payload[1]));			
			$msgValidacion="";			

			if(($pass1=="") && ($pass2=="")){
				$msgError="2";
				$msgValidacion="Los campos de contraseña no pueden ir vacios";
			}
	
			if((int)strcmp($pass1,$pass2)==1){
				$msgError="2";
				$msgValidacion="Las contraseñas no coinciden";
			}

			if($msgError!="2"){
				$msgValidacion=$objPass->validar_clave($pass1,"1");
		
				if($msgValidacion==1){
					$r=updatePassWdUser($idUsuario,$pass1);
					if($r==1){
						$msgValidacion="Password actualizado";
						header("Location: https://app.movilizandome.net/");
						exit();
					}
				}
			}
		} catch (\Throwable $th) {
			//throw $th;			
			echo "<h1>Acceso no valido, de clic en el enlace para entrar a la plataforma</h1>";
			echo "<a href='https://app.movilizandome.net/'>Ir a la plataforma</a>";
			die();
		}
	}

	function updatePassWdUser($idUsuario,$pass){		
		include "config/database.php";
		$r=0;
		$objBd=conectarServer($config_bd);
		//echo "<br><br>Se actualiza el password<br><br>";
		$fecha=date("Y-m-d")." ".date("H:i:s");		
		$sql="UPDATE ADM_USUARIOS SET SHA1_PASSWORD='".sha1($pass)."',PASSWORD='".$pass."',LAST_UPDATE_DATE='".$fecha."' WHERE ID_USUARIO='".$idUsuario."'";
		//echo $sql;
		$res=ejecutarQuery($sql,$objBd);
		if(mysqli_affected_rows($objBd) > 0 ){
			//echo "Password actualizado";
			// $msgValidacion="Password actualizado";
			$r=1;
		}
		return $r;
	}

	function conectarServer($config_bd){		
		$objBd = mysqli_connect($config_bd["host"], $config_bd["user"], $config_bd["pass"], $config_bd["bname"], $config_bd["port"]);
		if(!$objBd)
			echo "Error al realizar la conexion con la base de datos";
		return $objBd;
	}

	/**@description 	Funcion que ejecuta el query en la base de datos*/
	function ejecutarQuery($sql,$objBd){
		$sql=@mysqli_query($objBd,$sql);
		if(!$sql){
			echo "Error no.".mysqli_errno($this->objBd);
		}else{
			return $sql;
		}
	}
	function regresaResultados($result){/**@description 	Funcion que regresa el resultado de la consulta*/
		return @mysqli_fetch_array($result);
	}		
	function numeroRegistros($result){/**@description 	Funcion que retorna el numero de registros del query ejecutado*/
		return @mysqli_num_rows($result);
	}
	function liberarResultado($result){/**@description 	Funcion que libera de memoria el resultado de la consulta*/
		return @mysqli_free_result($result);
	}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Movilizandome - App</title>
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <link rel="stylesheet" href="public/css/ed-grid.css" type="text/css" />
<style type="text/css">
	@import url(http://fonts.googleapis.com/css?family=Open+Sans:400,300,700,600,800);
	*,
	*:before,
	*:after {
		box-sizing: border-box; }

	img {
		max-width: 100%;
		height: auto; }

	a {
		text-decoration: none; }

	body{
		padding: 0;
		height: 100%;
		overflow-x: hidden;
		margin: 0;
		font-family: Verdana;
		font-size:16px;
	}
	header{
		color: #FFF;
		background: #2196f3;/*03A9F4*/
		left:0px; /*A la derecha deje un espacio de 0px*/
		right:0px; /*A la izquierda deje un espacio de 0px*/
		top:0px; /*Abajo deje un espacio de 0px*/		
		z-index:0;		
		font-size: 1.2em;
		box-shadow: 0px 3px 3px 0px rgba(0,0,0,0.55);
	}
	.infoCliente{
		font-size: 1.2rem;
		border: 0px solid #fff;
		padding: 25px 0;
		margin-left: 16px;
	}
	.estiloMsg{
		padding: 5em;
	}
	.titulo1{
		font-size: 2rem;
		padding: .8em 0;
	}
	.titulo2{
		font-size: 1em;
		padding: .7em 0;
	}
	.titulo3{
		font-size: 1.1em;
		font-weight: 500;
		text-align: center;
		padding: 5em 0;
		color: #c1c1c1;
	}	
	.btnForm{
		background: #2196f3;
		border: 0;
		padding: 15px 50px;
		width: 250px;
		color: #FFF;
		border-radius: 5px;
		font-size:1rem;
		display: inline-block;
		text-align: center;
	}
	.btnForm:hover{
		background:rgba(33,150,243,.9);
	}
	.espaciadoElementos{
		justify-content: center;
		display: flex;
		padding: 100px 0;
	}
	.espaciadoElementosBtn{
		margin-bottom:30px;
	}
	.tituloFormChg{
		font-size: 1.2rem;
		display: block;		
	}
	.elementoInputFrm{
		font-size: 1.4rem;
		border: 1px solid #CCC;
		border-radius: 5px;
		background: #f0f0f0;
		padding: 5px 0;
	}
	.espaciadoTop{
		margin-top: 10px;
	}
	.btnForm{
		background: #2196f3;
		color: #FFF;
		border: 0;
		padding: 15px 20px;
		font-size: 1.2rem;
		border-radius: 5px;
	}
	.alinearCentro{
		text-align:center;
	}
	.margenTop{
		margin-top: 30px;
	}
</style>
</head>
<body>
    <header>
        <div class="ed-container full">
            <div class="ed-item no-padding base-100">
                <div class="infoCliente">Movilizando.me</div>
            </div>            
        </div>
    </header>
    <form action="<?=$_SERVER["PHP_SELF"]?>?action=chgP&t=<?=$token?>" method="post">			
			<section class="estiloMsg">
				<div class="ed-container">
					<div class="ed-item">
						<p><?=$msgValidacion;?></p>
					</div>
					<div class="ed-item">
						<div class="titulo1 espaciadoElementosBtn">Actualice su contraseña</div>
					</div>					
					<div class="ed-item base-100 tablet-30 espaciadoElementosBtn">
						<span class="tituloFormChg espaciadoElementosBtn espaciadoTop">Contraseña nueva</span>
					</div>
					<div class="ed-item base-100 tablet-70 espaciadoElementosBtn">
						<input type="password" name="txtPass1" id="txtPass1" class="elementoInputFrm">
					</div>
					<div class="ed-item base-100 tablet-30 espaciadoElementosBtn">
						<span class="tituloFormChg espaciadoTop">Repetir contraseña</span>
					</div>
					<div class="ed-item base-100 tablet-70 espaciadoElementosBtn">
						<input type="password" name="txtPass2" id="txtPass2" class="elementoInputFrm">
					</div>
					<div class="ed-item base-100 alinearCentro margenTop">
						<input type="submit" value="Actualizar contraseña" class="btnForm" >
					</div>
				</div>
			</section>
    </form>
</body>
</html>