// src/modules/catalogos/pages/CatalogosPage.tsx
import { useState } from 'react';
import CrudCatalogoGenerico from '../components/CrudCatalogoGenerico';
import {
  claseProveedorApi,
  categoriaProductoApi,
  tipoDocumentoApi,
  tipoDocumentoProductoApi,
  unidadPresentacionApi,
  type ClaseProveedor,
  type CategoriaProducto,
  type TipoDocumento,
  type TipoDocumentoProducto,
  type UnidadPresentacion,
} from '../api/catalogosApi';

const PESTANAS = [
  { id: 'clases', etiqueta: 'Clase de Proveedor' },
  { id: 'categorias', etiqueta: 'Categoría de Producto' },
  { id: 'tipos-documento', etiqueta: 'Tipo de Documento' },
  { id: 'tipos-documento-producto', etiqueta: 'Tipo de Documento de Producto' },
  { id: 'unidades', etiqueta: 'Unidad de Presentación' },
] as const;

type IdPestana = (typeof PESTANAS)[number]['id'];

export default function CatalogosPage() {
  const [pestana, setPestana] = useState<IdPestana>('clases');

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div>
        <h1 className="font-display text-lg font-semibold text-brand-900">Catálogos</h1>
        <p className="text-brand-900/55 text-xs mt-0.5">
          Datos base que usa el resto del sistema: clases, categorías, tipos de documento y unidades.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-brand-900/8 overflow-x-auto">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            className={`shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              pestana === p.id
                ? 'border-brand-900 text-brand-900'
                : 'border-transparent text-brand-900/50 hover:text-brand-900'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'clases' && (
        <CrudCatalogoGenerico<ClaseProveedor>
          queryKey="catalogo-clases-proveedor"
          api={claseProveedorApi}
          obtenerId={(c) => c.Id_Clase_Proveedor}
          obtenerNombre={(c) => c.Nombre_Clase}
          nombreSingular="Clase de proveedor"
          campos={[
            { clave: 'nombre_clase', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
            {
              clave: 'icono_url',
              etiqueta: 'URL del ícono (opcional)',
              tipo: 'texto',
              placeholder: 'https://...',
            },
          ]}
        />
      )}

      {pestana === 'categorias' && (
        <CrudCatalogoGenerico<CategoriaProducto>
          queryKey="catalogo-categorias-producto"
          api={categoriaProductoApi}
          obtenerId={(c) => c.Id_Categoria_Producto}
          obtenerNombre={(c) => c.Nombre_Categoria}
          nombreSingular="Categoría de producto"
          campos={[
            { clave: 'nombre_categoria', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
            { clave: 'descripcion', etiqueta: 'Descripción (opcional)', tipo: 'textarea' },
          ]}
        />
      )}

      {pestana === 'tipos-documento' && (
        <CrudCatalogoGenerico<TipoDocumento>
          queryKey="catalogo-tipos-documento"
          api={tipoDocumentoApi}
          obtenerId={(t) => t.Id_Tipo_Documento}
          obtenerNombre={(t) => t.Nombre_Documento}
          nombreSingular="Tipo de documento"
          columnasExtra={[
            { etiqueta: 'Grupo', obtenerValor: (t) => t.Categoria },
            { etiqueta: 'Obligatorio', obtenerValor: (t) => (t.Obligatorio ? 'Sí' : 'No'), esBadge: true },
          ]}
          campos={[
            {
              clave: 'categoria',
              etiqueta: 'Grupo (pestaña donde aparece)',
              tipo: 'select',
              opciones: ['General', 'Certificaciones'],
              requerido: true,
            },
            { clave: 'nombre_documento', etiqueta: 'Nombre del documento', tipo: 'texto', requerido: true },
            {
              clave: 'carpeta_slug',
              etiqueta: 'Slug de carpeta (minúsculas, sin espacios)',
              tipo: 'texto',
              placeholder: 'ej: certificado-iess',
              requerido: true,
            },
            {
              clave: 'codigo_archivo',
              etiqueta: 'Código corto para el nombre de archivo (opcional)',
              tipo: 'texto',
              placeholder: 'ej: IESS',
            },
            { clave: 'obligatorio', etiqueta: 'Obligatorio', tipo: 'checkbox', placeholder: 'Es obligatorio cargarlo' },
            {
              clave: 'permite_multiples',
              etiqueta: 'Múltiples archivos',
              tipo: 'checkbox',
              placeholder: 'Permite cargar más de un archivo de este tipo',
            },
            {
              clave: 'requiere_fecha_caducidad',
              etiqueta: 'Fecha de caducidad',
              tipo: 'checkbox',
              placeholder: 'Pide fecha de vencimiento al cargarlo',
            },
            {
              clave: 'requiere_solo_quito',
              etiqueta: 'Solo Quito',
              tipo: 'checkbox',
              placeholder: 'Solo aplica a proveedores de Quito',
            },
          ]}
        />
      )}

      {pestana === 'tipos-documento-producto' && (
        <CrudCatalogoGenerico<TipoDocumentoProducto>
          queryKey="catalogo-tipos-documento-producto"
          api={tipoDocumentoProductoApi}
          obtenerId={(t) => t.Id_Tipo_Documento_Producto}
          obtenerNombre={(t) => t.Nombre_Documento}
          nombreSingular="Tipo de documento de producto"
          columnasExtra={[{ etiqueta: 'Obligatorio', obtenerValor: (t) => (t.Obligatorio ? 'Sí' : 'No'), esBadge: true }]}
          campos={[
            { clave: 'nombre_documento', etiqueta: 'Nombre del documento', tipo: 'texto', requerido: true },
            {
              clave: 'carpeta_slug',
              etiqueta: 'Slug de carpeta (minúsculas, sin espacios)',
              tipo: 'texto',
              placeholder: 'ej: ficha-tecnica',
              requerido: true,
            },
            {
              clave: 'codigo_archivo',
              etiqueta: 'Código corto para el nombre de archivo (opcional)',
              tipo: 'texto',
              placeholder: 'ej: FT',
            },
            { clave: 'obligatorio', etiqueta: 'Obligatorio', tipo: 'checkbox', placeholder: 'Es obligatorio cargarlo' },
          ]}
        />
      )}

      {pestana === 'unidades' && (
        <CrudCatalogoGenerico<UnidadPresentacion>
          queryKey="catalogo-unidades-presentacion"
          api={unidadPresentacionApi}
          obtenerId={(u) => u.Id_Unidad_Presentacion}
          obtenerNombre={(u) => u.Nombre_Unidad}
          nombreSingular="Unidad de presentación"
          campos={[{ clave: 'nombre_unidad', etiqueta: 'Nombre', tipo: 'texto', placeholder: 'ej: Unidad, Caja, Kg', requerido: true }]}
        />
      )}
    </div>
  );
}