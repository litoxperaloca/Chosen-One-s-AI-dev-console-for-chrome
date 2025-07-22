// injector.js
// Este script se ejecuta en el contexto de la página para acceder a `window`.
window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'GET_VARS_FROM_PAGE') {
        const variables = {};
        try {
            for (const key in window) {
                if (window.hasOwnProperty(key)) {
                    const value = window[key];
                    if (['string', 'number', 'boolean', 'undefined'].includes(typeof value) || value === null) {
                        variables[key] = value;
                    }
                }
            }
        } catch (e) { /* Ignorar errores de acceso */ }
        
        window.postMessage({ type: 'FROM_INJECTOR', variables: variables }, '*');
    }
});
