document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const extensionToggle = document.getElementById('extensionToggle');
    const shortcutsToggle = document.getElementById('shortcutsToggle');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Botones de acción
    const sentenceCaseBtn = document.getElementById('sentenceCase');
    const lowerCaseBtn = document.getElementById('lowerCase');
    const upperCaseBtn = document.getElementById('upperCase');
    const replaceTextBtn = document.getElementById('replaceText');
    
    // Reemplazo
    const findTextInput = document.getElementById('findText');
    const replaceWithInput = document.getElementById('replaceWithText');
    const saveReplaceConfigIcon = document.getElementById('saveReplaceConfig');
    const replaceRuleDiv = document.getElementById('replaceRule');

    // Inicializar la extensión
    init();

    function init() {
        loadSettings();
        loadReplaceConfig();
        setupEventListeners();
    }

    function loadSettings() {
        chrome.storage.sync.get(['extensionEnabled', 'shortcutsEnabled'], (result) => {
            extensionToggle.checked = result.extensionEnabled !== false;
            shortcutsToggle.checked = result.shortcutsEnabled !== false;
        });
    }

    function setupEventListeners() {
        // Tabs
        tabButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });

        // Toggles
        extensionToggle.addEventListener('change', () => {
            const enabled = extensionToggle.checked;
            chrome.storage.sync.set({ extensionEnabled: enabled });
            sendMessageToContentScript({ action: 'toggleExtension', enabled });
        });

        shortcutsToggle.addEventListener('change', () => {
            const enabled = shortcutsToggle.checked;
            chrome.storage.sync.set({ shortcutsEnabled: enabled });
            sendMessageToContentScript({ action: 'toggleShortcuts', enabled });
        });

        // Botones de edición
        sentenceCaseBtn.addEventListener('click', () => executeAction('sentenceCase'));
        lowerCaseBtn.addEventListener('click', () => executeAction('lowerCase'));
        upperCaseBtn.addEventListener('click', () => executeAction('upperCase'));

        // Atajo para reemplazo rápido
        document.addEventListener('keydown', function(e) {
            // Alt+Shift+R
            if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'r') {
                e.preventDefault();
                chrome.storage.sync.get(['quickReplace'], (result) => {
        // Guardar configuración de reemplazo al hacer click en el icono ⬇️
        saveReplaceConfigIcon.addEventListener('click', () => {
            guardarReemplazo();
        });
        // Guardar automáticamente al cambiar los campos
        findTextInput.addEventListener('input', guardarReemplazo);
        replaceWithInput.addEventListener('input', guardarReemplazo);
    function guardarReemplazo() {
        const findText = findTextInput.value.trim();
        const replaceWith = replaceWithInput.value.trim();
        chrome.storage.sync.set({ findText, replaceWith }, () => {
            showReplaceRule(findText, replaceWith);
            if (findText && replaceWith) {
                saveReplaceConfigIcon.style.color = '#28a745';
                saveReplaceConfigIcon.title = 'Configurado';
            } else {
                saveReplaceConfigIcon.style.color = '#dc3545';
                saveReplaceConfigIcon.title = 'Faltan datos';
            }
            setTimeout(() => {
                saveReplaceConfigIcon.style.color = '#667eea';
                saveReplaceConfigIcon.title = 'Guardar configuración';
            }, 1200);
        });
    }
                    const quickReplace = result.quickReplace || { find: '', replace: '' };
                    if (quickReplace.find && quickReplace.replace) {
                        // Ejecutar reemplazo directo en la selección
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs[0]) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: 'quickReplace',
                                    find: quickReplace.find,
                                    replace: quickReplace.replace
                            }, (response) => {
                                if (chrome.runtime.lastError) {
                                    showErrorIndicator('No se pudo comunicar con la pestaña', 'error');
                                    return;
                                }
                                if (response && response.success) {
                                    showErrorIndicator('Reemplazo realizado', 'success');
                                } else {
                                    showErrorIndicator('No se pudo reemplazar', 'error');
                                }
                            });
                        }
                    });
                    } else {
                        // Abrir popup y mostrar modal para ingresar los valores
                        chrome.runtime.sendMessage({ action: 'openReplaceConfig' });
                    }
                });
            }
        });
    }

    function switchTab(tabName) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    // --- ARREGLAR ACCIONES DE BOTONES DE EDICIÓN ---
    // Usar content script para transformar y pegar texto seleccionado
    function executeAction(action) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'transformAndPaste', type: action }, (response) => {
                    if (chrome.runtime.lastError) {
                        showErrorIndicator('No se pudo comunicar con la pestaña', 'error');
                        return;
                    }
                    if (response && response.success) {
                        showErrorIndicator('Transformado y pegado', 'success');
                    } else {
                        showErrorIndicator('No se pudo transformar/pegar', 'error');
                    }
                });
            }
        });
    }

    // Indicador de texto y errores en la parte inferior izquierda
    function showErrorIndicator(message, type) {
        let indicator = document.getElementById('text-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'text-indicator';
            document.body.appendChild(indicator);
        }
        indicator.textContent = message;
        indicator.style.position = 'fixed';
        indicator.style.bottom = '20px';
        indicator.style.left = '20px';
        indicator.style.background = type === 'error' ? '#dc3545' : (type === 'success' ? '#28a745' : '#ffc107');
        indicator.style.color = 'white';
        indicator.style.padding = '10px 15px';
        indicator.style.borderRadius = '6px';
        indicator.style.fontSize = '13px';
        indicator.style.zIndex = '10000';
        indicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        indicator.style.maxWidth = '350px';
        indicator.style.pointerEvents = 'none';
        indicator.style.fontFamily = 'inherit';
        indicator.style.transition = 'opacity 0.3s';
        indicator.style.opacity = '1';
        clearTimeout(window._indicatorTimeout);
        window._indicatorTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 3000);
    }

    function sendMessageToContentScript(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, message);
            }
        });
    }

    // Funciones de plantillas

    function loadReplaceConfig() {
        chrome.storage.sync.get(['findText', 'replaceWith'], (result) => {
            findTextInput.value = result.findText || '';
            replaceWithInput.value = result.replaceWith || '';
            showReplaceRule(result.findText, result.replaceWith);
        });
    }

    function showReplaceRule(findText, replaceWith) {
        if (findText && replaceWith) {
            replaceRuleDiv.innerHTML = `<span style='background:#f5f5f5;border-radius:5px;padding:6px 12px;border:1px solid #eee;'>${findText} <span style='color:#667eea;font-weight:bold;'>➡️</span> ${replaceWith}</span>`;
        } else {
            replaceRuleDiv.innerHTML = `<span style='color:#aaa;'>Sin configuración de reemplazo.</span>`;
        }
    }

    // Funciones globales para los botones de plantillas
    function addTemplateListeners() {
        // Copiar
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.onclick = function() {
                const index = parseInt(this.closest('.template-item').dataset.index);
                chrome.storage.sync.get(['templates'], (result) => {
                    const templates = result.templates || [];
                    if (templates[index]) {
                        navigator.clipboard.writeText(templates[index].content).then(() => {
                            showNotification('Texto copiado al portapapeles');
                        }).catch(() => {
                            showNotification('No se pudo copiar');
                        });
                    }
                });
            };
        });
        // Insertar
        document.querySelectorAll('.insert-btn').forEach(btn => {
            btn.onclick = function() {
                const index = parseInt(this.closest('.template-item').dataset.index);
                chrome.storage.sync.get(['templates'], (result) => {
                    const templates = result.templates || [];
                    if (templates[index]) {
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs[0]) {
                                chrome.scripting.executeScript({
                                    target: { tabId: tabs[0].id },
                                    func: (text) => {
                                        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                                            const el = document.activeElement;
                                            const start = el.selectionStart;
                                            const end = el.selectionEnd;
                                            el.setRangeText(text, start, end, 'end');
                                        } else if (window.getSelection) {
                                            const sel = window.getSelection();
                                            if (sel.rangeCount > 0) {
                                                sel.deleteFromDocument();
                                                document.execCommand('insertText', false, text);
                                            }
                                        }
                                    },
                                    args: [templates[index].content]
                                });
                                showNotification('Plantilla insertada');
                                window.close();
                            }
                        });
                    }
                });
            };
        });
        // Editar
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function() {
                const index = parseInt(this.closest('.template-item').dataset.index);
                chrome.storage.sync.get(['templates'], (result) => {
                    const templates = result.templates || [];
                    if (templates[index]) {
                        showTemplateModal(templates[index], index);
                    }
                });
            };
        });
        // Eliminar con pulsación larga
        document.querySelectorAll('.delete-btn').forEach(btn => {
            let timeout;
            btn.onmousedown = function() {
                const index = parseInt(this.closest('.template-item').dataset.index);
                timeout = setTimeout(() => {
                    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
                        chrome.storage.sync.get(['templates'], (result) => {
                            let templates = result.templates || [];
                            templates.splice(index, 1);
                            chrome.storage.sync.set({ templates }, () => {
                                loadTemplates();
                                showNotification('Plantilla eliminada');
                            });
                        });
                    }
                }, 2000);
            };
            btn.onmouseup = btn.onmouseleave = function() {
                clearTimeout(timeout);
            };
        });
    }

    function renderTemplates(templates) {
        if (templates.length === 0) {
            templatesList.innerHTML = `
                <div class="empty-state">
                    No hay plantillas guardadas.<br>
                    Haz clic en "+ Nueva" para crear una.
                </div>
            `;
            return;
        }
        templatesList.innerHTML = templates.map((template, index) => `
            <div class="template-item" data-index="${index}">
                <div class="template-title">${escapeHtml(template.title)}</div>
                <div class="template-preview">${escapeHtml(template.content.substring(0, 50))}${template.content.length > 50 ? '...' : ''}</div>
                <div class="template-actions">
                    <button class="template-btn copy-btn">Copiar</button>
                    <button class="template-btn insert-btn">Insertar</button>
                    <button class="template-btn edit-btn">Editar</button>
                    <button class="template-btn delete-btn">Eliminar</button>
                </div>
            </div>
        `).join('');
        addTemplateListeners();
    }

    function showTemplateModal(template = null, index = null) {
        const modalTitle = document.getElementById('modalTitle');
        const templateTitle = document.getElementById('templateTitle');
        const templateContent = document.getElementById('templateContent');

        if (template) {
            modalTitle.textContent = 'Editar Plantilla';
            templateTitle.value = template.title;
            templateContent.value = template.content;
            currentEditingTemplate = index;
        } else {
            modalTitle.textContent = 'Nueva Plantilla';
            templateTitle.value = '';
            templateContent.value = '';
            currentEditingTemplate = null;
        }

        templateModal.style.display = 'block';
        templateTitle.focus();
    }

    function hideTemplateModal() {
        templateModal.style.display = 'none';
        currentEditingTemplate = null;
    }

    function saveTemplateData() {
        const title = document.getElementById('templateTitle').value.trim();
        const content = document.getElementById('templateContent').value.trim();

        if (!title || !content) {
            alert('Por favor, completa el título y el contenido.');
            return;
        }

        chrome.storage.sync.get(['templates'], (result) => {
            let templates = result.templates || [];
            
            const newTemplate = { title, content, created: Date.now() };
            
            if (currentEditingTemplate !== null) {
                templates[currentEditingTemplate] = newTemplate;
            } else {
                templates.push(newTemplate);
            }

            chrome.storage.sync.set({ templates }, () => {
                loadTemplates();
                hideTemplateModal();
            });
        });
    }

    // Modal de reemplazar
    function showReplaceModal() {
        replaceModal.style.display = 'block';
        document.getElementById('findText').focus();
        // Si hay valores guardados, precargarlos
        chrome.storage.sync.get(['quickReplace'], (result) => {
            const quickReplace = result.quickReplace || { find: '', replace: '' };
            document.getElementById('findText').value = quickReplace.find || '';
            document.getElementById('replaceWithText').value = quickReplace.replace || '';
        });
    }

    function hideReplaceModal() {
        replaceModal.style.display = 'none';
        document.getElementById('findText').value = '';
        document.getElementById('replaceWithText').value = '';
    }

    function executeReplace() {
        const findText = document.getElementById('findText').value;
        const replaceWith = document.getElementById('replaceWithText').value;

        if (!findText) {
            alert('Por favor, ingresa el texto a buscar.');
            return;
        }

        sendMessageToContentScript({ 
            action: 'replaceText', 
            findText, 
            replaceWith 
        });
        
        hideReplaceModal();
        window.close();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    // Guardar configuración rápida de reemplazo desde el modal
    document.getElementById('saveTemplate')?.addEventListener('click', window.saveQuickReplace);
    document.getElementById('replaceAll')?.addEventListener('click', window.saveQuickReplace);
    window.saveQuickReplace = function() {
        const find = document.getElementById('findText').value.trim();
        const replace = document.getElementById('replaceWithText').value.trim();
        chrome.storage.sync.set({ quickReplace: { find, replace } }, () => {
            showNotification('Configuración de reemplazo guardada');
        });
    }
});