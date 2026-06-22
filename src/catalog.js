const baseProducts = [
  { id: 'p-00001', officialName: 'Clavo comun 1 pulgada', brand: 'Generico', category: 'Ferreteria', internalCode: 'CLA-1', barcode: '7790000000011', unit: 'kg', suppliers: ['Aceros Centro'], aliases: ['clavo chico', 'clavitos', 'clavo común', 'clavo 1 pulgada'] },
  { id: 'p-00002', officialName: 'Tornillo autoperforante 8 x 1/2', brand: 'Fixer', category: 'Tornilleria', internalCode: 'TOR-8-12', barcode: '7790000000028', unit: 'caja', suppliers: ['Bulonera Norte'], aliases: ['tornillo chapa', 'autoperforante chico'] },
  { id: 'p-00003', officialName: 'Cemento gris bolsa 50 kg', brand: 'Loma Negra', category: 'Construccion', internalCode: 'CEM-50', barcode: '7790000000035', unit: 'bolsa', suppliers: ['Materiales Sur'], aliases: ['cemento', 'bolsa cemento', 'cemento 50'] },
  { id: 'p-00004', officialName: 'Pintura latex interior blanco 20 l', brand: 'Alba', category: 'Pinturas', internalCode: 'PIN-LAT-20', barcode: '7790000000042', unit: 'balde', suppliers: ['Pintureria Mayorista'], aliases: ['latex blanco', 'pintura blanca 20', 'balde latex'] }
];

const categories = ['Ferreteria', 'Tornilleria', 'Construccion', 'Pinturas', 'Electricidad', 'Plomeria', 'Herramientas', 'Seguridad', 'Adhesivos', 'Jardineria'];
const brands = ['Generico', 'Fixer', 'Alba', 'Loma Negra', 'Tramontina', 'Bosch', 'Sica', 'Stanley', 'Philips', 'Tigre'];
const suppliers = ['Aceros Centro', 'Bulonera Norte', 'Materiales Sur', 'Pintureria Mayorista', 'Distribuidora Industrial', 'Electricos Ruta 8'];
const productFamilies = ['Arandela', 'Cable bipolar', 'Llave termica', 'Cinta aisladora', 'Caño PVC', 'Pegamento', 'Martillo', 'Disco corte', 'Guante moteado', 'Brocha'];

function buildGeneratedProduct(index) {
  const family = productFamilies[index % productFamilies.length];
  const category = categories[index % categories.length];
  const brand = brands[index % brands.length];
  const supplier = suppliers[index % suppliers.length];
  const size = `${(index % 40) + 1}${index % 3 === 0 ? ' mm' : index % 3 === 1 ? ' pulg' : ' un'}`;
  const idNumber = String(index + 5).padStart(5, '0');
  const internalCode = `${category.slice(0, 3).toUpperCase()}-${idNumber}`;
  return {
    id: `p-${idNumber}`,
    officialName: `${family} ${brand} ${size}`,
    brand,
    category,
    internalCode,
    barcode: `779${String(index + 100000000).padStart(10, '0')}`,
    unit: index % 5 === 0 ? 'caja' : index % 5 === 1 ? 'unidad' : index % 5 === 2 ? 'kg' : index % 5 === 3 ? 'bolsa' : 'metro',
    suppliers: [supplier, suppliers[(index + 2) % suppliers.length]],
    aliases: [`${family.toLowerCase()} ${size}`, `${brand.toLowerCase()} ${family.toLowerCase()}`, internalCode.toLowerCase()]
  };
}

export function createCatalog(size = 8200) {
  const generatedCount = Math.max(0, size - baseProducts.length);
  return [...baseProducts, ...Array.from({ length: generatedCount }, (_, index) => buildGeneratedProduct(index))];
}

export const products = createCatalog();
export { baseProducts };
