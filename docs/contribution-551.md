# 📄 Solución Técnica – **[REVER‑51] Workable Integration**

> **Objetivo:**  
> Incorporar **Workable** como proveedor de OAuth y fuente de datos en la plataforma **Revert** (API REST).  
> La integración debe permitir a los clientes conectar su cuenta Workable, obtener y refrescar tokens de acceso, y exponer los recursos de Workable (candidatos, ofertas, etapas, entrevistas) a través de los endpoints de Revert.

---

## 1️⃣ Visión General

| Componente | Responsabilidad |
|------------|-----------------|
| **Workable OAuth** | Generar y refrescar tokens de acceso mediante `client_id`/`client_secret`. |
| **Almacén de credenciales (Revert)** | Persistir de forma segura los tokens y metadatos del cliente (tenant). |
| **Servicios de integración** | Encapsular llamadas a la API de Workable y normalizar respuestas. |
| **Endpoints de Revert** | Exponer `/integrations/workable/*` para que los consumidores consuman datos de Workable vía Revert. |
| **Webhooks (opcional)** | Recibir eventos de Workable (cambio de estado, nuevas aplicaciones) y sincronizarlos con la base de datos de Revert. |
| **UI (frontend)** | (Fuera del alcance actual) Añadir botón “Conectar Workable” que invoque el flujo OAuth. |

---

## 2️⃣ Arquitectura de la Solución

```
+--------------------+          +----------------------+          +--------------------+
|  Cliente (SPA/CLI) | <--API--> |  Revert API (Node)  | <--SDK--> |  Workable API      |
+--------------------+          +----------------------+          +--------------------+
        ^                              ^   ^                               ^
        |                              |   |                               |
        |                              |   |                               |
        |                              |   +--- Token Storage (Postgres) |
        |                              |       (encrypted columns)       |
        |                              +--- Service Layer (Workable.ts) |
        |                                  (Axios + retry, pagination)|
        |                                                               |
        +--- Webhooks (optional) --------------------------------------+
```

* **Revert API** está construido con **Node.js**, **TypeScript**, **Express** y **Prisma** (PostgreSQL).  
* Todas las llamadas externas a Workable se realizan mediante **Axios** con interceptores para manejo de errores y renovación automática de tokens.  
* Los **tokens** se almacenan cifrados usando **AES‑256‑GCM** mediante la librería `crypto` y la clave maestra provista en `ENV ENCRYPTION_KEY`.  

---

## 3️⃣ Requisitos Funcionales

| ID | Descripción |
|----|--------------|
| **RF‑1** | **Conectar Workable**: El cliente inicia el flujo OAuth → redirige a Workable → devuelve `code`. |
| **RF‑2** | **Intercambio de código por token**: POST a `/oauth/token` (Workable) y persiste `access_token`, `refresh_token`, `expires_at`. |
| **RF‑3** | **Renovación automática**: Si el token está a < 5 min de expirar, usar `refresh_token`. |
| **RF‑4** | **Persistencia segura**: Tokens encriptados, audit trail (created_at, updated_at). |
| **RF‑5** | **Exponer recursos**: Endpoints `/integrations/workable/offers`, `/candidates`, `/stages`, etc. que devuelvan datos normalizados. |
| **RF‑6** | **Paginar resultados**: Soportar `limit`/`offset` y “next_cursor”. |
| **RF‑7** | **Manejo de errores**: Mapear códigos de Workable a errores de Revert (401, 429, 500). |
| **RF‑8** | **Webhooks (future‑proof)**: Registro de URL de webhook y verificación de firmas. |
| **RF‑9** | **Testing**: Cobertura ≥ 80 % (unit + integration). |
| **RF‑10** | **Documentación**: OpenAPI spec + README con pasos de configuración. |

---

## 4️⃣ Requisitos No Funcionales

| Tipo | Detalle |
|------|----------|
| **Seguridad** | Tokens encriptados, variables de entorno protegidas, `CORS` estricto, rate‑limit 60 RPM por cliente. |
| **Escalabilidad** | Llamadas a Workable se hacen bajo demanda; no se hace polling continuo. |
| **Observabilidad** | Logs estructurados (`pino`), métricas (`prom-client`), trazas (`OpenTelemetry`). |
| **CI/CD** | Lint (`eslint`), formateo (`prettier`), tests (`jest`), despliegue mediante `GitHub Actions` → `Docker` → `K8s`. |
| **Compatibilidad** | Node ≥ 20, TypeScript ≥ 5, Prisma ≥ 5. |

---

## 5️⃣ Diseño de la Base de Datos

### 5.1 Modelo Prisma (`schema.prisma`)

```prisma
/// Credenciales OAuth para proveedores externos
model IntegrationCredential {
  id            String   @id @default(uuid())
  tenantId      String   // FK a Tenant (cliente)
  provider      Provider @default(WORKABLE)
  accessToken   String   // Encriptado
  refreshToken  String   // Encriptado
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([tenantId, provider])
}

enum Provider {
  WORKABLE
  // Otros proveedores futuros (GREENHOUSE, LEVER, …)
}
```

### 5.2 Encriptado / Desencriptado

```ts
// src/utils/crypto.ts
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(value: string): string {
  const data = Buffer.from(value, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
```

> **Nota:** `ENCRYPTION_KEY` debe generarse una única vez (`openssl rand -hex 32`) y guardarse en el vault de la infraestructura.

---

## 6️⃣ Flujo OAuth

```
1️⃣ Cliente → GET /integrations/workable/authorize
   ↳ Redirige a https://workable.com/oauth/authorize?client_id=...&redirect_uri=...

2️⃣ Workable → REDIRECT a https://api.revert.com/integrations/workable/callback?code=XYZ&state=...

3️⃣ Revert → POST https://workable.com/oauth/token (grant_type=authorization_code)
   ↳ Recibe { access_token, refresh_token, expires_in }

4️⃣ Revert → Encripta y persiste en IntegrationCredential

5️⃣ Respuesta al cliente → 200 OK (con status “connected”)
```

### 6.1 Endpoints

| Método | Ruta | Acción |
|--------|------|--------|
| `GET` | `/integrations/workable/authorize` | Genera URL de autorización y devuelve `redirectUrl`. |
| `GET` | `/integrations/workable/callback` | Maneja el `code`, intercambia por token y persiste. |
| `GET` | `/integrations/workable/offers` | Lista de ofertas (paginated). |
| `GET` | `/integrations/workable/candidates` | Lista de candidatos (con filtros). |
| `GET` | `/integrations/workable/candidates/:id` | Detalle de candidato. |
| `POST` | `/integrations/workable/webhook` | (Future) Recepción de eventos. |

### 6.2 Implementación del controlador

```ts
// src/controllers/workable.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { encrypt, decrypt } from '../utils/crypto';
import { exchangeCodeForToken, refreshAccessToken, getOffers, getCandidates } from '../services/workable.service';
import { Provider } from '@prisma/client';

export async function authorize(req: Request, res: Response) {
  const clientId = process.env.WORKABLE_CLIENT_ID!;
  const redirectUri = `${process.env.API_BASE_URL}/integrations/workable/callback`;
  const state = req.query.state ?? crypto.randomBytes(8).toString('hex');

  const url = new URL('https://workable.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  // scopes are implicit (read only)
  res.json({ redirectUrl: url.toString() });
}

export async function callback(req: Request, res: Response, next: NextFunction) {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  try {
    const tokenResp = await exchangeCodeForToken(code);
    const expiresAt = new Date(Date.now() + tokenResp.expires_in * 1000);

    await prisma.integrationCredential.upsert({
      where: { tenantId_provider: { tenantId: req.tenant.id, provider: Provider.WORKABLE } },
      create: {
        tenantId: req.tenant.id,
        provider: Provider.WORKABLE,
        accessToken: encrypt(tokenResp.access_token),
        refreshToken: encrypt(tokenResp.refresh_token),
        expiresAt,
      },
      update: {
        accessToken: encrypt(tokenResp.access_token),
        refreshToken: encrypt(tokenResp.refresh_token),
        expiresAt,
      },
    });

    res.json({ status: 'connected' });
  } catch (err) {
    next(err);
  }
}
```

---

## 7️⃣ Service Layer – Comunicación con Workable

```ts
// src/services/workable.service.ts
import axios, { AxiosInstance } from 'axios';
import { prisma } from '../db';
import { decrypt } from '../utils/crypto';
import { Provider } from '@prisma/client';

const BASE_URL = 'https://api.workable.com/v3';

function createAxiosInstance(accessToken: string): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 10_000,
  });

  // Interceptor para refrescar token automáticamente
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (error.response?.status === 401) {
        // Intentamos refrescar
        const refreshed = await refreshAccessToken(error.config.tenantId);
        if (refreshed) {
          error.config.headers.Authorization = `Bearer ${refreshed}`;
          return axios.request(error.config);
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

/**
 * Intercambia el código de autorización por tokens.
 */
export async function exchangeCodeForToken(code: string) {
  const response = await axios.post('https://workable.com/oauth/token', {
    grant_type: 'authorization_code',
    code,
    client_id: process.env.WORKABLE_CLIENT_ID,
    client_secret: process.env.WORKABLE_CLIENT_SECRET,
    redirect_uri: `${process.env.API_BASE_URL}/integrations/workable/callback`,
  });
  return response.data; // { access_token, refresh_token, expires_in, token_type }
}

/**
 * Refresca el token usando refresh_token almacenado.
 */
export async function refreshAccessToken(tenantId: string): Promise<string | null> {
  const cred = await prisma.integrationCredential.findUnique({
    where: { tenantId_provider: { tenantId, provider: Provider.WORKABLE } },
  });
  if (!cred) return null;

  const refreshToken = decrypt(cred.refreshToken);
  const resp = await axios.post('https://workable.com/oauth/token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.WORKABLE_CLIENT_ID,
    client_secret: process.env.WORKABLE_CLIENT_SECRET,
  });

  const { access_token, expires_in } = resp.data;
  const newExpiresAt = new Date(Date.now() + expires_in * 1000);

  await prisma.integrationCredential.update({
    where: { id: cred.id },
    data: {
      accessToken: encrypt(access_token),
      expiresAt: newExpiresAt,
    },
  });

  return access_token;
}

/**
 * Obtiene la instancia Axios válida (refresh automático incluido).
 */
async function