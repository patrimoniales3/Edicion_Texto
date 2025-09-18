// content.js - Script que se ejecuta en todas las páginas web
(function() {
    'use strict';

    let extensionEnabled = true;
    let shortcutsEnabled = true;
    let lastSelectedText = '';
    let lastActiveElement = null;

    // Inicializar la extensión
    init();

    function init() {
        loadSettings();
        setupEventListeners();
        console.log('Edición de Texto - Extensión cargada');
    }

    function loadSettings() {
        chrome.storage.sync.get(['extensionEnabled', 'shortcutsEnabled'], (result) => {
            extensionEnabled = result.extensionEnabled !== false;
            shortcutsEnabled = result.shortcutsEnabled !== false;
        });
    }

    function setupEventListeners() {
        // Escuchar mensajes desde el popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (!extensionEnabled && message.action !== 'toggleExtension') {
                return;
            }

            switch (message.action) {
                case 'toggleExtension':
                    extensionEnabled = message.enabled;
                    break;
                case 'toggleShortcuts':
                    shortcutsEnabled = message.enabled;
                    break;
                case 'sentenceCase':
                    applySentenceCase();
                    break;
                case 'lowerCase':
                    applyLowerCase();
                    break;
                case 'upperCase':
                    applyUpperCase();
                    break;
                case 'replaceText':
                    replaceText(message.findText, message.replaceWith);
                    break;
                case 'insertText':
                    insertText(message.text);
                    break;
            }
        });

        // Escuchar atajos de teclado
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Guardar el elemento activo y texto seleccionado
        document.addEventListener('mouseup', saveSelection);
        document.addEventListener('keyup', saveSelection);
    }

    function handleKeyboardShortcuts(e) {
        if (!extensionEnabled || !shortcutsEnabled) return;

        // Verificar si estamos en un campo de entrada
        const activeElement = document.activeElement;
        const isInputField = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );

        // Alt + Shift + combinaciones
        if (e.altKey && e.shiftKey) {
            let handled = false;
            switch (e.key.toLowerCase()) {
                case 'e':
                    break;
                case 's':
                    e.preventDefault();
                    applySentenceCase();
                    handled = true;
                    break;
                case 'l':
                    e.preventDefault();
                    applyLowerCase();
                    handled = true;
                    break;
                case 'u':
                    e.preventDefault();
                    applyUpperCase();
                    handled = true;
                    break;
                // Atajo Alt+Shift+R eliminado
            }
            if (handled) {
                e.stopPropagation();
            }
        }
    // copyToClipboard eliminado (funcionalidad de reemplazo rápido retirada)
    }

    function saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            lastSelectedText = selection.toString();
            lastActiveElement = document.activeElement;
        }
    }

    function getSelectedText() {
        const selection = window.getSelection();
        return selection.toString();
    }

    function replaceSelectedText(newText) {
        const selection = window.getSelection();
        const activeElement = document.activeElement;

        if (activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA'
        )) {
            // Para campos de entrada regulares
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const currentValue = activeElement.value;
            
            if (start !== end) {
                activeElement.value = currentValue.substring(0, start) + newText + currentValue.substring(end);
                activeElement.setSelectionRange(start, start + newText.length);
            }
        } else if (activeElement && activeElement.contentEditable === 'true') {
            // Para elementos editables
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(newText));
                
                // Mover el cursor al final del texto insertado
                range.setStartAfter(range.endContainer);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else if (selection.rangeCount > 0) {
            // Para cualquier otro texto seleccionado
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(newText));
        }
    }

    function applySentenceCase() {
        const selectedText = getSelectedText();
        if (!selectedText) {
            showNotification('Por favor, selecciona texto primero');
            return;
        }

        const sentenceCaseText = selectedText.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, function(match) {
            return match.toUpperCase();
        });

        replaceSelectedText(sentenceCaseText);
        showNotification('Texto convertido a tipo oración');
    }

    function applyLowerCase() {
        const selectedText = getSelectedText();
        if (!selectedText) {
            showNotification('Por favor, selecciona texto primero');
            return;
        }

        replaceSelectedText(selectedText.toLowerCase());
        showNotification('Texto convertido a minúsculas');
    }

    function applyUpperCase() {
        const selectedText = getSelectedText();
        if (!selectedText) {
            showNotification('Por favor, selecciona texto primero');
            return;
        }

        replaceSelectedText(selectedText.toUpperCase());
        showNotification('Texto convertido a MAYÚSCULAS');
    }

    function replaceText(findText, replaceWith) {
        const activeElement = document.activeElement;
        
        if (activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA'
        )) {
            // Para campos de entrada
            const currentValue = activeElement.value;
            const newValue = currentValue.replace(new RegExp(escapeRegExp(findText), 'g'), replaceWith);
            activeElement.value = newValue;
            
            const replacements = (currentValue.match(new RegExp(escapeRegExp(findText), 'g')) || []).length;
            showNotification(`${replacements} reemplazos realizados`);
        } else if (activeElement && activeElement.contentEditable === 'true') {
            // Para elementos editables
            const currentText = activeElement.textContent;
            const newText = currentText.replace(new RegExp(escapeRegExp(findText), 'g'), replaceWith);
            activeElement.textContent = newText;
            
            const replacements = (currentText.match(new RegExp(escapeRegExp(findText), 'g')) || []).length;
            showNotification(`${replacements} reemplazos realizados`);
        } else {
            // Para toda la página (más complejo, solo texto visible)
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        // Evitar scripts, estilos, etc.
                        const parent = node.parentElement;
                        if (parent && (
                            parent.tagName === 'SCRIPT' ||
                            parent.tagName === 'STYLE' ||
                            parent.tagName === 'NOSCRIPT'
                        )) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            let node;
            let replacements = 0;
            const nodesToReplace = [];

            while (node = walker.nextNode()) {
                if (node.textContent.includes(findText)) {
                    nodesToReplace.push(node);
                }
            }

            nodesToReplace.forEach(node => {
                const matches = (node.textContent.match(new RegExp(escapeRegExp(findText), 'g')) || []).length;
                replacements += matches;
                node.textContent = node.textContent.replace(new RegExp(escapeRegExp(findText), 'g'), replaceWith);
            });

            showNotification(`${replacements} reemplazos realizados en la página`);
        }
    }

    function insertText(text) {
        const activeElement = document.activeElement;
        
        if (activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA'
        )) {
            // Para campos de entrada
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const currentValue = activeElement.value;
            
            activeElement.value = currentValue.substring(0, start) + text + currentValue.substring(end);
            activeElement.setSelectionRange(start + text.length, start + text.length);
            activeElement.focus();
        } else if (activeElement && activeElement.contentEditable === 'true') {
            // Para elementos editables
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                
                // Mover cursor al final
                range.setStartAfter(range.endContainer);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            // Intentar encontrar el primer campo de texto visible
            const textFields = document.querySelectorAll('input[type="text"], input:not([type]), textarea, [contenteditable="true"]');
            for (let field of textFields) {
                if (isElementVisible(field)) {
                    field.focus();
                    if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                        field.value += text;
                    } else {
                        field.textContent += text;
                    }
                    break;
                }
            }
        }
        
        showNotification('Plantilla insertada');
    }

    function showReplaceDialog() {
        const findText = prompt('Buscar texto:');
        if (findText) {
            const replaceWith = prompt('Reemplazar con:') || '';
            replaceText(findText, replaceWith);
        }
    }

    function isElementVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function showNotification(message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Agregar animación CSS
        if (!document.querySelector('#textEditorNotificationStyles')) {
            const styles = document.createElement('style');
            styles.id = 'textEditorNotificationStyles';
            styles.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 2500);
    }
})();