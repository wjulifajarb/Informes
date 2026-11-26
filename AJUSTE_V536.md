# Ajuste de indicadores Educamás V5.3.6

La hoja **Financiero2027-1** mantiene sus datos sin modificación. El indicador **Pre-aprobado** se calcula con el Estado de la convocatoria (columna E), mientras que **Pre aprobado educamás** se calcula con la aprobación registrada en BM.

En la lectura del 26/11/2026: **129 inscritos**, **90** con `Estado = Pre-aprobado`, **53** con `Aprobación EducaMas = Pre aprobado educamás`. Uno de los 90 tiene el fondo marcado como Retiro de empresa: el estado no se cambia ni se excluye del universo de inscritos por E, que es el mismo criterio usado por la aplicación para el denominador 129.

Se corrigen exclusivamente los KPI, el embudo, el resumen y los informes generados desde el HTML. **El simulador conserva la selección por BM** (preaprobados y casos especiales), BN y BO, así como BI, BU y gastos administrativos.

**Qué cambiar:** sustituir `public/index.html` por el de este paquete y desplegar la web en Vercel. **No cambiar Code.gs ni api/report.js** para este ajuste si ya funcionan con V5.3.5.

**Pruebas:** `npm run check && npm test`.
