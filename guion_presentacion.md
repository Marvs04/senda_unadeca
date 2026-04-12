# Guion de Presentación: Módulo de Contabilidad SENDA

*Este documento es una guía paso a paso para explicar las nuevas funcionalidades del módulo de contabilidad a tu profesor y equipo.*

---

## 1. Introducción al Módulo (La Visión General)
**[Pantalla recomendada: Dashboard de Contabilidad con los totales]**

> "Profesor, buenas tardes. Hoy quiero presentarle la culminación del **Módulo de Contabilidad** de SENDA. El objetivo principal de este módulo es actuar como el puente entre el sistema de registro de horas (las becas de los estudiantes) y el ERP financiero de la universidad. 
> 
> En este dashboard, la contabilidad puede ver en tiempo real, agrupado por ciclo o mes, el total facturado, el monto que va para Fondo de Diezmos, y el Neto a Pagar real a los estudiantes, ya descontando el diezmo."

---

## 2. El Botón "CONFIG" — El Corazón de la Integración
**[Acción: Haz clic en el botón CONFIG y muestra el Modal de Configuración]**

> "Para que el sistema de SENDA pueda comunicarse correctamente con el sistema contable de la universidad, creamos esta ventana de **Configuración de Cuentas y Centros de Costo** que se abre con este botón 'CONFIG'.
> 
> **¿Qué hace exactamente este botón?**
> 1. **Cuentas Globales:** Aquí Finanzas define exactamente a qué cuentas contables (los números de cuenta del plan de cuentas de la universidad) deben ir dirigidos los rubros de: **Becas** (Gasto), **Diezmo** (Pasivo/Fondo), **Cuentas por Pagar** (lo que se le debe al estudiante) y **Cuentas por Cobrar** (si el estudiante le debe a la U).
> 2. **Centros de Costo (Los Departamentos):** En la parte de abajo, le asignamos a cada departamento (por ejemplo Mantenimiento, U Virtual) su **Centro de Costo** específico con un formato estricto `NN-NN-NN` (ej. 10-00-01). 
> 
> **¿Por qué es vital?** Porque cuando exportemos el archivo `.TXT` para inyectarlo al ERP de la universidad, el archivo necesita saber de qué presupuesto departamental rebajar el dinero, y a qué cuentas mandar los totales."

---

## 3. Revisión y Ajustes por Estudiante
**[Acción: Cierra el modal de CONFIG, baja a la lista de estudiantes y haz clic en el botón con el ícono de Ojo u Opciones para abrir el Modal de Detalle del Estudiante]**

> "Antes de exportar nada, Contabilidad puede revisar estudiante por estudiante si la información es correcta. 
> 
> En este panel detallado, agregamos **6 indicadores clave (KPIs)**:
> - Horas y Bruto
> - **Diezmo:** que se calcula y resta automáticamente.
> - **Neto:** el Bruto menos el Diezmo.
> - **Cuentas por Cobrar:** un campo donde Finanzas puede ingresar manualmente si el estudiante le debe algo a la universidad (por matrícula, etc.).
> - **A PAGAR:** El total final dinámico y blindado.
> 
> Además, desde aquí se puede exportar un **PDF Individual** que sirve como comprobante o colilla de pago para ese estudiante en específico."

---

## 4. Las Opciones de Exportación Múltiple
**[Acción: Cierra el modal, vuelve arriba a los botones CSV, PDF y TXT]**

> "Finalmente, cuando todo cuadra, tenemos tres opciones principales de salida:
> 
> 1. **CSV**: Para que Finanzas pueda trabajar los datos en bruto en Excel si así lo desean.
> 2. **PDF**: Genera un reporte oficial de cierre, con membrete de la institución, separado por departamento con subtotales y totales generales. *(Nota: El símbolo de colones se ajustó a 'C' en el PDF para garantizar la compatibilidad con cualquier lector o impresora anticuada de Finanzas).*
> 3. **TXT (El Archivo de Asientos):** Esta es la funcionalidad estrella. Al hacer clic aquí, el sistema genera un archivo de texto plano de ancho fijo (Fixed-Width) programado **exactamente bajo los estándares del sistema ERP actual de la universidad**.
>    - Crea de 3 a 4 líneas contables **dinámicas por cada departamento** (dependiendo de si generaron Diezmo o hay Cuentas por Cobrar).
>    - Toma los códigos de cuenta y centros de costo que vimos en el botón **CONFIG**.
>    - Y al final del archivo, inyecta una línea de **Auditoría de Balance** que asegura que la suma de Débitos y Créditos es idéntica ($0 de diferencia), previniendo errores de importación en el departamento de Finanzas."

---

## 5. Cierre
> "Con esto, logramos automatizar un proceso que antes requería transcripción manual, cálculos propensos a errores humanos, y cruce de datos entre departamentos. Senda ahora entrega formatos listos para importar."
