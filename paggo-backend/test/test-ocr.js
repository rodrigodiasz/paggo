const Tesseract = require('tesseract.js');

Tesseract.recognize(
  '../uploads/aj_byu-removebg-preview.png', // Substitua pelo caminho da imagem
  'eng'
).then(({ data: { text } }) => {
  console.log('Texto extraído:', text);
}).catch(err => {
  console.error('Erro no OCR:', err);
});
