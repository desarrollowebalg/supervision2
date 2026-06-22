<?php

/**
 * 
 * 	@package Reportes 4ToGo.net
 * 	@author Alberto Rojas Bravo
 * 	@copyright Air Logistics & GPS S.A. de C.V.
 * 	@license GNU
 * 
 */

	class mySqlDriver{

		public $dbname;
		public $dbuser;
		public $dbhost;
		public $dbport;
		public $dbconn;

		public function __construct($dbhost, $dbport, $dbname, $dbuser, $dbpass){
			$this->dbhost = $dbhost;
			$this->dbname = $dbname;
			$this->dbuser = $dbuser;
			$this->dbpass = $dbpass;

			if($dbport == null):
				$this->dbport = 3306;
			else:
				$this->dbport = $dbport;
			endif;

			$this->dbconn = @mysqli_connect($this->dbhost, $this->dbuser, $this->dbpass, $this->dbname, $this->dbport);

			if(mysqli_connect_errno() != 0):
				$txt="Error no.:".mysqli_connect_errno($this->dbconn)." MySQL db ha dicho: ".mysqli_connect_error()."";
				$this->logErrores($txt);
				return false;
			else:
				return true;
			endif;
		}

		public function sqlQuery($query){
			$sql = $query;

			if($query):
				unset($query);
			endif;

			$query = @mysqli_query($this->dbconn, $sql);

			if(!$query):
				$txt="Error no.:".mysqli_connect_errno($this->dbconn)." MySQL db ha dicho: ".mysqli_connect_error()."";
				$this->logErrores($txt);
				return false;
			else:
				return $query;
			endif;
		}

		public function sqlFetchArray($result){
			$row = array();

			if($row):
				unset($row);
			endif;

			$row = @mysqli_fetch_array($result);

			return $row;
		}

		public function sqlEnumRows($result){
			$enum = @mysqli_num_rows($result);

			return $enum;
		}

		public function sqlFreeResult($result){
			return @mysqli_free_result($result);
		}
		
		public function sqlClose(){
			return mysqli_close($this->dbconn);
		}
		
		public function sqlFetchAssoc($result){
			$row = array();

			if($row):
				unset($row);
			endif;

			$row = @mysqli_fetch_assoc($result);

			return $row;
		}
		public function sqlFetchFields($result){
			return @mysqli_fetch_fields($result);
		}
		public function sqlFetchAll($result){
			return @mysqli_fetch_all($result,MYSQLI_ASSOC);
		}
		public function logErrores($texto){
      		$nombreArchivo="log_Gral_".date("Y_m_d").".txt";
      		$path="public/Logs/".$nombreArchivo;
         	$file = fopen($path, "a+");//se abre el archivo para escritura
         	$mensajeError="";
         	$mensajeError.=date("Y-m-d")." ".date("H:i:s")."\t".print_r($texto,1);
         	fwrite($file, $mensajeError . PHP_EOL);
         	fclose($file);//se cierra el archivo
    	}	
	}
?>