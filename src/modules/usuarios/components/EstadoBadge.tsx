import Badge from '../../../shared/components/Badge';

export default function EstadoBadge({ activo, requiereActivacion }: { activo: boolean; requiereActivacion: boolean }) {
  if (!activo) return <Badge tone="danger">Inactivo</Badge>;
  if (requiereActivacion) return <Badge tone="warning">Pendiente de activar</Badge>;
  return <Badge tone="success">Activo</Badge>;
}
