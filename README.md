# Chat LLM

Una aplicación web minimalista y elegante para chatear con modelos de lenguaje compatibles con OpenAI, incluyendo LM Studio.

## Características

- 🤖 **Chat con streaming en tiempo real** - Respuestas que se generan en directo
- ⚙️ **Configuración flexible** - URL de API, clave, modelo, temperatura, tokens y prompt del sistema
- 💾 **Persistencia local** - Conversaciones y configuración guardadas automáticamente
- 🌙 **Tema oscuro/claro** - Toggle suave entre temas
- 🔄 **Control de generación** - Capacidad de detener respuestas en curso
- 📱 **Diseño responsive** - Optimizado para móvil y escritorio
- 🔒 **Proxy opcional** - Para resolver problemas de CORS con Firebase Functions

## Ejecutar localmente

### Prerrequisitos

- Node.js 18+
- LM Studio (opcional) o cualquier servidor compatible con OpenAI

### Instalación

```bash
# Clonar e instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Configurar LM Studio

1. Descargar e instalar [LM Studio](https://lmstudio.ai/)
2. Descargar un modelo (ej: Llama 3, Mistral, etc.)
3. Iniciar el servidor local:
   - Ir a "Local Server" en LM Studio
   - Cargar un modelo
   - Iniciar servidor en puerto 1234
   - ✅ Habilitar CORS si es necesario

### Configuración de la aplicación

1. Abrir ajustes (⚙️) en la aplicación
2. Configurar:
   - **URL Base**: `http://localhost:1234/v1` (LM Studio)
   - **API Key**: Opcional para LM Studio, requerida para OpenAI
   - **Modelo**: Nombre del modelo cargado
   - **Temperatura**: 0-2 (creatividad de respuestas)
   - **Max Tokens**: Límite de longitud de respuesta
   - **System Prompt**: Instrucciones para el comportamiento del modelo

## Deploy en Firebase

### Preparación

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login en Firebase
firebase login

# Inicializar proyecto (si no está configurado)
firebase init hosting functions
```

### Deploy solo Frontend

```bash
# Construir aplicación
npm run build

# Deploy a Firebase Hosting
firebase deploy --only hosting
```

### Deploy con Proxy (Frontend + Functions)

El proxy es útil para resolver problemas de CORS cuando el servidor LLM no los permite.

```bash
# Instalar dependencias de functions
cd functions
npm install
cd ..

# Construir aplicación
npm run build

# Deploy todo
firebase deploy --only hosting,functions
```

#### Configurar variables de entorno para Functions

```bash
# Opcional: configurar URL y API Key por defecto
firebase functions:config:set api.base_url="http://localhost:1234/v1"
firebase functions:config:set api.key="tu-api-key"

# Re-deploy functions
firebase deploy --only functions
```

### URLs después del deploy

- **Frontend**: `https://tu-proyecto.web.app`
- **Proxy API**: `https://tu-proyecto.web.app/api/chat`

## Uso del Proxy

Cuando está habilitado en configuración, las peticiones van a través de Firebase Functions en lugar de directamente al servidor LLM. Esto resuelve:

- ❌ Problemas de CORS
- 🔒 Ocultar API keys del cliente
- 🌐 Acceso desde cualquier dominio

## Estructura del proyecto

```
/
├── src/
│   ├── components/          # Componentes de UI
│   │   ├── ChatMessage.tsx  # Renderizado de mensajes
│   │   ├── ChatInput.tsx    # Input con auto-resize
│   │   ├── SettingsDrawer.tsx # Panel de configuración
│   │   ├── Toolbar.tsx      # Barra superior
│   │   └── EmptyState.tsx   # Estado vacío
│   ├── hooks/               # Hooks personalizados
│   │   ├── useChat.ts       # Lógica del chat
│   │   └── useLocalStorage.ts # Persistencia local
│   ├── lib/                 # Librerías y utilidades
│   │   ├── openaiClient.ts  # Cliente para APIs OpenAI
│   │   ├── streaming.ts     # Manejo de SSE
│   │   ├── types.ts         # Tipos TypeScript
│   │   └── constants.ts     # Constantes
│   ├── App.tsx             # Componente principal
│   ├── main.tsx            # Punto de entrada
│   └── index.css           # Estilos globales
├── functions/              # Firebase Functions (proxy)
├── public/                # Archivos estáticos
└── dist/                  # Build de producción
```

## Seguridad

⚠️ **Importante**: Nunca expongas API keys en el código del cliente. Opciones seguras:

1. **LM Studio local**: No requiere API key
2. **Proxy con Functions**: API key en variables de entorno del servidor
3. **Variables de entorno**: Solo para desarrollo local

## Solución de problemas

### Error de CORS

```bash
# Opción 1: Habilitar proxy en configuración de la app
# Opción 2: Ejecutar LM Studio con CORS habilitado
# Opción 3: Usar extensión de navegador para CORS (solo desarrollo)
```

### LM Studio no conecta

1. ✅ Verificar que el servidor esté iniciado
2. ✅ Comprobar que el puerto sea 1234
3. ✅ Verificar la URL: `http://localhost:1234/v1`
4. ✅ Probar endpoint: `curl http://localhost:1234/v1/models`

### Errores de build

```bash
# Limpiar dependencias y reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar versiones de Node/npm
node --version
npm --version
```

## Scripts disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Preview del build
- `npm run lint` - Verificar código
- `npm run format` - Formatear código

## Tecnologías utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: TailwindCSS con sistema de colores personalizado
- **Markdown**: marked + DOMPurify para sanitización
- **Backend**: Firebase Functions (proxy opcional)
- **Persistencia**: localStorage del navegador

## Licencia

MIT# llm-studio-conector
