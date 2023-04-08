---
outline: deep
---

<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Feathers-Pinia Services

[[toc]]

## Service Interface Overview

The Feathers-Pinia Service Interface adds methods to the [Feathers Service Interface](https://feathersjs.com/api/services.html),
allowing the service to work as a functional replacement for a Model constructor. In short, in Feathers-Pinia v3 the
service is the Model.

Here's an overview of the full Feathers-Pinia Service Interface:

<!--@include: ../partials/service-interface.md-->

Learn more about the service methods on these pages:

- [The "new" Method](./the-new-method.md)
- [API Methods](./api-methods.md)
- [Store Methods](./store-methods.md)
- [Hybrid Methods](./hybrid-methods.md)
- [Event Methods](./event-methods.md)
