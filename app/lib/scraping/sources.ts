import type { LegalSource } from "./types";

export const LEGAL_SOURCES: LegalSource[] = [
  {
    id: "constitucion",
    name: "Constitución de la República de Honduras",
    category: "constitucion",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Constitucion%20de%20la%20Republica%20de%20Honduras.pdf",
    ],
    priority: 1,
    description: "Constitución de la República — norma suprema del ordenamiento jurídico hondureño",
  },
  {
    id: "codigo_civil",
    name: "Código Civil de Honduras",
    category: "codigo",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Codigo%20Civil.pdf",
    ],
    priority: 2,
    description: "Código Civil: personas, bienes, obligaciones, contratos, sucesiones",
  },
  {
    id: "codigo_penal",
    name: "Código Penal de Honduras",
    category: "codigo",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Codigo%20Penal.pdf",
    ],
    priority: 2,
    description: "Código Penal: delitos, penas, medidas de seguridad",
  },
  {
    id: "codigo_procesal_penal",
    name: "Código Procesal Penal de Honduras",
    category: "codigo",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Codigo%20Procesal%20Penal.pdf",
    ],
    priority: 3,
    description: "Código Procesal Penal: procedimiento penal acusatorio",
  },
  {
    id: "codigo_procesal_civil",
    name: "Código Procesal Civil de Honduras",
    category: "codigo",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Codigo%20Procesal%20Civil.pdf",
    ],
    priority: 3,
    description: "Código Procesal Civil: procedimiento civil, oralidad",
  },
  {
    id: "codigo_trabajo",
    name: "Código de Trabajo de Honduras",
    category: "codigo",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Codigo%20de%20Trabajo.pdf",
    ],
    priority: 2,
    description: "Código de Trabajo: relaciones laborales, prestaciones, salarios",
  },
  {
    id: "codigo_comercio",
    name: "Código de Comercio de Honduras",
    category: "codigo",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Codigo%20de%20Comercio.pdf",
    ],
    priority: 3,
    description: "Código de Comercio: actos de comercio, sociedades, títulos valores",
  },
  {
    id: "codigo_familia",
    name: "Código de Familia de Honduras",
    category: "codigo",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Codigo%20de%20Familia.pdf",
    ],
    priority: 3,
    description: "Código de Familia: matrimonio, divorcio, alimentos, filiación",
  },
  {
    id: "ley_contratacion_estado",
    name: "Ley de Contratación del Estado",
    category: "ley",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Ley%20de%20Contratacion%20del%20Estado.pdf",
    ],
    priority: 4,
    description: "Ley de Contratación del Estado: licitaciones, contratos públicos",
  },
  {
    id: "ley_notariado",
    name: "Ley del Notariado de Honduras",
    category: "ley",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Ley%20del%20Notariado.pdf",
    ],
    priority: 4,
    description: "Ley del Notariado: función notarial, protocolo, instrumentos públicos",
  },
  {
    id: "ley_propiedad",
    name: "Ley de la Propiedad de Honduras",
    category: "ley",
    urls: [
      "https://www.poderjudicial.gob.hn/Documentos/Leyes/Ley%20de%20la%20Propiedad.pdf",
    ],
    priority: 4,
    description: "Ley de la Propiedad: registro de la propiedad, inmuebles, hipotecas",
  },
  {
    id: "reglamento_sar",
    name: "Reglamento de Facturación SAR (Ley de ISV)",
    category: "reglamento",
    urls: [
      "https://www.sar.gob.hn/reglamentos/reglamento-facturacion.pdf",
    ],
    priority: 5,
    description: "Reglamento de Facturación del SAR: facturación electrónica, CAI, ISV",
  },
  {
    id: "ley_isr",
    name: "Ley de Impuesto Sobre la Renta",
    category: "ley",
    urls: [
      "https://www.sefin.gob.hn/wp-content/uploads/leyes/Ley%20ISR.pdf",
    ],
    priority: 5,
    description: "Ley de Impuesto Sobre la Renta: ISR personas naturales y jurídicas",
  },
  {
    id: "codigo_tributario",
    name: "Código Tributario de Honduras",
    category: "codigo",
    urls: [
      "https://www.sefin.gob.hn/wp-content/uploads/leyes/Codigo%20Tributario.pdf",
    ],
    priority: 5,
    description: "Código Tributario: obligaciones fiscales, procedimiento, sanciones",
  },
  {
    id: "tratados_cafta",
    name: "CAFTA-DR — Tratado de Libre Comercio",
    category: "tratado",
    urls: [
      "https://www.sre.gob.hn/tratados/cafta-dr.pdf",
    ],
    priority: 6,
    description: "Tratado de Libre Comercio entre Centroamérica, EE.UU. y República Dominicana",
  },
  {
    id: "tratados_convencion_viena",
    name: "Convención de Viena sobre el Derecho de los Tratados",
    category: "tratado",
    urls: [
      "https://www.sre.gob.hn/tratados/convencion-viena.pdf",
    ],
    priority: 6,
    description: "Convención de Viena: derecho internacional de los tratados",
  },
  {
    id: "jurisprudencia_constitucional",
    name: "Jurisprudencia — Sala de lo Constitucional CSJ",
    category: "jurisprudencia",
    urls: [
      "https://www.poderjudicial.gob.hn/jurisprudencia/constitucional",
    ],
    priority: 7,
    description: "Sentencias de la Sala de lo Constitucional de la Corte Suprema de Justicia",
  },
  {
    id: "jurisprudencia_civil",
    name: "Jurisprudencia — Sala de lo Civil CSJ",
    category: "jurisprudencia",
    urls: [
      "https://www.poderjudicial.gob.hn/jurisprudencia/civil",
    ],
    priority: 7,
    description: "Sentencias de la Sala de lo Civil de la Corte Suprema de Justicia",
  },
  {
    id: "jurisprudencia_penal",
    name: "Jurisprudencia — Sala de lo Penal CSJ",
    category: "jurisprudencia",
    urls: [
      "https://www.poderjudicial.gob.hn/jurisprudencia/penal",
    ],
    priority: 7,
    description: "Sentencias de la Sala de lo Penal de la Corte Suprema de Justicia",
  },
  {
    id: "jurisprudencia_laboral",
    name: "Jurisprudencia — Sala de lo Laboral CSJ",
    category: "jurisprudencia",
    urls: [
      "https://www.poderjudicial.gob.hn/jurisprudencia/laboral",
    ],
    priority: 7,
    description: "Sentencias de la Sala de lo Laboral de la Corte Suprema de Justicia",
  },
];

export function getSourcesByCategory(category: string): LegalSource[] {
  return LEGAL_SOURCES.filter((s) => s.category === category);
}

export function getSourceById(id: string): LegalSource | undefined {
  return LEGAL_SOURCES.find((s) => s.id === id);
}

export function getHighPrioritySources(minPriority: number = 4): LegalSource[] {
  return LEGAL_SOURCES.filter((s) => s.priority <= minPriority);
}
