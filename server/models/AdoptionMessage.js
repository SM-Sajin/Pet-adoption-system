const mongoose = require('mongoose');

const adoptionMessageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  pet: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    required: true 
  },
  subject: { 
    type: String, 
    required: true, 
    trim: true,
    default: 'Adoption Inquiry'
  },
  content: { 
    type: String, 
    required: true, 
    trim: true 
  },
  readAt: { 
    type: Date, 
    default: null 
  },
  status: {
    type: String,
    enum: ['sent', 'read', 'replied'],
    default: 'sent'
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
adoptionMessageSchema.index({ recipient: 1, createdAt: -1 });
adoptionMessageSchema.index({ sender: 1, pet: 1 });

module.exports = mongoose.model('AdoptionMessage', adoptionMessageSchema);
