// src/modules/catalogoProductos/utils/excelCodigosBc.ts
import * as XLSX from 'xlsx';
import type { FilaImportacion, ProductoCatalogo } from '../types';

/**
 * Genera y lee el Excel de códigos BC. Todo pasa en el navegador (nunca
 * viaja un .xlsx al backend): al descargar armamos el archivo con los
 * datos que ya trajimos del API, y al subirlo lo convertimos a JSON y
 * mandamos solo ID + código. Así el backend no necesita ninguna
 * librería de Office.
 */

/** Encabezados. El orden acá define el orden de las columnas del archivo. */
const ENCABEZADOS = [
  'ID',
  'CODIGO BC',
  'PRODUCTO',
  'COD. BARRAS',
  'UNIDAD',
  'PRECIO',
  'ESTADO',
  'PROVEEDOR',
  'RUC',
] as const;

const COLUMNA_ID = 'ID';
const COLUMNA_CODIGO_BC = 'CODIGO BC';

/**
 * Normaliza un encabezado para compararlo: mayúsculas, sin acentos y sin
 * espacios de más. Así el archivo sigue siendo válido aunque Excel le
 * cambie el espaciado o el usuario lo reescriba con tilde.
 */
function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export function nombreArchivoCatalogo(): string {
  const ahora = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const sello = `${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}-${pad(ahora.getHours())}${pad(ahora.getMinutes())}`;
  return `catalogo-productos-${sello}.xlsx`;
}

/**
 * Descarga el catálogo como .xlsx.
 *
 * Detalle importante: TODAS las celdas se escriben como texto (incluido
 * el código BC). Si se dejaran como número, Excel se come los ceros a la
 * izquierda ("0012" -> 12) y al volver a subir el archivo el código ya
 * no coincidiría con Business Central.
 */
export function descargarExcelCatalogo(filas: ProductoCatalogo[], nombreArchivo = nombreArchivoCatalogo()): void {
  const datos: string[][] = [
    [...ENCABEZADOS],
    ...filas.map((f) => [
      String(f.id_producto),
      f.bc_nro_producto ?? '',
      f.nombre_producto ?? '',
      f.codigo_barras ?? '',
      f.unidad_presentacion ?? '',
      f.precio !== null && f.precio !== undefined ? String(f.precio) : '',
      f.estado_calificacion ?? '',
      f.razon_social ?? '',
      f.ruc ?? '',
    ]),
  ];

  const hoja = XLSX.utils.aoa_to_sheet(datos);

  // Forzar tipo texto en toda la hoja -> ver comentario de arriba.
  const rango = XLSX.utils.decode_range(hoja['!ref'] ?? 'A1');
  for (let fila = rango.s.r; fila <= rango.e.r; fila++) {
    for (let col = rango.s.c; col <= rango.e.c; col++) {
      const celda = hoja[XLSX.utils.encode_cell({ r: fila, c: col })];
      if (celda) celda.t = 's';
    }
  }

  hoja['!cols'] = [
    { wch: 8 },  // ID
    { wch: 16 }, // CODIGO BC
    { wch: 45 }, // PRODUCTO
    { wch: 16 }, // COD. BARRAS
    { wch: 12 }, // UNIDAD
    { wch: 10 }, // PRECIO
    { wch: 12 }, // ESTADO
    { wch: 38 }, // PROVEEDOR
    { wch: 14 }, // RUC
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Catalogo');
  XLSX.writeFile(libro, nombreArchivo);
}

export class ErrorLecturaExcel extends Error {}

/**
 * Lee el .xlsx que el usuario vuelve a subir y devuelve solo lo que el
 * backend necesita: ID de producto + código BC escrito.
 *
 * No importa si el usuario reordenó, ocultó o borró columnas: las dos
 * que se usan se ubican POR NOMBRE de encabezado, no por posición.
 */
export async function leerExcelCodigosBc(archivo: File): Promise<FilaImportacion[]> {
  const buffer = await archivo.arrayBuffer();

  let libro: XLSX.WorkBook;
  try {
    libro = XLSX.read(buffer, { type: 'array' });
  } catch {
    throw new ErrorLecturaExcel('No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) válido.');
  }

  const nombreHoja = libro.SheetNames[0];
  if (!nombreHoja) {
    throw new ErrorLecturaExcel('El archivo no tiene ninguna hoja.');
  }

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[nombreHoja], {
    header: 1,
    // raw:false -> todo llega como texto, así "0012" no se convierte en 12.
    raw: false,
    defval: '',
    blankrows: false,
  });

  // Buscar el encabezado en las primeras filas (por si alguien deja un
  // título o una fila en blanco arriba antes de la tabla).
  let indiceEncabezado = -1;
  let columnaId = -1;
  let columnaCodigo = -1;

  for (let i = 0; i < Math.min(matriz.length, 10); i++) {
    const fila = (matriz[i] ?? []).map(normalizar);
    const posibleId = fila.indexOf(COLUMNA_ID);
    const posibleCodigo = fila.indexOf(COLUMNA_CODIGO_BC);

    if (posibleId !== -1 && posibleCodigo !== -1) {
      indiceEncabezado = i;
      columnaId = posibleId;
      columnaCodigo = posibleCodigo;
      break;
    }
  }

  if (indiceEncabezado === -1) {
    throw new ErrorLecturaExcel(
      `No se encontraron las columnas "${COLUMNA_ID}" y "${COLUMNA_CODIGO_BC}". Usa el archivo descargado desde esta misma pantalla, sin renombrar los encabezados.`
    );
  }

  const filas: FilaImportacion[] = [];

  for (let i = indiceEncabezado + 1; i < matriz.length; i++) {
    const fila = matriz[i] ?? [];
    const idCrudo = String(fila[columnaId] ?? '').trim();

    // Fila vacía al final del archivo -> se ignora en silencio.
    if (idCrudo === '') continue;

    const idProducto = Number(idCrudo);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      throw new ErrorLecturaExcel(
        `La fila ${i + 1} tiene un ID inválido ("${idCrudo}"). No modifiques la columna ${COLUMNA_ID}.`
      );
    }

    filas.push({
      // i + 1 -> número de fila tal como lo ve el usuario en Excel.
      fila: i + 1,
      id_producto: idProducto,
      bc_nro_producto: String(fila[columnaCodigo] ?? '').trim(),
    });
  }

  if (filas.length === 0) {
    throw new ErrorLecturaExcel('El archivo no tiene filas de productos.');
  }

  return filas;
}