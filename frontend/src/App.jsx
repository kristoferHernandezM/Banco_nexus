import { useState } from "react";
import "./App.css";

function App() {

  const [cuenta, setCuenta] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function consultarCuenta() {

    try {

      setError("");

      const respuesta = await fetch(
        `http://localhost:3000/api/cuentas/${cuenta}`
      );

      const resultado = await respuesta.json();

      if(resultado.error){
        setError(resultado.error);
        setData(null);
        return;
      }

      setData(resultado);

    } catch (err) {

      setError("Error al conectar con el backend");

    }
  }

  return (
    <div className="container">

      <h1>Banco Nexus</h1>

      <input
        type="text"
        placeholder="Número de cuenta"
        value={cuenta}
        onChange={(e) => setCuenta(e.target.value)}
      />

      <button onClick={consultarCuenta}>
        Consultar Cuenta
      </button>

      {error && <p>{error}</p>}

      {data && (

        <div className="resultado">

          <h2>{data.cliente}</h2>

          <p><strong>CURP:</strong> {data.curp}</p>
          <p><strong>Cuenta:</strong> {data.cuenta}</p>
          <p><strong>Tipo:</strong> {data.tipo}</p>
          <p><strong>Saldo:</strong> ${data.saldo}</p>

          <h3>Transacciones</h3>

          {data.transaccionesRecientes.map((t, index) => (

            <div className="transaccion" key={index}>
              <p><strong>{t.tipo}</strong></p>
              <p>Monto: ${t.monto}</p>
              <p>{t.descripcion}</p>
            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default App;