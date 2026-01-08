# Will AI Replace...? 🤖

Una aplicación web que analiza cómo la IA impactará diferentes profesiones, desglosando tareas específicas y ofreciendo estrategias de adaptación.

## 🚀 Inicio rápido

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## 📁 Estructura del proyecto

```
apps/day7-replacedbyai/
├── app/                    # Next.js App Router
│   └── [locale]/          # Rutas i18n (en/es)
│       └── p/[slug]/      # Páginas de profesiones
├── components/            # Componentes React
├── content/               # Datos de profesiones
│   ├── professions.raw.json      # Fuente de datos (editar aquí)
│   ├── professions.compiled.json # Generado automáticamente
│   ├── professions.index.json    # Índice ligero para cliente
│   ├── slugs.lock.json           # Slugs estables (no editar)
│   └── translations/
│       ├── en.json               # Traducciones inglés
│       └── es.json               # Traducciones español
├── lib/                   # Utilidades y lógica
├── messages/              # Traducciones UI (next-intl)
├── public/
│   └── data/              # Datos copiados para cliente
└── scripts/               # Scripts de compilación
```

## 🔄 Pipeline de profesiones

### Flujo de datos

```
professions.raw.json  →  compile-professions.mjs  →  professions.compiled.json
                              ↓                            ↓
                         en.json                    professions.index.json
                              ↓
                      translate-es.py
                              ↓
                         es.json
```

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run compile:professions` | Compila datos y extrae traducciones |
| `npm run validate:professions` | Valida la integridad de los datos |
| `npm run translate:es` | Traduce en.json → es.json (Google Translate) |
| `npm run extract:translations` | Extrae solo traducciones sin compilar |

### Añadir una nueva profesión

1. **Edita `content/professions.raw.json`:**
   ```json
   {
     "id": "p101",
     "name": { "en": "New Profession", "es": "Nueva Profesión" },
     "oneLiner": { "en": "...", "es": "..." },
     ...
   }
   ```

2. **Compila los datos:**
   ```bash
   npm run compile:professions
   ```

3. **Traduce al español (si añadiste contenido en inglés):**
   ```bash
   npm run translate:es -- --keys "p101"
   ```

4. **Recompila para incluir traducciones:**
   ```bash
   npm run compile:professions
   ```

## 🌐 Traducción automática

El script `translate-es.py` usa Google Translate para traducir automáticamente:

```bash
# Traducir todas las claves pendientes
npm run translate:es

# Solo traducir profesiones específicas
npm run translate:es -- --keys "p011,p012,p013"

# Ver qué se traduciría (dry run)
npm run translate:es -- --dry-run

# Forzar retraducción de todo
npm run translate:es -- --force

# Ajustar velocidad (delay entre batches en segundos)
npm run translate:es -- --delay 2
```

### Requisitos Python

```bash
pip3 install deep-translator tqdm
```

### Notas sobre traducción

- Las claves ya traducidas (diferentes de en.json) no se sobreescriben
- Los términos técnicos (URLs, nombres de herramientas) se mantienen
- Revisa las traducciones automáticas para términos específicos del dominio

## 🔒 Slugs estables

El archivo `slugs.lock.json` mantiene URLs estables:

- **NO editar manualmente** este archivo
- Los slugs se generan automáticamente la primera vez
- Una vez creados, no cambian aunque cambies el nombre de la profesión
- Esto garantiza que los enlaces compartidos sigan funcionando

## 📊 Estructura de una profesión

```json
{
  "id": "p001",
  "name": { "en": "Physician", "es": "Médico" },
  "oneLiner": { "en": "...", "es": "..." },
  "summary": [{ "en": "...", "es": "..." }],
  "tasks": [{
    "desc": { "en": "...", "es": "..." },
    "autoProb": 0.85,
    "why": [{ "en": "...", "es": "..." }],
    "human": [{ "en": "...", "es": "..." }]
  }],
  "timeline": {
    "now": { "changes": [...], "implications": [...] },
    "next": { "changes": [...], "implications": [...] },
    "later": { "changes": [...], "implications": [...] }
  },
  "signals": [{
    "desc": { "en": "...", "es": "..." },
    "why": { "en": "...", "es": "..." },
    "tools": ["Tool1", "Tool2"]
  }],
  "strategies": [{
    "timeframe": { "en": "2 weeks", "es": "2 semanas" },
    "outcome": { "en": "...", "es": "..." },
    "actions": [{ "en": "...", "es": "..." }]
  }],
  "sources": [{
    "title": "Source Title",
    "url": "https://...",
    "publisher": "Publisher",
    "year": "2024",
    "note": { "en": "...", "es": "..." }
  }],
  "notes": {
    "assumptions": [{ "en": "...", "es": "..." }],
    "scope": [{ "en": "...", "es": "..." }]
  }
}
```

## 🛠 Tecnologías

- **Framework:** Next.js 16 (App Router)
- **Estilos:** Tailwind CSS
- **i18n:** next-intl
- **Validación:** Zod
- **Analytics:** Google Analytics 4
- **PWA:** Manifest + Service Worker

## 📈 SEO

- Sitemap automático en `/sitemap.xml`
- OpenGraph images dinámicas
- JSON-LD structured data
- Soporte completo para inglés y español

## 🔗 URLs

- Producción: https://willaireplaced.com (o tu dominio)
- Desarrollo: http://localhost:3007
