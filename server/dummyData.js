const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Pet = require('./models/Pet');
const memoryStorage = require('./utils/memoryStorage');
const { loadSampleDiscountCodes } = require('./sampleDiscountData');

const DUMMY_USERS = [
  {
    name: 'Alice Tester',
    email: 'alice@example.com',
    password: 'password123',
    phone: '1234567890',
    isAdmin: false
  },
  {
    name: 'Bob Demo',
    email: 'bob@example.com',
    password: 'password123',
    phone: '9876543210',
    isAdmin: false
  },
  {
    name: 'Test User',
    email: 'user@gmail.com',
    password: '123456',
    phone: '5555555555',
    isAdmin: false
  },
  {
    name: 'Admin',
    email: 'admin@gmail.com',
    password: '123456',
    phone: '1111111111',
    isAdmin: true
  }
];

const DUMMY_PETS = [
  {
    name: 'Buddy',
    type: 'dog',
    breed: 'Golden Retriever',
    age: 2,
    ageUnit: 'years',
    gender: 'male',
    size: 'large',
    color: 'Golden',
    description: 'Friendly and playful dog, loves kids and other pets.',
    images: [
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
    ],
    healthStatus: {
      vaccinated: true,
      spayedNeutered: true,
      microchipped: true,
      specialNeeds: false
    },
    temperament: ['friendly', 'playful', 'social'],
    goodWith: { children: true, dogs: true, cats: true },
    location: { city: 'New York', state: 'NY', zipCode: '10001' },
    adoptionFee: 100
  },
  {
    name: 'Mittens',
    type: 'cat',
    breed: 'Tabby',
    age: 1,
    ageUnit: 'years',
    gender: 'female',
    size: 'small',
    color: 'Gray',
    description: 'Calm and affectionate, perfect lap cat.',
    images: [
      'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg'
    ],
    healthStatus: {
      vaccinated: true,
      spayedNeutered: true,
      microchipped: false,
      specialNeeds: false
    },
    temperament: ['calm', 'friendly'],
    goodWith: { children: true, dogs: false, cats: true },
    location: { city: 'San Francisco', state: 'CA', zipCode: '94101' },
    adoptionFee: 50
  },
  // --- Additional Dummy Pets ---
  {
    name: 'Charlie',
    type: 'dog',
    breed: 'Beagle',
    age: 3,
    ageUnit: 'years',
    gender: 'male',
    size: 'medium',
    color: 'Brown/White',
    description: 'Energetic beagle who loves to sniff and explore.',
    images: [
      'https://images.pexels.com/photos/460775/pexels-photo-460775.jpeg'
    ],
    healthStatus: {
      vaccinated: true,
      spayedNeutered: false,
      microchipped: true,
      specialNeeds: false
    },
    temperament: ['energetic', 'friendly'],
    goodWith: { children: true, dogs: true, cats: false },
    location: { city: 'Austin', state: 'TX', zipCode: '73301' },
    adoptionFee: 80
  },
  {
    name: 'Luna',
    type: 'cat',
    breed: 'Siamese',
    age: 2,
    ageUnit: 'years',
    gender: 'female',
    size: 'small',
    color: 'Cream',
    description: 'Talkative Siamese cat, loves attention and cuddles.',
    images: [
      'https://images.pexels.com/photos/1276553/pexels-photo-1276553.jpeg'
    ],
    healthStatus: {
      vaccinated: true,
      spayedNeutered: true,
      microchipped: false,
      specialNeeds: false
    },
    temperament: ['social', 'playful'],
    goodWith: { children: true, dogs: false, cats: true },
    location: { city: 'Seattle', state: 'WA', zipCode: '98101' },
    adoptionFee: 60
  },
  {
    name: 'Coco',
    type: 'rabbit',
    breed: 'Mini Lop',
    age: 1,
    ageUnit: 'years',
    gender: 'female',
    size: 'small',
    color: 'White/Brown',
    description: 'Gentle rabbit, great for families with kids.',
    images: [
      'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg'
    ],
    healthStatus: {
      vaccinated: false,
      spayedNeutered: false,
      microchipped: false,
      specialNeeds: false
    },
    temperament: ['calm', 'shy'],
    goodWith: { children: true, dogs: false, cats: false },
    location: { city: 'Chicago', state: 'IL', zipCode: '60601' },
    adoptionFee: 30
  },
  {
    name: 'Goldie',
    type: 'fish',
    breed: 'Goldfish',
    age: 1,
    ageUnit: 'years',
    gender: 'unknown',
    size: 'small',
    color: 'Gold',
    description: 'Low-maintenance goldfish, perfect for beginners.',
    images: [
      'https://images.pexels.com/photos/128756/pexels-photo-128756.jpeg'
    ],
    healthStatus: {
      vaccinated: false,
      spayedNeutered: false,
      microchipped: false,
      specialNeeds: false
    },
    temperament: ['calm'],
    goodWith: { children: true, dogs: false, cats: false },
    location: { city: 'Miami', state: 'FL', zipCode: '33101' },
    adoptionFee: 10
  }
];

async function loadDummyDataMongo() {
  // Remove all users and pets
  await User.deleteMany({});
  await Pet.deleteMany({});

  // Create users
  const userDocs = [];
  for (const user of DUMMY_USERS) {
    const userDoc = await User.create(user);
    userDocs.push(userDoc);
  }

  // Create pets
  for (let i = 0; i < DUMMY_PETS.length; i++) {
    const pet = DUMMY_PETS[i];
    await Pet.create({ ...pet, owner: userDocs[i % userDocs.length]._id });
  }

  // Load sample discount codes
  await loadSampleDiscountCodes();

  console.log('Dummy data loaded into MongoDB!');
}

function loadDummyDataMemory() {
  memoryStorage.clear();
  // Create users
  const userIds = [];
  for (const user of DUMMY_USERS) {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const userDoc = memoryStorage.createUser({ ...user, password: hashedPassword });
    userIds.push(userDoc._id);
  }
  // Create pets
  for (let i = 0; i < DUMMY_PETS.length; i++) {
    const pet = DUMMY_PETS[i];
    memoryStorage.createPet({ ...pet, owner: userIds[i % userIds.length] });
  }
  console.log('Dummy data loaded into in-memory storage!');
}

module.exports = { loadDummyDataMongo, loadDummyDataMemory }; 