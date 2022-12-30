---
outline: deep
---

<script setup>
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Install Modules

[[toc]]

Pinia's well-designed architecture allows it to be modular while also functioning as a central store. This means that we don't have to register each service's store in a central location. Here's are the recommended steps for setting up Feathers-Pinia:

## Pinia and Feathers-Pinia

Install these packages using your preferred package manager.  Until version 2.0, it's recommended that you add a `~` in front of the version number for Feathers-Pinia to only get patch releases.

```bash
npm i pinia feathers-pinia@pre
```

## Feathers

If your app will use socket.io, install these packages:

```bash
npm i @feathersjs/feathers@pre @feathersjs/authentication-client@pre @feathersjs/socketio-client@pre socket.io-client
```

If your app will use feathers-rest (no realtime connection), install these packages:

```bash
npm i @feathersjs/feathers@pre @feathersjs/authentication-client@pre @feathersjs/rest-client@pre
```
