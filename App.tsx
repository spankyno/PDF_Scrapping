
import React, { useState, useEffect, useCallback } from 'react';
import type { Question } from './types';
import { INITIAL_QUESTIONS } from './constants';
import { analyzePdf } from './services/geminiService';
import FileUpload from './components/FileUpload';
import QuestionRow from './components/QuestionRow';
import Button from './components/Button';
import PlusIcon from './components/icons/PlusIcon';
import SaveIcon from './components/icons/SaveIcon';
import ResetIcon from './components/icons/ResetIcon';

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedQuestions = localStorage.getItem('pdf_scrapping_questions');
      if (savedQuestions) {
        setQuestions(JSON.parse(savedQuestions));
      } else {
        resetQuestions();
      }
    } catch (e) {
      console.error("Failed to load questions from localStorage", e);
      resetQuestions();
    }
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileSelect = (file: File) => {
    setPdfFile(file);
    setError(null);
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question: '',
      answer: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleQuestionChange = (id: string, newText: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, question: newText } : q))
    );
  };
  
  const saveQuestions = () => {
    try {
      localStorage.setItem('pdf_scrapping_questions', JSON.stringify(questions));
      showNotification('¡Preguntas guardadas!');
    } catch (e) {
      setError("No se pudieron guardar las preguntas.");
      console.error("Failed to save questions to localStorage", e);
    }
  };

  const resetQuestions = () => {
    setQuestions(INITIAL_QUESTIONS.map(q => ({
      id: crypto.randomUUID(),
      question: q,
      answer: '',
    })));
  };

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader.result as string).split(',')[1];
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Could not convert file to base64."));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const handleAnalyze = async () => {
    if (!pdfFile) {
      setError('Por favor, seleccione un archivo PDF primero.');
      return;
    }
    if (questions.some(q => !q.question.trim())) {
      setError('Asegúrese de que todas las preguntas tengan texto antes de analizar.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setQuestions(qs => qs.map(q => ({ ...q, answer: '' }))); // Clear previous answers

    try {
      const pdfBase64 = await fileToBase64(pdfFile);
      const results = await analyzePdf(pdfBase64, pdfFile.type, questions);
      setQuestions(results);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            PDF Scrapping by Aitor
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Sube un PDF y hazle preguntas para extraer información clave.
          </p>
        </header>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-md mb-6" role="alert">
            <p><strong className="font-bold">Error:</strong> {error}</p>
          </div>
        )}
        
        {notification && (
            <div className="fixed top-5 right-5 bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
                {notification}
            </div>
        )}

        <section className="bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-100">1. Cargar Documento</h2>
          <FileUpload onFileSelect={handleFileSelect} selectedFile={pdfFile} />
        </section>

        <section className="bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-gray-100">2. Definir Preguntas</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveQuestions} disabled={isLoading}><SaveIcon className="w-5 h-5"/> Guardar</Button>
              <Button onClick={resetQuestions} disabled={isLoading}><ResetIcon className="w-5 h-5"/> Reset</Button>
              <Button onClick={handleAddQuestion} disabled={isLoading}><PlusIcon className="w-5 h-5" /> Añadir</Button>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {questions.map((q) => (
              <QuestionRow
                key={q.id}
                item={q}
                onQuestionChange={handleQuestionChange}
                onRemove={handleRemoveQuestion}
                isLoading={isLoading}
              />
            ))}
          </div>
          
          <div className="mt-8 text-center">
             <Button
                variant="primary"
                onClick={handleAnalyze}
                disabled={!pdfFile || isLoading || questions.length === 0}
                className="px-8 py-3 text-lg"
              >
                {isLoading ? (
                  <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analizando...
                  </>
                ) : '3. Analizar y Obtener Respuestas'}
              </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
