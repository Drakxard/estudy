import say from 'say';

say.speak(
  '¡Hola! Esto es una prueba de voz nativa con say.js',
  undefined,
  undefined,
  err => {
    if (err) console.error('Error en say.speak:', err);
    else console.log('Terminó de hablar');
  }
);
