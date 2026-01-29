// Shim for @google/genai to fix TS2307 error if types aren't resolving
declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(config: { apiKey: string | undefined });
    models: {
      generateContent(params: {
        model: string;
        contents: any;
        config?: {
          responseMimeType?: string;
          responseSchema?: any;
          systemInstruction?: string;
        };
      }): Promise<{ text: string }>;
    };
  }

  export enum Type {
    OBJECT = 'OBJECT',
    ARRAY = 'ARRAY',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    INTEGER = 'INTEGER',
    BOOLEAN = 'BOOLEAN'
  }
}

// Shim for asset imports when vite/client types are missing or to override
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}