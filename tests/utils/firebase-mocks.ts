import { vi } from 'vitest';

// Mock Firebase App
export const mockFirebaseApp = {
  name: 'test-app',
  options: {
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
    projectId: 'test-project',
  },
};

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  config: {},
  name: 'test-auth',
  app: mockFirebaseApp,
};

// Mock Firebase User
export const mockFirebaseUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  photoURL: null,
  phoneNumber: null,
  providerId: 'firebase',
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
  getIdTokenResult: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  reload: vi.fn().mockResolvedValue(undefined),
  toJSON: vi.fn().mockReturnValue({}),
};

// Mock Firebase Firestore
export const mockFirestore = {
  app: mockFirebaseApp,
  collection: vi.fn(),
  doc: vi.fn(),
};

// Mock Firestore Document
export const mockDocumentSnapshot = {
  exists: vi.fn().mockReturnValue(true),
  data: vi.fn().mockReturnValue({}),
  id: 'test-doc-id',
  ref: {},
};

// Mock Firestore Collection
export const mockCollectionSnapshot = {
  docs: [mockDocumentSnapshot],
  empty: false,
  size: 1,
  forEach: vi.fn(),
};

// Firebase Auth method mocks
export const signInWithEmailAndPasswordMock = vi.fn();
export const createUserWithEmailAndPasswordMock = vi.fn();
export const signOutMock = vi.fn();
export const onAuthStateChangedMock = vi.fn();

// Firestore method mocks
export const addDocMock = vi.fn();
export const getDocMock = vi.fn();
export const getDoctorsMock = vi.fn();
export const updateDocMock = vi.fn();
export const deleteDocMock = vi.fn();
export const collectionMock = vi.fn();
export const docMock = vi.fn();

// Setup all Firebase mocks
export const setupFirebaseMocks = () => {
  vi.mock('firebase/app', () => ({
    initializeApp: vi.fn().mockReturnValue(mockFirebaseApp),
    getApps: vi.fn().mockReturnValue([]),
    getApp: vi.fn().mockReturnValue(mockFirebaseApp),
  }));

  vi.mock('firebase/auth', () => ({
    getAuth: vi.fn().mockReturnValue(mockAuth),
    signInWithEmailAndPassword: signInWithEmailAndPasswordMock,
    createUserWithEmailAndPassword: createUserWithEmailAndPasswordMock,
    signOut: signOutMock,
    onAuthStateChanged: onAuthStateChangedMock,
    connectAuthEmulator: vi.fn(),
  }));

  vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn().mockReturnValue(mockFirestore),
    collection: collectionMock,
    doc: docMock,
    addDoc: addDocMock,
    getDoc: getDocMock,
    getDocs: getDoctorsMock,
    updateDoc: updateDocMock,
    deleteDoc: deleteDocMock,
    connectFirestoreEmulator: vi.fn(),
  }));
};

// Reset all mocks
export const resetFirebaseMocks = () => {
  signInWithEmailAndPasswordMock.mockReset();
  createUserWithEmailAndPasswordMock.mockReset();
  signOutMock.mockReset();
  onAuthStateChangedMock.mockReset();
  addDocMock.mockReset();
  getDocMock.mockReset();
  getDoctorsMock.mockReset();
  updateDocMock.mockReset();
  deleteDocMock.mockReset();
  collectionMock.mockReset();
  docMock.mockReset();
};