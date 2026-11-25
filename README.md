# Educamás 2027-I — ajuste puntual del simulador V5.3.1

Esta entrega parte de la versión **5.3** que ya tiene conexión a `Financiero2027-1` y a las 19 parejas `Estudiantes-[Empresa]` y `Proye-[Empresa]`.

## Solo debes reemplazar dos archivos

| Ubicación | Cambio | ¿Reemplazar? |
|---|---|---|
| `apps-script/Code.gs` | Incluye en la API el campo **Capacidad de endeudamiento** de la columna **BL** (`debtCapacity`). No cambia hojas ni fórmulas. | **Sí**. Publica una **nueva versión de la misma implementación** `/exec` de Apps Script. |
| `public/index.html` | Ajusta únicamente el simulador y la tabla de estudiantes. | **Sí**. Publica la nueva web en Vercel. |
| `api/index.js` | Mantiene la API y su control `5.3.*`, que acepta `5.3.1`. | No, conservar el existente. |
| `api/report.js` | Mantiene PDF y PPTX de V5.3. | No, conservar el existente. |
| `server.js`, `vercel.json`, `.env.local` | Sin cambios. | No. |

### Criterios de simulación

- **BM / Aprobación EducaMas:** preaprobados y casos especiales aparecen con casillas seleccionables.
- **BN / Estado Aprobacion Empresa:** se muestra el estado exacto y se pueden seleccionar también los ya aprobados no pagados.
- **BO / Status Final:** si `Pagado`, la persona está **incluida automáticamente** en el escenario y no puede desmarcarse.
- **BI / Valor a Financiar:** valor que se suma si la persona está pendiente y es seleccionada.
- **BL / Capacidad de endeudamiento:** valor mostrado en la lista para facilitar la decisión; **no se suma** a las matrículas.
- **BU / Vr. Final pago matricula:** valor que se suma si `Status Final=Pagado`; no se sustituye por BI si falta.
- **Tarifa administrativa:** se toma de la hoja `Proye-[Empresa]` de cada persona, una vez por persona incluida, también para los pagados. El escenario local puede usar el valor opcional de tarifa ingresado por el usuario, igual que antes.
- **Limpiar selección pendiente:** quita únicamente selecciones manuales y conserva a todos los pagados.
- El simulador utiliza el universo del grupo/empresa seleccionado, aunque los filtros de caracterización excluyan pagos. No altera el Google Sheets ni la proyección oficial.
- Los datos monetarios vacíos se muestran como **Pendiente**; no se imputan cifras.

## Pruebas locales

Ejecuta en la carpeta del proyecto:

```bash
npm ci
npm run check
npm test
npm run dev
```

Incluye prueba específica `scripts/test-v531.js` para verificar las casillas, los pagos automáticos, la lectura BL y los cálculos BI/BU con fee. Las capturas incluidas en la entrega se generaron con datos sintéticos de demostración, no con datos personales reales.

## Instalación

1. Abre el Apps Script en producción. Reemplaza el código completo de `Code.gs` y publica **Implementar → Administrar implementaciones → Editar → Nueva versión**. Conserva el `API_TOKEN` existente en Propiedades del script. No publiques ni envíes tus secretos.
2. En el proyecto de Visual Studio Code reemplaza `public/index.html` por el archivo incluido.
3. Conserva `api/index.js`, `api/report.js` y `.env.local` sin cambios; publica la web con el mismo procedimiento que utilizas para Vercel.
4. Abre la empresa que quieras, entra al simulador y compara BI, BL, BU y fee con la hoja `Estudiantes-[Empresa]` y `Proye-[Empresa]` correspondientes.

**No se modificó Google Sheets.** El equipo debe verificar los datos reales después del despliegue; las pruebas de esta entrega fueron locales con datos de ejemplo.
