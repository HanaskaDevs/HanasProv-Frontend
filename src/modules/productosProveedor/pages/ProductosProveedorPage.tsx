import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import ListaProductos from '../../fichaProductos/components/ListaProductos';
import SelectorProveedorProductos, { nombreDe } from '../components/SelectorProveedorProductos';
import type { ProveedorConProductos } from '../../fichaProductos/types';

/**
 * PRODUCTOS POR PROVEEDOR — la pantalla del comprador.
 *
 * Pedido del usuario (10-sep-2026): "los de comprador entran y pueden
 * llenar todos los campos de productos y crear productos para ese
 * proveedor". O sea, exactamente la misma Ficha de Productos que ve el
 * proveedor, pero eligiendo primero de quién.
 *
 * Por eso son dos pasos y no una tabla gigante de todos los productos de
 * todos los proveedores mezclados: el trabajo es POR PROVEEDOR (un
 * proveedor puede tener 1300 productos), y una vez adentro se reusa tal
 * cual ListaProductos, con su búsqueda, sus filtros por estado, su
 * selección múltiple y sus modales de documentos y de registro.
 *
 * Ya existe una pantalla parecida pero que NO reemplaza a esta: Catálogo de
 * Productos muestra todos los productos de la empresa juntos, de solo
 * lectura, para asignarles el código de BC. Es para mirar el conjunto; esta
 * es para trabajar un proveedor.
 */
function ProductosProveedorContenido() {
  const [proveedor, setProveedor] = useState<ProveedorConProductos | null>(null);

  if (!proveedor) {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Productos por proveedor
          </h1>
          <p className="text-brand-900/50 text-xs mt-0.5">
            Elige un proveedor para ver, editar y cargar su ficha de productos.
          </p>
        </div>

        <SelectorProveedorProductos onElegir={setProveedor} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="max-w-6xl mx-auto w-full">
        <button
          onClick={() => setProveedor(null)}
          className="text-xs font-medium text-brand-900/50 hover:text-brand-900 transition-colors flex items-center gap-1 mb-1"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Cambiar de proveedor
        </button>

        <h1 className="font-display text-lg font-semibold text-brand-900">{nombreDe(proveedor)}</h1>
        <p className="text-brand-900/55 text-xs mt-0.5">
          {proveedor.ruc ?? 'Sin RUC'}
          {proveedor.estado && ` · ${proveedor.estado}`}
          {' · '}
          Los productos que cargues aquí quedan a nombre de este proveedor y pasan por la misma calificación.
        </p>
      </div>

      {/* key: fuerza a React a montar una lista NUEVA al cambiar de
          proveedor, en vez de reusar la anterior. Sin esto quedarían vivos
          el término de búsqueda y la página del proveedor anterior, y la
          primera pantalla que se vería sería el catálogo de otro filtrado
          por un texto que ya no viene al caso. */}
      <ListaProductos key={proveedor.id_proveedor} idProveedor={proveedor.id_proveedor} />
    </div>
  );
}

/**
 * Compras (el "comprador"), Admin y Sistemas. El backend lo vuelve a
 * validar en ProductoService::verificarAccesoInterno -> esto es solo para
 * no dibujar una pantalla que después responde 403 en cada consulta.
 */
export default function ProductosProveedorPage() {
  const { esCompras, esAdmin, esSistemas } = useAuth();

  return (
    <RoleRoute allow={esCompras || esAdmin || esSistemas}>
      <ProductosProveedorContenido />
    </RoleRoute>
  );
}
