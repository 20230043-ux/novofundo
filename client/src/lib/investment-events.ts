// Global investment update event system
type InvestmentUpdateListener = (projectId: number, newValue: number) => void;

class InvestmentEventManager {
  private listeners: InvestmentUpdateListener[] = [];

  subscribe(listener: InvestmentUpdateListener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(projectId: number, newValue: number) {
    console.log('Investment event emitted:', { projectId, newValue });
    this.listeners.forEach(listener => {
      try {
        listener(projectId, newValue);
      } catch (error) {
        console.error('Error in investment event listener:', error);
      }
    });
  }
}

export const investmentEvents = new InvestmentEventManager();