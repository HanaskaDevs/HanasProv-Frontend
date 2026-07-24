import ListaProductos from '../components/ListaProductos';

export default function ProductosPage() {
  return (
    <div className="space-y-3">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="font-display text-lg font-semibold text-brand-900">Productos</h1>
        <p className="text-brand-900/55 text-xs mt-0.5">Catálogo de productos con su ficha técnica y análisis.</p>
      </div>
      <ListaProductos />
    </div>
  );
}