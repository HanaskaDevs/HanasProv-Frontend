import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import Input from '../../../shared/components/Input';

const icono = L.icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ECUADOR_CENTRO: [number, number] = [-1.8312, -78.1834];

interface LocationPickerProps {
  latitudInicial?: number | null;
  longitudInicial?: number | null;
  onSeleccionar: (lat: number, lng: number) => void;
}

interface ResultadoBusqueda {
  display_name: string;
  lat: string;
  lon: string;
}

function ManejadorClick({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * MapContainer solo usa la prop "center" en el montaje inicial -> para
 * mover el mapa DESPUÉS (ej. al elegir un resultado de búsqueda) hay que
 * hacerlo de forma imperativa con el mapa de Leaflet directamente.
 */
function CentrarMapa({ posicion }: { posicion: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) {
      map.setView(posicion, 16);
    }
  }, [posicion, map]);
  return null;
}

export default function LocationPicker({
  latitudInicial,
  longitudInicial,
  onSeleccionar,
}: LocationPickerProps) {
  const tieneUbicacionInicial = !!latitudInicial && !!longitudInicial;
  const centroInicial: [number, number] = tieneUbicacionInicial
    ? [latitudInicial!, longitudInicial!]
    : ECUADOR_CENTRO;

  const [posicion, setPosicion] = useState<[number, number] | null>(
    tieneUbicacionInicial ? centroInicial : null
  );

  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick(lat: number, lng: number) {
    const posicionRedondeada: [number, number] = [Number(lat.toFixed(7)), Number(lng.toFixed(7))];
    setPosicion(posicionRedondeada);
    onSeleccionar(posicionRedondeada[0], posicionRedondeada[1]);
  }

  function handleBusquedaChange(valor: string) {
    setBusqueda(valor);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (valor.trim().length < 3) {
      setResultados([]);
      return;
    }

    // Debounce de 600ms: Nominatim es un servicio gratuito compartido,
    // evitamos mandarle una consulta por cada tecla presionada.
    timeoutRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const params = new URLSearchParams({
          format: 'json',
          q: valor,
          countrycodes: 'ec',
          limit: '5',
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
        const data = await res.json();
        setResultados(data);
        setMostrarResultados(true);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 600);
  }

  function seleccionarResultado(resultado: ResultadoBusqueda) {
    const lat = Number(Number(resultado.lat).toFixed(7));
    const lng = Number(Number(resultado.lon).toFixed(7));
    setPosicion([lat, lng]);
    onSeleccionar(lat, lng);
    setBusqueda(resultado.display_name);
    setMostrarResultados(false);
  }

  return (
    <div className="max-w-xl space-y-2">
      <label className="text-sm font-medium text-brand-900">Ubicación</label>

      <div className="relative">
        <Input
          placeholder="Busca una dirección, ej: Av. Amazonas y Naciones Unidas, Quito"
          value={busqueda}
          onChange={(e) => handleBusquedaChange(e.target.value)}
          onFocus={() => resultados.length > 0 && setMostrarResultados(true)}
          onBlur={() => setTimeout(() => setMostrarResultados(false), 150)}
        />

        {buscando && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-900/40">
            Buscando...
          </span>
        )}

        {mostrarResultados && resultados.length > 0 && (
          <div className="absolute z-[2000] mt-1 w-full rounded-md border border-brand-900/15 bg-white shadow-lg max-h-56 overflow-y-auto">
            {resultados.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => seleccionarResultado(r)}
                className="block w-full text-left px-3 py-2 text-sm text-brand-900 hover:bg-brand-200/30 border-b border-brand-900/5 last:border-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md overflow-hidden border border-brand-900/15">
        <MapContainer
          center={centroInicial}
          zoom={tieneUbicacionInicial ? 15 : 6}
          style={{ height: '280px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ManejadorClick onClick={handleClick} />
          <CentrarMapa posicion={posicion} />
          {posicion && <Marker position={posicion} icon={icono} />}
        </MapContainer>
      </div>

      <p className="text-xs text-brand-900/50">
        {posicion
          ? `Ubicación seleccionada: ${posicion[0]}, ${posicion[1]}`
          : 'Busca una dirección o haz clic directamente en el mapa.'}
      </p>
    </div>
  );
}