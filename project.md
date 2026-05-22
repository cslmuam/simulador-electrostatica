# Visualizador de Electrostática — Proyecto Pedagógico

Simulador interactivo de campo eléctrico para el curso **Introducción a la Electrostática y Magnetostática** (UAM). El sistema está diseñado para que el estudiante construya intuición sobre el campo eléctrico mediante experimentación guiada, sin requerir instalación ni conexión a internet durante el uso.

---

## Arquitectura del sistema

```
generate_lessons.py          ← (profesor) ejecuta una sola vez
       │  Anthropic API
       ▼
   lessons.js                ← lecciones generadas (JSON embebido)
       │
       ▼
  index.html + script.js     ← estudiante abre en navegador (sin API)
```

El principio central es **generación offline / ejecución offline**: el modelo de lenguaje sólo se invoca durante la preparación del material didáctico. El estudiante nunca necesita una clave de API ni conexión a internet.

---

## Generador multiagente (`generate_lessons.py`)

El script implementa un pipeline de cuatro agentes especializados, cada uno con un rol distinto:

| Agente | Rol | Herramienta de salida |
|---|---|---|
| `CurriculumAgent` | Diseña la secuencia pedagógica | `define_curriculum` |
| `PhysicsAgent` | Genera configuraciones de cargas físicamente correctas | `define_charge_configuration` |
| `ContentAgent` | Redacta objetivos, teoría, pistas y preguntas | `write_lesson_content` |
| `QAAgent` | Revisa coherencia física y pedagógica; puede solicitar revisión | `review_lesson` |

El agente QA puede rechazar una lección y devolver retroalimentación al agente de contenido (hasta 2 iteraciones antes de aceptar). Esto simula un flujo de revisión real.

### Uso

```bash
pip install anthropic
export ANTHROPIC_API_KEY=sk-ant-...

# Generar 8 lecciones en español (nivel introductorio)
python generate_lessons.py

# Opciones avanzadas
python generate_lessons.py --num 12 --level avanzado --out lessons.js
```

El script sobreescribe `lessons.js` con las nuevas lecciones. El archivo `lessons.js` ya viene incluido con 8 lecciones preconfiguradas; sólo ejecuta el script si quieres regenerar o ampliar el banco.

---

## Formato de una lección (JSON)

```jsonc
{
  "id": "L03",
  "title": "Dos cargas iguales — punto nulo",
  "topic": "cargas_puntuales",        // cargas_puntuales | distribuciones_continuas |
                                       // principio_superposicion | reto_diseno
  "difficulty": 2,                     // 1 (básico) … 4 (avanzado)
  "objective": "Identificar...",
  "theory": "Dos cargas iguales...",
  "charges": [
    { "x_m": -2, "y_m": 0, "q": 3, "sign": 1 },
    { "x_m":  2, "y_m": 0, "q": 3, "sign": 1 }
  ],
  "settings": {
    "zoom": 70,
    "lineDensity": 16,
    "showNodalLines": false,
    "showNullPoints": true,
    "showEquipotentials": false
  },
  "hints": ["Pista 1…", "Pista 2…"],
  "questions": ["Pregunta 1…", "Pregunta 2…"],
  "challenge": {                       // null si no hay reto
    "description": "Coloca…",
    "target_charges": [ … ]
  }
}
```

---

## Capacidades de la interfaz

### Existentes
- Añadir/arrastrar cargas puntuales (positivas y negativas, 1–10 μC)
- Trazado de líneas de campo por integración RK4
- Líneas nodales V = 0 (cuadrados de marcha / marching squares)
- Detección de puntos nulos |E| = 0
- Cuadrícula con anclaje, zoom, paneo
- Lectura en tiempo real de (x, y, Eₓ, Eᵧ, |E|) bajo el cursor

### Añadidas en esta versión
- **Panel de lecciones** (derecha): carga configuraciones preconfiguradas, muestra objetivo, teoría y pistas progresivas
- **Modo reto**: el estudiante reproduce una configuración objetivo; se calcula un puntaje de similitud de campo (0–100 %)
- **Equipotenciales múltiples**: contornos V = k · V₀ para k ∈ {−4,…,+4}
- **Navegación entre lecciones**: anterior / siguiente

---

## Temas cubiertos (8 lecciones incluidas)

| # | Título | Tema | Dificultad |
|---|---|---|---|
| L01 | Campo de una carga puntual | Cargas puntuales | ★☆☆☆ |
| L02 | Dipolo eléctrico | Cargas puntuales | ★★☆☆ |
| L03 | Dos cargas iguales — punto nulo | Cargas puntuales | ★★☆☆ |
| L04 | Línea de carga (aproximación discreta) | Distribuciones continuas | ★★★☆ |
| L05 | Anillo de cargas — apantallamiento | Distribuciones continuas | ★★★☆ |
| L06 | Cuadrupolo eléctrico | Principio de superposición | ★★★☆ |
| L07 | Método de imágenes (conductor plano) | Principio de superposición | ★★★★ |
| L08 | Reto: condensador plano aproximado | Reto de diseño | ★★★★ |
