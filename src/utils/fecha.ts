export const formatearFecha = (fecha: string): string => {
  if (!fecha) return '—';
  const [anio, mes, dia] = fecha.split('T')[0].split('-');
  return `${dia}/${mes}/${anio}`;
};
