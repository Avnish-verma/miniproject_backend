import React from 'react';
import { usePwa } from '../../context/PwaContext';
import { Download, X, Check, Share, PlusSquare } from 'lucide-react';
import Button from './Button';

export default function InstallPromptBanner() {
  const { isInstallable, isInstalled, isIos, promptInstall, dismissPrompt } = usePwa();

  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#161616] border border-[#2B2B2B] rounded-[16px] p-4 sm:p-5 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/shiftaura_logo.png"
            alt="ShiftAura"
            className="w-10 h-10 object-contain shrink-0"
          />
          <div>
            <h3 className="font-bold text-[15px] text-[#F5F5F5] leading-tight">
              Install ShiftAura
            </h3>
            <p className="text-[12px] text-[#A0A0A0] mt-0.5">
              Get a faster app-like experience with:
            </p>
          </div>
        </div>

        <button
          onClick={dismissPrompt}
          className="p-1 text-[#808080] hover:text-white rounded-full transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4 stroke-[1.75px]" />
        </button>
      </div>

      <div className="my-3 py-2 border-y border-[#292929] space-y-1.5 text-[12px] text-[#C4C4C4]">
        <div className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-[#38A878] stroke-[2.5px] shrink-0" />
          <span>Background notifications</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-[#38A878] stroke-[2.5px] shrink-0" />
          <span>Faster access</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-[#38A878] stroke-[2.5px] shrink-0" />
          <span>Messaging alerts</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-[#38A878] stroke-[2.5px] shrink-0" />
          <span>Call alerts</span>
        </div>
      </div>

      {isIos ? (
        <div className="bg-[#202020] rounded-[10px] p-2.5 text-[12px] text-[#A0A0A0] flex items-center gap-2">
          <Share className="w-4 h-4 text-[#FF5C35] shrink-0" />
          <span>
            Tap <strong className="text-white">Share</strong> in Safari, then select{' '}
            <strong className="text-white">Add to Home Screen</strong>.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 pt-1">
          <Button
            variant="primary"
            size="sm"
            onClick={promptInstall}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#FF5C35] hover:bg-[#FF481F]"
          >
            <Download className="w-3.5 h-3.5 stroke-[2px]" />
            <span>Install</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={dismissPrompt}
            className="text-[#A0A0A0] hover:text-white"
          >
            Not now
          </Button>
        </div>
      )}
    </div>
  );
}
