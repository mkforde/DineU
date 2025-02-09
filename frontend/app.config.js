import "dotenv/config";

export default {
  expo: {
    name: "DineU",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    plugins: [
      'expo-router',
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    scheme: "dineu",
    ios: {
      bundleIdentifier: 'com.devfest.dineu',
      supportsTablet: true,
      associatedDomains: [
        'applinks:eilgfvfxoaptkbqirdmj.supabase.co',
        'webcredentials:eilgfvfxoaptkbqirdmj.supabase.co'
      ],
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['dineu']
          }
        ]
      }
    },
    android: {
      package: 'com.devfest.dineu',
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "eilgfvfxoaptkbqirdmj.supabase.co",
              pathPrefix: "/auth/v1/verify"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    extra: {
      eas: {
        projectId: "your-project-id"
      }
    },
    web: {
      bundler: "metro"
    },
    experiments: {
      tsconfigPaths: true
    }
  }
};
