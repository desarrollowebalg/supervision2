<?php
    print_r($_SESSION);
    
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <title>Movilizando.me - Aviso</title>
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
    overflow: hidden;
    margin: 0;
    font-family: sans-serif;
}
header{
    color: #FFF;
    background: #0071fc;/*03A9F4*/
    left:0px; /*A la derecha deje un espacio de 0px*/
    right:0px; /*A la izquierda deje un espacio de 0px*/
    top:0px; /*Abajo deje un espacio de 0px*/
    /*height:25px;*/ /*alto del div*/
    z-index:0;
    /*padding: 1.6em;*/
    font-size: 1.2em;
	box-shadow: 0px 3px 3px 0px rgba(0,0,0,0.55);
}
.contenedor{
    /*border:1px solid #FF0000;*/
    padding: 0;
    margin: 0;
    overflow:auto;
 	width: 99.9%;
 	height: calc(100% - 55px);
 	position: absolute;
 	border:none;
 	overflow: auto;   
}
.infoCliente{
	font-size: .8em;
    border: 0px solid #fff;
    padding: 1.5em 0;
    margin-left: 16px;
}
.infoUsuario{
	text-align: right;
    margin-right: 16px;
}
.estiloMsg{
    padding: 5em;
}
.titulo1{
    font-size: 1.2em;
    padding: .8em 0;
}
.titulo2{
    font-size: 1em;
    padding: .7em 0;
}
.titulo3{
    font-size: 1.1em;
    font-weight: bold;
    text-align: center;
    padding: 5em 0;
}
.enlaceLogin{
    color: #fff;
}
.enlaceLogin:hover{
    cursor: pointer;
    text-decoration: underline;
}
</style>
</head>

<body>
    <header>
        <div class="ed-container full">
            <div class="ed-item no-padding base-50">
                <div class="infoCliente">Movilizando.me - Aviso</div>
            </div>
            <div class="ed-item no-padding base-50">
                <div class="infoCliente infoUsuario"><div><a href="javascript:history.back()" class="enlaceLogin">Login</a></div></div>
            </div>
        </div>
    </header>
    <section class="estiloMsg">
        <div class="ed-container">
            <div class="ed-item">
                <div class="titulo1">Estimado Cliente:</div>
            </div>
            <div class="ed-item">
                <div class="titulo2">Ha ocurrido un problema al verificar la información.</div>
            </div>
            <div class="ed-item">
                <div class="titulo2">Le agradecemos se comunique a los teléfonos: (55) 55 62 62 88 o (55) 63 94 11 84 para aclarar este inconveniente.</div>
            </div>
            <div class="ed-item">
                <div class="titulo3">Equipo ALG - Movilizando.me</div>
            </div>
        </div>
    </section>
 
</body>
</html>