# 🏦 Banco Nexus

API bancaria moderna desarrollada con **Node.js**, **Express** y **MongoDB**. Sistema completo para gestionar clientes, cuentas y transacciones.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Endpoints](#endpoints)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Problemas Frecuentes](#problemas-frecuentes)

---

## ✨ Características

- ✅ **CRUD completo** para clientes, cuentas y transacciones
- ✅ **Gestión de saldo** automática en depósitos y retiros
- ✅ **Validación de entrada** robusta
- ✅ **Manejo de errores** global
- ✅ **CORS habilitado** para conexiones desde frontend
- ✅ **Historial de transacciones** con detalles de saldo
- ✅ **Base de datos precargada** con clientes de prueba
- ✅ **Conexión segura** a MongoDB

---

## 🔧 Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js** (v16 o superior) → [Descargar](https://nodejs.org/)
- **MongoDB** (local o cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** (opcional)

Verifica las versiones:
```bash
node --version
npm --version
```

---

## 📦 Instalación

### 1. Clonar o descargar el proyecto
```bash
cd c:\Users\charl\Desktop\Sistemas\ Distribuidos\Banco_nexus
```

### 2. Instalar dependencias
```bash
cd backend
npm install
```

### 3. Crear archivo `.env`
En la carpeta `backend/`, crea un archivo `.env` con las siguientes variables:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/banco_nexus?retryWrites=true&w=majority
DB_NAME=banco_nexus
PORT=3000
```

**Opciones de MongoDB:**

- **MongoDB Atlas (Recomendado):**
  1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  2. Crea un cluster gratuito
  3. Obtén la cadena de conexión
  4. Reemplaza `usuario:contraseña` con tus credenciales

- **MongoDB Local:**
  ```env
  MONGO_URI=mongodb://localhost:27017
  DB_NAME=banco_nexus
  PORT=3000
  ```

---

## 🚀 Uso

### Inicializar la Base de Datos

Antes de la primera ejecución, crea datos de prueba:

```bash
cd backend
node crearBaseDeDatos.js
```

**Salida esperada:**
```
Conectado a MongoDB
✓ Base de datos creada correctamente
Clientes insertados: 10
Cuentas insertadas: 10
Transacciones insertadas: 20
Conexión cerrada
```

### Iniciar el Servidor

```bash
cd backend
npm start
```

**Salida esperada:**
```
✓ Backend conectado a MongoDB
✓ Servidor corriendo en http://localhost:3000
✓ Presiona Ctrl+C para detener
```

El servidor estará disponible en: **http://localhost:3000**

---

## 📡 Endpoints

### 🏥 Health Check

#### Verificar estado del servidor
```
GET /
```

**Respuesta:**
```json
{
  "mensaje": "API Banco Nexus funcionando ✓",
  "version": "1.0.0",
  "timestamp": "2026-05-08T10:30:45.123Z"
}
```

---

### 👥 Clientes

#### Obtener todos los clientes
```
GET /api/clientes
```

**Respuesta:**
```json
{
  "total": 10,
  "clientes": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Ana Ruiz López",
      "telefono": "6121000001",
      "correo": "ana.ruiz@nexus.com"
    }
  ]
}
```

#### Obtener cliente por ID
```
GET /api/clientes/:id
```

**Parámetro:**
- `id` (string): ID de MongoDB del cliente

**Ejemplo:**
```
GET /api/clientes/507f1f77bcf86cd799439011
```

#### Obtener cuentas de un cliente
```
GET /api/clientes/:id/cuentas
```

**Parámetro:**
- `id` (string): ID del cliente

---

### 💳 Cuentas

#### Obtener cuenta por número
```
GET /api/cuentas/:numero
```

**Parámetro:**
- `numero` (string): Número de cuenta (ej: NX-1001)

**Respuesta:**
```json
{
  "cliente": "Ana Ruiz López",
  "curp": "RULA900101MDFXXX01",
  "cuenta": "NX-1001",
  "tipo": "Ahorro",
  "saldo": 5000,
  "estado": "Activa",
  "fechaApertura": "2026-05-08T10:30:45.123Z",
  "transaccionesRecientes": []
}
```

#### Crear nueva cuenta
```
POST /api/cuentas
```

**Body (JSON):**
```json
{
  "clienteId": "507f1f77bcf86cd799439011",
  "tipo": "Ahorro",
  "saldoInicial": 1000
}
```

**Tipos válidos:** `"Ahorro"`, `"Débito"`, `"Crédito"`

**Respuesta:**
```json
{
  "mensaje": "Cuenta creada exitosamente",
  "cuenta": {
    "_id": "507f1f77bcf86cd799439012",
    "numeroCuenta": "NX-1011",
    "clienteId": "507f1f77bcf86cd799439011",
    "tipo": "Ahorro",
    "saldo": 1000,
    "estado": "Activa",
    "fechaApertura": "2026-05-08T10:30:45.123Z"
  }
}
```

---

### 💰 Transacciones

#### Obtener transacciones de una cuenta
```
GET /api/cuentas/:numero/transacciones?limite=20
```

**Parámetros:**
- `numero` (string): Número de cuenta
- `limite` (number, opcional): Cantidad máxima de transacciones (default: 20)

**Respuesta:**
```json
{
  "cuenta": "NX-1001",
  "total": 2,
  "transacciones": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "cuentaId": "507f1f77bcf86cd799439012",
      "numeroCuenta": "NX-1001",
      "tipo": "Depósito",
      "monto": 5000,
      "descripcion": "Depósito inicial",
      "saldoAnterior": 0,
      "saldoNuevo": 5000,
      "fecha": "2026-05-08T10:30:45.123Z"
    }
  ]
}
```

#### Registrar nueva transacción
```
POST /api/transacciones
```

**Body (JSON):**
```json
{
  "numeroCuenta": "NX-1001",
  "tipo": "Depósito",
  "monto": 500,
  "descripcion": "Depósito de cliente"
}
```

**Tipos válidos:** `"Depósito"`, `"Retiro"`, `"Transferencia"`

**Respuesta:**
```json
{
  "mensaje": "Transacción registrada exitosamente",
  "transaccion": {
    "_id": "507f1f77bcf86cd799439014",
    "cuentaId": "507f1f77bcf86cd799439012",
    "numeroCuenta": "NX-1001",
    "tipo": "Depósito",
    "monto": 500,
    "descripcion": "Depósito de cliente",
    "saldoAnterior": 5000,
    "saldoNuevo": 5500,
    "fecha": "2026-05-08T10:30:45.123Z"
  }
}
```

---

## 🧪 Ejemplos de Uso

### Con cURL

```bash
# Obtener todos los clientes
curl http://localhost:3000/api/clientes

# Obtener cuenta específica
curl http://localhost:3000/api/cuentas/NX-1001

# Crear depósito
curl -X POST http://localhost:3000/api/transacciones \
  -H "Content-Type: application/json" \
  -d '{"numeroCuenta":"NX-1001","tipo":"Depósito","monto":100,"descripcion":"Mi depósito"}'

# Crear retiro
curl -X POST http://localhost:3000/api/transacciones \
  -H "Content-Type: application/json" \
  -d '{"numeroCuenta":"NX-1001","tipo":"Retiro","monto":50,"descripcion":"Mi retiro"}'
```

### Con JavaScript (fetch)

```javascript
// Obtener clientes
fetch('http://localhost:3000/api/clientes')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// Depositar dinero
fetch('http://localhost:3000/api/transacciones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    numeroCuenta: 'NX-1001',
    tipo: 'Depósito',
    monto: 200,
    descripcion: 'Depósito vía web'
  })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Con Postman

1. Abre Postman
2. Crea una nueva solicitud
3. Selecciona el método (GET, POST, etc.)
4. Ingresa la URL: `http://localhost:3000/api/cuentas/NX-1001`
5. Para POST, ve a **Body** → **raw** → **JSON** y pega los datos
6. Haz clic en **Send**

---

## 📁 Estructura del Proyecto

```
Banco_nexus/
│
├── README.md                    # Este archivo
│
├── backend/
│   ├── server.js               # Servidor principal con todos los endpoints
│   ├── crearBaseDeDatos.js      # Script para inicializar datos de prueba
│   ├── package.json             # Dependencias del proyecto
│   ├── package-lock.json        # Versiones exactas de dependencias
│   └── .env                     # Variables de entorno (no incluido en Git)
│
└── frontend/
    └── index.html              # Interface web (próxima fase)
```

### Dependencias principales

- **express** - Framework web
- **mongodb** - Driver de base de datos
- **cors** - Permitir solicitudes desde otros dominios
- **dotenv** - Gestionar variables de entorno

---

## ⚠️ Problemas Frecuentes

### Error: "Base de datos no disponible"
**Causa:** El servidor no está conectado a MongoDB.

**Solución:**
1. Verifica que MongoDB está corriendo
2. Comprueba que `MONGO_URI` en `.env` es correcto
3. Si usas MongoDB Atlas, asegúrate que tu IP está en la whitelist

### Error: "ENOTFOUND"
**Causa:** No se puede conectar a MongoDB Atlas.

**Solución:**
```bash
# Prueba la conexión
ping google.com  # Verifica internet

# Verifica que el URI está correcto
# Formato: mongodb+srv://usuario:contraseña@cluster.mongodb.net/basedatos
```

### Error: "Saldo insuficiente"
**Causa:** Intentaste retirar más dinero del disponible.

**Solución:** Comprueba el saldo antes de hacer el retiro con:
```bash
GET /api/cuentas/NX-1001
```

### Puerto 3000 ya está en uso
**Causa:** Otro proceso usa el puerto.

**Soluciones:**
```bash
# Opción 1: Usar otro puerto
# Edita .env y cambia PORT=3001

# Opción 2: Matar el proceso en Windows
taskkill /F /IM node.exe

# Opción 2: Matar el proceso en Mac/Linux
lsof -i :3000
kill -9 <PID>
```

---

## 🔐 Consideraciones de Seguridad

> ⚠️ Este proyecto es educativo. Para producción, implementa:

- [ ] Autenticación (JWT o OAuth)
- [ ] Encriptación de contraseñas
- [ ] Validación avanzada (Joi, Zod)
- [ ] Rate limiting
- [ ] HTTPS
- [ ] Logs de auditoría
- [ ] Tests automatizados

---

## 📚 Próximas Mejoras

- [ ] Frontend con React o Vue
- [ ] Autenticación con JWT
- [ ] Transferencias entre cuentas
- [ ] Estados de cuenta en PDF
- [ ] Dashboard administrativo
- [ ] Mobile app
- [ ] Notificaciones por email
- [ ] Documentación Swagger/OpenAPI

---

## 👨‍💼 Autor

**Proyecto de Sistemas Distribuidos**

---

## 📄 Licencia

Este proyecto es de código abierto bajo licencia **MIT**.

---

## 💡 Soporte

Si encuentras problemas:

1. Verifica que todas las dependencias están instaladas: `npm install`
2. Comprueba que el `.env` tiene las variables correctas
3. Revisa los logs en la consola
4. Consulta la sección de [Problemas Frecuentes](#problemas-frecuentes)

---

**¡Gracias por usar Banco Nexus! 🚀**
