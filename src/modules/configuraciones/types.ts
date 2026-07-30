export interface HomeSlide {
  Id_Home_Slide: number;
  Orden: number;
  Eyebrow: string;
  Titulo: string;
  Descripcion: string;
  Ruta_Media: string | null;
  Tipo_Media: 'imagen' | 'video' | null;
  Activo: boolean;
}

export interface BotRegla {
  Id_Bot_Regla: number;
  Tipo: 'Persona' | 'Respaldo';
  Palabra_Clave: string | null;
  Contenido: string;
  Orden: number;
  Activo: boolean;
}

export interface GuiaPaso {
  Id_Guia_Paso: number;
  Orden: number;
  Target_Id: 'tour-mi-ficha' | 'tour-documentacion' | 'tour-productos';
  Titulo: string;
  Texto: string;
  Activo: boolean;
}

export interface Politica {
  Id_Politica: number;
  Orden: number;
  Titulo: string;
  Descripcion: string;
  Activo: boolean;
}