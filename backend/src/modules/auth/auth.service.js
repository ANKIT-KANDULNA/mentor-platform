const authRepo = require('./auth.repository');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/token');
const AppError = require('../../utils/AppError');

const signup = async ({ fullName, email, password, role }) => {
  // Check if email exists
  const existing = await authRepo.findUserByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await hashPassword(password);
  
  const user = await authRepo.createUserWithProfile({
    fullName, email, passwordHash, role,
  });

  return user;
};

const login = async ({ email, password }) => {
  // Find user
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Compare password
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403);
  }

  // Generate tokens
  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Save refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await authRepo.saveRefreshToken(user.id, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  // Verify JWT
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Check in DB
  const tokenRecord = await authRepo.findRefreshToken(refreshToken);
  if (!tokenRecord || tokenRecord.isRevoked) {
    throw new AppError('Refresh token revoked', 401);
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401);
  }

  // Rotate token
  await authRepo.revokeRefreshToken(refreshToken);

  const user = await authRepo.findUserById(decoded.id);
  const newAccessToken = generateAccessToken({ id: user.id, role: user.role });
  const newRefreshToken = generateRefreshToken({ id: user.id });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authRepo.saveRefreshToken(user.id, newRefreshToken, expiresAt);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    await authRepo.revokeRefreshToken(refreshToken).catch(() => null);
  }
};

const getMe = async (userId) => {
  return authRepo.findUserById(userId);
};

module.exports = { signup, login, refresh, logout, getMe };