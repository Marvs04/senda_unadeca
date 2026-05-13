# 📘 Manual de Usuario — SENDA
## Sistema Estratégico de Normalización y Desarrollo Académico
### Universidad UNADECA — Versión 2.0

---

> **Clasificación:** Documento de uso interno institucional  
> **Fecha de emisión:** 30 de abril de 2026  
> **Aplica a:** Todos los usuarios del sistema SENDA  
> **URL de acceso:** [https://senda.rlp.lat](https://senda.rlp.lat)

---

## Tabla de Contenidos

1. [Introducción al Sistema](#1-introducción-al-sistema)
2. [Acceso y Autenticación](#2-acceso-y-autenticación)
3. [Portal del Estudiante](#3-portal-del-estudiante)
4. [Portal del Jefe de Departamento](#4-portal-del-jefe-de-departamento)
5. [Portal de Administración](#5-portal-de-administración)
6. [Portal de Contabilidad](#6-portal-de-contabilidad)
7. [Portal del Super Administrador](#7-portal-del-super-administrador)
8. [Kiosco de Registro Presencial](#8-kiosco-de-registro-presencial)
9. [Notificaciones del Sistema](#9-notificaciones-del-sistema)
10. [Preguntas Frecuentes](#10-preguntas-frecuentes)
11. [Glosario](#11-glosario)
12. [Matriz de Permisos por Rol](#12-matriz-de-permisos-por-rol)

---

## 1. Introducción al Sistema

**SENDA** (*Sistema Estratégico de Normalización y Desarrollo Académico*) es la plataforma digital institucional de UNADECA para la gestión completa del programa de **Horas Beca Estudiantil**.

### ¿Para qué sirve SENDA?

El sistema digitaliza y automatiza el flujo completo del programa de horas beca:

```
Estudiante registra horas
       ↓
Jefe de Departamento aprueba o rechaza
       ↓
Administración gestiona usuarios, departamentos y tarifas
       ↓
Contabilidad procesa la nómina y genera reportes
       ↓
Super Administrador mantiene el control global del sistema
```

### Roles disponibles en el sistema

| Rol | Nombre en pantalla | Descripción |
|-----|--------------------|-------------|
| `STUDENT` | Estudiante | Registra y consulta sus horas beca |
| `DEPT_HEAD` | Jefe de Departamento | Aprueba/rechaza horas y gestiona su departamento |
| `ADMIN` | Administración | Gestiona usuarios, departamentos y tarifas |
| `ACCOUNTING` | Contabilidad | Procesa nóminas y genera reportes financieros |
| `SUPER_ADMIN` | Super Administrador | Control total del sistema |

---

## 2. Acceso y Autenticación

### 2.1 Inicio de Sesión

1. Abra su navegador web y acceda a la URL del sistema.
2. En la pantalla de inicio de sesión, ingrese:
   - **Identificador:** Su número de carnet (estudiantes) o número de empleado (demás roles).
   - **Contraseña:** La contraseña asignada por el administrador.
3. Haga clic en **Iniciar Sesión**.

> **⚠️ Importante:** El sistema redirige automáticamente al portal correspondiente según el rol asignado a cada usuario. No es posible acceder a funciones de otros roles.

### 2.2 Cambio de Contraseña Obligatorio (Primer Ingreso)

Cuando un administrador crea su cuenta o resetea su contraseña, el sistema **obliga a cambiar la contraseña** antes de acceder al portal.

**Pasos:**
1. Inicie sesión con las credenciales temporales recibidas.
2. Aparecerá automáticamente el modal **"Cambiar contraseña"**.
3. Ingrese su nueva contraseña (mínimo 8 caracteres).
4. Haga clic en **Guardar**. El sistema lo redirigirá a su portal.

> **🔒 Seguridad:** Jamás comparta su contraseña. Si olvidó su contraseña, comuníquese con el administrador del sistema para solicitar un reset.

### 2.3 Cierre de Sesión

Haga clic en el ícono de cerrar sesión ubicado en la barra superior de cualquier portal para salir del sistema de forma segura.

---

## 3. Portal del Estudiante

El portal del estudiante permite consultar el estado de horas, registrar tiempo trabajado y revisar información financiera del programa de becas.

### 3.1 Pantalla Principal

Al ingresar, el estudiante verá:

- **Tarjeta de perfil:** Nombre, carnet, departamento asignado, y resumen rápido de horas acumuladas.
- **Cronómetro de sesión** (columna derecha): Para registrar tiempo en tiempo real.
- **Historial de registros** (columna izquierda): Lista de todas las horas registradas.
- **Resumen financiero** (columna derecha): Monto estimado del ciclo actual.

### 3.2 Registrar Horas con el Cronómetro

> **Nota:** El cronómetro solo está disponible si el Jefe de Departamento no ha bloqueado la sesión.

**Pasos:**
1. En la sección **"Cronómetro"**, escriba una descripción de la actividad a realizar (obligatorio).
2. Haga clic en el botón **"Iniciar sesión"**.
3. El cronómetro comenzará a contar el tiempo transcurrido.
4. Al finalizar, haga clic en **"Finalizar sesión"**.
5. Se solicitará confirmación. Al confirmar, el registro queda en estado **Pendiente** esperando aprobación del Jefe de Departamento.

> **⚠️ Aviso:** Si una sesión es detenida por el Jefe de Departamento, recibirá una notificación en pantalla con la razón indicada.

**Cancelar una sesión activa:**
- Haga clic en **"Cancelar sesión"** para detener el cronómetro sin guardar el registro.

### 3.3 Bloqueo de Sesión

Cuando el Jefe de Departamento configura un **bloqueo de sesión**, el cronómetro mostrará un mensaje indicando que el registro de horas está temporalmente suspendido y la razón del bloqueo.

### 3.4 Historial de Registros

En la sección **"Historial"** puede:

- **Filtrar por período:**
  - **Por ciclo de facturación:** Seleccione el mes/período en el selector desplegable.
  - **Por cuatrimestre:** Cambie la vista a "Trimestre" y seleccione el cuatrimestre y año.
- **Ver el estado de cada registro:**
  - 🟡 **Pendiente:** Esperando revisión del Jefe de Departamento.
  - ✅ **Aprobado:** El Jefe de Departamento aprobó el registro.
  - ❌ **Rechazado:** El registro fue rechazado. Se mostrará la razón.
  - ✔️ **Procesado:** Contabilidad ya procesó el pago de este registro.

### 3.5 Exportar Mis Horas

En la parte superior del historial, use el botón **"Exportar"**:

| Formato | Descripción |
|---------|-------------|
| **CSV** | Archivo de hoja de cálculo con todos los registros |
| **PDF** | Reporte formal con datos del estudiante, resumen financiero y tabla de horas |

El PDF incluye:
- Nombre y carnet del estudiante
- Fecha de emisión
- Tasa por hora vigente
- Total de horas registradas y aprobadas
- Monto bruto, diezmo (10%) y monto neto

### 3.6 Resumen Financiero

La tarjeta de **"Finanzas"** muestra:
- Horas aprobadas en el ciclo actual
- Monto bruto estimado (horas × tarifa)
- Deducción del diezmo (10%)
- **Monto neto a recibir**

---

## 4. Portal del Jefe de Departamento

El portal del Jefe de Departamento centraliza la gestión de horas del departamento a su cargo, con acceso en tiempo real al estado de los estudiantes.

### 4.1 Pantalla Principal y KPIs

En la parte superior se muestran **5 tarjetas de indicadores (KPIs)** del ciclo seleccionado:

| Indicador | Descripción |
|-----------|-------------|
| **Estudiantes** | Total de estudiantes activos en el departamento |
| **Horas Ciclo** | Suma total de horas registradas en el período |
| **Pendientes** | Horas que aún esperan aprobación |
| **Aprobadas** | Horas aprobadas en el ciclo actual |
| **Facturación** | Monto proyectado en colones (₡) |

**Selector de ciclo:** Use el menú desplegable en la esquina superior derecha para cambiar el período de facturación analizado (hasta 12 meses atrás disponibles).

### 4.2 Sesiones Activas en Tiempo Real

El panel **"Sesiones Activas"** siempre está visible y se actualiza automáticamente sin necesidad de recargar la página.

- Muestra qué estudiantes tienen el cronómetro activo en este momento.
- Para cada sesión activa se muestra: nombre del estudiante, carnet, hora de inicio y duración transcurrida.
- Si no hay sesiones activas, se muestra un mensaje informativo.

### 4.3 Aprobar o Rechazar Registros Pendientes

En la sección **"Registros Pendientes"** verá todos los registros que esperan su revisión.

**Aprobar un registro individual:**
1. Localice el registro en la lista.
2. Haga clic en el ícono ✅ (verde) a la derecha del registro.
3. El registro pasa inmediatamente al estado **Aprobado**.

**Rechazar un registro individual:**
1. Haga clic en el ícono ❌ (rojo) a la derecha del registro.
2. Se abrirá el modal de rechazo. Ingrese la **razón del rechazo** (obligatorio).
3. Haga clic en **"Rechazar"**. El estudiante verá la razón en su historial.

**Aprobar todos los pendientes a la vez:**
1. Haga clic en el botón **"Aprobar todos"** en la cabecera de la sección.
2. Confirme la acción en el diálogo de confirmación.
3. Todos los registros pendientes serán aprobados en un solo paso.

### 4.4 Registrar Horas Manualmente (para un Estudiante)

El **formulario de registro manual** (columna derecha) permite al Jefe de Departamento registrar horas directamente en nombre de un estudiante. Las horas registradas de esta forma se aprueban automáticamente.

**Pasos:**
1. Seleccione el **estudiante** del departamento en el menú desplegable.
2. Ingrese las **horas** trabajadas (número decimal, máximo permitido por el sistema).
3. Escriba una **descripción** de la actividad (máximo 500 caracteres).
4. Seleccione la **fecha** del registro.
5. Haga clic en **"Registrar Horas"**.

> **Nota:** El registro queda inmediatamente en estado **Aprobado**, sin pasar por revisión.

### 4.5 Bloqueos de Sesión

La sección **"Bloqueos de Sesión"** permite definir períodos en que los estudiantes del departamento **no pueden** registrar horas.

**Crear un bloqueo:**
1. Defina la **fecha y hora de inicio** del bloqueo.
2. Defina la **fecha y hora de fin** del bloqueo.
3. (Opcional) Ingrese una **razón** que verán los estudiantes al intentar registrar.
4. Haga clic en **"Crear Bloqueo"**.

**Eliminar un bloqueo:**
- En la lista de bloqueos activos, haga clic en el ícono de eliminar (🗑️) a la derecha del bloqueo.

> **⚠️ Importante:** Los bloqueos se almacenan con zona horaria de Costa Rica (UTC-6). El sistema bloquea automáticamente el cronómetro de los estudiantes durante el rango definido.

### 4.6 Historial del Departamento

La sección **"Historial"** muestra todos los registros del departamento para el ciclo seleccionado.

**Funciones disponibles:**
- **Filtrar:** Por estudiante, estado del registro o fecha.
- **Ordenar:** Por fecha, horas o nombre del estudiante.
- **Exportar en PDF:** Genera un reporte formal del departamento para el período seleccionado (incluye nombre del Jefe, del departamento y totales del ciclo).

### 4.7 Gestión del Kiosco

El kiosco es un modo especial de pantalla para que los estudiantes registren horas de forma presencial (ver [Sección 8](#8-kiosco-de-registro-presencial)).

**Activar el Kiosco:**
1. Haga clic en el botón **"Activar Kiosco"** en la esquina superior derecha.
2. Ingrese su **número de empleado** y **contraseña**.
3. Haga clic en **"Activar"**. La pantalla cambia al modo kiosco.

**Si el kiosco ya está activo:**
- Aparecerán opciones para **Continuar Kiosco** (recuperar sesión existente) o **Desactivar Kiosco** (requiere confirmación de credenciales).

---

## 5. Portal de Administración

El portal de Administración permite gestionar los usuarios del sistema, los departamentos y la tarifa de horas beca.

### 5.1 Pantalla Principal — Dashboard Global

El **Dashboard** es la primera pantalla al ingresar. Muestra:

- **KPIs globales:** Total de registros, horas totales, monto total facturado, registros pendientes por aprobar.
- **Filtros avanzados:** Por departamento, estudiante, rango de fechas, estado del registro.
- **Tabla de bitácoras:** Lista completa de todos los registros del sistema con información de auditoría (quién aprobó, cuándo).
- **Modal de detalle:** Al hacer clic en cualquier registro, se abre un modal con el detalle completo incluyendo historial de estados.

### 5.2 Gestión de Estudiantes

En la pestaña **"Estudiantes"** puede:

**Buscar estudiantes:**
- Use la barra de búsqueda para filtrar por nombre, carnet u otras características.
- Use los filtros de estado (Activo/Inactivo) y los botones de ordenamiento.

**Registrar un nuevo estudiante:**
1. Haga clic en **"Nuevo Estudiante"**.
2. Complete los campos del formulario:
   - **Nombre completo**
   - **Carnet** (identificador de login)
   - **Correo institucional** (debe terminar en `@unadeca.net`)
   - **Departamento asignado**
   - **Contraseña temporal**
3. Haga clic en **"Crear"**. Se enviará un correo de bienvenida automáticamente.

**Editar un estudiante:**
- Use el menú de acciones (⋮) en la fila del estudiante → **Editar**.

**Activar/Desactivar una cuenta:**
- Use el menú de acciones → **Desactivar** o **Activar**. Un usuario inactivo no puede iniciar sesión.

**Eliminar un estudiante:**
- Use el menú de acciones → **Eliminar**. Esta acción es irreversible.

**Resetear contraseña:**
- Use el menú de acciones → **Resetear contraseña**. Ingrese la nueva contraseña temporal. El usuario deberá cambiarla en su próximo ingreso.

### 5.3 Gestión de Jefes de Departamento

La pestaña **"Jefes de Departamento"** funciona de manera idéntica a la de Estudiantes, con la diferencia de que el identificador de login es el **número de empleado**.

### 5.4 Gestión de Departamentos

En la pestaña **"Departamentos"** puede:

**Crear un departamento:**
1. Haga clic en **"Nuevo Departamento"**.
2. Ingrese el **nombre** del departamento.
3. (Opcional) Ingrese el **centro de costos** contable (código alfanumérico usado en exportaciones contables).
4. Asigne un **Jefe de Departamento** de la lista de usuarios disponibles.
5. Haga clic en **"Crear"**.

**Editar un departamento:**
- Use el menú de acciones → **Editar**.

**Eliminar un departamento:**
- Use el menú de acciones → **Eliminar**. Solo es posible si el departamento no tiene horas beca activas.

### 5.5 Gestión de la Tarifa

En el portal de Administración encontrará el control de **Tarifa de Hora Beca**:

1. Ingrese el nuevo monto en colones (₡) por hora.
2. Haga clic en **"Actualizar"**.
3. La nueva tarifa aplica inmediatamente a todos los cálculos futuros.

> **Nota:** La tarifa se usa para calcular el monto bruto de todas las nóminas. Los cambios no afectan retroactivamente registros ya procesados.

---

## 6. Portal de Contabilidad

El portal de Contabilidad centraliza la gestión financiera del programa de horas beca: visualización de nóminas, procesamiento de pagos, generación de reportes y configuración contable.

### 6.1 Pantalla Principal y Barra de Herramientas

Al abrir el portal, verá la barra de herramientas superior con los siguientes controles:

| Control | Descripción |
|---------|-------------|
| **Buscador** | Filtrar por nombre o carnet de estudiante |
| **Filtro por Departamento** | Ver datos de un departamento específico o todos |
| **Modo de período** | Alternar entre vista **Ciclo** (mensual) o **Cuatrimestre** |
| **Selector de período** | Ciclo mensual o cuatrimestre/año específico |
| **⚙️ Configuración** | Abrir modal de configuración contable |
| **↓ Exportar** | Menú desplegable con todas las opciones de exportación |

### 6.2 Indicadores KPI

Cuatro tarjetas muestran el resumen financiero del período seleccionado:

| KPI | Descripción |
|-----|-------------|
| **Total Facturado** | Suma bruta de todas las horas aprobadas × tarifa |
| **Diezmo (10%)** | Deducción obligatoria del 10% del monto bruto |
| **Total Neto a Pagar** | Bruto menos diezmo |
| **Ya Procesado** | Monto de registros ya marcados como procesados |

### 6.3 Gráficas y Análisis Visual

El portal incluye gráficas automáticas:
- **Tendencia de horas por semana:** Barras con el total de horas aprobadas por semana.
- **Distribución por departamento:** Gráfica de pastel con el porcentaje de horas por cada área.
- **Resumen por cuatrimestre:** Comparación de horas acumuladas por período.

### 6.4 Tabla de Nómina por Departamento

La pestaña **"Nómina por Departamento"** muestra el detalle de cada estudiante agrupado por departamento.

**Para cada estudiante se muestra:**
- Nombre y carnet
- Total de horas aprobadas en el período
- Monto bruto, diezmo y neto
- Cuenta por cobrar (CxC) asignada manualmente
- Monto total a pagar (neto − CxC)

**Acciones disponibles:**

**Seleccionar pagos para procesar:**
- Marque la casilla a la izquierda de cada estudiante para seleccionarlo.
- Solo los estudiantes seleccionados serán procesados al confirmar.

**Procesar pagos:**
1. Seleccione los estudiantes a procesar.
2. Haga clic en **"Procesar Pagos"**.
3. Confirme en el diálogo. Los registros se marcarán como **Procesados**.

**Ver detalle de un estudiante:**
- Haga clic en el nombre del estudiante para abrir el **Modal de Detalle** con el historial completo de sus registros y montos en el período.

**Descargar PDF por departamento:**
- En la cabecera de cada grupo de departamento, haga clic en el ícono de PDF para descargar la nómina de ese departamento específico.

**Marcar como registrado:**
- Use el toggle de registro para llevar control interno de los pagos ya tramitados (se guarda localmente en su navegador por período).

### 6.5 Tabla de Resumen General

La pestaña **"Resumen General"** muestra una tabla consolidada con totales por departamento:
- Departamento
- Horas totales
- Bruto, diezmo, neto
- Total por cobrar y por pagar

### 6.6 Exportación de Reportes

Use el menú **"↓ Exportar"** para generar los siguientes archivos:

| Opción | Formato | Contenido |
|--------|---------|-----------|
| **CSV Nómina** | `.csv` | Datos de nómina completos en hoja de cálculo |
| **PDF Nómina** | `.pdf` | Reporte formal agrupado por departamento con encabezado |
| **PDF Resumen** | `.pdf` | Tabla de totales por departamento |
| **TXT Asiento** | `.txt` | Archivo de ancho fijo para importar a sistema contable |

> **⚠️ Requisito para exportar TXT:** Antes de generar el asiento TXT, asegúrese de haber configurado las cuentas contables en la sección de Configuración. Si algún departamento no tiene centro de costos asignado, el sistema emitirá una advertencia.

### 6.7 Configuración Contable

Haga clic en el ícono **⚙️** para abrir el modal de configuración con tres pestañas:

#### Pestaña "Tarifa"
- Ingrese el monto por hora beca en colones (₡).
- Haga clic en **"Guardar"**.

#### Pestaña "Día de Cierre"
- Configure el día del mes en que cierra el período de facturación (por defecto: día 25).
- Este día determina el inicio y fin de cada ciclo de nómina.

#### Pestaña "Importar CxC"
Para importar cuentas por cobrar desde un archivo CSV:
1. Prepare un archivo `.csv` con columnas: `carnet`, `monto`.
2. Haga clic en **"Seleccionar archivo"** y cargue el CSV.
3. Revise la vista previa de los datos.
4. Haga clic en **"Importar"**. Los montos se asignarán automáticamente a cada estudiante.

**Configuración de cuentas contables (para asiento TXT):**

| Campo | Descripción |
|-------|-------------|
| Cuenta Becas | Número de cuenta contable de gastos de becas |
| Nombre Becas | Nombre/descripción de la cuenta |
| Cuenta Diezmo | Número de cuenta de la retención del diezmo |
| Cuenta por Pagar | Cuenta de pasivo para el monto neto a pagar |
| Cuenta por Cobrar | Cuenta para las CxC de estudiantes |

---

## 7. Portal del Super Administrador

El Super Administrador tiene control total sobre el sistema. Gestiona todas las cuentas de usuarios, departamentos y puede operar kioscos de forma remota.

### 7.1 Pantalla Principal — Resumen Global

En la parte superior se muestran **8 tarjetas de indicadores** con el estado global del sistema:

| Tarjeta | Descripción |
|---------|-------------|
| **Total Perfiles** | Número de usuarios registrados en el sistema |
| **Estudiantes** | Total de cuentas con rol Estudiante |
| **Administradores** | Total de cuentas con rol Admin |
| **Jefes Depto** | Total de cuentas con rol Jefe de Departamento |
| **Contabilidad** | Total de cuentas con rol Contabilidad |
| **Departamentos** | Total de departamentos y cuántos tienen jefe asignado |
| **Activos** | Cuentas habilitadas para iniciar sesión |
| **Inactivos** | Cuentas deshabilitadas |

### 7.2 Gestión de Cuentas Administrativas

La sección **"Cuentas Administrativas"** lista a todos los usuarios con roles no-estudiante (Admin, Jefe de Departamento, Contabilidad, Super Admin).

**Funciones disponibles:**
- **Buscar:** Por nombre, correo o número de empleado.
- **Filtrar:** Por estado (Activo / Inactivo / Todos).
- **Ordenar:** Por nombre, fecha de creación u otros campos.
- **Ver detalle:** Haga clic en una cuenta para ver toda su información en un modal.
- **Resetear contraseña:** Menú de acciones (⋮) → **Resetear contraseña**.
- **Activar/Desactivar:** Menú de acciones → **Activar** o **Desactivar**.

### 7.3 Gestión de Cuentas de Estudiantes

La sección **"Estudiantes"** funciona igual a la sección de cuentas, pero filtrada a usuarios con rol Estudiante. Incluye las mismas opciones de búsqueda, filtrado, detalle, reset de contraseña y activación.

### 7.4 Gestión de Departamentos

La sección **"Departamentos"** muestra todos los departamentos con acciones completas de CRUD:

**Crear un departamento:**
1. Haga clic en **"+ Agregar departamento"**.
2. Complete el nombre y (opcionalmente) el centro de costos.
3. Haga clic en **"Crear"**.

**Editar o eliminar:**
- Use el menú de acciones (⋮) en la fila correspondiente.

### 7.5 Crear Nueva Cuenta (Cualquier Rol)

El formulario **"Crear Cuenta"** (columna derecha) permite crear usuarios de cualquiera de los 5 roles disponibles:

**Campos según el rol seleccionado:**

| Campo | Estudiante | Jefe Depto | Admin | Contabilidad | Super Admin |
|-------|:---:|:---:|:---:|:---:|:---:|
| Nombre | ✅ | ✅ | ✅ | ✅ | ✅ |
| Correo `@unadeca.net` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contraseña temporal | ✅ | ✅ | ✅ | ✅ | ✅ |
| Carnet | ✅ | — | — | — | — |
| Número de empleado | — | ✅ | ✅ | ✅ | ✅ |
| Departamento | ✅ | ✅ | — | — | — |

> **Nota:** Al crear una cuenta, el sistema envía automáticamente un correo de bienvenida con las credenciales temporales al correo institucional indicado. El usuario deberá cambiar su contraseña en el primer ingreso.

### 7.6 Activación Remota de Kiosco

El Super Administrador puede activar o desactivar el kiosco de cualquier departamento de forma remota sin necesidad de estar presente físicamente.

**Activar kiosco remoto:**
1. Despliegue la sección **"Activar kiosco remoto"** (ícono de monitor).
2. Seleccione el **departamento** en el menú desplegable.
3. Ingrese su **número de empleado** y **contraseña**.
4. Haga clic en **"Activar kiosco"**.

**Si el kiosco ya está activo:**
- Seleccione **"Continuar Kiosco"** para recuperar la sesión existente.
- Seleccione **"Desactivar Kiosco"** para detenerlo (requiere confirmación de credenciales).

---

## 8. Kiosco de Registro Presencial

El **Kiosco** es un modo especial de pantalla diseñado para instalarse en un computador fijo en el departamento, permitiendo que los estudiantes registren sus horas de forma presencial.

### 8.1 Cómo Funciona

Una vez activado por el Jefe de Departamento (o remotamente por el Super Admin), la pantalla del sistema se convierte en el kiosco del departamento. Los estudiantes pueden:

1. **Iniciar sesión de horas:** Ingresar su carnet y una descripción de la actividad.
2. **Finalizar la sesión:** Cuando terminan de trabajar, ingresan su carnet para cerrar el registro.

### 8.2 Información mostrada en el Kiosco

- Nombre del departamento activo.
- Lista de estudiantes con sesión activa (en tiempo real).
- Estado del turno programado (si el departamento tiene horarios definidos).
- Mensajes de instrucción para el usuario.

### 8.3 Desactivar el Kiosco

Solo el **Jefe de Departamento** o el **Super Administrador** pueden desactivar el kiosco, ingresando sus credenciales en el modal correspondiente.

---

## 9. Notificaciones del Sistema

SENDA envía notificaciones automáticas por **correo electrónico** en los siguientes eventos:

| Evento | Destinatario | Contenido |
|--------|-------------|-----------|
| **Creación de cuenta** | Usuario nuevo | Credenciales temporales y enlace al sistema |
| **Reset de contraseña** | Usuario afectado | Nueva contraseña temporal |
| **Sesión detenida por jefe** | Estudiante | Razón por la que se detuvo la sesión |

> **Nota:** Todos los correos se envían desde `virtual.machine@unadeca.net`. Si no recibe los correos, revise su carpeta de spam o contacte al administrador del sistema.

### 9.1 Notificaciones en Pantalla (Toasts)

El sistema también muestra mensajes de notificación en tiempo real en la esquina superior derecha de la pantalla:
- 🟢 **Verde (Éxito):** Operación completada correctamente.
- 🔴 **Rojo (Error):** Algo salió mal. Lea el mensaje para más detalles.
- 🟡 **Amarillo (Advertencia):** Precaución — revise antes de continuar.
- 🔵 **Azul (Información):** Dato informativo relevante.

---

## 10. Preguntas Frecuentes

### ¿Olvidé mi contraseña? ¿Qué hago?
Comuníquese con el **administrador del sistema** o su **Jefe de Departamento** para solicitar un reset de contraseña. Recibirá una nueva contraseña temporal por correo y deberá cambiarla en su siguiente ingreso.

### El cronómetro no me deja iniciar. ¿Por qué?
Hay dos posibles razones:
1. **Bloqueo de sesión activo:** El Jefe de Departamento ha configurado un bloqueo para el período actual. Consulte la razón mostrada en pantalla.
2. **Sesión en otro dispositivo:** No es posible tener más de una sesión activa simultáneamente.

### ¿Puedo registrar horas en fechas pasadas?
Sí, pero solo el **Jefe de Departamento** puede registrar horas en fechas pasadas mediante el formulario de registro manual. Los estudiantes solo pueden registrar en tiempo real con el cronómetro.

### Mi registro fue rechazado. ¿Qué hago?
Un registro rechazado muestra la razón indicada por el Jefe de Departamento. Consulte con su jefe para aclarar la situación. No es posible apelar un rechazo directamente en el sistema.

### ¿Los datos se actualizan en tiempo real?
Sí. SENDA usa tecnología de **actualización en tiempo real** (Supabase Realtime). Las listas de sesiones activas, registros pendientes y configuraciones se sincronizan automáticamente en todos los dispositivos conectados.

### ¿Cómo sé qué tarifa aplica a mis horas?
La tarifa vigente está visible en:
- La tarjeta de **Resumen Financiero** del portal del Estudiante.
- Los cálculos del portal de Contabilidad.
- El portal de Administración, donde puede actualizarse.

### El PDF generado muestra caracteres incorrectos. ¿Cómo lo soluciono?
El sistema usa las fuentes **Noto Sans** para renderizar correctamente el símbolo ₡ y caracteres con tilde. Si el problema persiste, asegúrese de tener una conexión a Internet estable al generar el PDF (las fuentes se cargan desde el servidor).

---

## 11. Glosario

| Término | Definición |
|---------|-----------|
| **Horas Beca** | Horas de trabajo estudiantil en la institución, remuneradas a una tarifa definida |
| **Ciclo de Facturación** | Período mensual que inicia el día de cierre del mes anterior y termina el día de cierre del mes actual (por defecto: del 25 al 25) |
| **Cuatrimestre** | División del año académico en tres períodos de cuatro meses |
| **Registro / Bitácora** | Entrada individual de horas trabajadas por un estudiante |
| **Estado de registro** | Ciclo de vida de una bitácora: Pendiente → Aprobado / Rechazado → Procesado |
| **Kiosco** | Modo de pantalla para registro presencial de horas en el departamento |
| **Diezmo** | Deducción del 10% sobre el monto bruto generado por horas beca |
| **Monto Neto** | Monto bruto menos el diezmo del 10% |
| **CxC (Cuenta por Cobrar)** | Monto que se descuenta del pago neto del estudiante por deudas con la institución |
| **Centro de Costos** | Código contable asignado a cada departamento para el asiento TXT |
| **Bloqueo de Sesión** | Rango de fechas/horas en que los estudiantes no pueden registrar horas |
| **Sesión Activa** | Sesión de cronómetro en curso de un estudiante |
| **Asiento TXT** | Archivo de texto con formato fijo para importar asientos contables a sistemas externos |
| **Reset de contraseña** | Proceso por el cual un administrador genera una nueva contraseña temporal para un usuario |
| **Carnet** | Identificador único del estudiante, usado como nombre de usuario para iniciar sesión |
| **Número de empleado** | Identificador único del personal no-estudiantil, usado para iniciar sesión |

---

## 12. Matriz de Permisos por Rol

La siguiente tabla resume las acciones disponibles según el rol del usuario:

| Acción | Estudiante | Jefe Depto | Admin | Contabilidad | Super Admin |
|--------|:---:|:---:|:---:|:---:|:---:|
| **Ver mis propias horas** | ✅ | — | — | — | — |
| **Registrar horas (cronómetro)** | ✅ | — | — | — | — |
| **Exportar mis horas (CSV/PDF)** | ✅ | — | — | — | — |
| **Ver horas de su departamento** | — | ✅ | ✅ | ✅ | ✅ |
| **Aprobar/rechazar registros** | — | ✅ | — | — | — |
| **Registrar horas para otro** | — | ✅ | — | — | — |
| **Crear bloqueos de sesión** | — | ✅ | — | — | ✅ |
| **Ver sesiones activas en vivo** | — | ✅ | — | — | ✅ |
| **Activar kiosco** | — | ✅ | — | — | ✅ |
| **Crear/editar usuarios** | — | — | ✅ | — | ✅ |
| **Gestionar departamentos** | — | — | ✅ | — | ✅ |
| **Actualizar tarifa** | — | — | ✅ | — | ✅ |
| **Ver nómina completa** | — | — | — | ✅ | ✅ |
| **Procesar pagos** | — | — | — | ✅ | — |
| **Exportar reportes contables** | — | — | — | ✅ | — |
| **Configurar cuentas contables** | — | — | — | ✅ | — |
| **Importar CxC** | — | — | — | ✅ | — |
| **Crear cuentas (todos los roles)** | — | — | — | — | ✅ |
| **Activar/desactivar cualquier cuenta** | — | — | — | — | ✅ |
| **Activar kiosco remotamente** | — | — | — | — | ✅ |
| **Ver estadísticas globales** | — | — | ✅ | — | ✅ |

---

*Documento generado el 30 de abril de 2026.*  
*SENDA v2.0 — Universidad UNADECA — Todos los derechos reservados.*
