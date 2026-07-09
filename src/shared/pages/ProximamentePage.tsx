import Card from '../components/Card';

export default function ProximamentePage({ titulo }: { titulo: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-brand-900">{titulo}</h1>
      <Card>
        <p className="text-sm text-brand-900/60 text-center py-10">
          Este módulo está en construcción. Muy pronto vas a poder usarlo aquí.
        </p>
      </Card>
    </div>
  );
}