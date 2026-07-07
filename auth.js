/*
 * PRAHARI OS - auth.js
 * Initialize Firebase Auth and Firestore, manage user profiles, roles, and Google synchronization.
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCA-3F458_fxg-PMyOykXdK2FGw3IvwhrE",
  authDomain: "active-zepplin-rfs6l.firebaseapp.com",
  projectId: "active-zepplin-rfs6l",
  storageBucket: "active-zepplin-rfs6l.firebasestorage.app",
  messagingSenderId: "162727691095",
  appId: "1:162727691095:web:226dc592c9c2154063f412"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

// Role profiles
const ROLES = {
  CITIZEN: "Citizen",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  PHARMACIST: "Pharmacist",
  OFFICER: "District Officer",
  ADMIN: "Administrator"
};

class AuthController {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.activeRole = localStorage.getItem('prahari-active-role') || ROLES.DOCTOR;
    
    this.initListeners();
  }

  initListeners() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        // Fetch or create user document in Firestore
        await this.syncUserProfile(user);
        this.dispatchAuthEvent('login', { user, profile: this.userProfile });
      } else {
        this.userProfile = null;
        this.dispatchAuthEvent('logout', null);
      }
    });
  }

  async syncUserProfile(user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        this.userProfile = userSnap.data();
        if (this.userProfile.role) {
          this.activeRole = this.userProfile.role;
          localStorage.setItem('prahari-active-role', this.activeRole);
        }
      } else {
        // Create new profile record
        const newProfile = {
          uid: user.uid,
          displayName: user.displayName || "Prahari Member",
          email: user.email,
          photoURL: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          role: this.activeRole,
          createdAt: new Date().toISOString(),
          googleSynced: user.providerData.some(p => p.providerId === 'google.com'),
          gender: "Male",
          phone: user.phoneNumber || "+91 98765 00001",
          district: "Dhar, Madhya Pradesh",
          age: 32,
          bloodGroup: "O+",
          digitalCardId: "PR-" + Math.floor(100000 + Math.random() * 900000)
        };
        await setDoc(userRef, newProfile);
        this.userProfile = newProfile;
      }
    } catch (err) {
      console.error("Firestore user sync error:", err);
      // Fallback local memory profile to ensure app continues working
      this.userProfile = {
        uid: user.uid,
        displayName: user.displayName || "Mock User Profile",
        email: user.email,
        photoURL: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        role: this.activeRole,
        googleSynced: true,
        gender: "Male",
        phone: "+91 98765 43210",
        district: "Indore, Madhya Pradesh",
        age: 38,
        bloodGroup: "B+",
        digitalCardId: "PR-882711"
      };
    }
  }

  async signUpWithEmail(email, password, displayName, role) {
    try {
      this.activeRole = role;
      localStorage.setItem('prahari-active-role', role);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Profile will auto sync via state change listener
      return userCredential.user;
    } catch (err) {
      throw err;
    }
  }

  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      throw err;
    }
  }

  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Handle workspace credentials access token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        localStorage.setItem('prahari-google-access-token', token);
      }
      return result.user;
    } catch (err) {
      throw err;
    }
  }

  async logout() {
    try {
      localStorage.removeItem('prahari-google-access-token');
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  async updateRole(role) {
    this.activeRole = role;
    localStorage.setItem('prahari-active-role', role);
    if (this.currentUser && this.userProfile) {
      this.userProfile.role = role;
      try {
        await setDoc(doc(db, "users", this.currentUser.uid), { role }, { merge: true });
      } catch (e) {
        console.warn("Could not save updated role to Firestore, utilizing offline preference");
      }
    }
    this.dispatchAuthEvent('roleChanged', { role });
  }

  dispatchAuthEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(`prahari-auth-${eventName}`, { detail }));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getUserProfile() {
    return this.userProfile || {
      displayName: "Guest Member",
      email: "guest@prahari.org",
      role: this.activeRole,
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      phone: "+91 99999 99999",
      district: "Not set",
      age: "N/A",
      bloodGroup: "N/A",
      digitalCardId: "PR-GUEST",
      googleSynced: false
    };
  }
}

window.PrahariAuth = new AuthController();
export { auth, db };
