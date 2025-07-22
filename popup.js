// popup.js (v36 - Final & Complete Logic)
document.addEventListener('DOMContentLoaded', () => {
    // --- CORE UI & STATE ---
    const mainContainer = document.getElementById('main-container');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const headerSubtitle = document.getElementById('header-subtitle');
    const welcomeView = document.getElementById('welcome-view');
    const bootSequenceContainer = document.getElementById('boot-sequence');
    const welcomeOptions = document.getElementById('welcome-options');
    const views = { 
        console: document.getElementById('console-view'), 
        phantom: document.getElementById('phantom-view'),
        config: document.getElementById('config-view')
    };
    const avatarTemplate = document.getElementById('avatar-template');

    let activeTabId;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => { 
            if(tabs && tabs.length > 0) activeTabId = tabs[0].id; 
        });
    }

    let isMenuOpen = false;
    let activeView = null;
    let systemInitialized = false;

    // --- BOOT SEQUENCE & NAVIGATION ---
    function startBootSequence() {
        const bootLines = ["> Litox's Keanu Console v5.2", "> Booting Phantom Core...", "> Establishing connection...", "> System Online."];
        let i = 0;
        const interval = setInterval(() => {
            if (i < bootLines.length) {
                const p = document.createElement('p'); 
                p.textContent = bootLines[i++]; 
                bootSequenceContainer.appendChild(p);
            } else {
                clearInterval(interval);
                welcomeOptions.classList.remove('hidden');
                headerSubtitle.textContent = '> awaiting command...';
            }
        }, 500);
    }

    menuToggleBtn.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        mainContainer.classList.toggle('menu-open', isMenuOpen);
    });

    document.body.addEventListener('click', (e) => {
        const viewButton = e.target.closest('[data-view]');
        if (viewButton) {
            switchView(viewButton.dataset.view);
        }
    });

    function switchView(viewName) {
        if (!systemInitialized) {
            welcomeView.classList.add('hidden');
            menuToggleBtn.classList.remove('hidden');
            systemInitialized = true;
        }
        activeView = viewName;
        const viewTitle = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        headerSubtitle.textContent = `> ${viewTitle} mode engaged.`;
        Object.values(views).forEach(v => v ? v.classList.add('hidden') : null);
        if (views[activeView]) views[activeView].classList.remove('hidden');
        loadSidebarItems(viewName);
        if (isMenuOpen) menuToggleBtn.click();
    }

    function loadSidebarItems(currentView) {
        sidebar.innerHTML = `
            <div data-view="console" class="sidebar-item ${currentView === 'console' ? 'active' : ''} p-3"><span>> Console</span></div>
            <div data-view="phantom" class="sidebar-item ${currentView === 'phantom' ? 'active' : ''} p-3"><span>> Phantom Mode</span></div>
            <div class="flex-grow"></div>
            <div data-view="config" class="sidebar-item ${currentView === 'config' ? 'active' : ''} p-3"><span>> Configuration</span></div>
        `;
    }

    // --- CONSOLE VIEW LOGIC ---
    (() => {
        const consoleView = views.console;
        if (!consoleView) return;

        const chatContainer = consoleView.querySelector('#chat-container');
        const promptInput = consoleView.querySelector('#console-prompt-input');
        const submitBtn = consoleView.querySelector('#console-submit-btn');
        const attachBtn = consoleView.querySelector('#console-attach-btn');
        const fileInput = consoleView.querySelector('#console-file-input');
        const attachmentContainer = consoleView.querySelector('#attachment-container');
        const attachmentList = consoleView.querySelector('#attachment-list');
        const micBtn = consoleView.querySelector('#console-mic-btn');
        const micIcon = consoleView.querySelector('#console-mic-icon');
        const micStatus = consoleView.querySelector('#console-mic-status');

        let chatHistory = [];
        let attachedFiles = [];
        let isListening = false;
        let recognition;
        
        function scrollToBottom() {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function addMessageToChat(role, content) {
            const wrapper = document.createElement('div');
            const isAssistant = role === 'assistant';
            wrapper.className = `w-full flex mb-4 ${isAssistant ? 'justify-start chat-bubble-assistant-wrapper' : 'justify-end'}`;
        
            if (isAssistant && avatarTemplate) {
                const avatarNode = avatarTemplate.content.cloneNode(true);
                wrapper.appendChild(avatarNode);
            }
        
            const bubble = document.createElement('div');
            bubble.className = `max-w-md lg:max-w-lg p-3 rounded-lg text-white ${isAssistant ? 'chat-bubble-assistant' : 'chat-bubble-user'}`;
        
            const contentWrapper = document.createElement('div');
            contentWrapper.className = "whitespace-pre-wrap break-words";
            contentWrapper.textContent = content;
            bubble.appendChild(contentWrapper);
            
            wrapper.appendChild(bubble);
            chatContainer.appendChild(wrapper);
            scrollToBottom();
            return wrapper;
        }
        
        function startAvatarTalk(messageWrapper, isContinuous = false, duration = 300) {
            if(!messageWrapper) return;
            const mouth = messageWrapper.querySelector('.mouth');
            if (mouth) {
                mouth.classList.add('mouth-talk');
                if (!isContinuous) {
                    setTimeout(() => stopAvatarTalk(messageWrapper), duration);
                }
            }
        }

        function stopAvatarTalk(messageWrapper) {
            if(!messageWrapper) return;
            const mouth = messageWrapper.querySelector('.mouth');
            if (mouth) mouth.classList.remove('mouth-talk');
        }

        attachBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (event) => {
            for (const file of event.target.files) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (!attachedFiles.some(f => f.name === file.name)) {
                        attachedFiles.push({ name: file.name, content: e.target.result });
                        renderAttachments();
                    }
                };
                reader.readAsText(file);
            }
            fileInput.value = '';
        });

        function renderAttachments() {
            attachmentContainer.classList.toggle('hidden', attachedFiles.length === 0);
            attachmentList.innerHTML = '';
            attachedFiles.forEach((file, index) => {
                const tag = document.createElement('div');
                tag.className = 'flex items-center bg-gray-700 rounded-full px-3 py-1 text-sm text-gray-300';
                tag.innerHTML = `<span>${file.name}</span><button data-index="${index}" class="ml-2 text-red-500 hover:text-white">&times;</button>`;
                attachmentList.appendChild(tag);
            });
        }

        attachmentList.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                attachedFiles.splice(e.target.dataset.index, 1);
                renderAttachments();
            }
        });
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.lang = 'es-ES';
            recognition.interimResults = true;

            micBtn.addEventListener('click', () => {
                if (isListening) recognition.stop();
                else recognition.start();
            });

            recognition.onstart = () => { isListening = true; micIcon.classList.add('text-red-500', 'animate-pulse'); micStatus.textContent = 'Escuchando...'; micStatus.classList.remove('opacity-0'); };
            recognition.onend = () => { isListening = false; micIcon.classList.remove('text-red-500', 'animate-pulse'); micStatus.textContent = ''; micStatus.classList.add('opacity-0'); };
            recognition.onerror = (e) => { console.error('Speech Recognition Error:', e.error); micStatus.textContent = `Error: ${e.error}`; };
            recognition.onresult = (e) => {
                let transcript = Array.from(e.results).map(r => r[0]).map(r => r.transcript).join('');
                promptInput.value = transcript;
                if(e.results[e.results.length-1].isFinal) {
                    recognition.stop();
                }
            };
        } else {
            micBtn.style.display = 'none';
        }
        
        function renderInteractiveResult(bubbleContent, response) {
            let responseTextForHistory = `[Rendered action for: ${response.action}]`;
            bubbleContent.innerHTML = ''; // Clear the "..."

            if (response.action === 'REPLY') {
                bubbleContent.textContent = response.text;
                responseTextForHistory = response.text;
            } 
            else if (response.action === 'EXECUTION_RESULT') {
                if (response.renderHint === 'table_and_csv' && Array.isArray(response.result)) {
                    renderInteractiveTable(bubbleContent, response.result);
                } else {
                    const resultText = response.result === undefined ? '[No return value]' : JSON.stringify(response.result, null, 2);
                    bubbleContent.innerHTML = `<p>Execution successful. Result:</p><pre class="mt-2 bg-black/30 p-2 rounded">${resultText}</pre>`;
                }
            } 
            else if (response.action === 'PLAN_RESULT') {
                 renderExecutablePlan(bubbleContent, response.plan);
            }
            else if (response.action === 'EXECUTE' && response.code) {
                renderExecutableCode(bubbleContent, response.code);
                responseTextForHistory = `[Rendered executable code]`;
            }
            else {
                const errorText = response.error || "An unexpected response was received.";
                bubbleContent.textContent = errorText;
                responseTextForHistory = errorText;
            }
            return responseTextForHistory;
        }

        function renderInteractiveTable(container, data) {
            if (!data || data.length === 0) {
                container.textContent = '[Empty data set received]';
                return;
            }
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'mb-2';
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'px-3 py-1 text-xs cyber-button';
            downloadBtn.textContent = 'Download as CSV';
            downloadBtn.onclick = () => downloadCSV(data);
            actionsDiv.appendChild(downloadBtn);
            container.appendChild(actionsDiv);
            
            const tableContainer = document.createElement('div');
            tableContainer.className = 'max-h-64 overflow-y-auto';
            const table = document.createElement('table');
            table.className = 'w-full text-left text-xs';
            const headers = Object.keys(data[0] || {});
            table.innerHTML = `
                <thead class="sticky top-0 bg-[var(--cyber-bg-secondary)]">
                    <tr>${headers.map(h => `<th class="p-2 border-b border-[var(--cyber-border)]">${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr class="border-b border-[var(--cyber-border)] hover:bg-[var(--cyber-border)]">
                            ${headers.map(h => `<td class="p-2 break-all">${row[h] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            `;
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }

        function renderExecutablePlan(container, plan) {
             container.innerHTML = `<p class="text-sm mb-2 text-gray-400">> Agent has prepared the following multi-step plan:</p>`;
             const planList = document.createElement('div');
             planList.className = 'space-y-1 text-xs mb-2';
             plan.forEach((step, index) => {
                 const stepEl = document.createElement('p');
                 stepEl.innerHTML = `<span class="text-gray-500">${index + 1}.</span> <span class="text-cyan-400">[${step.command}]</span> ${step.description}`;
                 planList.appendChild(stepEl);
             });
             container.appendChild(planList);

             const execBtn = document.createElement('button');
             execBtn.className = 'px-3 py-1 text-xs cyber-button';
             execBtn.textContent = 'Execute Plan';
             execBtn.onclick = () => {
                 // Note: This executes a plan without secrets. For missions with secrets, use Phantom Mode.
                 chrome.runtime.sendMessage({ type: 'EXECUTE_PLAN', plan, secrets: [], tabId: activeTabId });
                 execBtn.disabled = true;
                 execBtn.textContent = 'Execution Started...';
             };
             container.appendChild(execBtn);
        }

        function renderExecutableCode(container, code) {
            container.innerHTML = `<p class="text-sm mb-2 text-gray-400">> Agent has prepared the following command:</p>`;
            
            const codeBlock = document.createElement('pre');
            codeBlock.className = 'bg-black/30 p-2 rounded text-xs mb-2';
            codeBlock.textContent = code;
            container.appendChild(codeBlock);

            const execBtn = document.createElement('button');
            execBtn.className = 'px-3 py-1 text-xs cyber-button';
            execBtn.textContent = 'Execute Code';
            execBtn.onclick = async () => {
                execBtn.disabled = true;
                execBtn.textContent = 'Executing...';
                try {
                    const result = await chrome.runtime.sendMessage({ type: 'EXECUTE_DIRECT_CODE', code, tabId: activeTabId });
                    if(result.error) throw new Error(result.error);
                    const resultText = result.result === undefined ? '[No return value]' : JSON.stringify(result.result);
                    execBtn.textContent = `Done. Result: ${resultText.substring(0, 50)}...`;
                    execBtn.classList.add('border-green-500', 'text-green-500');
                } catch (e) {
                    execBtn.textContent = `Error: ${e.message}`;
                    execBtn.classList.add('border-red-500', 'text-red-500');
                }
            };
            container.appendChild(execBtn);
        }

        function downloadCSV(data) {
            const headers = Object.keys(data[0] || {});
            const csvRows = [headers.join(',')];
            for (const row of data) {
                const values = headers.map(header => {
                    const escaped = ('' + (row[header] || '')).replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                csvRows.push(values.join(','));
            }
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', 'console_export.csv');
            a.click();
            URL.revokeObjectURL(url);
        }

        async function handleConsoleSend() {
            const prompt = promptInput.value.trim();
            if (!prompt && attachedFiles.length === 0) return;

            addMessageToChat('user', prompt || `(Archivos adjuntos: ${attachedFiles.map(f=>f.name).join(', ')})`);
            chatHistory.push({ role: 'user', content: prompt });
            
            const thinkingMsg = addMessageToChat('assistant', '...');
            startAvatarTalk(thinkingMsg, true);
            
            const filesToSend = [...attachedFiles];
            promptInput.value = '';
            attachedFiles = [];
            renderAttachments();

            try {
                const response = await chrome.runtime.sendMessage({
                    type: 'EXECUTE_CONSOLE_PROMPT',
                    history: chatHistory,
                    attachedFiles: filesToSend,
                    tabId: activeTabId
                });

                stopAvatarTalk(thinkingMsg);
                const bubbleContent = thinkingMsg.querySelector('.chat-bubble-assistant > div');
                
                const responseText = renderInteractiveResult(bubbleContent, response);
                chatHistory.push({ role: 'assistant', content: responseText });
                startAvatarTalk(thinkingMsg, false, responseText.length * 40);

            } catch (e) {
                stopAvatarTalk(thinkingMsg);
                const bubbleContent = thinkingMsg.querySelector('.chat-bubble-assistant > div');
                if(bubbleContent) bubbleContent.textContent = `Communication error: ${e.message}`;
            }
        }
        
        submitBtn.addEventListener('click', handleConsoleSend);
        promptInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConsoleSend(); }});
        
        addMessageToChat('assistant', "I am the Console's core agent. The choice is yours.");

    })();

    // --- PHANTOM MODE LOGIC ---
    (() => {
        const phantomView = views.phantom;
        if (!phantomView) return;

        const objectiveInput = phantomView.querySelector('#mission-objective');
        const generateBtn = phantomView.querySelector('#generate-plan-btn');
        const planContainer = phantomView.querySelector('#plan-container');
        const actionPlanDiv = phantomView.querySelector('#action-plan');
        const approveBtn = phantomView.querySelector('#approve-plan-btn');
        const clearBtn = phantomView.querySelector('#clear-plan-btn');
        const logDiv = phantomView.querySelector('#execution-log');
        const secretKeyInput = phantomView.querySelector('#secret-key-input');
        const secretValueInput = phantomView.querySelector('#secret-value-input');
        const addSecretBtn = phantomView.querySelector('#add-secret-btn');
        const secretsList = phantomView.querySelector('#secrets-list');

        let currentPlan = null;
        let secrets = [];

        addSecretBtn.addEventListener('click', () => {
            const key = secretKeyInput.value.trim().toUpperCase();
            const value = secretValueInput.value.trim();
            if (!key || !value) return;
            secrets = secrets.filter(s => s.key !== key);
            secrets.push({ key, value });
            secretKeyInput.value = '';
            secretValueInput.value = '';
            renderSecrets();
        });

        function renderSecrets() {
            secretsList.innerHTML = '';
            secrets.forEach(secret => {
                const el = document.createElement('div');
                el.className = 'flex justify-between items-center bg-black/30 px-2 py-1';
                el.innerHTML = `<span class="text-cyan-400">${secret.key}</span><span class="text-gray-500">[Loaded]</span>`;
                secretsList.appendChild(el);
            });
        }
        
        function clearPlan() {
            planContainer.classList.add('hidden');
            actionPlanDiv.innerHTML = '';
            approveBtn.disabled = false;
            clearBtn.disabled = false;
            currentPlan = null;
        }

        clearBtn.addEventListener('click', clearPlan);

        generateBtn.addEventListener('click', async () => {
            const objective = objectiveInput.value.trim();
            if (!objective) return;
            
            clearPlan();
            generateBtn.disabled = true;
            generateBtn.textContent = "Generating...";
            
            try {
                const response = await chrome.runtime.sendMessage({ type: 'GENERATE_PLAN', objective });
                if (response.error) {
                    actionPlanDiv.innerHTML = `<p class="text-red-500">Error: ${response.error}</p>`;
                } else {
                    currentPlan = response.plan;
                    displayPlan(currentPlan);
                }
            } catch(e) {
                 actionPlanDiv.innerHTML = `<p class="text-red-500">Error communicating: ${e.message}</p>`;
            }
            
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate Action Plan";
            planContainer.classList.remove('hidden');
        });

        approveBtn.addEventListener('click', () => {
            if (!currentPlan) return;
            logDiv.innerHTML = '<p>> Mission approved. Deploying agent...</p>';
            chrome.runtime.sendMessage({ type: 'EXECUTE_PLAN', plan: currentPlan, secrets: secrets });
            approveBtn.disabled = true;
            clearBtn.disabled = true;
        });

        function displayPlan(plan) {
            actionPlanDiv.innerHTML = '';
            if(!plan || !Array.isArray(plan)) return;
            plan.forEach((step, index) => {
                const el = document.createElement('div');
                el.className = 'p-2 bg-black/30 text-sm';
                el.innerHTML = `
                    <span class="text-gray-500">${index + 1}.</span>
                    <span class="text-cyan-400">[${step.command}]</span>
                    <span class="text-white">${step.description}</span>
                    ${step.target ? `<span class="text-magenta-400 ml-2 italic"> -> ${step.target.substring(0, 50)}</span>` : ''}
                `;
                actionPlanDiv.appendChild(el);
            });
        }

        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((request) => {
                if (request.type === 'UPDATE_EXECUTION_LOG' && activeView === 'phantom') {
                    const entry = document.createElement('p');
                    entry.innerHTML = request.message;
                    logDiv.appendChild(entry);
                    logDiv.scrollTop = logDiv.scrollHeight;
                }
            });
        }
    })();

    // --- CONFIG VIEW LOGIC ---
    (() => {
        const configView = views.config;
        if (!configView) return;
        const apiKeyInput = configView.querySelector('#api-key-input');
        const saveBtn = configView.querySelector('#save-api-key-btn');
        const toggleBtn = configView.querySelector('#toggle-visibility-btn');
        const statusEl = configView.querySelector('#save-status');
                
        const isStorageAvailable = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

        if (isStorageAvailable) {
            chrome.storage.local.get(['geminiApiKey'], (result) => {
                if (chrome.runtime.lastError) {
                    statusEl.textContent = '> Error reading storage.';
                    return;
                }
                if (result.geminiApiKey) {
                    apiKeyInput.placeholder = '••••••••••••••••••••••••••••••';
                }
            });
        } else {
            apiKeyInput.disabled = true;
            saveBtn.disabled = true;
            toggleBtn.disabled = true;
            apiKeyInput.placeholder = 'API not available';
            statusEl.textContent = '> Storage only available in extension mode.';
        }

        toggleBtn.addEventListener('click', () => {
            apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
        });

        saveBtn.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();
            if (!isStorageAvailable) {
                statusEl.textContent = '> Error: Storage API not available.';
                return;
            }

            if (apiKey) {
                chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
                    if (chrome.runtime.lastError) {
                         statusEl.textContent = '> Error saving key.';
                         return;
                    }
                    statusEl.textContent = '> API Key saved successfully.';
                    apiKeyInput.value = '';
                    apiKeyInput.placeholder = '••••••••••••••••••••••••••••••';
                    setTimeout(() => { statusEl.textContent = ''; }, 3000);
                });
            } else {
                statusEl.textContent = '> Please enter an API Key.';
            }
        });
    })();

    // --- INITIALIZATION ---
    startBootSequence();
});
