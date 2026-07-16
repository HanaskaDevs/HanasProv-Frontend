/**
 * Ciudades/cantones principales de Ecuador para el dropdown de "Ciudad"
 * en la Ficha de Proveedor. "Quito" tiene que quedar escrito exactamente
 * así -> el backend compara contra este string (case-insensitive) para
 * decidir si el proveedor necesita el documento LUAE (solo aplica a
 * proveedores de Quito).
 */
export const CIUDADES_ECUADOR = [
  'Ambato',
  'Azogues',
  'Babahoyo',
  'Bahía de Caráquez',
  'Baños',
  'Cayambe',
  'Cuenca',
  'Daule',
  'Durán',
  'Esmeraldas',
  'Guaranda',
  'Guayaquil',
  'Ibarra',
  'Latacunga',
  'Loja',
  'Machala',
  'Manta',
  'Milagro',
  'Montecristi',
  'Nueva Loja (Lago Agrio)',
  'Otavalo',
  'Portoviejo',
  'Puyo',
  'Quevedo',
  'Quito',
  'Riobamba',
  'Rumiñahui (Sangolquí)',
  'Salinas',
  'Samborondón',
  'San Miguel de los Bancos',
  'Santa Elena',
  'Santa Rosa',
  'Santo Domingo',
  'Tena',
  'Tulcán',
  'Vinces',
  'Zamora',
] as const;