// Lecciones generadas automáticamente — no editar a mano.
// Para regenerar: python generate_lessons.py
// Para añadir lecciones manualmente, sigue el formato documentado en project.md.
window.LESSONS = [
  {
    "id": "L01",
    "title": "Una carga puntual positiva: campo radial",
    "topic": "cargas_puntuales",
    "difficulty": 1,
    "physics_scenario": "Colocar una única carga puntual q = +1 nC en el origen (0, 0). Observar las líneas de campo eléctrico saliendo radialmente, el mapa de potencial decreciente con 1/r, y la ausencia de puntos nulos en la región visible.",
    "charges": [
      { "x_m": 0, "y_m": 0, "q": 1, "sign": 1 }
    ],
    "settings": {
      "zoom": 80,
      "lineDensity": 24,
      "showNodalLines": false,
      "showNullPoints": false,
      "showEquipotentials": true
    },
    "objective": "Relacionar la estructura radial del campo eléctrico con la Ley de Coulomb y deducir magnitud y posición de una carga puntual a partir de la topología del campo.",
    "theory": "Una carga puntual positiva q genera un campo E = kq/r² dirigido radialmente hacia afuera, con k ≈ 8.99×10⁹ N·m²/C². El potencial es V = kq/r, función solo de r, por lo que las superficies equipotenciales son esferas (círculos en 2D) centradas en la carga. La relación E = −∇V impone que las líneas de campo sean perpendiculares a las equipotenciales en todo punto. La densidad de líneas de campo es proporcional a |q|: doblar q dobla la densidad.",
    "hints": [],
    "questions": [
      "Si el campo en r₀ vale E₀, expresa E(2r₀) y E(r₀/3) en función de E₀. ¿A qué tasa decae E con la distancia?",
      "Dos puntos P₁ y P₂ están sobre la misma equipotencial. Demuestra que el trabajo realizado por el campo al mover una carga de prueba q₀ de P₁ a P₂ es nulo, usando W = q₀ΔV.",
      "El número de líneas de campo emitidas por q=3 es el triple que por q=1 (a igual configuración del slider). Usa este hecho para estimar la magnitud de la carga objetivo antes de colocarla.",
      "Si en el punto (x₀, y₀) el campo apunta en dirección (cos θ, sin θ), ¿qué concluyes sobre la posición de la carga? Generaliza: ¿cómo determinas la posición de una carga puntual a partir de dos vectores de campo en puntos distintos?"
    ],
    "challenge": {
      "description": "El campo objetivo corresponde a una sola carga positiva descentrada. Los círculos fantasma indican su posición aproximada. Antes de colocarla, estima su magnitud q usando la densidad de líneas de campo del objetivo comparada con la de la configuración base (q=1): el número de líneas emitidas escala linealmente con q. Coloca la carga con la magnitud correcta y verifica que las equipotenciales coinciden.",
      "target_charges": [
        { "x_m": 2.0, "y_m": 1.5, "q": 6, "sign": 1 }
      ]
    }
  },
  {
    "id": "L02",
    "title": "Una carga puntual negativa: inversión del campo",
    "topic": "cargas_puntuales",
    "difficulty": 1,
    "physics_scenario": "Colocar una única carga puntual q = -1 nC en el origen (0, 0). Comparar con L01: las líneas de campo apuntan hacia la carga y el potencial es negativo.",
    "charges": [
      { "x_m": 0, "y_m": 0, "q": 1, "sign": -1 }
    ],
    "settings": {
      "zoom": 80,
      "lineDensity": 16,
      "showNodalLines": false,
      "showNullPoints": false,
      "showEquipotentials": true
    },
    "objective": "Reconocer cómo el signo de una carga puntual invierte la dirección del campo sin alterar la geometría de las equipotenciales, e inferir signo y magnitud a partir de la topología.",
    "theory": "El campo de una carga puntual es E = kq/r² r̂, donde el signo de q determina si E apunta radialmente hacia afuera (q>0) o hacia adentro (q<0). El potencial V = kq/r toma valores negativos para q<0, pero las superficies equipotenciales siguen siendo esferas concéntricas. La relación E = −∇V exige que el campo apunte en la dirección de máxima disminución de V, es decir, hacia el mínimo — que aquí está en la propia carga negativa. El flujo eléctrico a través de cualquier superficie cerrada que contenga la carga es Φ = q/ε₀ (Ley de Gauss), negativo si q < 0.",
    "hints": [],
    "questions": [
      "Aplica la Ley de Gauss a una superficie esférica de radio r centrada en la carga q < 0: calcula el flujo Φ = ∮E·dA y despeja E(r). ¿Coincide con la Ley de Coulomb?",
      "Si V = kq/r con q = −4 μC y r = 2 m, calcula V numéricamente. ¿Qué trabajo realiza el campo al traer una carga de prueba q₀ = +1 μC desde infinito hasta ese punto?",
      "El campo objetivo tiene una carga negativa descentrada. A partir del patrón de convergencia de las líneas de campo, deduce en qué cuadrante está la carga y si su magnitud es mayor o menor que la de la configuración base.",
      "Compara visualmente el espaciado de equipotenciales cerca de la carga con el del objetivo. ¿Cómo usas esa diferencia para estimar |q|?"
    ],
    "challenge": {
      "description": "El campo objetivo converge hacia un sumidero negativo descentrado. El fantasma indica posición aproximada y signo (círculo cian). Deduce la magnitud |q| analizando: (1) la densidad de líneas de campo comparada con q=1, (2) el espaciado de equipotenciales. Coloca la carga con el valor correcto y verifica.",
      "target_charges": [
        { "x_m": -1.5, "y_m": 1.0, "q": 4, "sign": -1 }
      ]
    }
  },
  {
    "id": "L03",
    "title": "Dipolo eléctrico: dos cargas opuestas",
    "topic": "principio_superposicion",
    "difficulty": 2,
    "physics_scenario": "Colocar q1 = +5 en (-1, 0) y q2 = -5 en (+1, 0). Visualizar las líneas de campo que nacen en la carga positiva y mueren en la negativa, el plano equipotencial V=0 en x=0, y la estructura típica del dipolo.",
    "charges": [
      { "x_m": -1, "y_m": 0, "q": 5, "sign": 1 },
      { "x_m": 1, "y_m": 0, "q": 5, "sign": -1 }
    ],
    "settings": {
      "zoom": 100,
      "lineDensity": 24,
      "showNodalLines": true,
      "showNullPoints": false,
      "showEquipotentials": true
    },
    "objective": "Analizar la estructura del campo de un dipolo simétrico y predecir cómo cambia la topología cuando las magnitudes son desiguales y la orientación es oblicua.",
    "theory": "Un dipolo eléctrico con cargas ±q separadas por d tiene momento dipolar p = qd dirigido de −q a +q. El campo total es E(r) = E₊(r) + E₋(r) por superposición vectorial. Sobre la mediatriz (perpendicular bisectriz), las componentes axiales se cancelan y queda E antiparalelo a p. A distancias r ≫ d, el campo dipolar decae como 1/r³ (más rápido que el monopolar 1/r²). La línea nodal V=0 es exactamente la mediatriz cuando |q₊| = |q₋|; si las magnitudes son distintas, la línea nodal se desplaza hacia la carga de menor módulo.",
    "hints": [],
    "questions": [
      "En el punto medio entre las dos cargas, calcula E_total vectorialmente usando Coulomb (con q=5, separación total 2 m). Compara el resultado con lo que muestra el vector de campo del simulador en el origen.",
      "Sobre la mediatriz (eje y), demuestra analíticamente que E_y = 0 en todo punto. ¿Qué implica esto sobre la dirección del campo sobre ese eje?",
      "Si en el objetivo las magnitudes son desiguales (|q₊| ≠ |q₋|), la línea nodal V=0 ya no coincide con la mediatriz. Activa la visualización de líneas nodales y mide el desplazamiento. ¿Hacia qué carga se desplaza y por qué?",
      "El potencial en un punto lejano (r ≫ d) sobre la mediatriz es V ≈ −kp·r̂/r². Si en el objetivo p apunta en dirección oblicua, ¿en qué dirección apunta E a gran distancia en el eje x?"
    ],
    "challenge": {
      "description": "El campo objetivo corresponde a un dipolo con magnitudes desiguales y orientación oblicua: los dos fantasmas no están sobre ningún eje cartesiano. La línea nodal V=0 (actívala) no es perpendicular al segmento que une las cargas. Deduce la razón |q₊|/|q₋| a partir del desplazamiento de la línea nodal, coloca las cargas con las magnitudes correctas y calcula el vector momento dipolar resultante p = Σqᵢrᵢ.",
      "target_charges": [
        { "x_m": -2.5, "y_m": 0.8, "q": 3, "sign": 1 },
        { "x_m": 1.5, "y_m": -0.8, "q": 5, "sign": -1 }
      ]
    }
  },
  {
    "id": "L04",
    "title": "Dos cargas iguales: punto nulo entre ellas",
    "topic": "principio_superposicion",
    "difficulty": 2,
    "physics_scenario": "Colocar q1 = +1 en (-2, 0) y q2 = +1 en (+2, 0). Identificar el punto nulo en el origen por simetría y la estructura de campo de repulsión mutua.",
    "charges": [
      { "x_m": -2, "y_m": 0, "q": 1, "sign": 1 },
      { "x_m": 2, "y_m": 0, "q": 1, "sign": 1 }
    ],
    "settings": {
      "zoom": 80,
      "lineDensity": 16,
      "showNodalLines": false,
      "showNullPoints": true,
      "showEquipotentials": true
    },
    "objective": "Localizar puntos nulos del campo mediante superposición vectorial y analizar su estabilidad como punto crítico del potencial.",
    "theory": "Dos cargas del mismo signo producen un punto nulo en el interior del segmento que las une, donde los campos individuales tienen igual magnitud y direcciones opuestas: kq₁/d₁² = kq₂/d₂² con d₁ + d₂ = D (separación total). Para q₁ = q₂ la solución es d₁ = d₂ = D/2 por simetría. El potencial en ese punto es V = k(q₁/d₁ + q₂/d₂) ≠ 0 — el campo nulo no implica potencial nulo. Por el teorema de Earnshaw (consecuencia de ∇²V = 0 en el vacío), el punto nulo es un punto de silla del potencial: estable en una dirección, inestable en la perpendicular.",
    "hints": [],
    "questions": [
      "Calcula el potencial V en el punto nulo (origen) para q₁ = q₂ = 1 μC en x = ±2 m. ¿Es cero? ¿Por qué E = 0 no implica V = 0?",
      "Una carga de prueba +q₀ colocada en el punto nulo sobre el eje x: si se desplaza una distancia δ hacia +x, ¿la fuerza neta la regresa al origen o la aleja? Justifica con la condición kq/(d−δ)² vs kq/(d+δ)².",
      "El objetivo tiene tres fuentes positivas en un triángulo. Con las posiciones que deduces de los fantasmas, escribe la condición vectorial E₁ + E₂ + E₃ = 0 para localizar el punto nulo. ¿Cuántos puntos nulos esperas?",
      "Para tres cargas positivas no colineales, el número de puntos nulos en el plano es n−1 = 2. Activa la visualización y comprueba que hay exactamente dos. ¿Están dentro o fuera del triángulo que forman las cargas?"
    ],
    "challenge": {
      "description": "El campo objetivo presenta tres fuentes positivas en configuración triangular no equilátera. Los dos puntos nulos (actívalos) no son simétricos respecto a ningún eje. Deduce las magnitudes de cada carga a partir de la posición de los puntos nulos: la condición kΣqᵢ/dᵢ² = 0 vectorialmente restringe las razones. Coloca las tres cargas y verifica que los puntos nulos del simulador coincidan con los del objetivo.",
      "target_charges": [
        { "x_m": -3.0, "y_m": 0.0, "q": 2, "sign": 1 },
        { "x_m": 1.0, "y_m": 1.5, "q": 2, "sign": 1 },
        { "x_m": 1.0, "y_m": -1.5, "q": 3, "sign": 1 }
      ]
    }
  },
  {
    "id": "L05",
    "title": "Cargas asimétricas: localización del punto nulo",
    "topic": "principio_superposicion",
    "difficulty": 2,
    "physics_scenario": "Colocar q1 = +4 en (-2, 0) y q2 = +1 en (+2, 0). Predecir analíticamente la posición del punto nulo usando kq₁/d₁² = kq₂/d₂² y verificarlo con el simulador.",
    "charges": [
      { "x_m": -2, "y_m": 0, "q": 4, "sign": 1 },
      { "x_m": 2, "y_m": 0, "q": 1, "sign": 1 }
    ],
    "settings": {
      "zoom": 80,
      "lineDensity": 16,
      "showNodalLines": false,
      "showNullPoints": true,
      "showEquipotentials": true
    },
    "objective": "Localizar el punto nulo entre dos cargas positivas desiguales y usar su posición como dato para inferir la razón de magnitudes de una distribución desconocida.",
    "theory": "El punto nulo entre dos cargas positivas q₁ (en x₁) y q₂ (en x₂) satisface kq₁/d₁² = kq₂/d₂², donde d₁ y d₂ son las distancias de ese punto a cada carga. Esto equivale a d₁/d₂ = √(q₁/q₂). Con d₁ + d₂ = |x₂ − x₁| = D se obtiene d₂ = D/(1 + √(q₁/q₂)), que permite ubicar el punto nulo sin conocer k. Este resultado es un problema inverso útil: si se observa el punto nulo a fracción f del segmento desde q₂, entonces q₁/q₂ = ((1−f)/f)².",
    "hints": [],
    "questions": [
      "Para q₁ = 4 en x = −2 m y q₂ = 1 en x = +2 m, calcula la posición exacta del punto nulo sobre el eje x. Compara con la posición indicada por el simulador.",
      "El objetivo tiene q₁ y q₂ desconocidas. El punto nulo está a fracción f desde la carga derecha respecto al segmento total. Exprésalo: q₁/q₂ en función de f. Mide f en el simulador y calcula la razón.",
      "¿Existe un punto nulo fuera del segmento entre las cargas (en la prolongación del eje x)? Argumenta analíticamente por qué no para dos cargas del mismo signo.",
      "Si q₂ se invierte a −q₂ (manteniendo q₁ > 0), ¿existe punto nulo en el eje x? Si existe, ¿está entre las cargas, a la izquierda o a la derecha? Demuéstralo analíticamente y verifica con el simulador."
    ],
    "challenge": {
      "description": "El campo objetivo tiene dos fuentes positivas sobre el eje x. El punto nulo (actívalo) está ubicado a una fracción f = 1/4 de la separación total medida desde la carga derecha. Usa esta fracción para deducir la razón q₁/q₂ mediante la fórmula q₁/q₂ = ((1−f)/f)². La separación total entre cargas es de 5 m. Determina las posiciones y magnitudes de ambas cargas y verifica que el punto nulo coincide con el objetivo.",
      "target_charges": [
        { "x_m": -2.5, "y_m": 0.0, "q": 9, "sign": 1 },
        { "x_m": 2.5, "y_m": 0.0, "q": 1, "sign": 1 }
      ]
    }
  },
  {
    "id": "L06",
    "title": "Distribución lineal discreta: aproximación a línea cargada",
    "topic": "distribuciones_continuas",
    "difficulty": 3,
    "physics_scenario": "Colocar 5 cargas de +1 equiespaciadas en (-2,0) a (2,0). Observar el campo transversal ~1/r cerca del centro y los efectos de borde en los extremos.",
    "charges": [
      { "x_m": -2, "y_m": 0, "q": 1, "sign": 1 },
      { "x_m": -1, "y_m": 0, "q": 1, "sign": 1 },
      { "x_m": 0,  "y_m": 0, "q": 1, "sign": 1 },
      { "x_m": 1,  "y_m": 0, "q": 1, "sign": 1 },
      { "x_m": 2,  "y_m": 0, "q": 1, "sign": 1 }
    ],
    "settings": {
      "zoom": 80,
      "lineDensity": 16,
      "showNodalLines": false,
      "showNullPoints": false,
      "showEquipotentials": true
    },
    "objective": "Comprender la transición del campo puntual al campo lineal mediante superposición discreta y cuantificar el régimen de validez de cada aproximación.",
    "theory": "Para N cargas iguales alineadas con separación a, el potencial en un punto del eje perpendicular a distancia y del centro es V(y) = kΣq/√(xᵢ²+y²). Cerca del centro con y ≪ L (L = longitud total), la suma converge al resultado de la línea continua: E_⊥(y) ≈ λ/(2πε₀y), donde λ = Nq/L es la densidad lineal. Para y ≫ L, la distribución se ve como una carga puntual: E ≈ kNq/y². La transición ocurre en y ~ L/2. El potencial de la línea finita en puntos del eje perpendicular es V(y) = 2kλ sinh⁻¹(L/2y), que reduce a kNq/y para y ≫ L y a 2kλ ln(L/y) para y ≪ L.",
    "hints": [],
    "questions": [
      "Para la distribución base (5 cargas, q=1, L=4 m), calcula numéricamente V en el punto (0, 1) sumando V_i = kq/r_i para cada carga. Compara con la aproximación de línea continua V ≈ 2kλ sinh⁻¹(L/2y) con λ = 5q/L.",
      "¿A qué distancia y* del eje la distribución de 5 cargas se vuelve indistinguible (error < 5%) de una carga puntual Q=5q? Estima y* del simulador y verifica con la condición y* ≫ L.",
      "El campo objetivo incluye una carga negativa embebida entre positivas. ¿Cómo cambia la forma de las equipotenciales respecto al caso todo-positivo? Deduce la posición y magnitud de la carga negativa antes de leer los fantasmas.",
      "Calcula la carga neta Q_neta del objetivo. Para Q_neta ≠ 0, ¿cómo decae el potencial a gran distancia? Para Q_neta = 0 con momento dipolar p ≠ 0, ¿cómo decae V? Observa las equipotenciales lejanas y clasifica el régimen."
    ],
    "challenge": {
      "description": "El campo objetivo contiene cinco cargas sobre el eje x, pero la distribución no es uniforme: hay al menos una carga de signo negativo. Las equipotenciales centrales presentan una depresión (región de V bajo) rodeada de V alto. Deduce: (1) el número y posición de cada carga, (2) la carga neta Q_neta, (3) el momento dipolar efectivo p = Σqᵢxᵢ. Verifica que tu configuración reproduce la topología del campo objetivo.",
      "target_charges": [
        { "x_m": -2.0, "y_m": 0.0, "q": 2, "sign": 1 },
        { "x_m": -1.0, "y_m": 0.0, "q": 2, "sign": 1 },
        { "x_m":  0.0, "y_m": 0.0, "q": 5, "sign": -1 },
        { "x_m":  1.0, "y_m": 0.0, "q": 2, "sign": 1 },
        { "x_m":  2.0, "y_m": 0.0, "q": 2, "sign": 1 }
      ]
    }
  },
  {
    "id": "L07",
    "title": "Distribución anular discreta: simetría y perturbaciones",
    "topic": "distribuciones_continuas",
    "difficulty": 3,
    "physics_scenario": "8 cargas de +1 sobre círculo de radio 2 m en ángulos 0°, 45°, ..., 315°. Campo nulo en el centro por simetría; comportamiento tipo carga puntual Q=8q lejos del anillo.",
    "charges": [
      { "x_m":  2.000, "y_m":  0.000, "q": 1, "sign": 1 },
      { "x_m":  1.414, "y_m":  1.414, "q": 1, "sign": 1 },
      { "x_m":  0.000, "y_m":  2.000, "q": 1, "sign": 1 },
      { "x_m": -1.414, "y_m":  1.414, "q": 1, "sign": 1 },
      { "x_m": -2.000, "y_m":  0.000, "q": 1, "sign": 1 },
      { "x_m": -1.414, "y_m": -1.414, "q": 1, "sign": 1 },
      { "x_m":  0.000, "y_m": -2.000, "q": 1, "sign": 1 },
      { "x_m":  1.414, "y_m": -1.414, "q": 1, "sign": 1 }
    ],
    "settings": {
      "zoom": 80,
      "lineDensity": 16,
      "showNodalLines": false,
      "showNullPoints": true,
      "showEquipotentials": true
    },
    "objective": "Cuantificar cómo una perturbación monopolar en una distribución anular rompe la simetría, desplaza el punto nulo y genera un momento dipolar residual medible.",
    "theory": "En el anillo simétrico de N cargas iguales, el campo en el centro es E=0 exactamente porque cada carga tiene una pareja antipodal que cancela su contribución. Si se reemplaza una carga q₀ por q₀ + Δq, la simetría se rompe y el punto nulo se desplaza desde el origen. El desplazamiento δ puede estimarse linealizando: δ ≈ R·Δq/(N·q₀) para Δq ≪ Nq₀. El momento dipolar residual es |p| = Δq·R, donde R es el radio del anillo. A distancias r ≫ R, el campo pasa de cuadrupolar (escala como 1/r³ para N≥3 con igual carga) a dipolar (1/r²) cuando la perturbación domina.",
    "hints": [],
    "questions": [
      "Para el anillo simétrico (8 cargas, q=1, R=2 m), demuestra que E=0 en el origen emparejando cada carga con su antipodal. ¿La demostración requiere conocer k?",
      "En el objetivo una carga tiene magnitud Δq adicional respecto a las demás. Mide el desplazamiento δ del punto nulo respecto al origen. Usa δ ≈ R·Δq/(N·q₀) para estimar Δq y compara con el tamaño del fantasma.",
      "Calcula el momento dipolar residual p = Δq·R para la perturbación estimada. ¿En qué dirección apunta p? ¿Coincide con la dirección del desplazamiento del punto nulo?",
      "Para r ≫ R, el potencial del anillo perturbado es V ≈ kNq/r + kp·cos(θ)/r². ¿Cómo cambia la tasa de decaimiento del campo respecto al anillo perfecto? Observa las equipotenciales lejanas."
    ],
    "challenge": {
      "description": "El campo objetivo corresponde a un anillo de 8 cargas positivas sobre un círculo de radio 2 m, pero con simetría rota: una de las cargas tiene magnitud diferente. El punto nulo (actívalo) se ha desplazado del origen. Determina: (1) qué carga (posición angular) tiene la perturbación, (2) su magnitud Δq, usando el desplazamiento del punto nulo y la relación δ ≈ R·Δq/(N·q₀). Coloca las 8 cargas con las magnitudes correctas y verifica el desplazamiento del punto nulo.",
      "target_charges": [
        { "x_m":  2.000, "y_m":  0.000, "q": 4, "sign": 1 },
        { "x_m":  1.414, "y_m":  1.414, "q": 1, "sign": 1 },
        { "x_m":  0.000, "y_m":  2.000, "q": 1, "sign": 1 },
        { "x_m": -1.414, "y_m":  1.414, "q": 1, "sign": 1 },
        { "x_m": -2.000, "y_m":  0.000, "q": 1, "sign": 1 },
        { "x_m": -1.414, "y_m": -1.414, "q": 1, "sign": 1 },
        { "x_m":  0.000, "y_m": -2.000, "q": 1, "sign": 1 },
        { "x_m":  1.414, "y_m": -1.414, "q": 1, "sign": 1 }
      ]
    }
  },
  {
    "id": "L08",
    "title": "Reto de ingeniería: inferencia inversa de distribución cuadrupolar",
    "topic": "reto_diseno",
    "difficulty": 4,
    "physics_scenario": "Cuadrupolo planar: +5 en (±2, 0), -5 en (0, ±2). Momento dipolar nulo, cuadrupolar no nulo. Punto nulo en origen, líneas nodales en y=±x. Referencia para que el estudiante diseñe variantes con simetría rota.",
    "charges": [
      { "x_m":  2, "y_m":  0, "q": 5, "sign":  1 },
      { "x_m": -2, "y_m":  0, "q": 5, "sign":  1 },
      { "x_m":  0, "y_m":  2, "q": 5, "sign": -1 },
      { "x_m":  0, "y_m": -2, "q": 5, "sign": -1 }
    ],
    "settings": {
      "zoom": 90,
      "lineDensity": 24,
      "showNodalLines": true,
      "showNullPoints": true,
      "showEquipotentials": true
    },
    "objective": "Reconstruir una distribución de carga desconocida a partir de su topología de campo e identificar los invariantes multipolares que caracterizan la configuración.",
    "theory": "La expansión multipolar del potencial es V(r) = k[Q/r + p·r̂/r² + Σᵢⱼ Qᵢⱼ rᵢrⱼ/(2r⁴) + …]. Para una distribución neutra (Q=0) con momento dipolar p=0, el término dominante lejano es cuadrupolar: V ~ 1/r³, E ~ 1/r⁴. El tensor cuadrupolar Qᵢⱼ = Σₙ qₙ(3rₙᵢrₙⱼ − r²ₙδᵢⱼ)/2 determina la topología del campo. Las líneas nodales V=0 son las curvas donde la suma de potenciales de todas las cargas se anula: dividen el plano en regiones de V>0 y V<0. El teorema de Earnshaw (∇²V = 0 en el vacío) garantiza que ningún punto nulo de E puede ser mínimo estable de energía potencial: siempre es un punto de silla.",
    "hints": [],
    "questions": [
      "Verifica que el momento dipolar p = Σqᵢrᵢ = 0 para el cuadrupolo de referencia. ¿Qué condición de simetría garantiza p=0 sin necesidad de calcular la suma?",
      "Demuestra que V=0 sobre la recta y=x tomando un punto genérico (a,a): empareja cada carga +5 con una −5 equidistante a (a,a) y muestra que sus contribuciones se cancelan por pares. ¿Esta demostración se mantiene si las magnitudes son distintas?",
      "El campo objetivo tiene simetría rota: los dos fantasmas negativos tienen magnitudes distintas. Esto implica p ≠ 0. Estima |p| a partir del desplazamiento de las líneas nodales respecto a y=±x y verifica que la dirección de p es consistente con la asimetría.",
      "Usando ∇²V = 0 (ecuación de Laplace), argumenta por qué el potencial no puede tener un mínimo local en el punto nulo. ¿Qué tipo de punto crítico es (mínimo, máximo, silla)? ¿Cómo lo confirmas observando las equipotenciales alrededor del punto nulo?"
    ],
    "challenge": {
      "description": "El campo objetivo tiene topología cuadrupolar con simetría rota: las cuatro cargas no son de igual magnitud. La carga neta es Q_neta = 0 pero el momento dipolar p ≠ 0: las líneas nodales V=0 (actívalas) no coinciden exactamente con y=±x. A partir de la desviación angular de las líneas nodales y la posición del punto nulo, determina las magnitudes de las cuatro cargas. Verifica que tu configuración satisface Q_neta = 0. El teorema de Earnshaw garantiza que el punto nulo es un punto de silla — compruébalo observando las equipotenciales.",
      "target_charges": [
        { "x_m":  2.0, "y_m":  0.0, "q": 5, "sign":  1 },
        { "x_m": -2.0, "y_m":  0.0, "q": 5, "sign":  1 },
        { "x_m":  0.0, "y_m":  2.0, "q": 3, "sign": -1 },
        { "x_m":  0.0, "y_m": -2.0, "q": 7, "sign": -1 }
      ]
    }
  }
];
