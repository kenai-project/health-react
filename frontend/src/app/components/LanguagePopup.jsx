import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Globe, Check } from 'lucide-react';
import { cn } from './ui/utils';

/**
 * LanguagePopup - shown on first visit to let the user pick a language.
 * Controlled by parent via `open` / `onClose`.
 */
const LanguagePopup = ({ open, onClose }) => {
  const { language, languages, changeLanguage, markFirstVisitDone, t } = useLanguage();
  const [selected, setSelected] = useState(language);

  const handleConfirm = () => {
    changeLanguage(selected);
    markFirstVisitDone();
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleConfirm()}>
      <DialogContent className="backdrop-blur-md bg-white/95 dark:bg-gray-800/95 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {t('languagePopup.title')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {t('languagePopup.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2 py-2">
          {Object.entries(languages).map(([code, { label, flag }]) => (
            <button
              key={code}
              type="button"
              onClick={() => setSelected(code)}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                selected === code
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500/30'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              )}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{flag}</span>
                <span className="font-medium text-gray-900 dark:text-white">{label}</span>
              </span>
              {selected === code && <Check className="w-5 h-5 text-blue-500" />}
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleConfirm}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            {t('languagePopup.continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LanguagePopup;