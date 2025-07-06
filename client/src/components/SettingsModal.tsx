import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Upload, FileText, Plus,FileDown, FileUp, X, Save  } from 'lucide-react';
import type { Settings } from '@shared/schema';

export function SettingsModal() {
  const queryClient = useQueryClient();
  const {
    isSettingsOpen,
    toggleSettings,
    settings,
    setSettings,
    currentSectionId,
    setCurrentSection,
    exercises,
    resetTimer,
    loadExercises,
    uploadExerciseFiles,
  } = useAppStore();

  const clearAll = useAppStore(state => state.clearAllResponses);
  const exportAll = useAppStore(state => state.exportAllResponses);
  const importAll = useAppStore(state => state.importAllResponses);
  const fileInputRef = useRef<HTMLInputElement>(null);
 const jsUploadRef   = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = exportAll();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'respuestas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(text => {
      console.log("▶ Imported JSON:", text);
      importAll(text);
      // Limpia el valor para permitir re-importar el mismo fichero
      e.target.value = "";
    });
  };

  // Section files management state
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');


  // Load settings from server
  const { data: serverSettings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

// Update settings mutation
const updateSettingsMutation = useMutation({
  mutationFn: async (data: Partial<Settings>) => {
    const response = await apiRequest('PATCH', '/api/settings', data);
    return response.json();
  },
  onSuccess: (updatedSettings) => {
    // 1) Actualizo el store con los nuevos valores
    setSettings(updatedSettings);

    // 2) Ya no invalido la query para que serverSettings no vuelva a pisar formData
    // queryClient.invalidateQueries({ queryKey: ['/api/settings'] });

    // 3) Opcional: si querés cerrar el modal tras guardar, lo hacés aquí
    toggleSettings();
  },
});


  // Test API key mutation
  const testApiMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/response', {
        exerciseText: 'Test: ¿Cuál es la derivada de x²?',
        apiKey: formData.groqApiKey,
        modelId: formData.groqModelId,
      });
      return response.json();
    },
  });
// Section files queries and mutations
const { data: sectionFiles = [] } = useQuery<string[]>({
  queryKey: ['/api/sections/files'],
  enabled: showSectionManager,
});



// — NUEVO: query para ejercicios dinámicos —
const {
  data: exercisesList = [],
  refetch: refetchExercises,
} = useQuery({
  queryKey: ['/api/exercises'],
  queryFn: () => fetch('/api/exercises').then(res => res.json()),
  enabled: showSectionManager,
});

const uploadFileMutation = useMutation({
  mutationFn: async ({ filename, content }: { filename: string; content: string }) => {
    const response = await apiRequest('POST', '/api/sections/upload', { filename, content });
    return response.json();
  },
  onSuccess: async () => {
    // 1) invalidamos las queries
    await queryClient.invalidateQueries({ queryKey: ['/api/sections/files'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/bkt/domains'] });

    // 2) forzamos refetch inmediato
    await queryClient.refetchQueries({ queryKey: ['/api/sections/files'] });
    await queryClient.refetchQueries({ queryKey: ['/api/exercises'] });

    // 3) refetch explícito para forzar propagación inmediata
    await refetchExercises();

    // 4) limpiamos el form de upload
    setNewFileName('');
    setNewFileContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  },
});

const deleteFileMutation = useMutation({
  mutationFn: async (filename: string) => {
    const response = await apiRequest(
      'DELETE',
      `/api/sections/files/${encodeURIComponent(filename)}`
    );
    return response.json();
  },
  onSuccess: async () => { // ← debes marcar esto como async
    // 1) refrescamos la lista de archivos y ejercicios
    await queryClient.invalidateQueries({ queryKey: ['/api/sections/files'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/bkt/domains'] });

    // 2) además disparamos el refetch explícito
    await refetchExercises();

    // 3) limpiamos el form de upload
    setNewFileName('');
    setNewFileContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  },
});




// Load settings into form — sólo inicializamos una vez
useEffect(() => {
  if (serverSettings && !initialLoaded.current) {
    setFormData({
      pomodoroMinutes: serverSettings.pomodoroMinutes  || 25,
      maxTimeMinutes:  serverSettings.maxTimeMinutes   || 10,
      groqApiKey:      serverSettings.groqApiKey       || '',
      groqModelId:     serverSettings.groqModelId      || 'llama-3.1-8b-instant',
      feedbackPrompt:  serverSettings.feedbackPrompt   || '',
      currentSection:  serverSettings.currentSection   || 1,
    });
    initialLoaded.current = true;
  }
}, [serverSettings]);

  // Aquí declaras tu ref:
  const initialLoaded = useRef(false);
// Handle form submission
const handleSave = () => {
  // 1) Guardar ajustes en el servidor
  updateSettingsMutation.mutate(formData);

  // 2) Actualizar sección actual (si cambió)
  //    formData.currentSection es un string con el nombre de fichero,
  //    sectionFiles es el array de strings que obtienes con useQuery.
  const filename = formData.currentSection;                  // ej. "03-intro.js"
  const idx = sectionFiles.findIndex((f) => f === filename); // ej. 2
  const newSectionId = idx >= 0 ? idx + 1 : currentSectionId; // 1-based

  if (newSectionId !== currentSectionId) {
    setCurrentSection(newSectionId);
  }

  // 3) Reset timer si cambió el pomodoro
  if (formData.pomodoroMinutes !== settings?.pomodoroMinutes) {
    resetTimer(formData.pomodoroMinutes);
  }

  // 4) (opcional) cerrar modal aquí
  // toggleSettings();
};


  // Handle API key test
  const handleTestApi = () => {
    if (!formData.groqApiKey.trim()) {
      return;
    }
    testApiMutation.mutate();
  };

const handleFileUpload = async () => {
  const fileInput = fileInputRef.current;
  const files = fileInput?.files ? Array.from(fileInput.files) : [];

  if (files.length === 0) return;

  setUploading(true);
  try {
    // 1) Sube todos los archivos al servidor
    await uploadExerciseFiles(files);

    // 2) Limpia los inputs de UI
    setMultiFileNames([]);
    setMultiFileContents([]);
    if (fileInput) fileInput.value = '';

    // 3) Invalida los caches de React Query
    await queryClient.invalidateQueries({ queryKey: ['/api/sections/files'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/bkt/domains'] });

    // 4) Fuerza refetch inmediato
    await refetchSectionFiles();
    await refetchExercises();

    // 5) (Opcional) Re-aplica la sección actual en el store
    // setCurrentSection(formData.currentSection);

  } catch (err) {
    console.error("Error al subir archivos:", err);
    // aquí podrías mostrar un toast de error
  } finally {
    setUploading(false);
  }
};



  // Handle file deletion
  const handleFileDelete = (filename: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar el archivo ${filename}?`)) {
      deleteFileMutation.mutate(filename);
    }
  };

  // Handle file input
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.js')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setNewFileName(file.name);
        setNewFileContent(content);
      };
      reader.readAsText(file);
    }
  };

const handleDeleteAllFiles = () => {
  if (
    sectionFiles.length === 0 ||
    !confirm('¿Estás seguro de que quieres borrar TODOS los archivos de sección? Esta acción no se puede deshacer.')
  ) {
    return;
  }

  // Ejecutar la mutación para cada archivo
  sectionFiles.forEach((filename) => {
    deleteFileMutation.mutate(filename);
  });
};

// Estados para múltiples archivos
const [multiFileNames, setMultiFileNames] = useState<string[]>([]);
const [multiFileContents, setMultiFileContents] = useState<string[]>([]);
const [uploading, setUploading] = useState(false);

// Handler para selección múltiple
const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files ? Array.from(e.target.files) : [];
  // Guardamos sólo los nombres
  setMultiFileNames(files.map(f => f.name));
  // Leemos todos los contenidos en paralelo
  const texts = await Promise.all(files.map(f => f.text()));
  setMultiFileContents(texts);
};


// Calcula dinámicamente las secciones según el nombre del fichero
// Calcula dinámicamente las secciones según el nombre del fichero
const sectionFileNames = Array.from(
  new Set(exercises.map(ex => ex.fileName))
).sort();
// A partir de los nombres de fichero, crea las opciones
const sectionOptions = sectionFileNames.map(name => ({
  value: name,
  label: name,
}));

// inicializa con el primer archivo (o "")
const defaultSection = sectionFileNames[0] ?? '';
useEffect(() => {
  if (sectionFileNames.length > 0 && !formData.currentSection) {
    setFormData(prev => ({
      ...prev,
      currentSection: sectionFileNames[0],  // usa el primer nombre de archivo
    }));
  }
}, [sectionFileNames]);
const [formData, setFormData] = useState<{ currentSection: string }>({
  currentSection: defaultSection,
});

const getSectionName = (fileName?: string): string => {
  if (!fileName) return 'Sin sección';
  // 1) Quita la extensión
  const withoutExt = fileName.replace(/\.[^.]+$/, '');
  // 2) Separa por guión o espacio y descarta el prefijo numérico
  const parts = withoutExt.split(/[-_\s]+/);
  if (/^\d+$/.test(parts[0])) parts.shift();
  // 3) Capitaliza cada palabra
  return parts.map(p => p[0].toUpperCase() + p.slice(1)).join(' ');
};

  return (
    <Dialog open={isSettingsOpen} onOpenChange={toggleSettings}>
      <DialogContent className="bg-gray-925 border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-200">
            Configuración
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Section Selector with File Manager Button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-300">
                Sección actual
              </Label>
              <Button
                onClick={() => setShowSectionManager(!showSectionManager)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={formData.currentSection}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, currentSection: value }))
              }
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-200">
                <SelectValue placeholder="Selecciona sección" />
              </SelectTrigger>

              <SelectContent className="bg-gray-800 border-gray-700">
                {sectionOptions.map(option => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-gray-200 focus:bg-gray-700"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
       
          {/* Section File Manager */}
          {showSectionManager && (
            <div className="border border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                   <div className="flex justify-end">
                    <Button
                      onClick={handleDeleteAllFiles}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Borrar todo
                    </Button>
                  </div>
                         
                <Button
                  onClick={() => setShowSectionManager(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
                >
                  ×
                </Button>
              </div>
            </div>  
            )}   

       {/* Aquí: listado de secciones con botón de “X” */}
              <ul className="space-y-2">
                {sectionFiles.map((filename) => (
                  <li key={filename} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                    <span className="text-gray-200 text-sm font-mono">{filename}</span>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-600 hover:text-white"
                      onClick={() => handleFileDelete(filename)}
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>

              {/* El resto: formulario de subida… */}
              {/* Upload Section (multi-file) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    variant="outline"
                    className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Seleccionar archivos
                  </Button>
                  <span className="text-xs text-gray-500">Solo archivos .js</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".js"
                    multiple
                    onChange={handleBulkFileChange}
                    className="hidden"
                  />
                </div>

                {multiFileNames.length > 0 && (
                  <div className="space-y-4">
                    {multiFileNames.map((name, idx) => (
                      <div key={idx} className="p-2 bg-gray-800 rounded space-y-1">
                        <p className="text-sm font-medium text-gray-200">{name}</p>
                        <Textarea
                          value={multiFileContents[idx]}
                          onChange={e => {
                            const arr = [...multiFileContents];
                            arr[idx] = e.target.value;
                            setMultiFileContents(arr);
                          }}
                          placeholder="Contenido del archivo JavaScript..."
                          className="bg-gray-700 text-gray-100 font-mono text-sm h-24"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleFileUpload}
                        disabled={uploading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {uploading ? 'Subiendo...' : 'Subir todos'}
                      </Button>
                      <Button
                        onClick={() => {
                          setMultiFileNames([]);
                          setMultiFileContents([]);
                        }}
                        size="sm"
                        variant="outline"
                        className="bg-gray-800 border-gray-600 text-gray-200"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>


          {/* Pomodoro Settings */}
          <div>
            <Label className="block text-sm font-medium mb-2 text-gray-300">
              Tiempo de sesión (Pomodoro)
            </Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                min="1"
                max="60"
                value={formData.pomodoroMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, pomodoroMinutes: parseInt(e.target.value) || 25 }))}
                className="flex-1 bg-gray-800 border-gray-700 text-gray-200"
              />
              <span className="text-gray-400 self-center">minutos</span>
            </div>
          </div>
          
          {/* Groq API Settings */}
          <div>
            <Label className="block text-sm font-medium mb-2 text-gray-300">
              API de respuestas (Groq)
            </Label>
            <div className="flex space-x-2">
              <Input
                type="password"
                placeholder="Ingresa tu clave API de Groq"
                value={formData.groqApiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, groqApiKey: e.target.value }))}
                className="flex-1 bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500"
              />
             <Button
                  onClick={handleTestApi}
                  disabled={!formData.groqApiKey?.trim() || testApiMutation.isPending}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-sm"
                  >
                  Probar API
            </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Para obtener respuestas automáticas a tus ejercicios
            </p>
            {testApiMutation.isSuccess && (
              <p className="text-xs text-green-400 mt-1">✓ API conectada correctamente</p>
            )}
            {testApiMutation.isError && (
              <p className="text-xs text-red-400 mt-1">✗ Error al conectar con la API</p>
            )}
          </div>

          {/* Custom Feedback Prompt 
          <div>
            <Label className="block text-sm font-medium mb-2 text-gray-300">
              Prompt personalizado para feedback
            </Label>
            <Textarea
              placeholder="Personaliza cómo la IA genera feedback..."
              value={formData.feedbackPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, feedbackPrompt: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 min-h-[100px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Define cómo quieres que la IA analice y responda a tus ejercicios
            </p>
          </div>*/}
        </div>
        <div className="flex justify-end space-x-3 mt-6">
  {/* Borrar respuestas (solo icono) */}
  <Button
    variant="destructive"
    onClick={() => {
      if (
        confirm(
          "¿Seguro que quieres borrar TODAS las respuestas? Esta acción no se puede deshacer."
        )
      ) {
        clearAll();
      }
    }}
    title="Borrar todas las respuestas"
    aria-label="Borrar todas las respuestas"
    className="justify-center w-10 h-10 p-0"
  >
    <Trash2 className="w-5 h-5" />
  </Button>

  {/* Exportar (solo icono) */}
  <Button
    onClick={handleExport}
    title="Exportar respuestas"
    aria-label="Exportar respuestas"
    className="bg-green-600 hover:bg-green-700 justify-center w-10 h-10 p-0"
  >
    <FileDown className="w-5 h-5" />
  </Button>

 
  {/* — Importar JSON — */}
  <input
    ref={jsonImportRef}
    id="json-import-input"
    type="file"
    accept="application/json"
    onChange={handleImportFile}
    hidden
  />
  <label htmlFor="import-file-input">
  <Button
    onClick={() => jsonImportRef.current?.click()}          // dispara el input correcto
    title="Importar respuestas"
    aria-label="Importar respuestas"
    className="bg-yellow-600 hover:bg-yellow-700 w-10 h-10 p-0"
  >
    <FileUp className="w-5 h-5" />
  </Button>
  </label>

  {/* Cancelar (texto + icono) */}
  <Button
    variant="ghost"
    onClick={toggleSettings}
    className="text-gray-400 hover:text-gray-200 px-3"
    title="Cancelar cambios"
    aria-label="Cancelar cambios"
  >
    <X className="w-4 h-4 mr-2" />
    Cancelar
  </Button>

  {/* Guardar (texto + icono) */}
  <Button
    onClick={handleSave}
    disabled={updateSettingsMutation.isPending}
    className="bg-blue-600 hover:bg-blue-700 px-3"
    title={updateSettingsMutation.isPending ? "Guardando..." : "Guardar cambios"}
    aria-label={updateSettingsMutation.isPending ? "Guardando" : "Guardar"}
  >
    <Save className="w-4 h-4 mr-2" />
    {updateSettingsMutation.isPending ? "Guardando..." : "Guardar"}
  </Button>
</div>

      </DialogContent>
    </Dialog>
  );
}
