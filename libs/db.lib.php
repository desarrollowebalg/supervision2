<?php

/**
 * 
 * 	@package Reportes 4ToGo.net
 * 	@author Alberto Rojas Bravo
 * 	@copyright Air Logistics & GPS S.A. de C.V.
 * 	@license GNU
 * 
 */

	if($config['sqlDriver'] == 'mysql'){
		include 'libs/db/mySqlDriver.php';
		
		class sql Extends mySqlDriver{}
		
	}elseif($config['sqlDriver'] == 'pgsql'){
		include 'libs/db/pgSqlDriver.php';

		class sql Extends pgSql{}

	}else{
		die('Libreria <b>sqlDriver</b> invalida.');
	}
?>