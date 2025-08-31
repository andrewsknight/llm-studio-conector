import { MessageCircle, Settings, Zap } from 'lucide-react';

interface EmptyStateProps {
  onOpenSettings: () => void;
}

export function EmptyState({ onOpenSettings }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <MessageCircle className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Comienza una conversación
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Escribe un mensaje abajo para comenzar a chatear con el modelo LLM.
        </p>

        <div className="space-y-4 text-sm text-gray-500 dark:text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Asegúrate de que LM Studio esté ejecutándose en el puerto 1234</span>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <Settings className="h-4 w-4" />
            <button
              onClick={onOpenSettings}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
            >
              Configurar endpoint de API
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong>Nota:</strong> Si encuentras problemas de CORS, puedes habilitar el proxy en configuración 
            o ejecutar LM Studio con la opción <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">--cors</code>.
          </p>
        </div>
      </div>
    </div>
  );
}