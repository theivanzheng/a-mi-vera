#!/usr/bin/env python3
"""
Genera import/catalogo-final.json combinando:
  - catalogo_amivera_manual_Ivan.xlsx  → título, precio, descripción, prefijo imagen
  - Fotos Productos/                    → emparejamiento de fotos por prefijo
  - CATEGORIAS_FINALES (abajo)          → categorías acordadas por producto

Salida: array de objetos { id, title, slug, price, description, categories, photos }
Este JSON es la fuente única y revisable para el importador a Storage (Fase 7B).
"""
import zipfile, re, html, os, json, unicodedata
import xml.etree.ElementTree as ET

XLSX = 'catalogo_amivera_manual_Ivan.xlsx'
FOTOS_DIR = 'Fotos Productos'
OUT = 'import/catalogo-final.json'

# ── Categorías finales por ID de producto (acordadas con el cliente) ──────────
CATEGORIAS_FINALES = {
    1:  ['Especial primera comunión', 'Nuestros peques'],
    2:  ['Regalos con foto', 'Pasión por la madera'],
    3:  ['Vivan los novios'],
    4:  ['Pasión por la madera'],
    5:  ['Pasión por el vino'],
    6:  ['Regalos únicos', 'Pasión por la madera'],
    7:  ['Regalos únicos'],
    8:  ['Regalos con foto'],
    9:  ['Nuestros peques'],
    10: ['Vivan los novios', 'Pasión por la madera'],
    11: ['Especial primera comunión', 'Nuestros peques'],
    12: ['Regalos únicos'],
    13: ['Regalos únicos'],
    14: ['Regalos únicos'],
    15: ['Detalles con magia', 'Pasión por la madera'],
    16: ['Pasión por el vino', 'Pasión por la madera'],
    17: ['Regalos con foto', 'Nuestros peques'],
    18: ['Nuestros peques', 'Regalos únicos'],
    19: ['Pasión por la madera', 'Regalos con foto'],
    20: ['Detalles con magia', 'Regalos únicos'],
    21: ['Pasión por el vino'],
    22: ['Detalles con magia', 'Maestros cerveceros'],
    23: ['Vivan los novios'],
    24: ['Vivan los novios'],
    25: ['Vivan los novios'],
    26: ['Somos de cava'],
    27: ['Somos de cava'],
    28: ['Nuestros peques'],
    29: ['Regalos con foto'],
    30: ['Detalles con magia', 'Regalos con foto'],
    31: ['Regalos únicos'],
    32: ['Regalos únicos'],
    33: ['Regalos únicos'],
    34: ['Especial primera comunión'],
    35: ['Especial primera comunión'],
    36: ['Especial primera comunión'],
    37: ['Maestros cerveceros'],
    38: ['Pasión por el vino'],
    39: ['Pasión por el vino'],
    40: ['Pasión por la madera'],
    41: ['Pasión por la madera'],
    42: ['Detalles con magia', 'Pasión por la madera'],
    43: ['Regalos con foto'],
    44: ['Regalos con foto'],
    45: ['Detalles con magia'],
    46: ['Regalos con foto'],
}

# ── Correcciones de prefijo de imagen (errores en la columna del Excel) ───────
OVERRIDES = {
    1:  ['huchas_caja_fuerte'],
    9:  ['funko', 'funkos'],
    10: ['corazon_madera'],
    12: ['joyero_viaje_corazon', 'joyero_viaje_cortazon'],
    28: ['bodys_bebe'],
    38: ['copas_cajas_vino', 'copas_caja_vino'],
}

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def strip_accents(x):
    return ''.join(c for c in unicodedata.normalize('NFD', x) if unicodedata.category(c) != 'Mn')


def norm(x):
    x = strip_accents(x.lower())
    x = re.sub(r'\.jpg$', '', x)
    x = re.sub(r'[^a-z0-9]+', '_', x).strip('_')
    return x


def clean_name(s):
    s = s.replace(chr(0x1F49B), '')
    out = ''.join(c for c in s if unicodedata.category(c) not in ('So', 'Sk', 'Cs', 'Co', 'Cn')
                  and c not in ('️', '‍', '♀', '♂'))
    return re.sub(r'\s+', ' ', out).strip()


def to_slug(text):
    t = strip_accents(text.lower())
    t = re.sub(r'[^a-z0-9\s-]', '', t).strip()
    return re.sub(r'[\s-]+', '-', t)


def parse_price(raw):
    s = raw.replace('€', '').replace(' ', '').strip()
    if ',' in s and '.' not in s:
        s = s.replace(',', '.')
    else:
        s = s.replace(',', '')
    return round(float(s), 2)


def read_rows():
    z = zipfile.ZipFile(XLSX)
    shared_xml = z.read('xl/sharedStrings.xml').decode('utf-8')
    shared = [html.unescape(re.sub('<[^>]+>', '', m)) for m in re.findall(r'<si>(.*?)</si>', shared_xml, re.S)]
    root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = []
    for row in root.iter(NS + 'row'):
        cells = {}
        for c in row.iter(NS + 'c'):
            col = re.match(r'[A-Z]+', c.get('r')).group()
            v = c.find(NS + 'v')
            t = c.get('t')
            val = ''
            if v is not None:
                val = shared[int(v.text)] if t == 's' else v.text
            cells[col] = val
        rows.append(cells)
    return rows


def match_files(prefixes, files):
    res = []
    for f in files:
        fn = norm(f)
        for p in prefixes:
            p = norm(p)
            if fn == p or re.match(re.escape(p) + r'_?\d+$', fn):
                res.append(f)
                break

    def key(f):
        m = re.findall(r'\d+', f)
        return (0 if not m else int(m[-1]), f.lower())
    return sorted(set(res), key=key)


def main():
    rows = read_rows()
    files = [f for f in sorted(os.listdir(FOTOS_DIR)) if f.lower().endswith('.jpg')]
    out = []
    used = set()
    problems = []

    for r in rows[1:]:
        pid = int(r.get('A', '0') or 0)
        if pid == 0:
            continue
        name = clean_name(r.get('B', ''))
        precio = parse_price(r.get('C', ''))
        descripcion = (r.get('D', '') or '').strip()
        img = r.get('E', '')

        prefixes = OVERRIDES.get(pid, [img] if img else [])
        prefixes = [p for p in prefixes if p]
        prefixes.append(name)
        photos = match_files(prefixes, files)
        for f in photos:
            used.add(f)

        cats = CATEGORIAS_FINALES.get(pid, [])
        if not photos:
            problems.append(f'[{pid}] {name}: SIN FOTOS')
        if not cats:
            problems.append(f'[{pid}] {name}: SIN CATEGORIAS')

        out.append({
            'id': pid,
            'title': name,
            'slug': to_slug(name),
            'price': precio,
            'description': descripcion,
            'categories': cats,
            'photos': photos,
        })

    os.makedirs('import', exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)

    orphans = [f for f in files if f not in used]
    print(f'→ {OUT}')
    print(f'Productos: {len(out)}  |  Fotos asignadas: {len(used)}/{len(files)}  |  Huérfanas: {len(orphans)}')
    for o in orphans:
        print('   HUÉRFANA:', o)
    if problems:
        print('PROBLEMAS:')
        for p in problems:
            print('  ', p)
    else:
        print('Sin problemas: todos los productos tienen fotos y categorías.')


if __name__ == '__main__':
    main()
