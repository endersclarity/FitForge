const config = {
  appId: 'com.fitforge.app',
  productName: 'FitForge',
  directories: {
    output: 'release',
    buildResources: 'build'
  },
  files: [
    'dist/**/*',
    'electron/dist/**/*',
    'node_modules/**/*',
    'package.json'
  ],
  extraMetadata: {
    main: 'electron/dist/main.js'
  },
  mac: {
    category: 'public.app-category.healthcare-fitness',
    icon: 'build/icon.icns',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    darkModeSupport: true,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist'
  },
  dmg: {
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ],
    window: {
      width: 540,
      height: 380
    }
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      },
      {
        target: 'portable',
        arch: ['x64', 'ia32']
      }
    ],
    icon: 'build/icon.ico',
    publisherName: 'FitForge',
    verifyUpdateCodeSignature: false
  },
  nsis: {
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'FitForge'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      },
      {
        target: 'rpm',
        arch: ['x64']
      }
    ],
    icon: 'build/icon.png',
    category: 'Office',
    synopsis: 'AI-Powered Fitness Application',
    description: 'FitForge is the ultimate AI-powered fitness ecosystem for tracking workouts, nutrition, and progress.'
  },
  publish: {
    provider: 'github',
    owner: 'your-username',
    repo: 'fitforge'
  },
  compression: 'maximum',
  removePackageScripts: true,
  nodeGypRebuild: false,
  buildDependenciesFromSource: false
};

export default config;