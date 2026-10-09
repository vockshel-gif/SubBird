/**
 * SunBird Lanka Tours — Firebase Integration Service
 * Handles uploading generated and custom PDFs to Firebase Storage,
 * saving metadata to Firebase Realtime Database, and generating
 * secure, unguessable client links.
 */

(function (window) {
  'use strict';

  // Official Firebase Configuration provided by SunBird
  const firebaseConfig = {
    apiKey: "AIzaSyAjK5tOWOH1BvmRwf_F6E7n1mjCgDvCMeM",
    authDomain: "subbird-a75d3.firebaseapp.com",
    databaseURL: "https://subbird-a75d3-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "subbird-a75d3",
    storageBucket: "subbird-a75d3.firebasestorage.app",
    messagingSenderId: "744521785517",
    appId: "1:744521785517:web:9ac8047585be0f9fb3e624",
    measurementId: "G-HXPR5Q3RYP"
  };

  // Base domain for client itinerary links on SubBirdLanka GitHub host
  const CLIENT_HOST_BASE = "https://vockshel-gif.github.io/SubBirdLanka/view.html?id=";
  const LOCAL_VIEWER_BASE = "view.html?id=";

  let isInitialized = false;
  let app = null;
  let storage = null;
  let database = null;

  function initFirebase() {
    if (isInitialized) return true;
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded. Please include firebase-app, firebase-storage, and firebase-database.');
      return false;
    }
    try {
      if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.app();
      }
      storage = firebase.storage();
      database = firebase.database();
      isInitialized = true;
      console.log('SunBird Firebase service initialized successfully.');
      return true;
    } catch (err) {
      console.error('Error initializing Firebase:', err);
      return false;
    }
  }

  // Generate a cryptographically strong UUID v4
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Uploads a PDF Blob or File to Firebase Storage
   * @param {Blob|File} pdfData - The PDF blob or file to upload
   * @param {string} customId - Optional custom UUID
   * @param {function} onProgress - Optional progress callback: (percent) => {}
   * @returns {Promise<{ id: string, downloadUrl: string, storagePath: string }>}
   */
  async function uploadPDF(pdfData, customId = null, onProgress = null) {
    if (!initFirebase()) throw new Error('Firebase could not be initialized.');

    const id = customId || generateUUID();
    const storagePath = `itineraries/${id}.pdf`;
    const storageRef = storage.ref(storagePath);

    const metadata = {
      contentType: 'application/pdf',
      customMetadata: {
        itineraryId: id,
        uploadedAt: new Date().toISOString()
      }
    };

    const uploadTask = storageRef.put(pdfData, metadata);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          console.error('Firebase upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
            resolve({
              id,
              downloadUrl,
              storagePath
            });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  /**
   * Saves itinerary metadata into Firebase Realtime Database
   * @param {Object} record - { id, title, type, pdfUrl, ... }
   */
  async function saveRecord(record) {
    if (!initFirebase()) throw new Error('Firebase could not be initialized.');
    if (!record.id) throw new Error('Record must have an id.');

    const cleanRecord = {
      id: record.id,
      title: record.title || 'SunBird Lanka Tours Itinerary',
      type: record.type || 'classic_generated', // 'classic_generated' or 'custom_pdf'
      pdfUrl: record.pdfUrl || '',
      from: record.from || '',
      to: record.to || '',
      adults: record.adults || '',
      clientName: record.clientName || '',
      fileName: record.fileName || `${record.id}.pdf`,
      createdAt: record.createdAt || Date.now(),
      data: record.data || null
    };

    await database.ref(`itineraries/${record.id}`).set(cleanRecord);
    return cleanRecord;
  }

  /**
   * Fetches an itinerary by ID from Firebase Realtime Database
   * @param {string} id
   */
  async function getRecord(id) {
    if (!initFirebase()) throw new Error('Firebase could not be initialized.');
    const snapshot = await database.ref(`itineraries/${id}`).once('value');
    if (!snapshot.exists()) {
      // Fallback: check if the file exists directly in storage
      try {
        const storageRef = storage.ref(`itineraries/${id}.pdf`);
        const downloadUrl = await storageRef.getDownloadURL();
        return {
          id: id,
          title: 'Official Tour Itinerary & Quotation',
          type: 'custom_pdf',
          pdfUrl: downloadUrl,
          createdAt: Date.now()
        };
      } catch (e) {
        return null;
      }
    }
    return snapshot.val();
  }

  /**
   * Returns the final client link for a given itinerary ID
   */
  function getClientLink(id, useLocal = false) {
    const base = useLocal ? LOCAL_VIEWER_BASE : CLIENT_HOST_BASE;
    return `${base}${id}`;
  }

  // Export service object
  window.SunBirdFirebase = {
    init: initFirebase,
    generateUUID: generateUUID,
    uploadPDF: uploadPDF,
    saveRecord: saveRecord,
    getRecord: getRecord,
    getClientLink: getClientLink,
    CLIENT_HOST_BASE: CLIENT_HOST_BASE,
    LOCAL_VIEWER_BASE: LOCAL_VIEWER_BASE
  };

})(window);
