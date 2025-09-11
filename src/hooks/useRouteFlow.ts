import { useState, useCallback } from 'react';

export type FlowStep = 'select' | 'optimize' | 'save' | 'assign';

export const useRouteFlow = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('select');
  const [canGoNext, setCanGoNext] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const goToStep = useCallback((step: FlowStep) => {
    setCurrentStep(step);
  }, []);

  const goNext = useCallback(() => {
    const steps: FlowStep[] = ['select', 'optimize', 'save', 'assign'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    const steps: FlowStep[] = ['select', 'optimize', 'save', 'assign'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  const resetFlow = useCallback(() => {
    setCurrentStep('select');
    setCanGoNext(false);
    setCanGoBack(false);
  }, []);

  const updateStepStatus = useCallback((canNext: boolean, canBack: boolean) => {
    setCanGoNext(canNext);
    setCanGoBack(canBack);
  }, []);

  return {
    currentStep,
    canGoNext,
    canGoBack,
    goToStep,
    goNext,
    goBack,
    resetFlow,
    updateStepStatus
  };
};
