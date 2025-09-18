// background.js - Service Worker para la extensión
chrome.runtime.onInstalled.addListener(() => {
    console.log('Edición de Texto - Extensión instalada');
    
    // Configuración inicial
    chrome.storage.sync.set({
        extensionEnabled: true,
        shortcutsEnabled: true,
        templates: []
    });
});

// Manejar comandos de teclado
chrome.commands.onCommand.addListener((command) => {
    chrome.storage.sync.get(['extensionEnabled', 'shortcutsEnabled'], (result) => {
        if (!result.extensionEnabled || !result.shortcutsEnabled) {
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                switch (command) {
                    case 'toggle-extension':
                        toggleExtension();
                        break;
                    case 'sentence-case':
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'sentenceCase' });
                        break;
                    case 'lowercase':
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'lowerCase' });
                        break;
                    case 'uppercase':
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'upperCase' });
                        break;
                    // case 'replace-text' eliminado (atajo de reemplazo rápido removido)
                }
            }
        });
    });
});

// Función para alternar la extensión
function toggleExtension() {
    chrome.storage.sync.get(['extensionEnabled'], (result) => {
        const newState = !result.extensionEnabled;
        chrome.storage.sync.set({ extensionEnabled: newState });
        
        // Notificar a todas las pestañas
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'toggleExtension', 
                    enabled: newState 
                }).catch(() => {
                    // Ignorar errores si la pestaña no puede recibir mensajes
                });
            });
        });
        
        // Mostrar notificación
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Edición de Texto',
            message: `Extensión ${newState ? 'activada' : 'desactivada'}`
        });
    });
}

// Escuchar mensajes desde content scripts y popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'openTemplates':
            chrome.action.openPopup();
            break;
        case 'getSettings':
            chrome.storage.sync.get(['extensionEnabled', 'shortcutsEnabled'], (result) => {
                sendResponse(result);
            });
            return true; // Mantener el canal abierto para respuesta asíncrona
    }
});

// Manejar actualizaciones de la extensión
chrome.runtime.onStartup.addListener(() => {
    console.log('Edición de Texto - Extensión iniciada');
});

// Configurar el ícono según el estado
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.extensionEnabled) {
        updateIcon(changes.extensionEnabled.newValue);
    }
});

function updateIcon(enabled) {
    const iconPath = enabled ? {
        "16": "icon16.png",
        "48": "icon48.png",
        "128": "icon128.png"
    } : {
        "16": "icon16_disabled.png",
        "48": "icon48_disabled.png", 
        "128": "icon128_disabled.png"
    };
    
    chrome.action.setIcon({ path: iconPath }).catch(() => {
        // Si no existen los íconos deshabilitados, usar los normales
        chrome.action.setIcon({
            path: {
                "16": "icon16.png",
                "48": "icon48.png",
                "128": "icon128.png"
            }
        });
    });
}