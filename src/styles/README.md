# Directorio de Estilos

## Estructura

Este directorio contiene estilos globales compartidos.

- `global.css`: estilos globales base
- `themes.css`: variables CSS y tema

## Convenciones

- Estilos globales/transversales: `src/styles/`.
- Estilos específicos de una página/feature: junto a su página.

Ejemplo actual:

```text
src/pages/login/
├── main.js
├── LoginPage.js
└── login.css
```

## Uso

Importar estilos desde JS:

```js
import '../../styles/global.css';
import '../../styles/themes.css';
import './login.css';
```

## Notas

- UIKit se importa desde `src/core/ui.js`.
- Vite procesa/minifica CSS durante build.
