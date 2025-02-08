import "dotenv/config";

export default {
  expo: {
    // other expo config stuff

    ios: {
      bundleIdentifier: "com.mikefive2.college-dining",
    },

    extra: {
      firebaseConfig: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      },
    },
  },
};
