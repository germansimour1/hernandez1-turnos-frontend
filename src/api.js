// Cliente de la API del backend de Hernandez 1.
// Cambiá esta URL si el backend se redespliega en otra parte.
const API_BASE = 'https://hernandez1-turnos-backend.onrender.com';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  if (!res.ok) {
    const mensaje = (data && data.error) || `Error ${res.status}`;
    const error = new Error(mensaje);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  getBarberos: () => request('/api/barberos'),

  getServicios: () => request('/api/servicios'),

  getDisponibilidad: ({ fecha, servicioId, barberoId }) => {
    const params = new URLSearchParams({ fecha, servicioId: String(servicioId) });
    if (barberoId) params.set('barberoId', String(barberoId));
    return request(`/api/turnos/disponibilidad?${params.toString()}`);
  },

  crearTurno: (payload) =>
    request('/api/turnos', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getTurnos: (params = {}) => {
    const limpio = {};
    Object.keys(params).forEach((k) => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        limpio[k] = String(params[k]);
      }
    });
    const qs = new URLSearchParams(limpio);
    return request(`/api/turnos?${qs.toString()}`);
  },

  getPendientes: (barberoId) => {
    const qs = barberoId ? `?barberoId=${barberoId}` : '';
    return request(`/api/turnos/pendientes${qs}`);
  },

  aprobarTurno: (id) => request(`/api/turnos/${id}/aprobar`, { method: 'PATCH' }),

  rechazarTurno: (id) => request(`/api/turnos/${id}/rechazar`, { method: 'PATCH' }),

  cancelarTurno: (id) => request(`/api/turnos/${id}/cancelar`, { method: 'PATCH' })
};

