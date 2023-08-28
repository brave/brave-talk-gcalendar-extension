<script>
  let entries = [];
  const selectCalendars = chrome.i18n.getMessage("selectCalendars");
  const selectCalendarsInfo = chrome.i18n.getMessage("selectCalendarsInfo");

  async function updateUI() {
    console.log("Requesting scripts");
    chrome.runtime.sendMessage({ type: "getScripts" }, (response) => {
      console.log("Received scripts", response);
      entries = response;

      for (let i = 0; i < entries.length; i++) {
        chrome.permissions.contains(
          { origins: entries[i].matches },
          (result) => {
            entries[i].enabled = result;
          }
        );
      }
    });
  }

  async function toggleHostPerms( event ) {
    const button = event.target.closest("button");
    const origin = button.dataset.origin.replace("*", "");

    if (origin) {
      let enabled = false;

      const opts = {
        origins: [origin],
      };

      /**
       * Check to see if the permission current exists
       * for this host. If it exists, we'll remove it. If
       * it does not exist, we'll request it. Either way,
       * we update the `enabled` state of the associated
       * script entry.
       */
      if (await chrome.permissions.contains(opts)) {
        if (await chrome.permissions.remove(opts)) {
          console.log(`Removed permissions for ${origin}`);
          enabled = false;
        }
      } else {
        /**
         * We need to make sure the 'scripting' permission
         * is also granted. This is required for us to
         * inject associated content scripts into the host.
         * We don't include this in the `remove` calls above
         * because it is not host-specific, but it is a
         * necessary permission if we are to inject scripts
         * into any host.
         *
         * The `storage` permission is needed to store the
         * auto-schedule flag used by the extension. This is
         * the feature which will open a calendar and start
         * the event-creation process on behalf of the user.
         */
        opts.permissions = ["scripting", "storage"];

        if (await chrome.permissions.request(opts)) {
          console.log(`Added permissions for ${origin}`);
          enabled = true;
        }
      }

      /**
       * Now that the permissions for this origin have
       * changed, we need to update the `enabled` state
       * in the collection of script entries.
       */
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].id === button.dataset.id) {
          entries[i].enabled = enabled;
        }
      }

      updateUI();
    }
  }

  updateUI();
</script>

<h1>{selectCalendars}</h1>

<div class="calendars">
{#each entries as entry}
  <button class:disabled={!entry.enabled}
    data-id={entry.id}
    data-origin={entry.matches[0]}
    on:click={toggleHostPerms}
  >
    <img src={entry.image} alt={entry.id} />
    <strong>{entry.label}</strong>
  </button>
{/each}
</div>

<p>{selectCalendarsInfo}</p>

<style>
  .calendars {
    display: flex;
    gap: 1em;
  }

  button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
    border-radius: 0.5em;
    padding: 0.5em;
    border: none;
    cursor: pointer;
  }

  button.disabled {
    filter: grayscale(1);
    opacity: 0.5;
  }

  img {
    height: 24px;
  }
</style>
