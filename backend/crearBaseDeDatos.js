require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const client = new MongoClient(uri);

async function crearBaseDeDatos() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const db = client.db(dbName);

    const clientes = db.collection("clientes");
    const cuentas = db.collection("cuentas");
    const transacciones = db.collection("transacciones");

    await clientes.deleteMany({});
    await cuentas.deleteMany({});
    await transacciones.deleteMany({});

    //sucursales
    const sucursales = [
      { nombre: "Sucursal La Paz", nodo: "Nodo-LaPaz" },
      { nombre: "Sucursal CDMX", nodo: "Nodo-CDMX" },
      { nombre: "Sucursal Guadalajara", nodo: "Nodo-GDL" },
      { nombre: "Sucursal Monterrey", nodo: "Nodo-MTY" },
      { nombre: "Sucursal Tijuana", nodo: "Nodo-TIJ" }
    ];

    const clientesData = [
      { _id: new ObjectId(), nombre: "Ana Ruiz López", curp: "RULA900101MDFXXX01", telefono: "6121000001", correo: "ana.ruiz@nexus.com" },
      { _id: new ObjectId(), nombre: "Luis Pérez Gómez", curp: "PEGL850203HDFXXX02", telefono: "6121000002", correo: "luis.perez@nexus.com" },
      { _id: new ObjectId(), nombre: "María Torres Díaz", curp: "TODM920315MBCXXX03", telefono: "6121000003", correo: "maria.torres@nexus.com" },
      { _id: new ObjectId(), nombre: "Carlos Hernández Soto", curp: "HESC880721HBSXXX04", telefono: "6121000004", correo: "carlos.hernandez@nexus.com" },
      { _id: new ObjectId(), nombre: "Sofía Martínez Cruz", curp: "MACS950909MDFXXX05", telefono: "6121000005", correo: "sofia.martinez@nexus.com" },
      { _id: new ObjectId(), nombre: "Jorge Ramírez Luna", curp: "RALJ870412HBCXXX06", telefono: "6121000006", correo: "jorge.ramirez@nexus.com" },
      { _id: new ObjectId(), nombre: "Fernanda Castillo Mora", curp: "CAMF990118MDFXXX07", telefono: "6121000007", correo: "fernanda.castillo@nexus.com" },
      { _id: new ObjectId(), nombre: "Diego Sánchez Reyes", curp: "SARD910625HBSXXX08", telefono: "6121000008", correo: "diego.sanchez@nexus.com" },
      { _id: new ObjectId(), nombre: "Valeria Navarro Flores", curp: "NAFV970804MBCXXX09", telefono: "6121000009", correo: "valeria.navarro@nexus.com" },
      { _id: new ObjectId(), nombre: "Miguel Ortega Peña", curp: "OEPM860530HDFXXX10", telefono: "6121000010", correo: "miguel.ortega@nexus.com" }
    ];

    const cuentasData = clientesData.map((cliente, index) => ({
      _id: new ObjectId(),
      numeroCuenta: `NX-100${index + 1}`,
      clienteId: cliente._id,
      tipo: index % 2 === 0 ? "Ahorro" : "Débito",
      saldo: 5000 + index * 1000,
      estado: "Activa",
      fechaApertura: new Date()
    }));


  const transaccionesData = [];

  cuentasData.forEach((cuenta, index) => {//agrego de sucursales
    const sucursal = sucursales[index % sucursales.length];
    transaccionesData.push(
      {
        _id: new ObjectId(),
        cuentaId: cuenta._id,
        numeroCuenta: cuenta.numeroCuenta,
        tipo: "Depósito",
        monto: cuenta.saldo,
        descripcion: "Depósito inicial",
        sucursal: sucursal.nombre,
        nodoOrigen: sucursal.nodo,
        fecha: new Date(),
        estado: "Completada"
      },
      {
        _id: new ObjectId(),
        cuentaId: cuenta._id,
        numeroCuenta: cuenta.numeroCuenta,
        tipo: "Retiro",
        monto: 500,
        descripcion: "Retiro en cajero automático",
        sucursal: sucursal.nombre,
        nodoOrigen: sucursal.nodo,
        fecha: new Date(),
        estado: "Completada"
      }
    );
  });

    await clientes.insertMany(clientesData);
    await cuentas.insertMany(cuentasData);
    await transacciones.insertMany(transaccionesData);
    
    //clientes
    await clientes.createIndex({ curp: 1 }, { unique: true });

    //cuentas
    await cuentas.createIndex({ numeroCuenta: 1 }, { unique: true });
    await cuentas.createIndex({ clienteId: 1 });
    
    //transacciones
    await transacciones.createIndex({ cuentaId: 1 });
    await transacciones.createIndex({ cuentaId: 1 });
    await transacciones.createIndex({ numeroCuenta: 1 });
    await transacciones.createIndex({ sucursal: 1 });
    await transacciones.createIndex({ fecha: -1 });

    console.log("Base de datos creada correctamente");
    console.log(`Clientes insertados: ${clientesData.length}`);
    console.log(`Cuentas insertadas: ${cuentasData.length}`);
    console.log(`Transacciones insertadas: ${transaccionesData.length}`);

  } catch (error) {
    console.error("Error al crear la base de datos:", error);
  } finally {
    await client.close();
    console.log("Conexión cerrada");
  }
}

crearBaseDeDatos();