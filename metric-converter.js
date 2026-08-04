const UNIT_PAIRS = [
  {
    sourceAttr: 'data-pkg-hp', // attribute holding the horsepower element
    targetAttr: 'data-pkg-kw', // attribute holding the kilowatt element it should fill in
    convert: hp => hp * 0.7457, // HP -> kW conversion formula
    decimals: 1, // round result to 1 decimal place
  },
  {
    sourceAttr: 'data-pkg-mph',
    targetAttr: 'data-pkg-kt',
    convert: mph => mph * 0.8689758, // mph -> knots
    decimals: 1,
  },
  {
    sourceAttr: 'data-pkg-mi',
    targetAttr: 'data-pkg-km',
    convert: mi => mi * 1.60934,
    decimals: 1,
  }

];

function groupPairsByKey(root, sourceAttr, targetAttr) {
  const pairs = new Map();

  root.querySelectorAll(`[${sourceAttr}]`).forEach(el => {
    const key = el.getAttribute(sourceAttr); // e.g. "acceleration-power"

    if (!pairs.has(key)) pairs.set(key, {});
    pairs.get(key).source = el;
  });

  root.querySelectorAll(`[${targetAttr}]`).forEach(el => {
    const key = el.getAttribute(targetAttr);

    if (!pairs.has(key)) pairs.set(key, {});
    pairs.get(key).target = el;
  });

  return pairs;
}

function parseNumber(el) {
  return parseFloat(el.textContent.replace(/[^\d.-]/g, ''));
}

function convertUnitPairsWithin(root) {
  UNIT_PAIRS.forEach(({ sourceAttr, targetAttr, convert, decimals }) => {
    const pairs = groupPairsByKey(root, sourceAttr, targetAttr);

    pairs.forEach(({ source, target }, key) => {
      if (!source || !target) {
        console.warn(`Missing match for "${key}" (${sourceAttr} → ${targetAttr}) in`, root);
        return;
      }

      const sourceValue = parseNumber(source);
      const convertedValue = convert(sourceValue);
      target.textContent = convertedValue.toFixed(decimals);
    });
  });
}

function initMetricConverter() {
  const specs = document.querySelectorAll('[data-specs]');
  if (!specs.length) return;

  specs.forEach(spec => {
    convertUnitPairsWithin(spec);
  });
}

initMetricConverter();
