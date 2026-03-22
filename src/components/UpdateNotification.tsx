import { Download, X } from 'lucide-react';
import { useState } from 'react';

interface UpdateNotificationProps {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  deploymentUrl?: string;
  onDismiss: () => void;
}

export function UpdateNotification({
  available,
  currentVersion,
  latestVersion,
  deploymentUrl,
  onDismiss,
}: UpdateNotificationProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!available || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  const handleUpdate = () => {
    if (deploymentUrl) {
      window.open(deploymentUrl, '_blank');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-2xl p-4 border-l-4 border-blue-400">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Download size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Update Available</h3>
              <p className="text-sm opacity-90 mb-2">
                Version {latestVersion} is available
              </p>
              <p className="text-xs opacity-75">
                Currently running: {currentVersion}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-blue-400 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
        {deploymentUrl && (
          <button
            onClick={handleUpdate}
            className="mt-3 w-full bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-3 rounded transition-colors text-sm"
          >
            Download Now
          </button>
        )}
      </div>
    </div>
  );
}
