/// <reference types="vite/client" />

// Augment the NodeJS namespace to include API_KEY in ProcessEnv.
// This resolves the "redeclare block-scoped variable 'process'" error by assuming 
// process is already declared (e.g. by @types/node) and extending its type definition.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: any;
  }
}
