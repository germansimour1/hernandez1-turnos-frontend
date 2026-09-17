import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import {
  toISODate,
  fromISODate,
  addDays,
  addMonths,
  isSameDay,
  startOfWeek,
  gridDelMes,
  diaCorto,
  formatoLargo,
  formatoCortoConDia
} from '../dateUtils.js';

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
];

const ETIQUETAS_ESTADO = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  RECHAZADO: 'Rechazado',
  CANCELADO: 'Cancelado'
};

function etiquetaEstado(estado) {
  return ETIQUETAS_ESTADO[estado] || estado;
}

export default function BarberoPage() {
  const [barberos, setBarberos] = useState([]);
  const [barberoId, setBarberoId] = useState(''); // '' = todos los barberos
  const [vista, setVista] = useState('dia'); // 'dia' | 'semana' | 'mes'
  const [fechaActual, setFechaActual] = useState(new Date());

  const [turnos, setTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(true);
  const [turnosError, setTurnosError] = useState(null);

  const [pendientes, setPendientes] = useState([]);
  const [loadingPendientes, setLoadingPendientes] = useState(true);
  const [pendientesError, setPendientesError] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    let cancelado = false;
    api
      .getBarberos()
      .then((lista) => {
        if (!cancelado) setBarberos(lista);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  const rango = useMemo(() => {
    if (vista === 'dia') {
      return { fecha: toISODate(fechaActual) };
    }
    if (vista === 'semana') {
      const inicio = startOfWeek(fechaActual);
      const fin = addDays(inicio, 6);
      return { desde: toISODate(inicio), hasta: toISODate(fin) };
    }
    const dias = gridDelMes(fechaActual);
    return { desde: toISODate(dias[0]), hasta: toISODate(dias[41]) };
  }, [vista, fechaActual]);

  const fetchTurnos = useCallback(async () => {
    setLoadingTurnos(true);
    setTurnosError(null);
    try {
      const params = { ...rango };
      if (barberoId) params.barberoId = barberoId;
      const resultado = await api.getTurnos(params);
      setTurnos(resultado);
    } catch (err) {
      setTurnosError(err.message);
      setTurnos([]);
    } finally {
      setLoadingTurnos(false);
    }
  }, [rango, barberoId]);

  useEffect(() => {
    fetchTurnos();
  }, [fetchTurnos]);

  const fetchPendientes = useCallback(async () => {
    setLoadingPendientes(true);
    setPendientesError(null);
    try {
      const resultado = await api.getPendientes(barberoId || undefined);
      setPendientes(resultado);
    } catch (err) {
      setPendientesError(err.message);
      setPendientes([]);
    } finally {
      setLoadingPendientes(false);
    }
  }, [barberoId]);

  useEffect(() => {
    fetchPendientes();
  }, [fetchPendientes]);

  async function handleAprobar(id) {
    setProcesandoId(id);
    try {
      await api.aprobarTurno(id);
      await Promise.all([fetchPendientes(), fetchTurnos()]);
    } catch (err) {
      window.alert(`No se pudo aprobar: ${err.message}`);
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleRechazar(id) {
    setProcesandoId(id);
    try {
      await api.rechazarTurno(id);
      await Promise.all([fetchPendientes(), fetchTurnos()]);
    } catch (err) {
      window.alert(`No se pudo rechazar: ${err.message}`);
    } finally {
      setProcesandoId(null);
    }
  }

  function irHoy() {
    setFechaActual(new Date());
  }

  function irAnterior() {
    if (vista === 'dia') setFechaActual((f) => addDays(f, -1));
    else if (vista === 'semana') setFechaActual((f) => addDays(f, -7));
    else setFechaActual((f) => addMonths(f, -1));
  }

  function irSiguiente() {
    if (vista === 'dia') setFechaActual((f) => addDays(f, 1));
    else if (vista === 'semana') setFechaActual((f) => addDays(f, 7));
    else setFechaActual((f) => addMonths(f, 1));
  }

  const etiquetaFecha = useMemo(() => {
    if (vista === 'dia') return formatoLargo(fechaActual);
    if (vista === 'semana') {
      const inicio = startOfWeek(fechaActual);
      const fin = addDays(inicio, 6);
      return `${formatoCortoConDia(inicio)} — ${formatoCortoConDia(fin)}`;
    }
    return `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
  }, [vista, fechaActual]);

  const turnosPorDia = useMemo(() => {
    const mapa = {};
    turnos.forEach((t) => {
      if (!mapa[t.fecha]) mapa[t.fecha] = [];
      mapa[t.fecha].push(t);
    });
    return mapa;
  }, [turnos]);

  return (
    <div className="page">
      <h1>Panel del barbero</h1>

      <div className="barbero-toolbar" style={{ marginTop: 20 }}>
        <div className="view-tabs">
          <button type="button" className={vista === 'dia' ? 'active' : ''} onClick={() => setVista('dia')}>
            Día
          </button>
          <button type="button" className={vista === 'semana' ? 'active' : ''} onClick={() => setVista('semana')}>
            Semana
          </button>
          <button type="button" className={vista === 'mes' ? 'active' : ''} onClick={() => setVista('mes')}>
            Mes
          </button>
        </div>

        <div className="date-nav">
          <button type="button" onClick={irAnterior} aria-label="Anterior">
            ‹
          </button>
          <button type="button" className="today-btn" onClick={irHoy}>
            Hoy
          </button>
          <button type="button" onClick={irSiguiente} aria-label="Siguiente">
            ›
          </button>
          <span className="date-label">{etiquetaFecha}</span>
        </div>

        <select className="barbero-filter" value={barberoId} onChange={(e) => setBarberoId(e.target.value)}>
          <option value="">Todos los barberos</option>
          {barberos.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="barbero-layout">
        <div className="card">
          {turnosError && <div className="error-banner">{turnosError}</div>}
          {loadingTurnos && <p className="loading-msg">Cargando turnos...</p>}

          {!loadingTurnos && !turnosError && vista === 'dia' && <VistaDia turnos={turnos} />}

          {!loadingTurnos && !turnosError && vista === 'semana' && (
            <VistaSemana fechaActual={fechaActual} turnosPorDia={turnosPorDia} />
          )}

          {!loadingTurnos && !turnosError && vista === 'mes' && (
            <VistaMes
              fechaActual={fechaActual}
              turnosPorDia={turnosPorDia}
              onSeleccionarDia={(dia) => {
                setFechaActual(dia);
                setVista('dia');
              }}
            />
          )}
        </div>

        <div className="card">
          <div className="sidebar-title">
            <h3>Solicitudes pendientes</h3>
            {pendientes.length > 0 && <span className="count-badge">{pendientes.length}</span>}
          </div>

          {loadingPendientes && <p className="loading-msg">Cargando...</p>}
          {!loadingPendientes && pendientesError && <div className="error-banner">{pendientesError}</div>}
          {!loadingPendientes && !pendientesError && pendientes.length === 0 && (
            <p className="empty-msg">No hay solicitudes pendientes.</p>
          )}
          {!loadingPendientes &&
            !pendientesError &&
            pendientes.map((t) => (
              <div key={t.id} className="request-card">
                <div className="nombre">{t.clienteNombre}</div>
                <div className="detalle">
                  {formatoCortoConDia(fromISODate(t.fecha))} · {t.horaInicio} · {t.servicio.nombre} · {t.barbero.nombre}
                  {t.clienteTelefono ? ` · ${t.clienteTelefono}` : ''}
                </div>
                <div className="request-actions">
                  <button
                    type="button"
                    className="approve"
                    disabled={procesandoId === t.id}
                    onClick={() => handleAprobar(t.id)}
                  >
                    Aprobar
                  </button>
                  <button type="button" disabled={procesandoId === t.id} onClick={() => handleRechazar(t.id)}>
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function VistaDia({ turnos }) {
  if (turnos.length === 0) {
    return <p className="empty-msg">No hay turnos este día.</p>;
  }
  const ordenados = [...turnos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  return (
    <div>
      {ordenados.map((t) => (
        <div key={t.id} className="turno-item">
          <div className="hora">{t.horaInicio}</div>
          <div className="info">
            <div className="nombre">{t.clienteNombre}</div>
            <div className="detalle">
              {t.servicio.nombre} · {t.barbero.nombre}
            </div>
          </div>
          <span className={`badge ${t.estado.toLowerCase()}`}>{etiquetaEstado(t.estado)}</span>
        </div>
      ))}
    </div>
  );
}

function VistaSemana({ fechaActual, turnosPorDia }) {
  const inicio = startOfWeek(fechaActual);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
  const hoy = new Date();
  return (
    <div className="week-grid">
      {dias.map((dia) => {
        const iso = toISODate(dia);
        const turnosDia = (turnosPorDia[iso] || []).slice().sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        return (
          <div key={iso} className="week-day-col">
            <div className={`week-day-header ${isSameDay(dia, hoy) ? 'today' : ''}`}>
              {diaCorto(dia)} {dia.getDate()}
            </div>
            {turnosDia.length === 0 && (
              <p className="empty-msg" style={{ fontSize: 11, padding: '4px 0' }}>
                —
              </p>
            )}
            {turnosDia.map((t) => (
              <div key={t.id} className={`week-mini-item ${t.estado.toLowerCase()}`}>
                {t.horaInicio} {t.clienteNombre}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function VistaMes({ fechaActual, turnosPorDia, onSeleccionarDia }) {
  const dias = gridDelMes(fechaActual);
  const hoy = new Date();
  const mesActual = fechaActual.getMonth();
  const headers = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  return (
    <div>
      <div className="month-grid" style={{ marginBottom: 6 }}>
        {headers.map((h) => (
          <div key={h} className="month-header-cell">
            {h}
          </div>
        ))}
      </div>
      <div className="month-grid">
        {dias.map((dia) => {
          const iso = toISODate(dia);
          const turnosDia = turnosPorDia[iso] || [];
          const pendientesCount = turnosDia.filter((t) => t.estado === 'PENDIENTE').length;
          const confirmadosCount = turnosDia.filter((t) => t.estado === 'CONFIRMADO').length;
          const fueraDeMes = dia.getMonth() !== mesActual;
          return (
            <div
              key={iso}
              className={`month-cell ${fueraDeMes ? 'out' : ''} ${isSameDay(dia, hoy) ? 'today' : ''}`}
              onClick={() => onSeleccionarDia(dia)}
            >
              <div className="num">{dia.getDate()}</div>
              {(pendientesCount > 0 || confirmadosCount > 0) && (
                <div className="dots">
                  {confirmadosCount > 0 && <span className="dot confirmado" />}
                  {pendientesCount > 0 && <span className="dot pendiente" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

