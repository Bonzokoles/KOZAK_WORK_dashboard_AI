// ================================
// CLOUDFLARE WORKERS AI - UI Logic
// ================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cloudflare AI module loading...');

    // Elements
    const cfGenerateBtn = document.getElementById('cf-generate-btn');
    const cfTestBtn = document.getElementById('cf-test-btn');
    const cfPrompt = document.getElementById('cf-prompt');
    const cfModelSelect = document.getElementById('cf-model-select');
    const cfMaxTokens = document.getElementById('cf-max-tokens');
    const cfTemperature = document.getElementById('cf-temperature');
    const cfResult = document.getElementById('cf-result');
    const cfResponse = document.getElementById('cf-response');
    const cfUsedModel = document.getElementById('cf-used-model');
    const cfStatusIndicator = document.getElementById('cf-status-indicator');

    // Test connection on load
    testConnection();

    // Event Listeners
    if (cfGenerateBtn) {
        cfGenerateBtn.addEventListener('click', generateResponse);
    }

    if (cfTestBtn) {
        cfTestBtn.addEventListener('click', testConnection);
    }

    // Generate Response Function
    async function generateResponse() {
        const prompt = cfPrompt.value.trim();
        const model = cfModelSelect.value;
        const maxTokens = parseInt(cfMaxTokens.value);
        const temperature = parseFloat(cfTemperature.value);

        if (!prompt) {
            showAlert('Proszę wpisać prompt', 'warning');
            return;
        }

        // UI State - Loading
        setLoadingState(true);
        cfResult.style.display = 'none';

        try {
            console.log(`🔄 Cloudflare AI request: ${model}`);

            const response = await fetch('/api/cloudflare-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: model,
                    max_tokens: maxTokens,
                    temperature: temperature
                })
            });

            const data = await response.json();

            if (data.success) {
                // Show successful response
                cfResponse.textContent = data.response;
                cfUsedModel.textContent = data.model;
                cfResult.style.display = 'block';

                console.log('✅ Cloudflare AI response received');
                updateStatusIndicator('success');

            } else {
                showAlert(`Błąd: ${data.error}`, 'danger');
                updateStatusIndicator('error');
            }

        } catch (error) {
            console.error('❌ Cloudflare AI error:', error);
            showAlert(`Błąd połączenia: ${error.message}`, 'danger');
            updateStatusIndicator('error');
        } finally {
            setLoadingState(false);
        }
    }

    // Test Connection Function
    async function testConnection() {
        console.log('🔍 Testing Cloudflare AI connection...');
        updateStatusIndicator('testing');

        try {
            const response = await fetch('/api/cloudflare-ai/test');
            const data = await response.json();

            if (data.success) {
                console.log('✅ Cloudflare AI connection successful');
                updateStatusIndicator('success');
                showAlert('Połączenie z Cloudflare Workers AI: OK', 'success');
            } else {
                console.log('⚠️ Cloudflare AI connection failed');
                updateStatusIndicator('error');
                showAlert(`Test połączenia nieudany: ${data.message}`, 'warning');
            }

        } catch (error) {
            console.error('❌ Cloudflare AI test error:', error);
            updateStatusIndicator('error');
            showAlert(`Błąd testu: ${error.message}`, 'danger');
        }
    }

    // UI Helper Functions
    function setLoadingState(loading) {
        cfGenerateBtn.disabled = loading;
        cfTestBtn.disabled = loading;

        if (loading) {
            cfGenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generowanie...';
        } else {
            cfGenerateBtn.innerHTML = '<i class="fas fa-play"></i> Generuj odpowiedź';
        }
    }

    function updateStatusIndicator(status) {
        cfStatusIndicator.className = 'badge ms-2';

        switch (status) {
            case 'success':
                cfStatusIndicator.className += ' badge-success';
                cfStatusIndicator.textContent = '✅ Online';
                break;
            case 'error':
                cfStatusIndicator.className += ' badge-danger';
                cfStatusIndicator.textContent = '❌ Error';
                break;
            case 'testing':
                cfStatusIndicator.className += ' badge-warning';
                cfStatusIndicator.textContent = '⏳ Test...';
                break;
            default:
                cfStatusIndicator.className += ' badge-secondary';
                cfStatusIndicator.textContent = '⏳ Loading';
        }
    }

    function showAlert(message, type) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of card body
        const cardBody = cfGenerateBtn.closest('.card-body');
        cardBody.insertBefore(alertDiv, cardBody.firstChild);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    console.log('✅ Cloudflare AI module loaded successfully');
});
