# Bilbotracker

Aplicación de seguimiento de entrenamientos de fuerza con soporte para sincronización opcional en Google Drive.

## Configuración de Google Drive Sync (opcional)

La sincronización con Google Drive usa la carpeta `appDataFolder`, que es una carpeta oculta específica de la aplicación. Los usuarios no ven estos datos en su Drive normal.

### Paso 1: Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID** para referencia

### Paso 2: Habilitar APIs necesarias

1. Ve a **APIs & Services > Library**
2. Busca y habilita:
   - **Google Drive API**
   - **Google Identity Services** (ya incluido por defecto)

### Paso 3: Configurar pantalla de consentimiento OAuth

1. Ve a **APIs & Services > OAuth consent screen**
2. Selecciona **External** (para usuarios fuera de tu organización)
3. Completa la información requerida:
   - **App name**: `Bilbotracker`
   - **User support email**: tu email
   - **Developer contact**: tu email
4. En **Scopes**, añade:
   - `../auth/drive.appdata` - Ver y administrar datos de la aplicación
   - `../auth/userinfo.email` - Ver dirección de email
   - `../auth/userinfo.profile` - Ver información básica del perfil
5. En **Test users**, añade los emails de los usuarios que probarán la app (mientras esté en modo "Testing")

> ⚠️ **Nota**: Mientras la app esté en modo "Testing", solo los usuarios añadidos en Test Users podrán usarla. Para producción, necesitarás verificar la app con Google.

### Paso 4: Crear credenciales OAuth 2.0

1. Ve a **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Selecciona **Web application**
4. Nombre: `Bilbotracker Web`
5. Configura **Authorized JavaScript origins** según tu entorno:

#### Orígenes autorizados por entorno

| Entorno | URI |
|---------|-----|
| Local dev | `http://localhost:3004` |
| Vercel preview | `https://tu-proyecto.vercel.app` |
| Vercel production | `https://tu-proyecto.vercel.app` |
| Dominio propio | `https://tudominio.com` |

**Ejemplo completo de orígenes:**
```
http://localhost:3004
https://bilbo.live
https://bilbotracker.tudominio.com
```

6. Click **Create** y copia el **Client ID** generado

> 💡 **Tip**: Puedes tener múltiples orígenes en las mismas credenciales para desarrollo, staging y producción.

### Paso 5: Configurar variables de entorno

#### Local (desarrollo)

Crea un archivo `.env.local` en `apps/day4-bilbo/`:

```bash
# Google Drive Sync (opcional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com

# Google Analytics (opcional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. **Settings > Environment Variables**
3. Añade:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `123456789-xxx.apps.googleusercontent.com` | Production, Preview, Development |
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | Production |

#### Producción con dominio propio

Misma configuración que Vercel, pero asegúrate de:
1. Añadir tu dominio a **Authorized JavaScript origins** en Google Cloud
2. Configurar las variables de entorno en tu plataforma de hosting

## Flujo de sincronización

1. **Sign in**: El usuario hace click en "Conectar Google Drive" en Settings
2. **Autorización**: Google muestra la pantalla de consentimiento
3. **Auto-sync**: Cada vez que se guarda una sesión, se sincroniza automáticamente
4. **Conflictos**: Si hay cambios en ambos lados, se muestra un modal para elegir qué datos mantener

## Permisos solicitados

| Scope | Descripción | Motivo |
|-------|-------------|--------|
| `drive.appdata` | Acceso a carpeta oculta de la app | Guardar backup de datos |
| `userinfo.email` | Ver email | Mostrar qué cuenta está conectada |
| `userinfo.profile` | Ver nombre y foto | Mostrar avatar en la UI |

> 🔒 **Privacidad**: La app SOLO puede ver/modificar sus propios datos en `appDataFolder`. No tiene acceso a ningún otro archivo del Drive del usuario.

## Verificación de la app (producción)

Para salir del modo "Testing" y permitir que cualquier usuario use la app:

1. Ve a **OAuth consent screen** en Google Cloud
2. Click **Publish App**
3. Si usas scopes sensibles, deberás completar el proceso de verificación:
   - Proporcionar enlace a política de privacidad
   - Demostrar el uso de los scopes
   - Posible revisión manual por Google

Para `drive.appdata`, el proceso suele ser sencillo porque es un scope limitado.

## Desarrollo local

```bash
# Instalar dependencias (desde la raíz del monorepo)
npm install

# Ejecutar en desarrollo
nvm use 24
npm run dev --workspace=bilbotracker

# La app estará en http://localhost:3004
```

## Build y deploy

```bash
# Build
npm run build --workspace=bilbotracker

# Type check
npm run typecheck --workspace=bilbotracker

# Lint
npm run lint --workspace=bilbotracker
```

## Estructura de datos sincronizados

El archivo `bilbotracker-backup.json` en `appDataFolder` contiene:

```json
{
  "schemaVersion": 1,
  "appId": "bilbotracker",
  "exportedAt": "2026-01-04T12:00:00.000Z",
  "data": {
    "settings": { ... },
    "exercises": [ ... ],
    "cycles": [ ... ],
    "sessions": [ ... ]
  }
}
```

## Troubleshooting

### "Google Client ID not configured"
- Verifica que `NEXT_PUBLIC_GOOGLE_CLIENT_ID` esté configurado
- Reinicia el servidor de desarrollo después de añadir la variable

### "Error 400: redirect_uri_mismatch"
- Añade el origen exacto (incluyendo puerto) a **Authorized JavaScript origins**
- Espera 5 minutos después de añadir un origen nuevo

### "Access blocked: This app's request is invalid"
- Verifica que el usuario esté en **Test users** (modo Testing)
- O publica la app para uso general

### "Sign-in popup closes immediately"
- Puede ser un bloqueador de popups - permite popups para localhost/tu dominio
- Verifica que no haya errores de CORS en la consola

## Variables de entorno resumen

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No* | Client ID de OAuth 2.0 |
| `NEXT_PUBLIC_GA_ID` | No | ID de Google Analytics 4 |

*Sin `GOOGLE_CLIENT_ID`, la opción de sincronización no aparecerá en Settings.

