# Importación masiva de productos — A Mi Vera

Guía completa para preparar, validar e importar productos desde CSV a Supabase DEV.

---

## 1. Requisitos previos

### Variables de entorno

Asegúrate de que `.env.local` tiene estas tres variables:

```
VITE_SUPABASE_URL=https://<tu-proyecto-dev>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...           ← (ya deberías tenerla)
SUPABASE_SERVICE_ROLE_KEY=eyJ...        ← necesaria solo para los scripts
```

> **Seguridad**: `SUPABASE_SERVICE_ROLE_KEY` **no** tiene prefijo `VITE_`, por lo que Vite nunca la incluirá en el bundle del navegador. Solo la leen los scripts de Node.js locales.
>
> Encuentra la `service_role` key en: Supabase Dashboard → Project Settings → API → Service role key.

---

## 2. Plantilla CSV

El archivo de referencia está en `import/productos-template.csv`.

Cópialo y renómbralo (por ejemplo, `import/mis-productos.csv`) antes de editarlo.

### Columnas disponibles

| Columna | Obligatorio | Tipo | Descripción |
|---------|-------------|------|-------------|
| `titulo` | ✅ | Texto | Nombre del producto |
| `precio` | ✅ | Número ≥ 0 | Precio en €. Acepta decimales con punto: `18.50` |
| `categoria` | ✅ | Texto | Nombre exacto de la categoría. Se crea si no existe. |
| `descripcion` | — | Texto | Descripción del producto. Puede quedar vacía. |
| `stock` | — | Entero ≥ 0 | Unidades disponibles. Vacío = 0. |
| `visible` | — | Booleano | Si aparece en la tienda. Vacío = `true`. |
| `destacado` | — | Booleano | Si aparece en secciones destacadas. Vacío = `false`. |
| `nuevo` | — | Booleano | Si muestra la etiqueta "Nuevo". Vacío = `false`. |
| `imagen_url_1` | — | URL | Imagen principal (http/https). |
| `imagen_url_2` | — | URL | Imagen secundaria. |
| `imagen_url_3` | — | URL | Imagen 3. |
| `imagen_url_4` | — | URL | Imagen 4. |
| `notas` | — | Texto | Notas internas. No se importa a la DB. |

### Valores válidos para campos booleanos

| Valor | Resultado |
|-------|-----------|
| `true`, `sí`, `si`, `1`, `yes` | `true` |
| `false`, `no`, `0` | `false` |
| (vacío) | se usa el valor por defecto |

---

## 3. Preparar el CSV

### Opción A: desde Google Sheets / LibreOffice Calc

1. Abre `import/productos-template.csv` en tu hoja de cálculo.
2. Rellena las filas (no modifiques la primera fila de cabecera).
3. Exporta como **CSV (UTF-8)**. En Excel: "Guardar como" → "CSV UTF-8 (delimitado por comas)".

### Opción B: desde el catálogo de WhatsApp Business

1. Abre WhatsApp Business en el móvil → Catálogo.
2. Copia título, precio, descripción e imagen de cada producto.
3. Pégalo en la plantilla.
4. Descarga las imágenes a un hosting (Google Drive público, Cloudinary, etc.) y pega las URLs.

### Reglas de formato

- La primera fila **debe** ser exactamente la cabecera del template (no cambiar el orden ni el nombre de las columnas).
- Los textos con comas deben ir entre comillas: `"Copa, vaso y jarra"`.
- Guarda siempre en **UTF-8** para que los caracteres españoles (á, ñ, ü) no se corrompan.
- El precio usa **punto** como decimal: `18.50` (no coma).

---

## 4. Validar el CSV

Antes de importar, ejecuta el validador:

```bash
npm run import:validate -- import/mis-productos.csv
```

El validador comprueba:
- Títulos, precios y categorías no vacíos.
- Precios numéricos y ≥ 0.
- Stock entero ≥ 0 (si existe).
- Booleanos en formato válido.
- URLs de imagen con protocolo http/https.
- Slugs duplicados dentro del propio CSV.

Si hay errores, los reporta por fila y campo. **No toca la base de datos.**

Ejemplo de salida correcta:
```
Validando 42 fila(s) en "import/mis-productos.csv"...

✅  42 producto(s) válido(s).
   Categorías detectadas (5): Pasión por el vino · Pasión por la madera · ...
   Slugs a generar: copa-de-vino-personalizada, tabla-de-madera-con-foto, ...

El CSV está listo para importar con:
   npm run import:dev -- import/mis-productos.csv
```

---

## 5. Importar a Supabase DEV

### Primero: prueba en modo dry-run

El dry-run no escribe nada en la base de datos. Solo muestra lo que haría:

```bash
npm run import:dev -- import/mis-productos.csv --dry-run
```

### Importación real

```bash
npm run import:dev -- import/mis-productos.csv
```

El script:
1. Carga `.env.local` (con `SUPABASE_SERVICE_ROLE_KEY`).
2. Valida el CSV completo — aborta si hay errores.
3. Crea las categorías que no existan en la DB.
4. Detecta conflictos de slug con productos ya existentes y añade sufijo (`-2`, `-3`...).
5. Inserta cada producto con sus imágenes como URL externa.
6. Muestra un resumen al final.

Ejemplo de salida:
```
────────────────────────────────────────────────────────────
Importador A Mi Vera — Supabase DEV
────────────────────────────────────────────────────────────
Archivo : import/mis-productos.csv
Filas   : 42
URL DEV : https://xyzxyz.supabase.co

✅  Validación OK — 42 producto(s) listos para importar.

Importando productos...

   [1/42] "Copa de vino personalizada"... OK (1 imagen)
   [2/42] "Tabla de madera con foto"... OK (2 imágenes)
   ...

────────────────────────────────────────────────────────────
Importación completada
────────────────────────────────────────────────────────────
✅  Creados : 42
```

---

## 6. Después de la importación

- Verifica los productos en `/admin/productos` (con `npm run dev`).
- Ajusta el orden arrastrando desde el panel si es necesario.
- Si quieres subir imágenes reales a Storage, edita cada producto desde el formulario admin y carga los archivos — el importador las deja como URL externa de momento.

---

## 7. Volver a importar (segunda ejecución)

El script detecta slugs que ya existen en la DB y los renombra automáticamente (`-2`, `-3`...). Si quieres reimportar el mismo CSV limpios, borra primero los productos anteriores desde el panel admin.

---

## 8. Preguntas frecuentes

**¿Puedo importar a PROD?**
No. El script lee `VITE_SUPABASE_URL` de `.env.local`, que siempre debe apuntar a DEV. Las claves de PROD van en Vercel.

**¿Qué pasa si falla una fila a mitad?**
El script continúa con las siguientes y reporta los fallos al final. Los productos insertados antes del error quedan en la DB.

**¿Cuántas imágenes por producto?**
Hasta 4 (imagen_url_1 a imagen_url_4). WhatsApp Business solo tiene una imagen por producto, así que imagen_url_2..4 quedarán vacías si el origen es WhatsApp. Se pueden completar después desde el formulario admin.

**¿Las imágenes se suben a Supabase Storage?**
No, en esta fase se insertan solo como URL. Para moverlas a Storage, edita el producto desde el admin y carga el archivo.
