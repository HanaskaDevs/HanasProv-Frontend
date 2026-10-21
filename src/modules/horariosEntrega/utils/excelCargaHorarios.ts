import type { FilaCargaHorario, IdentificadorCarga, ResultadoFilaCargaHorario } from '../api/horariosEntregaApi';
import type { ProveedorParaHorario } from '../types';

/**
 * Lectura y plantilla del Excel de carga masiva de horarios (21-oct-2026).
 *
 * FORMATO: una sola hoja, una fila por horario. El proveedor va por CÓDIGO BC
 * o por RUC, el mismo para todo el archivo: lo decide el nombre de la
 * columna ("CODIGO BC" o "RUC").
 *
 * La librería 'xlsx' se pide con `await import()` dentro de cada función,
 * igual que en la carga de cuentas: son ~440 kB y no tienen por qué viajar en
 * el paquete principal.
 *
 * Esto solo LEE y arma las filas. Quien valida de verdad es el backend, que
 * devuelve una vista previa antes de aplicar nada.
 */

export const MAX_FILAS_CARGA_HORARIOS = 1000;

export class ErrorLecturaExcelHorarios extends Error {}

type Campo = keyof Omit<FilaCargaHorario, 'numero_fila'>;

/** Encabezado normalizado -> campo. Se compara por PREFIJO, sin tildes ni espacios. */
const ENCABEZADOS: [string, Campo | 'codigo_bc' | 'ruc'][] = [
  ['CLASIFICACION', 'clasificacion'],
  ['DIA', 'dia_entrega'],
  ['CODIGOBC', 'codigo_bc'],
  ['CODIGOPROVEEDOR', 'codigo_bc'],
  ['CODIGO', 'codigo_bc'],
  ['RUC', 'ruc'],
  ['ANDEN', 'anden_puerta'],
  ['PUERTA', 'anden_puerta'],
  ['HORALLEGADA', 'hora_llegada'],
  ['HORADELLEGADA', 'hora_llegada'],
  ['LLEGADA', 'hora_llegada'],
  ['PERMANENCIA', 'tiempo_permanencia'],
  ['TIEMPOPERMANENCIA', 'tiempo_permanencia'],
  ['TIEMPOAPROXPERMANENCIA', 'tiempo_permanencia'],
  ['TIEMPODEPERMANENCIA', 'tiempo_permanencia'],
  ['ENRECEPCION', 'tiempo_permanencia'],
  ['PREPARACION', 'tiempo_preparacion'],
  ['TIEMPOPREPARACION', 'tiempo_preparacion'],
  ['TIEMPODEPREPARACION', 'tiempo_preparacion'],
  ['HORASALIDA', 'hora_salida'],
  ['HORADESALIDA', 'hora_salida'],
  ['SALIDA', 'hora_salida'],
];

function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

function campoDe(encabezado: unknown): Campo | 'codigo_bc' | 'ruc' | null {
  const n = normalizar(encabezado);
  if (!n) return null;
  // El más largo primero: "HORADESALIDA" no debe caer en "HORA..." de otro.
  const candidato = [...ENCABEZADOS].sort((a, b) => b[0].length - a[0].length).find(([prefijo]) => n.startsWith(prefijo));
  return candidato ? candidato[1] : null;
}

/** Excel guarda las horas como fracción del día (0,3333 = 08:00). */
function fraccionAHora(fraccion: number): string {
  const minutosTotales = Math.round((fraccion % 1) * 24 * 60);
  const h = Math.floor(minutosTotales / 60) % 24;
  const m = minutosTotales % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function aTexto(valor: unknown, campo: Campo): string {
  if (valor === null || valor === undefined) return '';

  if (typeof valor === 'number') {
    if (campo === 'identificador') {
      // Un RUC guardado como número (Excel lo muestra 1.79E+12).
      return String(Math.round(valor));
    }
    if (campo === 'hora_llegada' || campo === 'hora_salida') {
      return fraccionAHora(valor);
    }
    if (campo === 'tiempo_permanencia' || campo === 'tiempo_preparacion') {
      // Menor que 1 = fracción de día (0:30 con formato de hora); si no, minutos.
      return valor < 1 ? String(Math.round(valor * 24 * 60)) : String(Math.round(valor));
    }
  }

  if (valor instanceof Date) {
    return `${String(valor.getHours()).padStart(2, '0')}:${String(valor.getMinutes()).padStart(2, '0')}`;
  }

  return String(valor).trim();
}

export async function leerExcelCargaHorarios(
  archivo: File
): Promise<{ identificador: IdentificadorCarga; filas: FilaCargaHorario[] }> {
  const XLSX = await import('xlsx');

  let libro;
  try {
    libro = XLSX.read(await archivo.arrayBuffer(), { type: 'array' });
  } catch {
    throw new ErrorLecturaExcelHorarios('No se pudo abrir el archivo. Verifica que sea un Excel (.xlsx).');
  }

  // La hoja "Horarios" de la plantilla, o la primera si la renombraron.
  const nombreHoja = libro.SheetNames.find((n) => normalizar(n) === 'HORARIOS') ?? libro.SheetNames[0];
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[nombreHoja], { header: 1, raw: true, defval: null });

  // El encabezado: la primera fila (de las 10 primeras) con DÍA y un
  // identificador. Así funciona aunque arriba haya un título.
  let filaEncabezado = -1;
  let columnas: (Campo | 'codigo_bc' | 'ruc' | null)[] = [];

  for (let i = 0; i < Math.min(10, matriz.length); i++) {
    const campos = (matriz[i] ?? []).map(campoDe);
    if (campos.includes('dia_entrega') && (campos.includes('codigo_bc') || campos.includes('ruc'))) {
      filaEncabezado = i;
      columnas = campos;
      break;
    }
  }

  if (filaEncabezado === -1) {
    throw new ErrorLecturaExcelHorarios(
      'No se encontró la fila de encabezados. Usa la plantilla: tiene que haber una columna DÍA y una columna CODIGO BC o RUC.'
    );
  }

  const tieneCodigo = columnas.includes('codigo_bc');
  const tieneRuc = columnas.includes('ruc');

  if (tieneCodigo && tieneRuc) {
    throw new ErrorLecturaExcelHorarios(
      'El archivo trae columna de código BC y de RUC: deja solo una, la misma para todos los proveedores.'
    );
  }

  const identificador: IdentificadorCarga = tieneCodigo ? 'codigo_bc' : 'ruc';
  const filas: FilaCargaHorario[] = [];
  // Si el día o la clasificación vienen vacíos se toma el de arriba: en los
  // calendarios armados a mano el día va solo en la primera fila del bloque.
  let diaAnterior = '';
  let clasificacionAnterior = '';

  for (let i = filaEncabezado + 1; i < matriz.length; i++) {
    const celdas = matriz[i] ?? [];
    if (celdas.every((c) => c === null || String(c).trim() === '')) continue;

    const fila: FilaCargaHorario = {
      numero_fila: i + 1,
      clasificacion: '',
      dia_entrega: '',
      identificador: '',
      anden_puerta: '',
      hora_llegada: '',
      tiempo_permanencia: '',
      tiempo_preparacion: '',
      hora_salida: '',
    };

    columnas.forEach((campo, c) => {
      if (!campo) return;
      const destino: Campo = campo === 'codigo_bc' || campo === 'ruc' ? 'identificador' : campo;
      fila[destino] = aTexto(celdas[c], destino);
    });

    fila.dia_entrega ||= diaAnterior;
    fila.clasificacion ||= clasificacionAnterior;
    diaAnterior = fila.dia_entrega;
    clasificacionAnterior = fila.clasificacion;

    filas.push(fila);
  }

  if (filas.length === 0) {
    throw new ErrorLecturaExcelHorarios('El archivo no trae ningún horario debajo de los encabezados.');
  }

  if (filas.length > MAX_FILAS_CARGA_HORARIOS) {
    throw new ErrorLecturaExcelHorarios(`El archivo trae ${filas.length} horarios: el máximo es ${MAX_FILAS_CARGA_HORARIOS} por carga.`);
  }

  return { identificador, filas };
}

/**
 * Plantilla con tres hojas: Horarios (para llenar, con dos ejemplos),
 * Instrucciones y Proveedores (código BC, RUC y nombre de cada uno, para
 * copiar el identificador sin buscarlo en otro lado).
 */
export async function descargarPlantillaHorarios(
  identificador: IdentificadorCarga,
  proveedores: ProveedorParaHorario[]
): Promise<void> {
  const XLSX = await import('xlsx');
  const columnaId = identificador === 'ruc' ? 'RUC' : 'CODIGO BC';
  const ejemplo = proveedores.find((p) => (identificador === 'ruc' ? p.ruc : p.codigo_bc));
  const idEjemplo = (identificador === 'ruc' ? ejemplo?.ruc : ejemplo?.codigo_bc) ?? (identificador === 'ruc' ? '1790000000001' : 'PROV-0000001');

  const hojaHorarios = XLSX.utils.aoa_to_sheet([
    ['CLASIFICACION', 'DIA', columnaId, 'ANDEN / PUERTA', 'HORA LLEGADA', 'PERMANENCIA (MIN)', 'HORA SALIDA'],
    ['Perecibles', 'Lunes', idEjemplo, 'A', '08:00', '30', '08:30'],
    ['Perecibles', 'Lunes', idEjemplo, 'A', '14:00', '60', ''],
  ]);
  hojaHorarios['!cols'] = [16, 12, 18, 16, 14, 18, 14].map((wch) => ({ wch }));

  const hojaInstrucciones = XLSX.utils.aoa_to_sheet([
    ['Carga masiva del calendario de horarios'],
    [''],
    ['Una fila por entrega. Un proveedor puede tener varias entregas el mismo día: una fila por cada hora de llegada.'],
    [`El proveedor va por ${columnaId}, el mismo para todas las filas. Si prefieres el otro, descarga la otra plantilla.`],
    ['CLASIFICACION: Perecibles, No Perecibles o Fruver. Si la dejas vacía se usa la de la fila de arriba.'],
    ['DIA: Lunes a Domingo, con o sin tilde. Si lo dejas vacío se usa el de la fila de arriba.'],
    ['HORA LLEGADA (obligatoria) y HORA SALIDA: formato 08:30. Si no pones la salida, se calcula con la permanencia.'],
    ['PERMANENCIA: en minutos (30) o en horas y minutos (0:30).'],
    [''],
    ['IMPORTANTE: el archivo REEMPLAZA el calendario de las clasificaciones que trae.'],
    ['Los horarios que ya estaban cargados en esas clasificaciones y no vengan en el archivo se dan de baja.'],
    ['Antes de aplicar, la pantalla muestra cuántos se crean, se actualizan y se dan de baja.'],
  ]);
  hojaInstrucciones['!cols'] = [{ wch: 110 }];

  const hojaProveedores = XLSX.utils.aoa_to_sheet([
    ['CODIGO BC', 'RUC', 'PROVEEDOR'],
    ...proveedores.map((p) => [p.codigo_bc ?? '(sin código)', p.ruc ?? '', p.nombre]),
  ]);
  hojaProveedores['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 50 }];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hojaHorarios, 'Horarios');
  XLSX.utils.book_append_sheet(libro, hojaInstrucciones, 'Instrucciones');
  XLSX.utils.book_append_sheet(libro, hojaProveedores, 'Proveedores');
  XLSX.writeFile(libro, `plantilla_horarios_${identificador === 'ruc' ? 'ruc' : 'codigo_bc'}.xlsx`);
}

/** Reporte de lo que pasó con cada fila, para corregir el archivo y volver a subirlo. */
export async function descargarReporteHorarios(filas: ResultadoFilaCargaHorario[]): Promise<void> {
  const XLSX = await import('xlsx');
  const etiqueta = { crear: 'Creado', actualizar: 'Actualizado', error: 'Con error' } as const;

  const hoja = XLSX.utils.aoa_to_sheet([
    ['FILA', 'RESULTADO', 'PROVEEDOR', 'IDENTIFICADOR', 'CLASIFICACION', 'DIA', 'DETALLE'],
    ...filas.map((f) => [
      f.numero_fila,
      etiqueta[f.estado],
      f.nombre_proveedor ?? '',
      f.identificador ?? '',
      f.clasificacion ?? '',
      f.dia_entrega ?? '',
      f.mensaje ?? '',
    ]),
  ]);
  hoja['!cols'] = [6, 14, 40, 18, 16, 12, 70].map((wch) => ({ wch }));

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte');
  XLSX.writeFile(libro, `reporte_carga_horarios_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
