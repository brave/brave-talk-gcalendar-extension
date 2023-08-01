import * as BraveTalk from "../../../src/brave/brave-talk";

describe("Brave Talk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  global.window = Object.create(global.window ?? {});

  Object.defineProperties(global.window, {
    open: { value: jest.fn() },
    screen: { value: { width: 1920, height: 1080 } },
    crypto: {
      value: {
        getRandomValues(array: Uint8Array) {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
          return array;
        },
      },
    },
  });

  describe("openWindow", () => {
    it("Requires a valid URL", () => {
      expect(() => BraveTalk.openWindow("")).toThrow();
      expect(() => BraveTalk.openWindow("a.com")).toThrow();
      expect(() => BraveTalk.openWindow("https://a.com")).not.toThrow();
    });

    it("Requires a valid name", () => {
      expect(() => BraveTalk.openWindow("https://a.com", "")).toThrow();
      expect(() => BraveTalk.openWindow("https://a.com", "_x")).toThrow();
      expect(() => BraveTalk.openWindow("https://a.com", "x")).not.toThrow();
    });

    it("Adds noopener and noreferrer to popup window", () => {
      const url = "https://example.com/";
      const name = "example";
      const features = "foo,bar,baz";
      BraveTalk.openWindow(url, name, features);

      const openedURL = (global.window.open as jest.Mock).mock.calls[0][0];
      const openedName = (global.window.open as jest.Mock).mock.calls[0][1];
      const openedFeatures = (global.window.open as jest.Mock).mock.calls[0][2];

      expect(openedName).toBe(name);
      expect(openedURL.toString()).toBe(url);
      expect(openedFeatures).toContain("noopener");
      expect(openedFeatures).toContain("noreferrer");
    });
  });

  describe("createRoom", () => {
    it("Requires a valid Room URL", () => {
      const valid = BraveTalk.generateNewRoomUrl();
      const invalid = "https://talk.brave.com/invalid";
      expect(() => BraveTalk.createRoom("")).toThrow();
      expect(() => BraveTalk.createRoom(invalid)).toThrow();
      expect(() => BraveTalk.createRoom(valid)).not.toThrow();
    });

    it("Contains a create-only parameter", () => {
      const endpoint = BraveTalk.generateNewRoomUrl();
      BraveTalk.createRoom(endpoint);

      const openedURL = (global.window.open as jest.Mock).mock.calls[0][0];
      const createOnlyParameter = new URL(openedURL).searchParams.get(
        "create_only"
      );
      expect(createOnlyParameter).toBe("y");
    });

    it("Adds popup, noopener, and noreferrer to popup window", () => {
      const url = BraveTalk.generateNewRoomUrl();
      BraveTalk.createRoom(url);

      const features = (global.window.open as jest.Mock).mock.calls[0][2];
      expect(features).toContain("popup");
      expect(features).toContain("noopener");
      expect(features).toContain("noreferrer");
    });
  });
});
