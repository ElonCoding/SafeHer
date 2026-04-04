import { useEffect, useRef, useState } from "react";

interface UseVoiceActivationOptions {
  keyword?: string;
  onTriggered: () => void;
  enabled?: boolean;
}

export const useVoiceActivation = ({
  keyword = "help",
  onTriggered,
  enabled = true,
}: UseVoiceActivationOptions) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        if (transcript.includes(keyword.toLowerCase())) {
          onTriggered();
          // Restart to avoid duplicate triggers
          recognition.stop();
          setTimeout(() => {
            try { recognition.start(); } catch {}
          }, 1000);
          break;
        }
      }
    };

    recognition.onend = () => {
      if (enabled) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = () => {};

    try {
      recognition.start();
      setListening(true);
    } catch {}

    return () => {
      try {
        recognition.stop();
        recognitionRef.current = null;
        setListening(false);
      } catch {}
    };
  }, [enabled, keyword, onTriggered]);

  return { listening, supported: !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition };
};
