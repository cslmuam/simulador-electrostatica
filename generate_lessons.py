#!/usr/bin/env python3
"""
Generador multiagente de lecciones para el Visualizador de Electrostática.

Arquitectura de agentes:
  CurriculumAgent → PhysicsAgent → ContentAgent → QAAgent (→ revisión si necesario)

Cada agente es una llamada especializada a Claude con herramientas estructuradas.
La salida es lessons.js, que el navegador carga directamente sin API.

Requisitos:
  pip install anthropic

Uso:
  export ANTHROPIC_API_KEY=sk-ant-...
  python generate_lessons.py
  python generate_lessons.py --num 12 --level avanzado --out lessons.js
"""

import anthropic
import argparse
import json
import sys
import textwrap
from pathlib import Path

# ---------------------------------------------------------------------------
# Tool schemas
# ---------------------------------------------------------------------------

DEFINE_CURRICULUM_TOOL = {
    "name": "define_curriculum",
    "description": "Define la secuencia pedagógica de lecciones para el simulador.",
    "input_schema": {
        "type": "object",
        "required": ["lessons"],
        "properties": {
            "lessons": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["id", "title", "topic", "difficulty", "physics_scenario"],
                    "properties": {
                        "id": {"type": "string", "description": "Identificador, ej. L01"},
                        "title": {"type": "string"},
                        "topic": {
                            "type": "string",
                            "enum": [
                                "cargas_puntuales",
                                "distribuciones_continuas",
                                "principio_superposicion",
                                "reto_diseno",
                            ],
                        },
                        "difficulty": {"type": "integer", "minimum": 1, "maximum": 4},
                        "physics_scenario": {
                            "type": "string",
                            "description": "Descripción técnica del escenario físico para el PhysicsAgent.",
                        },
                    },
                },
            }
        },
    },
}

DEFINE_CHARGE_CONFIGURATION_TOOL = {
    "name": "define_charge_configuration",
    "description": "Define la configuración de cargas y ajustes de visualización para una lección.",
    "input_schema": {
        "type": "object",
        "required": ["charges", "settings"],
        "properties": {
            "charges": {
                "type": "array",
                "description": "Lista de cargas puntuales. Coordenadas en metros. El origen está en el centro del lienzo.",
                "items": {
                    "type": "object",
                    "required": ["x_m", "y_m", "q", "sign"],
                    "properties": {
                        "x_m": {"type": "number", "description": "Posición x en metros [-6, 6]"},
                        "y_m": {"type": "number", "description": "Posición y en metros [-4, 4]"},
                        "q": {"type": "integer", "minimum": 1, "maximum": 10, "description": "Magnitud en μC"},
                        "sign": {"type": "integer", "enum": [1, -1]},
                    },
                },
            },
            "settings": {
                "type": "object",
                "required": ["zoom", "lineDensity", "showNodalLines", "showNullPoints", "showEquipotentials"],
                "properties": {
                    "zoom": {"type": "integer", "minimum": 20, "maximum": 200,
                             "description": "Píxeles por metro. 80 = vista estándar."},
                    "lineDensity": {"type": "integer", "enum": [8, 16, 24, 32],
                                   "description": "Líneas de campo por carga unidad."},
                    "showNodalLines": {"type": "boolean"},
                    "showNullPoints": {"type": "boolean"},
                    "showEquipotentials": {"type": "boolean"},
                },
            },
        },
    },
}

WRITE_LESSON_CONTENT_TOOL = {
    "name": "write_lesson_content",
    "description": "Redacta el contenido pedagógico completo de la lección.",
    "input_schema": {
        "type": "object",
        "required": ["objective", "theory", "hints", "questions", "challenge"],
        "properties": {
            "objective": {
                "type": "string",
                "description": "Una oración que describe qué aprenderá el estudiante. Empieza con verbo infinitivo.",
            },
            "theory": {
                "type": "string",
                "description": "Explicación teórica breve (3–5 oraciones). Conecta la visualización con las ecuaciones.",
            },
            "hints": {
                "type": "array",
                "minItems": 0,
                "maxItems": 2,
                "items": {"type": "string"},
                "description": (
                    "Para nivel introductorio: pistas observacionales progresivas. "
                    "Para nivel ingeniería: OMITIR (lista vacía) o incluir como máximo una referencia "
                    "teórica/ecuacional (nunca una observación directa ni un paso guiado). "
                    "El reto debe resolverse sin andamiaje."
                ),
            },
            "questions": {
                "type": "array",
                "minItems": 2,
                "maxItems": 4,
                "items": {"type": "string"},
                "description": (
                    "Para nivel ingeniería: preguntas que exigen cálculo, estimación de orden de magnitud "
                    "o derivación analítica. Deben ser respondibles con lápiz y papel usando lo observado "
                    "en el simulador. Al menos dos deben requerir una ecuación explícita."
                ),
            },
            "challenge": {
                "oneOf": [
                    {"type": "null"},
                    {
                        "type": "object",
                        "required": ["description", "target_charges"],
                        "properties": {
                            "description": {"type": "string"},
                            "target_charges": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "required": ["x_m", "y_m", "q", "sign"],
                                    "properties": {
                                        "x_m": {"type": "number"},
                                        "y_m": {"type": "number"},
                                        "q": {"type": "integer", "minimum": 1, "maximum": 10},
                                        "sign": {"type": "integer", "enum": [1, -1]},
                                    },
                                },
                            },
                        },
                    },
                ]
            },
        },
    },
}

REVIEW_LESSON_TOOL = {
    "name": "review_lesson",
    "description": "Revisa la lección completa y emite una decisión de calidad.",
    "input_schema": {
        "type": "object",
        "required": ["decision", "score", "feedback"],
        "properties": {
            "decision": {
                "type": "string",
                "enum": ["approve", "revise"],
                "description": "'approve' si la lección es correcta y coherente; 'revise' si requiere cambios.",
            },
            "score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "Puntaje de calidad (0–100). Aprobar con ≥ 75.",
            },
            "feedback": {
                "type": "string",
                "description": "Si decision='revise', especifica exactamente qué corregir. Si decision='approve', deja vacío.",
            },
        },
    },
}


# ---------------------------------------------------------------------------
# Base Agent
# ---------------------------------------------------------------------------


class Agent:
    """Agente Claude con una personalidad y herramientas fijas."""

    def __init__(self, client: anthropic.Anthropic, system: str, model: str):
        self.client = client
        self.system = system
        self.model = model

    def run(self, user_message: str, tool: dict, context: str = "") -> dict:
        """Ejecuta el agente y devuelve el primer resultado de herramienta."""
        messages = []
        if context:
            messages.append({"role": "user", "content": context})
            messages.append({"role": "assistant", "content": "Entendido, usaré ese contexto."})
        messages.append({"role": "user", "content": user_message})

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=[
                {
                    "type": "text",
                    "text": self.system,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=[tool],
            tool_choice={"type": "tool", "name": tool["name"]},
            messages=messages,
        )

        for block in response.content:
            if block.type == "tool_use":
                return block.input

        raise RuntimeError(f"El agente no devolvió salida de herramienta. Respuesta: {response}")


# ---------------------------------------------------------------------------
# Specialized Agents
# ---------------------------------------------------------------------------

CURRICULUM_SYSTEM = """\
Eres un diseñador curricular experto en electrostática para ingeniería eléctrica y física \
(nivel licenciatura, 3er–4to semestre). Diseñas secuencias de lecciones progresivas \
donde cada lección construye sobre la anterior con rigor matemático creciente. \
El simulador permite colocar cargas puntuales en un lienzo 2D y visualizar líneas \
de campo E, superficies equipotenciales, líneas nodales (V=0) y puntos nulos (|E|=0). \
Coordenadas en metros; rango visible ±6 m en x, ±4 m en y. \
\
Para nivel ingeniería los escenarios deben: \
(1) Exigir superposición no trivial (≥3 cargas con simetrías rotas, cuadrupolos, \
    distribuciones asimétricas). \
(2) Incluir fenómenos cuantificables: localización analítica de puntos nulos, \
    razón de fuerzas, teorema de Gauss aplicado a superficies imaginarias. \
(3) Los retos de diseño deben pedir reconstruir una distribución de carga a partir \
    de la topología del campo (problema inverso), aproximar configuraciones físicas \
    reales (blindaje, condensador, haz de iones), o minimizar/maximizar una \
    observable del campo en una región dada. \
(4) Ninguna lección debe ser resoluble por observación pasiva; el estudiante debe \
    calcular, estimar órdenes de magnitud o derivar un resultado.\
"""

PHYSICS_SYSTEM = """\
Eres un físico teórico especializado en electrostática. Traduce escenarios de \
ingeniería en configuraciones concretas de cargas puntuales para un simulador 2D. \
Restricciones: magnitud 1–10 μC (entero), posiciones en metros (±6 x, ±4 y). \
\
Para nivel ingeniería: \
- Usa ≥3 cargas con geometría no trivial (no sólo simétricas). \
- Diseña configuraciones donde la topología del campo revele física cuantificable: \
  puntos de silla, líneas nodales cerradas, regiones de campo casi uniforme, \
  asimetrías intencionales que desplacen el punto nulo de forma predecible. \
- Para retos de diseño: la configuración objetivo (target_charges) debe ser \
  suficientemente compleja para que la solución no sea obvia, pero físicamente \
  motivada (cuadrupolo, trampa, blindaje parcial, multipolo).\
"""

CONTENT_SYSTEM = """\
Eres un profesor de electrostática para ingeniería (nivel 3er–4to semestre). \
Redactas material que exige trabajo analítico, no observación pasiva. \
El estudiante usa un simulador de campo eléctrico en el navegador. \
\
Estándares para nivel ingeniería: \
- TEORÍA: 3–5 oraciones densas. Cita ecuaciones explícitas (Coulomb vectorial, \
  Gauss integral, potencial V = kq/r, superposición). Conecta la visualización \
  con el formalismo matemático, no con la intuición cotidiana. \
- PISTAS: Lista vacía [] en la mayoría de casos. Si se incluye alguna, debe ser \
  una referencia teórica (ej. "Aplica ∮E·dA = Q_enc/ε₀ sobre una superficie \
  esférica de radio r entre las dos cargas"), nunca un paso guiado ni una \
  observación directa de la pantalla. \
- PREGUNTAS: Mínimo dos deben requerir cálculo explícito o derivación. \
  Ejemplos de nivel correcto: \
    "Si q₁=3μC en x=−1m y q₂=−1μC en x=+1m, calcula la posición exacta del \
     punto nulo sobre el eje x usando superposición y compara con la simulación." \
    "Estima la densidad de flujo eléctrico |E| a 0.5 m del origen usando Gauss \
     y verifica cualitativamente con la densidad de líneas de campo." \
    "Demuestra que en el punto nulo el campo de cada carga debe ser antiparalelo \
     e igual en módulo; usa esto para derivar la condición de localización." \
- RETO: La descripción no debe revelar la solución ni sugerir el número de cargas. \
  El estudiante debe inferir la configuración de la topología del campo objetivo. \
  Redacta como especificación de ingeniería: observable medible, no procedimiento.\
"""

QA_SYSTEM = """\
Eres un evaluador exigente de material educativo para ingeniería eléctrica. \
Rechaza cualquier lección que: \
- Tenga preguntas respondibles sólo por observación visual (sin cálculo). \
- Incluya pistas que guíen paso a paso en lugar de referencias teóricas. \
- Tenga un reto trivial (< 3 cargas objetivo, configuración obvia o simétricamente simple). \
- Use teoría sin ecuaciones explícitas. \
- Tenga inconsistencia entre la configuración de cargas y el contenido escrito. \
\
Criterios de aprobación (score ≥ 80): \
(1) La teoría cita al menos una ecuación con símbolos. \
(2) Mínimo 2 preguntas exigen cálculo o derivación, no sólo observación. \
(3) Las pistas son [] o ≤1 referencia teórica (no guía paso a paso). \
(4) El reto requiere al menos 3 cargas objetivo con geometría no trivial, \
    y su descripción no revela el número ni la disposición de las cargas. \
(5) Un estudiante de ingeniería necesitaría ≥20 min de trabajo analítico serio.\
"""


class CurriculumAgent(Agent):
    def __init__(self, client, model):
        super().__init__(client, CURRICULUM_SYSTEM, model)

    def plan(self, num_lessons: int, level: str, topics: list[str]) -> list[dict]:
        prompt = (
            f"Diseña una secuencia de {num_lessons} lecciones de nivel '{level}' "
            f"para el simulador de campo eléctrico. Temas requeridos: {', '.join(topics)}. "
            f"Ordena las lecciones de menor a mayor complejidad. "
            f"Incluye al menos un reto de diseño (topic='reto_diseno') al final."
        )
        result = self.run(prompt, DEFINE_CURRICULUM_TOOL)
        return result["lessons"]


class PhysicsAgent(Agent):
    def __init__(self, client, model):
        super().__init__(client, PHYSICS_SYSTEM, model)

    def configure(self, lesson_meta: dict) -> dict:
        prompt = (
            f"Configura el simulador para la lección: '{lesson_meta['title']}'. "
            f"Escenario: {lesson_meta['physics_scenario']}. "
            f"Dificultad: {lesson_meta['difficulty']}/4. "
            f"La configuración debe ilustrar claramente el concepto y ser visualmente interesante."
        )
        return self.run(prompt, DEFINE_CHARGE_CONFIGURATION_TOOL)


class ContentAgent(Agent):
    def __init__(self, client, model):
        super().__init__(client, CONTENT_SYSTEM, model)

    def write(self, lesson_meta: dict, charge_config: dict, level: str, feedback: str = "") -> dict:
        context = (
            f"Configuración de cargas: {json.dumps(charge_config['charges'], ensure_ascii=False)}. "
            f"Ajustes de visualización: {json.dumps(charge_config['settings'], ensure_ascii=False)}."
        )
        engineering_note = (
            " NIVEL INGENIERÍA: sin pistas observacionales, preguntas con cálculo "
            "explícito, reto no trivial con ≥3 cargas objetivo cuya geometría no es obvia."
            if level in ("ingenieria", "avanzado") else ""
        )
        prompt = (
            f"Escribe el contenido pedagógico para la lección '{lesson_meta['title']}' "
            f"(dificultad {lesson_meta['difficulty']}/4, nivel {level}).{engineering_note} "
            + (f"Incorpora esta retroalimentación del revisor: {feedback}" if feedback else "")
        )
        return self.run(prompt, WRITE_LESSON_CONTENT_TOOL, context=context)


class QAAgent(Agent):
    def __init__(self, client, model):
        super().__init__(client, QA_SYSTEM, model)

    def review(self, full_lesson: dict) -> dict:
        prompt = (
            "Revisa esta lección completa y emite tu decisión:\n"
            + json.dumps(full_lesson, ensure_ascii=False, indent=2)
        )
        return self.run(prompt, REVIEW_LESSON_TOOL)


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------


class LessonGenerationPipeline:
    """
    Coordina los cuatro agentes para generar cada lección.
    Flujo por lección:
      PhysicsAgent → ContentAgent → QAAgent → (revisión si score < 75) → ContentAgent → QAAgent
    """

    MAX_REVISIONS = 2

    def __init__(self, client: anthropic.Anthropic, model: str):
        self.curriculum = CurriculumAgent(client, model)
        self.physics = PhysicsAgent(client, model)
        self.content = ContentAgent(client, model)
        self.qa = QAAgent(client, model)

    def _generate_one(self, lesson_meta: dict, level: str, verbose: bool) -> dict:
        if verbose:
            print(f"  [PhysicsAgent]  Configurando {lesson_meta['id']}…")
        charge_config = self.physics.configure(lesson_meta)

        feedback = ""
        for attempt in range(self.MAX_REVISIONS + 1):
            if verbose:
                revision_tag = f" (revisión {attempt})" if attempt else ""
                print(f"  [ContentAgent]{revision_tag}  Redactando contenido…")
            lesson_content = self.content.write(lesson_meta, charge_config, level, feedback)

            full_lesson = {**lesson_meta, **charge_config, **lesson_content}

            if verbose:
                print("  [QAAgent]       Revisando…")
            review = self.qa.review(full_lesson)

            if verbose:
                status = "✓ APROBADA" if review["decision"] == "approve" else f"✗ RECHAZADA (score={review['score']})"
                print(f"  [QAAgent]       {status}")

            if review["decision"] == "approve" or attempt == self.MAX_REVISIONS:
                break
            feedback = review["feedback"]

        return full_lesson

    def run(
        self,
        num_lessons: int,
        level: str,
        topics: list[str],
        verbose: bool = True,
    ) -> list[dict]:
        if verbose:
            print(f"[CurriculumAgent] Diseñando secuencia de {num_lessons} lecciones ({level})…")
        lesson_metas = self.curriculum.plan(num_lessons, level, topics)

        lessons = []
        for meta in lesson_metas:
            if verbose:
                print(f"\n→ {meta['id']}: {meta['title']}")
            lesson = self._generate_one(meta, level, verbose)
            lessons.append(lesson)

        return lessons


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------


def write_lessons_js(lessons: list[dict], out_path: Path) -> None:
    json_str = json.dumps(lessons, ensure_ascii=False, indent=2)
    js = textwrap.dedent(f"""\
        // Lecciones generadas automáticamente — no editar a mano.
        // Para regenerar: python generate_lessons.py
        // Para añadir lecciones manualmente, sigue el formato documentado en project.md.
        window.LESSONS = {json_str};
    """)
    out_path.write_text(js, encoding="utf-8")
    print(f"\n✓ {len(lessons)} lecciones escritas en {out_path}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera lecciones para el simulador de electrostática.")
    parser.add_argument("--num", type=int, default=8, help="Número de lecciones a generar (default: 8)")
    parser.add_argument(
        "--level",
        default="ingenieria",
        choices=["introductorio", "intermedio", "avanzado", "ingenieria"],
        help="Nivel del curso (default: ingenieria)",
    )
    parser.add_argument(
        "--model",
        default="claude-opus-4-7",
        help="Modelo Claude a usar (default: claude-opus-4-7)",
    )
    parser.add_argument(
        "--out",
        default="lessons.js",
        help="Archivo de salida (default: lessons.js)",
    )
    args = parser.parse_args()

    topics = [
        "cargas_puntuales",
        "distribuciones_continuas",
        "principio_superposicion",
        "reto_diseno",
    ]

    try:
        client = anthropic.Anthropic()
    except Exception as e:
        print(f"Error al inicializar cliente Anthropic: {e}", file=sys.stderr)
        print("Asegúrate de que ANTHROPIC_API_KEY está configurada.", file=sys.stderr)
        sys.exit(1)

    pipeline = LessonGenerationPipeline(client, args.model)
    lessons = pipeline.run(args.num, args.level, topics, verbose=True)

    out_path = Path(args.out)
    write_lessons_js(lessons, out_path)


if __name__ == "__main__":
    main()
