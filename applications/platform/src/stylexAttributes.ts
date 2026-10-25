import * as stylex from '@stylexjs/stylex';

/** A style StyleX compiles, or a list of them, as `stylex.props` takes them. */
export type StyleXStyle = stylex.StyleXArray<
  | null
  | undefined
  | boolean
  | stylex.CompiledStyles
  | readonly [stylex.CompiledStyles, stylex.InlineStyles]
>;

/** What `stylex.props` returns: a class name, inline styles, and in development where each style came from. */
interface StyleXProps {
  readonly className?: string;
  readonly style?: Readonly<Record<string, string | number>>;
  readonly 'data-style-src'?: string;
}

const getStyleXProps: (...styles: ReadonlyArray<StyleXStyle>) => StyleXProps = stylex.props;

/** The attribute builders of Foldkit's `HtmlBuilder` that StyleX's props become. */
interface StyleXHtml<ClassAttribute, StyleAttribute, DataAttribute> {
  readonly Class: (value: string) => ClassAttribute;
  readonly Style: (value: Record<string, string>) => StyleAttribute;
  readonly DataAttribute: (key: string, value: string) => DataAttribute;
}

/**
 * The Foldkit attributes that apply `styles` to an element: StyleX's class name, any inline styles, and in development the data attribute naming where each style came from. Foldkit keeps one class attribute per element, so an element takes all of its styles through one call.
 */
export const getStyleXAttributes = <ClassAttribute, StyleAttribute, DataAttribute>(
  h: StyleXHtml<ClassAttribute, StyleAttribute, DataAttribute>,
  ...styles: ReadonlyArray<StyleXStyle>
): ReadonlyArray<ClassAttribute | StyleAttribute | DataAttribute> => {
  const props = getStyleXProps(...styles);
  const attributes: Array<ClassAttribute | StyleAttribute | DataAttribute> = [];
  if (props.className !== undefined && props.className !== '') {
    attributes.push(h.Class(props.className));
  }
  if (props.style !== undefined) {
    attributes.push(
      h.Style(
        Object.fromEntries(Object.entries(props.style).map(([key, value]) => [key, String(value)])),
      ),
    );
  }
  const source = props['data-style-src'];
  if (source !== undefined && source !== '') {
    attributes.push(h.DataAttribute('style-src', source));
  }
  return attributes;
};
