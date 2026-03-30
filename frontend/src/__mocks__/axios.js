const createMockInstance = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
});

const mockAxios = createMockInstance();

mockAxios.create = jest.fn(() => createMockInstance());
mockAxios.isCancel = jest.fn(() => false);
mockAxios.CancelToken = {
  source: jest.fn(() => ({
    token: "mock-cancel-token",
    cancel: jest.fn(),
  })),
};
mockAxios.all = jest.fn((promises) => Promise.all(promises));
mockAxios.spread = jest.fn(
  (cb) =>
    (...args) =>
      cb(...args),
);

module.exports = mockAxios;
module.exports.default = mockAxios;
module.exports.__esModule = true;
