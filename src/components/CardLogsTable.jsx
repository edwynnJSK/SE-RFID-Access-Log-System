import { useEffect, useState } from "react";
import { database, ref, onChildAdded } from "../firebase";

const CardLogsTable = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const logsRef = ref(database, "card_logs");

    onChildAdded(logsRef, (snapshot) => {
      const newLog = snapshot.val();
      setLogs((prevLogs) => [newLog, ...prevLogs]);
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2> Registros de Tarjetas</h2>
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
          {logs.map((log, index) => (
            <tr key={index}>
              <td>{log.user}</td>
              <td>{log.cardUID}</td>
              <td>{log.status}</td>
              <td>{log.proximity ? "Si aplica" : "No aplica"}</td>
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
