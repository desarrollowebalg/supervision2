<?php

if (!function_exists('ensurePhpSessionStarted')) {
  function ensurePhpSessionStarted() {
    if (function_exists('session_status')) {
      if (session_status() === PHP_SESSION_NONE) {
        session_start();
      }
      return;
    }

    if (session_id() === '') {
      session_start();
    }
  }
}

if (!function_exists('respondSessionExpiredJson')) {
  function respondSessionExpiredJson($httpCode = 401) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode([
      'success' => false,
      'code' => 'SESSION_EXPIRED',
      'message' => 'Session expired'
    ]);
    exit;
  }
}

if (!function_exists('requireSessionContext')) {
  function requireSessionContext($requiredKeys = []) {
    ensurePhpSessionStarted();

    foreach ($requiredKeys as $sessionKey) {
      if (!isset($_SESSION[$sessionKey])) {
        respondSessionExpiredJson(401);
      }

      $value = $_SESSION[$sessionKey];
      if ((is_int($value) || ctype_digit((string)$value)) && (int)$value <= 0) {
        respondSessionExpiredJson(401);
      }
    }
  }
}

