<script lang="ts">
  import { writable } from 'svelte/store';

  import Button from 'src/components/Button.svelte';
  import Google from 'src/components/icons/social/Google.svelte';

  const email = writable('');

  function continueWithEmail(e: Event) {
    e.preventDefault();

    console.log($email);
  }

  function googleAuth(node: HTMLDivElement) {
    google.accounts.id.initialize({
      client_id: '665071659607-omiut25e1d6ik9lnt07021vndudto9a6.apps.googleusercontent.com',
      callback: (response) => {
        console.log('Token is', response.credential);
      },
    });
    google.accounts.id.renderButton(
      node,
      { theme: 'outline', size: 'large' }, // customization attributes
    );
    google.accounts.id.prompt(); // also display the One Tap dialog
  }

  // function authGoogle() {
  //   gapi.load('auth2', async () => {
  //     await gapi.client.init({
  //       apiKey: 'AIzaSyDWRN4SXx9tqatJFIbswlAHrUh6XWoZSrg',
  //       // Your API key will be automatically added to the Discovery Document URLs.
  //       discoveryDocs: ['https://people.googleapis.com/$discovery/rest'],
  //       // clientId and scope are optional if auth is not required.
  //       clientId: '665071659607-omiut25e1d6ik9lnt07021vndudto9a6.apps.googleusercontent.com',
  //       scope: 'profile',
  //     });

  //     const person = await gapi.auth.auth2 client.people.people.get({
  //       resourceName: 'people/me',
  //       'requestMask.includeField': 'person.names',
  //     });

  //     console.log('Got', person);
  //   });

  //   console.log('Authenticating using Google');
  // }
</script>

<svelte:head>
  <title>Sign In</title>

  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <script src="https://apis.google.com/js/api.js" async defer></script>
</svelte:head>

<div class="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="Workflow" />
      <h1 class="mt-6 text-center text-3xl font-extrabold text-base-content">
        Sign in to your account
      </h1>

      <p class="mt-2 text-center text-sm text-base-600">
        Access your existing account or create a new account to get the ability to save content and
        retain your progress.
      </p>
    </div>
    <form class="mt-8 space-y-6" on:submit={continueWithEmail}>
      <input type="hidden" name="remember" value="true" />
      <div class="rounded-md shadow-sm -space-y-px">
        <div class="flex">
          <label for="email-address" class="sr-only">Email address</label>

          <input
            id="email-address"
            name="email"
            type="email"
            autocomplete="email"
            bind:value={$email}
            required
            class="appearance-none rounded-l-md relative block flex-1 px-3 py-2 border border-base-300 placeholder-base-500 text-base-content focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />

          <button
            type="submit"
            class="relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-r-md text-base-100 bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Continue
          </button>
        </div>
      </div>

      <div use:googleAuth />

      <!-- <Button
        class="flex items-center justify-center w-full"
        secondary
        dense
        on:click={authGoogle}><Google class="h-4 w-4 mr-2" /> Continue with Google</Button
      > -->
    </form>

    <p class="mt-2 text-center text-sm text-base-600">
      Your data
      <a href="/about" class="font-medium text-primary hover:text-primary-500">belong to you</a>.
    </p>
  </div>
</div>
