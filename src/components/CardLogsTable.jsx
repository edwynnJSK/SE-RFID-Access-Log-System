import { useEffect, useState } from "react";
import { database, ref, onValue, off } from "../firebase";

const CardLogsTable = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const logsRef = ref(database, "card_logs");

    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.entries(data)
          .map(([id, log]) => ({ id, ...log }))
          .sort((a, b) => b.timestamp_unix - a.timestamp_unix); // orden descendente
        setLogs(logsArray);
      } else {
        setLogs([]);
      }
    });

    return () => {
      off(logsRef); // muy importante para evitar duplicados
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Registros de Tarjetas</h2>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>UID Tarjeta</th>
            <th>Estado</th>
            <th>Proximidad</th>
            <th>Distancia</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.user}</td>
              <td>{log.cardUID}</td>
              <td>{log.status}</td>
              <td>{log.proximity ? "Sí aplica" : "No aplica"}</td>
              <td>{log.distance} cm</td>
              <td>{log.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CardLogsTable;
