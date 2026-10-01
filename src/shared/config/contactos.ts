/**
 * Correos de Hanaska que el portal le muestra al proveedor.
 *
 * Están acá y no sueltos en cada componente porque el mismo correo aparece
 * en más de un lugar y cambiarlo "en todos lados" ya se pidió una vez
 * (01-oct-2026). Con una sola constante, la próxima vez es una línea.
 *
 * OJO: estos NO son los únicos lugares donde vive el correo de laboratorio.
 * También está en:
 *   - el slide del home (tabla Home_Slide), editable desde
 *     Configuraciones -> Home;
 *   - la guía que lee el asistente Hana, en el backend
 *     (AsistenteGuiaPortal::paraProveedor).
 */
export const CORREO_LABORATORIO = 'laboratorio@hanaska.com';
