const fs = require('fs');
const path = require('path');

const EMULATOR_DATA_DIR = path.join(__dirname, '../emulator-data');
const FIRESTORE_DATA_DIR = path.join(EMULATOR_DATA_DIR, 'firestore');

// Ensure directories exist
if (!fs.existsSync(EMULATOR_DATA_DIR)) {
  fs.mkdirSync(EMULATOR_DATA_DIR, { recursive: true });
  console.log('Created emulator-data directory');
}

if (!fs.existsSync(FIRESTORE_DATA_DIR)) {
  fs.mkdirSync(FIRESTORE_DATA_DIR, { recursive: true });
  console.log('Created firestore data directory');
}

// Test user data
const testUserData = {
  "5551234567": {
    "firstName": "Test User",
    "phoneNumber": "5551234567",
    "age": "25",
    "setupComplete": true,
    "isAdmin": false,
    "createdAt": {
      "_seconds": Math.floor(Date.now() / 1000),
      "_nanoseconds": 0
    },
    "lastUpdated": {
      "_seconds": Math.floor(Date.now() / 1000),
      "_nanoseconds": 0
    },
    "groupIds": [],
    "coffeeAdded": []
  }
};

// Create export data structure
const exportData = {
  "collection_groups": {},
  "documents": {
    "users": testUserData
  },
  "indexes": {},
  "metadata": {
    "timestamp": {
      "_seconds": Math.floor(Date.now() / 1000),
      "_nanoseconds": 0
    },
    "version": "9.23.0"
  }
};

// Write test data to file
const outputPath = path.join(FIRESTORE_DATA_DIR, 'firestore_export');
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const firestoreDataPath = path.join(outputPath, 'all_namespaces/all_kinds/all_namespaces_all_kinds.export_metadata');
fs.writeFileSync(
  firestoreDataPath,
  JSON.stringify(exportData, null, 2)
);

console.log('Test data seeded successfully!');
console.log('Data written to:', firestoreDataPath);

// Create a dummy auth export
const authDataDir = path.join(EMULATOR_DATA_DIR, 'auth_export');
if (!fs.existsSync(authDataDir)) {
  fs.mkdirSync(authDataDir, { recursive: true });
  fs.writeFileSync(
    path.join(authDataDir, 'accounts.json'),
    JSON.stringify([{
      "localId": "test-user-id",
      "phoneNumber": "+15551234567",
      "lastLoginAt": String(Date.now()),
      "createdAt": String(Date.now())
    }], null, 2)
  );
  console.log('Created auth test data');
}