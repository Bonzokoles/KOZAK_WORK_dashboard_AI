        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-avatar">${avatar}</span>
                <span class="message-role">${roleLabel}</span>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${this.formatMessageContent(content)}</div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addToolCallsDisplay(toolCalls) {
        if (!this.chatMessages || !toolCalls.length) return;
        
        const toolsDiv = document.createElement('div');
        toolsDiv.className = 'chat-tool-calls';
        
        toolsDiv.innerHTML = `
            <div class="tool-calls-header">
                <i class="fas fa-tools"></i> 
                Wykonane narzędzia (${toolCalls.length})
            </div>
            <div class="tool-calls-list">
                ${toolCalls.map(tc => `
                    <div class="tool-call-item ${tc.result.success ? 'success' : 'error'}">
                        <div class="tool-call-name">
                            <strong>${tc.tool_name}</strong>
                            <span class="badge badge-${tc.result.success ? 'success' : 'danger'}">
                                Runda ${tc.round}
                            </span>
                        </div>
                        <div class="tool-call-args">
                            ${Object.entries(tc.arguments).map(([key, value]) => 
                                `<code>${key}: ${JSON.stringify(value)}</code>`
                            ).join(' ')}
                        </div>
                        <div class="tool-call-result">
                            ${tc.result.success 
                                ? `✅ ${this.formatToolResult(tc.result.result)}`
                                : `❌ ${tc.result.error}`
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        this.chatMessages.appendChild(toolsDiv);
        this.scrollToBottom();
    }
    
    formatMessageContent(content) {
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    
    formatToolResult(result) {
        if (typeof result === 'object') {
            return `<pre><code>${JSON.stringify(result, null, 2)}</code></pre>`;
        }
        return String(result);
    }
    
    async testTool(toolName) {
        try {
            // Find tool definition
            const tool = this.availableTools.find(t => t.name === toolName);
            if (!tool) {
                this.showAlert(`Narzędzie ${toolName} nie zostało znalezione`, 'danger');
                return;
            }
            
            // Prepare test arguments based on tool parameters
            const testArgs = this.generateTestArguments(tool);
            
            console.log(`Testing tool: ${toolName} with args:`, testArgs);
            
            const response = await fetch(`${this.apiBase}/tools/test/${toolName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ arguments: testArgs })
            });
            
            const data = await response.json();
            
            if (data.success && data.result.success) {
                this.showAlert(
                    `✅ Test ${toolName}: ${JSON.stringify(data.result.result)}`, 
                    'success'
                );
            } else {
                this.showAlert(
                    `❌ Test ${toolName}: ${data.result?.error || data.error}`, 
                    'danger'
                );
            }
            
        } catch (error) {
            console.error('Tool test error:', error);
            this.showAlert(`Błąd testu ${toolName}: ${error.message}`, 'danger');
        }
    }
    
    generateTestArguments(tool) {
        const args = {};
        const params = tool.parameters?.properties || {};
        
        // Generate sample arguments based on parameter types
        for (const [paramName, paramDef] of Object.entries(params)) {
            switch (paramDef.type) {
                case 'string':
                    if (paramName === 'location') args[paramName] = 'Warsaw';
                    else if (paramName === 'path') args[paramName] = '.';
                    else if (paramName === 'command') args[paramName] = 'echo "test"';
                    else if (paramName === 'expression') args[paramName] = '2+2';
                    else if (paramName === 'query') args[paramName] = 'test search';
                    else args[paramName] = 'test';
                    break;
                case 'number':
                    args[paramName] = paramName === 'timeout' ? 5 : 10;
                    break;
                default:
                    args[paramName] = 'test';
            }
        }
        
        return args;
    }
    
    toggleToolsPanel() {
        if (!this.toolsContainer) return;
        
        const isVisible = !this.toolsContainer.classList.contains('collapsed');
        this.toolsContainer.classList.toggle('collapsed', isVisible);
        
        if (this.toolsToggle) {
            this.toolsToggle.innerHTML = `
                <i class="fas fa-tools"></i> 
                Narzędzia ${isVisible ? '▼' : '▲'} (${this.selectedTools.size}/${this.availableTools.length})
            `;
        }
    }
    
    toggleAllTools() {
        const checkboxes = this.toolsList?.querySelectorAll('.tool-checkbox');
        if (!checkboxes) return;
        
        const allSelected = this.selectedTools.size === this.availableTools.length;
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allSelected;
            const toolName = checkbox.dataset.tool;
            
            if (!allSelected) {
                this.selectedTools.add(toolName);
            } else {
                this.selectedTools.delete(toolName);
            }
        });
        
        this.updateToolsCount();
        
        if (this.selectAllTools) {
            this.selectAllTools.textContent = allSelected ? 'Zaznacz wszystkie' : 'Odznacz wszystkie';
        }
    }
    
    clearChat() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = `
                <div class="chat-welcome">
                    <h5>🚀 KOZAK AI Assistant</h5>
                    <p>Witaj! Jestem zaawansowanym asystentem AI z dostępem do ${this.availableTools.length} narzędzi.</p>
                    <p><strong>Mogę:</strong> sprawdzić pogodę, zarządzać plikami, monitorować system, wykonywać obliczenia i wiele więcej!</p>
                    <p><em>Napisz cokolwiek, a ja użyję odpowiednich narzędzi do pomocy.</em></p>
                </div>
            `;
        }
        
        this.conversationHistory = [];
        this.updateStatus('ready', 'Chat wyczyszczony');
    }
    
    setProcessing(processing) {
        this.isProcessing = processing;
        
        if (this.sendButton) {
            this.sendButton.disabled = processing;
            this.sendButton.innerHTML = processing 
                ? '<i class="fas fa-spinner fa-spin"></i>' 
                : '<i class="fas fa-paper-plane"></i>';
        }
        
        if (this.processingIndicator) {
            this.processingIndicator.style.display = processing ? 'block' : 'none';
        }
        
        if (processing) {
            this.updateStatus('processing', 'AI myśli i używa narzędzi...');
        }
    }
    
    updateStatus(type, message) {
        if (!this.statusIndicator) return;
        
        const iconMap = {
            'success': '✅',
            'error': '❌', 
            'processing': '⏳',
            'ready': '🟢'
        };
        
        const colorMap = {
            'success': 'text-success',
            'error': 'text-danger',
            'processing': 'text-warning', 
            'ready': 'text-info'
        };
        
        this.statusIndicator.className = `status-indicator ${colorMap[type] || 'text-muted'}`;
        this.statusIndicator.innerHTML = `${iconMap[type] || '⚪'} ${message}`;
    }
    
    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-2`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert after chat container
        if (this.chatContainer) {
            this.chatContainer.parentNode.insertBefore(alertDiv, this.chatContainer.nextSibling);
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
    
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize KOZAK Chat only if elements exist
    if (document.getElementById('kozak-chat-container')) {
        window.kozakChat = new KOZAKChat();
        console.log('🚀 KOZAK Chat with Function Calling ready!');
    }
});

// Export for global access
window.KOZAKChat = KOZAKChat;