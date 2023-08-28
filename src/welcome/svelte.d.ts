/// <reference types="svelte" />
declare module "*.svelte" {
  import { SvelteComponentTyped } from "svelte";
  const value: SvelteComponentTyped<{}, {}, {}>;
  export default value;
}
