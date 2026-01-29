// /// <reference types="vite/client" />

declare const process: {
  env: {
    [key: string]: string | undefined;
  }
};

declare module 'lunar-javascript';
