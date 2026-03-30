import "@testing-library/jest-dom";

// Mock axios
jest.mock("axios");

// Setup localStorage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock document.documentElement for i18n
if (!document.documentElement) {
  Object.defineProperty(document, "documentElement", {
    value: {
      dir: "ltr",
      lang: "en",
    },
    writable: true,
  });
} else {
  document.documentElement.dir = "ltr";
  document.documentElement.lang = "en";
}

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});
