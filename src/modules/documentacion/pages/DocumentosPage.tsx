import ChecklistDocumentos from '../components/ChecklistDocumentos';

export default function DocumentosPage() {
  return (
    <div className="h-full flex flex-col space-y-3">
      <div className="max-w-6xl mx-auto w-full shrink-0">
        <h1 className="font-display text-lg font-semibold text-brand-900">Documentos</h1>
        <p className="text-brand-900/55 text-xs mt-0.5">Documentación legal, sanitaria y de calidad de tu empresa.</p>
      </div>
      <ChecklistDocumentos />
    </div>
  );
}