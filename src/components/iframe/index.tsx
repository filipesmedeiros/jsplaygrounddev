import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useContext,
} from 'react';
import { REPLContext } from '../repl';
import cn from 'classnames';

export interface IFrameHandle {
  element: HTMLIFrameElement | null;
  reload(content: { html: string; css: string; js: string }): void;
}

interface Props {
  name: string;
  width?: string | number;
  height?: string | number;
  title: string;
  preScript?: string;
  className?: string;
}

const IFrame = forwardRef<IFrameHandle, Props>(
  (
    { name, width = 'auto', height = 'auto', title, preScript, className },
    ref,
  ) => {
    const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
    const [objectURL, setObjectURL] = useState('');
    const previousObjectURLRef = useRef<string | null>(null);

    useEffect(() => {
      if (previousObjectURLRef.current) {
        URL.revokeObjectURL(previousObjectURLRef.current);
      }

      previousObjectURLRef.current = objectURL;
    }, [objectURL]);

    useImperativeHandle(ref, () => {
      return {
        element: iframe,
        reload({ html, css, js }) {
          const document = renderDocument(html, css, js, {
            preScript,
          });
          const url = URL.createObjectURL(
            new Blob([document], { type: 'text/html' }),
          );
          setObjectURL(url);
        },
      };
    }, [iframe, preScript, setObjectURL]);

    return (
      objectURL && (
        <iframe
          className={cn('bg-white text-black', className)}
          ref={setIframe}
          title={title}
          name={name}
          src={objectURL}
          width={width}
          height={height}
        />
      )
    );
  },
);

IFrame.displayName = 'IFrame';

export default IFrame;

function renderDocument(
  html: string,
  css: string,
  js: string,
  hooks: { preScript?: string } = {},
): string {
  const style = `<style>${css}</style>`;
  const script =
    `<script>window.onerror = function (e) { console.error(e); };</script>` +
    `<script>document.addEventListener("DOMContentLoaded", function () { ${js}; });</script>`;

  if (/<head>[\s\S]*<\/head>/.test(html)) {
    if (hooks.preScript) {
      const pos = html.search('<head>') + '<head>'.length;

      html =
        html.substring(0, pos) +
        `<script>${hooks.preScript}</script>` +
        html.substring(pos);
    }

    const pos = html.search('</head>');

    html = html.substring(0, pos) + style + script + html.substring(pos);
  } else {
    html = style + script + html;

    if (hooks.preScript) {
      html = `<script>${hooks.preScript}</script>` + html;
    }
  }

  if (!/^[\s]*<!.+?>/.test(html)) {
    html = `<!DOCTYPE html>\n${html}`;
  }

  return html;
}
