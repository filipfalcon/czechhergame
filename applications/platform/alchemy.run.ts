import * as Alchemy from 'alchemy';
import * as Cloudflare from '@alchemy.run/cloudflare';
import * as Effect from 'effect/Effect';

export default Alchemy.Stack(
  'Platform',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const platform = yield* Cloudflare.Website.Foldkit('Platform');

    return { urls: platform.urls };
  }),
);
