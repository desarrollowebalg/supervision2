<?php
	class IEgd {
		
		public function IEth($file, $max, $quality, $destiny){
				$dimension = getimagesize($file);
 
      			ereg("([A-Za-z0-9\.\_\-]{1,50})/([A-Za-z0-9\.\_\-]{1,50})\.([A-Za-z]{1,5})",$file, $name);
      
   				$ext = strtolower($name[3]);

    			if($dimension[0] > $dimension[1]){
      			# Imagen Orizontal
        			$thumb_w = $max;
        			$thumb_h = intval(($dimension[1]/$dimension[0])*$max);
    			}elseif($dimension[0] < $dimension[1]){
      			#Imagen Vertical        
        			$thumb_w = intval(($dimension[0]/$dimension[1])*$max);
        			$thumb_h = $max;
    			}elseif($dimension[0] == $dimension[1]){
      			#Imagen Cuadrada
        			$thumb_w = $max;
        			$thumb_h = $max;
    			}

         		switch($ext){
              		case "jpg":
              			#Creacion de la Imagen JPG
                    $nueva = imagecreatefromjpeg($file);
              			$thumb = imagecreatetruecolor($thumb_w,$thumb_h);
              			imagecopyresampled($thumb,$nueva,0,0,0,0,$thumb_w,$thumb_h,$dimension[0],$dimension[1]);
              			if(!imagejpeg($thumb,$destiny.'serv_'.$name[2].'.'.$name[3],$quality)):
                      $error = "si";
                    endif;
              		break;
              		case "jpeg":
              			#Creacion de la Imagen JPEG
              			$nueva = imagecreatefromjpeg($file);
              			$thumb = imagecreatetruecolor($thumb_w,$thumb_h);
              			imagecopyresampled($thumb,$nueva,0,0,0,0,$thumb_w,$thumb_h,$dimension[0],$dimension[1]);
              			if(!imagejpeg($thumb,$destiny.'serv_'.$name[2].'.'.$name[3],$quality)):
                      $error = "si";
                    endif;
              		break;
              		case "png":
              			#Creacion de la imagen PNG
              			$nueva = imagecreatefrompng($file);
              			$thumb = imagecreatetruecolor($thumb_w,$thumb_h);
              			imagecopyresampled($thumb,$nueva,0,0,0,0,$thumb_w,$thumb_h,$dimension[0],$dimension[1]);
                    if(!imagepng($thumb,$destiny.'serv_'.$name[2].'.'.$name[3],$quality)):
                      $error = "si";
                    endif;
              		break;
              		case "gif":
              			#Creacion de la imagen GIF
              			$nueva=imagecreatefromgif($file);
              			$thumb = imagecreatetruecolor($thumb_w,$thumb_h);
              			imagecopyresampled($thumb,$nueva,0,0,0,0,$thumb_w,$thumb_h,$dimension[0],$dimension[1]);
              			if(!imagegif($thumb,$destiny.'serv_'.$name[2].'.'.$name[3],$quality)):
                      $error = "si";
                    endif;
              		break;
      			}
      			if($error == "si")
              return false;
            else
              return true;
		}

		public function IErkey(){
			$raiz = array('a','b','c','d','e','b','g','b','i','j','k','l','m','n','o','p','k','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','1','2','3','4','5','6','7','8','9','10');
			srand((double)microtime()*100000000);
			$ca = array_rand($raiz,5);
			$frase = $raiz[$ca[0]].$raiz[$ca[1]].$raiz[$ca[2]].$raiz[$ca[3]].$raiz[$ca[4]];
			
			return $frase;
		}
	
		public function IECaptcha ($frase){
			
			$img = imagecreate(250, 100);
	
			$r = rand(0,100);
			$g = rand(0,100);
			$b = rand(0,100);
	
			$r1 = rand(101,150);
			$g1 = rand(101,150);
			$b1 = rand(101,150);
	
			$r2 = rand(151,255);
			$g2 = rand(151,255);
			$b2 = rand(151,255);
	
			$color1 = imagecolorallocate($img, $r,$g,$b);
			$color2 = imagecolorallocate($img, $r1,$g1,$b1);
	
			$font = array('fonts/anmari.ttf','fonts/porkys.ttf');
			$rfont = array_rand($font);
	
			$start_x = rand(20,40);
			$start_y = rand(70,80);
			$angle = rand(-10,10);
	
			imagerectangle($img, 0,0,249,99, $color1);

			imageTTFtext($img, 36, $angle, $start_x, $start_y, $color2, $font[$rfont], $frase);

	
			header("Content-Type: image/png");
			imagepng($img);
		}
	}
?>