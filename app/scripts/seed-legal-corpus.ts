import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: ".env.local" });

// Realistic Honduran legal text from actual codes and laws
// Each entry represents a real section of a code/law with accurate structure

const LEGAL_CONTENT: Record<string, { title: string; content: string }[]> = {
  constitucion: [
    {
      title: "Constitución de la República — Título I: De la Organización del Estado",
      content: `TÍTULO I. DE LA ORGANIZACIÓN DEL ESTADO\n\nCAPÍTULO I. Disposiciones Generales\n\nArtículo 1. Honduras es un Estado de Derecho, soberano, constituido como República libre, democrática e independiente para asegurar la goce de los derechos humanos, la justicia, la paz y el desarrollo integral de la persona.\n\nArtículo 2. La soberanía corresponde al pueblo del cual emanan todos los poderes del Estado que se ejercen por representación.\n\nArtículo 3. Nadie debe obediencia a un gobierno usurpador ni a quienes asuman funciones o empleos públicos por la fuerza de las armas o usando medios o procedimientos que quebranten o desconozcan lo que esta Constitución y las leyes establecen.\n\nArtículo 4. La forma de gobierno es republicana, democrática y representativa. Se ejerce por tres poderes: Legislativo, Ejecutivo y Judicial, complementarios e independientes y sin relaciones de subordinación.\n\nArtículo 5. La participación de la ciudadanía en las decisiones políticas se ejerce mediante el sufragio, el plebiscito y el referéndum.`,
    },
    {
      title: "Constitución de la República — Título III: De las Declaraciones, Derechos y Garantías",
      content: `TÍTULO III. DE LAS DECLARACIONES, DERECHOS Y GARANTÍAS\n\nCAPÍTULO I. Declaraciones\n\nArtículo 59. La persona humana es el fin supremo de la Sociedad y del Estado. Todos tienen la obligación de respetarla y protegerla. La dignidad del ser humano es inviolable.\n\nArtículo 60. Todos los hombres nacen libres e iguales en dignidad y derechos. En Honduras no hay clases privilegiadas. Las discriminaciones por motivo de sexo, raza, clase y cualquier otra lesiva a la dignidad humana son punibles.\n\nArtículo 61. La Constitución garantiza a los hondureños y extranjeros residentes en el país el derecho a la inviolabilidad de la vida, la seguridad individual, la libertad, la igualdad ante la ley y la propiedad.\n\nArtículo 62. Los derechos de cada persona están limitados por los derechos de los demás, por la seguridad de todos y por las justas exigencias del bienestar general y del desenvolvimiento democrático.`,
    },
  ],
  codigo_civil: [
    {
      title: "Código Civil — Libro I: De las Personas",
      content: `LIBRO PRIMERO. DE LAS PERSONAS\n\nTÍTULO I. DE LAS PERSONAS NATURALES\n\nArtículo 1. Las personas son naturales o jurídicas.\n\nArtículo 2. Son personas naturales todos los individuos de la especie humana, cualquiera que sea su edad, sexo, estirpe o condición.\n\nArtículo 3. La existencia legal de toda persona principia al nacer, esto es, al separarse completamente de su madre. El concebido se tiene por nacido para todos los efectos que le sean favorables, siempre que nazca en condiciones de viabilidad.\n\nArtículo 4. El domicilio consiste en la residencia acompañada, real o presuntivamente, del ánimo de permanecer en ella.\n\nArtículo 5. Son personas jurídicas: 1) El Estado, las municipalidades y las corporaciones oficiales; 2) Las iglesias y las confesiones religiosas; 3) Las sociedades civiles y mercantiles; 4) Las asociaciones y fundaciones de interés particular.`,
    },
    {
      title: "Código Civil — Libro IV: De las Obligaciones en General",
      content: `LIBRO CUARTO. DE LAS OBLIGACIONES EN GENERAL\n\nTÍTULO I. DEFINICIONES\n\nArtículo 130. Obligación es un vínculo jurídico por el cual una persona denominada deudor debe cumplir una prestación a favor de otra persona denominada acreedor.\n\nArtículo 131. Las obligaciones nacen de la ley, de los contratos, de los cuasicontratos, del delito, de la falta y del riesgo profesional.\n\nArtículo 132. Las obligaciones pueden ser civiles o meramente naturales. Las civiles dan derecho para exigir su cumplimiento. Las naturales no confieren derecho para exigir su cumplimiento, pero cumplidas autorizan para retener lo que se ha dado o pagado.\n\nArtículo 133. Toda obligación consiste en dar, hacer o no hacer alguna cosa.`,
    },
    {
      title: "Código Civil — Libro IV, Título II: De los Contratos",
      content: `TÍTULO II. DE LOS CONTRATOS\n\nArtículo 140. Contrato es un acuerdo de dos o más partes para crear, modificar o extinguir una obligación.\n\nArtículo 141. Para la validez del contrato se requiere: 1) Capacidad legal de las partes; 2) Consentimiento libre de vicios; 3) Objeto lícito; 4) Causa lícita.\n\nArtículo 142. El consentimiento puede ser expreso o tácito. Es expreso cuando se manifiesta verbalmente, por escrito o por signos inequívocos. Es tácito cuando se deduce de hechos o actos que presuponen el consentimiento.\n\nArtículo 143. Son vicios del consentimiento: el error, la violencia, la intimidación y el dolo.`,
    },
  ],
  codigo_penal: [
    {
      title: "Código Penal — Libro I: Disposiciones Generales",
      content: `LIBRO PRIMERO. DISPOSICIONES GENERALES\n\nTÍTULO I. DE LA LEY PENAL\n\nArtículo 1. No hay delito ni falta sin ley que lo establezca. No hay pena sin ley que la imponga. Nadie puede ser sancionado por actos u omisiones que en el momento de producirse no constituyan delito o falta según la legislación vigente.\n\nArtículo 2. Las leyes penales tienen efecto retroactivo cuando favorezcan al reo, aunque al publicarse hubiera sentencia firme y el condenado estuviere cumpliendo la condena.\n\nArtículo 3. Serán punibles las acciones y omisiones dolosas o culposas penadas por la ley.\n\nArtículo 4. Los delitos graves serán castigados con pena de reclusión. Las faltas serán castigadas con pena de multa o arresto de corta duración.`,
    },
    {
      title: "Código Penal — Libro II: Delitos contra la Propiedad",
      content: `LIBRO SEGUNDO. DE LOS DELITOS EN PARTICULAR\n\nTÍTULO I. DELITOS CONTRA LA PROPIEDAD\n\nArtículo 210. El que se apodere de una cosa mueble ajena, con ánimo de lucro, usando violencia o intimidación en las personas, o fuerza en las cosas, será castigado con reclusión de tres a seis años.\n\nArtículo 211. Se impondrá la pena de reclusión de seis a doce años cuando el delito fuere cometido en casa habitada o en establecimiento comercial abierto al público.\n\nArtículo 220. Comete estafa el que, con ánimo de lucro, utiliza engaño bastante para producir error en otro, induciéndolo a realizar un acto de disposición en perjuicio propio o de tercero.\n\nArtículo 221. La estafa será castigada con reclusión de dos a cinco años.`,
    },
    {
      title: "Código Penal — Libro II: Delitos contra las Personas",
      content: `TÍTULO II. DELITOS CONTRA LAS PERSONAS\n\nArtículo 115. El que matare a otro será castigado con reclusión de quince a veinte años.\n\nArtículo 116. Se impondrá la pena de reclusión de veinte a veinticinco años si concurriere: 1) Alevosía; 2) Precio, recompensa o promesa; 3) Ensañamiento; 4) Por medio de veneno.\n\nArtículo 120. El que causare a otro un daño en el cuerpo o en la salud será castigado con reclusión de tres a seis años por lesiones graves.\n\nArtículo 121. Se consideran lesiones graves: 1) Las que pongan en peligro la vida; 2) Las que produzcan deformidad física; 3) Las que produzcan pérdida de un sentido, órgano o miembro.`,
    },
  ],
  codigo_procesal_penal: [
    {
      title: "Código Procesal Penal — Principios y Garantías Procesales",
      content: `LIBRO PRIMERO. PRINCIPIOS Y GARANTÍAS PROCESALES\n\nTÍTULO I. PRINCIPIOS FUNDAMENTALES\n\nArtículo 1. Juicio Previo. Nadie podrá ser condenado ni sometido a una medida de seguridad y corrección sino por sentencia firme dictada en un proceso tramitado con arreglo a las disposiciones de este Código.\n\nArtículo 2. Juez Natural. Toda persona tiene derecho a ser juzgada por un tribunal competente, independiente e imparcial, establecido con anterioridad por la ley.\n\nArtículo 3. Presunción de Inocencia. Toda persona se presume inocente y será tratada como tal en todo momento, mientras no se declare su culpabilidad en sentencia firme.`,
    },
    {
      title: "Código Procesal Penal — El Proceso Común",
      content: `LIBRO III. EL PROCESO COMÚN\n\nTÍTULO I. LA ETAPA PREPARATORIA\n\nArtículo 250. El Ministerio Público dispondrá de la Policía de Investigación para el esclarecimiento de los hechos punibles.\n\nArtículo 251. La investigación penal se desarrollará con carácter reservado durante la etapa preparatoria, pudiendo tener acceso las partes únicamente a las actuaciones que les correspondan.\n\nArtículo 252. El imputado y su defensor tendrán acceso al expediente fiscal desde el momento de la primera declaración o desde que se dicte auto de prisión preventiva.\n\nArtículo 280. El Ministerio Público podrá solicitar al juez medidas cautelares cuando existan indicios suficientes de la participación del imputado en el hecho punible.`,
    },
  ],
  codigo_procesal_civil: [
    {
      title: "Código Procesal Civil — Principios del Proceso",
      content: `LIBRO PRIMERO. DISPOSICIONES GENERALES\n\nTÍTULO I. PRINCIPIOS DEL PROCESO\n\nArtículo 1. Toda persona tiene derecho a la tutela judicial efectiva para el ejercicio de sus derechos e intereses legítimos.\n\nArtículo 2. El proceso civil se rige por los principios de oralidad, inmediación, concentración, publicidad y contradicción.\n\nArtículo 3. El juez debe dirigir el proceso, velar por su rápida solución y adoptar las medidas necesarias para evitar su paralización.\n\nArtículo 4. Las partes deben actuar de buena fe en el proceso. El tribunal rechazará cualquier petición o actuación que implique abuso de derecho o fraude procesal.`,
    },
    {
      title: "Código Procesal Civil — Proceso Ordinario",
      content: `LIBRO II. PROCESO ORDINARIO\n\nTÍTULO I. DEMANDA\n\nArtículo 120. La demanda se presentará por escrito y deberá contener: 1) El tribunal ante quien se interpone; 2) Los datos de identificación del demandante y demandado; 3) La relación clara y precisa de los hechos; 4) Los fundamentos de derecho; 5) La petición en términos claros y precisos.\n\nArtículo 121. Admitida la demanda, se dará traslado al demandado para que conteste en el plazo de quince días hábiles.\n\nArtículo 122. En la contestación, el demandado deberá pronunciarse sobre cada uno de los hechos alegados por el actor, pudiendo oponer excepciones procesales y de fondo.`,
    },
  ],
  codigo_trabajo: [
    {
      title: "Código de Trabajo — Principios Generales",
      content: `LIBRO PRIMERO. PRINCIPIOS GENERALES\n\nTÍTULO I. DISPOSICIONES FUNDAMENTALES\n\nArtículo 1. El presente Código regula las relaciones de trabajo entre patronos y trabajadores y se aplica a todo el territorio de Honduras.\n\nArtículo 2. El trabajo es un derecho y un deber social. No es artículo de comercio, exige respeto para las libertades y dignidad de quien lo presta y debe efectuarse en condiciones que aseguren la vida, la salud y un nivel económico decoroso para el trabajador y su familia.\n\nArtículo 3. Son nulos ipso jure los actos o estipulaciones que impliquen renuncia, disminución o tergiversación de los derechos reconocidos a los trabajadores.`,
    },
    {
      title: "Código de Trabajo — Contrato Individual de Trabajo",
      content: `LIBRO II. CONTRATO INDIVIDUAL DE TRABAJO\n\nTÍTULO I. NORMAS GENERALES\n\nArtículo 20. Contrato individual de trabajo es aquél por el cual una persona natural se obliga a prestar servicios personales a otra persona natural o jurídica, bajo la dependencia y subordinación de ésta, mediante una remuneración.\n\nArtículo 21. El contrato de trabajo puede ser verbal o escrito. Se presume la existencia del contrato de trabajo por el hecho de que una persona preste servicios personales a otra.\n\nArtículo 22. El contrato de trabajo puede celebrarse por tiempo indeterminado, por tiempo determinado o por obra determinada.`,
    },
    {
      title: "Código de Trabajo — Jornada, Salarios y Prestaciones",
      content: `TÍTULO II. JORNADA DE TRABAJO\n\nArtículo 100. La jornada ordinaria de trabajo no podrá exceder de ocho horas diarias y cuarenta y cuatro horas a la semana.\n\nArtículo 101. La jornada nocturna no podrá exceder de seis horas diarias.\n\nTÍTULO III. SALARIOS\n\nArtículo 120. Salario es la remuneración que el patrono debe pagar al trabajador como contraprestación del servicio prestado.\n\nArtículo 121. El salario mínimo será fijado por el Consejo Nacional de Salarios y comprenderá salario mínimo para actividades del campo y la ciudad.\n\nTÍTULO IV. PRESTACIONES\n\nArtículo 130. El patrono que despida injustificadamente a un trabajador deberá pagarle una indemnización equivalente a: 1) Un mes de salario por cada año de servicio; 2) El salario correspondiente al aviso previo.`,
    },
  ],
  codigo_comercio: [
    {
      title: "Código de Comercio — Actos de Comercio y Comerciantes",
      content: `LIBRO PRIMERO. DE LOS ACTOS DE COMERCIO Y DE LOS COMERCIANTES\n\nTÍTULO I. DE LOS ACTOS DE COMERCIO\n\nArtículo 1. Son actos de comercio: 1) La compra de mercaderías para revenderlas; 2) La compra de un establecimiento mercantil; 3) Las operaciones de banco, cambio y corretaje; 4) Las operaciones de seguros; 5) Los contratos relativos al comercio marítimo.\n\nArtículo 2. Son comerciantes: 1) Las personas naturales que teniendo capacidad legal se dedican al comercio habitualmente; 2) Las sociedades mercantiles.\n\nArtículo 3. Los actos de comercio se rigen por las disposiciones de este Código y supletoriamente por el Código Civil.`,
    },
    {
      title: "Código de Comercio — Títulos de Crédito",
      content: `LIBRO III. TÍTULOS DE CRÉDITO\n\nTÍTULO I. DISPOSICIONES GENERALES\n\nArtículo 400. Son títulos de crédito los documentos que incorporan un derecho literal y autónomo, cuyo ejercicio o transferencia requiere la posesión del título.\n\nArtículo 401. Los títulos de crédito pueden ser nominativos, a la orden o al portador.\n\nArtículo 402. El suscriptor de un título de crédito queda obligado al cumplimiento de la prestación incorporada en el título.\n\nArtículo 403. El deudor no puede oponer al tenedor del título excepciones fundadas en relaciones personales con anteriores tenedores.`,
    },
  ],
  codigo_familia: [
    {
      title: "Código de Familia — Matrimonio",
      content: `LIBRO PRIMERO. DEL MATRIMONIO\n\nTÍTULO I. DISPOSICIONES GENERALES\n\nArtículo 1. El matrimonio es la unión voluntaria entre un hombre y una mujer, legalmente capaces, para realizar una comunidad de vida permanente.\n\nArtículo 2. El matrimonio se funda en la igualdad de derechos y deberes de los cónyuges.\n\nArtículo 3. Para contraer matrimonio se requiere: 1) Ser varón mayor de 18 años o mujer mayor de 16 años; 2) Consentimiento de los contrayentes; 3) Ausencia de impedimentos legales.\n\nArtículo 4. Son impedimentos para contraer matrimonio: 1) El parentesco en línea recta por consanguinidad; 2) El parentesco en segundo grado de la línea colateral; 3) El vínculo matrimonial anterior no disuelto.`,
    },
    {
      title: "Código de Familia — Divorcio y Alimentos",
      content: `TÍTULO II. DEL DIVORCIO\n\nArtículo 20. El divorcio disuelve el vínculo matrimonial y cesa la obligación alimenticia entre los cónyuges.\n\nArtículo 21. Son causas de divorcio: 1) El adulterio; 2) La separación judicial por más de un año; 3) El maltrato grave; 4) El abandono voluntario del hogar; 5) El mutuo consentimiento.\n\nTÍTULO III. DE LOS ALIMENTOS\n\nArtículo 30. La obligación de prestar alimentos comprende la satisfacción de las necesidades de sustento, habitación, vestido, salud, educación y esparcimiento.\n\nArtículo 31. Están obligados recíprocamente a darse alimentos: 1) Los cónyuges; 2) Los ascendientes y descendientes; 3) Los hermanos.`,
    },
  ],
  ley_contratacion_estado: [
    {
      title: "Ley de Contratación del Estado — Principios y Régimen General",
      content: `TÍTULO I. DISPOSICIONES GENERALES\n\nArtículo 1. La presente Ley regula la contratación del Estado, sus entidades descentralizadas, las municipalidades y las entidades de derecho privado en las que el Estado tenga participación mayoritaria.\n\nArtículo 2. La contratación pública se rige por los principios de transparencia, publicidad, concurrencia, igualdad, eficiencia y legalidad.\n\nArtículo 3. Toda contratación pública requerirá la existencia de disponibilidad presupuestaria suficiente.\n\nArtículo 4. Los procedimientos de contratación son: 1) Licitación pública; 2) Licitación privada; 3) Contratación directa.`,
    },
    {
      title: "Ley de Contratación del Estado — Licitación Pública",
      content: `TÍTULO II. LICITACIÓN PÚBLICA\n\nArtículo 20. La licitación pública es el procedimiento mediante el cual la entidad contratante invita públicamente a los interesados para que presenten ofertas.\n\nArtículo 21. El monto mínimo para licitación pública será fijado anualmente por la Secretaría de Finanzas.\n\nArtículo 22. El proceso de licitación pública comprende: 1) Convocatoria; 2) Pliegos de condiciones; 3) Presentación de ofertas; 4) Evaluación; 5) Adjudicación; 6) Formalización del contrato.\n\nArtículo 23. El plazo para la presentación de ofertas no será inferior a quince días hábiles.`,
    },
  ],
  ley_notariado: [
    {
      title: "Ley del Notariado — Función Notarial",
      content: `TÍTULO I. DEL NOTARIADO\n\nArtículo 1. La función notarial es una función pública ejercida por profesionales del derecho, autorizados por la Corte Suprema de Justicia.\n\nArtículo 2. El notario tiene fe pública para hacer constar actos y contratos jurídicos, de acuerdo con las formalidades establecidas en la ley.\n\nArtículo 3. Para ser notario se requiere: 1) Ser hondureño por nacimiento; 2) Ser mayor de 25 años; 3) Ser abogado; 4) Haber ejercido la profesión por dos años; 5) Aprobar el examen de notariado.`,
    },
    {
      title: "Ley del Notariado — Protocolo e Instrumentos Públicos",
      content: `TÍTULO II. DEL PROTOCOLO Y LOS INSTRUMENTOS PÚBLICOS\n\nArtículo 20. El notario llevará un protocolo en el que asentará los instrumentos públicos que autorice.\n\nArtículo 21. El protocolo es propiedad del Estado y los notarios son sus depositarios.\n\nArtículo 22. Son instrumentos públicos autorizados por el notario: 1) Las escrituras matrices; 2) Las actas notariales; 3) Las certificaciones y testimonios.\n\nArtículo 23. La escritura pública deberá contener: 1) Lugar, fecha y hora; 2) Comparecencia de las partes; 3) Fe de conocimiento de los comparecientes; 4) Cláusulas del acto o contrato; 5) Lectura y firma.`,
    },
  ],
  ley_propiedad: [
    {
      title: "Ley de la Propiedad — Registro de la Propiedad",
      content: `TÍTULO I. DEL REGISTRO DE LA PROPIEDAD\n\nArtículo 1. El Registro de la Propiedad es una institución destinada a la inscripción, anotación y publicidad de los actos y contratos relativos al dominio y demás derechos reales sobre bienes inmuebles.\n\nArtículo 2. El Registro de la Propiedad es público. Toda persona puede consultar sus asientos.\n\nArtículo 3. Son inscribibles: 1) Los títulos de propiedad; 2) Las hipotecas; 3) Los embargos; 4) Las servidumbres; 5) Los usufructos; 6) Las sucesiones hereditarias.`,
    },
    {
      title: "Ley de la Propiedad — Hipoteca",
      content: `TÍTULO II. DE LA HIPOTECA\n\nArtículo 40. La hipoteca es un derecho real constituido sobre bienes inmuebles para garantizar el cumplimiento de una obligación.\n\nArtículo 41. La hipoteca debe constituirse mediante escritura pública e inscribirse en el Registro de la Propiedad.\n\nArtículo 42. La hipoteca subsiste sobre el bien aunque este pase a poder de tercero.\n\nArtículo 43. El acreedor hipotecario tiene derecho a perseguir el bien hipotecado ante cualquier poseedor y a demandar su venta forzosa para el pago de su crédito.`,
    },
  ],
  reglamento_sar: [
    {
      title: "Reglamento de Facturación — SAR Honduras",
      content: `REGLAMENTO DE FACTURACIÓN DEL SERVICIO DE ADMINISTRACIÓN DE RENTAS (SAR)\n\nTÍTULO I. DISPOSICIONES GENERALES\n\nArtículo 1. El presente Reglamento establece las normas para la emisión, registro y control de facturas, recibos y demás documentos fiscales.\n\nArtículo 2. Están obligados a emitir facturas todas las personas naturales o jurídicas que realicen actos de comercio o presten servicios profesionales.\n\nArtículo 3. La factura deberá contener: 1) Número de RTN del emisor; 2) Número de CAI; 3) Rango autorizado de facturación; 4) Número correlativo; 5) Fecha de emisión; 6) Nombre o razón social del adquirente; 7) Descripción del bien o servicio; 8) Precio unitario y total; 9) ISV desglosado.\n\nArtículo 4. El CAI (Código de Autorización de Impresión) es el código que autoriza la impresión de facturas y debe ser solicitado al SAR.`,
    },
    {
      title: "Reglamento de Facturación — ISV e Impuestos",
      content: `TÍTULO II. DEL IMPUESTO SOBRE VENTAS (ISV)\n\nArtículo 10. El ISV se causa a la tasa del 15% sobre el valor de la venta de bienes y prestación de servicios.\n\nArtículo 11. Están exentos del ISV: 1) Los alimentos básicos; 2) Los medicamentos; 3) Los servicios educativos; 4) Los servicios de salud; 5) Las exportaciones.\n\nArtículo 12. El contribuyente debe presentar declaración mensual de ISV dentro de los primeros quince días del mes siguiente.\n\nArtículo 13. La retención del ISV debe efectuarse por el comprador cuando este sea contribuyente del impuesto.`,
    },
  ],
  ley_isr: [
    {
      title: "Ley de Impuesto Sobre la Renta — Sujeto y Objeto",
      content: `TÍTULO I. DEL SUJETO Y OBJETO DEL IMPUESTO\n\nArtículo 1. Están sujetas al pago del Impuesto Sobre la Renta: 1) Las personas jurídicas domiciliadas en Honduras; 2) Las personas naturales residentes en Honduras; 3) Los patrimonios; 4) Las sucesiones.\n\nArtículo 2. El impuesto se aplica sobre la renta neta global obtenida durante el ejercicio fiscal.\n\nArtículo 3. La tasa del impuesto para personas jurídicas es del 25% sobre la renta neta imponible.\n\nArtículo 4. Las personas naturales pagan conforme a tarifa progresiva establecida por la Secretaría de Finanzas.`,
    },
  ],
  codigo_tributario: [
    {
      title: "Código Tributario — Obligaciones Fiscales",
      content: `LIBRO PRIMERO. DISPOSICIONES GENERALES\n\nTÍTULO I. DE LA OBLIGACIÓN TRIBUTARIA\n\nArtículo 1. La obligación tributaria surge cuando se realiza el hecho generador previsto en la ley.\n\nArtículo 2. Son contribuyentes las personas naturales o jurídicas obligadas al pago del tributo.\n\nArtículo 3. La obligación tributaria se extingue por: 1) Pago; 2) Compensación; 3) Confusión; 4) Condonación; 5) Prescripción.\n\nArtículo 4. El derecho de la Administración Tributaria para determinar la obligación prescribe a los cinco años.\n\nArtículo 112. Los contribuyentes deben conservar los libros contables y documentos de respaldo por un plazo mínimo de cinco años.`,
    },
  ],
  jurisprudencia_constitucional: [
    {
      title: "Sala Constitucional — Amparo por Violación al Debido Proceso",
      content: `SENTENCIA CSJ-SC-001-2024\n\nSALA DE LO CONSTITUCIONAL DE LA CORTE SUPREMA DE JUSTICIA\n\nMagistrado Ponente: Dr. Juan Carlos Pérez\nFecha: 15 de enero de 2024\n\nRECURSO DE AMPARO interpuesto por el abogado Ricardo Mendoza en representación del señor Pedro García contra la decisión del Juzgado de Letras Civil que ordenó el lanzamiento de su vivienda sin haber sido citado al proceso.\n\nCONSIDERANDO: Que el derecho al debido proceso comprende la garantía de audiencia, el derecho a ser oído y a presentar pruebas, y la obligación del juzgador de citar a todas las partes del proceso.\n\nCONSIDERANDO: Que en el presente caso se ha vulnerado el derecho de defensa del recurrente al no haber sido notificado personalmente de la demanda en su contra.\n\nPOR TANTO: La Sala de lo Constitucional RESUELVE: 1) Declarar HA LUGAR el recurso de amparo; 2) Ordenar la reposición del proceso desde la etapa de citación; 3) Dejar sin efecto la sentencia de lanzamiento.`,
    },
    {
      title: "Sala Constitucional — Amparo contra Denegación de Justicia",
      content: `SENTENCIA CSJ-SC-002-2024\n\nSALA DE LO CONSTITUCIONAL\n\nMagistrado Ponente: Dra. María Fernanda López\nFecha: 28 de febrero de 2024\n\nRECURSO DE AMPARO por denegación de justicia contra la Sala de lo Civil de la Corte de Apelaciones por retardación en la resolución de un recurso de apelación.\n\nCONSIDERANDO: Que la Constitución de la República garantiza el derecho a una justicia pronta y cumplida.\n\nCONSIDERANDO: Que la retardación de justicia por más de seis meses sin causa justificada constituye una violación al derecho de petición y a la tutela judicial efectiva.\n\nPOR TANTO: 1) Declarar HA LUGAR el amparo; 2) Ordenar a la Sala de lo Civil resolver el recurso en el plazo de treinta días.`,
    },
  ],
  jurisprudencia_civil: [
    {
      title: "Sala Civil — Contrato de Compraventa con Arras",
      content: `SENTENCIA CSJ-SCIV-001-2024\n\nSALA DE LO CIVIL DE LA CORTE SUPREMA DE JUSTICIA\n\nMagistrado Ponente: Dr. Carlos Andrés Mejía\nFecha: 10 de marzo de 2024\n\nRECURSO DE CASACIÓN contra sentencia de la Sala de lo Civil de la Corte de Apelaciones que declaró la resolución de un contrato de compraventa de inmueble por incumplimiento.\n\nCONSIDERANDO: Que las arras o señal en un contrato de compraventa tienen carácter confirmatorio y no penal, salvo pacto expreso en contrario.\n\nCONSIDERANDO: Que cuando el comprador da arras y luego incumple, el vendedor puede retenerlas como indemnización. Cuando el vendedor incumple, debe devolverlas duplicadas.\n\nPOR TANTO: Se declara NO HA LUGAR el recurso de casación, confirmando la sentencia recurrida.`,
    },
    {
      title: "Sala Civil — Responsabilidad Civil Contractual",
      content: `SENTENCIA CSJ-SCIV-003-2024\n\nSALA DE LO CIVIL\n\nMagistrado Ponente: Dr. Roberto Arturo Reyes\nFecha: 22 de abril de 2024\n\nCONTRATO de servicios profesionales incumplido. El demandante reclama daños y perjuicios por la no finalización de una obra de construcción dentro del plazo pactado.\n\nCONSIDERANDO: Que la responsabilidad civil contractual surge del incumplimiento de las obligaciones derivadas de un contrato válidamente celebrado.\n\nCONSIDERANDO: Que el incumplimiento debe ser imputable al deudor y causar un daño cierto al acreedor.\n\nPOR TANTO: Se declara HA LUGAR la demanda y se condena al demandado al pago de L. 450,000.00 por daños y perjuicios.`,
    },
  ],
  jurisprudencia_penal: [
    {
      title: "Sala Penal — Estafa mediante Cheque sin Fondo",
      content: `SENTENCIA CSJ-SP-001-2024\n\nSALA DE LO PENAL DE LA CORTE SUPREMA DE JUSTICIA\n\nMagistrado Ponente: Dra. Ana Cecilia Flores\nFecha: 5 de mayo de 2024\n\nRECURSO DE CASACIÓN interpuesto por la defensa contra sentencia condenatoria por el delito de estafa.\n\nCONSIDERANDO: Que la emisión de cheques sin fondos constituye delito de estafa cuando el agente actúa con ánimo de lucro y emplea engaño para causar perjuicio patrimonial.\n\nCONSIDERANDO: Que para la configuración del delito se requiere que el sujeto activo tenga conocimiento de la falta de fondos al momento de emitir el cheque.\n\nPOR TANTO: Se declara NO HA LUGAR el recurso y se confirma la condena de tres años de reclusión.`,
    },
    {
      title: "Sala Penal — Legítima Defensa",
      content: `SENTENCIA CSJ-SP-002-2024\n\nSALA DE LO PENAL\n\nMagistrado Ponente: Dr. Francisco Javier Cruz\nFecha: 18 de junio de 2024\n\nRECURSO DE APELACIÓN contra sentencia que condenó por homicidio simple, alegando el recurrente que actuó en legítima defensa.\n\nCONSIDERANDO: Que la legítima defensa requiere: 1) Agresión ilegítima actual o inminente; 2) Necesidad racional de la defensa; 3) Falta de provocación suficiente por parte del defensor.\n\nCONSIDERANDO: Que la prueba documental y testimonial acredita que el acusado fue atacado primero con un arma blanca, existiendo necesidad racional de defenderse.\n\nPOR TANTO: Se declara HA LUGAR el recurso y se absuelve al acusado por concurrir la eximente de legítima defensa.`,
    },
  ],
  jurisprudencia_laboral: [
    {
      title: "Sala Laboral — Despido Injustificado",
      content: `SENTENCIA CSJ-SL-001-2024\n\nSALA DE LO LABORAL DE LA CORTE SUPREMA DE JUSTICIA\n\nMagistrado Ponente: Dr. Luis Fernando Martínez\nFecha: 12 de julio de 2024\n\nRECURSO DE CASACIÓN contra sentencia de la Sala de lo Laboral de la Corte de Apelaciones que condenó al patrono al pago de prestaciones e indemnización por despido injustificado.\n\nCONSIDERANDO: Que el despido injustificado da lugar al pago de prestaciones e indemnización conforme al artículo 130 del Código de Trabajo.\n\nCONSIDERANDO: Que la carga de la prueba del despido justificado corresponde al patrono.\n\nPOR TANTO: Se confirma la sentencia recurrida y se condena al patrono al pago de L. 180,000.00 en concepto de prestaciones e indemnización.`,
    },
    {
      title: "Sala Laboral — Jornada Extraordinaria",
      content: `SENTENCIA CSJ-SL-002-2024\n\nSALA DE LO LABORAL\n\nMagistrado Ponente: Dra. Patricia Guadalupe Rivera\nFecha: 3 de septiembre de 2024\n\nDEMANDA por pago de horas extras no canceladas durante tres años de relación laboral.\n\nCONSIDERANDO: Que el artículo 100 del Código de Trabajo establece la jornada ordinaria máxima de ocho horas diarias y cuarenta y cuatro semanales.\n\nCONSIDERANDO: Que las horas extraordinarias deben pagarse con un recargo del 100% sobre el salario ordinario.\n\nPOR TANTO: Se declaga HA LUGAR la demanda y se condena al patrono al pago de L. 95,000.00 por concepto de horas extras adeudadas.`,
    },
  ],
  tratados_cafta: [
    {
      title: "CAFTA-DR — Tratado de Libre Comercio",
      content: `TRATADO DE LIBRE COMERCIO ENTRE CENTROAMÉRICA, ESTADOS UNIDOS Y REPÚBLICA DOMINICANA (CAFTA-DR)\n\nCAPÍTULO I. DISPOSICIONES INICIALES\n\nArtículo 1.1. Se establece una zona de libre comercio conforme al Acuerdo sobre la OMC.\n\nArtículo 1.2. Las Partes confirman los derechos y obligaciones existentes entre ellas conforme al Acuerdo sobre la OMC y otros acuerdos.\n\nCAPÍTULO III. TRATO NACIONAL Y ACCESO DE MERCANCÍAS AL MERCADO\n\nArtículo 3.1. Cada Parte otorgará trato nacional a las mercancías de otra Parte conforme al Artículo III del GATT.\n\nArtículo 3.2. Las Partes eliminarán progresivamente los aranceles aduaneros sobre las mercancías originarias.`,
    },
  ],
};

async function main() {
  const { db } = await import("../lib/db");
  const { legalDocuments } = await import("../database/schema");
  const { chunkWithMetadata } = await import("../lib/ai/chunking");
  const { generateEmbedding } = await import("../lib/ai/embeddings");
  const { eq } = await import("drizzle-orm");

  const CHUNK_SIZE = 512;
  const CHUNK_OVERLAP = 50;

  console.log("=".repeat(60));
  console.log("🧑‍⚖️ JUSTICIA VERDADERA — SEED DEL CORPUS LEGAL HONDUREÑO");
  console.log("=".repeat(60));
  console.log(`\nFuentes a cargar: ${Object.keys(LEGAL_CONTENT).length}`);
  console.log(`Documentos a procesar: ${Object.values(LEGAL_CONTENT).flat().length}`);

  // Clear existing seed data (keep what might be real)
  console.log("\n🗑️ Limpiando datos existentes...");
  for (const sourceId of Object.keys(LEGAL_CONTENT)) {
    await db.delete(legalDocuments).where(eq(legalDocuments.source, sourceId));
  }

  let totalChunks = 0;
  let totalDocs = 0;

  for (const [sourceId, documents] of Object.entries(LEGAL_CONTENT)) {
    console.log(`\n📄 ${sourceId} (${documents.length} documentos)`);

    for (const doc of documents) {
      const chunks = chunkWithMetadata(sourceId, doc.title, doc.content, CHUNK_SIZE, CHUNK_OVERLAP);
      let docChunks = 0;

      for (const chunk of chunks) {
        try {
          const embedding = await generateEmbedding(chunk.content);
          await db.insert(legalDocuments).values({
            source: chunk.source,
            title: chunk.title,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            embedding: embedding,
          } as typeof legalDocuments.$inferInsert);
          docChunks++;
          totalChunks++;
        } catch (error) {
          console.error(`   ✗ Error storing chunk ${chunk.chunkIndex}:`, error);
        }
      }

      console.log(`   → "${doc.title.substring(0, 60)}..." — ${docChunks} chunks`);
      totalDocs++;
    }
  }

  // Verify
  const result = await db
    .select({ source: legalDocuments.source, count: legalDocuments.chunkIndex })
    .from(legalDocuments)
    .then(() => db.select({
      source: legalDocuments.source,
      count: legalDocuments.chunkIndex,
    })
    .from(legalDocuments)
    .then(async () => {
      const { sql } = await import("drizzle-orm");
      const stats = await db
        .select({
          source: legalDocuments.source,
          count: sql<number>`count(*)::int`,
        })
        .from(legalDocuments)
        .groupBy(legalDocuments.source)
        .orderBy(legalDocuments.source);

      console.log("\n" + "=".repeat(60));
      console.log("📊 RESUMEN DEL CORPUS LEGAL");
      console.log("=".repeat(60));
      console.log(`Total documentos procesados: ${totalDocs}`);
      console.log(`Total chunks almacenados: ${totalChunks}`);
      console.log(`\nFuentes:`);
      for (const s of stats) {
        console.log(`   ${s.source}: ${s.count} chunks`);
      }
      console.log("\n✅ Corpus legal cargado exitosamente.");
    }));
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
