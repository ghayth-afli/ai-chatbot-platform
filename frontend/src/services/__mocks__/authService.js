const createMockFn = () => jest.fn();

const mockAuthClient = {
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

const mockAuthService = {
  signup: createMockFn(),
  login: createMockFn(),
  logout: createMockFn(),
  getCurrentUser: createMockFn(),
  verifyEmail: createMockFn(),
  forgotPassword: createMockFn(),
  resetPassword: createMockFn(),
  resendCode: createMockFn(),
  googleSignIn: createMockFn(),
  refreshAccessToken: createMockFn(),
  default: mockAuthClient,
};

module.exports = mockAuthService;
module.exports.__esModule = true;
