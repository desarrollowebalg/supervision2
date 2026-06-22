<?php
function collectViteCssFiles(array $manifest, string $entry, array &$visited = []): array {
  if (isset($visited[$entry]) || !isset($manifest[$entry])) {
    return [];
  }

  $visited[$entry] = true;
  $chunk = $manifest[$entry];
  $cssFiles = $chunk['css'] ?? [];

  foreach ($chunk['imports'] ?? [] as $import) {
    $cssFiles = array_merge($cssFiles, collectViteCssFiles($manifest, $import, $visited));
  }

  return array_values(array_unique($cssFiles));
}

function loadVite($entry) {
  // $isDev = $_ENV['APP_ENV'] === 'dev';    
  $isDev = $_SERVER['SERVER_NAME'] === 'localhost';
  
  if ($isDev) {      
      return [
          'js' => "http://localhost:5173/$entry",
          'css' => [],
          'isDev' => true
      ];
  }

  $manifest = json_decode(
      file_get_contents(__DIR__ . '/dist/manifest.json'),
      true
  );  
  
  $file = $manifest[$entry];
  $cssFiles = collectViteCssFiles($manifest, $entry);
  // 'css' => array_map(fn($cssFile) => '/dist/' . $cssFile, $cssFiles),
  return [
      'js' => '/dist/' . $file['file'],
      'css' => array_map(function ($cssFile) {
        return '/dist/' . $cssFile;
      }, $cssFiles),
      'isDev' => false
  ];
}
?>
