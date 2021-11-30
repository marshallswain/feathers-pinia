# usePagination

The `usePagination` utility is designed to pair with `useFind`. It aids in creating custom pagination interfaces.

Setup steps:

1. Create a reactive pagination object. It needs two properties:  `$limit` and`$skip`:

    ```ts
    const pagination = reactive({ $limit: 5, $skip: 0 })
    ```

2. Create a computed `params` object that spreads the pagination props into `params.query`.

    ```ts
    const params = computed(() => {
      return {
        query: {
          ...pagination
        },
        paginate: true,
      }
    })
    ```
