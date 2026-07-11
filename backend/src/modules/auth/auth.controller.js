const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const user = await authService.signup({ fullName, email, password, role });
  
  sendSuccess(res, user, 201, 'User registered successfully');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  // Store refresh token in HTTP-only cookie for enhanced security
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendSuccess(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  }, 200, 'Logged in successfully');
});

const refresh = asyncHandler(async (req, res) => {
  // Try to get refresh token from cookies first, then body
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  
  const result = await authService.refresh(refreshToken);

  // Set new rotated refresh token in cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, result, 200, 'Token refreshed successfully');
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  await authService.logout(refreshToken);

  res.clearCookie('refreshToken');
  sendSuccess(res, null, 200, 'Logged out successfully');
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  sendSuccess(res, user, 200, 'Current user retrieved successfully');
});

module.exports = {
  signup,
  login,
  refresh,
  logout,
  getMe,
};
