require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const port = process.env.PORT || 3000;

const client = new MongoClient(uri);

let db;

async function conectarMongoDB() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("Backend conectado a MongoDB");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
  }
}

app.get("/", (req, res) => {
  res.json({
    mensaje: "API Banco Nexus funcionando"
  });
});

app.get("/api/cuenta/:cuenta", async (req, res) => {
  try {
    const numeroCuenta = req.params.cuenta;

    const cuenta = await db.collection("cuentas").findOne({
      numeroCuenta: numeroCuenta
    });

    if (!cuenta) {
      return res.status(404).json({
        mensaje: "Cuenta no encontrada"
      });
    }

    const cliente = await db.collection("clientes").findOne({
      _id: cuenta.clienteId
    });

    const transacciones = await db
      .collection("transacciones")
      .find({ cuentaId: cuenta._id })
      .sort({ fecha: -1 })
      .toArray();

    res.json({
      cliente: cliente.nombre,
      curp: cliente.curp,
      cuenta: cuenta.numeroCuenta,
      tipo: cuenta.tipo,
      saldo: cuenta.saldo,
      estado: cuenta.estado,
      transacciones: transacciones
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al consultar la cuenta",
      error: error.message
    });
  }
});

conectarMongoDB().then(() => {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
});