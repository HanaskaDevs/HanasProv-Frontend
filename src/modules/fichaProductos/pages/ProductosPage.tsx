import ListaProductos from '../components/ListaProductos';

export default function ProductosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">Productos</h1>
        <p className="text-brand-900/60 text-sm mt-1">Catálogo de productos con su ficha técnica y análisis.</p>
      </div>
      <ListaProductos />
    </div>
  );
}