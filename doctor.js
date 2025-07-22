// doctor.js
// Escucha errores de JavaScript en la página.
(function() {
    const handleError = (error) => {
        try {
            chrome.runtime.sendMessage({ type: 'LOG_ERROR', error });
        } catch(e) {
            // La extensión puede estar desconectada, es normal.
        }
    };

    window.addEventListener('error', function(event) {
        handleError({
            type: 'runtime_error',
            message: event.message,
            source: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            timestamp: new Date().toISOString()
        });
    });

    window.addEventListener('unhandledrejection', function(event) {
        handleError({
            type: 'promise_rejection',
            message: event.reason ? event.reason.message : 'Promise rejected with no message',
            stack: event.reason ? event.reason.stack : 'No stack trace',
            timestamp: new Date().toISOString()
        });
    });
})();
