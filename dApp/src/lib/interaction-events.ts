// src/lib/interaction-events.ts

type InteractionType = 'NAVIGATION' | 'AI_THOUGHT' | 'AI_RESPONSE' | 'TRANSACTION' | 'MINT' | 'ERROR';

export const InteractionBus = new EventTarget();

export const triggerInteraction = (type: InteractionType, payload?: any) => {
  const event = new CustomEvent('crikz-interaction', { 
    detail: { type, payload } 
  });
  InteractionBus.dispatchEvent(event);
};