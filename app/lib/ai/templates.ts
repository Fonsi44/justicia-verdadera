export interface LegalTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  estructura: string[];
  materias: string[];
  basePrompt: string;
}

export const TEMPLATES: LegalTemplate[] = [
  {
    id: "demanda-civil-ordinaria",
    type: "demanda", name: "Demanda Civil Ordinaria",
    description: "Demanda ordinaria para reclamación de derechos civiles, incumplimientos contractuales y responsabilidad civil",
    estructura: ["Encabezamiento (juzgado, partes)", "Hechos numerados", "Fundamentos de derecho", "Cuanto pide", "Acompañamientos", "Lugar, fecha y firma"],
    materias: ["civil", "mercantil"],
    basePrompt: "Eres un abogado litigante hondureño. Redacta una demanda civil ordinaria completa con los datos del caso proporcionados. Incluye los fundamentos de derecho del Código Civil hondureño aplicables."
  },
  {
    id: "demanda-penal-querella",
    type: "demanda", name: "Querella Penal",
    description: "Querella para iniciar proceso penal por delitos de acción privada o pública",
    estructura: ["Juzgado competente", "Datos del querellante", "Datos del querellado", "Relación detallada de hechos delictivos", "Calificación jurídica", "Medios de prueba", "Solicitud de apertura"],
    materias: ["penal"],
    basePrompt: "Eres un abogado penalista hondureño. Redacta una querella penal detallando los hechos constitutivos de delito, con citas del Código Penal hondureño."
  },
  {
    id: "demanda-laboral",
    type: "demanda", name: "Demanda Laboral por Despido Injustificado",
    description: "Reclamación de prestaciones e indemnización por despido injustificado",
    estructura: ["Juzgado de Letras de Trabajo", "Datos del trabajador", "Datos del patrono", "Hechos (fecha ingreso, salario, despido)", "Cálculo de prestaciones", "Fundamentos legales", "Petitorio"],
    materias: ["laboral"],
    basePrompt: "Eres un abogado laboralista hondureño. Redacta una demanda por despido injustificado conforme al Código de Trabajo de Honduras, incluyendo cálculo detallado de prestaciones."
  },
  {
    id: "demanda-familia-alimentos",
    type: "demanda", name: "Demanda de Alimentos",
    description: "Reclamación de pensión alimenticia para hijos o cónyuge",
    estructura: ["Juzgado de Familia", "Datos del demandante", "Datos del demandado", "Hechos (necesidad del alimentario, capacidad del obligado)", "Fundamentos del Código de Familia", "Ofrecimiento de pruebas", "Solicitud de cuota provisional"],
    materias: ["familia"],
    basePrompt: "Eres un abogado de derecho de familia hondureño. Redacta una demanda de alimentos con base en el Código de Familia."
  },
  {
    id: "demanda-familia-divorcio",
    type: "demanda", name: "Demanda de Divorcio",
    description: "Solicitud de divorcio voluntario o necesario (con o sin causa)",
    estructura: ["Juzgado de Familia", "Datos de los cónyuges", "Hijos (filiación, edad)", "Bienes de la sociedad conyugal", "Causa del divorcio (si aplica)", "Propuesta de convenio regulador", "Pruebas documentales"],
    materias: ["familia"],
    basePrompt: "Eres un abogado de derecho de familia. Redacta una demanda de divorcio, ya sea voluntario o necesario, ajustada al Código de Familia hondureño."
  },
  {
    id: "demanda-mercantil-ejecutiva",
    type: "demanda", name: "Demanda Ejecutiva Mercantil",
    description: "Cobro judicial de títulos valores, facturas y documentos mercantiles",
    estructura: ["Juzgado de Letras Mercantil", "Datos del ejecutante y ejecutado", "Título ejecutivo (pagaré, factura, cheque)", "Origen de la obligación", "Liquidación", "Solicitud de embargo", "Medidas cautelares"],
    materias: ["mercantil"],
    basePrompt: "Eres un abogado mercantilista hondureño. Redacta una demanda ejecutiva mercantil basada en título ejecutivo."
  },
  {
    id: "demanda-contencioso-administrativo",
    type: "demanda", name: "Demanda Contencioso Administrativa",
    description: "Impugnación de actos administrativos de la administración pública",
    estructura: ["Sala de lo Contencioso Administrativo", "Datos del demandante", "Acto administrativo impugnado", "Hechos en que se funda", "Infracciones legales", "Pretensión anulatoria", "Medidas cautelares"],
    materias: ["contencioso"],
    basePrompt: "Eres un abogado especialista en derecho administrativo hondureño. Redacta una demanda contencioso administrativa."
  },
  {
    id: "contestacion-civil",
    type: "contestacion", name: "Contestación de Demanda Civil",
    description: "Respuesta a demanda civil con excepciones y defensas",
    estructura: ["Juzgado que conoce", "Datos del demandado", "Excepciones previas (si aplican)", "Contradicción de hechos", "Fundamentos de defensa", "Ofrecimiento de pruebas", "Solicitud de absolución"],
    materias: ["civil"],
    basePrompt: "Eres un abogado defensor en materia civil. Redacta una contestación de demanda con excepciones perentorias."
  },
  {
    id: "contestacion-penal",
    type: "contestacion", name: "Escrito de Defensa Penal",
    description: "Contestación a requerimiento fiscal, auto de procesamiento o acusación",
    estructura: ["Juzgado competente", "Datos del imputado y defensor", "Hechos imputados", "Contradicción expresa", "Argumentos de descargo", "Pruebas de defensa", "Solicitud de sobreseimiento"],
    materias: ["penal"],
    basePrompt: "Eres un abogado penalista de defensa. Redacta un escrito de defensa penal rebatiendo los hechos imputados."
  },
  {
    id: "contestacion-laboral",
    type: "contestacion", name: "Contestación de Demanda Laboral",
    description: "Defensa del patrono ante demanda laboral",
    estructura: ["Juzgado de Trabajo", "Datos del patrono", "Contradicción de hechos", "Justificación del despido (si aplica)", "Pruebas documentales", "Cálculo alternativo de prestaciones si procede"],
    materias: ["laboral"],
    basePrompt: "Eres un abogado laboralista de defensa. Redacta contestación de demanda laboral justificando el despido."
  },
  {
    id: "recurso-apelacion-civil",
    type: "recurso", name: "Recurso de Apelación (Sentencia Civil)",
    description: "Apelación contra sentencia civil ante el Tribunal de Apelaciones",
    estructura: ["Juzgado que dictó sentencia", "Tribunal de Apelaciones competente", "Sentencia recurrida", "Agravios que causa", "Fundamentos jurídicos", "Petitorio revocatorio"],
    materias: ["civil", "mercantil"],
    basePrompt: "Eres un abogado litigante. Redacta un recurso de apelación contra sentencia civil desfavorable."
  },
  {
    id: "recurso-casacion",
    type: "recurso", name: "Recurso de Casación",
    description: "Recurso extraordinario de casación ante la Corte Suprema de Justicia",
    estructura: ["Tribunal que dictó sentencia", "Sala de lo Civil/Penal/Laboral CSJ", "Sentencia recurrida", "Motivo de casación (infracción de ley, quebrantamiento de forma)", "Fundamentos", "Preceptos autorizantes"],
    materias: ["civil", "penal", "laboral"],
    basePrompt: "Eres un abogado especialista en casación. Redacta un recurso de casación invocando motivos de fondo y forma."
  },
  {
    id: "recurso-amparo",
    type: "recurso", name: "Recurso de Amparo",
    description: "Acción constitucional contra actos que vulneren derechos fundamentales",
    estructura: ["Sala de lo Constitucional CSJ", "Datos del agraviado", "Autoridad recurrida", "Acto reclamado", "Derecho constitucional vulnerado", "Hechos", "Solicitud de amparo provisional"],
    materias: ["constitucional"],
    basePrompt: "Eres un abogado constitucionalista. Redacta un recurso de amparo por violación de derechos constitucionales."
  },
  {
    id: "recurso-revision",
    type: "recurso", name: "Recurso de Revisión",
    description: "Solicitud de revisión de sentencia firme por hechos nuevos o prueba sobreviniente",
    estructura: ["Tribunal que dictó sentencia", "Causas de revisión (art. 403 CPP / 189 CPC)", "Hechos nuevos", "Prueba documental", "Solicitud de nulidad o revocación"],
    materias: ["civil", "penal"],
    basePrompt: "Eres un abogado litigante. Redacta un recurso de revisión contra sentencia firme por hechos nuevos."
  },
  {
    id: "recurso-queja",
    type: "recurso", name: "Recurso de Queja",
    description: "Reclamación contra denegación de recurso por parte del tribunal inferior",
    estructura: ["Superior jerárquico", "Recurso denegado", "Auto de inadmisión recurrido", "Argumentos de procedencia", "Solicitud de admisión"],
    materias: ["civil", "penal"],
    basePrompt: "Eres un abogado litigante. Redacta un recurso de queja por denegación injustificada de recurso."
  },
  {
    id: "contrato-servicios-profesionales",
    type: "contrato", name: "Contrato de Servicios Profesionales",
    description: "Prestación de servicios profesionales de abogados, contadores o consultores",
    estructura: ["Comparecencia", "Antecedentes", "Objeto del contrato", "Honorarios y forma de pago", "Obligaciones de las partes", "Duración", "Terminación", "Confidencialidad", "Jurisdicción y domicilio"],
    materias: ["civil"],
    basePrompt: "Eres abogado corporativo hondureño. Redacta un contrato de servicios profesionales ajustado al Código Civil."
  },
  {
    id: "contrato-honorarios-exito",
    type: "contrato", name: "Contrato de Honorarios de Éxito (Cuota Litis)",
    description: "Acuerdo de honorarios contingentes para casos judiciales",
    estructura: ["Partes", "Caso objeto del acuerdo", "Porcentaje de honorarios de éxito", "Gastos del litigio", "Forma de pago", "Causas de terminación", "Liquidación de honorarios"],
    materias: ["civil"],
    basePrompt: "Eres abogado hondureño. Redacta un contrato de cuota litis conforme a las normas de honorarios profesionales."
  },
  {
    id: "contrato-arrendamiento",
    type: "contrato", name: "Contrato de Arrendamiento de Inmueble",
    description: "Arrendamiento de bien inmueble para vivienda, local comercial u oficina",
    estructura: ["Partes", "Descripción del inmueble", "Plazo", "Canon de arrendamiento", "Depósito en garantía", "Obligaciones del arrendador", "Obligaciones del arrendatario", "Subarriendo", "Terminación"],
    materias: ["civil"],
    basePrompt: "Eres abogado hondureño. Redacta un contrato de arrendamiento de inmueble conforme al Código Civil."
  },
  {
    id: "contrato-compraventa-inmueble",
    type: "contrato", name: "Contrato de Compraventa de Inmueble",
    description: "Promesa de compraventa o compraventa definitiva de bien raíz",
    estructura: ["Partes", "Identificación del inmueble (registro)", "Precio y forma de pago", "Arrás o señal", "Plazo para escrituración", "Gastos de traslación de dominio", "Tradición de la posesión"],
    materias: ["civil"],
    basePrompt: "Eres abogado notario hondureño. Redacta un contrato de compraventa de inmueble conforme a la Ley de la Propiedad."
  },
  {
    id: "poder-general",
    type: "poder", name: "Poder General de Representación",
    description: "Poder general para actos de administración, pleitos y cobranzas",
    estructura: ["Comparecencia del poderdante", "Facultades otorgadas (cláusulas)", "Administración de bienes", "Representación judicial", "Actos de dominio (si se incluyen)", "Plazo", "Revocación"],
    materias: ["civil"],
    basePrompt: "Eres un notario hondureño. Redacta un poder general de representación con cláusulas de administración y litigio."
  },
  {
    id: "poder-especial",
    type: "poder", name: "Poder Especial para Litigio",
    description: "Poder especial para representación en un proceso judicial específico",
    estructura: ["Comparecencia", "Identificación del caso", "Facultades procesales", "Nombramiento de abogados", "Sustitución", "Limitaciones"],
    materias: ["civil", "penal"],
    basePrompt: "Eres un notario hondureño. Redacta un poder especial para representación judicial con facultades limitadas."
  },
  {
    id: "poder-notarial",
    type: "poder", name: "Poder Notarial General",
    description: "Poder otorgado ante notario para toda clase de asuntos",
    estructura: ["Comparecencia", "Datos del apoderado", "Facultades generales", "Facultades especiales (si aplican)", "Causas de revocación", "Aceptación del apoderado"],
    materias: ["civil"],
    basePrompt: "Eres un notario hondureño. Redacta un poder notarial general, apto para presentación en registros públicos."
  },
  {
    id: "escrito-ofrecimiento-pruebas",
    type: "escrito", name: "Escrito de Ofrecimiento de Pruebas",
    description: "Ofrecimiento de medios probatorios en proceso civil o penal",
    estructura: ["Juzgado", "Caso o expediente", "Prueba documental", "Prueba testimonial", "Prueba pericial", "Reconocimiento judicial", "Reproducción de documentos"],
    materias: ["civil", "penal", "laboral"],
    basePrompt: "Eres un abogado litigante hondureño. Redacta un escrito de ofrecimiento de pruebas detallando cada medio."
  },
  {
    id: "escrito-desistimiento",
    type: "escrito", name: "Escrito de Desistimiento",
    description: "Desistimiento de la acción, del procedimiento o de la instancia",
    estructura: ["Juzgado", "Caso", "Manifestación de desistimiento", "Alcance (acción, instancia, derecho)", "Costas", "Solicitud de archivo"],
    materias: ["civil", "penal", "laboral"],
    basePrompt: "Eres un abogado litigante. Redacta un escrito de desistimiento de la acción procesal."
  },
  {
    id: "escrito-conciliacion",
    type: "escrito", name: "Escrito de Solicitud de Conciliación",
    description: "Solicitud de conciliación previa al proceso judicial (medios alternos)",
    estructura: ["Centro de Medios Alternos", "Partes", "Objeto de la conciliación", "Hechos", "Propuesta de acuerdo", "Documentos anexos"],
    materias: ["civil", "familia", "laboral"],
    basePrompt: "Eres un abogado hondureño. Redacta una solicitud de conciliación para resolver extrajudicialmente un conflicto."
  },
  {
    id: "escrito-oposicion-medidas-cautelares",
    type: "escrito", name: "Escrito de Oposición a Medidas Cautelares",
    description: "Oposición al embargo, secuestro u otras medidas cautelares decretadas",
    estructura: ["Juzgado", "Medida cautelar recurrida", "Hechos que justifican la oposición", "Garantía sustitutoria (si aplica)", "Fundamentos legales", "Solicitud de levantamiento"],
    materias: ["civil", "mercantil"],
    basePrompt: "Eres abogado litigante. Redacta escrito de oposición a medidas cautelares."
  },
  {
    id: "escrito-prueba-pericial",
    type: "escrito", name: "Solicitud de Prueba Pericial",
    description: "Solicitud de designación de perito para dictamen técnico en proceso judicial",
    estructura: ["Juzgado", "Hechos objeto del peritaje", "Especialidad del perito", "Puntos de pericia", "Disponibilidad para nombrar perito", "Aceptación del cargo"],
    materias: ["civil", "penal"],
    basePrompt: "Eres abogado litigante. Redacta solicitud de prueba pericial detallando los puntos de pericia."
  },
  {
    id: "informe-legal-asesoria",
    type: "informe", name: "Informe Legal de Asesoría",
    description: "Opinión legal o dictamen jurídico para cliente sobre caso concreto",
    estructura: ["Para", "De", "Fecha", "Asunto", "Antecedentes del caso", "Análisis jurídico", "Normativa aplicable", "Conclusión", "Recomendaciones"],
    materias: ["civil", "penal", "mercantil", "laboral"],
    basePrompt: "Eres un abogado consultor hondureño. Redacta un informe legal completo con análisis de normativa aplicable."
  },
  {
    id: "memorial-simple",
    type: "escrito", name: "Memorial Simple",
    description: "Escrito genérico para comunicaciones procesales al tribunal",
    estructura: ["Juzgado", "Expediente", "Comparecencia", "Solicitud concreta", "Fundamentos", "Acompañamientos", "Firma"],
    materias: ["civil", "penal", "laboral", "familia"],
    basePrompt: "Eres un abogado litigante. Redacta un memorial simple con la solicitud al tribunal."
  },
  {
    id: "contrato-asociacion-servicios",
    type: "contrato", name: "Contrato de Asociación de Servicios Profesionales",
    description: "Acuerdo entre abogados para compartir honorarios y trabajo en un caso",
    estructura: ["Partes", "Caso o asunto", "Distribución de trabajo", "Reparto de honorarios", "Gastos", "Confidencialidad", "Duración", "Solución de controversias"],
    materias: ["civil"],
    basePrompt: "Eres abogado corporativo. Redacta un contrato de asociación profesional para litigio conjunto."
  },
];

export function getTemplatesByType(type?: string): LegalTemplate[] {
  if (!type) return TEMPLATES;
  return TEMPLATES.filter((t) => t.type === type);
}

export function getTemplatesByMateria(materia: string): LegalTemplate[] {
  return TEMPLATES.filter((t) => t.materias.includes(materia));
}

export function getTemplateById(id: string): LegalTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
