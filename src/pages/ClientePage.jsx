import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { toISODate, formatoLargo, fromISODate } from '../dateUtils.js';

const HOY_ISO = toISODate(new Date());

export default function ClientePage() {
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [barberoId, setBarberoId] = useState(''); // '' = Cualquiera
  const [servicioId, setServicioId] = useState(null);
  const [fecha, setFecha] = useState(HOY_ISO);

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [initError, setInitError] = useState(null);
  const [slotError, setSlotError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const [turnoCreado, setTurnoCreado] = useState(null);

  useEffect(() => {
    let cancelado = false;
    async function cargarInicial() {
      try {
        const [listaBarberos, listaServicios] = await Promise.all([api.getBarberos(), api.getServicios()]);
        if (cancelado) return;
        setBarberos(listaBarberos);
        setServicios(listaServicios);
        if (listaServicios.length > 0) {
          setServicioId(listaServicios[0].id);
        }
      } catch (err) {
        if (!cancelado) setInitError(err.message);
      } finally {
        if (!cancelado) setLoadingInit(false);
      }
    }
    cargarInicial();
    return () => {
      cancelado = true;
    };
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!servicioId) return;
    setLoadingSlots(true);
    setSlotError(null);
    try {
      const resultado = await api.getDisponibilidad({
        fecha,
        servicioId,
        barberoId: barberoId || undefined
      });
      setSlots(resultado.slots);
    } catch (err) {
      setSlotError(err.message);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [fecha, servicioId, barberoId]);

  useEffect(() => {
    setSelectedSlot(null);
    fetchSlots();
  }, [fetchSlots]);

  async function handleSubmit(evento) {
    evento.preventDefault();
    if (!selectedSlot || !clienteNombre.trim() || !servicioId) return;

    setEnviando(true);
    setSubmitError(null);
    try {
      const payload = {
        clienteNombre: clienteNombre.trim(),
        servicioId,
        fecha,
        horaInicio: selectedSlot.horaInicio
      };
      if (clienteTelefono.trim()) payload.clienteTelefono = clienteTelefono.trim();
      if (barberoId) payload.barberoId = Number(barberoId);

      const turno = await api.crearTurno(payload);
      setTurnoCreado(turno);
    } catch (err) {
      setSubmitError(err.message);
      fetchSlots();
    } finally {
      setEnviando(false);
    }
  }

  function handleNuevaReserva() {
    setTurnoCreado(null);
    setSelectedSlot(null);
    setClienteNombre('');
    setClienteTelefono('');
    fetchSlots();
  }

  if (loadingInit) {
    return (
      <div className="page">
        <p className="loading-msg">Cargando...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="page">
        <div className="error-banner">No se pudo conectar con el servidor: {initError}</div>
      </div>
    );
  }

  if (turnoCreado) {
    const fechaTurno = fromISODate(turnoCreado.fecha);
    return (
      <div className="page">
        <h1>Reservá tu turno</h1>
        <div className="confirmation" style={{ marginTop: 20 }}>
          <strong>¡Listo! Tu turno quedó pendiente de confirmación.</strong>
          {formatoLargo(fechaTurno)} a las {turnoCreado.horaInicio} con {turnoCreado.barbero.nombre} (
          {turnoCreado.servicio.nombre}).
          <br />
          Te va a quedar confirmado apenas el barbero lo apruebe.
        </div>
        <button type="button" className="primary-btn" style={{ marginTop: 20, width: 'auto', padding: '12px 20px' }} onClick={handleNuevaReserva}>
          Reservar otro turno
        </button>
      </div>
    );
  }

  const puedeEnviar = !!selectedSlot && clienteNombre.trim().length >= 2 && !enviando;

  return (
    <div className="page">
      <h1>Reservá tu turno</h1>

      <div className="cliente-grid" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="field">
            <label>Servicio</label>
            <select value={servicioId ?? ''} onChange={(e) => setServicioId(Number(e.target.value))}>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · {s.duracionMin} min{s.precio ? ` · $${s.precio}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Barbero</label>
            <div className="chip-row">
              <button
                type="button"
                className={`chip ${barberoId === '' ? 'selected' : ''}`}
                onClick={() => setBarberoId('')}
              >
                Cualquiera
              </button>
              {barberos.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`chip ${barberoId === String(b.id) ? 'selected' : ''}`}
                  onClick={() => setBarberoId(String(b.id))}
                >
                  {b.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Fecha</label>
            <input type="date" min={HOY_ISO} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>

          <div className="field">
            <label>Horarios disponibles</label>
            {loadingSlots && <p className="loading-msg">Buscando horarios...</p>}
            {!loadingSlots && slotError && <div className="error-banner">{slotError}</div>}
            {!loadingSlots && !slotError && slots.length === 0 && (
              <p className="empty-msg">No hay horarios ese día (probá otra fecha).</p>
            )}
            {!loadingSlots && !slotError && slots.length > 0 && (
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button
                    key={slot.horaInicio}
                    type="button"
                    disabled={!slot.disponible}
                    className={`slot-btn ${selectedSlot?.horaInicio === slot.horaInicio ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.horaInicio}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Tu nombre</label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Nombre y apellido"
                required
              />
            </div>
            <div className="field">
              <label>Teléfono (opcional)</label>
              <input
                type="tel"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder="11 2233 4455"
              />
            </div>

            {selectedSlot ? (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                Vas a reservar el {formatoLargo(fromISODate(fecha))} a las {selectedSlot.horaInicio}
                {barberoId ? ` con ${barberos.find((b) => String(b.id) === barberoId)?.nombre}` : ' (cualquier barbero disponible)'}.
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Elegí un horario de la izquierda para continuar.</p>
            )}

            {submitError && <div className="error-banner">{submitError}</div>}

            <button type="submit" className="primary-btn" disabled={!puedeEnviar}>
              {enviando ? 'Enviando...' : 'Solicitar turno'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
