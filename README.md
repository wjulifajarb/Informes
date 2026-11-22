# Educamás V4.6 · Fee de matrículas pagadas

Actualización mínima desde V4.5: únicamente `public/index.html`, `api/report.js` y pruebas. No modifica ni requiere volver a publicar `Code.gs` V3.9.

## Qué incorpora

- Tarjeta **Fee administrativo de matrículas pagadas** = número de estudiantes en estado `Pagado` × tarifa administrativa `Proye-empresa!C20` del grupo.
- Tarjeta **Total pagado + fee para conciliar/descontar** = suma de pagos efectivos de Finanzas (`JULI!BH`) + fee. Solo es completa si **todos** los estudiantes con estado Pagado tienen BH positivo.
- Tarjeta **Provisión estimada (AY + fee)**, explícitamente referencial, cuando todas las matrículas aproximadas están registradas, pero BH aún no está conciliado.
- Desgloses de fees de pagados en tablas de grupos y filiales y en los PDF/PPT por empresa, grupo y consolidado.
- Tarjetas de interfaz y de PDF con tipografía adaptable para cifras monetarias largas.
- Los estados se toman de `JULI!E`; `JULI!A` determina si la postulación está activa; `JULI!B` se excluye.

## Salvaguardas financieras

**NO** se modifica `Proye-empresa!C17` ni `C28`. Los pagos y sus fees pueden estar ya reflejados en el saldo con corte al 30/10/2026. El total calculado sirve para conciliar y descontar solo si Finanzas certifica que aún no se descontó; no se restan saldos dos veces. Si faltan pagos confirmados, muestra Pendiente y la provisión estimada como referencia, NO como desembolso confirmado.

## Instalación

1. Haz copia de seguridad de tu carpeta anterior y de `.env.local` (NO incluida).
2. Si ya tienes V4.5: reemplaza solo `public/index.html` y `api/report.js`.
3. Si necesitas instalación limpia: abre esta carpeta, copia tu `.env.local` privado desde la instalación anterior.
4. `npm install && npm run check && npm test && npm run dev`
5. Comprueba el estado financiero de una empresa con pagados y descarga PDF empresa, grupo y consolidado.
6. No vuelvas a tocar Google Apps Script V3.9 ni las fórmulas de Sheets.
