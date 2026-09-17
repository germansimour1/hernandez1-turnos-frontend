// Utilidades de fecha en zona horaria LOCAL del navegador (evita el
// corrimiento de un día que da `new Date('YYYY-MM-DD')`, que Chrome
// interpreta como medianoche UTC).

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date, n) {
  const copia = new Date(date);
  copia.setDate(copia.getDate() + n);
  return copia;
}

export function addMonths(date, n) {
  const copia = new Date(date);
  copia.setMonth(copia.getMonth() + n);
  return copia;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Lunes como primer día de la semana.
export function startOfWeek(date) {
  const dia = date.getDay(); // 0=domingo ... 6=sábado
  const offset = dia === 0 ? -6 : 1 - dia;
  return addDays(date, offset);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

const DIAS_CORTOS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
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

export function diaCorto(date) {
  return DIAS_CORTOS[date.getDay()];
}

export function formatoLargo(date) {
  return `${date.getDate()} de ${MESES[date.getMonth()]}, ${date.getFullYear()}`;
}

export function formatoCortoConDia(date) {
  return `${diaCorto(date)} ${date.getDate()}/${date.getMonth() + 1}`;
}

// Grilla de 6 semanas (42 días) para la vista de mes, empezando en lunes.
export function gridDelMes(date) {
  const inicioMes = startOfMonth(date);
  const inicioGrilla = startOfWeek(inicioMes);
  const dias = [];
  for (let i = 0; i < 42; i += 1) {
    dias.push(addDays(inicioGrilla, i));
  }
  return dias;
}
