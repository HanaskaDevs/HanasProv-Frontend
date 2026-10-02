import type { FilaAsignacion } from '../types';

/**
 * Lee el Excel de asignaciones (código de proveedor de BC -> correo del
 * responsable) y lo convierte en JSON. Todo pasa en el navegador: al
 * backend solo le viaja la lista de pares, nunca el .xlsx, así que no
 * necesita ninguna librería de Office.
 *
 * NO SE PIDEN ENCABEZADOS NI UN ORDEN DE COLUMNAS. El archivo que
 * mantiene Compras no fue hecho para este portal: tiene columnas de más,
 * y al costado, en la misma hoja, una tabla aparte con los datos de cada
 * responsable. Exigirle a alguien que lo reformatee antes de importar es
 * pedirle que se equivoque. En vez de eso, las columnas se detectan por
 * el CONTENIDO:
 *
 *   1. La columna del código es la que más valores con forma PROV-0000056
 *      tiene.
 *   2. La del correo es la que más correos tiene CONTANDO SOLO las filas
 *      que ya traen un código. Ese anclaje es lo que evita confundirla con
 *      la tabla de responsables del costado, que también está llena de
 *      correos pero en filas sin código.
 *
 * OJO con el import de 'xlsx': arriba entra solo como tipo y la librería
 * se pide con `await import('xlsx')` adentro. Son ~440 kB: con un import
 * normal viajarían en el chunk de la pantalla y se bajarían aunque nadie
 * toque un Excel (mismo criterio que utils/excelCodigosBc).
 */

const PATRON_CODIGO = /^PROV-\d{7}$/i;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Teléfonos del país: 9 o 10 dígitos, normalmente empezando en 0.
const PATRON_TELEFONO = /^0?\d{8,9}$/;

export class ErrorLecturaExcel extends Error {}

/** Datos de un responsable encontrados al costado de la hoja. */
export interface PersonaDetectada {
  nombre: string;
  correo: string;
  telefono: string | null;
}

export interface LecturaAsignaciones {
  filas: FilaAsignacion[];
  /** Letras de columna detectadas, para mostrárselas al usuario. */
  columnaCodigo: string;
  columnaCorreo: string;
  /**
   * Responsables encontrados en la tabla del costado (nombre, correo y
   * teléfono). Es un hallazgo OPORTUNISTA: si el archivo no la trae, el
   * arreglo viene vacío y los datos se cargan a mano.
   */
  personas: PersonaDetectada[];
  /** Correos distintos que aparecen en la columna de responsables. */
  correosUsados: string[];
}

function texto(celda: unknown): string {
  return String(celda ?? '').trim();
}

function letraColumna(indice: number): string {
  let letra = '';
  let n = indice;
  do {
    letra = String.fromCharCode(65 + (n % 26)) + letra;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letra;
}

/** Índice de la columna con más celdas que cumplen el patrón. */
function columnaConMas(
  filas: unknown[][],
  cumple: (valor: string, fila: unknown[]) => boolean
): { indice: number; aciertos: number } {
  const conteo = new Map<number, number>();

  filas.forEach((fila) => {
    fila.forEach((celda, indice) => {
      if (cumple(texto(celda), fila)) {
        conteo.set(indice, (conteo.get(indice) ?? 0) + 1);
      }
    });
  });

  let mejor = { indice: -1, aciertos: 0 };
  conteo.forEach((aciertos, indice) => {
    if (aciertos > mejor.aciertos) mejor = { indice, aciertos };
  });

  return mejor;
}

/**
 * La tabla del costado: filas SIN código que traen un correo y, al lado,
 * un teléfono. El anclaje es el correo, así que el nombre y el teléfono
 * que se toman son los de esa misma fila y no pueden terminar pegados a
 * otra persona.
 */
function detectarPersonas(filas: unknown[][], indiceCodigo: number): PersonaDetectada[] {
  const encontradas = new Map<string, PersonaDetectada>();

  filas.forEach((fila) => {
    const tieneCodigo = PATRON_CODIGO.test(texto(fila[indiceCodigo]));
    if (tieneCodigo) return;

    const celdas = fila.map(texto).filter((c) => c !== '');
    const correos = celdas.filter((c) => PATRON_CORREO.test(c));
    const telefonos = celdas.filter((c) => PATRON_TELEFONO.test(c));

    if (correos.length !== 1 || telefonos.length === 0) return;

    const correo = correos[0].toLowerCase();
    const nombre = celdas.find((c) => !PATRON_CORREO.test(c) && !PATRON_TELEFONO.test(c));

    if (!nombre) return;

    encontradas.set(correo, { nombre, correo, telefono: telefonos[0] });
  });

  return [...encontradas.values()];
}

export async function leerArchivoAsignaciones(archivo: File): Promise<LecturaAsignaciones> {
  const XLSX = await import('xlsx');

  let libro;
  try {
    libro = XLSX.read(await archivo.arrayBuffer(), { type: 'array' });
  } catch {
    throw new ErrorLecturaExcel('No se pudo leer el archivo. ¿Es un Excel (.xlsx) o un CSV?');
  }

  const nombreHoja = libro.SheetNames[0];
  if (!nombreHoja) throw new ErrorLecturaExcel('El archivo no tiene ninguna hoja.');

  // header: 1 -> arreglo de arreglos, sin interpretar encabezados. defval
  // deja las celdas vacías como '' para que los índices de columna no se
  // corran en las filas cortas.
  const filas = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[nombreHoja], {
    header: 1,
    defval: '',
    raw: false,
  });

  const codigo = columnaConMas(filas, (valor) => PATRON_CODIGO.test(valor));

  if (codigo.indice === -1) {
    throw new ErrorLecturaExcel(
      'No se encontró ninguna columna con códigos de proveedor de BC (con forma PROV-0000056).'
    );
  }

  // Solo las filas que YA tienen código: es lo que impide que gane la
  // tabla de responsables del costado.
  const filasConCodigo = filas.filter((fila) => PATRON_CODIGO.test(texto(fila[codigo.indice])));

  const correo = columnaConMas(filasConCodigo, (valor) => PATRON_CORREO.test(valor));

  if (correo.indice === -1) {
    throw new ErrorLecturaExcel(
      'Se encontraron los códigos de proveedor, pero ninguna columna con el correo del responsable al lado.'
    );
  }

  const resultado: FilaAsignacion[] = [];

  filas.forEach((fila, indice) => {
    const valorCodigo = texto(fila[codigo.indice]);
    if (!PATRON_CODIGO.test(valorCodigo)) return;

    resultado.push({
      // +1 porque la primera fila de la hoja es la 1 para el usuario: el
      // número tiene que coincidir con lo que ve en Excel al corregir.
      fila: indice + 1,
      codigo_bc: valorCodigo.toUpperCase(),
      correo: texto(fila[correo.indice]).toLowerCase(),
    });
  });

  if (resultado.length === 0) {
    throw new ErrorLecturaExcel('El archivo no tiene ninguna fila con un código de proveedor.');
  }

  return {
    filas: resultado,
    columnaCodigo: letraColumna(codigo.indice),
    columnaCorreo: letraColumna(correo.indice),
    personas: detectarPersonas(filas, codigo.indice),
    correosUsados: [...new Set(resultado.map((f) => f.correo).filter((c) => c !== ''))].sort(),
  };
}
