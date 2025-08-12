import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, Volume2, StopCircle } from 'lucide-react';
import { useFeedbackMutation } from '@/hooks/useFeedbackMutation';
import { MathRenderer, katexToSpeechText  } from './MathRenderer';
import { useAppStore } from '@/store/useAppStore';
import { Exercise } from '@/types';

interface Props {
  /** id opcional para atajos de teclado */
  id?: string;
  exercise: Exercise;
  response: string;
}

export function ExerciseFeedbackButton({ id, exercise, response }: Props) {
  // Feedback almacenado y setter
  const storedFeedback = useAppStore(state => state.feedbacks[exercise.id] || '');
  const setStoredFeedback = useAppStore(state => state.setFeedback);

  // Estados locales
  const [show, setShow] = useState<boolean>(!!storedFeedback);
  const [feedback, setFeedback] = useState<string>(storedFeedback);
  const [showReasoning, setShowReasoning] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);

  // Estados para TTS
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState<boolean>(false);

  // Cargar voces disponibles
  useEffect(() => {
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      console.log('[TTS] Voces cargadas:', vs.map(v => v.name));
      if (vs.length) setVoices(vs);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

 // Limpia encabezados Markdown y etiquetas HTML antes de TTS
  const cleanText = (text: string) =>
    text
      .replace(/^#+\s.*$/gm, '')             // Eliminar líneas de encabezado Markdown
      .replace(/<[^>]+>/g, '')                // Eliminar etiquetas HTML
      .replace(/\*\*/g, '')                 // Quitar negritas Markdown
      .replace(/\*/g, '')                    // Quitar cursivas Markdown
      .replace(/\s+/g, ' ')                  // Reemplazar saltos y múltiples espacios por uno solo
      .trim();

async function renderSpeechFromMixedText(text: string): Promise<string> {
  // Detecta fórmulas delimitadas con \( ... \) o \[ ... \]
  const mathRegex = /\\\((.+?)\\\)|\\\[(.+?)\\\]/gs;

  const parts: string[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(mathRegex)) {
    const matchIndex = match.index ?? 0;

    // Texto plano antes de la fórmula
    if (matchIndex > lastIndex) {
      let plainText = text.slice(lastIndex, matchIndex);
      // Limpiar texto plano de posibles etiquetas o markdown si es necesario
      plainText = plainText.replace(/\*\*|\n/g, ' ').trim();
      if (plainText) parts.push(plainText);
    }

    // Contenido matemático (sin delimitadores)
    const mathContent = match[1] ?? match[2] ?? '';

    try {
      const spoken = await katexToSpeechText(mathContent);
      parts.push(spoken);
    } catch {
      parts.push(mathContent);
    }

    lastIndex = matchIndex + match[0].length;
  }

  // Texto plano después de la última fórmula
  if (lastIndex < text.length) {
    let plainText = text.slice(lastIndex);
    plainText = plainText.replace(/\*\*|\n/g, ' ').trim();
    if (plainText) parts.push(plainText);
  }

const mathContent = match[1] ?? match[2] ?? match[3] ?? match[4] ?? '';
console.log('[TTS] Fórmula detectada:', mathContent);

  // Unir partes con espacios para evitar problemas en el TTS
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}



  // Feedback mutation
  const mutation = useFeedbackMutation();
  const match = feedback.match(/<think>([\s\S]*?)<\/think>/i);
  const reasoning = match?.[1]?.trim() ?? '';
  const summary = feedback.replace(/<think>[\s\S]*?<\/think>/i, '').trim();

  const runFeedback = () => {
    mutation.mutate(
      { exercise, response },
      {
        onSuccess: fb => {
          setFeedback(fb);
          setStoredFeedback(exercise.id, fb);
        }
      }
    );
  };

  // Función TTS con logs
  const speakText = (text: string) => {
    console.log('[TTS] Invocando speakText con:', text);
    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] Web Speech API no disponible');
      return;
    }
    if (window.speechSynthesis.speaking) {
      console.log('[TTS] Ya está hablando, cancelando anterior');
      window.speechSynthesis.cancel();
    }
    setSpeaking(true);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-ES';
    utter.rate = 1.0;
    utter.pitch = 1.0;

    // Intentamos usar voz Google si existe
    const voice = voices.find(v => v.lang === 'es-ES' && v.name.includes('Google'));
    if (voice) {
      console.log('[TTS] Usando voz:', voice.name);
      utter.voice = voice;
    }

    utter.onstart = () => console.log('[TTS] start');
    utter.onend = () => {
      console.log('[TTS] end');
      setSpeaking(false);
    };
    utter.onerror = (e) => {
      console.error('[TTS] error', e);
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utter);
  };

  // Texto “plano” sin tags
  const plainSummary = summary.replace(/<[^>]+>/g, '').trim();
  const plainReasoning = reasoning.replace(/<[^>]+>/g, '').trim();

  // Copiar y mostrar check
  const doCopy = (text: string, setFlag: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 2000);
  };

  // Reset cuando cambia ejercicio
  useEffect(() => {
    setShow(!!storedFeedback);
    setFeedback(storedFeedback);
    mutation.reset();
    setShowReasoning(false);
  }, [exercise.id, storedFeedback]);

  // Si aún no pedimos feedback
  if (!show) {
    return (
      <div className="flex justify-end mt-4">
        <Button id={id} onClick={() => { setShow(true); runFeedback(); }} size="sm">
          Feedback
        </Button>
      </div>
    );
  }

  // Loading / Error
  if (mutation.isLoading) {
    return (
      <div className="flex items-center justify-center mt-4">
        <Loader2 className="animate-spin w-4 h-4 mr-2" />
        <span>Cargando feedback...</span>
      </div>
    );
  }
  if (mutation.isError) {
    return (
      <div className="mt-4 text-center">
        <span className="text-red-400">Error: {mutation.error?.message}</span>
      </div>
    );
  }

  // Render feedback
  return (
    <div className="relative mt-4 w-full p-4 bg-gray-800 rounded space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-100">Retroalimentación</h4>
        <div className="flex space-x-2">
          <Button size="xs" variant="outline" onClick={() => setShowReasoning(prev => !prev)}>
            {showReasoning ? 'Ocultar razonamiento' : 'Ver razonamiento'}
          </Button>
          {/* Botón TTS sobre el feedback actual */}
          <Button
            size="icon"
            variant="ghost"
            title="Leer en voz alta"
            onClick={async () => {
              const raw = summary + (showReasoning && reasoning ? '\n' + reasoning : '');
              try {
                const speech = await  renderSpeechFromMixedText(cleanText(raw));
                console.log('[TTS] Invocando speakText con:', speech);
                speakText(speech);
              } catch (err) {
                console.error('[TTS] Error al renderizar voz:', err);
                speakText(raw.replace(/<[^>]+>/g, ''));
              }
            }}
            disabled={speaking}
          >
            <Volume2 className="w-4 h-4" />
          </Button>


          {/* Botón de prueba “Hola” */}
          <Button
            size="icon"
            variant="ghost"
            title="Prueba de voz: Hola"
            onClick={() => speakText('¡Hola! Esto es una prueba de voz.')}
            disabled={speaking}
          >
            <Volume2 className="w-4 h-4 rotate-180" />
          </Button>
           {/* NUEVO: botón para detener */}
  <Button
    size="icon"
    variant="ghost"
    title="Detener lectura"
    onClick={() => {
      window.speechSynthesis.cancel();   // detiene cualquier utterance en curso
      setSpeaking(false);                // restablece el estado local
    }}
    disabled={!speaking}                 // solo activo mientras habla
  >
    <StopCircle className="w-4 h-4" />
  </Button>
        </div>
      </div>

      <MathRenderer content={summary} />

      {showReasoning && reasoning && (
        <div className="mt-2 p-4 bg-gray-900 rounded">
          <MathRenderer content={reasoning} />
        </div>
      )}

      <div className="flex justify-end items-center space-x-2">
 <Button
   id={`feedback-btn-${exercise.id}`}
   size="xs"
   variant="outline"
   onClick={runFeedback}
 >
          Re-Feedback
        </Button>

        <Button
          size="icon"
          variant="ghost"
          title="Copiar feedback"
          onClick={() => doCopy(summary, setCopiedSummary)}
        >
          {copiedSummary ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          title="Copiar feedback + razonamiento"
          onClick={() =>
            doCopy(
              `${summary}${reasoning ? '\n\nRazonamiento:\n' + reasoning : ''}`,
              setCopiedFull
            )
          }
        >
          {copiedFull ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 rotate-90" />}
        </Button>
      </div>
    </div>
  );
}
