<BlockQuote type="info" label="Note about access tokens">

In version 2 the `useAuth` plugin does not store the `accessToken` in the store, since the Feathers Client
always holds a copy, which can be retrieved asynchronously. See the [useAuth docs](/guide/use-auth#obtaining-the-auth-payload)
to see how to manually store the `accessToken`. Keep in mind that storing your `accessToken` in more places likely
makes it less secure.

</BlockQuote>
