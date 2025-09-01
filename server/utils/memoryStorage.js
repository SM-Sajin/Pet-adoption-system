// Simple in-memory storage for testing when MongoDB is not available
class MemoryStorage {
  constructor() {
    this.users = new Map();
    this.pets = new Map();
    this.applications = new Map();
    this.userIdCounter = 1;
    this.petIdCounter = 1;
    this.applicationIdCounter = 1;
  }

  // User operations
  createUser(userData) {
    const id = this.userIdCounter.toString();
    const user = {
      _id: id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    this.userIdCounter++;
    return user;
  }

  findUserByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  findUserById(id) {
    return this.users.get(id);
  }

  updateUser(id, updates) {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return null;
  }

  // Pet operations
  createPet(petData) {
    const id = this.petIdCounter.toString();
    const pet = {
      _id: id,
      ...petData,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      wishlistedBy: [],
      applications: []
    };
    this.pets.set(id, pet);
    this.petIdCounter++;
    return pet;
  }

  findPets(filter = {}) {
    let pets = Array.from(this.pets.values());
    
    // Apply filters
    if (filter.adoptionStatus) {
      pets = pets.filter(pet => pet.adoptionStatus === filter.adoptionStatus);
    }
    if (filter.type) {
      pets = pets.filter(pet => pet.type === filter.type);
    }
    if (filter.breed) {
      pets = pets.filter(pet => 
        pet.breed.toLowerCase().includes(filter.breed.toLowerCase())
      );
    }
    if (filter.size) {
      pets = pets.filter(pet => pet.size === filter.size);
    }
    if (filter.gender) {
      pets = pets.filter(pet => pet.gender === filter.gender);
    }
    if (filter.age) {
      if (filter.age.$gte) {
        pets = pets.filter(pet => pet.age >= filter.age.$gte);
      }
      if (filter.age.$lte) {
        pets = pets.filter(pet => pet.age <= filter.age.$lte);
      }
    }

    // Sort by creation date (newest first)
    pets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return pets;
  }

  findPetById(id) {
    return this.pets.get(id);
  }

  updatePet(id, updates) {
    const pet = this.pets.get(id);
    if (pet) {
      const updatedPet = { ...pet, ...updates, updatedAt: new Date() };
      this.pets.set(id, updatedPet);
      return updatedPet;
    }
    return null;
  }

  deletePet(id) {
    return this.pets.delete(id);
  }

  // Application operations
  createApplication(applicationData) {
    const id = this.applicationIdCounter.toString();
    const application = {
      _id: id,
      ...applicationData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.applications.set(id, application);
    this.applicationIdCounter++;
    return application;
  }

  findApplications(filter = {}) {
    let applications = Array.from(this.applications.values());
    
    if (filter.pet) {
      applications = applications.filter(app => app.pet === filter.pet);
    }
    if (filter.applicant) {
      applications = applications.filter(app => app.applicant === filter.applicant);
    }
    if (filter.status) {
      applications = applications.filter(app => app.status === filter.status);
    }

    applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return applications;
  }

  updateApplication(id, updates) {
    const application = this.applications.get(id);
    if (application) {
      const updatedApplication = { ...application, ...updates, updatedAt: new Date() };
      this.applications.set(id, updatedApplication);
      return updatedApplication;
    }
    return null;
  }

  // Utility methods
  getStats() {
    return {
      users: this.users.size,
      pets: this.pets.size,
      applications: this.applications.size
    };
  }

  clear() {
    this.users.clear();
    this.pets.clear();
    this.applications.clear();
    this.userIdCounter = 1;
    this.petIdCounter = 1;
    this.applicationIdCounter = 1;
  }
}

// Create a singleton instance
const memoryStorage = new MemoryStorage();

module.exports = memoryStorage; 