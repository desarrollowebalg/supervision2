<?php
/**
*@name 				Controlador para algunas funciones en usuarios
*@copyright         Air Logistics & GPS S.A. de C.V.  
*@author 			Gerardo Lara
*/

  session_start();
  
  // si no existe la sesion de usuario se regresa a login
  if(!isset($_SESSION['ID_USUARIO'])){
    header("Location: /login/default");
    exit();
  }

  switch($_GET["i"]){
    case 'getUser':
      if (isset($_SESSION['ID_USUARIO'])) {
        $defaultAvatar = 'https://app.movilizandome.net/public/images/userDesc.png';
        $idUsuario = $_SESSION['ID_USUARIO'];
        $usuario = isset($_SESSION['USUARIO']) && !empty($_SESSION['USUARIO']) ? $_SESSION['USUARIO'] : (string)$idUsuario;
        $nombreCompleto = isset($_SESSION['NOMBRE_COMPLETO']) && !empty($_SESSION['NOMBRE_COMPLETO']) ? $_SESSION['NOMBRE_COMPLETO'] : $usuario;
        $fotoPerfil = isset($_SESSION['URL_FOTO_PERFIL']) && !empty($_SESSION['URL_FOTO_PERFIL']) ? $_SESSION['URL_FOTO_PERFIL'] : $defaultAvatar;

        echo json_encode([
          'success' => true,
          'user' => [
            'id' => $idUsuario,
            'usuario' => $usuario,
            'nombre_completo' => $nombreCompleto,
            'foto_perfil' => $fotoPerfil
          ]
        ]);
      } else {
        echo json_encode([
          'success' => false
        ]);
      }
    break;  
  }

?>
