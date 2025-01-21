// API call function using async/await
async function makeApiCall(prompt) {
    try {
        const apiKey = await getApiKey();
        
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: MAX_TOKENS,
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Invalid API key, clear it and show modal again
                await chrome.storage.sync.remove(['apiKey']);
                return makeApiCall(prompt);
            }
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid API response format');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error("API call failed:", error);
        throw new Error('Failed to generate response. Please try again later.');
    }
}

// Get API key from storage or prompt user
async function getApiKey() {
    const result = await chrome.storage.sync.get(['apiKey']);
    if (result.apiKey) {
        return result.apiKey;
    }
    return showApiKeyModal();
}

// Create and show API key modal
function showApiKeyModal() {
    return new Promise((resolve, reject) => {
        const overlay = document.createElement('div');
        const modal = document.createElement('div');
        
        Object.assign(overlay.style, MODAL_STYLES.overlay);
        Object.assign(modal.style, MODAL_STYLES.modal);
        
        modal.innerHTML = `
            <form id="apiKeyForm" style="width: 400px;">
                <h2 style="margin-top: 0;">API Key Required</h2>
                <p>Please enter your OpenAI API key to use this feature:</p>
                <input type="text" id="apiKeyInput" placeholder="sk-..." style="${Object.entries(MODAL_STYLES.input).map(([k, v]) => `${k}:${v}`).join(';')}">
                <div id="apiKeyError" style="${Object.entries(MODAL_STYLES.error).map(([k, v]) => `${k}:${v}`).join(';')}">Invalid API key format</div>
                <button type="submit" id="saveApiKey" style="${Object.entries(MODAL_STYLES.button).map(([k, v]) => `${k}:${v}`).join(';')}">Save API Key</button>
            </form>
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#apiKeyForm');
        const input = modal.querySelector('#apiKeyInput');
        const error = modal.querySelector('#apiKeyError');
        
        async function handleSubmit(event) {
            event.preventDefault();
            const apiKey = input.value.trim();
            
            if (!apiKey.startsWith('sk-')) {
                error.style.display = 'block';
                return;
            }
            
            try {
                await chrome.storage.sync.set({ apiKey });
                overlay.remove();
                modal.remove();
                resolve(apiKey);
            } catch (err) {
                reject(err);
            }
        }
        
        form.addEventListener('submit', handleSubmit);
        input.addEventListener('input', () => {
            error.style.display = 'none';
        });

        // Focus the input field when modal opens
        setTimeout(() => input.focus(), 0);
    });
}

// Button creation function
function createAIReplyButton() {
    const button = document.createElement('button');
    button.innerText = UI_CONSTANTS.BUTTON_TEXT;
    button.className = 'ai-reply-button';
    Object.assign(button.style, UI_CONSTANTS.BUTTON_STYLES);

    button.addEventListener('mouseover', () => button.style.backgroundColor = UI_CONSTANTS.HOVER_COLOR);
    button.addEventListener('mouseout', () => button.style.backgroundColor = UI_CONSTANTS.DEFAULT_COLOR);
    button.addEventListener('click', handleButtonClick);

    return button;
}

// Button click handler
async function handleButtonClick(event) {
    const button = event.currentTarget;
    const toolbar = button.closest('.msg-form__left-actions');
    
    if (!toolbar) {
        console.error('Could not find toolbar element');
        return;
    }

    updateButtonState(button, true);

    try {
        await handleAIResponse(toolbar);
    } catch (error) {
        console.error("Failed to get AI response:", error);
        showErrorMessage(toolbar, error.message);
    } finally {
        updateButtonState(button, false);
    }
}

// Update button state
function updateButtonState(button, isLoading) {
    button.innerText = isLoading ? UI_CONSTANTS.LOADING_TEXT : UI_CONSTANTS.BUTTON_TEXT;
    button.disabled = isLoading;
}

// Show error message to user
function showErrorMessage(toolbar, message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
    errorDiv.innerText = message;
    
    const existingError = toolbar.querySelector('.ai-error-message');
    if (existingError) {
        existingError.remove();
    }
    
    errorDiv.className = 'ai-error-message';
    toolbar.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// AI response handler
async function handleAIResponse(toolbar) {
    const conversationBubble = toolbar.closest('.msg-overlay-conversation-bubble');
    if (!conversationBubble) {
        throw new Error('Could not find conversation context');
    }

    const otherName = getOtherParticipantName(conversationBubble);
    const conversation = getConversationText(conversationBubble);
    const promptText = generatePrompt(otherName, conversation);

    const response = await makeApiCall(promptText);
    await updateMessageBox(conversationBubble, response);
}

// Get other participant's name
function getOtherParticipantName(conversationBubble) {
    const nameElement = conversationBubble.querySelector('.msg-s-event-listitem .msg-s-message-group__profile-link');
    return nameElement?.innerText.trim() || 'Unknown';
}

// Generate prompt text
function generatePrompt(otherName, conversation) {
    return `My name is ${MY_NAME}. I got a message on LinkedIn from ${otherName}. Write a polite rejection for this conversation using the language of the sender: '${conversation}'`;
}

// Update message box with response
async function updateMessageBox(conversationBubble, response) {
    const messageBox = conversationBubble.querySelector('.msg-form__contenteditable p');
    if (!messageBox) {
        throw new Error('Could not find message input box');
    }

    messageBox.innerHTML = response;
    togglePlaceholderVisibility(messageBox);
}

// Helper function to get conversation text
function getConversationText(conversationBubble) {
    return Array.from(conversationBubble.querySelectorAll('.msg-s-event-listitem .msg-s-message-group__profile-link, .msg-s-event-listitem .msg-s-event-with-indicator p'))
        .map(e => e.innerText.trim())
        .map(t => [MY_NAME, 'Unknown'].includes(t) ? `${t}:` : t)
        .join(', ')
        .replaceAll('<!---->', '');
}

// Toggle placeholder visibility
function togglePlaceholderVisibility(messageBox) {
    const placeholderDiv = messageBox.closest('.msg-overlay-conversation-bubble').querySelector('.msg-form__placeholder');
    if (placeholderDiv) {
        placeholderDiv.style.display = messageBox.innerText.trim() ? 'none' : 'block';
    }
}

// Inject button into toolbar
function injectButton(toolbar) {
    if (toolbar.classList.contains('ai-button-injected')) {
        return;
    }
    
    const button = createAIReplyButton();
    toolbar.appendChild(button);
    toolbar.classList.add('ai-button-injected');
}

// Observe and inject buttons into new conversation toolbars
function observeConversations() {
    const observer = new MutationObserver((mutations) => {
        document.querySelectorAll('.msg-form__left-actions:not(.ai-button-injected)').forEach(injectButton);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial injection
    document.querySelectorAll('.msg-form__left-actions:not(.ai-button-injected)').forEach(injectButton);
}

// Start observing the conversations
observeConversations();