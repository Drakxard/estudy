// client/src/components/tts.ts

/**
 * Wrapper mínimo para Web Speech API
 */
export function speak(text: string) {
  if (!('speechSynthesis' in window)) {
    console.warn('Tu navegador no soporta SpeechSynthesis');
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES';
  u.rate = 1.0;
  u.pitch = 1.0;
  // Opcional: elegir voz concreta
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === 'es-ES' && v.name.includes('Google'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
