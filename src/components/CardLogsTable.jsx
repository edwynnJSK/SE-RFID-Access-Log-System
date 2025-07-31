import { useEffect, useState, useRef } from "react";
import { database, ref, onValue, off } from "../firebase";


const CardLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [newLogId, setNewLogId] = useState(null);
  // Inyectar CSS de animación solo una vez
  useEffect(() => {
    if (!document.head.querySelector('style[data-new-log-animate]')) {
      const style = document.createElement('style');
      style.setAttribute('data-new-log-animate', 'true');
      style.innerHTML = `
      .new-log-animate {
        animation: highlightNewLog 1.2s cubic-bezier(.4,0,.2,1);
      }
      @keyframes highlightNewLog {
        0% { transform: scale(1.12) rotate(-2deg); box-shadow: 0 0 0 #facc15cc; }
        60% { transform: scale(1.04) rotate(1deg); box-shadow: 0 8px 32px #facc15cc; }
        100% { transform: scale(1) rotate(0deg); box-shadow: 0 2px 8px #0002; }
      }
      .card-hover-effect {
        transition: transform 0.25s cubic-bezier(.4,0,.2,1), box-shadow 0.25s cubic-bezier(.4,0,.2,1);
      }
      .card-hover-effect:hover {
        transform: scale(1.045);
        box-shadow: 0 8px 32px #a5b4fc99, 0 2px 8px #0002;
        z-index: 2;
      }
      @media (prefers-color-scheme: dark) {
        body, #root, .app-bg {
          background: linear-gradient(120deg, #232946 0%, #1a1a2e 100%) !important;
          color: #f1f5f9 !important;
        }
        .card-hover-effect, .new-log-animate {
          background: #232946 !important;
          color: #f1f5f9 !important;
        }
        .card-hover-effect:hover {
          box-shadow: 0 8px 32px #232946cc, 0 2px 8px #0008;
        }
        .filter-bar {
          background: #232946cc !important;
          color: #f1f5f9 !important;
        }
        .card-date {
          background: #1a1a2e !important;
          color: #a5b4fc !important;
        }
      }
      `;
      document.head.appendChild(style);
    }
  }, []);
  const prevLogsRef = useRef([]);
  const [userFilter, setUserFilter] = useState("");
  const [uidFilter, setUidFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const logsRef = ref(database, "card_logs");
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.entries(data)
          .map(([id, log]) => ({ id, ...log }))
          .sort((a, b) => b.timestamp_unix - a.timestamp_unix);
        // Detectar si hay un nuevo log
        if (prevLogsRef.current.length > 0 && logsArray.length > prevLogsRef.current.length) {
          // Buscar el id que no estaba antes
          const prevIds = new Set(prevLogsRef.current.map(l => l.id));
          const newLog = logsArray.find(l => !prevIds.has(l.id));
          if (newLog) {
            setNewLogId(newLog.id);
            // Quitar el highlight después de 2 segundos
            setTimeout(() => setNewLogId(null), 2000);
          }
        }
        prevLogsRef.current = logsArray;
        setLogs(logsArray);
      } else {
        setLogs([]);
        prevLogsRef.current = [];
      }
    });
    return () => {
      off(logsRef);
    };
  }, []);

  // Filtrar por usuario, UID y estado
  const filteredLogs = logs.filter(log => {
    const userMatch = (log.user || "").toLowerCase().includes(userFilter.toLowerCase());
    const uidMatch = (log.cardUID || "").toLowerCase().includes(uidFilter.toLowerCase());
    // Filtro de estado robusto
    let statusMatch = true;
    if (statusFilter) {
      const statusValue = log.status ? log.status.toLowerCase() : "";
      if (statusFilter === "Autorizado" || statusFilter === "Permitido") {
        statusMatch = ["autorizado", "granted"].includes(statusValue);
      } else if (statusFilter === "Denegado") {
        statusMatch = ["denegado", "denied"].includes(statusValue);
      } else {
        statusMatch = statusValue === statusFilter.toLowerCase();
      }
    }
    // Filtro por fecha usando solo timestamp
    let dateMatch = true;
    if (startDate) {
      let logDate = null;
      if (log.timestamp) {
        let ts = log.timestamp;
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(ts)) {
          ts = ts.replace(' ', 'T') + 'Z';
        }
        logDate = new Date(ts);
      }
      dateMatch = dateMatch && logDate && logDate >= new Date(startDate);
    }
    if (endDate) {
      let logDate = null;
      if (log.timestamp) {
        let ts = log.timestamp;
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(ts)) {
          ts = ts.replace(' ', 'T') + 'Z';
        }
        logDate = new Date(ts);
      }
      // Sumar 1 día para incluir el día seleccionado
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      dateMatch = dateMatch && logDate && logDate < end;
    }
    return userMatch && uidMatch && statusMatch && dateMatch;
  });

  return (
    <div className="app-bg" style={{
      minHeight: "100vh",
      minWidth: "100vw",
      width: "100vw",
      height: "100vh",
      padding: 0,
      margin: 0,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(120deg, #e0e7ff 0%, #c7d2fe 100%)",
      transition: "background 0.5s",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 0,
      overflowY: "auto"
    }}>
      <h2 style={{
        textAlign: "center",
        color: "#1e293b",
        fontSize: 34,
        fontWeight: 800,
        letterSpacing: 1.2,
        margin: "32px 0 18px 0",
        textShadow: "0 2px 8px #c7d2fe99, 0 1px 0 #fff",
        background: "rgba(255,255,255,0.7)",
        borderRadius: 12,
        padding: "12px 0 8px 0",
        boxShadow: "0 2px 8px #c7d2fe33"
      }}>
        Registros de Acceso RFID
      </h2>
      <div className="filter-bar" style={{
        marginBottom: 24,
        display: "flex",
        gap: 18,
        flexWrap: "wrap",
        justifyContent: "center",
        background: "#f1f5f9cc",
        borderRadius: 16,
        padding: "18px 20px 10px 20px",
        boxShadow: "0 1px 8px #c7d2fe55",
        alignItems: "flex-end",
        maxWidth: 1200,
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
        zIndex: 1
      }}>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 180 }}>
          <label style={{ fontSize: 13, color: "#2563eb", marginBottom: 4, fontWeight: 600 }}>Usuario</label>
          <input
            type="text"
            placeholder="Filtrar por usuario..."
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 150 }}>
          <label style={{ fontSize: 13, color: "#2563eb", marginBottom: 4, fontWeight: 600 }}>UID Tarjeta</label>
          <input
            type="text"
            placeholder="Filtrar por UID..."
            value={uidFilter}
            onChange={e => setUidFilter(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 150 }}>
          <label style={{ fontSize: 13, color: "#2563eb", marginBottom: 4, fontWeight: 600 }}>Estado</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff" }}
          >
            <option value="">Todos los estados</option>
            <option value="Autorizado">Permitido</option>
            <option value="Denegado">Denegado</option>
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 120 }}>
          <label style={{ fontSize: 13, color: "#2563eb", marginBottom: 4, fontWeight: 600 }}>Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 120 }}>
          <label style={{ fontSize: 13, color: "#2563eb", marginBottom: 4, fontWeight: 600 }}>Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff" }}
          />
        </div>
      </div>
      {filteredLogs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24, color: "#888", background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", marginTop: 32 }}>
          No hay registros para mostrar.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          marginTop: 24,
          width: "100%",
          maxWidth: 1400,
          marginLeft: "auto",
          marginRight: "auto",
          padding: "0 10px 40px 10px",
          boxSizing: "border-box",
          zIndex: 1
        }}>
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                background: newLogId === log.id ? "#fef9c3" : "#f9f9f9",
                borderRadius: 14,
                boxShadow: newLogId === log.id ? "0 4px 16px #facc15cc" : "0 2px 8px #0002",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "center",
                borderLeft: (() => {
                  if (!log.status) return "6px solid #e5e7eb";
                  const st = log.status.toLowerCase();
                  if (["autorizado", "granted", "permitido"].includes(st)) return "6px solid #27ae60";
                  if (["denegado", "denied"].includes(st)) return "6px solid #e74c3c";
                  return "6px solid #e5e7eb";
                })(),
                transition: "background 0.7s, box-shadow 0.7s"
              }}
              className={
                `${newLogId === log.id ? "new-log-animate" : ""} card-hover-effect`
              }
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                fontSize: 32,
                color: "#2563eb",
                boxShadow: "0 1px 4px #0001"
              }}>
                {(() => {
                  const user = log.user ? log.user.trim().toLowerCase() : "";
                  if (user === "mateo") {
                    // Ícono de hombre
                    return (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" fill="#2563eb" fillOpacity="0.7"/>
                        <rect x="9" y="14" width="6" height="6" rx="3" fill="#2563eb" fillOpacity="0.7"/>
                        <rect x="7" y="20" width="2" height="2" rx="1" fill="#2563eb" fillOpacity="0.7"/>
                        <rect x="15" y="20" width="2" height="2" rx="1" fill="#2563eb" fillOpacity="0.7"/>
                      </svg>
                    );
                  } else if (user === "danna") {
                    // Ícono de mujer
                    return (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" fill="#e879f9" fillOpacity="0.7"/>
                        <ellipse cx="12" cy="16" rx="5" ry="6" fill="#e879f9" fillOpacity="0.7"/>
                        <rect x="11" y="22" width="2" height="2" rx="1" fill="#e879f9" fillOpacity="0.7"/>
                      </svg>
                    );
                  } else if (!log.user || user === "unknown") {
                    // Ícono de alerta
                    return (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#fbbf24" fillOpacity="0.8"/>
                        <rect x="11" y="7" width="2" height="7" rx="1" fill="#fff"/>
                        <rect x="11" y="16" width="2" height="2" rx="1" fill="#fff"/>
                      </svg>
                    );
                  } else {
                    // Ícono genérico (persona)
                    return (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" fill="#2563eb" fillOpacity="0.7"/>
                        <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" fill="#2563eb" fillOpacity="0.7"/>
                      </svg>
                    );
                  }
                })()}
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, color: "#2c3e50", textAlign: "center" }}>
                {(!log.user || (typeof log.user === "string" && log.user.trim().toLowerCase() === "unknown")) ? "Desconocido" : log.user}
              </div>
              <div style={{ color: "#555" }}><b>UID:</b> {log.cardUID}</div>
              <div style={{ color: ["autorizado", "granted"].includes(log.status && log.status.toLowerCase()) ? "#27ae60" : "#e74c3c", fontWeight: 600 }}>
                {(() => {
                  if (log.status && ["autorizado", "granted"].includes(log.status.toLowerCase())) return "Permitido";
                  if (log.status && ["denegado", "denied"].includes(log.status.toLowerCase())) return "Denegado";
                  if (log.status && log.status.toLowerCase() === "unknown") return "Desconocido";
                  return log.status;
                })()}
              </div>
              <div><b>Proximidad:</b> {log.proximity ? "Sí" : "No"}</div>
              <div><b>Distancia:</b> {log.distance} cm</div>
              <div className="card-date" style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#e0e7ff",
                color: "#3730a3",
                borderRadius: 6,
                padding: "6px 12px",
                fontFamily: "monospace",
                fontSize: 15,
                marginTop: 6
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginRight: 2}} xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#3730a3" strokeWidth="2" fill="#fff"/>
                  <path d="M12 7v5l3 3" stroke="#3730a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {(() => {
                  if (log.timestamp) {
                    // Si el formato es 'YYYY-MM-DD HH:mm:ss', mostrarlo tal cual
                    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(log.timestamp)) {
                      return log.timestamp;
                    }
                    // Si no, intentar parsear y mostrar local
                    const d = new Date(log.timestamp);
                    return isNaN(d.getTime()) ? log.timestamp : d.toLocaleString();
                  } else {
                    return "Fecha no disponible";
                  }
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardLogsTable;
