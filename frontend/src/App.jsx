import { useState, useEffect } from "react";
import "./App.css";

const BASE = "http://localhost:3000";

const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

function Nav({ screen, setScreen }) {
  const items = [
    { id: "dashboard",     label: "Dashboard" },
    { id: "clientes",      label: "Clientes" },
    { id: "cuentas",       label: "Cuentas" },
    { id: "transacciones", label: "Transacciones" },
    { id: "nueva-cuenta",    label: "Nueva Cuenta" },
  ];

  return (
    <nav className="menu">
      {items.map((item) => (
        <a
          key={item.id}
          className={`menu-item ${screen === item.id ? "active" : ""}`}
          onClick={() => setScreen(item.id)}
        >
          {item.label}
        </a>
      ))}
      <a className="menu-item menu-logout" onClick={() => setScreen("form")}>
        Cerrar sesión
      </a>
    </nav>
  );
}


function PantallaLogin({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  function login() {
    setError("");
    if (email === "admin@nexus.com" && password === "admin123") {
      onLogin();
    } else {
      setError("Credenciales incorrectas");
    }
  }

  return (
    <div className="login-wrap">
      <div className="container">
        <h1>Banco Nexus</h1>

        <h3>Usuario</h3>
        <input
          type="text"
          value={email}
          placeholder="admin@nexus.com"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />

        <h3>Contraseña</h3>
        <input
          type="password"
          value={password}
          placeholder="••••••••"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />

        <button onClick={login}>Iniciar Sesión</button>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

function PantallaDashboard({ setScreen }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    async function cargarStats() {
      try {
        const [resClientes, resCuentas] = await Promise.all([
          fetch(`${BASE}/api/clientes`),
          fetch(`${BASE}/api/clientes`), 
        ]);

        const dataClientes = await resClientes.json();
        const total        = dataClientes.total;

        const ids = dataClientes.clientes.map((c) => c._id);
        const resCuentasList = await Promise.all(
          ids.map((id) => fetch(`${BASE}/api/clientes/${id}/cuentas`).then((r) => r.json()))
        );

        let totalCuentas = 0;
        let totalSaldo   = 0;
        let cuentasActivas = 0;
        const ultimasCuentas = [];

        resCuentasList.forEach((r, i) => {
          totalCuentas += r.total;
          r.cuentas.forEach((c) => {
            totalSaldo += c.saldo;
            if (c.estado === "Activa") cuentasActivas++;
            ultimasCuentas.push({ ...c, nombreCliente: dataClientes.clientes[i].nombre });
          });
        });

        const histRaw = await Promise.all(
          ultimasCuentas.slice(0, 5).map((c) =>
            fetch(`${BASE}/api/historial/${c.numeroCuenta}`).then((r) => r.json())
          )
        );

        const movimientos = histRaw
          .flatMap((h) => h.historial || [])
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 5);

        setStats({ total, totalCuentas, totalSaldo, cuentasActivas, movimientos });
      } catch {
        setError("No se pudieron cargar las estadísticas");
      } finally {
        setLoading(false);
      }
    }
    cargarStats();
  }, []);

  const fecha = new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="content">
      <div className="dash-header">
        <div>
          <h2>Dashboard</h2>
          <p className="dash-sub">{fecha}</p>
        </div>
      </div>

      {loading && <p className="dash-sub">Cargando estadísticas...</p>}
      {error   && <p className="login-error">{error}</p>}

      {stats && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div>
                <p className="stat-label">Clientes registrados</p>
                <p className="stat-num">{stats.total}</p>
              </div>
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">Total de cuentas</p>
                <p className="stat-num">{stats.totalCuentas}</p>
              </div>
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">Cuentas activas</p>
                <p className="stat-num">{stats.cuentasActivas}</p>
              </div>
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">Saldo total en banco</p>
                <p className="stat-num stat-saldo">{fmt(stats.totalSaldo)}</p>
              </div>
            </div>
          </div>

          <h3 className="dash-section-title">Actividad reciente</h3>
          <div className="dash-actividad">
            {stats.movimientos.length === 0 && (
              <p className="dash-sub">Sin movimientos recientes.</p>
            )}
            {stats.movimientos.map((t, i) => (
              <div className="dash-mov" key={i}>
                <div className={`dash-mov-icon ${t.tipo === "Depósito" ? "dep" : "ret"}`}>
                  {t.tipo === "Depósito" ? "↓" : "↑"}
                </div>
                <div className="dash-mov-info">
                  <p className="dash-mov-tipo">{t.tipo} · {t.numeroCuenta}</p>
                  <p className="dash-mov-desc">{t.sucursal} · {new Date(t.fecha).toLocaleDateString("es-MX")}</p>
                </div>
                <p className={`dash-mov-monto ${t.tipo === "Depósito" ? "pos" : "neg"}`}>
                  {t.tipo === "Depósito" ? "+" : "-"}{fmt(t.monto)}
                </p>
              </div>
            ))}
          </div>

          <h3 className="dash-section-title">Accesos rápidos</h3>
          <div className="dash-accesos">
            <button className="acceso-btn" onClick={() => setScreen("clientes")}>
              <span>🔍</span> Buscar cliente
            </button>
            <button className="acceso-btn" onClick={() => setScreen("transacciones")}>
              <span>💸</span> Nueva transacción
            </button>
            <button className="acceso-btn" onClick={() => setScreen("nueva-cuenta")}>
              <span>➕</span> Crear cuenta
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PantallaClientes() {
  const [nombre, setNombre]   = useState("");
  const [cuentas, setCuentas] = useState([]);
  const [error, setError]     = useState("");

  async function buscarCliente() {
    setError("");
    setCuentas([]);
    if (!nombre.trim()) return;

    try {
      const res  = await fetch(`${BASE}/api/clientes`);
      const data = await res.json();

      const normalizar = (txt) =>
        txt.trim().toLowerCase().replace(/\s+/g, " ");

      const cliente = data.clientes.find(
        (c) => normalizar(c.nombre) === normalizar(nombre)
      );

      if (!cliente) {
        setError("Cliente no encontrado");
        return;
      }

      const resCuentas  = await fetch(`${BASE}/api/clientes/${cliente._id}/cuentas`);
      const dataCuentas = await resCuentas.json();
      setCuentas(dataCuentas.cuentas);
    } catch {
      setError("Error al buscar cliente");
    }
  }

  return (
    <div className="content">
      <h2>Clientes</h2>
      <div className="container">
        <h1>Banco Nexus</h1>

        <h3>Nombre del cliente</h3>
        <input
          type="text"
          value={nombre}
          placeholder="Nombre completo"
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscarCliente()}
        />

        <button onClick={buscarCliente}>Buscar</button>

        {error && <p className="login-error">{error}</p>}

        {cuentas.length > 0 && (
          <div className="resultado">
            <h3>Cuentas del cliente</h3>
            {cuentas.map((c) => (
              <div key={c._id} className="transaccion">
                <p><strong>Cuenta:</strong> {c.numeroCuenta}</p>
                <p><strong>Tipo:</strong> {c.tipo}</p>
                <p><strong>Saldo:</strong> {fmt(c.saldo)}</p>
                <p>
                  <strong>Estado:</strong>{" "}
                  <span className={c.estado === "Activa" ? "estado-activa" : "estado-inactiva"}>
                    {c.estado}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function PantallaCuentas() {
  const [cuenta, setCuenta] = useState("");
  const [data, setData]     = useState(null);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function consultarCuenta() {
    if (!cuenta.trim()) return;
    setError("");
    setData(null);
    setLoading(true);

    try {
      const res       = await fetch(`${BASE}/api/cuentas/${cuenta}`);
      const resultado = await res.json();

      if (resultado.error) {
        setError(resultado.error);
      } else {
        setData(resultado);
      }
    } catch {
      setError("Error al conectar con el backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content">
      <h2>Cuenta</h2>
      <div className="container">
        <h1>Banco Nexus</h1>

        <input
          type="text"
          placeholder="Número de cuenta (Ej. NX-1001)"
          value={cuenta}
          onChange={(e) => setCuenta(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && consultarCuenta()}
        />

        <button onClick={consultarCuenta} disabled={loading}>
          {loading ? "Consultando..." : "Consultar Cuenta"}
        </button>

        {error && <p className="login-error">{error}</p>}

        {data && (
          <div className="resultado">
            <h2>{data.cliente}</h2>
            <p><strong>CURP:</strong> {data.curp}</p>
            <p><strong>Cuenta:</strong> {data.cuenta}</p>
            <p><strong>Tipo:</strong> {data.tipo}</p>
            <p><strong>Saldo:</strong> {fmt(data.saldo)}</p>

            <h3>Transacciones recientes</h3>
            {data.transaccionesRecientes.length === 0 && (
              <p>Sin transacciones recientes.</p>
            )}
            {data.transaccionesRecientes.map((t, i) => (
              <div className="transaccion" key={i}>
                <p><strong>{t.tipo}</strong></p>
                <p>Monto: {fmt(t.monto)}</p>
                <p>{t.descripcion}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const SUCURSALES = [
  { nombre: "Sucursal La Paz",      nodo: "Nodo-LaPaz" },
  { nombre: "Sucursal CDMX",        nodo: "Nodo-CDMX"  },
  { nombre: "Sucursal Guadalajara", nodo: "Nodo-GDL"   },
  { nombre: "Sucursal Monterrey",   nodo: "Nodo-MTY"   },
  { nombre: "Sucursal Tijuana",     nodo: "Nodo-TIJ"   },
];


function PantallaTransacciones() {
  const [cuenta, setCuenta]     = useState("");
  const [monto, setMonto]       = useState("");
  const [tipo, setTipo]         = useState("Depósito");
  const [sucursal, setSucursal] = useState(""); 
  const [data, setData]         = useState(null);
  const [error, setError]       = useState("");
  const [exito, setExito]       = useState("");
  const [loading, setLoading]   = useState(false);


  async function consultarCuenta() {
    if (!cuenta.trim()) return;
    setError("");
    setExito("");
    setData(null);
    setLoading(true);

    try {
      const res       = await fetch(`${BASE}/api/cuentas/${cuenta}`);
      const resultado = await res.json();

      if (resultado.error) {
        setError(resultado.error);
      } else {
        setData(resultado);
      }
    } catch {
      setError("Error al conectar con el backend");
    } finally {
      setLoading(false);
    }
  }

  async function ejecutarTransaccion() {
    if (!data) { setError("Primero consulta la cuenta"); return; }
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      setError("Ingresa un monto válido mayor a 0");
      return;
    }
    if (!sucursal) { setError("Selecciona una sucursal"); return; }

    setError("");
    setExito("");
    setLoading(true);

    const endpoint = tipo === "Depósito" ? "/api/deposito" : "/api/retiro";

    try {
      const res = await fetch(`${BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroCuenta: cuenta,
          monto: Number(monto),
          sucursal: sucursal,
          nodoOrigen: SUCURSALES.find((s) => s.nombre === sucursal)?.nodo ?? "Nodo-No-Especificado",
        }),
      });

      const resultado = await res.json();

      if (resultado.error) {
        setError(resultado.error);
      } else {
        setExito(`${tipo} realizado correctamente. Nuevo saldo: ${fmt(resultado.saldoNuevo)}`);
        setData((prev) => prev ? { ...prev, saldo: resultado.saldoNuevo } : prev);
        setMonto("");
      }
    } catch {
      setError("Error al conectar con el backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content">
      <h2>Nueva transacción</h2>
      <div className="container">
        <h1>Banco Nexus</h1>

        <h3>Número de cuenta</h3>
        <input
          type="text"
          placeholder="Ej. NX-1001"
          value={cuenta}
          onChange={(e) => { setCuenta(e.target.value); setData(null); setExito(""); }}
          onKeyDown={(e) => e.key === "Enter" && consultarCuenta()}
        />
        <button onClick={consultarCuenta} disabled={loading}>
          {loading && !data ? "Buscando..." : "Buscar cuenta"}
        </button>

        {data && (
          <div className="resultado">
            <h2>{data.cliente}</h2>
            <p><strong>Cuenta:</strong> {data.cuenta}</p>
            <p><strong>Tipo:</strong> {data.tipo}</p>
            <p><strong>Saldo actual:</strong> {fmt(data.saldo)}</p>
          </div>
        )}

        {data && (
          <>
            <h3>Tipo de operación</h3>
            <div className="tipo-btns">
              <button
                className={`tipo-btn ${tipo === "Depósito" ? "activo" : ""}`}
                onClick={() => { setTipo("Depósito"); setError(""); setExito(""); }}
              >
                Depósito
              </button>
              <button
                className={`tipo-btn ${tipo === "Retiro" ? "activo" : ""}`}
                onClick={() => { setTipo("Retiro"); setError(""); setExito(""); }}
              >
                Retiro
              </button>
            </div>

            <h3>Monto (MXN)</h3>
            <input
              type="number"
              placeholder="0.00"
              min="1"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />

            <h3>Sucursal</h3>
            <select
              value={sucursal}
              onChange={(e) => setSucursal(e.target.value)}
            >
              <option value="">Selecciona una sucursal</option>
              {SUCURSALES.map((s) => (
                <option key={s.nodo} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>

            <button onClick={ejecutarTransaccion} disabled={loading}>
              {loading ? "Procesando..." : `Realizar ${tipo}`}
            </button>
          </>
        )}

        {error  && <p className="login-error">{error}</p>}
        {exito  && <p className="msg-exito">{exito}</p>}
      </div>
    </div>
  );
}


function PantallaNuevaCuenta() {
  const [nombre, setNombre]       = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [clientes, setClientes]   = useState([]); 
  const [tipo, setTipo]           = useState("Ahorro");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [error, setError]         = useState("");
  const [exito, setExito]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [paso, setPaso]           = useState(1);

  async function buscarCliente() {
    if (!nombre.trim()) return;
    setError("");
    setClienteId(null);
    setClientes([]);
    setLoading(true);

    try {
      const res  = await fetch(`${BASE}/api/clientes`);
      const data = await res.json();

      const normalizar = (txt) => txt.trim().toLowerCase().replace(/\s+/g, " ");
      const coincidencias = data.clientes.filter((c) =>
        normalizar(c.nombre).includes(normalizar(nombre))
      );

      if (coincidencias.length === 0) {
        setError("No se encontró ningún cliente con ese nombre");
      } else {
        setClientes(coincidencias);
      }
    } catch {
      setError("Error al conectar con el backend");
    } finally {
      setLoading(false);
    }
  }

  function seleccionarCliente(cliente) {
    setNombre(cliente.nombre);
    setClienteId(cliente._id);
    setClientes([]);
    setPaso(2);
  }

  async function crearCuenta() {
    if (!clienteId) { setError("Selecciona un cliente primero"); return; }
    if (saldoInicial !== "" && (isNaN(Number(saldoInicial)) || Number(saldoInicial) < 0)) {
      setError("El saldo inicial debe ser un número mayor o igual a 0");
      return;
    }

    setError("");
    setExito("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/api/cuentas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          tipo,
          saldoInicial: saldoInicial === "" ? 0 : Number(saldoInicial),
        }),
      });

      const resultado = await res.json();

      if (resultado.error) {
        setError(resultado.error);
      } else {
        setExito(
          `Cuenta ${resultado.cuenta.numeroCuenta} creada exitosamente para ${nombre}.`
        );
        setNombre("");
        setClienteId(null);
        setTipo("Ahorro");
        setSaldoInicial("");
        setPaso(1);
      }
    } catch {
      setError("Error al conectar con el backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content">
      <h2>Nueva Cuenta</h2>
      <div className="container">
        <h1>Banco Nexus</h1>

        <h3>Nombre del cliente</h3>
        <input
          type="text"
          placeholder="Escribe el nombre del titular"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setClienteId(null);
            setPaso(1);
            setExito("");
          }}
          onKeyDown={(e) => e.key === "Enter" && buscarCliente()}
        />
        <button onClick={buscarCliente} disabled={loading}>
          {loading && paso === 1 ? "Buscando..." : "Buscar cliente"}
        </button>

        {clientes.length > 0 && (
          <div className="resultado">
            <h3>Selecciona el cliente</h3>
            {clientes.map((c) => (
              <div
                key={c._id}
                className="transaccion cliente-opcion"
                onClick={() => seleccionarCliente(c)}
              >
                <p><strong>{c.nombre}</strong></p>
                <p style={{ fontSize: "13px", color: "#6b7a8d" }}>{c.correo} · {c.telefono}</p>
              </div>
            ))}
          </div>
        )}

        {paso === 2 && clienteId && (
          <>
            <div className="cliente-seleccionado">
              ✓ Cliente: <strong>{nombre}</strong>
            </div>

            <h3>Tipo de cuenta</h3>
            <div className="tipo-btns">
              {["Ahorro", "Débito", "Crédito"].map((t) => (
                <button
                  key={t}
                  className={`tipo-btn ${tipo === t ? "activo" : ""}`}
                  onClick={() => setTipo(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <h3>Saldo inicial (MXN)</h3>
            <input
              type="number"
              placeholder="0.00  (opcional)"
              min="0"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
            />

            <button onClick={crearCuenta} disabled={loading}>
              {loading && paso === 2 ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </>
        )}

        {error && <p className="login-error">{error}</p>}
        {exito && <p className="msg-exito">{exito}</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("form");

  if (screen === "form") {
    return <PantallaLogin onLogin={() => setScreen("dashboard")} />;
  }

  return (
    <div className="dashboard">
      <Nav screen={screen} setScreen={setScreen} />

      {screen === "dashboard"     && <PantallaDashboard setScreen={setScreen} />}
      {screen === "clientes"      && <PantallaClientes />}
      {screen === "cuentas"       && <PantallaCuentas />}
      {screen === "transacciones" && <PantallaTransacciones />}
      {screen === "nueva-cuenta"    && <PantallaNuevaCuenta />}
    </div>
  );
}