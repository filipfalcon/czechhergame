import { Effect, Schema } from 'effect';
import { Block } from 'foldkit';
import { defineMessageUnion } from 'foldkit/message';
import { modifyFields } from 'foldkit/struct';

import { Button } from '@foldkit/ui';

import { COUNT_COOKIE } from './cookie';

export const Model = Schema.Struct({
  count: Schema.Int,
  renderedAt: Schema.String,
  renderedOn: Schema.Literals(['Server', 'Client']),
});

export const Flags = Schema.Struct({
  initialCount: Schema.Int,
  renderedAt: Schema.String,
  renderedOn: Schema.Literals(['Server', 'Client']),
});

export const Message = defineMessageUnion({
  ClickedDecrement: {},
  ClickedIncrement: {},
  CompletedPersistCount: {},
});

export const ApplicationDefinition = Block.makeDefinition('Application', {
  Model,
  Message,
});

export const ApplicationComposition = ApplicationDefinition.makeComposition();

export const update = ApplicationComposition.makeUpdate((model, message) =>
  Message.match(message, {
    ClickedDecrement: () => {
      const nextCount = model.count - 1;
      return {
        model: modifyFields(model, { count: () => nextCount }),
        commands: [PersistCount({ count: nextCount })],
      };
    },
    ClickedIncrement: () => {
      const nextCount = model.count + 1;
      return {
        model: modifyFields(model, { count: () => nextCount }),
        commands: [PersistCount({ count: nextCount })],
      };
    },
    CompletedPersistCount: () => ({ model }),
  }),
);

const COUNT_COOKIE_MAX_AGE_SECONDS = 31536000;

export const PersistCount = ApplicationDefinition.makeCommand('PersistCount', {
  args: { count: Schema.Int },
  messages: [Message.CompletedPersistCount],
  handler: function* () {
    return ({ count }) =>
      Effect.try(() => {
        document.cookie = `${COUNT_COOKIE}=${count}; path=/; max-age=${COUNT_COOKIE_MAX_AGE_SECONDS}`;
      }).pipe(
        Effect.map(() => Message.CompletedPersistCount()),
        Effect.orElseSucceed(() => Message.CompletedPersistCount()),
      );
  },
});

export const EffectsLayer = PersistCount.layer;

export const init = ApplicationComposition.makeInit((flags: typeof Flags.Type) => ({
  model: {
    count: flags.initialCount,
    renderedAt: flags.renderedAt,
    renderedOn: flags.renderedOn,
  },
}));

export const view = ApplicationComposition.makeView((model, h) => ({
  title: `Count ${model.count}`,
  body: h.main(
    [],
    [
      h.h1([], ['Server-rendered counter']),
      h.p([h.Id('count')], [model.count.toString()]),
      h.div(
        [],
        [
          Button.view(
            {
              onClick: Message.ClickedDecrement(),
              toView: (attributes) => h.button([...attributes.button], ['-']),
            },
            h,
          ),
          Button.view(
            {
              onClick: Message.ClickedIncrement(),
              toView: (attributes) => h.button([...attributes.button], ['+']),
            },
            h,
          ),
        ],
      ),
      h.p([h.Id('provenance')], [`Rendered on the ${model.renderedOn} at ${model.renderedAt}`]),
      h.p(
        [],
        [
          'The count persists in a cookie. Reload the page and the server ' +
            'renders your latest count into the HTML before any JavaScript runs.',
        ],
      ),
    ],
  ),
}));

const prepare = () =>
  ApplicationComposition.prepareBlock({
    init,
    update,
    view,
    EffectsLayer,
  });
export const ApplicationBlock: Block.FromAssemblyWithView<typeof Model, typeof prepare> =
  Block.assemble(prepare);
