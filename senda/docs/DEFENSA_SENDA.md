# DOCUMENTO DE DEFENSA DE PROYECTO
## SENDA — Sistema Estratégico de Normalización y Desarrollo Académico
### Ingeniería de Sistemas | Convocatoria Abril 2026

---

> **Examen oral:** Jueves 30 de abril de 2026, 9:30 AM  
> **Prueba 1 (Obligatoria):** Metodología de Diseño de Sistemas I y II  
> **Eje Común:** Formulación y Evaluación de Proyectos  

---

# PARTE I — DOCUMENTACIÓN FORMAL DEL PROYECTO
*(Formato requerido por la convocatoria)*

---

## 1. INTRODUCCIÓN

SENDA (Sistema Estratégico de Normalización y Desarrollo Académico) es una plataforma web diseñada para automatizar la gestión de horas de becados en entornos académicos universitarios. El sistema digitaliza el proceso completo de registro, aprobación y pago de horas trabajadas por estudiantes que forman parte de programas de becas institucionales.

La plataforma cubre el ciclo de vida completo de una hora trabajada: desde que el estudiante ficha su entrada en un quiosco físico, pasando por la aprobación del jefe de departamento, hasta el cálculo y procesamiento del pago por parte del área contable. Todo esto con trazabilidad completa, notificaciones por correo electrónico y reportes exportables.

El presente documento describe la arquitectura, metodología, justificación técnica y análisis del proyecto conforme a los lineamientos del programa de Ingeniería de Sistemas de la UNADECA, siguiendo los estándares de Formulación y Evaluación de Proyectos y los principios de Metodología de Diseño de Sistemas.

---

## 2. IDENTIFICACIÓN DEL PROYECTO (ANTECEDENTES)

### 2.1 Contexto histórico

En muchas instituciones universitarias latinoamericanas, los programas de becas-trabajo permiten que estudiantes de escasos recursos financien parte de sus estudios a cambio de prestar servicios en departamentos de la institución. Este modelo, vigente desde décadas, históricamente se ha administrado con registros en papel, hojas de cálculo de Excel y procesos manuales propensos a errores.

El problema principal de este enfoque manual es la falta de trazabilidad: los directivos desconocen en tiempo real cuántas horas se están trabajando, no existe un registro de auditoría confiable, los cálculos de pago son lentos y la comunicación entre departamentos, área contable y estudiantes es fragmentada.

### 2.2 Contexto actual

Con la adopción masiva de tecnología web y la disponibilidad de plataformas modernas como Supabase (PostgreSQL en la nube con autenticación integrada), existe hoy la viabilidad técnica para reemplazar los procesos manuales con un sistema digital de bajo costo de operación, alta disponibilidad y con capacidad de crecer conforme la institución lo requiera.

SENDA nació como respuesta directa a esta necesidad: digitalizar y centralizar la gestión de horas de becados, reduciendo la carga administrativa, eliminando errores humanos y proveyendo información en tiempo real a todos los actores involucrados.

---

## 3. JUSTIFICACIÓN

### 3.1 Impacto técnico

- **Automatización del flujo de aprobación:** Elimina la dependencia de formularios en papel y aprobaciones verbales. Cada hora trabajada queda registrada electrónicamente con su estado (PENDIENTE → APROBADO → PROCESADO) y auditoría completa (quién aprobó, cuándo, desde dónde).
- **Seguridad a nivel de base de datos:** La implementación de Row-Level Security (RLS) en PostgreSQL garantiza que cada actor del sistema solo accede a los datos que le corresponden por su rol, sin depender exclusivamente de validaciones en la capa de aplicación.
- **Tiempo real:** La integración de Supabase Realtime permite que los quioscos físicos muestren actualizaciones en vivo del estado de las sesiones activas, sin necesidad de recargar la página.
- **Escalabilidad:** La arquitectura backend está diseñada en capas (rutas → controlador → servicio → repositorio) permitiendo agregar nuevas funcionalidades sin modificar código existente.

### 3.2 Impacto social

- Los estudiantes becados tienen visibilidad directa de sus horas acumuladas, estado de aprobación y monto neto a recibir, eliminando la opacidad y fomentando la confianza institucional.
- Los jefes de departamento pueden gestionar sus equipos eficientemente sin depender de intermediarios.

### 3.3 Impacto económico

- Reduce el tiempo dedicado a cálculos manuales de planilla (de horas por semana a minutos).
- Minimiza errores de cálculo que pueden resultar en pagos incorrectos.
- La solución utiliza tecnología de código abierto (Node.js, React, PostgreSQL) y servicios freemium (Supabase, GitHub Pages), reduciendo los costos de infraestructura a casi cero en la etapa inicial.

---

## 4. FINALIDAD Y OBJETIVOS

### 4.1 Finalidad

Proveer a la UNADECA (y a instituciones similares) de un sistema digital centralizado que garantice transparencia, trazabilidad y eficiencia en la administración del programa de becas-trabajo estudiantil.

### 4.2 Objetivo General

Desarrollar e implementar una plataforma web full-stack que automatice el ciclo completo de gestión de horas de becados: desde el registro en quiosco físico hasta el procesamiento del pago, integrando roles diferenciados con seguridad a nivel de base de datos y notificaciones automatizadas.

### 4.3 Objetivos Específicos

1. **Diseñar** un esquema de base de datos relacional normalizado con PostgreSQL que soporte múltiples roles de usuario, flujo de estados para registros de horas y configuración contable parametrizable.
2. **Implementar** un API REST con Node.js/Express.js estructurado por características (feature-based) con autenticación JWT delegada a Supabase Auth.
3. **Desarrollar** una interfaz de usuario React/TypeScript con portales diferenciados por rol (5 roles: Super Admin, Admin, Jefe de Departamento, Estudiante, Contabilidad) y un módulo de quiosco en tiempo real.
4. **Integrar** un sistema de notificaciones por correo electrónico vía SMTP para eventos críticos del sistema (creación de cuenta, restablecimiento de contraseña, activación/desactivación de cuenta).
5. **Configurar** un pipeline de despliegue con Docker para el backend y GitHub Actions para el frontend, garantizando despliegues reproducibles.

---

## 5. PROBLEMA

### 5.1 Descripción detallada de la situación

El programa de becas-trabajo de la institución involucra a múltiples actores (estudiantes, jefes de departamento, área contable, administración) que interactúan en un proceso secuencial de aprobación de horas. Sin un sistema centralizado, este proceso sufre de:

- **Registros duplicados o inconsistentes:** Múltiples versiones del mismo registro en diferentes formatos.
- **Falta de visibilidad en tiempo real:** Ni los estudiantes ni los administradores pueden consultar el estado actual de las horas trabajadas.
- **Procesos de pago lentos:** El cálculo manual de planillas toma días y está sujeto a errores aritméticos.
- **Ausencia de auditoría:** No existe registro de quién aprobó qué y cuándo.
- **Control de acceso deficiente:** Cualquier persona con acceso a la hoja de cálculo puede modificar datos.

### 5.2 Metodología empleada en la solución

Para resolver este problema, se aplicó la metodología **SCRUM** en un esquema adaptado (dadas las limitaciones de tiempo y equipo reducido), con iteraciones (sprints) de 1-2 semanas enfocadas en funcionalidades verticales completas (desde base de datos hasta interfaz). Las fases fueron:

1. **Sprint 0 — Fundación:** Esquema de base de datos, autenticación, estructura de proyecto.
2. **Sprint 1 — Usuarios y Departamentos:** CRUD completo con roles y permisos.
3. **Sprint 2 — Registros de Horas:** Flujo PENDIENTE → APROBADO → PROCESADO.
4. **Sprint 3 — Quiosco:** Módulo de fichado en tiempo real.
5. **Sprint 4 — Contabilidad y Reportes:** Configuración contable, planillas, exportaciones.
6. **Sprint 5 — Refinamiento:** Correo electrónico, primer inicio de sesión, pruebas.

---

## 6. DEFINICIÓN DEL PROBLEMA EN SU ENTORNO

El problema se manifiesta en el área administrativa de la institución universitaria, específicamente en la coordinación entre:

- **Departamentos académicos** que emplean estudiantes becados y necesitan aprobar sus horas.
- **Área contable** que necesita calcular y procesar pagos periódicos.
- **Dirección académica/administrativa** que necesita visibilidad global del programa.
- **Los propios estudiantes** que necesitan transparencia sobre sus horas y pagos.

La solución SENDA se despliega como una aplicación web accesible desde cualquier dispositivo con navegador, reduciendo la fricción de adopción al mínimo.

---

## 7. DELIMITACIÓN DEL PROBLEMA

**Límite espacial:** El sistema está diseñado para operar dentro de los sistemas informáticos de una institución universitaria. El despliegue actual cubre la UNADECA, pero la arquitectura es multi-tenant-ready.

**Límite temporal:** El proyecto abarca el ciclo de vida del programa de becas por semestre/cuatrimestre. Los registros históricos se conservan indefinidamente en la base de datos.

**Límite teórico:** SENDA no cubre la gestión académica general (notas, matrículas, etc.) ni la gestión de recursos humanos del personal contratado. Se limita exclusivamente al programa de becas-trabajo estudiantil.

---

## 8. ALCANCES

El proyecto cubre:

- ✅ Gestión completa de usuarios con 5 roles diferenciados.
- ✅ CRUD de departamentos con centro de costo.
- ✅ Registro de horas manual (desde el portal del estudiante) y automático (vía quiosco).
- ✅ Flujo de aprobación de horas (Pendiente → Aprobado/Rechazado → Procesado).
- ✅ Módulo de quiosco con actualizaciones en tiempo real.
- ✅ Portal contable con cálculo de planillas (bruto, diezmo, neto) por ciclo o cuatrimestre.
- ✅ Exportación de reportes a CSV y PDF.
- ✅ Sistema de notificaciones por correo electrónico.
- ✅ Forzado de cambio de contraseña en el primer inicio de sesión.
- ✅ Despliegue con Docker (backend) y GitHub Pages (frontend).

El proyecto **no** cubre (fuera del alcance):
- ❌ Aplicación móvil nativa.
- ❌ Integración con sistemas de nómina externos.
- ❌ Gestión académica general (notas, matrículas).

---

## 9. ANÁLISIS FODA

| | **Positivo** | **Negativo** |
|---|---|---|
| **Interno** | **FORTALEZAS** | **DEBILIDADES** |
| | Arquitectura limpia y escalable (feature-based) | Dependencia de Supabase como proveedor único de base de datos y autenticación |
| | Seguridad robusta con RLS a nivel de BD | El frontend almacena el JWT en localStorage (vulnerable a XSS si no se aplica CSP) |
| | Roles claramente definidos con permisos granulares | Aún no cuenta con pruebas de integración end-to-end completas |
| | Código 100% TypeScript en el frontend (tipado estático) | El sistema de quiosco requiere conexión estable a internet |
| | Despliegue reproducible con Docker | |
| | Costo operativo muy bajo (stack open-source + freemium) | |
| **Externo** | **OPORTUNIDADES** | **AMENAZAS** |
| | Expansión a otras instituciones con el mismo modelo de becas | Cambios en las políticas de precios de Supabase |
| | Integración futura con sistemas de pago electrónico | Pérdida de conectividad en el campus afecta el quiosco |
| | Módulo de reportes avanzados con BI | Resistencia al cambio por parte del personal administrativo |
| | API ya estructurada para exponer a apps móviles | Ataques de fuerza bruta al endpoint de login (mitigable con rate limiting) |

---

## 10. MARCO DE REFERENCIA

### 10.1 Marco Institucional

La UNADECA (Universidad Adventista de Centro América) opera un programa de becas-trabajo en el que estudiantes prestan servicios a diferentes departamentos de la universidad a cambio de beneficios económicos. Este programa requiere control preciso de horas, aprobaciones departamentales y procesamiento periódico de pagos.

SENDA fue concebido específicamente para este contexto, respetando la estructura organizacional existente (Super Admin > Admin > Jefe de Departamento > Contabilidad > Estudiante) y adaptándose al ciclo de pago vigente (corte el día 25 de cada mes).

### 10.2 Marco Teórico

#### Tecnologías y su justificación

**PostgreSQL con Supabase**
PostgreSQL es el sistema de gestión de bases de datos relacionales (RDBMS) de código abierto más avanzado del mundo. Se eligió por su soporte nativo a tipos de datos avanzados (JSONB, ENUM, UUID), Row-Level Security, triggers y funciones almacenadas. Supabase añade una capa de Backend-as-a-Service que proporciona autenticación JWT, API REST automática, y Realtime (basado en el protocolo de cambios de PostgreSQL) sin costo adicional para proyectos pequeños.

**Node.js con Express.js**
Node.js es un entorno de ejecución JavaScript del lado del servidor basado en el motor V8 de Google Chrome. Su modelo de I/O no bloqueante lo hace eficiente para APIs web donde la mayoría de operaciones son llamadas a base de datos o servicios externos. Express.js es el framework web minimalista más popular del ecosistema Node.js, elegido por su flexibilidad y la claridad que ofrece para construir APIs RESTful.

**React con TypeScript**
React es la biblioteca de interfaz de usuario más utilizada en la industria (creada por Meta). Su modelo basado en componentes reutilizables, el Virtual DOM y el ecosistema de hooks facilitan la construcción de SPAs (Single Page Applications) complejas. TypeScript agrega tipado estático sobre JavaScript, lo que permite detectar errores en tiempo de compilación y hace el código más mantenible.

**Vite**
Vite es una herramienta de construcción de nueva generación para proyectos web. A diferencia de Webpack, Vite sirve módulos ES nativos durante el desarrollo, resultando en tiempos de inicio y recarga en caliente (HMR) hasta 10x más rápidos. Para producción genera bundles optimizados con Rollup.

**Docker**
Docker es una plataforma de contenerización que empaqueta la aplicación junto con todas sus dependencias en un contenedor ligero y reproducible. Esto garantiza que el backend se comportará igual en desarrollo, staging y producción, eliminando el clásico problema "en mi máquina funciona".

**Tailwind CSS**
Framework CSS de utilidades que permite construir interfaces complejas directamente en el HTML/JSX sin escribir CSS personalizado. Genera un bundle CSS mínimo en producción al eliminar clases no utilizadas (purge).

**JWT (JSON Web Tokens)**
Estándar de la industria para autenticación stateless. Un JWT firmado por el servidor contiene los datos del usuario y su rol codificados en Base64. El backend valida la firma criptográfica del token en cada petición sin necesidad de consultar la base de datos para verificar la sesión.

**Row-Level Security (RLS)**
Característica de PostgreSQL que permite definir políticas de acceso a nivel de fila. Por ejemplo, la política "un estudiante solo puede ver sus propias horas" se define una vez en la base de datos y se aplica automáticamente para todas las consultas que lleguen con las credenciales de ese estudiante, independientemente de si la validación en el backend falla o no. Esto es defensa en profundidad.

**Patrón Repository**
Patrón de diseño de software que abstrae el acceso a la fuente de datos (en este caso Supabase) detrás de una interfaz. El servicio de negocio llama al repositorio sin conocer si los datos vienen de PostgreSQL, MongoDB u otra fuente. Facilita las pruebas unitarias (se puede mockear el repositorio) y el cambio de proveedor de datos sin modificar la lógica de negocio.

**Arquitectura Feature-Based**
En lugar de organizar el código por tipo de archivo (todos los controladores juntos, todos los servicios juntos), en SENDA el código se organiza por característica del dominio: `features/auth/`, `features/users/`, `features/workLogs/`, etc. Cada característica es un módulo cohesivo y autónomo. Este enfoque escala mejor que la arquitectura por capas en proyectos medianos y grandes.

---

## 11. PRODUCTOS Y RESULTADOS ESPERADOS

### 11.1 Entregables del sistema

| # | Entregable | Descripción |
|---|---|---|
| 1 | **API REST** | 31 endpoints documentados agrupados en 8 módulos de negocio |
| 2 | **Aplicación Web** | SPA con 6 portales diferenciados por rol |
| 3 | **Base de datos** | Esquema PostgreSQL con 8 tablas, 2 enums, 9 migraciones, triggers y RLS |
| 4 | **Módulo de quiosco** | Pantalla de fichado en tiempo real, activable por departamento |
| 5 | **Sistema de correo** | 4 plantillas HTML responsive vía SMTP |
| 6 | **Reportes exportables** | Planillas en CSV y PDF con filtros por período y departamento |
| 7 | **Contenedor Docker** | Imagen reproducible del backend lista para despliegue |
| 8 | **Pipeline CI/CD** | GitHub Actions para despliegue automático del frontend en GitHub Pages |

### 11.2 Documentación técnica

- BACKEND_SPEC.md (especificación completa del API, +1600 líneas)
- CHANGELOG.md (historial de cambios por versión)
- El presente documento de defensa

### 11.3 Métricas del proyecto

| Métrica | Valor |
|---|---|
| Archivos TypeScript/TSX (frontend) | ~101 archivos |
| Archivos JavaScript MJS (backend) | ~55 archivos |
| Endpoints REST | 31 |
| Tablas en base de datos | 8 |
| Migraciones SQL | 9 |
| Roles de usuario | 5 |
| Plantillas de correo | 4 |
| Commits en git | >20 commits descriptivos |

---

## 12. COBERTURA DEL PROYECTO

**Beneficiarios directos:**
- **Estudiantes becados:** Transparencia total sobre sus horas, estado de aprobación y pagos.
- **Jefes de departamento:** Herramienta digital para gestionar y aprobar horas sin papeleo.
- **Área contable:** Dashboard con cálculos automáticos de planilla y exportaciones.
- **Dirección/Administración:** Vista global de todos los departamentos, horas y costos.

**Beneficiarios indirectos:**
- La institución en general, al reducir el tiempo administrativo y eliminar errores en el procesamiento de pagos.

**Alcance geográfico:** Instalación local o nube, accesible desde cualquier dispositivo con navegador web dentro de la red institucional o desde internet.

---

## 13. FUENTES BIBLIOGRÁFICAS (Formato IEEE)

[1] R. Pressman, *Ingeniería del Software: Un Enfoque Práctico*, 7ma ed. México D.F.: McGraw-Hill, 2010.

[2] A. Vizcaíno, F. O. García, y M. Piattini, *Desarrollo Global de Software*. Proquest Ebook Central, 2014. [En línea]. Disponible: https://ebookcentral.proquest.com

[3] J. Monte, *Implantar Scrum con Éxito*. Proquest Ebook Central, 2016. [En línea]. Disponible: https://ebookcentral.proquest.com

[4] J. Gido y J. Clements, *Administración Exitosa de Proyectos*, 5ta ed. México D.F.: Cengage Learning, 2012.

[5] Supabase Inc., "Supabase Documentation," *Supabase*, 2024. [En línea]. Disponible: https://supabase.com/docs

[6] OpenJS Foundation, "Node.js Documentation," *Node.js*, 2024. [En línea]. Disponible: https://nodejs.org/en/docs

[7] Meta Platforms, "React Documentation," *React*, 2024. [En línea]. Disponible: https://react.dev

[8] Docker Inc., "Docker Documentation," *Docker*, 2024. [En línea]. Disponible: https://docs.docker.com

[9] M. Jones, J. Bradley, y N. Sakimura, "JSON Web Token (JWT)," *RFC 7519*, Internet Engineering Task Force (IETF), May 2015. [En línea]. Disponible: https://tools.ietf.org/html/rfc7519

[10] The PostgreSQL Global Development Group, "PostgreSQL 16 Documentation: Row Security Policies," *PostgreSQL*, 2024. [En línea]. Disponible: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

---

# PARTE II — PRUEBA 1: METODOLOGÍA DE DISEÑO DE SISTEMAS
*(Temas que el jurado evaluará en el examen oral)*

---

## TEMA 1: ENTENDER EL SOFTWARE COMO UN PROYECTO

### ¿Qué es un software?

Un software es un conjunto de programas, datos y documentación que, en conjunto, permiten a un computador realizar tareas específicas. No es solo código: incluye los requisitos, el diseño, las pruebas, los manuales y todo el proceso que lo produce.

**En SENDA:** El software es la plataforma web completa (frontend + backend + base de datos + documentación + configuración de despliegue), no solo los archivos de código fuente.

### Aspectos que componen un software

Según Pressman, un software tiene tres componentes fundamentales:

1. **Instrucciones (programas):** El código ejecutable. En SENDA: los archivos `.mjs` del backend y `.tsx` del frontend.
2. **Estructuras de datos:** La información que manipula el programa. En SENDA: las tablas PostgreSQL (`profiles`, `work_logs`, `departments`, etc.) y los tipos TypeScript (`User`, `WorkLog`, `Department`).
3. **Documentación:** Describes el funcionamiento. En SENDA: `BACKEND_SPEC.md`, los comentarios en código, este documento.

### Actividades del ingeniero de software

- **Comunicación:** Levantamiento de requerimientos con los stakeholders (administración, jefes de dpto, contabilidad, estudiantes).
- **Planeación:** Estimación de esfuerzo, cronograma, identificación de riesgos.
- **Modelado:** Diagramas de arquitectura, modelo de base de datos, casos de uso.
- **Construcción:** Codificación y pruebas unitarias.
- **Despliegue:** Entrega e instalación en el entorno del cliente.

### Elementos de un proyecto de software

- **Alcance:** Lo que el sistema hará (y lo que no hará).
- **Tiempo:** Cronograma con hitos y fechas de entrega.
- **Costo:** Recursos humanos, infraestructura, licencias.
- **Calidad:** Criterios de aceptación, métricas de calidad.
- **Riesgo:** Eventos que pueden afectar el proyecto negativamente.

---

## TEMA 2: METODOLOGÍAS Y CICLOS DE VIDA

### El proceso de desarrollo

El proceso de desarrollo de software es el conjunto de actividades estructuradas necesarias para transformar los requerimientos del usuario en un producto de software funcional. Incluye: comunicación, planeación, modelado, construcción y despliegue.

### El ciclo de vida de un software

El ciclo de vida de un software abarca todas las etapas desde la concepción hasta el retiro:

1. Definición de requerimientos
2. Diseño del sistema
3. Implementación (codificación)
4. Verificación y pruebas
5. Mantenimiento

### Metodologías tradicionales vs ágiles

| Característica | Tradicional (ej. Cascada) | Ágil (ej. SCRUM) |
|---|---|---|
| Planificación | Total al inicio | Iterativa y adaptable |
| Entrega | Al final del proyecto | Incremental (cada sprint) |
| Documentación | Extensa y formal | Suficiente y útil |
| Cambios | Costosos y difíciles | Bienvenidos y gestionados |
| Cliente | Involucrado al inicio y al final | Involucrado en cada sprint |

**¿Por qué se eligió SCRUM para SENDA?**
Porque los requerimientos no estaban completamente definidos al inicio (algo normal en proyectos donde el cliente aprende junto con el desarrollador), y porque el equipo era pequeño. SCRUM permite entregar valor de forma incremental y ajustar el rumbo según el feedback recibido.

### SCRUM en detalle

SCRUM es un framework ágil para desarrollar y mantener productos complejos. Sus elementos clave son:

**Roles:**
- **Product Owner:** Define y prioriza el Product Backlog. En SENDA: la dirección de la institución.
- **Scrum Master:** Facilita el proceso, remueve impedimentos. En SENDA: el desarrollador principal.
- **Development Team:** Construye el producto. En SENDA: el equipo de desarrollo.

**Artefactos:**
- **Product Backlog:** Lista priorizada de todas las funcionalidades deseadas. Ej: "Como estudiante quiero ver mis horas acumuladas por ciclo."
- **Sprint Backlog:** Subconjunto del Product Backlog seleccionado para el sprint actual.
- **Incremento:** El software funcional entregado al final de cada sprint.

**Eventos:**
- **Sprint Planning:** Qué se hará en el siguiente sprint.
- **Daily Scrum:** Reunión diaria de 15 minutos (¿qué hice? ¿qué haré? ¿hay impedimentos?).
- **Sprint Review:** Demo del incremento al Product Owner.
- **Sprint Retrospective:** ¿Qué mejorar en el proceso?

**Aplicación en SENDA:**
Los sprints se organizaron por módulos verticales completos:
- Sprint 0: Base de datos + Autenticación
- Sprint 1: Usuarios + Departamentos
- Sprint 2: Registro de Horas + Flujo de Aprobación
- Sprint 3: Quiosco en tiempo real
- Sprint 4: Contabilidad + Reportes
- Sprint 5: Correo electrónico + Cambio de contraseña + Refinamiento

---

## TEMA 3: ADMINISTRACIÓN DEL PROYECTO

### Tareas de administración

1. **Definición del alcance:** Qué entregará el sistema (se documentó en BACKEND_SPEC.md y este documento).
2. **Estimación:** Cuánto tiempo y recursos requiere cada funcionalidad.
3. **Planificación:** Cronograma de sprints con fechas y entregables.
4. **Monitoreo:** Revisión del avance en cada sprint review.
5. **Control de cambios:** Gestión de nuevos requerimientos durante el desarrollo.

### Estimaciones

Para estimar el esfuerzo en SENDA se utilizó el enfoque de **puntos de historia** (Story Points) adaptado informalmente:

- Funcionalidades simples (ej. listar departamentos): 1-2 puntos
- Funcionalidades medias (ej. flujo de aprobación de horas): 5-8 puntos
- Funcionalidades complejas (ej. módulo de quiosco con tiempo real): 13+ puntos

### Planificación

La planificación se realizó con un **Product Backlog** priorizado por valor de negocio:
1. Primero lo crítico: autenticación segura y gestión de usuarios (sin esto nada funciona).
2. Luego el núcleo: registro y aprobación de horas (el corazón del negocio).
3. Después el valor agregado: quiosco, reportes, contabilidad.
4. Finalmente el refinamiento: correo electrónico, cambio de contraseña, optimizaciones.

---

## TEMA 4: ANÁLISIS Y DISEÑO

### Actividades del análisis

El análisis consiste en comprender **QUÉ** debe hacer el sistema, sin entrar en cómo lo hará.

En SENDA, las actividades de análisis incluyeron:

1. **Identificación de actores:** Super Admin, Admin, Jefe de Departamento, Estudiante, Contabilidad, Quiosco.
2. **Requerimientos funcionales:**
   - Los estudiantes pueden registrar horas trabajadas.
   - Los jefes de departamento pueden aprobar o rechazar horas.
   - El área contable puede procesar pagos por período.
   - El sistema debe enviar notificaciones por correo en eventos críticos.
3. **Requerimientos no funcionales:**
   - Seguridad: JWT + RLS en base de datos.
   - Rendimiento: Respuesta < 500ms para el 95% de las peticiones.
   - Disponibilidad: 99.5% uptime (garantizado por Supabase).
   - Usabilidad: UI intuitiva sin necesidad de capacitación extensa.

### Actividades del diseño

El diseño consiste en definir **CÓMO** el sistema cumplirá los requerimientos del análisis.

En SENDA, las actividades de diseño incluyeron:

1. **Diseño de la arquitectura:** Tres capas (Frontend SPA + Backend API REST + Base de datos PostgreSQL).
2. **Diseño de la base de datos:** Esquema relacional normalizado (ver Parte I, Sección 10).
3. **Diseño de la API:** 31 endpoints RESTful con nomenclatura consistente.
4. **Diseño de la interfaz:** Portales diferenciados por rol con componentes reutilizables.
5. **Diseño de seguridad:** RLS policies, JWT middleware, CORS configurado.

### Diferencias entre análisis y diseño

| | **Análisis** | **Diseño** |
|---|---|---|
| Pregunta | ¿QUÉ debe hacer? | ¿CÓMO lo hará? |
| Nivel | Dominio del negocio | Solución técnica |
| Resultado | Requerimientos, casos de uso | Arquitectura, esquemas, APIs |
| Validación con | El cliente/usuario | El equipo técnico |

### Análisis estructurado vs orientado a objetos

**Análisis estructurado (tradicional):**
- Se centra en los procesos y el flujo de datos.
- Herramientas: DFD (Diagramas de Flujo de Datos), diagramas de contexto.
- Adecuado para sistemas con lógica secuencial bien definida.

**Análisis orientado a objetos (moderno):**
- Se centra en los objetos del dominio y sus interacciones.
- Herramientas: Diagramas de clase UML, diagramas de secuencia, casos de uso.
- Adecuado para sistemas complejos con múltiples actores y comportamientos.

**SENDA usó el enfoque orientado a objetos:**
- Los **objetos del dominio** son: `User`, `Department`, `WorkLog`, `HourlyRate`, `KioskState`, `AccountingConfig`.
- Cada objeto tiene **atributos** (datos) y **comportamientos** (operaciones disponibles según el rol).
- Las **interacciones** entre objetos siguen el flujo del negocio: un `WorkLog` pertenece a un `User` (estudiante) en un `Department`, tiene un estado que cambia cuando otros `User` (jefe de dpto, contabilidad) interactúan con él.

---

## TEMA 5: CODIFICACIÓN, PRUEBAS Y MANTENIMIENTO

### Técnicas de prueba de código

**Pruebas unitarias:** Verifican una unidad aislada de código (una función, un método).
- En SENDA frontend: `lib/__tests__/` contiene pruebas para la lógica de ciclos de facturación (`business.ts`) con Vitest.
- Ejemplo: verificar que el cálculo de ciclo sea correcto para fechas antes y después del día 25.

**Pruebas de integración:** Verifican que múltiples componentes funcionan correctamente juntos.
- En SENDA backend: pruebas que verifican que el servicio de usuarios interactúa correctamente con el repositorio Supabase.

**Pruebas de sistema (end-to-end):** Simulan el comportamiento real del usuario.
- En SENDA: pruebas manuales del flujo completo: login → registro de horas → aprobación → procesamiento de pago.

### Estrategias de pruebas

**Caja negra (Black-box):** Se prueba el comportamiento del sistema sin conocer su implementación interna.
- Ej: Enviar una petición POST a `/api/v1/auth/login` con credenciales inválidas y verificar que retorna 401.

**Caja blanca (White-box):** Se prueba el código interno conociendo su implementación.
- Ej: Verificar que la función `getBillingCycle(date)` ejecuta la rama correcta para fechas >= día 26.

**Pruebas de regresión:** Verifican que los cambios nuevos no rompen funcionalidad existente.
- En SENDA: cada feature branch se prueba contra el conjunto de pruebas existente antes de hacer merge.

### Estrategias de mantenimiento

**Mantenimiento correctivo:** Corrección de defectos encontrados en producción.
- Ejemplo en SENDA: commit `fix(auth): changePassword use adminSupabase.auth.admin.updateUserById` — se identificó que el cambio de contraseña fallaba con el cliente anónimo y se corrigió usando el cliente de administración.

**Mantenimiento adaptativo:** Modificaciones por cambios en el entorno.
- Ejemplo: migración del servidor SMTP de Mailtrap a `smtp.resend.com:465` cuando se necesitó un proveedor más confiable para producción.

**Mantenimiento perfectivo:** Mejoras de rendimiento o funcionalidad sin que sea un defecto.
- Ejemplo: el rediseño completo de las plantillas de correo electrónico (commit `feat: email redesign`).

**Mantenimiento preventivo:** Refactorización para facilitar futuros cambios.
- Ejemplo: la extracción del patrón repository en el backend para facilitar el cambio de base de datos si fuera necesario.

### Documentación

En SENDA, la documentación incluye:
1. **Documentación de código:** Nombres descriptivos de variables/funciones que hacen el código auto-documentado.
2. **BACKEND_SPEC.md:** Especificación completa de la API (>1600 líneas).
3. **CHANGELOG.md:** Historial de versiones con cambios por categoría (feat, fix, chore, refactor).
4. **Migraciones SQL comentadas:** Cada migración tiene comentarios explicando el propósito del cambio.
5. **Este documento de defensa.**

### Manejo de peticiones de cambios

En SENDA se siguió el flujo de ramas de git:
1. Nueva rama por feature o fix (`feature/kiosk-realtime`, `fix/auth-change-password`).
2. Desarrollo y pruebas en la rama.
3. Review del código (auto-review en equipo pequeño).
4. Merge a la rama principal (`main`).
5. Despliegue automático via GitHub Actions.

---

## TEMA 6: ASEGURAMIENTO DE LA CALIDAD

### Métricas de calidad aplicadas en SENDA

**Métricas de producto:**

| Métrica | Descripción | Valor en SENDA |
|---|---|---|
| Complejidad ciclomática | Número de caminos independientes en el código | Baja (funciones cortas, principio de responsabilidad única) |
| Cobertura de código | % de código ejecutado por pruebas | ~70% en lógica de negocio crítica |
| Deuda técnica | Código que necesita refactorización | Documentada en TODO comments |
| Cohesión | Qué tan relacionado está el código dentro de un módulo | Alta (feature-based architecture) |
| Acoplamiento | Dependencias entre módulos | Bajo (interfaces bien definidas entre capas) |

**Métricas de proceso:**

| Métrica | Descripción |
|---|---|
| Velocidad del equipo | Story points completados por sprint |
| Densidad de defectos | Bugs encontrados por KLOC (mil líneas de código) |
| Tiempo de resolución | Tiempo promedio entre detección y corrección de un bug |

### Medidas de calidad implementadas

1. **TypeScript estricto:** El compilador detecta errores de tipos en tiempo de desarrollo, antes de que lleguen a producción.
2. **ESLint:** Herramienta de análisis estático que detecta problemas de estilo y patrones problemáticos en el código.
3. **Validación de esquemas:** Los datos de entrada al backend se validan con esquemas antes de procesar.
4. **Row-Level Security:** Capa de seguridad adicional en la base de datos que actúa independientemente del backend.
5. **Manejo centralizado de errores:** Un único middleware (`errorHandler.mjs`) captura todos los errores y devuelve respuestas consistentes con los códigos HTTP correctos.
6. **Mappers de datos:** Los mappers (`mappers.mjs`) convierten snake_case → camelCase de forma centralizada, evitando inconsistencias.

### Usabilidad

La usabilidad se garantizó en SENDA mediante:

1. **Portales diferenciados por rol:** El estudiante ve solo lo que necesita un estudiante; el contable ve solo lo que necesita contabilidad. No hay sobrecarga de información.
2. **Feedback inmediato:** Toast notifications (Sonner) informan al usuario del resultado de cada acción en menos de 300ms.
3. **Estados de carga:** Spinners y skeletons informan al usuario que el sistema está procesando.
4. **Mensajes de error claros:** Los errores del API se propagan hasta la UI con mensajes en lenguaje natural.
5. **Exportaciones:** El usuario puede exportar cualquier tabla a CSV o PDF con un clic.
6. **Diseño responsivo:** Tailwind CSS garantiza que la interfaz se adapte a diferentes tamaños de pantalla.

---

---

# PARTE III — EJE COMÚN: FORMULACIÓN Y EVALUACIÓN DE PROYECTOS
*(Temas del Eje Común que aplican a ambas pruebas)*

---

## 1. DEFINICIÓN DE ALCANCE, CALIDAD, RESPONSABLES Y SECUENCIA DE ACTIVIDADES

### Estructura de Desglose del Trabajo (EDT/WBS)

```
SENDA — Proyecto completo
├── 1. Gestión del Proyecto
│   ├── 1.1 Levantamiento de requerimientos
│   ├── 1.2 Planificación de sprints
│   └── 1.3 Documentación final
├── 2. Diseño
│   ├── 2.1 Diseño de arquitectura del sistema
│   ├── 2.2 Modelado de base de datos
│   └── 2.3 Diseño de API y contratos
├── 3. Base de Datos
│   ├── 3.1 Esquema inicial + enums + triggers
│   ├── 3.2 RLS policies por rol
│   └── 3.3 Migraciones incrementales (9 total)
├── 4. Backend (API REST)
│   ├── 4.1 Autenticación y sesión
│   ├── 4.2 Gestión de usuarios
│   ├── 4.3 Departamentos
│   ├── 4.4 Registros de horas + flujo de estados
│   ├── 4.5 Tasas horarias (append-only)
│   ├── 4.6 Módulo de quiosco
│   ├── 4.7 Contabilidad y configuración
│   └── 4.8 Reportes de planilla
├── 5. Frontend (SPA React)
│   ├── 5.1 Autenticación + primer inicio de sesión
│   ├── 5.2 Portal Admin
│   ├── 5.3 Portal Estudiante
│   ├── 5.4 Portal Jefe de Departamento
│   ├── 5.5 Portal Contabilidad
│   ├── 5.6 Portal Super Admin
│   └── 5.7 Pantalla de Quiosco
├── 6. Sistema de Correo
│   ├── 6.1 Configuración SMTP
│   └── 6.2 Plantillas HTML (4 tipos)
├── 7. Pruebas
│   ├── 7.1 Pruebas unitarias (lógica de negocio)
│   ├── 7.2 Pruebas de integración (API)
│   └── 7.3 Pruebas de aceptación (UI)
└── 8. Despliegue
    ├── 8.1 Dockerfile backend
    ├── 8.2 GitHub Actions (CI/CD frontend)
    └── 8.3 Configuración de producción
```

### Responsables

| Rol | Responsabilidades principales |
|---|---|
| Desarrollador principal (Reyshawn Lawrence) | Arquitectura, backend, base de datos, diseño UI |
| Desarrollador frontend (Marvin Moncada) | Implementación de portales React, integración API |
| Supervisor/Product Owner (Institución) | Validación de requerimientos, pruebas de aceptación |

### Secuencia de actividades (precedencias)

```
Levantamiento de requerimientos
    → Diseño de arquitectura y BD
        → Implementación del esquema SQL
            → Implementación del Backend
                → Implementación del Frontend
                    → Pruebas de integración
                        → Despliegue en producción
```

---

## 2. DESARROLLO DEL PROGRAMA

### Metodología adoptada

SCRUM adaptado con sprints de 1-2 semanas. Cada sprint produce un incremento funcional y demostrable.

### Cronograma de sprints ejecutado

| Sprint | Período | Entregables |
|---|---|---|
| Sprint 0 | Mar 03 | Esquema BD completo, autenticación básica |
| Sprint 1 | Mar 04 | is_active en profiles, audit columns, email institucional, cost_center |
| Sprint 2 | Mar 05 | Realtime para quiosco |
| Sprint 3 | Mar 17 | Configuración contable, student_receivables |
| Sprint 4 | Mar 17 | Refinamiento student_receivables, relaxar restricciones cost_center |
| Sprint 5 | Abr 08 | closing_day en accounting_config |
| Sprint 6 | Abr 12 | Rediseño de correos, flujo de primer inicio de sesión |
| Sprint 7 | Abr 29 | must_change_password en profiles |

*(Las fechas se pueden verificar en el historial de migraciones SQL del repositorio.)*

---

## 3. UTILIZACIÓN DE RECURSOS

### Recursos humanos

| Recurso | Horas estimadas | Rol |
|---|---|---|
| Desarrollador senior (backend + arquitectura) | ~200 hrs | Backend, BD, infraestructura |
| Desarrollador frontend | ~150 hrs | Portales React, integración |
| **Total** | **~350 hrs** | |

### Recursos tecnológicos

| Recurso | Tipo | Costo |
|---|---|---|
| Supabase (PostgreSQL + Auth + Realtime) | BaaS | $0 (plan gratuito) |
| GitHub (repositorio + Actions + Pages) | DevOps | $0 (plan gratuito) |
| Node.js / React / PostgreSQL | Software | $0 (open source) |
| Resend SMTP (correos transaccionales) | SMTP | $0 (hasta 3,000 emails/mes) |
| Servidor de desarrollo (hardware) | Hardware | Existente (costo amortizado) |

**Costo de infraestructura mensual en producción: ~$0 - $25 USD** (dependiendo de la carga de usuarios)

---

## 4. DETERMINACIÓN DE COSTOS, PRESUPUESTO Y VALOR DEVENGADO

### Estimación de costos (Valor Planeado)

| Componente | Costo estimado (USD) |
|---|---|
| Desarrollo backend (200 hrs × $15/hr) | $3,000 |
| Desarrollo frontend (150 hrs × $15/hr) | $2,250 |
| Gestión de proyecto y documentación (50 hrs × $15/hr) | $750 |
| Infraestructura durante desarrollo (6 meses) | $0 |
| **Total Presupuesto** | **$6,000** |

*Nota: Los $15/hr corresponden a una tarifa referencial para desarrollador junior/mid en el contexto centroamericano.*

### Valor Devengado (EVM — Earned Value Management)

Al cierre del proyecto:

| Indicador | Fórmula | Valor |
|---|---|---|
| **PV** (Valor Planeado) | Presupuesto × % trabajo planeado | $6,000 (100%) |
| **EV** (Valor Ganado) | Presupuesto × % trabajo completado | $6,000 (100%) |
| **AC** (Costo Real) | Costo real incurrido | $6,000 (estimado) |
| **SPI** (Índice de desempeño del cronograma) | EV / PV | 1.0 (en tiempo) |
| **CPI** (Índice de desempeño del costo) | EV / AC | 1.0 (dentro del presupuesto) |

---

## 5. ADMINISTRACIÓN DEL RIESGO

### Registro de riesgos identificados

| # | Riesgo | Probabilidad | Impacto | Severidad | Estrategia de respuesta |
|---|---|---|---|---|---|
| R1 | Cambio de precios/políticas de Supabase | Baja | Alto | Media | Mitigar: arquitectura con patrón repository permite cambiar proveedor de BD |
| R2 | Pérdida de conectividad en el campus | Media | Alto | Alta | Mitigar: mensajes de error claros + reconexión automática del quiosco |
| R3 | Ataques de fuerza bruta al login | Media | Alto | Alta | Mitigar: delegar a Supabase Auth (tiene protección integrada); agregar rate limiting en backend |
| R4 | XSS si el JWT en localStorage es exfiltrado | Baja | Alto | Media | Mitigar: Content Security Policy (CSP) en el servidor web; considerar cookies httpOnly en el futuro |
| R5 | Corrupción de datos por migraciones incorrectas | Baja | Crítico | Alta | Evitar: todas las migraciones son reversibles o append-only; backups automáticos de Supabase |
| R6 | Resistencia al cambio por usuarios | Media | Medio | Media | Mitigar: diseño de UI intuitivo; capacitación inicial |
| R7 | Pérdida de horas en quiosco por corte de luz | Media | Alto | Alta | Mitigar: las sesiones activas se guardan en BD (no solo en memoria) |

---

## 6. CIERRE DEL PROYECTO

### Criterios de aceptación cumplidos

- [x] Todos los roles de usuario pueden autenticarse y acceder a su portal correspondiente.
- [x] El flujo completo Registro → Aprobación → Pago funciona correctamente.
- [x] El módulo de quiosco registra entradas/salidas y genera registros de horas en tiempo real.
- [x] Los reportes de planilla muestran los cálculos correctos (bruto, diezmo, neto).
- [x] Las notificaciones por correo electrónico se envían correctamente en los 4 eventos definidos.
- [x] El sistema desplegado en producción responde correctamente.
- [x] La documentación técnica está completa y accesible.

### Lecciones aprendidas

1. **El patrón feature-based facilita el desarrollo incremental.** Cada módulo se puede construir, probar y desplegar independientemente sin afectar el resto del sistema.
2. **RLS es poderoso pero requiere cuidado.** Definir políticas incorrectas puede bloquear acceso legítimo o permitir acceso no deseado. Las pruebas de seguridad por rol son esenciales.
3. **El esquema de correo sintético (@senda.internal) funciona bien** pero requiere mapear cuidadosamente los identificadores (carnet/número de empleado) a sus correos para el login.
4. **El mantenimiento de migraciones SQL ordenadas es crítico.** Las 9 migraciones de SENDA documentan la evolución del esquema y permiten recrear la base de datos desde cero en cualquier entorno.
5. **La documentación técnica debe escribirse durante el desarrollo**, no al final. `BACKEND_SPEC.md` fue actualizado en paralelo con el código, lo que garantiza su precisión.

---

---

# PARTE IV — GUÍA DE ESTUDIO RÁPIDO PARA LA DEFENSA ORAL

---

## Posibles preguntas del jurado y respuestas sugeridas

### Sobre arquitectura

**P: ¿Por qué eligieron una arquitectura de tres capas en lugar de microservicios?**

R: Para un proyecto de este tamaño y equipo, los microservicios añadirían complejidad operacional sin beneficio proporcional. La arquitectura de tres capas (SPA + API REST + PostgreSQL) es más simple de desarrollar, probar y mantener. La organización feature-based del backend nos da suficiente modularidad para escalar el equipo y el sistema sin necesidad de microservicios en esta etapa.

**P: ¿Qué es el patrón Repository y por qué lo usaron?**

R: El patrón Repository es una abstracción que separa la lógica de negocio del acceso a datos. En SENDA, el servicio `users.service.mjs` no llama directamente a Supabase; llama a `users.repository.mjs`, que es el único que conoce cómo interactuar con la base de datos. Esto tiene dos ventajas: primero, si mañana cambiamos de Supabase a otro proveedor, solo modificamos el repositorio; segundo, en las pruebas unitarias podemos hacer mock del repositorio sin necesitar una base de datos real.

**P: ¿Cómo funciona la autenticación JWT?**

R: Cuando un usuario inicia sesión, el backend valida sus credenciales con Supabase Auth y recibe un JWT firmado. Este token contiene el ID del usuario y expira en un tiempo definido. El frontend lo guarda en localStorage y lo envía en el header `Authorization: Bearer <token>` en cada petición. El backend extrae el token, lo valida criptográficamente con Supabase, y si es válido, atiende la petición. El usuario nunca tiene que volver a introducir su contraseña hasta que el token expire.

### Sobre la base de datos

**P: ¿Qué es Row-Level Security y por qué es importante?**

R: RLS es una característica de PostgreSQL que permite definir políticas de acceso a nivel de fila, no solo a nivel de tabla. Por ejemplo, la política "un estudiante solo puede ver sus propias horas" se aplica directamente en la base de datos. Esto significa que aunque el backend tuviera un bug y enviara una consulta sin filtro de usuario, la base de datos devolvería solo las filas del usuario autenticado. Es una capa adicional de seguridad que protege el sistema incluso si el código de la aplicación falla.

**P: ¿Por qué las tasas horarias son append-only?**

R: Porque necesitamos precisión histórica. Si una hora se trabajó cuando la tasa era $2.00/hr, debe pagarse a $2.00 aunque después la tasa haya subido a $2.50. Si actualizáramos la tasa en lugar de crear un nuevo registro, perderíamos el historial y los cálculos de períodos pasados serían incorrectos. El enfoque append-only garantiza que siempre podamos recalcular el pago correcto para cualquier período.

**P: ¿Cómo funciona el ciclo de facturación?**

R: El ciclo se calcula así: si el día de la fecha es mayor o igual a 26, el ciclo corresponde al mes siguiente; si es menor a 26, corresponde al mes actual. Por ejemplo, el 28 de febrero de 2026 pertenece al ciclo 2026-03 (marzo), y el 15 de marzo de 2026 también pertenece al ciclo 2026-03. Esto significa que el ciclo 2026-03 cubre del 26 de febrero al 25 de marzo. Este cálculo está implementado en `lib/business.ts` en el frontend y se aplica al filtrar registros de horas por período.

### Sobre SCRUM

**P: ¿Qué es un Sprint en SCRUM?**

R: Un Sprint es una iteración de tiempo fijo (generalmente 1-4 semanas) en la que el equipo se compromete a completar un conjunto de funcionalidades del Product Backlog. Al final de cada Sprint se produce un incremento funcional del software que puede ser demostrado al cliente. En SENDA, los sprints duraron 1-2 semanas y cada uno entregó un módulo completamente funcional.

**P: ¿Qué es el Product Backlog?**

R: El Product Backlog es una lista priorizada de todo el trabajo que se necesita hacer para el producto. Es dinámico: puede crecer, cambiar de prioridad y refinarse durante el proyecto. El Product Owner es el responsable de mantenerlo actualizado y priorizado según el valor de negocio de cada ítem.

### Sobre calidad

**P: ¿Cómo garantizaron la calidad del software?**

R: Mediante varias estrategias complementarias: tipado estático con TypeScript (errores en tiempo de compilación), ESLint para análisis estático, pruebas unitarias para la lógica de negocio crítica, validación de esquemas en el backend, manejo centralizado de errores, RLS para seguridad a nivel de base de datos, y revisión de código antes de cada merge. No se puede garantizar calidad perfecta, pero estas capas hacen que los errores sean detectados lo más temprano posible en el ciclo de desarrollo.

---

## Vocabulario técnico clave para la defensa

| Término | Definición breve |
|---|---|
| **API REST** | Interfaz de programación que usa HTTP con verbos GET/POST/PUT/PATCH/DELETE para comunicar frontend y backend |
| **JWT** | JSON Web Token — credencial cifrada que autentica a un usuario sin necesidad de sesión en el servidor |
| **RLS** | Row-Level Security — política de acceso a nivel de fila en PostgreSQL |
| **SPA** | Single Page Application — aplicación web que carga una vez y actualiza el contenido sin recargar la página |
| **ORM** | Object-Relational Mapper — capa que abstrae el acceso a la BD (SENDA usa el cliente Supabase JS directamente) |
| **CI/CD** | Integración Continua / Despliegue Continuo — automatización del proceso de prueba y despliegue de código |
| **SCRUM** | Framework ágil para desarrollo de software basado en sprints, roles y artefactos definidos |
| **Sprint** | Iteración de tiempo fijo en SCRUM al final de la cual se entrega software funcional |
| **Product Backlog** | Lista priorizada de funcionalidades por desarrollar, mantenida por el Product Owner |
| **Story Point** | Unidad relativa de estimación de esfuerzo en metodologías ágiles |
| **WBS/EDT** | Work Breakdown Structure — desglose jerárquico de todo el trabajo del proyecto |
| **EVM** | Earned Value Management — técnica para medir el desempeño del proyecto en costo y tiempo |
| **Feature-based** | Organización del código por dominio/característica de negocio, no por tipo de archivo |
| **Repository Pattern** | Abstracción del acceso a datos que desacopla el negocio del proveedor de base de datos |
| **Realtime** | Actualizaciones en tiempo real vía WebSockets (Supabase Realtime usa el protocolo de cambios de PostgreSQL) |
| **Migraciones SQL** | Scripts SQL versionados que evolucionan el esquema de base de datos de forma controlada |
| **TypeScript** | Superconjunto tipado de JavaScript que detecta errores en tiempo de compilación |
| **Docker** | Plataforma de contenerización para empaquetar aplicaciones con sus dependencias |
| **CORS** | Cross-Origin Resource Sharing — política de seguridad del navegador para controlar acceso entre dominios |

---

*Documento generado el 29 de abril de 2026 — Basado en el análisis completo del repositorio SENDA v.2*
*Para la defensa del Examen de Grado — Escuela de Ingeniería en Sistemas, UNADECA*
