# PracticaParcial 

API REST para gestión de usuarios 

## Stack

- **Runtime**: Node.js >= 22 (ESM)
- **Framework**: Express 5
- **Base de datos**: MongoDB Atlas + Mongoose 9
- **Autenticación**: JWT (access + refresh token)
- **Validación**: Zod v4
- **Seguridad**: Helmet, express-rate-limit
- **Subida de archivos**: Multer (5 MB, JPEG/PNG/WEBP)

## Instalación

```bash
npm install
```

Crea un archivo `.env` basándote en `.env.example`:

```bash
cp .env.example .env
```

Rellena las variables de entorno (ver `.env.example`).

## Arrancar el servidor

```bash
# Desarrollo (hot reload)
npm run dev

# Producción
npm start
```

El servidor corre en `http://localhost:3000` por defecto.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NODE_ENV` | `development` o `production` |
| `PORT` | Puerto del servidor (default: 3000) |
| `DB_URI` | URI de conexión a MongoDB Atlas |
| `JWT_SECRET` | Secreto para access token |
| `JWT_REFRESH_SECRET` | Secreto para refresh token |
| `JWT_ACCES_TOKEN_EXPIRES_IN` | Expiración del access token (ej: `2h`) |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Expiración del refresh token (ej: `7d`) |

## Endpoints

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor |
| `POST` | `/api/user/register` | Registrar usuario |
| `POST` | `/api/user/login` | Login — devuelve access + refresh token |
| `POST` | `/api/user/refresh` | Renovar access token con refresh token |

### Autenticados (`Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|---|---|---|
| `PUT` | `/api/user/validation` | Verificar email con código de 6 dígitos |
| `PUT` | `/api/user/register` | Actualizar datos personales |
| `PATCH` | `/api/user/company` | Onboarding de empresa (freelance o empresa) |
| `PATCH` | `/api/user/logo` | Subir logo de empresa (multipart/form-data) |
| `GET` | `/api/user` | Obtener perfil propio |
| `PUT` | `/api/user/password` | Cambiar contraseña |
| `POST` | `/api/user/logout` | Cerrar sesión |
| `DELETE` | `/api/user` | Eliminar cuenta (soft por defecto, `?soft=false` para hard) |

### Solo admin

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/user/invite` | Invitar usuario por email |

## Flujo de uso

1. **Register** `POST /api/user/register` — el código de verificación aparece en los logs del servidor
2. **Validate** `PUT /api/user/validation` — enviar el código de 6 dígitos
3. **Login** `POST /api/user/login` — obtener `accessToken` y `refreshToken`
4. **Onboarding** `PATCH /api/user/company` — asignar empresa o indicar que es autónomo
5. **Logo** `PATCH /api/user/logo` — subir logo de la empresa (campo `logo`, imagen <= 5 MB)

## Colección de pruebas

Las peticiones están disponibles en [`index.http`](./index.http) (compatible con la extensión REST Client de VSCode).
