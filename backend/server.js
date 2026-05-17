require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuración
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const port = process.env.PORT || 3000;

const client = new MongoClient(uri);
let db;

// Validar que la base de datos esté conectada
app.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({
      error: "Base de datos no disponible",
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Middleware para validar ObjectId
const validarObjectId = (id) => {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
};


async function conectarMongoDB() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("✓ Backend conectado a MongoDB");
  } catch (error) {
    console.error("✗ Error conectando a MongoDB:", error.message);
    process.exit(1);
  }
}

// Cerrar conexión de forma segura
process.on("SIGINT", async () => {
  console.log("\nCerrando servidor...");
  await client.close();
  process.exit(0);
});


// Ruta de health check
app.get("/", (req, res) => {
  res.json({
    mensaje: "API Banco Nexus funcionando ✓",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});


// GET: Obtener todos los clientes
app.get("/api/clientes", async (req, res) => {
  try {
    const clientes = await db
      .collection("clientes")
      .find({})
      .project({ curp: 0 }) // Ocultar CURP por seguridad
      .toArray();

    res.json({
      total: clientes.length,
      clientes: clientes
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener clientes",
      mensaje: error.message
    });
  }
});

// GET: Obtener cliente por ID
app.get("/api/clientes/:id", async (req, res) => {
  try {
    const clienteId = validarObjectId(req.params.id);
    if (!clienteId) {
      return res.status(400).json({ error: "ID de cliente inválido" });
    }

    const cliente = await db
      .collection("clientes")
      .findOne({ _id: clienteId });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(cliente);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener cliente",
      mensaje: error.message
    });
  }
});


// GET: Obtener cuenta por número
app.get("/api/cuentas/:numero", async (req, res) => {
  try {
    const numeroCuenta = req.params.numero;

    const cuenta = await db
      .collection("cuentas")
      .findOne({ numeroCuenta: numeroCuenta });

    if (!cuenta) {
      return res.status(404).json({
        error: "Cuenta no encontrada"
      });
    }

    const cliente = await db
      .collection("clientes")
      .findOne({ _id: cuenta.clienteId });

    const transacciones = await db
      .collection("transacciones")
      .find({ cuentaId: cuenta._id })
      .sort({ fecha: -1 })
      .limit(10)
      .toArray();

    res.json({
      cliente: cliente ? cliente.nombre : "Desconocido",
      curp: cliente ? cliente.curp : null,
      cuenta: cuenta.numeroCuenta,
      tipo: cuenta.tipo,
      saldo: cuenta.saldo,
      estado: cuenta.estado,
      fechaApertura: cuenta.fechaApertura,
      transaccionesRecientes: transacciones
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al consultar la cuenta",
      mensaje: error.message
    });
  }
});

// GET: Obtener todas las cuentas de un cliente
app.get("/api/clientes/:id/cuentas", async (req, res) => {
  try {
    const clienteId = validarObjectId(req.params.id);
    if (!clienteId) {
      return res.status(400).json({ error: "ID de cliente inválido" });
    }

    const cuentas = await db
      .collection("cuentas")
      .find({ clienteId: clienteId })
      .toArray();

    res.json({
      total: cuentas.length,
      cuentas: cuentas
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener cuentas",
      mensaje: error.message
    });
  }
});

// POST: Crear nueva cuenta
app.post("/api/cuentas", async (req, res) => {
  try {
    const { clienteId, tipo, saldoInicial } = req.body;

    // Validaciones
    if (!clienteId || !tipo) {
      return res.status(400).json({
        error: "Faltan campos requeridos: clienteId, tipo"
      });
    }

    if (!["Ahorro", "Débito", "Crédito"].includes(tipo)) {
      return res.status(400).json({
        error: "Tipo de cuenta inválido. Debe ser: Ahorro, Débito o Crédito"
      });
    }

    const objClienteId = validarObjectId(clienteId);
    if (!objClienteId) {
      return res.status(400).json({ error: "ID de cliente inválido" });
    }

    // Verificar que el cliente existe
    const cliente = await db
      .collection("clientes")
      .findOne({ _id: objClienteId });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Generar número de cuenta único
    const ultimaCuenta = await db
      .collection("cuentas")
      .findOne({}, { sort: { numeroCuenta: -1 } });

    const numero = ultimaCuenta
      ? parseInt(ultimaCuenta.numeroCuenta.split("-")[1]) + 1
      : 1001;

    const nuevaCuenta = {
      numeroCuenta: `NX-${numero}`,
      clienteId: objClienteId,
      tipo: tipo,
      saldo: saldoInicial || 0,
      estado: "Activa",
      fechaApertura: new Date()
    };

    const resultado = await db
      .collection("cuentas")
      .insertOne(nuevaCuenta);

    res.status(201).json({
      mensaje: "Cuenta creada exitosamente",
      cuenta: { _id: resultado.insertedId, ...nuevaCuenta }
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear la cuenta",
      mensaje: error.message
    });
  }
});


// GET: Obtener transacciones de una cuenta
app.get("/api/cuentas/:numero/transacciones", async (req, res) => {
  try {
    const numeroCuenta = req.params.numero;
    const limite = req.query.limite || 20;

    const cuenta = await db
      .collection("cuentas")
      .findOne({ numeroCuenta: numeroCuenta });

    if (!cuenta) {
      return res.status(404).json({ error: "Cuenta no encontrada" });
    }

    const transacciones = await db
      .collection("transacciones")
      .find({ cuentaId: cuenta._id })
      .sort({ fecha: -1 })
      .limit(parseInt(limite))
      .toArray();

    res.json({
      cuenta: numeroCuenta,
      total: transacciones.length,
      transacciones: transacciones
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener transacciones",
      mensaje: error.message
    });
  }
});

// POST: Registrar nueva transacción
app.post("/api/transacciones", async (req, res) => {
  try {
    const { numeroCuenta, tipo, monto, descripcion, sucursal, nodoOrigen } = req.body;//cambio en DB
    const montoNumerico = Number(monto);

    // Validaciones //cambio por DB
    if (!numeroCuenta || !tipo || !monto || !sucursal) {
      return res.status(400).json({
        error: "Faltan campos requeridos: numeroCuenta, tipo, monto, sucursal"
      });
    }

    if (!["Depósito", "Retiro", "Transferencia"].includes(tipo)) {
      return res.status(400).json({
        error: "Tipo de transacción inválido"
      });
    }

    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({
        error: "El monto debe ser un número mayor a 0"
      });
    }

    const cuenta = await db
      .collection("cuentas")
      .findOne({ numeroCuenta: numeroCuenta });

    if (!cuenta) {
      return res.status(404).json({ error: "Cuenta no encontrada" });
    }

    // Validar saldo suficiente para retiros
    if (tipo === "Retiro" && cuenta.saldo < monto) {
      return res.status(400).json({
        error: "Saldo insuficiente para realizar el retiro"
      });
    }

    // Actualizar saldo
    const nuevoSaldo =
      tipo === "Depósito" ? cuenta.saldo + monto : cuenta.saldo - monto;

    await db
      .collection("cuentas")
      .updateOne({ _id: cuenta._id }, { $set: { saldo: nuevoSaldo } });

    // Registrar transacción //cambio por DB
    const transaccion = {
      cuentaId: cuenta._id,
      numeroCuenta: numeroCuenta,
      tipo: tipo,
      monto: montoNumerico,
      descripcion: descripcion || "",
      sucursal: sucursal,
      nodoOrigen: nodoOrigen || "Nodo-No-Especificado",
      saldoAnterior: cuenta.saldo,
      saldoNuevo: nuevoSaldo,
      fecha: new Date(),
      estado: "Completada"
    };

    const resultado = await db
      .collection("transacciones")
      .insertOne(transaccion);

    res.status(201).json({
      mensaje: "Transacción registrada exitosamente",
      transaccion: { _id: resultado.insertedId, ...transaccion }
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al registrar transacción",
      mensaje: error.message
    });
  }
});

app.post("/api/deposito", async (req, res) => {
  try {
    const { numeroCuenta, monto, sucursal, nodoOrigen } = req.body;
    const montoNumerico = Number(monto);

    if (!numeroCuenta || !monto || !sucursal) {
      return res.status(400).json({
        error: "Faltan campos requeridos: numeroCuenta, monto, sucursal"
      });
    }

    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({
        error: "El monto debe ser un número mayor a 0"
      });
    }

    const cuenta = await db.collection("cuentas").findOne({
      numeroCuenta: numeroCuenta
    });

    if (!cuenta) {
      return res.status(404).json({
        error: "Cuenta no encontrada"
      });
    }

    if (cuenta.estado !== "Activa") {
      return res.status(400).json({
        error: "La cuenta no está activa"
      });
    }

    const resultado = await db.collection("cuentas").findOneAndUpdate(
      { numeroCuenta: numeroCuenta },
      { $inc: { saldo: montoNumerico  } },
      { returnDocument: "after" }
    );

    const transaccion = {
      cuentaId: cuenta._id,
      numeroCuenta,
      tipo: "Depósito",
      monto,
      descripcion: "Depósito desde sucursal",
      sucursal,
      nodoOrigen: nodoOrigen || "Nodo-No-Especificado",
      saldoAnterior: cuenta.saldo,
      saldoNuevo: resultado.saldo,
      fecha: new Date(),
      estado: "Completada"
    };

    await db.collection("transacciones").insertOne(transaccion);

    res.json({
      mensaje: "Depósito realizado correctamente",
      cuenta: numeroCuenta,
      saldoNuevo: resultado.saldo,
      transaccion
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al realizar depósito",
      mensaje: error.message
    });
  }
});

app.post("/api/retiro", async (req, res) => {
  try {
    const { numeroCuenta, monto, sucursal, nodoOrigen } = req.body;
    const montoNumerico = Number(monto);

    if (!numeroCuenta || !monto || !sucursal) {
      return res.status(400).json({
        error: "Faltan campos requeridos: numeroCuenta, monto, sucursal"
      });
    }

    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({
        error: "El monto debe ser un número mayor a 0"
      });
    }

    const cuenta = await db.collection("cuentas").findOne({
      numeroCuenta: numeroCuenta
    });

    if (!cuenta) {
      return res.status(404).json({
        error: "Cuenta no encontrada"
      });
    }

    if (cuenta.estado !== "Activa") {
      return res.status(400).json({
        error: "La cuenta no está activa"
      });
    }

    if (cuenta.saldo < montoNumerico) {
      return res.status(400).json({
        error: "Saldo insuficiente para realizar el retiro"
      });
    }

    const resultado = await db.collection("cuentas").findOneAndUpdate(
      {
        numeroCuenta: numeroCuenta,
        saldo: { $gte: montoNumerico },
        estado: "Activa"
      },
      {
        $inc: { saldo: -montoNumerico }
      },
      {
        returnDocument: "after"
      }
    );

    if (!resultado) {
      return res.status(400).json({
        error: "No se pudo realizar el retiro. Verifique saldo o estado de cuenta."
      });
    }

    const transaccion = {
      cuentaId: cuenta._id,
      numeroCuenta,
      tipo: "Retiro",
      monto: montoNumerico,
      descripcion: "Retiro desde sucursal",
      sucursal,
      nodoOrigen: nodoOrigen || "Nodo-No-Especificado",
      saldoAnterior: cuenta.saldo,
      saldoNuevo: resultado.saldo,
      fecha: new Date(),
      estado: "Completada"
    };

    await db.collection("transacciones").insertOne(transaccion);

    res.json({
      mensaje: "Retiro realizado correctamente",
      cuenta: numeroCuenta,
      saldoNuevo: resultado.saldo,
      transaccion
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al realizar retiro",
      mensaje: error.message
    });
  }
});

app.get("/api/historial/:cuenta", async (req, res) => {
  try {
    const numeroCuenta = req.params.cuenta;

    const cuenta = await db.collection("cuentas").findOne({
      numeroCuenta: numeroCuenta
    });

    if (!cuenta) {
      return res.status(404).json({
        error: "Cuenta no encontrada"
      });
    }

    const historial = await db
      .collection("transacciones")
      .find({ numeroCuenta: numeroCuenta })
      .sort({ fecha: -1 })
      .toArray();

    res.json({
      cuenta: numeroCuenta,
      saldoActual: cuenta.saldo,
      totalTransacciones: historial.length,
      historial
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener historial",
      mensaje: error.message
    });
  }
});


// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    ruta: req.originalUrl
  });
});

// Error general
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: "Error interno del servidor",
    mensaje: err.message
  });
});

app.get("/api/sucursales", async (req, res) => {
  try {
    const sucursales = [
      { nombre: "Sucursal La Paz", nodo: "Nodo-LaPaz" },
      { nombre: "Sucursal CDMX", nodo: "Nodo-CDMX" },
      { nombre: "Sucursal Guadalajara", nodo: "Nodo-GDL" },
      { nombre: "Sucursal Monterrey", nodo: "Nodo-MTY" },
      { nombre: "Sucursal Tijuana", nodo: "Nodo-TIJ" }
    ];

    res.json(sucursales);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener sucursales" });
  }
});

//iniciar servidor después de conectar a MongoDB
conectarMongoDB().then(() => {
  app.listen(port, () => {
    console.log(`✓ Servidor corriendo en http://localhost:${port}`);
    console.log(`✓ Presiona Ctrl+C para detener`);
  });
});