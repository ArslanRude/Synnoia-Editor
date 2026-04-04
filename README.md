# Synnoia 📝🤖

**Advanced AI-Powered Document Editor with Real-time Intelligence**

---

## 📌 Overview

Synnoia is a sophisticated **AI-powered document editor** built with modern web technologies, designed to provide a seamless and intelligent writing experience. It combines the familiarity of traditional word processors with cutting-edge AI capabilities, enabling smart assistance, real-time completions, document analysis, and context-aware writing suggestions.

The name **Synnoia** comes from the Greek word "σύνοια" meaning _shared understanding or mutual thought_, reflecting its core purpose: **to co-create documents with human-like intelligence**.

---

## ✨ Key Features

### 🎯 Core Editor Capabilities

- **Rich Text Editing**: Full-featured document editor with comprehensive formatting options
- **TipTap Integration**: Built on TipTap framework for extensible rich text editing
- **Vue.js 3**: Modern reactive UI with Composition API
- **TypeScript**: Full type safety and enhanced development experience
- **Responsive Design**: Mobile-friendly interface that works on all devices

### 🤖 AI-Powered Features

- **Real-time Completions**: Intelligent AI-assisted text suggestions as you type
- **Context-Aware Suggestions**: Smart prompting system for summaries, corrections, and content generation
- **WebSocket Integration**: Real-time communication with AI backend services
- **Debounced Input**: Optimized AI requests to prevent overwhelming the backend

### 🎨 Advanced Formatting

- **Text Formatting**: Bold, italic, underline, strikethrough, superscript, subscript
- **Paragraph Styles**: Headings, lists, quotes, code blocks
- **Tables & Media**: Insert and edit tables, images, videos, and audio
- **Links & Mentions**: Smart link handling and user mention system
- **Mathematical Expressions**: KaTeX integration for complex math formulas

### 🛠️ Developer Tools

- **Component Architecture**: Modular Vue.js components for easy customization
- **Extension System**: Extensible TipTap extensions for custom functionality
- **Plugin Support**: Easy integration of additional features
- **Theme System**: Dark/light mode with CSS custom properties
- **Internationalization**: Multi-language support with Vue i18n

### 📊 Advanced Features

- **Charts & Diagrams**: Mermaid and ECharts integration for data visualization
- **Document Templates**: Pre-built templates for common document types
- **Export Options**: Multiple format support for document sharing
- **Collaboration Ready**: Architecture designed for real-time collaboration
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

---

## 🛠️ Technical Architecture

### Frontend Stack

- **Vue.js 3**: Progressive JavaScript framework with Composition API
- **TypeScript**: Static typing for better code quality and developer experience
- **TipTap**: ProseMirror-based rich text editor framework
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Vite**: Fast build tool and development server
- **VueUse**: Composition utilities for common Vue patterns

### Key Dependencies

```json
{
  "vue": "^3.0.11",
  "@tiptap/core": "^2.11.5",
  "@tiptap/vue-3": "^2.11.5",
  "typescript": "^5.5.4",
  "tailwindcss": "^4.1.11",
  "vite": "^6.4.1"
}
```

### Project Structure

```
src/
├── components/           # Vue.js components
│   ├── editor/          # Main editor component
│   ├── menus/            # Toolbar and context menus
│   ├── navbar/           # Navigation bar
│   ├── sidebar/          # AI agent panel
│   └── ui/              # Reusable UI components
├── extensions/          # TipTap editor extensions
│   ├── completion/       # AI completion system
│   ├── table/           # Table functionality
│   ├── image/           # Image handling
│   └── [many more]     # Various editor features
├── services/           # External service integrations
│   └── websocket.ts     # AI backend communication
├── config/             # Configuration files
├── utils/              # Utility functions
├── assets/             # Static assets and styles
└── types/              # TypeScript type definitions
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/synnoia/editor.git
   cd editor
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:9000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

---

## 🔧 Configuration

### Editor Options

Synnoia supports extensive customization through the `ArslanEditorOptions` interface:

```typescript
interface ArslanEditorOptions {
  document?: {
    content?: string
    placeholder?: string
    enableSpellcheck?: boolean
    enableMarkdown?: boolean
    characterLimit?: number
    readOnly?: boolean
    autofocus?: boolean
  }
  toolbar?: {
    defaultMode?: 'classic' | 'ribbon' | 'minimal'
    disableMenuItems?: string[]
  }
  page?: {
    showBreakMarks?: boolean
    showLineNumber?: boolean
    showBookmark?: boolean
    preview?: {
      enabled?: boolean
      mode?: 'web' | 'print'
    }
  }
  users?: User[]
  file?: {
    allowedMimeTypes?: string[]
    maxSize?: number
  }
  dicts?: {
    lineHeights?: LineHeightOption[]
    fontSizes?: FontSizeOption[]
  }
}
```

### AI Backend Configuration

Configure the AI backend connection in `src/config/websocket.ts`:

```typescript
export const WEBSOCKET_CONFIG = {
  URL: 'ws://localhost:8000/ws', // Your AI backend URL
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  DEBOUNCE_DELAY: 2000,
  PREFIX_CONTEXT_LENGTH: 10000,
  SUFFIX_CONTEXT_LENGTH: 10000,
}
```

---

## 🎨 Theming & Styling

### CSS Custom Properties

Synnoia uses CSS custom properties for easy theming:

```css
:root {
  --arslan-primary-color: #007bff;
  --arslan-text-light: #333333;
  --arslan-text-dark: #ffffff;
  --arslan-bg-light: #ffffff;
  --arslan-bg-dark: #1a1a1a;
}
```

### Dark Mode

Automatic dark mode detection and manual toggle:

```vue
<template>
  <button @click="toggleDark">
    {{ isDark ? '☀️' : '🌙' }}
  </button>
</template>

<script setup>
import { useDark } from '@vueuse/core'
const isDark = useDark()
const toggleDark = () => (isDark.value = !isDark.value)
</script>
```

---

## 🔌 Extensions & Plugins

### Creating Custom Extensions

Synnoia's extension system allows you to add custom functionality:

```typescript
import { Extension } from '@tiptap/core'

export const CustomExtension = Extension.create({
  name: 'customExtension',

  addCommands() {
    return {
      customCommand:
        () =>
        ({ commands }) => {
          // Your custom logic
          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.customCommand(),
    }
  },
})
```

### Available Extensions

- **Text Formatting**: Bold, italic, underline, strikethrough
- **Lists**: Bullet lists, numbered lists, task lists
- **Media**: Images, videos, audio files, iframes
- **Tables**: Full table creation and editing
- **Links**: Smart link detection and creation
- **Mathematics**: KaTeX integration for math formulas
- **Charts**: ECharts and Mermaid diagram support
- **Code**: Syntax highlighting for code blocks
- **Collaboration**: Real-time editing capabilities
- **Accessibility**: Screen reader and keyboard navigation

---

## 🤖 AI Integration

### WebSocket Service

The AI integration uses a robust WebSocket service:

```typescript
class WebSocketService {
  async getSuggestion(prefixText: string, suffixText: string): Promise<string>
  async connect(): Promise<void>
  disconnect(): void
  isConnected(): boolean
}
```

### Completion System

Real-time text completion with context awareness:

- **Prefix Context**: Text before cursor (up to 10,000 characters)
- **Suffix Context**: Text after cursor (up to 10,000 characters)
- **Debounced Requests**: 2-second delay to prevent spam
- **Error Handling**: Graceful fallbacks and reconnection logic

### Usage Example

```typescript
import { websocketService } from '@/services/websocket'

// Get AI suggestion
const suggestion = await websocketService.getSuggestion(
  'The quick brown fox',
  'jumps over the lazy dog',
)
```

---

## 📱 Browser Support

- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅

### Progressive Enhancement

Synnoia gracefully degrades on older browsers:

- Core editing functionality remains available
- AI features may be limited
- Modern UI enhancements are progressive

---

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### Coverage Reports

```bash
npm run test:coverage
```

### Type Checking

```bash
npm run check:types
```

### Linting

```bash
npm run check:code    # ESLint
npm run check:style  # Stylelint
```

---

## 📦 Build & Deployment

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Library Build

For npm package distribution:

```bash
npm run build
```

### Deployment

#### Static Site Deployment

1. Build the project: `npm run build`
2. Deploy the `dist/` directory to your hosting service
3. Ensure proper SPA routing configuration

#### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Community

- **Documentation**: [https://editor.synnoia.com/docs](https://editor.synnoia.com/docs)
- **Issues**: [GitHub Issues](https://github.com/synnoia/editor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/synnoia/editor/discussions)
- **Email**: contact@synnoia.com

---

## 🗺️ Roadmap

### Version 7.1 (Q2 2026)

- [ ] Enhanced AI model integration
- [ ] Real-time collaboration features
- [ ] Plugin marketplace
- [ ] Advanced export options

### Version 7.2 (Q3 2026)

- [ ] Speech-to-text integration
- [ ] Advanced accessibility features
- [ ] Mobile app companion
- [ ] Cloud storage integration

### Long-term Vision

- [ ] Multi-language AI models
- [ ] Advanced document analytics
- [ ] Enterprise features
- [ ] API for third-party integrations

---

## 🙏 Acknowledgments

- **TipTap Team**: For the excellent rich text editor framework
- **Vue.js Team**: For the amazing progressive framework
- **Contributors**: All the amazing developers who've helped build Synnoia
- **Open Source Community**: For the countless libraries and tools that make this project possible

---

**Built with ❤️ by the Synnoia Team**

_"The future of document editing is collaborative, intelligent, and accessible to all."_
