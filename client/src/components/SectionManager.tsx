import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, FileText, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SectionManagerProps {
  className?: string;
}

interface ExerciseInput {
  seccion: string;
  tema: string;
  enunciado: string;
  ejercicio: string;
  id: string;
}

interface SectionFile {
  id: string;
  name: string;
  filename: string;
  path: string;
}

export function SectionManager({ className }: SectionManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newSectionName, setNewSectionName] = useState("");
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { seccion: "", tema: "", enunciado: "", ejercicio: "", id: "" }
  ]);

  // Fetch sections
  const { data: sections = [], isLoading, refetch } = useQuery<SectionFile[]>({
    queryKey: ["/api/sections"],
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (data: { name: string; exercises: ExerciseInput[] }) => {
      const response = await apiRequest("POST", "/api/sections", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Sección creada exitosamente" });
      setNewSectionName("");
      setExercises([{ seccion: "", tema: "", enunciado: "", ejercicio: "", id: "" }]);
    },
    onError: () => {
      toast({ title: "Error al crear la sección", variant: "destructive" });
    },
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (filename: string) => {
      return apiRequest("DELETE", `/api/sections/${filename}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Sección eliminada exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al eliminar la sección", variant: "destructive" });
    },
  });

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast({ title: "Nombre de sección es requerido", variant: "destructive" });
      return;
    }

    // Prepare exercises with section name
    const validExercises = exercises.filter(ex => ex.enunciado.trim());
    const exercisesWithSection = validExercises.map((ex, index) => ({
      ...ex,
      seccion: newSectionName,
      id: ex.id || `${newSectionName.toLowerCase().replace(/\s+/g, '_')}_${index + 1}`,
    }));

    if (exercisesWithSection.length === 0) {
      toast({ title: "Agrega al menos un ejercicio", variant: "destructive" });
      return;
    }

    try {
      await createSectionMutation.mutateAsync({
        name: newSectionName,
        exercises: exercisesWithSection,
      });
    } catch (error) {
      console.error("Error creating section:", error);
    }
  };

  const addExerciseField = () => {
    setExercises([...exercises, { seccion: "", tema: "", enunciado: "", ejercicio: "", id: "" }]);
  };

  const removeExerciseField = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseInput, value: string) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleDeleteSection = (filename: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la sección "${filename}"?`)) {
      deleteSectionMutation.mutate(filename);
    }
  };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
    toast({ title: "Secciones actualizadas" });
  };

  if (isLoading) {
    return <div className={className}>Cargando secciones...</div>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Existing sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Secciones Existentes</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay archivos de sección en la carpeta /sube-seccion
            </p>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-800 border-gray-700"
                >
                  <div>
                    <h4 className="font-medium text-gray-200">{section.name}</h4>
                    <p className="text-sm text-gray-400">
                      Archivo: {section.filename}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSection(section.filename)}
                    disabled={deleteSectionMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create new section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear Nueva Sección
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="section-name">Nombre de la Sección</Label>
            <Input
              id="section-name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Ej: Seccion 6"
              className="bg-gray-800 border-gray-700 text-gray-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se creará un archivo "{newSectionName}.js" en la carpeta /sube-seccion
            </p>
          </div>

          {/* Exercises */}
          <div>
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ejercicios
            </Label>
            <div className="space-y-3 mt-2">
              {exercises.map((exercise, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-gray-800 border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-200">Ejercicio {index + 1}</span>
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExerciseField(index)}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Tema del ejercicio"
                    value={exercise.tema}
                    onChange={(e) => updateExercise(index, "tema", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-gray-200"
                  />
                  <Textarea
                    placeholder="Enunciado del ejercicio (usa $formula$ para LaTeX)"
                    value={exercise.enunciado}
                    onChange={(e) => updateExercise(index, "enunciado", e.target.value)}
                    rows={2}
                    className="bg-gray-700 border-gray-600 text-gray-200"
                  />
                  <Textarea
                    placeholder="Contenido adicional del ejercicio (opcional)"
                    value={exercise.ejercicio}
                    onChange={(e) => updateExercise(index, "ejercicio", e.target.value)}
                    rows={2}
                    className="bg-gray-700 border-gray-600 text-gray-200"
                  />
                  <Input
                    placeholder="ID único del ejercicio (opcional)"
                    value={exercise.id}
                    onChange={(e) => updateExercise(index, "id", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-gray-200"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExerciseField}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Ejercicio
              </Button>
            </div>
          </div>

          <Button
            onClick={handleCreateSection}
            disabled={createSectionMutation.isPending || !newSectionName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {createSectionMutation.isPending ? "Creando..." : "Crear Sección"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}