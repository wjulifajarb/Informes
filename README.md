# Educamás · Fondos educativos V3

Proyecto independiente. No reemplaza ni altera los proyectos Apps Script de otras automatizaciones. La API abre por ID el Google Sheets Base_2027 - I y lee JULI-2027-1 (encabezados en fila 2). El backend Node genera los archivos PDF y PPTX directamente, sin Google Slides ni Drive API. Los datos no se incluyen en el código.

## Instalación

1. Abre esta carpeta en VS Code. Usa Node.js 22. Terminal: `npm install`, luego `npm run secrets`. Guarda el token nuevo de 64 caracteres en privado.
2. En una nueva pestaña, entra a https://script.google.com/home y crea un **Nuevo proyecto** independiente (NO Extensiones > Apps Script del Sheet). Nombre: API Educamás Informes V3. Pega completo `apps-script/Code.gs` en Código.gs y guarda. No crees Index.html. El manifiesto opcional está en `apps-script/appsscript.json`.
3. En el engranaje de Apps Script > Propiedades de script > Añadir propiedad: `API_TOKEN`, valor: el token nuevo. Guardar.
4. En el editor, selecciona `testConnection` y pulsa Ejecutar. Autoriza con la cuenta que tiene acceso a la hoja. El registro de ejecución muestra solamente el número de filas. Si quieres preparar las hojas financieras, ejecuta `setupFinance` (opcional; crea únicamente hojas faltantes, no cambia la convocatoria). No ejecuta automatizaciones ajenas.
5. Implementar > Nueva implementación > Aplicación web. Ejecutar como Yo; acceso Cualquiera (incluido sin cuenta Google) solo si TI autoriza un endpoint con token. GET no entrega información personal; POST requiere el token. Si tu organización bloquea esa opción, no cambies la política: necesitas autenticación institucional / Google Sheets API. No hagas público el Sheet.
6. Copia la NUEVA URL `/exec` (no la anterior). Abrirla debe mostrar el mensaje JSON `Educamas 2027-1 V3`. Si el navegador en incógnito requiere iniciar sesión, la arquitectura actual no funcionará desde Node sin autenticación Google adicional.
7. En VS Code: `npm run configurar`. Pega la nueva URL y el token nuevo cuando te los solicite; crea `.env.local` y genera una contraseña local distinta y un secreto de sesión. Guarda la contraseña de acceso privado. No subas ese archivo a Git.
8. `npm run conectar` para probar GET/POST sin imprimir datos personales. `npm run check` y `npm test` (pruebas ficticias). `npm run dev`. Abre http://localhost:3000 e ingresa la contraseña que generó el paso 7.

## Uso y descargas

- Todos los grupos y empresas: indicadores globales y consolidado por empresa. Seleccionar grupo: consolidado y detalle de sus empresas. Seleccionar empresa: informe específico.
- El filtro de estado y el buscador afectan la tabla y CSV; el informe ejecutivo siempre calcula todos los estados del alcance. La vista previa enseña el contenido de las secciones. PDF y PowerPoint reproducen la línea visual de los ejemplos con tablas, indicadores, barras, portada y paginación; no son una copia pixel a pixel. Los textos del PPTX son editables. La longitud varía según los datos. Si el informe global es demasiado grande para el límite de respuesta del hosting, exporta por grupo.
- Base completa: todas las columnas originales en tabla paginada, incluyendo duplicados; CSV completo filtrado. Actualización cada 60 segundos mientras la ventana esté activa. Los indicadores cuentan postulaciones deduplicadas por grupo + empresa + identificación (nombre si no hay documento) + programa, no filas brutas. Los duplicados discrepantes se señalan, y se excluyen de importes de proyección hasta validarlos. Las empresas faltantes no se asignan por inferencia salvo los grupos simples Transportes Vigía, Residere y EducaMás (regla explícita). El estado interno prevalece para definir formalización; el estado del fondo prevalece en cierres. Pagado es un subconjunto separado de aprobados. Permanencia/graduación son preliminares sobre antiguos registrados, no el padrón completo 2026-2. Se conserva Sin dato en perfiles y solo motivaciones válidas en el porcentaje de valoración.

## Finanzas (opcional)

Ejecuta `setupFinance` desde el nuevo proyecto Apps Script para crear las hojas que falten. No sobreescribe hojas existentes. Los encabezados deben mantenerse exactos. Las filas se asocian por Grupo y Empresa; Empresa vacía representa un fondo del grupo. Los fondos compartidos no se copian a filiales ni se suman automáticamente con fondos separados.

- `FONDOS-2027-1`: saldo neto al corte, fee por estudiante, costo de convocatoria pendiente, recuperación adicional proyectada, cartera recuperada/pendiente, observaciones, donaciones, matrículas pagadas descontadas y fee pagado descontado. Si se crea desde cero, precarga Vigía con los valores informados, corte y demás movimientos pendientes de confirmar. Si ya existe, no se modifica. El saldo neto es la entrada del simulador: no se descuentan pagos nuevamente.
- `CARTERA-2027-1`: pago de matrículas 2026-2, becas, vigencias anteriores, recuperado. La app obtiene total a recuperar y saldo pendiente si las cifras están completas.
- `CUOTAS-CARTERA-2027-1`: rubro y valor pendiente (nómina, prima, vigencias anteriores u otros según corresponda).
- `NOVEDADES-CARTERA-2027-1`: nombre/referencia, vigencia, saldo, probabilidad de recuperación y observaciones. Para 2026-2 escribe exactamente 2026-2 o 2026-II.

Los cambios financieros en interfaz son borradores locales, no persisten al cerrar. Para guardar cifras definitivas, edita las hojas financieras; el aplicativo las recargará. No modifica estados de postulantes. El simulador toma saldo neto + recuperación adicional − matrículas pendientes − fee de los seleccionados − costo pendiente. No incluye pagados ni casos cerrados. No cierra un escenario con matrículas seleccionadas que tengan valores dudosos; el umbral técnico de validación inicial es COP 1.000 (ajustable en CFG.minTuition). No se multiplica por períodos ni se descuentan abonos no confirmados. En la proyección estándar pueden mostrarse totales parciales claramente descritos. La integración con Financiero2027-1 y endpoints financieros queda pendiente.

## Seguridad y despliegue posterior

No despliegues los datos personales con una contraseña compartida sin revisión de TI. La aplicación local usa cookie HttpOnly, token de servidor, respuestas no almacenables y contraseña distinta. Para producción, añade SSO institucional, permisos por rol y auditoría, y configura las variables en Vercel sin subir secretos. El nuevo proyecto evita conflictos con funciones anteriores, pero por sí solo no elimina HTTP 401 si Workspace impide el acceso de Node. Si ambas API viejas y nuevas quedan activas, desactiva exclusivamente la implementación antigua de nuestro aplicativo tras confirmar que no la usa nadie; jamás desactives otras automatizaciones.

Pruebas: `npm run check`, `npm test`, `npm run conectar`. Las primeras dos usan sintaxis y datos ficticios; la tercera requiere la nueva implementación real. No se ha desplegado ni probado contra la cuenta institucional. El código no contiene las claves compartidas anteriormente.
