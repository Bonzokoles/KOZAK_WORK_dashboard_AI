/**
 * KOZAK Cloudflare Workers Direct Integration
 * Bypasses UI buttons - direct API communication
 */

class KOZAKWorkersAPI {
    constructor() {
        this.config = {
            endpoints: {
                ai: '/api/cloudflare-ai',
                tools: '/api/ai/tools',
                chat: '/api/ai/chat'
            },
            defaultModel: '@cf/meta/llama-3.1-8b-instruct',
            maxRetries: 3,
            timeout: 30000
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeWorkersConnection();
        this.setupAutoChat();
    }

    async initializeWorkersConnection() {
        try {
            const response = await this.testConnection();
            if (response.success) {
                this.updateStatus('Online', 'success');
                console.log('✅ Cloudflare Workers AI connected');
            }
        } catch (error) {
            this.updateStatus('Offline', 'error');
            console.error('❌ Workers connection failed:', error);
        }
    }

    async testConnection() {
        const response = await fetch(`${this.config.endpoints.ai}/test`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return { success: true, data: await response.text() };
    }

    async generateResponse(prompt, options = {}) {
        const payload = {
            model: options.model || this.config.defaultModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || 512,
            temperature: options.temperature || 0.7,
            stream: options.stream || false
        };

        try {
            const response = await fetch(this.config.endpoints.ai, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                throw new Error(`Workers API Error: ${response.status}`);
            }

            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('Workers API call failed:', error);
            throw error;
        }
    }

    async chatWithTools(message, tools = []) {
        const payload = {
            message: message,
            tools: tools,
            model: this.config.defaultModel,
            max_tool_rounds: 3
        };

        try {
            const response = await fetch(this.config.endpoints.chat, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Chat API Error: ${response.status}`);
            }

            return await response.json();
            
        } catch (error) {
            console.error('Chat with tools failed:', error);
            throw error;
        }
    }

    async getAvailableTools() {
        try {
            const response = await fetch(this.config.endpoints.tools);
            if (!response.ok) {
                throw new Error(`Tools API Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch tools:', error);
            return [];
        }
    }

    setupEventListeners() {
        // Usuń stare event listenery dla przycisków
        this.removeOldButtonListeners();
        
        // Nowe event listenery dla bezpośredniej integracji
        this.setupChatInterface();
        this.setupModelSelection();
        this.setupKeyboardShortcuts();
    }

    removeOldButtonListeners() {
        // Usuń stare przyciski i zastąp funkcjonalnością
        const oldGenerateBtn = document.getElementById('cf-generate-btn');
        const oldTestBtn = document.getElementById('cf-test-btn');
        
        if (oldGenerateBtn) {
            oldGenerateBtn.style.display = 'none';
        }
        if (oldTestBtn) {
            oldTestBtn.style.display = 'none';
        }
    }

    setupChatInterface() {
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-message');
        const promptTextarea = document.getElementById('cf-prompt');

        // Auto-send on Enter
        if (chatInput) {
            chatInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    await this.handleChatMessage(chatInput.value.trim());
                    chatInput.value = '';
                }
            });
        }

        // Send button
        if (sendButton) {
            sendButton.addEventListener('click', async () => {
                const message = chatInput?.value.trim();
                if (message) {
                    await this.handleChatMessage(message);
                    chatInput.value = '';
                }
            });
        }

        // Cloudflare widget direct integration
        if (promptTextarea) {
            promptTextarea.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    await this.handleDirectGeneration();
                }
            });
        }
    }

    async handleChatMessage(message) {
        if (!message) return;

        this.addMessageToChat('user', message);
        this.showTypingIndicator();

        try {
            // Get available tools
            const tools = await this.getAvailableTools();
            
            // Send to Workers with tools
            const response = await this.chatWithTools(message, tools);
            
            this.hideTypingIndicator();
            
            if (response.success) {
                this.addMessageToChat('assistant', response.response);
                
                // Show tool usage if any
                if (response.tools_used && response.tools_used.length > 0) {
                    this.showToolsUsed(response.tools_used);
                }
            } else {
                this.addMessageToChat('system', `Error: ${response.error}`);
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToChat('system', `Connection error: ${error.message}`);
        }
    }

    async handleDirectGeneration() {
        const promptElement = document.getElementById('cf-prompt');
        const maxTokensElement = document.getElementById('cf-max-tokens');
        const temperatureElement = document.getElementById('cf-temperature');
        const modelElement = document.getElementById('cf-model-select');

        if (!promptElement?.value.trim()) return;

        const options = {
            model: modelElement?.value || this.config.defaultModel,
            maxTokens: parseInt(maxTokensElement?.value) || 512,
            temperature: parseFloat(temperatureElement?.value) || 0.7
        };

        try {
            this.showGenerating();
            
            const response = await this.generateResponse(promptElement.value, options);
            
            this.showResponse(response);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideGenerating();
        }
    }

    setupModelSelection() {
        const modelSelect = document.getElementById('cf-model-select');
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                this.config.defaultModel = e.target.value;
                console.log(`Model switched to: ${e.target.value}`);
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+G - Quick generate
            if (e.ctrlKey && e.shiftKey && e.key === 'G') {
                e.preventDefault();
                this.handleDirectGeneration();
            }
            
            // Ctrl+Shift+T - Test connection
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.testConnection();
            }
        });
    }

    setupAutoChat() {
        // Auto-expand chat widget
        const chatWidget = document.getElementById('chat-widget');
        if (chatWidget) {
            chatWidget.style.display = 'block';
            chatWidget.classList.add('expanded');
        }
    }

    // UI Helper Methods
    addMessageToChat(role, content) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const iconClass = {
            'user': 'fas fa-user',
            'assistant': 'fas fa-robot',
            'system': 'fas fa-exclamation-triangle'
        }[role] || 'fas fa-comment';

        messageDiv.innerHTML = `
            <div class="message-header">
                <i class="${iconClass}"></i>
                <span class="role">${role.toUpperCase()}</span>
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${this.formatContent(content)}</div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatContent(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message assistant typing';
        typingDiv.innerHTML = `
            <div class="message-header">
                <i class="fas fa-robot"></i>
                <span class="role">ASSISTANT</span>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;

        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showToolsUsed(tools) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages || !tools.length) return;

        const toolsDiv = document.createElement('div');
        toolsDiv.className = 'message system tools-used';
        toolsDiv.innerHTML = `
            <div class="message-header">
                <i class="fas fa-tools"></i>
                <span class="role">TOOLS USED</span>
            </div>
            <div class="message-content">
                ${tools.map(tool => `<span class="tool-badge">${tool}</span>`).join(' ')}
            </div>
        `;

        chatMessages.appendChild(toolsDiv);
    }

    showResponse(response) {
        const resultDiv = document.getElementById('cf-result');
        const responseDiv = document.getElementById('cf-response');
        const modelSpan = document.getElementById('cf-used-model');

        if (resultDiv) resultDiv.style.display = 'block';
        if (responseDiv) responseDiv.textContent = response.response || response.result || 'No response';
        if (modelSpan) modelSpan.textContent = response.model || this.config.defaultModel;
    }

    showError(message) {
        const resultDiv = document.getElementById('cf-result');
        const responseDiv = document.getElementById('cf-response');

        if (resultDiv) resultDiv.style.display = 'block';
        if (responseDiv) {
            responseDiv.innerHTML = `<span style="color: #ff6b6b;">Error: ${message}</span>`;
        }
    }

    showGenerating() {
        const generateBtn = document.getElementById('cf-generate-btn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }
    }

    hideGenerating() {
        const generateBtn = document.getElementById('cf-generate-btn');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-play"></i> Generuj odpowiedź';
        }
    }

    updateStatus(status, type) {
        const statusIndicator = document.getElementById('cf-status-indicator');
        if (statusIndicator) {
            statusIndicator.textContent = status;
            statusIndicator.className = `badge badge-${type === 'success' ? 'success' : 'danger'} ms-2`;
        }
    }
}

// Initialize on page load
let kozakWorkers = null;

document.addEventListener('DOMContentLoaded', () => {
    try {
        kozakWorkers = new KOZAKWorkersAPI();
        console.log('✅ KOZAK Workers API initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Workers API:', error);
    }
});

// Export for global access
window.KOZAKWorkersAPI = KOZAKWorkersAPI;
