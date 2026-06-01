// Datos semilla por defecto para AITips Hub
const INITIAL_SUBJECTS = [
  "IA Generativa Aplicada",
  "Ingeniería de Software",
  "Análisis y Diseño de Sistemas",
  "Programación Avanzada"
];

const INITIAL_TIPS = [
  {
    id: "tip-1",
    title: "Tutor Socrático para Debugging en Ingeniería de Software",
    subject: "Ingeniería de Software",
    category: "Custom Instructions",
    tags: ["socratic", "chatgpt", "debugging", "docencia"],
    description: "Configura ChatGPT como un tutor socrático que guía a tus estudiantes a encontrar errores en su código sin darles la solución directamente. Promueve el pensamiento crítico y el análisis lógico de algoritmos.",
    triggerWord: "/socratic",
    promptText: `Actúa como un tutor de programación socrático y experto en depuración de software. Cuando te comparta un bloque de código con un error o una consulta sobre un bug, NO me des la solución corregida directamente. En su lugar:
1. Analiza el código e identifica el problema de fondo de forma silenciosa.
2. Hazme una o dos preguntas guiadas que me hagan reflexionar sobre el comportamiento del código (ej. "¿Qué valor tendría la variable 'x' en la tercera iteración?", o "¿Qué sucede si el arreglo está vacío?").
3. Espera a que responda. Continúa guiándome paso a paso hasta que yo mismo descubra y corrija el error.
4. Mantén un tono alentador y profesional.`,
    steps: [
      "Copiar el prompt superior.",
      "En ChatGPT, ir a Configuración (Settings) > Instrucciones Personalizadas (Custom Instructions).",
      "Pegar el prompt en el cuadro de '¿Cómo te gustaría que responda ChatGPT?'.",
      "Activar la opción 'Habilitar para nuevos chats'.",
      "Para utilizarlo, dile a los alumnos que inicien el chat escribiendo el disparador: '/socratic [código con error]'"
    ],
    useCases: [
      "Prácticas de laboratorio de algoritmos y programación.",
      "Fomentar la resolución autónoma de problemas de lógica de código.",
      "Reducir la dependencia del estudiante de 'copiar y pegar' soluciones generadas por IA."
    ],
    links: [
      { text: "Documentación oficial de OpenAI sobre Custom Instructions", url: "https://help.openai.com/en/articles/8096356-custom-instructions-for-chatgpt" }
    ],
    forStudents: true,
    isFavorite: true,
    createdAt: "2026-05-30T10:00:00.000Z"
  },
  {
    id: "tip-2",
    title: "Claude Project: Base de Conocimiento de un Proyecto de Software",
    subject: "Ingeniería de Software",
    category: "Proyectos y Colaboración",
    tags: ["claude", "projects", "arquitectura", "clean-code"],
    description: "Crea un Proyecto en Claude para centralizar las reglas de arquitectura de tu materia (ej: Clean Architecture, estándares de estilo y especificación de requerimientos) y compártelo con el equipo de estudiantes.",
    triggerWord: "Proyecto Claude",
    promptText: `Eres el Arquitecto de Software Líder y Evaluador Técnico del proyecto de la materia. Tu tarea es guiar al estudiante a desarrollar sus funcionalidades en base a los archivos de contexto cargados (Diagrama de Arquitectura y Estándares de Código). 
Siempre que el estudiante proponga código:
1. Valida que respete la separación de capas definida en 'arquitectura.md'.
2. Compara el código propuesto con los estándares de estilo del archivo 'codestyle.json'.
3. Si el código viola alguna regla, indícale la línea exacta, la regla infringida y cómo solucionarlo, sin dar la refactorización completa de inmediato para que aprenda.`,
    steps: [
      "Ingresar a Claude.ai y hacer clic en 'Projects' (requiere cuenta Pro/Team).",
      "Crear un nuevo Proyecto y nombrarlo con las siglas de la materia y proyecto (ej: 'Materia-IS-G1').",
      "En la barra lateral derecha 'Project Files', subir los archivos clave de tu materia: estándares de codificación (.json/.md), plantillas de arquitectura y especificación de requerimientos (SRS).",
      "En 'Custom Instructions' de este proyecto, pegar el prompt superior.",
      "Compartir el proyecto con los integrantes del grupo de estudiantes para que trabajen en este sandbox configurado."
    ],
    useCases: [
      "Evaluación y co-creación guiada de proyectos semestrales.",
      "Asegurar que los entregables de código sigan las mejores prácticas de la cátedra.",
      "Simular un ambiente real de revisión de código liderado por un arquitecto."
    ],
    links: [
      { text: "Guía de Proyectos en Claude (Anthropic)", url: "https://support.anthropic.com/en/articles/9517075-what-are-projects" }
    ],
    forStudents: true,
    isFavorite: true,
    createdAt: "2026-05-30T10:15:00.000Z"
  },
  {
    id: "tip-3",
    title: "Cadena de Prompts para Refactorización SOLID y Unit Testing",
    subject: "IA Generativa Aplicada",
    category: "Prompt Engineering",
    tags: ["solid", "refactoring", "unit-testing", "prompt-chain"],
    description: "Una secuencia ordenada de dos prompts diseñados para guiar paso a paso la refactorización de código legado violando SOLID, y la posterior creación de su suite de pruebas.",
    triggerWord: "[Cadena de 2 Prompts]",
    promptText: `--- PROMPT 1: REFACTORIZACIÓN SOLID ---
Analiza el siguiente fragmento de código legacy en [LENGUAJE]. Identifica qué principios SOLID está violando y por qué. Luego, proporciona una versión refactorizada que cumpla estrictamente con dichos principios. Explica claramente qué cambios realizaste y qué principio SOLID se resolvió con cada cambio.

[Insertar Código Aquí]

--- PROMPT 2: GENERACIÓN DE PRUEBAS UNITARIAS ---
Tomando como base el código refactorizado que acabas de generar, crea una suite de pruebas unitarias robusta utilizando la biblioteca [BIBLIOTECA_TESTS] (ej: JUnit, Jest, PyTest). Incluye al menos:
- 3 casos de flujo normal (happy path).
- 2 casos de borde o manejo de errores (edge cases).
Asegúrate de agregar comentarios explicando qué escenario evalúa cada prueba.`,
    steps: [
      "Copiar la primera sección del prompt y ejecutarla en el LLM reemplazando [LENGUAJE] y pegando el código legacy a refactorizar.",
      "Revisar la explicación teórica que provee el LLM sobre las violaciones SOLID (sirve para discusión en clase).",
      "En el mismo hilo de conversación, copiar y ejecutar la segunda sección del prompt indicando la biblioteca (ej: Jest para TypeScript).",
      "Pedir a los alumnos comparar la mantenibilidad del código legacy original frente al código refactorizado y testeado por la IA."
    ],
    useCases: [
      "Clase práctica de Principios SOLID en Ingeniería de Software.",
      "Enseñar a redactar pruebas unitarias basadas en lógica refactorizada.",
      "Demostrar el concepto de 'Prompt Chaining' (Cadenas de Prompts)."
    ],
    links: [
      { text: "Explicación interactiva de SOLID (Refactoring.Guru)", url: "https://refactoring.guru" }
    ],
    forStudents: true,
    isFavorite: false,
    createdAt: "2026-05-30T10:30:00.000Z"
  },
  {
    id: "tip-4",
    title: "Generación de Diagramas UML (Secuencia e Infraestructura) con Mermaid JS",
    subject: "Análisis y Diseño de Sistemas",
    category: "Herramientas e Integraciones",
    tags: ["mermaid", "uml", "diagramas", "arquitectura"],
    description: "Prompt especializado para transformar descripciones textuales de casos de uso o historias de usuario en diagramas de secuencia renderizables en Mermaid JS.",
    triggerWord: "/mermaid",
    promptText: `Actúas como un Analista de Sistemas Senior experto en notación UML y Mermaid JS. Tu tarea es convertir el texto descriptivo del caso de uso en código de diagrama de secuencia Mermaid compatible con Markdown.
Requisitos del diagrama:
1. Define claramente los participantes (ej: Actor Usuario, Vista Web, Servidor API, Base de Datos, Servicio Externo).
2. Utiliza mensajes síncronos (->>) y asíncronos (->) según corresponda.
3. Incluye bloques de respuesta (-->>) marcando la devolución de datos.
4. Incorpora anotaciones o notas aclaratorias de lógica de negocio usando la palabra clave 'Note over'.
5. Utiliza bloques condicionales (alt/else) o bucles (loop) si la lógica del flujo lo requiere.

Proporciona únicamente el bloque de código Mermaid encapsulado en tres acentos graves con el identificador 'mermaid'.

Caso de uso a diagramar:
[Insertar descripción o historia de usuario aquí, por ejemplo: 'El usuario inicia sesión, la API valida contra BD y responde con token JWT o error']`,
    steps: [
      "Configurar el prompt en tu cliente de IA favorito.",
      "Ingresar la descripción funcional del flujo de datos en el marcador final.",
      "Copiar el código de salida que genere la IA.",
      "Pegar el código en un visor en línea de Mermaid (https://mermaid.live) o directamente en un archivo Markdown en VS Code que tenga la extensión Markdown Preview Mermaid Support.",
      "Exportar el diagrama como imagen (.png/.svg) para incorporarlo a la documentación técnica del proyecto."
    ],
    useCases: [
      "Modelado ágil de sistemas en clases de Análisis y Diseño.",
      "Documentación rápida de APIs y flujos de integración de microservicios.",
      "Enseñar a los estudiantes a documentar arquitectura visualmente a partir de requisitos textuales."
    ],
    links: [
      { text: "Editor en Vivo Oficial de Mermaid", url: "https://mermaid.live" },
      { text: "Documentación de Sintaxis de Mermaid JS", url: "https://mermaid.js.org" }
    ],
    forStudents: true,
    isFavorite: false,
    createdAt: "2026-05-30T10:45:00.000Z"
  }
];
