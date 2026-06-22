# Session Hardening Debt (Pending)

Legacy endpoints still pending session guard standardization:

- `apis_me/vistaPreviaQST/index.php`
- `apis_me/pdi/index.php`
- `apis_me/analiticsALG/index.php`

Target standard:

- Start/validate PHP session context.
- Return JSON error contract on expired session:
  - `success: false`
  - `code: "SESSION_EXPIRED"`
  - HTTP `401` or `403`

