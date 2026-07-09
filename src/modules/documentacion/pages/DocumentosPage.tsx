import ChecklistDocumentos from '../components/ChecklistDocumentos';

export default function DocumentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">Documentos</h1>
        <p className="text-brand-900/60 text-sm mt-1">Documentación legal, sanitaria y de calidad de tu empresa.</p>
      </div>
      <ChecklistDocumentos />
    </div>
  );
}