# Educamás · Informe dinámico 2027-I · versión 5.3.4

**Alcance confirmado — grupo, empresa o global.** Esta entrega corrige exclusivamente el flujo de selección del HTML. No reescribe el Google Sheets, no modifica sus fórmulas ni requiere una nueva publicación de Apps Script si ya funciona V5.3.3.

## Selección de alcance

- **Consolidado global:** «Grupo / empresa → Consolidado global · todas las empresas» y pulsar «Confirmar empresa / grupo», o «Restablecer filtros».
- **Todo un grupo:** elegir, por ejemplo, «Grupo Falic» y dejar «Empresa dentro del grupo → Todo el grupo»; confirmar. Incluye las personas del grupo, pero toma el saldo del fondo principal una sola vez.
- **Empresa / filial:** elegir el grupo principal y después la empresa concreta; confirmar. El informe, las tablas y las descargas muestran solo esa empresa y su propia proyección.
- **Empresa independiente:** elegir la empresa en el primer selector; el segundo se deshabilita y no se asigna un grupo artificial.

Al cambiar un selector, la vista confirmada **no cambia** hasta pulsar «Confirmar empresa / grupo». Mientras exista una nueva selección sin confirmar, las descargas se deshabilitan. El indicador «Alcance confirmado» deja claro qué empresa o grupo está representado.

**Se conserva** la vista de estudiantes, el embudo, la continuidad, las finanzas, los escenarios BI/BU y fee, el porcentaje BL, la cartera, los CSV, PDF/PPTX, los filtros de estado y el estilo responsive. La descarga usa la misma selección confirmada que la plataforma.

## Reemplazar

| Archivo del ZIP | Destino |
| --- | --- |
| `public/index.html` | `public/index.html` del proyecto actual en VS Code/Vercel |

**Los demás archivos se incluyen por comodidad, pero no requieren reemplazo** si ya se instaló la V5.3.3: `apps-script/Code.gs`, `api/index.js`, `api/report.js`, `server.js`, `vercel.json`. No sobrescribir `.env.local`.

## Verificar

```bash
npm ci
npm run check
npm test
npm run dev
```

Probar las cuatro opciones (global, grupo, filial y empresa independiente) y el comportamiento antes/después de confirmar. Las pruebas locales incluyen escritorio de 1440 px y móvil de 390 px, sin desbordamiento horizontal.

## Limitaciones

Esta versión es un archivo listo para publicar, no una publicación en tu Vercel. La verificación de datos conectados se limita a la estructura de la versión previa y las pruebas locales; debes probar un informe real una vez realizado el despliegue.
