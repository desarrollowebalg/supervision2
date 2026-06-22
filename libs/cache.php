<?php
class cache{

  public $cache_dir;
  public $cache_time;
  public $caching = false;
  public $cleaning = false;
  public $file = '';

  public function start($path='',$time,$action=NULL,$ip,$loged){
    global $_SERVER;
    if($loged == 'no-loged'){
      $this->cache_dir = $path;
      $this->cache_time = $time;
      $this->cleaning = $action;
      $this->file = $this->cache_dir."cache_".SHA1(urlencode($_SERVER['REQUEST_URI']).$ip)."no-loged.cache"; //md5, encriptado por seguridad

      if (file_exists($this->file) && (fileatime($this->file)+$this->cache_time)>time() && $this->cleaning == false){
        readfile($this->file);
        exit();
      }else{
        $this->caching = true;
      ob_start();
      }
    }else{
      $this->cache_dir = $path;
      $this->cache_time = $time;
      $this->cleaning = $action;
      $this->file = $this->cache_dir."cache_".SHA1(urlencode($_SERVER['REQUEST_URI']).$ip)."loged.cache"; //md5, encriptado por seguridad

      if (file_exists($this->file) && (fileatime($this->file)+$this->cache_time)>time() && $this->cleaning == false){
        readfile($this->file);
        exit();
      }else{
        $this->caching = true;
      ob_start();
      }
    }
  }

  public function close(){
    if ($this->caching){
      $data = ob_get_clean();
      echo $data;
      if(file_exists($this->file)){
          unlink($this->file);
      }
      $fp = fopen( $this->file , 'w' );
      fwrite ( $fp , $data );
      fclose ( $fp );
    }
  }

  public function cachingSql($sql, $time, $path, $security_code, $name){
      global $db;

      $records = array();
      $file = $path.'sql_cache_'.SHA1($_SERVER['REMOTE_ADDR'].$security_code).$name.'.cache';

      if(file_exists($file) && fileatime($file) + $time >= time()){
          $records = unserialize(implode('',file($file)));
          return $records;
      }else{
          if(file_exists($file)){
              unlink($file);
          }
          $query = $db-> sqlQuery($sql);
          if($query){
              while($row = $db-> sqlFetchArray($query)){
                  $records[] = $row;
              }
             $output = serialize($records);
             $fp = fopen($file,'x');
             fputs($fp, $output);
             fclose($fp);

             return $records;
          }
      }
  }
}
?>