import 'babel-polyfill';

export default function convertRules(rules, defaultValue) {
  const RULE_DELIMITER = ':';
  const lookup = new Map();

  rules.forEach((rule) => {
    const [key, ...ruleParts] = rule.split(RULE_DELIMITER);

    switch (ruleParts.length) {
      case 0:
        if (defaultValue == null) {
          throw new Error(`Attribute name for tag “${key}” is expected.`);
        }
        lookup.set(key, defaultValue);
        break;

      case 1:
        lookup.set(key, ruleParts[0]);
        break;

      // Support attributes with namespaces
      case 2:
        lookup.set(key, ruleParts.join(RULE_DELIMITER));
        break;

      default:
        throw new Error(`Rule must contain maximum 2 delimiters (${RULE_DELIMITER})`);
    }
  });

  return lookup;
}
