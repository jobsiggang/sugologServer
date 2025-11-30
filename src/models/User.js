import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['supervisor', 'company_admin', 'team_admin', 'employee'],
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function() {
      return this.role !== 'supervisor';
    }
  },
  name: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 회사별로 username은 유니크하게 유지 (멀티테넌시 지원)
userSchema.index({ companyId: 1, username: 1 }, { unique: true });

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 검증 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      console.error('User password is missing');
      return false;
    }
    if (!candidatePassword) {
      console.error('Candidate password is missing');
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error in comparePassword:', error);
    // 비밀번호가 해싱되지 않은 경우를 대비한 fallback
    if (error.message.includes('invalid salt')) {
      console.warn('Password appears to be unhashed, comparing directly');
      return candidatePassword === this.password;
    }
    throw error;
  }
};

export default mongoose.models.User || mongoose.model('User', userSchema);
