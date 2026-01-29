// Removed missing vite/client reference
// /// <reference types="vite/client" />

// Augment NodeJS ProcessEnv to include API_KEY. 
// We do not declare 'var process' to avoid redeclaration errors as it's already provided by @types/node.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY?: string;
  }
}

// Asset module definitions
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