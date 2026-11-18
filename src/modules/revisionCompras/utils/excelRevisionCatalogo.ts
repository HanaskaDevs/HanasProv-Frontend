// src/modules/revisionCompras/utils/excelRevisionCatalogo.ts
import type { WorkBook } from 'xlsx';
import { CAMPOS_EDITABLES } from '../types';
import type {
  CampoEditable,
  FilaExcelRevision,
  FilaImportacionRevision,
  ValoresValidosRevision,
} from '../types';

/**
 * Genera y lee el Excel de los productos que esperan a Catálogo
 * (18-nov-2026). Mismo esquema que el de códigos BC del Catálogo de
 * productos (ver catalogoProductos/utils/excelCodigosBc.ts): todo pasa en el
 * navegador, nunca viaja un .xlsx al backend.
 *
 *  - Al descargar se arma el archivo con las filas que ya trajo el API.
 *  - Al subir se convierte a JSON y se mandan las celdas TAL CUAL están
 *    escritas. Quien interpreta cada una (número, categoría, unidad,
 *    grupos) es el backend, que devuelve el reporte fila por fila.
 *
 * 'xlsx' entra arriba solo como tipo y la librería se pide con
 * `await import('xlsx')` dentro de cada función: son ~440 kB que así se
 * bajan recién al pulsar "Descargar Excel" o al elegir un archivo.
 */

/** Columnas de referencia: se muestran, pero lo que se escriba ahí se ignora. */
const COLUMNA_ID = 'ID';

const COLUMNAS_REFERENCIA = [
  { encabezado: COLUMNA_ID, ancho: 8, valor: (f: FilaExcelRevision) => String(f.id_producto) },
  { encabezado: 'PROVEEDOR', ancho: 36, valor: (f: FilaExcelRevision) => f.proveedor },
  { encabezado: 'RUC', ancho: 15, valor: (f: FilaExcelRevision) => f.ruc },
  { encabezado: 'CODIGO BC', ancho: 14, valor: (f: FilaExcelRevision) => f.bc_nro_producto },
] as const;

/**
 * Columnas editables: encabezado del Excel por cada campo. El orden de
 * CAMPOS_EDITABLES define el orden de las columnas del archivo.
 */
const COLUMNAS_EDITABLES: Record<CampoEditable, { encabezado: string; ancho: number }> = {
  nombre_producto: { encabezado: 'PRODUCTO', ancho: 46 },
  codigo_barras: { encabezado: 'COD. BARRAS', ancho: 17 },
  categoria: { encabezado: 'CATEGORIA', ancho: 14 },
  unidad: { encabezado: 'UNIDAD', ancho: 12 },
  precio: { encabezado: 'PRECIO', ancho: 11 },
  peso: { encabezado: 'PESO KG', ancho: 10 },
  unidad_por_caja: { encabezado: 'UNIDADES X MASTERPACK', ancho: 22 },
  contenido_paquete: { encabezado: 'CONTENIDO X PAQUETE', ancho: 21 },
  masterpack_largo_cm: { encabezado: 'MASTERPACK LARGO CM', ancho: 21 },
  masterpack_ancho_cm: { encabezado: 'MASTERPACK ANCHO CM', ancho: 21 },
  masterpack_alto_cm: { encabezado: 'MASTERPACK ALTO CM', ancho: 20 },
  unidad_largo_cm: { encabezado: 'UNIDAD LARGO CM', ancho: 17 },
  unidad_ancho_cm: { encabezado: 'UNIDAD ANCHO CM', ancho: 17 },
  unidad_alto_cm: { encabezado: 'UNIDAD ALTO CM', ancho: 16 },
  grupos: { encabezado: 'GRUPOS', ancho: 14 },
};

const HOJA_PRODUCTOS = 'Productos';
const HOJA_AYUDA = 'Valores validos';

/**
 * Normaliza un encabezado para compararlo: mayúsculas, sin acentos y sin
 * espacios de más. Así el archivo sigue siendo válido aunque el usuario lo
 * reescriba con tilde o Excel le cambie el espaciado.
 */
function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export function nombreArchivoRevision(): string {
  const ahora = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const sello = `${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}-${pad(ahora.getHours())}${pad(ahora.getMinutes())}`;
  return `productos-por-revisar-catalogo-${sello}.xlsx`;
}

/**
 * Descarga el Excel con todo lo que espera a Catálogo.
 *
 * TODAS las celdas van como TEXTO, con formato de texto ("@"): si quedaran
 * como número, Excel se come los ceros a la izquierda de un código de barras
 * ("0786..." -> 786...) y redondea a la vista un precio de 4 decimales. Con
 * el formato "@" además lo que el usuario escriba en la celda se queda tal
 * cual lo escribió.
 *
 * La segunda hoja lista lo que se puede escribir en CATEGORIA, UNIDAD y
 * GRUPOS: son las tres columnas que no son texto libre.
 */
export async function descargarExcelRevision(
  filas: FilaExcelRevision[],
  valoresValidos: ValoresValidosRevision,
  nombreArchivo = nombreArchivoRevision()
): Promise<void> {
  const XLSX = await import('xlsx');

  const datos: string[][] = [
    [...COLUMNAS_REFERENCIA.map((c) => c.encabezado), ...CAMPOS_EDITABLES.map((c) => COLUMNAS_EDITABLES[c].encabezado)],
    ...filas.map((f) => [
      ...COLUMNAS_REFERENCIA.map((c) => c.valor(f) ?? ''),
      ...CAMPOS_EDITABLES.map((c) => f[c] ?? ''),
    ]),
  ];

  const hoja = XLSX.utils.aoa_to_sheet(datos);
  const totalColumnas = datos[0].length;

  // Se recorre fila x columna y no solo las celdas que existen: una celda
  // vacía (un producto sin peso) también tiene que quedar con formato de
  // texto, porque es justo donde el usuario va a escribir.
  for (let fila = 0; fila < datos.length; fila++) {
    for (let col = 0; col < totalColumnas; col++) {
      const direccion = XLSX.utils.encode_cell({ r: fila, c: col });
      hoja[direccion] = { t: 's', v: datos[fila][col] ?? '', z: '@' };
    }
  }

  hoja['!cols'] = [
    ...COLUMNAS_REFERENCIA.map((c) => ({ wch: c.ancho })),
    ...CAMPOS_EDITABLES.map((c) => ({ wch: COLUMNAS_EDITABLES[c].ancho })),
  ];

  const ayuda: string[][] = [
    ['COMO USAR ESTE ARCHIVO'],
    ['1. Corrige los datos en la hoja "Productos" y guarda el archivo.'],
    ['2. Subelo en Productos por revisar > "Subir Excel". Antes de guardar veras que va a cambiar.'],
    ['3. No cambies ID, PROVEEDOR, RUC ni CODIGO BC: son de referencia y se ignoran.'],
    ['4. Una celda vacia borra ese dato. Si borras una columna entera, ese dato no se toca.'],
    ['5. PRECIO admite hasta 4 decimales (ejemplo: 1.2575).'],
    [],
    ['CATEGORIA (una de estas)'],
    ...valoresValidos.categorias.map((c) => [c]),
    [],
    ['UNIDAD (una de estas)'],
    ...valoresValidos.unidades.map((u) => [u]),
    [],
    ['GRUPOS (codigos separados por coma, o vacio)', 'Nombre'],
    ...valoresValidos.grupos.map((g) => [g.codigo, g.nombre]),
  ];

  const hojaAyuda = XLSX.utils.aoa_to_sheet(ayuda);
  hojaAyuda['!cols'] = [{ wch: 90 }, { wch: 40 }];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, HOJA_PRODUCTOS);
  XLSX.utils.book_append_sheet(libro, hojaAyuda, HOJA_AYUDA);
  XLSX.writeFile(libro, nombreArchivo);
}

export class ErrorLecturaExcelRevision extends Error {}

/**
 * Lee el .xlsx que el usuario vuelve a subir.
 *
 * Las columnas se ubican POR NOMBRE de encabezado, no por posición: no
 * importa si las reordenaron u ocultaron. La única imprescindible es ID. De
 * las editables se manda cada una SOLO si está en el archivo: la que falta
 * no viaja y el backend no toca ese dato.
 */
export async function leerExcelRevision(archivo: File): Promise<FilaImportacionRevision[]> {
  const XLSX = await import('xlsx');
  const buffer = await archivo.arrayBuffer();

  let libro: WorkBook;
  try {
    libro = XLSX.read(buffer, { type: 'array' });
  } catch {
    throw new ErrorLecturaExcelRevision('No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) válido.');
  }

  // La hoja "Productos" si existe; si la renombraron, la primera.
  const nombreHoja = libro.SheetNames.find((n) => normalizar(n) === normalizar(HOJA_PRODUCTOS)) ?? libro.SheetNames[0];
  if (!nombreHoja) {
    throw new ErrorLecturaExcelRevision('El archivo no tiene ninguna hoja.');
  }

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[nombreHoja], {
    header: 1,
    // raw:false -> todo llega como texto, tal como se ve en la celda.
    raw: false,
    defval: '',
    blankrows: false,
  });

  // El encabezado se busca en las primeras filas, por si dejaron un título
  // o una fila en blanco arriba de la tabla.
  let indiceEncabezado = -1;
  let encabezados: string[] = [];

  for (let i = 0; i < Math.min(matriz.length, 10); i++) {
    const fila = (matriz[i] ?? []).map(normalizar);
    if (fila.includes(COLUMNA_ID)) {
      indiceEncabezado = i;
      encabezados = fila;
      break;
    }
  }

  if (indiceEncabezado === -1) {
    throw new ErrorLecturaExcelRevision(
      `No se encontró la columna "${COLUMNA_ID}". Usa el archivo descargado desde esta misma pantalla, sin renombrar ese encabezado.`
    );
  }

  const columnaId = encabezados.indexOf(COLUMNA_ID);

  // Qué columnas editables trae ESTE archivo, y en qué posición.
  const columnas = CAMPOS_EDITABLES.map((campo) => ({
    campo,
    posicion: encabezados.indexOf(normalizar(COLUMNAS_EDITABLES[campo].encabezado)),
  })).filter((c) => c.posicion !== -1);

  if (columnas.length === 0) {
    throw new ErrorLecturaExcelRevision(
      'El archivo no trae ninguna columna de datos para actualizar (PRODUCTO, PRECIO, CATEGORIA...). Usa el archivo descargado desde esta pantalla.'
    );
  }

  const filas: FilaImportacionRevision[] = [];

  for (let i = indiceEncabezado + 1; i < matriz.length; i++) {
    const fila = matriz[i] ?? [];
    const idCrudo = String(fila[columnaId] ?? '').trim();

    // Fila sin ID (vacía al final del archivo) -> se ignora en silencio.
    if (idCrudo === '') continue;

    const idProducto = Number(idCrudo);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      throw new ErrorLecturaExcelRevision(
        `La fila ${i + 1} tiene un ID inválido ("${idCrudo}"). No modifiques la columna ${COLUMNA_ID}.`
      );
    }

    // i + 1 -> número de fila tal como lo ve el usuario en Excel.
    const leida: FilaImportacionRevision = { fila: i + 1, id_producto: idProducto };

    columnas.forEach(({ campo, posicion }) => {
      leida[campo] = String(fila[posicion] ?? '').trim();
    });

    filas.push(leida);
  }

  if (filas.length === 0) {
    throw new ErrorLecturaExcelRevision('El archivo no tiene filas de productos.');
  }

  return filas;
}
