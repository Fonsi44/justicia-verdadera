export interface HelpArticle {
  title: string;
  content: string;
}

export interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  articles: HelpArticle[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "primeros-pasos",
    name: "Primeros pasos",
    icon: "Rocket",
    articles: [
      {
        title: "¿Cómo registrarme en Justicia Verdadera?",
        content:
          "Para registrarte, haz clic en 'Iniciar sesión' y elige Google o Microsoft. Si eres el primer usuario de tu despacho, se creará automáticamente una cuenta con un período de prueba de 14 días. Podrás invitar a otros abogados de tu equipo desde la sección Configuración.",
      },
      {
        title: "¿Cómo crear un caso?",
        content:
          "Ve a la sección 'Casos' y haz clic en 'Nuevo caso'. Completa los campos obligatorios: número de caso, título, materia (civil, penal, laboral, etc.), estado y fecha de inicio. Puedes asignar un abogado responsable y añadir contacto(s) relacionados.",
      },
      {
        title: "¿Cómo subir un documento?",
        content:
          "Desde la vista de un caso, ve a la pestaña 'Documentos' y haz clic en 'Subir documento'. Arrastra el archivo o selecciona desde tu computadora. Formatos soportados: PDF, DOCX, imágenes (JPG, PNG). El sistema procesará automáticamente el OCR para documentos escaneados.",
      },
    ],
  },
  {
    id: "facturacion",
    name: "Facturación",
    icon: "Receipt",
    articles: [
      {
        title: "¿Cómo crear una factura?",
        content:
          "Ve a 'Facturación' y haz clic en 'Nueva factura'. Selecciona el cliente, añade los items (descripción, cantidad, precio unitario). El sistema calcula automáticamente el ISV (15% por defecto) y el total. Puedes incluir horas facturables desde la sección de Tiempo.",
      },
      {
        title: "Facturación SAR-compliant",
        content:
          "Las facturas incluyen campos para cumplir con la normativa del SAR de Honduras: RTN del emisor y receptor, CAI (Código de Autorización de Impresión), cálculo de ISV 15%, retención ISR 12.5% para personas jurídicas. Puedes exportar tus facturas en CSV para carga manual en el portal SAR.",
      },
    ],
  },
  {
    id: "documentos",
    name: "Documentos",
    icon: "FileText",
    articles: [
      {
        title: "¿Cómo funciona el OCR de documentos?",
        content:
          "Al subir un documento, el sistema inicia automáticamente el proceso OCR (Reconocimiento Óptico de Caracteres). Los PDFs con capa de texto se procesan directamente; las imágenes y PDFs escaneados se procesan con Tesseract.js. Una vez completado, puedes buscar texto dentro del documento.",
      },
      {
        title: "Búsqueda en documentos",
        content:
          "Puedes buscar texto en todos los documentos de tu despacho usando la barra de búsqueda en la sección 'Documentos'. La búsqueda incluye el texto extraído por OCR, permitiendo encontrar palabras clave incluso en documentos escaneados. Los resultados incluyen el nombre del documento, el caso asociado y un snippet del texto.",
      },
    ],
  },
  {
    id: "agenda",
    name: "Agenda",
    icon: "Calendar",
    articles: [
      {
        title: "Eventos y recordatorios",
        content:
          "La agenda te permite gestionar vistas, audiencias, plazos y reuniones. Crea eventos desde la sección 'Agenda' o desde la pestaña 'Eventos' de cada caso. Puedes marcar eventos como completados y recibir recordatorios. Los eventos próximos aparecen en el Dashboard.",
      },
    ],
  },
  {
    id: "ia-juridica",
    name: "IA Jurídica",
    icon: "Bot",
    articles: [
      {
        title: "Chat con IA jurídica",
        content:
          "El asistente IA jurídico responde preguntas sobre legislación hondureña, jurisprudencia y procedimientos legales. Usa DeepSeek V4 Flash con un corpus legal hondureño curado. Siempre verifica las respuestas con la fuente original. La IA es una herramienta de asistencia, no sustituye el criterio del abogado.",
      },
      {
        title: "Análisis de documentos con IA",
        content:
          "Puedes solicitar a la IA que analice documentos legales: resumen ejecutivo, detección de puntos clave, plazos importantes y posibles contradicciones. Los análisis se basan en el texto del documento y la jurisprudencia relevante. El abogado debe revisar y validar todo análisis antes de usarlo profesionalmente.",
      },
    ],
  },
];

export interface HelpSearchResult {
  title: string;
  snippet: string;
  category: string;
  categoryId: string;
}

export function searchHelp(query: string): HelpSearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return HELP_CATEGORIES.flatMap((category) =>
    category.articles
      .filter(
        (article) =>
          article.title.toLowerCase().includes(trimmed) ||
          article.content.toLowerCase().includes(trimmed)
      )
      .map((article) => ({
        title: article.title,
        snippet:
          article.content.slice(0, 200) +
          (article.content.length > 200 ? "..." : ""),
        category: category.name,
        categoryId: category.id,
      }))
  );
}
