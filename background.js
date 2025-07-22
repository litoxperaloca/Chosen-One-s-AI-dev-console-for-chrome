// background.js (v35 - Final & Complete Logic)
// The complete brain of the extension, handling all background tasks.

// --- STATE MANAGEMENT ---
let loggedErrors = [];

// --- UTILITY: Get API Key from Storage ---
async function getApiKey() {
    try {
        const result = await new Promise((resolve, reject) => {
            chrome.storage.local.get(['geminiApiKey'], (res) => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve(res);
            });
        });
        if (result.geminiApiKey) return result.geminiApiKey;
    } catch (e) { console.error("Error retrieving API key from storage:", e); }
    throw new Error("Gemini API Key not found. Please set it in the Configuration view.");
}

// --- UTILITY: Gemini API Call with Retry Logic ---
async function callGeminiAPI(prompt, isJson = false) {
    const apiKey = await getApiKey();
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
    };
    if (isJson) payload.generationConfig.response_mime_type = "application/json";

    const maxRetries = 3;
    let delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (response.status === 429 || response.status >= 500) throw new Error(`API server error with status: ${response.status}`);
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API Error: ${errorBody.error?.message || response.statusText}`);
            }
            const data = await response.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const textResponse = data.candidates[0].content.parts[0].text;
                const cleanedText = textResponse.replace(/^```json\n?|```$/g, '').trim();
                try {
                    return isJson ? JSON.parse(cleanedText) : cleanedText;
                } catch (e) { throw new Error("AI returned malformed JSON."); }
            } else {
                throw new Error('Invalid response structure from Gemini API.');
            }
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            console.warn(`API call failed (attempt ${i + 1}/${maxRetries}). Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

// --- MAIN MESSAGE LISTENER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const tabId = sender.tab ? sender.tab.id : request.tabId;

    if (request.type === 'EXECUTE_CONSOLE_PROMPT') {
        handleConsolePrompt(request, tabId)
            .then(sendResponse)
            .catch(e => sendResponse({ action: 'REPLY', text: `Error: ${e.message}` }));
        return true; 
    }
    if (request.type === 'EXECUTE_DIRECT_CODE') {
        handleDirectCodeExecution(request, tabId)
            .then(sendResponse)
            .catch(e => sendResponse({ error: e.message }));
        return true;
    }
    if (request.type === 'GENERATE_PLAN') {
        handleGeneratePlan(request.objective, tabId)
            .then(plan => sendResponse({ plan }))
            .catch(e => sendResponse({ error: e.message }));
        return true;
    }
    if (request.type === 'EXECUTE_PLAN') {
        executePlan(request.plan, request.secrets, tabId);
    }
    if (request.type === 'LOG_ERROR') {
        loggedErrors.push(request.error);
    }
});

// --- ACTION HANDLERS ---
async function handleConsolePrompt(request, tabId) {
    const { history, attachedFiles } = request;

    const tab = await chrome.tabs.get(tabId);
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('https://chrome.google.com/webstore')) {
        return { action: 'REPLY', text: "Security protocol violation. I cannot operate on this protected page." };
    }
    
    const pageContext = await getPageContext(tabId);
    let actionPrompt = buildConsoleActionPrompt(history, attachedFiles, { dom: pageContext.dom, variables: null });
    let aiDecision = await callGeminiAPI(actionPrompt, true);

    if (aiDecision.action === 'REQUEST_JS_VARS') {
        actionPrompt = buildConsoleActionPrompt(history, attachedFiles, pageContext);
        aiDecision = await callGeminiAPI(actionPrompt, true);
    }
    
    return aiDecision;
}

async function handleDirectCodeExecution(request, tabId) {
    const { code } = request;
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (codeToExecute) => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.textContent = `try { const result = (() => { ${codeToExecute} })(); window.postMessage({ type: 'LITOX_CONSOLE_RESULT', result: result, error: null }, '*'); } catch (e) { window.postMessage({ type: 'LITOX_CONSOLE_RESULT', result: null, error: e.message }, '*'); }`;
                    const listener = (event) => {
                        if (event.source === window && event.data.type === 'LITOX_CONSOLE_RESULT') {
                            window.removeEventListener('message', listener);
                            if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.result);
                        }
                    };
                    window.addEventListener('message', listener);
                    document.head.appendChild(script);
                    script.remove();
                });
            },
            args: [code],
            world: 'MAIN'
        });
        return { result: results[0].result };
    } catch (e) {
        return { error: e.message };
    }
}

function buildConsoleActionPrompt(history, attachedFiles, pageContext) {
    const fileContext = attachedFiles.length > 0 ? `[Attached Files Context]\n${attachedFiles.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join('\n')}\n\n` : '';
    const conversation = history.map(h => `${h.role}: ${h.content}`).join('\n');
    const cleanedDom = pageContext.dom || "No DOM available.";
    const jsVarsContext = pageContext.variables ? `\n**AVAILABLE JS VARIABLES:**\n${JSON.stringify(pageContext.variables)}\n` : '';

    return `
      You are a world-class senior web engineer AI assistant. Your primary directive is to act autonomously and efficiently.
      **CORE INSTRUCTION: NEVER ask the user for information you can find yourself. You have been provided with the COMPLETE, CLEANED HTML of the page. Analyze it directly.**

      **YOUR FIVE CHOICES:**
      1.  **action: "PLAN"**: If the request is complex, requires multiple steps, or navigation. The plan must be in a "plan" property.
      2.  **action: "ANALYZE_AND_REPLY"**: For all single-page data scraping/extraction. Analyze the HTML and return the extracted data in a "data" property.
      3.  **action: "EXECUTE"**: For simple, single-page interactions (clicking, changing styles). Provide the JavaScript code in a "code" property.
      4.  **action: "REQUEST_JS_VARS"**: If you have analyzed the DOM and concluded you need JS variables to proceed.
      5.  **action: "REPLY"**: ONLY if the request is conversational or fundamentally ambiguous.

      --- START CONTEXT ---
      **FULL CLEANED PAGE DOM:**
      \`\`\`html
      ${cleanedDom}
      \`\`\`
      ${jsVarsContext}
      ${fileContext}
      [Conversation History]
      ${conversation}
      --- END CONTEXT ---
      
      **YOUR DECISION (JSON only):**
    `;
}

// --- PHANTOM MODE LOGIC ---
async function handleGeneratePlan(objective, tabId) {
    const pageContext = await getPageContext(tabId);
    const plannerPrompt = buildPlannerPrompt(objective, pageContext);
    return callGeminiAPI(plannerPrompt, true);
}

function buildPlannerPrompt(objective, pageContext) {
    const cleanedDom = pageContext.dom || "No DOM available.";
    return `
      You are an AI Task Planner. Convert a user objective into a structured JSON array of commands. Use the provided initial CLEANED page DOM to make your first steps more accurate.
      **COMMAND SET:** [NAVIGATE, CLICK, FILL, SUBMIT, WAIT_FOR_ELEMENT, EXTRACT_DATA, CALL_LLM, NOTIFY]
      **User Objective:** "${objective}"
      **Initial Page DOM (Cleaned):**
      \`\`\`html
      ${cleanedDom}
      \`\`\`
      Generate only the JSON array for the action plan.`;
}

async function executePlan(plan, secrets, requesterTabId) {
    const log = (message) => {
        if(requesterTabId) chrome.tabs.sendMessage(requesterTabId, { type: 'UPDATE_EXECUTION_LOG', message }).catch(e => {});
    };
    log(`> Plan received. Deploying agent...`);
    
    let phantomTabId;
    try {
        const tab = await chrome.tabs.create({ active: false });
        phantomTabId = tab.id;
    } catch (e) {
        log(`<span class="text-red-500">> CRITICAL ERROR: Could not create phantom tab. Mission aborted.</span>`);
        return;
    }

    let executionContext = {};
    const secretsMap = new Map(secrets.map(s => [s.key, s.value]));

    for (let i = 0; i < plan.length; i++) {
        const step = plan[i];
        try {
            if (step.target) step.target = step.target.replace(/{{(.*?)}}/g, (_, key) => executionContext[key.trim()] || '');
            if (step.value && typeof step.value === 'string') {
                if (step.value.startsWith('SECRET.')) {
                    const key = step.value.replace('SECRET.', '');
                    if (!secretsMap.has(key)) throw new Error(`Secret "${key}" not in Vault.`);
                    step.value = secretsMap.get(key);
                } else {
                    step.value = step.value.replace(/{{(.*?)}}/g, (_, key) => executionContext[key.trim()] || '');
                }
            }

            log(`> [${i+1}/${plan.length}] <span class="text-cyan-400">${step.command}</span>: ${step.description}`);

            switch (step.command) {
                case 'NAVIGATE':
                    await chrome.tabs.update(phantomTabId, { url: step.target });
                    await waitForTabLoad(phantomTabId);
                    break;
                case 'WAIT_FOR_ELEMENT':
                    await waitForElement(phantomTabId, step.target, parseInt(step.value, 10) || 10000);
                    break;
                case 'CLICK':
                    await chrome.scripting.executeScript({ target: { tabId: phantomTabId }, func: (s) => document.querySelector(s)?.click(), args: [step.target] });
                    break;
                case 'FILL':
                    await chrome.scripting.executeScript({ target: { tabId: phantomTabId }, func: (s, v) => { document.querySelector(s).value = v; }, args: [step.target, step.value] });
                    break;
                case 'SUBMIT':
                     await chrome.scripting.executeScript({ target: { tabId: phantomTabId }, func: (s) => document.querySelector(s)?.submit(), args: [step.target] });
                    await waitForTabLoad(phantomTabId);
                    break;
                case 'EXTRACT_DATA':
                    const results = await chrome.scripting.executeScript({ target: { tabId: phantomTabId }, func: (s) => Array.from(document.querySelectorAll(s)).map(el => el.innerText), args: [step.target] });
                    executionContext[step.value] = results[0].result.length === 1 ? results[0].result[0] : results[0].result;
                    break;
                case 'CALL_LLM':
                    const llmResponse = await callGeminiAPI(step.value);
                    executionContext['llm_response'] = llmResponse;
                    break;
                case 'NOTIFY':
                    log(`<span class="text-yellow-400">> MISSION REPORT: ${step.value}</span>`);
                    break;
            }
             log(`> Step ${i+1} <span class="text-green-400">OK</span>`);
        } catch (e) {
            log(`> Step ${i+1} <span class="text-red-500">FAILED</span>: ${e.message}`);
            await chrome.tabs.remove(phantomTabId).catch(()=>{});
            return;
        }
    }
    
    log(`<strong class="text-green-400">> Mission Accomplished.</strong>`);
    await new Promise(r => setTimeout(r, 3000));
    await chrome.tabs.remove(phantomTabId).catch(()=>{});
}

// --- HELPER FUNCTIONS ---
async function getPageContext(tabId) {
    if (!tabId) return { dom: 'Error: Active tab not found.', variables: {} };
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                const getCleanedDom = () => {
                    const clonedDoc = document.documentElement.cloneNode(true);
                    clonedDoc.querySelectorAll('script, style, link[rel="stylesheet"]').forEach(el => el.remove());
                    return clonedDoc.outerHTML;
                };
                return new Promise((resolve) => {
                    const listener = (event) => {
                        if (event.source === window && event.data.type === 'FROM_INJECTOR') {
                            window.removeEventListener('message', listener);
                            resolve({ dom: getCleanedDom(), variables: event.data.variables });
                        }
                    };
                    window.addEventListener('message', listener);
                    window.postMessage({ type: 'GET_VARS_FROM_PAGE' }, '*');
                });
            },
        });
        if (results && results[0] && results[0].result) {
            return results[0].result;
        }
    } catch (e) {
        return { dom: `Error: Could not access page content. It might be a protected page (${e.message})`, variables: {} };
    }
    return { dom: '', variables: {} };
}

async function waitForTabLoad(tabId) {
    return new Promise((resolve) => {
        const listener = (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
}

async function waitForElement(tabId, selector, timeout) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(async () => {
            if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                reject(new Error(`Timeout waiting for element: ${selector}`));
                return;
            }
            try {
                const results = await chrome.scripting.executeScript({ target: { tabId }, func: (s) => !!document.querySelector(s), args: [selector] });
                if (results && results[0] && results[0].result) {
                    clearInterval(interval);
                    resolve();
                }
            } catch(e) { /* Tab might be navigating or closed, ignore errors */ }
        }, 250);
    });
}
