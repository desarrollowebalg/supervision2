# Componentes Web (Web Components)

Esta carpeta contiene Web Components nativos (Custom Elements) reutilizables en toda la aplicación.

## 📋 Tabla de Contenidos

- [¿Qué son Web Components?](#qué-son-web-components)
- [Componentes Disponibles](#componentes-disponibles)
- [Cómo Usar](#cómo-usar)
- [Cómo Crear Nuevos Componentes](#cómo-crear-nuevos-componentes)
- [Convenciones](#convenciones)
- [Ventajas](#ventajas)

---

## ¿Qué son Web Components?

Los Web Components son componentes reutilizables basados en estándares web nativos que permiten:

- **Reutilización:** Se usan como elementos HTML estándar
- **Compatibilidad:** Funcionan sin frameworks adicionales
- **Portabilidad:** Fácilmente migrables entre proyectos
- **Integración:** Compatibles con estilos y librerías existentes

### Tecnologías Base

1. **Custom Elements:** Define nuevos elementos HTML
2. **Light DOM:** Usa el DOM normal (aprovecha estilos globales)
3. **Shadow DOM:** (Opcional) Encapsula estilos y markup cuando se necesita

### Light DOM vs Shadow DOM

**Light DOM** (usado en este proyecto):
- ✅ Los estilos de UIKit funcionan directamente
- ✅ Más simple de implementar
- ✅ Menor overhead
- ⚠️ Requiere selectores específicos para evitar conflictos

**Shadow DOM** (opcional):
- ✅ Encapsulación total de estilos
- ⚠️ Requiere importar UIKit explícitamente
- ⚠️ Mayor complejidad

---

## Componentes Disponibles

### HeaderComponent

**Tag:** `<header-component>`

**Descripción:** Encabezado de aplicación con información del cliente y usuario. Incluye notificaciones, configuración y menú de usuario. Diseño moderno integrado con UIKit CSS.

**Atributos:**
- `nombre-cliente` - Nombre del cliente/aplicación
- `razon-social` - Descripción o razón social (opcional)
- `nombre-usuario` - Nombre del usuario actual
- `rol-usuario` - Rol del usuario
- `avatar-url` - URL del avatar del usuario
- `notificaciones-count` - Número de notificaciones pendientes

**Ejemplo:**
```html
<header-component 
  nombre-cliente="Orchestrator"
  razon-social="Sistema de Gestión"
  nombre-usuario="AdminElim"
  rol-usuario="ADMINISTRADOR"
  avatar-url="/images/perfiles/usuario1.jpg"
  notificaciones-count="3">
</header-component>
```

**Eventos emitidos:**
- `notifications-click` - Al hacer click en notificaciones
  ```javascript
  detail: { count: 3 }
  ```
- `settings-click` - Al hacer click en configuración
- `user-menu-click` - Al hacer click en el menú de usuario
  ```javascript
  detail: { nombre: "AdminElim", rol: "ADMINISTRADOR" }
  ```
- `user-logout-click` - Se emite solo cuando el usuario confirma que desea salir de la aplicaci?n

**Características:**
- ✅ Manejo seguro de caracteres especiales
- ✅ Responsive design (oculta elementos en móviles)
- ✅ Usa Light DOM para aprovechar UIKit global
- ✅ Atributos reactivos (actualización automática)
- ✅ Integración con UIKit CSS (iconos uk-icon)
- ✅ Layout: 100% ancho con contenedor centrado (max-width: 1400px)
- ✅ Diseño limpio y moderno (fondo blanco)
- ✅ Badge de notificaciones dinámico
- ✅ Eventos custom para interacción
- ✅ Estilos scoped con selectores específicos


- Confirmacion previa antes de cerrar sesion desde el menu del usuario

**Estructura de Layout:**
- El componente ocupa el 100% del ancho de la pantalla
- El contenido interno está centrado con un máximo de 1400px
- Usa clases UIKit: `uk-flex`, `uk-flex-between`, `uk-heading-small`, `uk-text-meta`
- Padding automático en los laterales para dispositivos pequeños

---

## Cómo Usar

### 1. Importar el Componente

```javascript
// En tu página o módulo
import '../components/header-component.js';
```

### 2. Usar en HTML

```javascript
// Opción A: En template string
container.innerHTML = `
  <header-component 
    nombre-cliente="Empresa S.A. de C.V."
    razon-social="Empresa Sociedad Anónima">
  </header-component>
  
  <div class="content">
    <!-- Tu contenido -->
  </div>
`;

// Opción B: Crear dinámicamente
const header = document.createElement('header-component');
header.setAttribute('nombre-cliente', 'Empresa S.A.');
header.setAttribute('razon-social', 'Razón Social');
container.appendChild(header);
```

### 3. Actualizar Atributos Dinámicamente

```javascript
// Los componentes se actualizan automáticamente
const header = document.querySelector('header-component');
header.setAttribute('nombre-cliente', 'Nuevo Cliente S.A.');
```

---

## Cómo Crear Nuevos Componentes

### Estructura Base

```javascript
/**
 * Mi Componente - Descripción
 * @component
 * @example <mi-componente atributo="valor"></mi-componente>
 */
class MiComponente extends HTMLElement {
  constructor() {
    super();
    // Light DOM - aprovecha estilos globales (UIKit)
  }

  // Atributos observados
  static get observedAttributes() {
    return ['atributo-1', 'atributo-2'];
  }

  // Al conectarse al DOM
  connectedCallback() {
    this.render();
    this._addStyles();
  }

  // Cuando cambian atributos
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  // Agregar estilos al head (solo una vez)
  _addStyles() {
    if (document.getElementById('mi-componente-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'mi-componente-styles';
    style.textContent = `
      /* Selector específico para scope */
      mi-componente {
        display: block;
        width: 100%;
      }
      
      mi-componente .wrapper {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        mi-componente .wrapper {
          padding: 0 0.5rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Renderizar componente (usa clases UIKit directamente)
  render() {
    this.innerHTML = `
      <div class="wrapper">
        <div class="uk-flex uk-flex-between uk-flex-middle">
          <h1 class="uk-heading-small" data-title></h1>
          <!-- Más contenido con clases UIKit -->
        </div>
      </div>
    `;
    
    // Establecer contenido dinámico con textContent
    const titulo = this.querySelector('[data-title]');
    if (titulo) {
      titulo.textContent = this.getAttribute('atributo-1');
    }
  }

  // Al desconectarse del DOM
  disconnectedCallback() {
    // Limpieza de recursos (listeners, timers, etc.)
  }
}

// Registrar componente
customElements.define('mi-componente', MiComponente);

export default MiComponente;
```

### Pasos para Crear un Nuevo Componente

1. **Crear archivo** en `src/components/nombre-componente.js`
2. **Extender HTMLElement** y crear la clase
3. **Definir observedAttributes** para props reactivas
4. **Implementar render()** con template y estilos
5. **Registrar** con `customElements.define()`
6. **Exportar** la clase
7. **Documentar** en este README

---

## Convenciones

### Nomenclatura

- **Archivos:** `kebab-case.js` (ej: `header-component.js`)
- **Clases:** `PascalCase` (ej: `HeaderComponent`)
- **Tags:** `kebab-case` con mínimo 2 palabras (ej: `<header-component>`)
- **Atributos:** `kebab-case` (ej: `nombre-cliente`)

### Buenas Prácticas

✅ **HACER:**
- Usar Light DOM para aprovechar UIKit global
- Definir `observedAttributes` para props dinámicas
- Usar `textContent` para prevenir XSS
- Documentar atributos y ejemplos
- Implementar responsive design
- Limpiar recursos en `disconnectedCallback`
- **Usar clases UIKit** para consistencia (`uk-flex`, `uk-heading-*`, etc.)
- Usar selectores específicos para estilos custom (ej: `header-component .mi-clase`)
- Agregar estilos solo una vez al head con ID único

❌ **EVITAR:**
- Usar `innerHTML` para contenido dinámico
- Atributos con nombres de una sola palabra
- Estilos sin scope que afecten otros elementos
- Lógica compleja en el constructor
- Manipulación del DOM padre
- Duplicar estilos en cada instancia del componente

### Manejo de Caracteres Especiales

```javascript
// ✅ CORRECTO - Usa textContent
element.textContent = 'José & María Ñoño <script>';

// ❌ INCORRECTO - innerHTML puede causar problemas
element.innerHTML = 'José & María Ñoño <script>';
```

### Estilos e Integración con UIKit

**UIKit ya está disponible globalmente** (importado en `ui.js` y cargado vía `bootstrap.js`).

**No necesitas importar UIKit** - simplemente usa las clases:

```javascript
// ✅ CORRECTO - UIKit ya está disponible
this.innerHTML = `
  <div class="uk-flex uk-flex-between">
    <h1 class="uk-heading-small">Título</h1>
  </div>
`;
```

**Estilos personalizados con scope:**

```javascript
_addStyles() {
  // Agregar estilos solo una vez
  if (document.getElementById('mi-componente-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'mi-componente-styles';
  style.textContent = `
    /* Selector específico para scope */
    mi-componente {
      display: block;
      width: 100%;
    }
    
    /* Contenedor centrado */
    mi-componente .wrapper {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    /* Override de clases UIKit si necesario */
    mi-componente .uk-heading-small {
      color: white;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      mi-componente .wrapper {
        padding: 0 0.5rem;
      }
    }
  `;
  document.head.appendChild(style);
}
```

**Patrón completo:**

```javascript
connectedCallback() {
  this.render();
  this._addStyles(); // Agregar estilos al head
}

render() {
  // Usar clases UIKit directamente
  this.innerHTML = `
    <div class="wrapper">
      <div class="uk-flex uk-flex-between">
        <h1 class="uk-heading-small" data-title></h1>
      </div>
    </div>
  `;
  
  // Actualizar contenido con textContent
  this.querySelector('[data-title]').textContent = this.titulo;
}
```

---

## Ventajas

### vs Componentes de Clase (Inicio.js, Dashboard.js)

| Característica | Web Components (Light DOM) | Clase Component |
|---------------|----------------|-----------------|
| Reutilización | ⭐⭐⭐⭐⭐ Alta | ⭐⭐⭐ Media |
| Integración UIKit | ⭐⭐⭐⭐⭐ Directa | ⭐⭐⭐⭐⭐ Directa |
| Portabilidad | ⭐⭐⭐⭐⭐ Sin dependencias | ⭐⭐ Depende del router |
| Encapsulación | ⭐⭐⭐ Selectores específicos | ⭐⭐ CSS global |
| Uso | `<mi-tag>` en HTML | `new Class()` |
| Estándar | ✅ Nativo del browser | ❌ Custom |
| Performance | ⭐⭐⭐⭐⭐ Ligero | ⭐⭐⭐⭐ Similar |

### Cuándo Usar Web Components

✅ **Usar para:**
- Componentes reutilizables (headers, cards, modals)
- UI elements compartidos entre páginas
- Componentes que puedan moverse a otros proyectos
- Elements que aprovechen estilos UIKit existentes
- Widgets independientes con props reactivas

❌ **No usar para:**
- Páginas completas (usar clases como `Inicio.js`)
- Lógica de routing
- Servicios o utilidades
- Estado global de la aplicación

---

## Compatibilidad

### Navegadores Soportados

- ✅ Chrome/Edge 67+
- ✅ Firefox 63+
- ✅ Safari 10.1+
- ✅ Opera 54+

### Polyfills (si necesario)

```javascript
// Si necesitas soportar navegadores antiguos
import '@webcomponents/webcomponentsjs';
```

---

## Ejemplos de Uso

### En Páginas (Inicio.js, Dashboard.js)

```javascript
import '../components/header-component.js';

export default class Inicio {
  render(container) {
    container.innerHTML = `
      <header-component 
        nombre-cliente="Orchestrator"
        razon-social="Sistema de Gestión"
        nombre-usuario="AdminElim"
        rol-usuario="ADMINISTRADOR"
        avatar-url="/images/perfiles/usuario1.jpg"
        notificaciones-count="3">
      </header-component>
      
      <div class="uk-container">
        <!-- Contenido de la página -->
      </div>
    `;
    
    this.bindEvents(container);
  }

  bindEvents(container) {
    const header = container.querySelector('header-component');
    
    // Escuchar eventos del header
    header.addEventListener('notifications-click', (e) => {
      console.log('Notificaciones:', e.detail.count);
      // Abrir panel de notificaciones
    });

    header.addEventListener('settings-click', () => {
      // Navegar a configuración
      navigate('/configuracion');
    });

    header.addEventListener('user-menu-click', (e) => {
      console.log('Usuario:', e.detail.nombre, e.detail.rol);
      // Mostrar menú dropdown
    });
    header.addEventListener('user-logout-click', async () => {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login/default';
    });
  }
}
```

### Actualizar Atributos Dinámicamente

```javascript
// Actualizar contador de notificaciones
const header = document.querySelector('header-component');
header.setAttribute('notificaciones-count', '5');

// Cambiar usuario
header.setAttribute('nombre-usuario', 'Nuevo Usuario');
header.setAttribute('rol-usuario', 'EDITOR');
header.setAttribute('avatar-url', '/images/perfiles/usuario2.jpg');
```

### Comunicación con Eventos Personalizados

```javascript
// En el Web Component
class MiComponente extends HTMLElement {
  render() {
    this.innerHTML = `
      <button class="uk-button" data-action="click">Hacer algo</button>
    `;
    
    // Agregar listener
    this.querySelector('[data-action]').addEventListener('click', () => {
      this.handleClick();
    });
  }
  
  handleClick() {
    // Emitir evento custom
    this.dispatchEvent(new CustomEvent('mi-evento', {
      detail: { data: 'información' },
      bubbles: true // Burbujea normalmente
    }));
  }
}

// En la página padre
container.addEventListener('mi-evento', (e) => {
  console.log(e.detail.data);
});
```

---

## Migración desde Otros Proyectos

Si tienes Web Components de otros proyectos:

1. **Copiar** el archivo `.js` a `src/components/`
2. **Verificar** que el tag name no cause conflictos
3. **Importar** en las páginas que lo necesiten
4. **Actualizar** este README con la documentación

### Checklist de Migración

- [ ] Archivo copiado a `src/components/`
- [ ] Tag name único (mínimo 2 palabras con guión)
- [ ] **Si usa Shadow DOM:** Convertir a Light DOM o importar UIKit
- [ ] Estilos con selectores específicos (scope)
- [ ] Usar clases UIKit cuando sea posible
- [ ] Atributos documentados
- [ ] Ejemplo de uso agregado
- [ ] Probado en página de prueba

---

## Testing

### Prueba Manual

```javascript
// En consola del navegador
const comp = document.createElement('header-component');
comp.setAttribute('nombre-cliente', 'Test & Co.');
document.body.appendChild(comp);
```

### Unit Tests (futuro)

```javascript
import { expect } from 'vitest';
import './header-component.js';

test('HeaderComponent renderiza correctamente', () => {
  const comp = document.createElement('header-component');
  comp.setAttribute('nombre-cliente', 'Test');
  document.body.appendChild(comp);
  
  // Light DOM - usar querySelector normal
  const nombre = comp.querySelector('[data-nombre]');
  expect(nombre.textContent).toBe('Test');
  
  // Limpiar
  comp.remove();
});
});
```

---

## Recursos

- [MDN Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Custom Elements Spec](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [Shadow DOM Spec](https://dom.spec.whatwg.org/#shadow-trees)
- [Web Components Best Practices](https://developers.google.com/web/fundamentals/web-components/best-practices)

---

**Creado:** 21 de abril de 2026  
**Actualizado:** 21 de abril de 2026  
**Versión:** 1.0
