# BRAIN-SOLDIERS

## Despliegue en un solo servicio (Seenode)

Este repo sirve el frontend desde el backend cuando existe `frontend/dist`. El backend detecta el `dist` y responde con `index.html` para rutas SPA.

### Scripts raíz

Desde la raíz del proyecto:

```powershell
npm run build
npm start
```

`npm run build` instala dependencias en `backend` y `frontend`, y genera `frontend/dist`.

### Variables de entorno (recomendadas)

En Seenode, configura:

```
PORT=3001
CORS_ORIGINS=https://tu-dominio
SQLITE_DB_PATH=/data/brain-soldiers.db
FRONTEND_DIST_PATH=../frontend/dist
```

Notas:
- `SQLITE_DB_PATH` debe apuntar al volumen persistente montado en `/data`.
- `CORS_ORIGINS` debe incluir el dominio donde se sirve el frontend (puedes usar `*` si no necesitas restringir).
- `FRONTEND_DIST_PATH` es relativo al backend; el valor por defecto ya apunta a `../frontend/dist`.

### Build/Start en Seenode

Configura el servicio en Seenode así:

- Build command: `npm run build`
- Start command: `npm start`
- Port: `3001`

Luego añade el almacenamiento persistente y monta en `/data`.

## Desarrollo local

Frontend:
```powershell
cd C:\Users\HP\Documents\GiithubREPOSITORIES\BRAIN-SOLDIERS\frontend
npm install
npm run dev
```

Backend:
```powershell
cd C:\Users\HP\Documents\GiithubREPOSITORIES\BRAIN-SOLDIERS\backend
npm install
npm start
```
