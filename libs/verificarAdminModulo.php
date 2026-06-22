<?php
  /**
   * La siguiente funcion sirve para verificar el perfil y la sesion administrativa en la plataforma de administracion
   * lo unico que devuelve la funcion es un booleano
   * si el usuario es administrador de la plataforma y el perfil es el administrador del sistema y el numero del modulo es 106
   * el parámetro que recibe es el numero de menu en el cual se está accediendo
   */
  session_start();
  function verificarProfileAdmin($isAdmin){    
    $valido = false;
    if ($isAdmin == "106") {
      // Condición para el perfil 113 con plataforma ADMIN
      if ($_SESSION["ID_PROFILE"] == "113" && $_SESSION["PLATTFORM"] == "ADMIN") {
        $valido = true;
      }else if ($_SESSION["ID_PROFILE"] == "169") {// Condición para el perfil 169 con plataforma ADMIN
        $valido = true;
      }
    }
    return $valido;
  }
?>