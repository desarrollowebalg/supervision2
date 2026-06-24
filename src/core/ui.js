import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import 'uikit/dist/css/uikit.min.css';
import '../styles/themes.css';

// Configurar UIkit
UIkit.use(Icons);

// Exponer globalmente (opcional pero útil)
window.UIkit = UIkit;

export default UIkit;
