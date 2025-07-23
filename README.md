# Chosen-One-s-AI-dev-console-for-chrome: Tu Consola de Desarrollo Asistida por IA

[![Licencia GPLv3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

"Unleash autonomous AI agents into the Matrix. The choice is yours."

Litox's Keanu Console, conocido como Chosen-One-s-AI-dev-console-for-chrome, es una potente extensión de navegador que transforma tu consola de desarrollo en un entorno interactivo asistido por inteligencia artificial. Inspirada en la icónica saga "Matrix", esta herramienta te permite interactuar con páginas web, ejecutar código JavaScript, extraer datos y automatizar tareas complejas utilizando agentes de IA autónomos.

## 🌟 Características Principales

* **Consola Interactiva de IA**: Chatea con un agente de IA que puede analizar el DOM de la página, variables JavaScript y archivos adjuntos para responder preguntas, extraer información o ejecutar acciones.
* **Modo Fantasma**: Define objetivos de misión complejos para la IA, que generará un plan de acción multi-paso. Aprueba el plan y observa cómo el agente autónomo lo ejecuta en una pestaña en segundo plano.
* **Ejecución de Código Directo**: Pide a la IA que genere código JavaScript y ejecútalo directamente en la página activa desde la consola.
* **Análisis y Extracción de Datos**: Solicita a la IA que analice la estructura de una página y extraiga datos específicos, incluso presentándolos en formatos tabulares descargables (CSV).
* **Gestión Segura de Credenciales**: Almacena de forma segura secretos (como claves de API o credenciales) en un "Secure Vault" para que los agentes de IA los utilicen en sus misiones.
* **Monitorización de Errores**: Registra y visualiza errores de JavaScript de la página para una depuración asistida.
* **Interfaz Inspirada en Cyberpunk**: Disfruta de una estética visual única con un tema oscuro, colores neón y animaciones que evocan la sensación de interactuar con una máquina inteligente.
* **Extensible**: Diseñado para ser adaptable y personalizable para tus necesidades de desarrollo.

## 🚀 Cómo Funciona

Litox's Keanu Console opera en segundo plano para potenciar tu experiencia de desarrollo:

1.  **Captura de Contexto**: Utiliza scripts de contenido e inyectores (`content.js`, `injector.js`) para acceder de forma segura al DOM completo y a las variables JavaScript de la página activa, proporcionando a la IA un contexto rico y preciso.
2.  **Comunicación con IA**: El script de fondo (`background.js`) actúa como un centro de comando, gestionando las solicitudes del usuario y comunicándose con la API de Gemini (requiere tu propia clave API) para procesar instrucciones y generar respuestas o planes de acción.
3.  **Automatización Inteligente**: Los agentes de IA pueden ejecutar una variedad de comandos, desde simples clics hasta la navegación compleja y la extracción de datos, interpretando y actuando sobre la estructura de la página.
4.  **Experiencia de Usuario Integrada**: La interfaz de usuario (`popup.html`, `popup.js`) proporciona una consola intuitiva para interactuar con la IA, visualizar resultados y gestionar misiones.
5.  **Monitorización y Diagnóstico**: `doctor.js` escucha y reporta errores de JavaScript en la página, ayudando a identificar problemas en el entorno de ejecución.

## ⚙️ Instalación

Para instalar Litox's Keanu Console en tu navegador Chrome:

1.  **Clona el Repositorio**:
    ```bash
    git clone [https://github.com/litoxperaloca/chosen-one-s-ai-dev-console-for-chrome.git](https://github.com/litoxperaloca/chosen-one-s-ai-dev-console-for-chrome.git)
    ```
2.  **Abre Chrome y Ve a Extensiones**:
    * Abre Chrome.
    * Escribe `chrome://extensions` en la barra de direcciones y pulsa Enter.
    * Alternativamente, ve a `Menú (⋮) > Más herramientas > Extensiones`.
3.  **Activa el Modo Desarrollador**:
    * En la esquina superior derecha de la página de Extensiones, activa el interruptor "Modo desarrollador".
4.  **Carga la Extensión Desempaquetada**:
    * Haz clic en el botón "Cargar extensión sin empaquetar".
    * Navega hasta la carpeta donde clonaste el repositorio (`chosen-one-s-ai-dev-console-for-chrome`) y selecciónala.
5.  **Fija la Extensión (Opcional)**:
    * Haz clic en el icono del rompecabezas (Extensiones) en la barra de herramientas de Chrome.
    * Encuentra "Litox's Keanu Console" y haz clic en el icono de la chincheta para fijarla a tu barra de herramientas para un acceso rápido.

## 🚀 Uso

1.  **Configura tu Clave API de Gemini**:
    * Haz clic en el icono de la extensión en tu barra de herramientas de Chrome.
    * Una vez que la consola se inicie, ve a la pestaña "Configuration".
    * Introduce tu clave API de Gemini en el campo correspondiente y haz clic en "Save Key". **Necesitas una clave API válida para que las funciones de IA operen.**
2.  **Modo Consola**:
    * En la pestaña "Console", simplemente escribe tus preguntas o comandos en la barra de entrada.
    * Puedes adjuntar archivos para dar contexto adicional a la IA.
    * La IA responderá o te presentará opciones ejecutables (código JS, planes).
3.  **Modo Fantasma**:
    * Ve a la pestaña "Phantom Mode".
    * Introduce un "Mission Objective" (por ejemplo, "Iniciar sesión en GitHub y extraer mi nombre de usuario").
    * Haz clic en "Generate Action Plan". La IA creará un plan de pasos que puedes revisar.
    * Si el plan requiere credenciales, añádelas en el "Secure Vault".
    * Haz clic en "Approve & Deploy" para que el agente ejecute el plan en segundo plano.
4.  **Monitorización**: El "Execution Log" en el Modo Fantasma mostrará el progreso y los resultados de las misiones.

## 🤝 Contribución

¡Este es un proyecto de código abierto! Siéntete libre de usarlo, compartirlo, modificarlo y contribuir. Las contribuciones son bienvenidas para mejorar las funcionalidades, corregir errores o expandir las capacidades de la IA.

## 📄 Licencia

Este proyecto está distribuido bajo la [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).

**"Chosen One" es un proyecto abierto de Pablo Pignolo & Gemini. Úsalo, compártelo, modifícalo, cópialo o lo que necesites. El poder es tuyo.**
