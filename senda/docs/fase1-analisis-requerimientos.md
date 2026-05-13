# FASE 1 — Análisis de Requerimientos

**Proyecto:** SENDA — Sistema Estratégico de Navegación y Desempeño Asistencial  
**Institución:** UNADECA  
**Versión:** 1.0  
**Fecha:** Abril 2026  
**Estándar:** IEEE 830 / Karl Wiegers

---

## Índice

1. [Descripción General del Proyecto](#1-descripción-general-del-proyecto)
2. [Mapa de Stakeholders](#2-mapa-de-stakeholders)
3. [Catálogo de Requerimientos](#3-catálogo-de-requerimientos)
4. [Historias de Usuario](#4-historias-de-usuario)
5. [Casos de Uso — Flujos Narrativos](#5-casos-de-uso--flujos-narrativos)
6. [Documento SRS](#6-documento-srs--software-requirements-specification)

---

## 1. Descripción General del Proyecto

### 1.1 Nombre del Sistema

**SENDA** — Sistema Estratégico de Navegación y Desempeño Asistencial

### 1.2 Propósito y Alcance

SENDA es una aplicación web institucional desarrollada para **UNADECA** con el fin de digitalizar y centralizar la gestión del programa de becas estudiantiles por horas de trabajo. El sistema cubre el ciclo completo: desde el registro de horas laboradas por los estudiantes hasta la generación de informes de nómina para el departamento de contabilidad.

El alcance del sistema comprende:

- Registro de horas de trabajo por parte de estudiantes, jefes de departamento y quiosco físico.
- Flujo de aprobación de registros (PENDING → APPROVED/REJECTED → PROCESSED).
- Gestión administrativa de usuarios, departamentos y tarifas horarias.
- Generación de reportes de nómina por ciclo de facturación o cuatrimestre.
- Módulo de quiosco para control de asistencia en tiempo real.
- Portal de contabilidad con configuración de cuentas contables y estado de cuentas por cobrar.

**Fuera del alcance:** integración con sistemas externos de nómina, módulo de matrícula académica, gestión de inventarios o activos físicos.

### 1.3 Problema que Resuelve

Antes de SENDA, UNADECA gestionaba las horas de beca estudiantil de forma manual, mediante hojas de cálculo y registros en papel. Este proceso generaba los siguientes problemas:

| Problema | Impacto |
|---|---|
| Registros duplicados o perdidos | Pagos incorrectos a estudiantes |
| Falta de trazabilidad en aprobaciones | Disputas sin historial verificable |
| Cálculo manual de nómina | Errores aritméticos, demoras |
| Sin control de asistencia en tiempo real | Imposibilidad de auditar horas |
| Datos descentralizados | Reportes inconsistentes entre departamentos |

SENDA resuelve estos problemas al proporcionar una fuente única de verdad, con roles diferenciados, flujos de aprobación auditables y generación automática de nómina.

---

## 2. Mapa de Stakeholders

| ID | Stakeholder | Rol en el sistema | Intereses principales |
|---|---|---|---|
| SH-01 | Estudiante Becado | Usuario primario | Registrar sus horas con precisión, consultar historial y estado de pago |
| SH-02 | Jefe de Departamento | Supervisor | Aprobar/rechazar registros, gestionar estudiantes de su área, activar quiosco |
| SH-03 | Administrador | Gestor operativo | Crear y gestionar usuarios, departamentos y tarifas |
| SH-04 | Super Administrador | Gestor total del sistema | Control completo: configuración avanzada, auditoría, reseteo de contraseñas |
| SH-05 | Personal de Contabilidad | Usuario financiero | Generar nómina, consultar reportes por período, gestionar cuentas contables |
| SH-06 | Institución (UNADECA) | Propietaria del sistema | Transparencia en el uso del presupuesto de becas, cumplimiento normativo |

### 2.1 Matriz de Influencia vs. Interés

```
Alta influencia │ SH-06 (UNADECA)     │ SH-04 (SuperAdmin)
                │                     │ SH-03 (Admin)
────────────────┼─────────────────────┼────────────────────
Baja influencia │                     │ SH-01 (Estudiante)
                │                     │ SH-02 (Jefe Depto.)
                │                     │ SH-05 (Contabilidad)
                └─────────────────────┴────────────────────
                   Bajo interés           Alto interés
```

---

## 3. Catálogo de Requerimientos

### 3.1 Requerimientos Funcionales

#### Módulo de Autenticación

| ID | Nombre | Descripción | Fuente | Criterio de Aceptación |
|---|---|---|---|---|
| RF-001 | Inicio de sesión | El sistema debe permitir a los usuarios autenticarse usando su identificador (carnet o número de empleado) y contraseña. | SH-01, SH-02, SH-03, SH-04, SH-05 | El usuario con credenciales válidas accede al portal correspondiente a su rol. Con credenciales inválidas recibe mensaje de error sin detallar cuál campo falló. |
| RF-002 | Cierre de sesión | El sistema debe permitir cerrar la sesión activa desde cualquier portal. | Todos | Al cerrar sesión, el token se invalida y el usuario es redirigido al login. |
| RF-003 | Consulta de perfil | El sistema debe exponer los datos del usuario autenticado. | Todos | `GET /api/v1/auth/me` retorna id, nombre, rol y departamento del usuario activo. |

#### Módulo de Gestión de Usuarios

| ID | Nombre | Descripción | Fuente | Criterio de Aceptación |
|---|---|---|---|---|
| RF-004 | Creación de usuarios | ADMIN y SUPER_ADMIN pueden crear cuentas de usuario con nombre, rol, carnet o número de empleado, correo institucional y departamento. | SH-03, SH-04 | El sistema genera automáticamente el correo de autenticación interno y registra el perfil. El ADMIN solo puede crear roles STUDENT y DEPT_HEAD. |
| RF-005 | Edición de usuarios | ADMIN y SUPER_ADMIN pueden modificar nombre, carnet, número de empleado, correo institucional, departamento y estado activo de un usuario. | SH-03, SH-04 | Los cambios persisten correctamente; el cambio de rol no está habilitado por esta ruta. |
| RF-006 | Eliminación de usuarios | ADMIN y SUPER_ADMIN pueden eliminar cuentas. El ADMIN no puede eliminar SUPER_ADMIN ni ADMIN. | SH-03, SH-04 | La cuenta eliminada no puede autenticarse. Las cuentas SUPER_ADMIN no se pueden eliminar por ningún otro rol. |
| RF-007 | Reseteo de contraseña | Solo SUPER_ADMIN puede resetear la contraseña de cualquier cuenta (excepto otra cuenta SUPER_ADMIN). | SH-04 | La nueva contraseña tiene mínimo 8 caracteres. El SUPER_ADMIN solo puede resetear su propia contraseña si target es SUPER_ADMIN. |
| RF-008 | Activación/desactivación de cuenta | Mediante RF-005 se puede activar o desactivar una cuenta con el campo `isActive`. | SH-03, SH-04 | Un usuario desactivado no puede autenticarse ni realizar operaciones en el quiosco. |

#### Módulo de Departamentos

| ID | Nombre | Descripción | Fuente | Criterio de Aceptación |
|---|---|---|---|---|
| RF-009 | Gestión de departamentos | ADMIN y SUPER_ADMIN pueden crear, editar y eliminar departamentos. Cada departamento tiene nombre, jefe asignado y centro de costo. | SH-03, SH-04 | El nombre y centro de costo son obligatorios. Eliminar un departamento no elimina sus usuarios ni registros históricos. |
| RF-010 | Asignación de jefe | Un departamento puede tener un único jefe de departamento asignado. | SH-03, SH-04 | El campo `headId` referencia un usuario con rol DEPT_HEAD existente. |

#### Módulo de Tarifa Horaria

| ID | Nombre | Descripción | Fuente | Criterio de Aceptación |
|---|---|---|---|---|
| RF-011 | Consulta de tarifa vigente | Todos los usuarios autenticados pueden consultar la tarifa horaria actual. | Todos | `GET /api/v1/rates` retorna la tarifa más reciente con su fecha de vigencia. |
| RF-012 | Actualización de tarifa | ADMIN y SUPER_ADMIN pueden registrar una nueva tarifa horaria (en colones costarricenses). | SH-03, SH-04 | La nueva tarifa se registra con fecha de vigencia. Los cálculos futuros usan la tarifa vigente en el período de pago. |

#### Módulo de Registro de Horas (Work Logs)

| ID | Nombre | Descripción | Fuente | Criterio de Aceptación |
|---|---|---|---|---|
| RF-013 | Registro manual por estudiante | El estudiante puede iniciar un temporizador, agregar descripción y finalizar para generar un registro PENDING. | SH-01 | El registro incluye horas calculadas con precisión de centésimas, fecha en hora local de Costa Rica (UTC-6), descripción (máx. 200 caracteres). Sesiones menores a 15 minutos muestran advertencia. La sesión persiste en localStorage ante recargas. |
| RF-014 | Registro por jefe de departamento | El DEPT_HEAD puede crear registros directamente en estado APPROVED para cualquier estudiante de su departamento, indicando estudiante, fecha, horas (máx. 12) y descripción. | SH-02 | El registro es válido solo si el estudiante pertenece al departamento del jefe. El estado inicial es APPROVED. |
| RF-015 | Aprobación individual de registro | El DEPT_HEAD puede aprobar un registro PENDING de un estudiante de su departamento. | SH-02 | El estado cambia de PENDING a APPROVED. Se registra `approvedBy` y `approvedAt`. |
| RF-016 | Aprobación masiva de registros | El DEPT_HEAD puede aprobar todos los registros PENDING de su departamento en una sola acción. | SH-02 | Todos los registros seleccionados cambian a APPROVED. La operación es atómica (todos o ninguno en la capa de negocio). |
| RF-017 | Rechazo de registro | El DEPT_HEAD puede rechazar un registro PENDING indicando una razón (máx. 150 caracteres). | SH-02 | El estado cambia a REJECTED, se registra la razón, `rejectedBy` y `rejectedAt`. |
| RF-018 | Marcado como procesado | El personal de ACCOUNTING puede marcar registros APPROVED como PROCESSED. | SH-05 | Solo registros en estado APPROVED pueden pasar a PROCESSED. |
| RF-019 | Exportación de registros | DEPT_HEAD puede exportar el historial de registros del ciclo activo en formato CSV o PDF. | SH-02 | El PDF incluye encabezado institucional, tabla de registros y totales. El CSV incluye todas las columnas relevantes. |

#### Módulo de Quiosco

| ID | Nombre | Descripción | Fuente | Criterio de Aceptación |
|---|---|---|---|---|
| RF-020 | Activación del quiosco | DEPT_HEAD o SUPER_ADMIN autentican con sus credenciales para activar un quiosco por departamento. Solo puede existir un quiosco activo por departamento. | SH-02, SH-04 | Al activar, el estado del quiosco queda registrado en base de datos. Intentar activar un quiosco ya activo retorna error 409. |
| RF-021 | Registro de entrada (clock-in) | El estudiante ingresa carnet y contraseña en el quiosco para iniciar una sesión de trabajo. | SH-01 | El estudiante es validado contra Supabase Auth. Debe pertenecer al departamento del quiosco activo. No puede tener sesión activa previa. |
| RF-022 | Registro de salida (clock-out) | El estudiante ingresa sus credenciales para cerrar su sesión activa y generar un registro PENDING automáticamente. | SH-01 | Se crea el work log con las horas calculadas antes de eliminar la sesión, garantizando integridad de datos ante fallo parcial. |
| RF-023 | Cancelación de sesión | El DEPT_HEAD puede cancelar la sesión activa de un estudiante con razón. Genera un registro REJECTED. | SH-02 | Requiere credenciales del jefe. La sesión queda registrada como REJECTED con la razón indicada. |
| RF-024 | Desactivación del quiosco | El DEPT_HEAD o SUPER_ADMIN desactiva el quiosco. Las sesiones abiertas se cierran automáticamente como PENDING. | SH-02, SH-04 | Todas las sesiones activas reciben un trabajo log de cierre automático antes de eliminar el estado del quiosco. |
| RF-025 | Configuración de turnos | El DEPT_HEAD puede configurar ventanas horarias de turno activo para el quiosco (formato HH:MM a HH:MM). | SH-02 | El quiosco muestra indicador visual cuando el momento actual cae dentro de un turno configurado. |

#### Módulo de Contabilidad

| ID | Nombre | Descripción | Fuente | Criterio de Aceptación |
|---|---|---|---|---|
| RF-026 | Configuración contable | El personal de ACCOUNTING puede configurar cuentas contables (becas, diezmo, cuentas por pagar y por cobrar) y el día de cierre del ciclo (1–28). | SH-05 | Los cambios se reflejan de inmediato en los reportes y en el cálculo de ciclos. |
| RF-027 | Reporte de nómina | El personal de ACCOUNTING puede generar un reporte de nómina por ciclo de facturación (modo ciclo) o cuatrimestre (modo cuatrimestre), filtrando por departamento y búsqueda de nombre. | SH-05 | El reporte muestra horas totales, monto bruto, diezmo (10%) y monto neto por estudiante. Los filtros de modo, período, departamento y búsqueda funcionan correctamente. |
| RF-028 | Reporte individual por estudiante | El personal de ACCOUNTING puede ver el detalle de logs aprobados/procesados de un estudiante específico para un período determinado. | SH-05 | El reporte incluye tabla de registros con fecha, horas, descripción, estado y valores monetarios. |
| RF-029 | Gestión de cuentas por cobrar | El personal de ACCOUNTING puede registrar montos a descontar del pago neto de un estudiante para un período. | SH-05 | El monto descontado se resta del neto calculado en el reporte. Admite operación individual o por lote (batch). |
| RF-030 | Exportación de nómina | El personal de ACCOUNTING puede exportar la nómina en CSV o PDF con encabezado institucional. | SH-05 | El PDF generado incluye logotipo institucional (si disponible), encabezado del período, tabla de estudiantes y totales. |

---

### 3.2 Requerimientos No Funcionales

| ID | Categoría | Descripción | Criterio de Aceptación |
|---|---|---|---|
| RNF-001 | Seguridad | Toda petición al backend debe incluir un JWT válido (excepto login). Las sesiones de quiosco requieren re-autenticación por credenciales en cada acción sensible. | Peticiones sin token válido reciben HTTP 401. Peticiones a recursos de otro rol reciben HTTP 403. |
| RNF-002 | Seguridad | Las contraseñas nunca se almacenan en el sistema propio; se delega a Supabase Auth. | No existe columna de contraseña en la base de datos de la aplicación. |
| RNF-003 | Disponibilidad | El sistema debe estar disponible al menos el 99 % del tiempo durante días hábiles (lunes a viernes, 7 am–6 pm, hora Costa Rica). | Menos de 7.2 horas de inactividad no planificada al mes. |
| RNF-004 | Rendimiento | Las respuestas del API deben completarse en menos de 2 segundos bajo carga normal (hasta 50 usuarios concurrentes). | 95 % de las peticiones responden en ≤ 2 s en pruebas de carga básica. |
| RNF-005 | Usabilidad | La interfaz debe ser responsive y funcional en pantallas de 768 px en adelante sin scroll horizontal. | Pruebas en Chrome/Firefox en tablet y escritorio no presentan desbordamiento de contenido. |
| RNF-006 | Mantenibilidad | El código fuente debe seguir convenciones de commits (Conventional Commits) y pasar ESLint sin errores. | `npm run lint` ejecuta sin errores en CI. Commits que no sigan la convención son rechazados por el hook de Husky. |
| RNF-007 | Portabilidad | El frontend se despliega como SPA estática (Vite build). El backend es un proceso Node.js. Ambos se pueden desplegar en cualquier host con soporte a Node.js ≥ 20. | El build de producción (`npm run build`) completa sin errores en una máquina limpia con Node 20. |
| RNF-008 | Integridad de datos | En operaciones de clock-out y cancelación de quiosco, el work log debe persistirse antes de eliminar la sesión activa. | Si la inserción del work log falla, la sesión permanece activa y no se generan datos parciales. |
| RNF-009 | Trazabilidad | Los registros de horas deben incluir campos de auditoría: quién aprobó/rechazó, cuándo, y la fuente de registro (MANUAL, KIOSK). | Los campos `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`, `entrySource` están presentes en la entidad WorkLog. |
| RNF-010 | Localización | Todas las fechas se manejan en la zona horaria de Costa Rica (UTC-6, sin horario de verano). Las monedas se expresan en colones costarricenses (₡). | Las fechas en base de datos se almacenan en UTC; la conversión a UTC-6 se realiza tanto en el frontend como en el backend. |

---

## 4. Historias de Usuario

Las historias de usuario siguen el criterio **INVEST**: Independientes, Negociables, Valiosas, Estimables, Pequeñas y Verificables.

---

### HU-001 — Inicio de sesión

> **Como** usuario del sistema (cualquier rol),  
> **quiero** autenticarme con mi identificador y contraseña,  
> **para** acceder al portal correspondiente a mis responsabilidades.

**Criterios de aceptación (Gherkin):**

```gherkin
Escenario: Inicio de sesión exitoso
  Dado que soy un usuario registrado con carnet "20240101" y contraseña "becas2024"
  Cuando ingreso mis credenciales en el formulario de login
  Entonces soy redirigido al portal de Estudiante
  Y veo mi nombre en la barra de navegación

Escenario: Credenciales incorrectas
  Dado que ingreso la contraseña incorrecta para mi usuario
  Cuando envío el formulario de login
  Entonces veo el mensaje "Credenciales inválidas"
  Y permanezco en la pantalla de login

Escenario: Campos vacíos
  Dado que no he llenado ningún campo
  Cuando intento enviar el formulario
  Entonces el botón permanece deshabilitado hasta que ambos campos tengan contenido
```

---

### HU-002 — Registro de horas con temporizador

> **Como** estudiante becado,  
> **quiero** iniciar un temporizador al comenzar a trabajar y detenerlo al terminar,  
> **para** que mis horas queden registradas automáticamente sin necesidad de calcularlas manualmente.

**Criterios de aceptación (Gherkin):**

```gherkin
Escenario: Registro exitoso de horas
  Dado que soy un estudiante sin sesión activa
  Cuando escribo una descripción de la tarea y presiono "Iniciar Sesión"
  Entonces el temporizador empieza a contar
  Y puedo ver el tiempo transcurrido en pantalla

  Cuando presiono "Finalizar Registro" después de al menos 15 minutos
  Entonces se crea un registro en estado PENDING con las horas calculadas
  Y veo la confirmación "Sesión finalizada y registrada para revisión"

Escenario: Advertencia por sesión corta
  Dado que han pasado menos de 15 minutos desde que inicié la sesión
  Cuando presiono "Finalizar Registro"
  Entonces veo una advertencia indicando el tiempo registrado
  Y puedo elegir "Registrar de todas formas" o "Seguir trabajando"

Escenario: Persistencia ante recarga
  Dado que tengo una sesión activa
  Cuando recargo la página
  Entonces el temporizador continúa desde el tiempo acumulado
  Y mi descripción de tarea se conserva

Escenario: Descripción vacía
  Dado que inicié una sesión sin haber escrito descripción
  Cuando intento finalizar el registro sin escribir descripción
  Entonces veo el error "Debes ingresar una descripción de las tareas realizadas"
  Y la sesión permanece activa
```

---

### HU-003 — Aprobación de registros por jefe de departamento

> **Como** jefe de departamento,  
> **quiero** revisar los registros pendientes de mis estudiantes y aprobarlos o rechazarlos,  
> **para** validar las horas antes de que sean procesadas en nómina.

**Criterios de aceptación (Gherkin):**

```gherkin
Escenario: Aprobación individual
  Dado que hay un registro PENDING de un estudiante de mi departamento
  Cuando presiono el botón de aprobar en ese registro
  Entonces el estado cambia a APPROVED de inmediato (actualización optimista)
  Y si el servidor confirma, el cambio persiste

Escenario: Rechazo con razón
  Dado que hay un registro PENDING de un estudiante de mi departamento
  Cuando presiono rechazar e ingreso la razón "Las horas no coinciden con el turno"
  Entonces el estado cambia a REJECTED con la razón indicada

Escenario: Rechazo sin razón
  Dado que intento rechazar un registro
  Cuando presiono confirmar sin escribir razón
  Entonces veo el error "Debes proporcionar una razón para el rechazo"

Escenario: Aprobación masiva
  Dado que hay 5 registros PENDING de mi departamento
  Cuando presiono "Aprobar todos" y confirmo el diálogo
  Entonces los 5 registros cambian a APPROVED simultáneamente
```

---

### HU-004 — Clock-in en quiosco

> **Como** estudiante,  
> **quiero** registrar mi entrada usando el quiosco físico del departamento,  
> **para** que mi tiempo de trabajo quede registrado sin necesidad de usar mi computadora personal.

**Criterios de aceptación (Gherkin):**

```gherkin
Escenario: Entrada exitosa
  Dado que el quiosco de mi departamento está activo
  Y no tengo sesión activa en el quiosco
  Cuando ingreso mi carnet y contraseña correctos
  Entonces aparezco en la lista "Trabajando ahora" del quiosco
  Y veo el mensaje "¡Bienvenido/a, [mi nombre]! Entrada registrada."

Escenario: Registro de salida desde el mismo quiosco
  Dado que tengo una sesión activa en el quiosco
  Cuando ingreso mis credenciales nuevamente
  Entonces el sistema detecta que ya estoy dentro y registra mi salida
  Y se crea un work log PENDING con las horas trabajadas

Escenario: Credenciales de otro departamento
  Dado que el quiosco activo es del Departamento A
  Cuando un estudiante del Departamento B intenta hacer clock-in
  Entonces ve el mensaje de error "Acceso denegado" con advertencia visual
  Y no se crea ninguna sesión

Escenario: Quiosco inactivo
  Dado que no hay quiosco activo en mi departamento
  Cuando intento registrar entrada
  Entonces veo el error "El kiosco no está activo para tu departamento"
```

---

### HU-005 — Generación de nómina

> **Como** personal de contabilidad,  
> **quiero** generar un reporte de nómina para un período específico,  
> **para** procesar los pagos de los estudiantes becados con los cálculos de bruto, diezmo y neto correctos.

**Criterios de aceptación (Gherkin):**

```gherkin
Escenario: Nómina por ciclo de facturación
  Dado que selecciono el modo "ciclo" y el período "Abril 2026"
  Cuando cargo el reporte
  Entonces veo una tabla con todos los estudiantes que tienen registros APPROVED o PROCESSED
  Y cada fila muestra horas totales, monto bruto, diezmo (10%) y monto neto
  Y el monto bruto = horas × tarifa vigente

Escenario: Descuento de cuenta por cobrar
  Dado que un estudiante tiene una cuenta por cobrar de ₡5,000 para el período actual
  Cuando genero la nómina del período
  Entonces el monto total a pagar del estudiante es neto − ₡5,000
  Y el descuento se muestra en la columna "Cobros"

Escenario: Exportación en PDF
  Dado que tengo la nómina del período cargada
  Cuando presiono "Exportar PDF"
  Entonces se descarga un archivo PDF con encabezado institucional, tabla y totales

Escenario: Sin registros en el período
  Dado que no hay registros aprobados para el período seleccionado
  Cuando cargo el reporte
  Entonces la tabla muestra "Sin registros para este período"
```

---

### HU-006 — Activación del quiosco por jefe

> **Como** jefe de departamento,  
> **quiero** activar el quiosco de mi departamento desde mi portal,  
> **para** que los estudiantes puedan registrar su asistencia durante la jornada.

**Criterios de aceptación (Gherkin):**

```gherkin
Escenario: Activación exitosa
  Dado que no hay quiosco activo en mi departamento
  Cuando ingreso mis credenciales en el modal de activación de quiosco
  Entonces el quiosco queda activo y veo confirmación

Escenario: Quiosco ya activo
  Dado que ya existe un quiosco activo para mi departamento
  Cuando intento activar otro quiosco
  Entonces veo el error "Ya hay un kiosco activo. Desactívalo primero"
```

---

### HU-007 — Gestión de usuarios por administrador

> **Como** administrador,  
> **quiero** crear, editar y desactivar cuentas de estudiantes y jefes de departamento,  
> **para** mantener actualizado el padrón de usuarios del sistema.

**Criterios de aceptación (Gherkin):**

```gherkin
Escenario: Creación de estudiante
  Dado que soy ADMIN
  Cuando creo un usuario con rol STUDENT, nombre "María Pérez", carnet "20230056"
  Entonces la cuenta queda creada y el estudiante puede autenticarse

Escenario: Intento de crear ADMIN (acceso denegado)
  Dado que soy ADMIN
  Cuando intento crear un usuario con rol ADMIN
  Entonces recibo el error "Admin solo puede crear cuentas DEPT_HEAD y STUDENT"

Escenario: Desactivación de cuenta
  Dado que un estudiante ya no participa en el programa
  Cuando desactivo su cuenta mediante la edición de usuario (isActive = false)
  Entonces el estudiante no puede iniciar sesión
  Y no puede registrar horas en el quiosco
```

---

## 5. Casos de Uso — Flujos Narrativos

### CU-001 — Registrar Horas (Temporizador)

**Actor principal:** Estudiante  
**Precondición:** El estudiante está autenticado y no tiene sesión de quiosco activa.  
**Postcondición:** Se genera un work log en estado PENDING.

**Flujo principal:**
1. El estudiante navega a su portal y ve el temporizador detenido.
2. El estudiante escribe la descripción de la tarea (máx. 200 caracteres).
3. El estudiante presiona "Iniciar Sesión".
4. El sistema guarda el tiempo de inicio en `localStorage` y activa el contador visual.
5. El sistema muestra el tiempo transcurrido en tiempo real.
6. El estudiante presiona "Finalizar Registro".
7. El sistema valida que la descripción no esté vacía y que las horas no excedan el límite.
8. Si el tiempo es menor a 15 minutos, muestra advertencia con opción de continuar o registrar.
9. El sistema crea el work log con horas calculadas, fecha en UTC-6 y fuente MANUAL.
10. El sistema muestra confirmación y limpia el estado del temporizador.

**Flujo alternativo A — Sesión persistida tras recarga:**
- En el paso 1, si existe una sesión en `localStorage` con tiempo dentro del límite, el sistema restaura el estado y el temporizador continúa.

**Flujo alternativo B — Cancelación:**
- En cualquier punto después del paso 4, el estudiante puede cancelar la sesión mediante confirmación explícita.
- El sistema elimina la sesión de `localStorage` sin crear work log.

---

### CU-002 — Aprobar / Rechazar Registro

**Actor principal:** Jefe de Departamento  
**Precondición:** Existen registros PENDING de estudiantes del departamento del jefe.  
**Postcondición:** Los registros quedan en estado APPROVED o REJECTED.

**Flujo principal (aprobación individual):**
1. El jefe ve la sección "Pendientes" con los registros de su departamento.
2. El jefe presiona el botón de aprobación en un registro.
3. El sistema aplica una actualización optimista (estado APPROVED visible de inmediato).
4. El sistema envía `PATCH /api/v1/work-logs/{id}/status` con `status: APPROVED`.
5. El servidor valida el rol y el ownership del registro.
6. El servidor actualiza el registro y retorna los datos confirmados.
7. El sistema sincroniza el estado local con la respuesta del servidor.

**Flujo alternativo — Rechazo:**
- En el paso 2, el jefe presiona rechazar.
- Se muestra un modal para ingresar la razón del rechazo.
- El jefe ingresa la razón y confirma.
- El sistema sigue los pasos 3–7 con `status: REJECTED` y `rejectionReason`.
- Si la razón está vacía, el modal muestra error y permanece abierto.

**Flujo alternativo — Fallo del servidor:**
- Si el paso 6 falla, el sistema revierte el estado al valor anterior (rollback optimista) y muestra toast de error.

---

### CU-003 — Clock-in / Clock-out en Quiosco

**Actor principal:** Estudiante  
**Actor secundario:** Sistema de Quiosco  
**Precondición:** El quiosco del departamento está activo.

**Flujo de clock-in:**
1. El estudiante ingresa su carnet y contraseña en el formulario del quiosco.
2. El sistema verifica si el carnet (insensible a mayúsculas) está en la lista de sesiones activas.
3. Como no está, llama a `POST /api/v1/kiosk/clock-in` con las credenciales.
4. El backend autentica las credenciales contra Supabase Auth.
5. El backend verifica que el estudiante pertenece al departamento del quiosco activo.
6. El backend crea una sesión en `kiosk_sessions`.
7. El sistema refresca el estado del quiosco y muestra al estudiante en la lista "Trabajando ahora".

**Flujo de clock-out:**
1. El estudiante ingresa sus credenciales nuevamente.
2. El sistema detecta que el carnet ya tiene sesión activa.
3. Llama a `POST /api/v1/kiosk/clock-out`.
4. El backend crea el work log PENDING **antes** de eliminar la sesión.
5. Si la inserción falla, la sesión permanece y no se pierden datos.
6. El sistema refresca el estado y muestra la confirmación de salida.

---

### CU-004 — Generar Reporte de Nómina

**Actor principal:** Personal de Contabilidad  
**Precondición:** Existen registros en estado APPROVED o PROCESSED para el período.

**Flujo principal:**
1. El usuario de contabilidad selecciona el período (modo ciclo o cuatrimestre) y filtros opcionales.
2. El sistema llama a `GET /api/v1/reports/payroll` con los parámetros seleccionados.
3. El backend obtiene todos los logs, usuarios, departamentos y cuentas por cobrar.
4. Para cada estudiante con registros en el período: calcula bruto, diezmo (10%) y neto.
5. Resta las cuentas por cobrar del período al neto de cada estudiante.
6. Retorna la lista ordenada por nombre de estudiante.
7. El sistema muestra la tabla de nómina con totales.
8. El usuario puede exportar en CSV o PDF.

---

## 6. Documento SRS — Software Requirements Specification

*(Siguiendo el estándar IEEE 830 y la guía de Karl Wiegers)*

---

### 6.1 Introducción

#### 6.1.1 Propósito

Este documento especifica los requerimientos de software del sistema **SENDA** (Sistema Estratégico de Navegación y Desempeño Asistencial) para la institución UNADECA. Está dirigido al equipo de desarrollo, a los evaluadores académicos y a los stakeholders institucionales. Sirve como contrato de referencia para el diseño, la implementación y la validación del sistema.

#### 6.1.2 Ámbito del Sistema

El sistema cubre la gestión del programa de becas estudiantiles por horas de trabajo en UNADECA. Incluye registro de horas, flujos de aprobación, control de asistencia por quiosco y generación de nómina. No incluye módulos de matrícula académica ni integración con sistemas externos de RRHH.

#### 6.1.3 Definiciones, Acrónimos y Abreviaturas

| Término | Definición |
|---|---|
| SENDA | Sistema Estratégico de Navegación y Desempeño Asistencial |
| UNADECA | Universidad Adventista de Centroamérica |
| SRS | Software Requirements Specification |
| API | Application Programming Interface |
| JWT | JSON Web Token |
| SPA | Single Page Application |
| UTC-6 | Zona horaria de Costa Rica (sin horario de verano) |
| Ciclo de facturación | Período comprendido entre el día N del mes anterior y el día N del mes actual (N configurable, por defecto 25) |
| Cuatrimestre | Uno de los tres períodos académicos de 4 meses del año |
| Diezmo | Retención del 10 % sobre el monto bruto de la beca |
| Work Log | Registro de horas de trabajo de un estudiante |
| Quiosco | Terminal de registro de asistencia compartida por un departamento |

#### 6.1.4 Referencias

- IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications.
- Wiegers, K. & Beatty, J. (2013). *Software Requirements* (3rd ed.). Microsoft Press.
- Supabase Documentation. https://supabase.com/docs
- React Documentation. https://react.dev

#### 6.1.5 Visión General del Documento

El presente SRS se organiza en: descripción general del producto (§6.2), requerimientos específicos funcionales (§3.1) y no funcionales (§3.2), historias de usuario con criterios Gherkin (§4), y casos de uso con flujos narrativos (§5).

---

### 6.2 Descripción General

#### 6.2.1 Perspectiva del Producto

SENDA es una aplicación web nueva desarrollada específicamente para UNADECA. No reemplaza un sistema de software preexistente, sino que digitaliza un proceso anteriormente manual. Opera como una SPA (React) que consume una API REST (Node.js/Express) respaldada por Supabase como plataforma de base de datos y autenticación.

```
[ Navegador Web ]
      │
      │ HTTPS (JWT Bearer)
      ▼
[ API REST — Express / Node.js ]
      │
      │ Supabase JS Client (admin key)
      ▼
[ Supabase ]
  ├── PostgreSQL (datos)
  └── Auth (gestión de identidades)
```

#### 6.2.2 Funciones Principales del Producto

1. Autenticación y autorización basada en roles (5 roles).
2. Registro de horas de trabajo por tres vías: temporizador del estudiante, entrada manual del jefe y quiosco físico.
3. Flujo de aprobación de registros con 4 estados y auditoría completa.
4. Gestión administrativa de usuarios, departamentos y tarifas horarias.
5. Sistema de quiosco con sesiones en tiempo real y configuración de turnos.
6. Generación de nómina con cálculo automático de bruto, diezmo y neto.
7. Exportación de reportes en CSV y PDF.
8. Sincronización en tiempo real mediante Supabase Realtime.

#### 6.2.3 Características de los Usuarios

| Rol | Frecuencia de uso | Nivel técnico | Funciones clave |
|---|---|---|---|
| Estudiante | Diaria | Básico | Registrar horas, consultar historial |
| Jefe de Departamento | Semanal | Intermedio | Aprobar/rechazar, quiosco, exportar reportes |
| Administrador | Ocasional | Intermedio | Gestionar usuarios y departamentos |
| Super Administrador | Esporádico | Alto | Configuración total, auditoría |
| Contabilidad | Mensual | Intermedio | Nómina, cuentas por cobrar, exportación |

#### 6.2.4 Restricciones

- El sistema debe operar dentro de la infraestructura de Supabase (plan gratuito o de pago, según decisión institucional).
- Las contraseñas se gestionan exclusivamente a través de Supabase Auth; el sistema no almacena contraseñas.
- El día de cierre de ciclo debe estar entre 1 y 28 (no se admite 29, 30 o 31 para compatibilidad con febrero).
- Las horas máximas por entrada manual son 12 h.
- La sesión del quiosco persiste únicamente en memoria del servidor; un reinicio del servidor elimina el estado del quiosco.

#### 6.2.5 Suposiciones y Dependencias

- **Suposición:** Todos los usuarios tienen acceso a un navegador moderno (Chrome 120+, Firefox 120+, Edge 120+).
- **Suposición:** La conectividad a Internet es estable durante el uso del quiosco.
- **Dependencia:** Supabase como proveedor de BaaS (autenticación, PostgreSQL, Realtime).
- **Dependencia:** La librería `@supabase/supabase-js` para el cliente del frontend y del backend.
- **Dependencia:** `jspdf` y `jspdf-autotable` para la generación de PDF en el frontend.

---

### 6.3 Requerimientos de Interfaz Externa

#### 6.3.1 Interfaces de Usuario

- La interfaz es una SPA con rutas implícitas controladas por roles.
- Diseño responsivo que soporta resoluciones desde 768 px (tablet) hasta escritorio.
- Paleta de colores consistente con la identidad institucional de UNADECA.
- Uso de componentes reutilizables (`Button`, `Input`, `Select`, `Modal`) con variantes definidas.

#### 6.3.2 Interfaces de Software

- **Supabase REST API / PostgREST:** Utilizada por el backend para consultas a la base de datos.
- **Supabase Auth API:** Utilizada para autenticación (signIn, signOut, getUser).
- **Supabase Realtime:** Suscripciones a cambios en tablas `work_logs`, `kiosk_sessions` y `kiosk_state`.

#### 6.3.3 Interfaces de Comunicación

- **Protocolo:** HTTPS.
- **Formato de datos:** JSON (UTF-8).
- **Autenticación API:** Bearer Token (JWT emitido por Supabase Auth).

---

*Fin del Documento — Fase 1*

---

### Referencias Bibliográficas (APA)

IEEE Computer Society. (1998). *IEEE Recommended Practice for Software Requirements Specifications* (IEEE Std 830-1998). Institute of Electrical and Electronics Engineers.

Supabase. (2024). *Supabase Documentation*. https://supabase.com/docs

Wiegers, K., & Beatty, J. (2013). *Software Requirements* (3rd ed.). Microsoft Press.
