import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import * as BraveTalk from "../../../src/brave/brave-talk.ts";

describe("Brave Talk", () => {
  const windowOpen = mock.fn();

  beforeEach(() => {
    windowOpen.mock.resetCalls();
  });

  global.window = Object.create(global.window ?? {});

  Object.defineProperties(global.window, {
    open: { value: windowOpen },
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
      assert.throws(() => BraveTalk.openWindow(""));
      assert.throws(() => BraveTalk.openWindow("a.com"));
      assert.doesNotThrow(() => BraveTalk.openWindow("https://a.com"));
    });

    it("Requires a valid name", () => {
      assert.throws(() => BraveTalk.openWindow("https://a.com", ""));
      assert.throws(() => BraveTalk.openWindow("https://a.com", "_x"));
      assert.doesNotThrow(() => BraveTalk.openWindow("https://a.com", "x"));
    });

    it("Adds noopener and noreferrer to popup window", () => {
      const url = "https://example.com/";
      const name = "example";
      const features = "foo,bar,baz";
      BraveTalk.openWindow(url, name, features);

      const [openedURL, openedName, openedFeatures] =
        windowOpen.mock.calls[0].arguments;

      assert.equal(openedName, name);
      assert.equal(openedURL.toString(), url);
      assert.ok(openedFeatures.includes("noopener"));
      assert.ok(openedFeatures.includes("noreferrer"));
    });
  });

  describe("createRoom", () => {
    it("Requires a valid Room URL", () => {
      const valid = BraveTalk.generateNewRoomUrl();
      const invalid = "https://talk.brave.com/invalid";
      assert.throws(() => BraveTalk.createRoom(""));
      assert.throws(() => BraveTalk.createRoom(invalid));
      assert.doesNotThrow(() => BraveTalk.createRoom(valid));
    });

    it("Contains a create-only parameter", () => {
      const endpoint = BraveTalk.generateNewRoomUrl();
      BraveTalk.createRoom(endpoint);

      const [openedURL] = windowOpen.mock.calls[0].arguments;
      const createOnlyParameter = new URL(openedURL).searchParams.get(
        "create_only"
      );
      assert.equal(createOnlyParameter, "y");
    });

    it("Adds popup, noopener, and noreferrer to popup window", () => {
      const url = BraveTalk.generateNewRoomUrl();
      BraveTalk.createRoom(url);

      const [, , features] = windowOpen.mock.calls[0].arguments;
      assert.ok(features.includes("popup"));
      assert.ok(features.includes("noopener"));
      assert.ok(features.includes("noreferrer"));
    });
  });
});
