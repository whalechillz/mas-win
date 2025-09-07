const { 
  generateBrandMessage,
  generatePainPointMessage,
  CUSTOMER_CHANNELS,
  CUSTOMER_PERSONAS,
  PAIN_POINTS
} = require('./lib/masgolf-brand-data');

console.log('Testing generateBrandMessage...');

try {
  const result = generateBrandMessage('information', 'warm', 'medium', 'local_customers');
  console.log('generateBrandMessage result:', result);
} catch (error) {
  console.error('generateBrandMessage error:', error.message);
}

console.log('Testing generatePainPointMessage...');

try {
  const painResult = generatePainPointMessage('distance');
  console.log('generatePainPointMessage result:', painResult);
} catch (error) {
  console.error('generatePainPointMessage error:', error.message);
}

console.log('Testing CUSTOMER_CHANNELS...');
console.log('CUSTOMER_CHANNELS.local_customers:', CUSTOMER_CHANNELS.local_customers);

console.log('Testing CUSTOMER_PERSONAS...');
console.log('CUSTOMER_PERSONAS.competitive_maintainer:', CUSTOMER_PERSONAS.competitive_maintainer);
