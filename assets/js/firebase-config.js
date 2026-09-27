const defaultFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const runtimeConfig = (typeof window !== 'undefined' && window.__POOSTUDIO_CONFIG__)
  ? window.__POOSTUDIO_CONFIG__.firebase || {}
  : {};

export const firebaseConfig = {
  ...defaultFirebaseConfig,
  ...runtimeConfig
};

export function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

export function getFirebaseConfig() {
  if (!hasFirebaseConfig()) {
    throw new Error('Firebase configuration is missing. Set the public Firebase values in your deployment environment before enabling authentication.');
  }
  return firebaseConfig;
}
