// Ambient module declarations for packages without bundled TypeScript types in production

declare module 'react-window' {
  // Fallback to any-typed exports to unblock production builds
  const mod: any;
  export = mod;
}

declare module 'react-window-infinite-loader' {
  const mod: any;
  export = mod;
}

declare module 'react-virtualized-auto-sizer' {
  const mod: any;
  export = mod;
}


