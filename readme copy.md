# Extensión "Edición de Texto" para Google Chrome

Una extensión completa para edición avanzada de texto con atajos de teclado personalizables y sistema de plantillas.

## Características

### 🔤 Cambio de Mayúsculas/Minúsculas
- **Tipo oración**: Convierte la primera letra de cada oración a mayúscula
- **minúsculas**: Convierte todo el texto seleccionado a minúsculas  
- **MAYÚSCULAS**: Convierte todo el texto seleccionado a mayúsculas

### ✏️ Herramientas de Edición
- **Reemplazar**: Busca y reemplaza texto en campos de entrada o en toda la página
- Funciona en campos de texto, áreas de texto y elementos editables

### 📝 Sistema de Plantillas y Notas
- Guardar textos frecuentemente utilizados con títulos descriptivos
- Editar y eliminar plantillas existentes
- Copiar plantillas al portapapeles
- Insertar plantillas directamente en campos de texto

### ⌨️ Atajos de Teclado Inteligentes
- **Alt+Shift+E**: Activar/Desactivar extensión
- **Alt+Shift+S**: Aplicar tipo oración
- **Alt+Shift+L**: Convertir a minúsculas
- **Alt+Shift+U**: Convertir a MAYÚSCULAS
- **Alt+Shift+R**: Abrir diálogo de reemplazar
- **Alt+Shift+T**: Abrir plantillas

Los atajos están diseñados para no interferir con las funciones de Chrome o Gmail.

## Instalación

### Opción 1: Instalación Manual (Recomendada)

1. **Descargar los archivos**: Guarda todos los archivos de la extensión en una carpeta local:
   - `manifest.json`
   - `popup.html`
   - `popup.css`
   - `popup.js`
   - `content.js`
   - `background.js`
   - `styles.css`

2. **Crear íconos**: Crea o descarga íconos para la extensión:
   - `icon16.png` (16x16 píxeles)
   - `icon48.png` (48x48 píxeles)  
   - `icon128.png` (128x128 píxeles)

3. **Abrir Chrome y ir a extensiones**:
   - Escribe `chrome://extensions/` en la barra de direcciones
   - O ve a Menú > Más herramientas > Extensiones

4. **Activar modo desarrollador**:
   - Activa el interruptor "Modo de desarrollador" en la esquina superior derecha

5. **Cargar extensión**:
   - Haz clic en "Cargar extensión sin empaquetar"
   - Selecciona la carpeta donde guardaste todos los archivos
   - La extensión aparecerá en tu lista de extensiones

### Opción 2: Crear íconos automáticamente

Si no tienes íconos, puedes crear archivos PNG simples o usar íconos temporales:

1. Crea archivos PNG básicos de 16x16, 48x48 y 128x128 píxeles
2. O descarga íconos gratu