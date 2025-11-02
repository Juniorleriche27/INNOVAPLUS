// TEMPORARY SHIM
// This file avoids the flood of "no JSX.IntrinsicElements" errors in editors
// when @types/react is not installed (e.g., node_modules missing on server).
// Remove this file once dependencies are installed (npm ci / npm install).

declare namespace JSX {
  // Allow any intrinsic tag so the editor doesn't flag all JSX as an error.
  // React's proper typings will override these when available.
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface IntrinsicAttributes {
    key?: any;
  }
}

