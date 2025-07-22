// content.js
// Inyecta el script que puede acceder a las variables de la página.
function injectScript(filePath) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(filePath);
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => script.remove();
}
injectScript('injector.js');

// Aquí se podría añadir lógica futura si el background necesita
// comunicarse proactivamente con el content script.
