// src/shared/utils/descargarExcel.ts

/**
 * Genera y descarga un .xlsx desde filas de objetos.
 *
 * USA LA LIBRERÍA QUE YA ESTÁ EN EL PROYECTO (xlsx, la misma del catálogo de
 * productos) y con `await import()`, así que no entra al paquete principal:
 * solo se descarga cuando alguien realmente pide un archivo.
 *
 * SE GENERA EN EL NAVEGADOR y no en el servidor a propósito: el backend no
 * tiene librería de hojas de cálculo, agregar una (PhpSpreadsheet) sumaría una
 * dependencia y un endpoint nuevo, y el navegador ya tiene todo lo necesario
 * porque el módulo de catálogo lo usa desde antes.
 */
export async function descargarExcel(
  filas: Record<string, string | number>[],
  nombreHoja: string,
  nombreArchivo: string
): Promise<void> {
  if (filas.length === 0) return;

  const XLSX = await import('xlsx');

  const hoja = XLSX.utils.json_to_sheet(filas);

  // Ancho de columna según el contenido más largo, con un tope: sin esto todas
  // las columnas salen del mismo ancho y los nombres de proveedor quedan
  // cortados.
  const columnas = Object.keys(filas[0]);
  hoja['!cols'] = columnas.map((columna) => {
    const largos = filas.map((fila) => String(fila[columna] ?? '').length);
    return { wch: Math.min(42, Math.max(columna.length, ...largos) + 2) };
  });

  const libro = XLSX.utils.book_new();
  // Excel corta el nombre de la hoja en 31 caracteres y rechaza : \ / ? * [ ]
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja.replace(/[:\\/?*[\]]/g, '-').slice(0, 31));

  XLSX.writeFile(libro, nombreArchivo);
}

/** Nombre de archivo con fecha, saneado para cualquier sistema de archivos. */
export function nombreArchivoConFecha(base: string): string {
  const ahora = new Date();
  const sello = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, '0'),
    String(ahora.getDate()).padStart(2, '0'),
  ].join('-');

  const limpio = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);

  return `${limpio || 'reporte'}-${sello}.xlsx`;
}
