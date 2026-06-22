/* Root service worker bridge.
 * Keep registration path at /sw.js (scope "/") and delegate logic to Vite output.
 */
importScripts('/dist/sw.js');
