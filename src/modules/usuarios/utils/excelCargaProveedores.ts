// src/modules/usuarios/utils/excelCargaProveedores.ts
import type { WorkBook } from 'xlsx';
import type { FilaCargaMasiva, ResultadoFilaCarga } from '../api/usuariosApi';

/**
 * Plantilla, lectura y reporte del Excel de carga masiva de proveedores.
 *
 * Todo pasa en el navegador: el .xlsx nunca viaja al backend. Se lee acá,
 * se convierte a JSON y se manda solo lo que hace falta (correo, empresas
 * escritas y el código de referencia). Así el backend no necesita ninguna
 * librería de Office instalada, que en este servidor sería una dependencia
 * nueva de Composer en producción sin entorno de pruebas.
 *
 * OJO con el import de 'xlsx': arriba entra SOLO como tipo (se borra al
 * compilar) y la librería real se pide con `await import('xlsx')` dentro de
 * cada función. Son ~440 kB minificados; con un import normal viajarían en
 * el chunk de la pantalla de Usuarios externos y se bajarían siempre,
 * aunque nadie toque Excel. Mismo criterio que excelCodigosBc.ts.
 * ErrorLecturaExcel queda como export normal a propósito -> no depende de
 * xlsx y el `instanceof` del modal necesita poder importarlo sin esperar.
 */

/**
 * SEPARADOR de varias empresas dentro de una misma celda.
 *
 * El recomendado es el punto y coma. Se aceptan además `|` y el salto de
 * línea (Alt+Enter dentro de la celda) porque no cuesta nada y evita que
 * alguien se trabe por un detalle de formato.
 *
 * La coma NO es separador, y es deliberado: las razones sociales la llevan
 * seguido ("COMERCIAL X S.A., CIA. LTDA."), así que partir por coma
 * cortaría un nombre en dos y la fila fallaría sin motivo aparente.
 *
 * Este mismo criterio está en el backend
 * (UsuarioService::resolverEmpresasDelExcel), que es el que manda: acá se
 * parte para poder mostrar la vista previa antes de subir.
 */
export const SEPARADOR_EMPRESAS = ';';

const COLUMNA_CODIGO = 'CODIGO PROVEEDOR';
const COLUMNA_CORREO = 'CORREO';
const COLUMNA_EMPRESAS = 'EMPRESAS CON ACCESO';

/**
 * Nombres alternativos que se aceptan para cada columna. La plantilla usa
 * los de arriba, pero un archivo armado a mano suele venir con "EMAIL" o
 * "EMPRESAS" y no hay razón para rechazarlo.
 */
const ALIAS_COLUMNAS: Record<string, readonly string[]> = {
  [COLUMNA_CODIGO]: ['CODIGO PROVEEDOR', 'CODIGO DE PROVEEDOR', 'CODIGO', 'COD PROVEEDOR', 'COD'],
  [COLUMNA_CORREO]: ['CORREO', 'EMAIL', 'CORREO ELECTRONICO', 'MAIL', 'CORREO DEL PROVEEDOR'],
  [COLUMNA_EMPRESAS]: ['EMPRESAS CON ACCESO', 'EMPRESAS', 'EMPRESA', 'EMPRESA CON ACCESO', 'ACCESO'],
};

/**
 * Normaliza un encabezado para compararlo: mayúsculas, sin acentos y sin
 * espacios de más. Así el archivo sigue sirviendo aunque Excel le cambie el
 * espaciado o alguien lo reescriba con tilde ("CÓDIGO" == "CODIGO").
 */
function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    // \p{M} = marcas combinantes: es lo que NFD deja separado de la letra
    // ("Ó" -> "O" + tilde). Equivale al rango U+0300-U+036F que usa
    // excelCodigosBc.ts, escrito así porque se lee sin decodificar nada.
    .replace(/\p{M}/gu, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

/**
 * Clave de comparación de un nombre de empresa: sin mayúsculas, sin tildes
 * y sin puntuación ni espacios. Así "Peña & Compañía Cía. Ltda.",
 * "PENA & COMPANIA CIA LTDA" y "peña&compañia cia ltda" son el mismo
 * nombre.
 *
 * Tiene que dar el MISMO resultado que
 * UsuarioService::normalizarNombreEmpresa del backend: si se cambia una,
 * hay que cambiar la otra, o la vista previa dirá que una empresa no existe
 * cuando el servidor sí la reconoce (o al revés, que es peor).
 */
export function claveNombreEmpresa(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** Parte la celda de empresas. Espejo de resolverEmpresasDelExcel del backend. */
export function partirEmpresas(texto: unknown): string[] {
  return String(texto ?? '')
    .split(/[;|\r\n]+/)
    .map((parte) => parte.trim())
    .filter((parte) => parte !== '');
}

function selloDeTiempo(): string {
  const ahora = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}-${pad(ahora.getHours())}${pad(ahora.getMinutes())}`;
}

/** Fuerza tipo texto en toda la hoja: sin esto Excel se come los ceros a la izquierda de un código ("0012" -> 12). */
async function forzarTexto(hoja: Record<string, unknown>): Promise<void> {
  const XLSX = await import('xlsx');
  const rango = XLSX.utils.decode_range((hoja['!ref'] as string) ?? 'A1');

  for (let fila = rango.s.r; fila <= rango.e.r; fila++) {
    for (let col = rango.s.c; col <= rango.e.c; col++) {
      const celda = hoja[XLSX.utils.encode_cell({ r: fila, c: col })] as { t?: string } | undefined;
      if (celda) celda.t = 's';
    }
  }
}

export interface EmpresaPlantilla {
  razon_social: string;
  nombre_comercial: string | null;
}

/**
 * Descarga la plantilla vacía, con dos hojas:
 *
 * - "Proveedores": las tres columnas a llenar, más dos filas de ejemplo
 *   que se borran antes de usar (el modal lo advierte).
 * - "Empresas": las empresas donde quien descarga tiene rol Sistemas, para
 *   copiar y pegar el nombre exacto en vez de adivinarlo. Sin esta hoja el
 *   error más común de una carga es escribir la empresa con un nombre que
 *   el portal no reconoce.
 */
export async function descargarPlantillaCargaProveedores(
  empresas: EmpresaPlantilla[],
  nombreArchivo = `plantilla-carga-proveedores-${selloDeTiempo()}.xlsx`
): Promise<void> {
  const XLSX = await import('xlsx');

  const nombres = empresas.map((e) => e.nombre_comercial || e.razon_social);

  // Los ejemplos usan empresas REALES de quien descarga (no "EMPRESA A"),
  // así se ve de una cómo hay que escribirlas y cómo separar dos.
  const ejemplo1 = nombres[0] ?? 'NOMBRE DE LA EMPRESA';
  const ejemplo2 = nombres.length > 1 ? nombres.slice(0, 2).join(`${SEPARADOR_EMPRESAS} `) : ejemplo1;

  const hojaProveedores = XLSX.utils.aoa_to_sheet([
    [COLUMNA_CODIGO, COLUMNA_CORREO, COLUMNA_EMPRESAS],
    ['PROV-00123', 'compras@proveedor-ejemplo.com', ejemplo1],
    ['PROV-00124', 'ventas@otro-ejemplo.com', ejemplo2],
  ]);

  await forzarTexto(hojaProveedores as unknown as Record<string, unknown>);

  hojaProveedores['!cols'] = [
    { wch: 20 }, // CODIGO PROVEEDOR
    { wch: 38 }, // CORREO
    { wch: 55 }, // EMPRESAS CON ACCESO
  ];

  const hojaEmpresas = XLSX.utils.aoa_to_sheet([
    ['EMPRESAS DONDE PUEDES CARGAR PROVEEDORES'],
    [`Copia el nombre tal cual. Para varias empresas en una fila, sepáralas con "${SEPARADOR_EMPRESAS}".`],
    [],
    ['NOMBRE PARA EL EXCEL', 'RAZON SOCIAL'],
    ...empresas.map((e) => [e.nombre_comercial || e.razon_social, e.razon_social]),
  ]);

  await forzarTexto(hojaEmpresas as unknown as Record<string, unknown>);

  hojaEmpresas['!cols'] = [{ wch: 45 }, { wch: 55 }];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hojaProveedores, 'Proveedores');
  XLSX.utils.book_append_sheet(libro, hojaEmpresas, 'Empresas');
  XLSX.writeFile(libro, nombreArchivo);
}

export class ErrorLecturaExcel extends Error {}

/** Correos de ejemplo de la plantilla: si alguien no borra esas filas, se ignoran en silencio. */
const CORREOS_DE_EJEMPLO = ['compras@proveedor-ejemplo.com', 'ventas@otro-ejemplo.com'];

/**
 * Lee el Excel y devuelve una fila por proveedor, lista para mandar al
 * backend.
 *
 * Las columnas se ubican POR NOMBRE de encabezado, no por posición: no
 * importa si se reordenaron o si se agregó una columna de notas al final.
 * El encabezado se busca en las primeras 10 filas por si arriba quedó un
 * título o una fila en blanco.
 *
 * Lo que NO hace: validar el correo ni las empresas. Eso lo decide el
 * backend fila por fila (la API es pública, así que la validación de acá
 * sería solo comodidad). El modal muestra avisos locales para que se vean
 * los problemas antes de subir, pero la respuesta manda.
 */
export async function leerExcelCargaProveedores(archivo: File): Promise<FilaCargaMasiva[]> {
  const XLSX = await import('xlsx');
  const buffer = await archivo.arrayBuffer();

  let libro: WorkBook;
  try {
    libro = XLSX.read(buffer, { type: 'array' });
  } catch {
    throw new ErrorLecturaExcel('No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) válido.');
  }

  // Se busca la hoja "Proveedores" de la plantilla; si no está (archivo
  // armado a mano), se usa la primera.
  const nombreHoja =
    libro.SheetNames.find((n) => normalizar(n) === 'PROVEEDORES') ?? libro.SheetNames[0];

  if (!nombreHoja) {
    throw new ErrorLecturaExcel('El archivo no tiene ninguna hoja.');
  }

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(libro.Sheets[nombreHoja], {
    header: 1,
    // raw:false -> todo llega como texto, así un código "0012" no se
    // convierte en 12.
    raw: false,
    defval: '',
    // blankrows:true es OBLIGATORIO acá, aunque parezca lo contrario: las
    // filas vacías se descartan más abajo igual.
    //
    // Con blankrows:false, sheet_to_json ELIMINA las filas en blanco del
    // arreglo, así que el índice deja de coincidir con la fila real de la
    // hoja. Un archivo con un título y una fila en blanco antes de la tabla
    // reportaba "fila 3" cuando en Excel era la 4 -> y ese número es
    // justamente lo que la persona usa para encontrar qué corregir. Con
    // blankrows:true el índice y la fila de Excel van 1 a 1.
    blankrows: true,
  });

  let indiceEncabezado = -1;
  let columnaCodigo = -1;
  let columnaCorreo = -1;
  let columnaEmpresas = -1;

  const ubicar = (fila: string[], columna: string): number =>
    fila.findIndex((celda) => ALIAS_COLUMNAS[columna].includes(celda));

  for (let i = 0; i < Math.min(matriz.length, 10); i++) {
    const fila = (matriz[i] ?? []).map(normalizar);
    const posibleCorreo = ubicar(fila, COLUMNA_CORREO);
    const posibleEmpresas = ubicar(fila, COLUMNA_EMPRESAS);

    // El código es opcional: alcanza con correo + empresas para reconocer
    // el encabezado.
    if (posibleCorreo !== -1 && posibleEmpresas !== -1) {
      indiceEncabezado = i;
      columnaCorreo = posibleCorreo;
      columnaEmpresas = posibleEmpresas;
      columnaCodigo = ubicar(fila, COLUMNA_CODIGO);
      break;
    }
  }

  if (indiceEncabezado === -1) {
    throw new ErrorLecturaExcel(
      `No se encontraron las columnas "${COLUMNA_CORREO}" y "${COLUMNA_EMPRESAS}". Descarga la plantilla desde esta misma pantalla y no renombres los encabezados.`
    );
  }

  const filas: FilaCargaMasiva[] = [];

  for (let i = indiceEncabezado + 1; i < matriz.length; i++) {
    const fila = matriz[i] ?? [];
    const correo = String(fila[columnaCorreo] ?? '').trim();
    const empresasCrudas = String(fila[columnaEmpresas] ?? '').trim();
    const codigo = columnaCodigo === -1 ? '' : String(fila[columnaCodigo] ?? '').trim();

    // Fila completamente vacía (las que Excel deja al final) -> se ignora.
    if (correo === '' && empresasCrudas === '' && codigo === '') continue;

    // Filas de ejemplo de la plantilla que nadie borró -> se ignoran en
    // silencio en vez de intentar crear "compras@proveedor-ejemplo.com".
    if (CORREOS_DE_EJEMPLO.includes(correo.toLowerCase())) continue;

    filas.push({
      // i + 1 -> número de fila tal como lo ve el usuario en Excel.
      numero_fila: i + 1,
      codigo_proveedor: codigo !== '' ? codigo : null,
      email: correo.toLowerCase(),
      empresas: partirEmpresas(empresasCrudas),
    });
  }

  if (filas.length === 0) {
    throw new ErrorLecturaExcel(
      'El archivo no tiene ninguna fila con datos. Recuerda reemplazar las filas de ejemplo de la plantilla.'
    );
  }

  return filas;
}

const ETIQUETA_ESTADO: Record<ResultadoFilaCarga['estado'], string> = {
  creado: 'Creado',
  acceso_agregado: 'Acceso agregado',
  omitido: 'Sin cambios',
  error: 'Error',
};

/**
 * Descarga el reporte de una carga ya procesada.
 *
 * Existe porque con 80 filas la tabla del modal no alcanza: quien carga
 * necesita quedarse con el detalle para corregir el archivo, reenviarlo y
 * poder decirle a Compras qué pasó con cada código de proveedor.
 */
export async function descargarReporteCargaProveedores(
  filas: ResultadoFilaCarga[],
  nombreArchivo = `reporte-carga-proveedores-${selloDeTiempo()}.xlsx`
): Promise<void> {
  const XLSX = await import('xlsx');

  const hoja = XLSX.utils.aoa_to_sheet([
    ['FILA', 'CODIGO PROVEEDOR', 'CORREO', 'EMPRESAS', 'RESULTADO', 'DETALLE'],
    ...filas.map((f) => [
      String(f.numero_fila),
      f.codigo_proveedor ?? '',
      f.email,
      f.empresas.join(`${SEPARADOR_EMPRESAS} `),
      ETIQUETA_ESTADO[f.estado],
      f.mensaje,
    ]),
  ]);

  await forzarTexto(hoja as unknown as Record<string, unknown>);

  hoja['!cols'] = [
    { wch: 7 },  // FILA
    { wch: 20 }, // CODIGO PROVEEDOR
    { wch: 38 }, // CORREO
    { wch: 40 }, // EMPRESAS
    { wch: 18 }, // RESULTADO
    { wch: 80 }, // DETALLE
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte');
  XLSX.writeFile(libro, nombreArchivo);
}
