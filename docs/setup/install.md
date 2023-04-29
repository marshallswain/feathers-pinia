---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Install Packages and Feathers Client

Install required packages, including the (optional) Feathers Dove Client.

[[toc]]

## Install Packages

You'll need these packages installed to use the Feathers Client, even if you're going to use the typed client from your Feathers v5 Dove API.

### Pinia and Feathers-Pinia

Install these packages using your preferred package manager.  Until version 2.0, it's recommended that you add a `~` in front of the version number for Feathers-Pinia to only get patch releases.

```bash
npm i pinia feathers-pinia@pre
```

### Feathers Packages

If your app will use socket.io, install these packages:

```bash
npm i @feathersjs/feathers @feathersjs/authentication-client @feathersjs/socketio-client socket.io-client
```

If your app will use feathers-rest (no realtime connection), install these packages:

```bash
npm i @feathersjs/feathers @feathersjs/authentication-client @feathersjs/rest-client
```

## Install Typed Client

The FeathersJS v5 Dove CLI creates a typed client application for you. Use these steps to install the client from a Dove-based API:

### Prepare

Check the `package.json` file in your Dove API's codebase to make sure it's ready to bundle. We won't be publishing to
npm, but instead will bundle the client into the `public` directory of the Feathers app. The most important part is to
make sure you have the correct `name` and `version` configured:

```json
{
  "name": "feathers-pinia-api",
  "version": "0.0.3",
  "scripts": {
    "bundle:client": "npm run compile && npm pack --pack-destination ./public"
  }
}
```

### Bundle

After preparing the correct information in the `package.json`, you're ready to run the bundle script:

```bash
npm run bundle:client
```

After the script runs, you should see a corresponding versioned client `.tgz` file in the `public` directory. These
files are the same format as any npm package. If you're running Node.js version 16+, you can install this package
directly into your client application.

```bash
feathers-pinia-api/
├─ node_modules/
├─ public/
│  ├─ feathers-pinia-api-0.0.0.tgz
│  ├─ feathers-pinia-api-0.0.1.tgz
│  ├─ feathers-pinia-api-0.0.2.tgz
│  ├─ feathers-pinia-api-0.0.3.tgz
├─ src/
├─ package.json
```

### Install

Follow these instructions to install the bundled client into your application:

- Start the API server. The API server must be running in order to serve the file from `public`. The default Feathers
API configuration starts the application on `http://localhost:3030`.
- Open your client application and run the following command, specifying the correct hostname for your API server and
the correct filename to match your API server's `package.json` name.

  ```bash
  npm i http://localhost:3030/feathers-pinia-api-0.0.3.tgz
  ```

  <BlockQuote type="info" label="Note">
  Unless you're running the `feathers-pinia-api` example repo, the above command will fail unless you
  customize the URL for the running host and filename.
  </BlockQuote>

To check that the package installed correctly, look at the `dependencies` in your `package.json`. The package will be
named the same as your API's `name` attribute in the api repo's `package.json`.

```json
{
  "dependencies": {
    "feathers-pinia-api": "http://localhost:3030/feathers-pinia-api-0.0.3.tgz",
  }
}
```

### Ship to Production

You'll use a variation of the above process when shipping to production. Ship your Feathers API, first, including the
client `.tgz` builds. Then you can update your CI build to install from the production API instead of from
`localhost:3030`.

### File-based Alternative

As an alternative to updating a CI process, you can consider copying the client file into your client repo and
installing it from the file you copied into your client application. If you check this file into your client's git repo,
you won't have to customize the CI process.

```bash
npm i ./clients/feathers-pinia-api-0.0.3.tgz
```

### Update the Client

Sometimes you may run into an issue when trying to update the client package. Even though you've specified the new
version number in the `package.json`, the old version will be installed. To work around this, sometimes you have to wipe
out the `node_modules` folder and reinstall packages with the new version number in place.

## Important Notes

### SSG Compatibility

See the [Common Patterns](/guide/common-patterns#ssg-compatible-localstorage) page to see an example of SSG-friendly
localStorage.

### Errors with Fetch Setup

If you're upgrading from Feathers v4 Crow and you receive an error like this one:

```txt
"Error: Failed to execute 'fetch' on 'Window': Illegal invocation"
```

You can fix this by binding `window` to `fetch`, as is also shown in the above examples.

```ts
window.fetch.bind(window)
```
